import request from 'supertest';
import express from 'express';
import router from '../router/routes.js';

const app = express();
app.use(express.json());
app.use('/', router);

describe('API Routes', () => {
  describe('GET /videos', () => {
    it('should return a list of videos', async () => {
      const response = await request(app)
        .get('/videos')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('GET /thumbnail/:filename', () => {
    it('should return 404 for non-existent thumbnail', async () => {
      await request(app)
        .get('/thumbnail/nonexistent.jpg')
        .expect(404);
    });
  });

  describe('POST /process/:filename', () => {
    it('should return 400 for non-existent video', async () => {
      await request(app)
        .post('/process/nonexistent.mp4')
        .expect(400);
    });
  });

  describe('GET /process/:jobId/status', () => {
    it('should return 404 for non-existent job', async () => {
      await request(app)
        .get('/process/nonexistent-job/status')
        .expect(404);
    });
  });
}); 