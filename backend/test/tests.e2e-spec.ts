import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('TestsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let childId: string;
  let testId: string;

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
        email: 'test-e2e-tests@example.com',
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

  describe('/tests (GET)', () => {
    it('should return list of tests', () => {
      return request(app.getHttpServer())
        .get('/tests')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
        });
    });

    it('should filter tests by category', () => {
      return request(app.getHttpServer())
        .get('/tests?category=EMOTIONAL')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((test: any) => {
            expect(test.category).toBe('EMOTIONAL');
          });
        });
    });

    it('should filter tests by age range', () => {
      return request(app.getHttpServer())
        .get('/tests?minAge=6&maxAge=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((test: any) => {
            expect(test.minAge).toBeLessThanOrEqual(10);
            expect(test.maxAge).toBeGreaterThanOrEqual(6);
          });
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/tests?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeLessThanOrEqual(5);
          expect(res.body.page).toBe(1);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/tests')
        .expect(401);
    });
  });

  describe('/tests/:id (GET)', () => {
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/tests')
        .set('Authorization', `Bearer ${accessToken}`);

      if (res.body.data.length > 0) {
        testId = res.body.data[0].id;
      }
    });

    it('should return test details with questions', () => {
      if (!testId) return;

      return request(app.getHttpServer())
        .get(`/tests/${testId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('questions');
          expect(Array.isArray(res.body.questions)).toBe(true);
        });
    });

    it('should return 404 for non-existent test', () => {
      return request(app.getHttpServer())
        .get('/tests/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/tests/:id/start (POST)', () => {
    it('should start a test session', () => {
      if (!testId || !childId) return;

      return request(app.getHttpServer())
        .post(`/tests/${testId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ childId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body).toHaveProperty('testId', testId);
          expect(res.body).toHaveProperty('status', 'IN_PROGRESS');
        });
    });

    it('should return 400 without childId', () => {
      if (!testId) return;

      return request(app.getHttpServer())
        .post(`/tests/${testId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should return 403 for child not belonging to user', () => {
      if (!testId) return;

      return request(app.getHttpServer())
        .post(`/tests/${testId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ childId: 'other-user-child-id' })
        .expect(403);
    });
  });

  describe('/tests/sessions/:sessionId/answer (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      if (!testId || !childId) return;

      const res = await request(app.getHttpServer())
        .post(`/tests/${testId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ childId });

      sessionId = res.body.sessionId;
    });

    it('should submit answer', () => {
      if (!sessionId) return;

      return request(app.getHttpServer())
        .post(`/tests/sessions/${sessionId}/answer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          questionId: 'question-1',
          answerId: 'answer-1',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('progress');
        });
    });

    it('should return 400 for invalid answer', () => {
      if (!sessionId) return;

      return request(app.getHttpServer())
        .post(`/tests/sessions/${sessionId}/answer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('/tests/sessions/:sessionId/complete (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      if (!testId || !childId) return;

      const res = await request(app.getHttpServer())
        .post(`/tests/${testId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ childId });

      sessionId = res.body.sessionId;
    });

    it('should complete test session and return result', () => {
      if (!sessionId) return;

      return request(app.getHttpServer())
        .post(`/tests/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('resultId');
          expect(res.body).toHaveProperty('score');
          expect(res.body).toHaveProperty('status', 'COMPLETED');
        });
    });
  });
});
