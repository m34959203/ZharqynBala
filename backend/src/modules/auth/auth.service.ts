import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Регистрация нового пользователя
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Проверка существования пользователя по email
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Проверка существования пользователя по телефону (если указан)
    if (dto.phone) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existingUserByPhone) {
        throw new ConflictException(
          'Пользователь с таким номером телефона уже существует',
        );
      }
    }

    // Хеширование пароля
    const passwordHash = await this.hashPassword(dto.password);

    // Определение роли: admin@jarkinbala.kz автоматически получает роль ADMIN
    const adminEmails = ['admin@jarkinbala.kz', 'admin@zharqynbala.kz'];
    const role = adminEmails.includes(dto.email.toLowerCase())
      ? 'ADMIN'
      : dto.role || 'PARENT';

    // Создание пользователя
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
        language: dto.language || 'RU',
        isVerified: false,
      },
    });

    // Генерация токенов
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Сохранение refresh token в БД
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.mapUserToResponse(user),
      ...tokens,
    };
  }

  /**
   * Вход пользователя
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    console.log('[AuthService:login] ========== Login attempt ==========');
    console.log('[AuthService:login] Email:', dto.email);

    // Поиск пользователя
    console.log('[AuthService:login] Looking up user in database...');
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      console.error('[AuthService:login] User NOT FOUND for email:', dto.email);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    console.log('[AuthService:login] User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.passwordHash,
    });

    // Проверка пароля
    console.log('[AuthService:login] Comparing passwords...');
    const isPasswordValid = await this.comparePasswords(
      dto.password,
      user.passwordHash,
    );

    console.log('[AuthService:login] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.error('[AuthService:login] Password INVALID for user:', dto.email);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерация токенов
    console.log('[AuthService:login] Generating tokens...');
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    console.log('[AuthService:login] Tokens generated successfully');

    // Сохранение refresh token в БД
    console.log('[AuthService:login] Saving refresh token...');
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    console.log('[AuthService:login] Refresh token saved');

    const response = {
      user: this.mapUserToResponse(user),
      ...tokens,
    };

    console.log('[AuthService:login] ========== Login SUCCESS ==========');
    console.log('[AuthService:login] Response user:', response.user);
    console.log('[AuthService:login] Has accessToken:', !!response.accessToken);
    console.log('[AuthService:login] Has refreshToken:', !!response.refreshToken);

    return response;
  }

  /**
   * Обновление access token через refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Верификация refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Поиск пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      // Проверка, что refresh token совпадает с сохраненным
      const isRefreshTokenValid = await this.comparePasswords(
        refreshToken,
        user.refreshToken || '',
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Невалидный refresh token');
      }

      // Генерация новых токенов
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Сохранение нового refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: this.mapUserToResponse(user),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Невалидный refresh token');
    }
  }

  /**
   * Выход (удаление refresh token)
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Валидация пользователя (для Passport strategies)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Хеширование пароля
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Сравнение паролей
   */
  private async comparePasswords(
    plainText: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }

  /**
   * Генерация JWT токенов (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Сохранение refresh token в БД (хешированный)
   */
  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  /**
   * Маппинг User в UserResponseDto
   */
  private mapUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      language: user.language,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
