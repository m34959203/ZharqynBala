import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Пароль пользователя',
  })
  @IsString()
  @MinLength(1, { message: 'Пароль не может быть пустым' })
  password: string;
}
