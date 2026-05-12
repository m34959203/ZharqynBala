import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    // Роль: email из ADMIN_EMAILS = ADMIN, все остальные = PARENT
    // Роли PSYCHOLOGIST и SCHOOL назначаются только администратором
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS') || '';
    const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const role = adminEmails.includes(dto.email.toLowerCase()) ? 'ADMIN' : 'PARENT';

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
    this.logger.log('Login attempt');

    // Поиск пользователя
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.logger.log('User not found');
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверка пароля
    const isPasswordValid = await this.comparePasswords(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.log('Login failed');
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерация токенов
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Сохранение refresh token в БД
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Обновляем lastLoginAt — нужно для админ-таблицы пользователей,
    // чтобы видеть кто реально живой. Не блокируем ответ — fire-and-forget.
    this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(err => this.logger.warn(`Failed to update lastLoginAt: ${err.message}`));

    this.logger.log('Login successful');

    return {
      user: this.mapUserToResponse(user),
      ...tokens,
    };
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
   * Request password reset — generates token and logs it (email integration pending)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Если аккаунт существует, инструкции отправлены на email' };
    }

    // Generate secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Save token with 1-hour expiry
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link containing token
    // For now, log the token in non-production environments
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`Password reset token for ${user.email}: ${token}`);
    }

    return { message: 'Если аккаунт существует, инструкции отправлены на email' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Недействительная ссылка для сброса пароля');
    }

    if (resetRecord.usedAt) {
      throw new BadRequestException('Ссылка для сброса пароля уже была использована');
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Срок действия ссылки истёк');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(dto.newPassword);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Пароль успешно изменён' };
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
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
