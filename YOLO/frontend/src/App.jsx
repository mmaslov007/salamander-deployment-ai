import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`
}

function formatSeconds(value) {
  if (!Number.isFinite(value)) return '0.0s'
  return `${value.toFixed(1)}s`
}

function absoluteUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `Request failed with ${res.status}`)
  }
  return res.json()
}

function DetectionBars({ points }) {
  const sampled = useMemo(() => {
    if (!points?.length) return []
    const step = Math.max(1, Math.ceil(points.length / 120))
    return points.filter((_, index) => index % step === 0)
  }, [points])

  if (!sampled.length) {
    return <p className="empty-state">No timeline data yet.</p>
  }

  const maxCount = Math.max(1, ...sampled.map((point) => point.count))
  return (
    <div className="bar-chart" aria-label="Detection count over time">
      {sampled.map((point) => (
        <span
          key={`${point.frame}-${point.time}`}
          title={`${point.time}s: ${point.count} detections`}
          style={{ height: `${Math.max(6, (point.count / maxCount) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function CenterPath({ points, imageSize }) {
  if (!points?.length || !imageSize?.width || !imageSize?.height) {
    return <p className="empty-state">No center coordinates detected yet.</p>
  }

  const sampled = points.filter((_, index) => index % Math.max(1, Math.ceil(points.length / 80)) === 0)
  const pathPoints = sampled.map((point) => `${point.x},${point.y}`).join(' ')
  const last = sampled.at(-1)

  return (
    <svg
      className="path-plot"
      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      role="img"
      aria-label="Best detection center path"
    >
      <rect width={imageSize.width} height={imageSize.height} rx="0" />
      <polyline points={pathPoints} />
      {sampled.map((point, index) => (
        <circle
          key={`${point.frame}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === sampled.length - 1 ? 8 : 4}
        />
      ))}
      {last && <circle className="last-point" cx={last.x} cy={last.y} r="10" />}
    </svg>
  )
}

function App() {
  const [file, setFile] = useState(null)
  const [job, setJob] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [conf, setConf] = useState(0.25)
  const [maxFrames, setMaxFrames] = useState('')

  const isWorking = job?.status === 'queued' || job?.status === 'processing'
  const annotatedVideoUrl = absoluteUrl(job?.annotatedVideoUrl)

  useEffect(() => {
    if (!job?.jobId || job.status === 'done' || job.status === 'error') return undefined

    const interval = window.setInterval(async () => {
      try {
        const nextJob = await fetchJson(`${API_BASE}/api/jobs/${job.jobId}`)
        setJob(nextJob)
        setStatusMessage(nextJob.message || nextJob.status)

        if (nextJob.status === 'done' && nextJob.metricsUrl) {
          setMetrics(await fetchJson(absoluteUrl(nextJob.metricsUrl)))
        }
        if (nextJob.status === 'error') {
          setError(nextJob.message || 'Analysis failed')
        }
      } catch (err) {
        setError(err.message)
        setJob((current) => (
          current ? { ...current, status: 'error', message: err.message } : current
        ))
      }
    }, 2000)

    return () => window.clearInterval(interval)
  }, [job?.jobId, job?.status])

  function setVideoFile(nextFile) {
    setError('')
    setMetrics(null)
    setJob(null)
    if (nextFile && nextFile.type.startsWith('video/')) {
      setFile(nextFile)
    } else if (nextFile) {
      setFile(null)
      setError('Please choose a video file.')
    }
  }

  async function startAnalysis(useSample = false) {
    setError('')
    setMetrics(null)
    setStatusMessage('Submitting analysis job')
    setJob(null)

    const parsedMaxFrames = maxFrames ? Number(maxFrames) : null
    if (parsedMaxFrames !== null && (!Number.isInteger(parsedMaxFrames) || parsedMaxFrames < 1)) {
      setError('Frame limit must be a whole number greater than zero.')
      setStatusMessage('')
      return
    }

    const body = new FormData()
    body.append('conf', String(conf))
    body.append('imgsz', '320')
    body.append('max_det', '1')
    if (parsedMaxFrames) body.append('max_frames', String(parsedMaxFrames))
    if (!useSample) {
      if (!file) {
        setError('Choose a video or use the local ensantina sample.')
        setStatusMessage('')
        return
      }
      body.append('file', file)
    }

    try {
      const endpoint = useSample ? '/api/analyze-sample' : '/api/analyze'
      const nextJob = await fetchJson(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body,
      })
      setJob(nextJob)
    } catch (err) {
      setError(err.message)
      setStatusMessage('')
    }
  }

  const summary = metrics?.summary || job?.summary

  return (
    <main className="app-shell">
      <video className="background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/salamander.mp4" type="video/mp4" />
      </video>
      <div className="background-scrim" aria-hidden="true" />

      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <p className="eyebrow">SalamanderAI</p>
          <h1 id="intro-title">Track Salamanders in Motion</h1>
          <p>
            A focused video workspace for reviewing field footage, detecting salamanders,
            and turning movement into readable analysis.
          </p>
          <a className="scroll-link" href="#analysis-workflow">
            Analyze video
          </a>
        </div>
        <div className="scroll-cue" aria-hidden="true" />
      </section>

      <div id="analysis-workflow" className="workflow-content">
        <section className="workbench">
          <div className="header-row">
            <div className="title-block">
              <p className="eyebrow">SalamanderAI</p>
              <h1>Video Analysis</h1>
            </div>
          </div>

          <div className="layout">
            <section className="control-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Input</p>
                  <h2>Run Setup</h2>
                </div>
                <span>{isWorking ? 'Running' : job?.status === 'done' ? 'Done' : 'Ready'}</span>
              </div>

              <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                  setVideoFile(event.dataTransfer.files[0])
                }}
              >
                <input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={(event) => setVideoFile(event.target.files[0])}
                />
                <label htmlFor="video-file">
                  <span className="drop-mark" aria-hidden="true" />
                  <span className="drop-copy">
                    <strong>{file ? file.name : 'Choose or drop a video'}</strong>
                    <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV, AVI, WEBM, or MKV'}</span>
                  </span>
                </label>
              </div>

              <label className="field">
                <span>Confidence threshold</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.01"
                  value={conf}
                  onChange={(event) => setConf(Number(event.target.value))}
                />
                <output>{conf.toFixed(2)}</output>
              </label>

              <label className="field">
                <span>Frame limit</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Full video"
                  value={maxFrames}
                  onChange={(event) => setMaxFrames(event.target.value)}
                />
              </label>

              <div className="button-row">
                <button type="button" className="primary-action" onClick={() => startAnalysis(false)} disabled={isWorking}>
                  Analyze Upload
                </button>
                <button type="button" className="secondary" onClick={() => startAnalysis(true)} disabled={isWorking}>
                  Analyze ensantina.mp4
                </button>
              </div>

              {(statusMessage || job?.status) && (
                <div className="status-line">
                  <span className={isWorking ? 'spinner' : ''} />
                  {statusMessage || job?.status}
                </div>
              )}
              {error && <div className="error-line">{error}</div>}
            </section>

            <section className="video-panel">
              <div className="video-topbar">
                <span>Output Preview</span>
                <span>{summary ? `${summary.framesWithDetections} visible frames` : 'Idle'}</span>
              </div>
              <div className="video-stage">
                {annotatedVideoUrl ? (
                  <video src={annotatedVideoUrl} controls />
                ) : (
                  <div className="video-placeholder">
                    <strong>Annotated video appears here</strong>
                    <span>Run analysis to generate boxes and metrics.</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="metrics-grid">
          <article className="metric-card detections">
            <span>Total detections</span>
            <strong>{summary?.totalDetections ?? '-'}</strong>
          </article>
          <article className="metric-card rate">
            <span>Detection rate</span>
            <strong>{summary ? pct(summary.detectionRate) : '-'}</strong>
          </article>
          <article className="metric-card time">
            <span>Visible time</span>
            <strong>{summary ? formatSeconds(summary.visibleSeconds) : '-'}</strong>
          </article>
          <article className="metric-card confidence">
            <span>Avg confidence</span>
            <strong>{summary ? pct(summary.averageConfidence) : '-'}</strong>
          </article>
        </section>

        <section className="analysis-grid">
          <div className="analysis-panel">
            <div className="section-heading">
              <h2>Detection Count</h2>
              <span>{metrics?.processedFrameCount ? `${metrics.processedFrameCount} frames` : 'Waiting for data'}</span>
            </div>
            <DetectionBars points={metrics?.series?.detectionCount} />
          </div>

          <div className="analysis-panel">
            <div className="section-heading">
              <h2>Center Path</h2>
              <span>{metrics?.imageSize ? `${metrics.imageSize.width} x ${metrics.imageSize.height}` : 'Video space'}</span>
            </div>
            <CenterPath points={metrics?.series?.bestCenter} imageSize={metrics?.imageSize} />
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
