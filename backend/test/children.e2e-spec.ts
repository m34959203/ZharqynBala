import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('ChildrenController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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
        email: 'test-e2e-children@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    accessToken = authRes.body.accessToken;
    userId = authRes.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('/children (POST)', () => {
    it('should create a child', () => {
      return request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Child',
          birthDate: '2018-05-15',
          gender: 'MALE',
          grade: '2А',
          school: 'Школа №1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Child');
          expect(res.body.gender).toBe('MALE');
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Incomplete' })
        .expect(400);
    });

    it('should return 400 for invalid birth date', () => {
      return request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Child',
          birthDate: 'invalid-date',
          gender: 'MALE',
        })
        .expect(400);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/children')
        .send({
          name: 'Test Child',
          birthDate: '2018-05-15',
          gender: 'MALE',
        })
        .expect(401);
    });
  });

  describe('/children (GET)', () => {
    beforeAll(async () => {
      // Create test children
      await request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Child 1',
          birthDate: '2017-01-01',
          gender: 'FEMALE',
        });
    });

    it('should return list of user children', () => {
      return request(app.getHttpServer())
        .get('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should not return other users children', async () => {
      // Create another user
      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user-children@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      const otherToken = otherUserRes.body.accessToken;

      // Other user should not see first user's children
      return request(app.getHttpServer())
        .get('/children')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('/children/:id (GET)', () => {
    let childId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Specific Child',
          birthDate: '2019-06-20',
          gender: 'MALE',
        });

      childId = res.body.id;
    });

    it('should return child details', () => {
      return request(app.getHttpServer())
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(childId);
          expect(res.body.name).toBe('Specific Child');
        });
    });

    it('should return 404 for non-existent child', () => {
      return request(app.getHttpServer())
        .get('/children/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 for child not belonging to user', async () => {
      // Create another user
      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user-child-access@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      return request(app.getHttpServer())
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${otherUserRes.body.accessToken}`)
        .expect(403);
    });
  });

  describe('/children/:id (PATCH)', () => {
    let childId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Update Child',
          birthDate: '2018-03-10',
          gender: 'FEMALE',
        });

      childId = res.body.id;
    });

    it('should update child', () => {
      return request(app.getHttpServer())
        .patch(`/children/${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ grade: '3Б', school: 'Новая школа' })
        .expect(200)
        .expect((res) => {
          expect(res.body.grade).toBe('3Б');
          expect(res.body.school).toBe('Новая школа');
        });
    });

    it('should return 403 for child not belonging to user', async () => {
      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user-update@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      return request(app.getHttpServer())
        .patch(`/children/${childId}`)
        .set('Authorization', `Bearer ${otherUserRes.body.accessToken}`)
        .send({ grade: '4В' })
        .expect(403);
    });
  });

  describe('/children/:id (DELETE)', () => {
    let childId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/children')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Delete Child',
          birthDate: '2020-01-01',
          gender: 'MALE',
        });

      childId = res.body.id;
    });

    it('should delete child', () => {
      return request(app.getHttpServer())
        .delete(`/children/${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/children/${childId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      return request(app.getHttpServer())
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 for child not belonging to user', async () => {
      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user-delete@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      return request(app.getHttpServer())
        .delete(`/children/${childId}`)
        .set('Authorization', `Bearer ${otherUserRes.body.accessToken}`)
        .expect(403);
    });
  });
});
