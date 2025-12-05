import {
  IsString,
  IsDate,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class CreateChildDto {
  @ApiProperty({ example: 'Айдар', description: 'Имя ребенка' })
  @IsString()
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  firstName: string;

  @ApiProperty({ example: 'Нурпеисов', description: 'Фамилия ребенка' })
  @IsString()
  @MinLength(2, { message: 'Фамилия должна быть не менее 2 символов' })
  @MaxLength(50, { message: 'Фамилия не должна превышать 50 символов' })
  lastName: string;

  @ApiProperty({
    example: '2015-05-20',
    description: 'Дата рождения ребенка',
    type: String,
  })
  @Type(() => Date)
  @IsDate({ message: 'Некорректная дата рождения' })
  birthDate: Date;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Пол ребенка',
  })
  @IsEnum(Gender, { message: 'Некорректный пол' })
  gender: Gender;

  @ApiPropertyOptional({
    example: 5,
    description: 'Класс в школе (опционально)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({
    example: 'Школа №1',
    description: 'Название школы (опционально)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  schoolName?: string;
}
