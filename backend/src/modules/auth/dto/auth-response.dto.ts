import { ApiProperty } from '@nestjs/swagger';
import { UserRole, Language } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID пользователя' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({ example: '+77001234567', description: 'Телефон', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'Асем', description: 'Имя' })
  firstName: string;

  @ApiProperty({ example: 'Нурпеисова', description: 'Фамилия' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PARENT, description: 'Роль' })
  role: UserRole;

  @ApiProperty({ enum: Language, example: Language.RU, description: 'Язык' })
  language: Language;

  @ApiProperty({ example: false, description: 'Email подтвержден' })
  isVerified: boolean;

  @ApiProperty({ example: '2025-12-05T12:00:00.000Z', description: 'Дата создания' })
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Информация о пользователе',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (срок жизни: 15 минут)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token (срок жизни: 7 дней)',
  })
  refreshToken: string;
}
