# Code Style Guide

**Product:** ZharqynBala
**Date:** 2026-04-02

---

## 1. General Rules

- **Language:** TypeScript (strict mode) for all code
- **Formatting:** Prettier (auto-format on save)
- **Linting:** ESLint (zero errors, zero warnings)
- **Indent:** 2 spaces (no tabs)
- **Quotes:** Single quotes
- **Semicolons:** Yes
- **Line width:** 100 characters max
- **Trailing commas:** Always (ES5 style)
- **File encoding:** UTF-8
- **Line endings:** LF (Unix)

---

## 2. Naming Conventions

| Entity | Convention | Example |
|--------|----------|---------|
| Files (backend) | kebab-case | `auth.service.ts`, `create-user.dto.ts` |
| Files (frontend) | PascalCase for components, kebab-case for utils | `TestCard.tsx`, `api.ts` |
| Classes | PascalCase | `AuthService`, `CreateUserDto` |
| Interfaces | PascalCase (no `I` prefix) | `User`, `TestSession` |
| Functions | camelCase | `calculateScore`, `findAllTests` |
| Variables | camelCase | `accessToken`, `totalScore` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_PAGE_SIZE` |
| Enums | PascalCase (members: UPPER_SNAKE_CASE) | `UserRole.PARENT` |
| Database tables | snake_case (Prisma maps automatically) | `test_sessions`, `answer_options` |
| Database columns | snake_case | `first_name`, `created_at` |
| API paths | kebab-case | `/patient-notes`, `/cleanup-demo` |
| Environment vars | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

---

## 3. Backend Patterns

### 3.1 Module Structure

```typescript
// feature.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

### 3.2 Controller Pattern

```typescript
// feature.controller.ts
@ApiTags('feature')
@Controller('feature')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all features' })
  @ApiResponse({ status: 200, description: 'Features list' })
  async findAll(@CurrentUser() user: User) {
    return this.featureService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create feature' })
  @ApiResponse({ status: 201, description: 'Feature created' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFeatureDto,
  ) {
    return this.featureService.create(user.id, dto);
  }
}
```

### 3.3 Service Pattern

```typescript
// feature.service.ts
@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.feature.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateFeatureDto) {
    this.logger.log(`Creating feature for user ${userId}`);
    return this.prisma.feature.create({
      data: { ...dto, userId },
    });
  }
}
```

### 3.4 DTO Pattern

```typescript
// dto/create-feature.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ description: 'Feature title in Russian' })
  @IsString()
  titleRu: string;

  @ApiProperty({ description: 'Feature title in Kazakh' })
  @IsString()
  titleKz: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  order?: number;
}
```

### 3.5 Logging

```typescript
// DO: Use NestJS Logger
private readonly logger = new Logger(MyService.name);
this.logger.log('Operation completed');
this.logger.warn('Unusual condition');
this.logger.error('Operation failed', error.stack);

// DON'T: Use console.log
console.log('something'); // NEVER in production code
```

---

## 4. Frontend Patterns

### 4.1 Page Component

```typescript
// app/(protected)/feature/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui';

export default function FeaturePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feature')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Feature</h1>
      {/* content */}
    </div>
  );
}
```

### 4.2 Component Pattern

```typescript
// components/feature/FeatureCard.tsx
interface FeatureCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

export function FeatureCard({ title, description, onClick }: FeatureCardProps) {
  return (
    <div
      className="rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
  );
}
```

### 4.3 API Calls

```typescript
// Always use lib/api.ts client (handles auth tokens automatically)
import { api } from '@/lib/api';

// GET
const response = await api.get('/tests');

// POST
const response = await api.post('/tests/session-id/answer', {
  questionId: '...',
  answerOptionId: '...',
});

// Error handling
try {
  const response = await api.post('/auth/login', credentials);
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
}
```

---

## 5. Bilingual Content

All user-facing text must support Russian (RU) and Kazakh (KZ).

### Database fields

```prisma
model Test {
  titleRu       String
  titleKz       String
  descriptionRu String
  descriptionKz String
}
```

### Display logic

```typescript
// Use user's language preference
const title = user.language === 'KZ' ? test.titleKz : test.titleRu;
```

---

## 6. Error Handling

### Backend

```typescript
// Use NestJS built-in exceptions
throw new NotFoundException('Test not found');
throw new BadRequestException('Child age is out of range');
throw new ForbiddenException('Insufficient permissions');
throw new ConflictException('Email already registered');
throw new UnauthorizedException('Invalid credentials');

// For unexpected errors, let the global exception filter handle them
// Don't catch and re-throw without adding information
```

### Frontend

```typescript
// Show user-friendly messages
try {
  await api.post('/consultations', data);
  toast.success('Консультация забронирована');
} catch (error) {
  const message = error.response?.data?.message || 'Произошла ошибка';
  toast.error(message);
}
```

---

## 7. Security Rules

1. **Never** commit `.env` files or secrets
2. **Never** use `console.log` for sensitive data (tokens, passwords, emails)
3. **Always** use Prisma ORM (no raw SQL)
4. **Always** validate inputs with DTOs + class-validator
5. **Always** guard endpoints with `@UseGuards` or `@Public()`
6. **Always** set `httpOnly: true` for auth cookies
7. **Never** expose development endpoints in production
8. **Never** hardcode credentials or admin emails
