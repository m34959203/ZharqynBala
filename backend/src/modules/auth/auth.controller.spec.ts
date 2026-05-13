import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { UserRole, Language } from '@prisma/client';

// SEC-CRIT-001: контроллер теперь устанавливает HttpOnly cookies через
// Response.cookie / clearCookie. В тестах мокаем только эти два метода —
// сами cookies в контракт не входят, проверять их в unit-тестах
// избыточно (для этого e2e).
const mockRes = () => ({
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
}) as any;

const mockReq = (refreshToken?: string) => ({
  cookies: refreshToken ? { refreshToken } : {},
}) as any;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse: AuthResponseDto = {
    user: {
      id: 'user-uuid',
      email: 'test@example.com',
      phone: '+77001234567',
      firstName: 'Тест',
      lastName: 'Пользователь',
      role: UserRole.PARENT,
      language: Language.RU,
      avatarUrl: null,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'test') } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'Новый',
        lastName: 'Пользователь',
        role: UserRole.PARENT,
        language: Language.RU,
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto, mockRes());

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockRes());

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshTokenDto = { refreshToken: 'old-refresh-token' };

      mockAuthService.refreshTokens.mockResolvedValue(mockAuthResponse);

      const result = await controller.refresh(
        refreshTokenDto,
        mockReq(refreshTokenDto.refreshToken),
        mockRes(),
      );

      expect(result).toEqual(mockAuthResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const userId = 'user-uuid';

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(userId, mockRes());

      expect(result).toEqual({ message: 'Вы успешно вышли из системы' });
      expect(authService.logout).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMe', () => {
    it('should return current user info', async () => {
      const currentUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        role: UserRole.PARENT,
        firstName: 'Тест',
        lastName: 'Пользователь',
      };

      const result = await controller.getMe(currentUser);

      expect(result).toEqual(currentUser);
    });
  });
});
