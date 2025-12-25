import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('ResultsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let childId: string;
  let resultId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get(PrismaService);
    await app.init();

    // Create test user
    const authRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test-e2e-results@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    accessToken = authRes.body.accessToken;
    userId = authRes.body.user.id;

    // Create test child
    const childRes = await request(app.getHttpServer())
      .post('/children')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Child',
        birthDate: '2018-01-15',
        gender: 'MALE',
      });

    childId = childRes.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('/results (GET)', () => {
    it('should return list of results', () => {
      return request(app.getHttpServer())
        .get('/results')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('total');
        });
    });

    it('should filter results by child', () => {
      return request(app.getHttpServer())
        .get(`/results?childId=${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((result: any) => {
            expect(result.childId).toBe(childId);
          });
        });
    });

    it('should filter results by date range', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      return request(app.getHttpServer())
        .get(`/results?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should sort results by date', () => {
      return request(app.getHttpServer())
        .get('/results?sortBy=createdAt&order=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const dates = res.body.data.map((r: any) => new Date(r.createdAt).getTime());
          for (let i = 1; i < dates.length; i++) {
            expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
          }
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/results')
        .expect(401);
    });
  });

  describe('/results/:id (GET)', () => {
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/results')
        .set('Authorization', `Bearer ${accessToken}`);

      if (res.body.data.length > 0) {
        resultId = res.body.data[0].id;
      }
    });

    it('should return result details', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .get(`/results/${resultId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', resultId);
          expect(res.body).toHaveProperty('score');
          expect(res.body).toHaveProperty('recommendations');
        });
    });

    it('should return 404 for non-existent result', () => {
      return request(app.getHttpServer())
        .get('/results/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 for result not belonging to user', async () => {
      if (!resultId) return;

      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user-results@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      return request(app.getHttpServer())
        .get(`/results/${resultId}`)
        .set('Authorization', `Bearer ${otherUserRes.body.accessToken}`)
        .expect(403);
    });
  });

  describe('/results/:id/pdf (GET)', () => {
    it('should generate PDF report', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .get(`/results/${resultId}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /pdf/)
        .expect((res) => {
          expect(res.headers['content-disposition']).toContain('attachment');
        });
    });
  });

  describe('/results/:id/share (POST)', () => {
    it('should generate share link', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .post(`/results/${resultId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('shareUrl');
          expect(res.body).toHaveProperty('expiresAt');
        });
    });

    it('should set expiration for share link', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .post(`/results/${resultId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ expiresIn: '7d' })
        .expect(201)
        .expect((res) => {
          const expiresAt = new Date(res.body.expiresAt);
          const now = new Date();
          const diff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          expect(diff).toBeCloseTo(7, 0);
        });
    });
  });

  describe('/results/compare (GET)', () => {
    it('should compare results for a child', () => {
      return request(app.getHttpServer())
        .get(`/results/compare?childId=${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('comparisons');
          expect(res.body).toHaveProperty('trends');
        });
    });

    it('should compare specific test type', () => {
      return request(app.getHttpServer())
        .get(`/results/compare?childId=${childId}&testType=EMOTIONAL`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('/results/:id/recommendations (GET)', () => {
    it('should return AI recommendations', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .get(`/results/${resultId}/recommendations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('recommendations');
          expect(Array.isArray(res.body.recommendations)).toBe(true);
        });
    });

    it('should regenerate recommendations on demand', () => {
      if (!resultId) return;

      return request(app.getHttpServer())
        .post(`/results/${resultId}/recommendations/regenerate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('recommendations');
        });
    });
  });
});
