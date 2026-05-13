import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  // SEC-CRIT-001: первичный источник — HttpOnly cookie `refreshToken`;
  // поле здесь оставлено для Swagger/dev-вызовов и не обязательно.
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh Token (опционально — обычно берётся из HttpOnly cookie)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
