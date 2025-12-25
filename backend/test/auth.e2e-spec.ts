import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
  });

  describe('/auth/register (POST)', () => {
    const registerDto = {
      email: 'test-e2e@example.com',
      password: 'Password123!',
      name: 'Test User',
      phone: '+77001234567',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('email', registerDto.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, email: 'invalid-email' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email');
        });
    });

    it('should return 400 for weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, password: '123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('password');
        });
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    const user = {
      email: 'test-e2e-login@example.com',
      password: 'Password123!',
      name: 'Test User',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(user.email);
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-refresh@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      refreshToken = res.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-logout@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      accessToken = res.body.accessToken;
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-me@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      accessToken = res.body.accessToken;
    });

    it('should return current user', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test-e2e-me@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
