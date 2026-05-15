FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /repo

COPY YOLO/backend/model/requirements.txt YOLO/backend/model/requirements.txt
RUN pip install --no-cache-dir -r YOLO/backend/model/requirements.txt

COPY . .

WORKDIR /repo/YOLO/backend/model

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
