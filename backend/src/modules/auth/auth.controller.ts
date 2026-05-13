import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';

// SEC-CRIT-001: HttpOnly cookies для access/refresh токенов.
// Опции единые на login/register/refresh — secure только в production
// (HTTPS), sameSite=lax чтобы навигация (включая social-login redirect)
// тащила куку обратно. Длительность совпадает с JWT_*_EXPIRES_IN.
const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15m default
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7d default

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private cookieOptions() {
    const isProd = (this.configService.get<string>('NODE_ENV') ?? '') === 'production';
    // SameSite=None требуется, когда фронт и API живут на разных origin'ах
    // (например, оба под *.trycloudflare.com — public suffix → cross-site).
    // Lax — дефолт для same-site / single-domain deploy. Strict — параноид.
    const raw = (this.configService.get<string>('COOKIE_SAMESITE') ?? 'lax').toLowerCase();
    const sameSite: 'lax' | 'none' | 'strict' =
      raw === 'none' ? 'none' : raw === 'strict' ? 'strict' : 'lax';
    // SameSite=None обязательно требует Secure (HTTPS). Если у нас не prod,
    // включаем Secure всё равно — иначе браузер откажется ставить куку.
    const secure = isProd || sameSite === 'none';
    return {
      httpOnly: true as const,
      secure,
      sameSite,
      path: '/',
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const base = this.cookieOptions();
    res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_MAX_AGE_MS });
    res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_MAX_AGE_MS });
  }

  private clearAuthCookies(res: Response) {
    const base = this.cookieOptions();
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email или телефоном уже существует',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для регистрации',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный email или пароль',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление access token через refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Невалидный refresh token',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    // Приоритет: cookie (HttpOnly), fallback на body (Swagger/legacy).
    const token = req.cookies?.[REFRESH_COOKIE] || dto.refreshToken;
    if (!token) {
      throw new (await import('@nestjs/common')).UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refreshTokens(token);
    // Rotation: новый refresh кладём в cookie, старый перетирается.
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный выход',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется авторизация',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId);
    this.clearAuthCookies(res);
    return { message: 'Вы успешно вышли из системы' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
  @ApiResponse({
    status: 200,
    description: 'Информация о пользователе',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется авторизация',
  })
  async getMe(@CurrentUser() user: CurrentUserData) {
    return user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset instructions sent' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
