import { useState } from 'react'
import './App.css'

function App() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) setUploadedFile(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setUploadedFile(file)
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🦎</span>
          <span className="brand-name">SalamanderAI</span>
        </div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#analyze">Analyze</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </nav>

      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/salamander.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Track Salamanders<br />with AI Precision</h1>
          <p className="hero-sub">
            Upload an image and let our model identify the species, log the habitat,
            and monitor population trends — all in real time.
          </p>
          <a href="#analyze" className="cta-btn">Start Analyzing</a>
        </div>
      </section>

      <section id="features" className="features">
        <h2>What SalamanderAI Does</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <h3>Species Detection</h3>
            <p>
              Instantly identify salamander species from photos using a computer
              vision model trained on 40+ North American and European species.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📍</span>
            <h3>Habitat Mapping</h3>
            <p>
              Log sightings with GPS metadata and visualize population density
              across regions on an interactive map.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3>Population Trends</h3>
            <p>
              Track species health over time with AI-generated trend reports and
              conservation risk scores updated weekly.
            </p>
          </div>
        </div>
      </section>

      <section id="analyze" className="upload-section">
        <h2>Analyze a Sighting</h2>
        <p className="upload-sub">
          Drop an image of a salamander and our model will identify the species
          and log the observation.
        </p>
        <div
          className={`dropzone${isDragging ? ' dragging' : ''}${uploadedFile ? ' has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          {uploadedFile ? (
            <>
              <span className="dz-icon">✅</span>
              <p className="dz-label">{uploadedFile.name}</p>
              <p className="dz-sub">Ready for analysis</p>
            </>
          ) : (
            <>
              <span className="dz-icon">📷</span>
              <p className="dz-label">Drag &amp; drop an image here</p>
              <p className="dz-sub">or click to browse — JPG, PNG, WEBP</p>
            </>
          )}
          <input
            id="file-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {uploadedFile && (
          <button className="analyze-btn" onClick={() => alert('AI analysis coming soon!')}>
            Run Analysis
          </button>
        )}
      </section>

      <footer id="about" className="footer">
        <span className="brand-icon">🦎</span>
        <p>SalamanderAI — Built for conservation science.</p>
        <p className="footer-sub">SDEV 372 Project</p>
      </footer>
    </>
  )
}

export default App
