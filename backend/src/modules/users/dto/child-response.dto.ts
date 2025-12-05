import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class ChildResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID ребенка' })
  id: string;

  @ApiProperty({ example: 'Айдар', description: 'Имя' })
  firstName: string;

  @ApiProperty({ example: 'Нурпеисов', description: 'Фамилия' })
  lastName: string;

  @ApiProperty({
    example: '2015-05-20T00:00:00.000Z',
    description: 'Дата рождения',
  })
  birthDate: Date;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Пол',
  })
  gender: Gender;

  @ApiPropertyOptional({
    example: 5,
    description: 'Класс',
    nullable: true,
  })
  grade: string | null;

  @ApiPropertyOptional({
    example: 'Школа №1',
    description: 'Название школы',
    nullable: true,
  })
  schoolName: string | null;

  @ApiProperty({ example: 'parent-uuid', description: 'ID родителя' })
  parentId: string;

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
