import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Асем', description: 'Имя пользователя' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Нурпеисова',
    description: 'Фамилия пользователя',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Фамилия должна быть не менее 2 символов' })
  @MaxLength(50, { message: 'Фамилия не должна превышать 50 символов' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+77001234567',
    description: 'Номер телефона',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Номер телефона должен быть в формате +7XXXXXXXXXX',
  })
  phone?: string;

  @ApiPropertyOptional({
    enum: Language,
    example: Language.RU,
    description: 'Язык интерфейса',
  })
  @IsOptional()
  @IsEnum(Language, { message: 'Некорректный язык' })
  language?: Language;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL аватара пользователя',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
