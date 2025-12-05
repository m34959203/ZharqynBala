import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  UserResponseDto,
  CreateChildDto,
  UpdateChildDto,
  ChildResponseDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== USER PROFILE ==========

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  async getProfile(
    @CurrentUser('id') userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль обновлен',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({
    status: 409,
    description: 'Номер телефона уже используется',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить свой аккаунт' })
  @ApiResponse({ status: 204, description: 'Аккаунт успешно удален' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  async deleteAccount(@CurrentUser('id') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }

  // ========== ADMIN ONLY - USER MANAGEMENT ==========

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Получить пользователя по ID' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь найден',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[ADMIN] Удалить пользователя' })
  @ApiResponse({ status: 204, description: 'Пользователь удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  // ========== CHILDREN MANAGEMENT ==========

  @Get('me/children')
  @ApiOperation({ summary: 'Получить список всех детей' })
  @ApiResponse({
    status: 200,
    description: 'Список детей',
    type: [ChildResponseDto],
  })
  async getChildren(
    @CurrentUser('id') userId: string,
  ): Promise<ChildResponseDto[]> {
    return this.usersService.findChildren(userId);
  }

  @Get('me/children/:childId')
  @ApiOperation({ summary: 'Получить профиль ребенка по ID' })
  @ApiResponse({
    status: 200,
    description: 'Профиль ребенка',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ребенок не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этому профилю' })
  async getChild(
    @Param('childId') childId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ChildResponseDto> {
    return this.usersService.findChild(childId, userId);
  }

  @Post('me/children')
  @ApiOperation({ summary: 'Создать профиль ребенка' })
  @ApiResponse({
    status: 201,
    description: 'Профиль ребенка создан',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async createChild(
    @CurrentUser('id') userId: string,
    @Body() createChildDto: CreateChildDto,
  ): Promise<ChildResponseDto> {
    return this.usersService.createChild(userId, createChildDto);
  }

  @Patch('me/children/:childId')
  @ApiOperation({ summary: 'Обновить профиль ребенка' })
  @ApiResponse({
    status: 200,
    description: 'Профиль ребенка обновлен',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ребенок не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этому профилю' })
  async updateChild(
    @Param('childId') childId: string,
    @CurrentUser('id') userId: string,
    @Body() updateChildDto: UpdateChildDto,
  ): Promise<ChildResponseDto> {
    return this.usersService.updateChild(childId, userId, updateChildDto);
  }

  @Delete('me/children/:childId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить профиль ребенка' })
  @ApiResponse({ status: 204, description: 'Профиль ребенка удален' })
  @ApiResponse({ status: 404, description: 'Ребенок не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этому профилю' })
  async removeChild(
    @Param('childId') childId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.usersService.removeChild(childId, userId);
  }
}
