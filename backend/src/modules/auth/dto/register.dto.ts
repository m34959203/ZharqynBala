import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Language } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiPropertyOptional({
    example: '+77001234567',
    description: 'Номер телефона (опционально)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Номер телефона должен быть в формате +7XXXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Пароль (минимум 8 символов, должен содержать буквы и цифры)',
  })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
  @MaxLength(128, { message: 'Пароль не должен превышать 128 символов' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум одну букву и одну цифру',
  })
  password: string;

  @ApiProperty({ example: 'Асем', description: 'Имя пользователя' })
  @IsString()
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  firstName: string;

  @ApiProperty({ example: 'Нурпеисова', description: 'Фамилия пользователя' })
  @IsString()
  @MinLength(2, { message: 'Фамилия должна быть не менее 2 символов' })
  @MaxLength(50, { message: 'Фамилия не должна превышать 50 символов' })
  lastName: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.PARENT,
    description: 'Роль пользователя (по умолчанию PARENT)',
    default: UserRole.PARENT,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Некорректная роль пользователя' })
  role?: UserRole;

  @ApiPropertyOptional({
    enum: Language,
    example: Language.RU,
    description: 'Язык интерфейса (по умолчанию RU)',
    default: Language.RU,
  })
  @IsOptional()
  @IsEnum(Language, { message: 'Некорректный язык' })
  language?: Language;
}
