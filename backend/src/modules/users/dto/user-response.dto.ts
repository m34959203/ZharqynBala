import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Language } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID пользователя' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiPropertyOptional({
    example: '+77001234567',
    description: 'Телефон',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({ example: 'Асем', description: 'Имя' })
  firstName: string;

  @ApiProperty({ example: 'Нурпеисова', description: 'Фамилия' })
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PARENT,
    description: 'Роль',
  })
  role: UserRole;

  @ApiProperty({
    enum: Language,
    example: Language.RU,
    description: 'Язык интерфейса',
  })
  language: Language;

  @ApiProperty({ example: false, description: 'Email подтвержден' })
  isVerified: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL аватара',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: '2025-12-05T12:00:00.000Z',
    description: 'Дата создания',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-12-05T12:00:00.000Z',
    description: 'Дата обновления',
  })
  updatedAt: Date;
}
