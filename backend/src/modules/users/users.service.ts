import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  UpdateUserDto,
  UserResponseDto,
  CreateChildDto,
  UpdateChildDto,
  ChildResponseDto,
} from './dto';
import { User, Child } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить профиль пользователя по ID
   */
  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Обновить профиль пользователя
   */
  async update(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Проверка существования пользователя
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверка уникальности телефона (если обновляется)
    if (dto.phone && dto.phone !== existingUser.phone) {
      const userWithSamePhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (userWithSamePhone) {
        throw new ConflictException(
          'Пользователь с таким номером телефона уже существует',
        );
      }
    }

    // Обновление пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return this.mapUserToResponse(updatedUser);
  }

  /**
   * Удалить пользователя (мягкое удаление - можно расширить в будущем)
   */
  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // ========== CHILDREN MANAGEMENT ==========

  /**
   * Получить всех детей родителя
   */
  async findChildren(parentId: string): Promise<ChildResponseDto[]> {
    const children = await this.prisma.child.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
    });

    return children.map(this.mapChildToResponse);
  }

  /**
   * Получить ребенка по ID
   */
  async findChild(childId: string, parentId: string): Promise<ChildResponseDto> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Ребенок не найден');
    }

    // Проверка прав доступа (только родитель может видеть своего ребенка)
    if (child.parentId !== parentId) {
      throw new ForbiddenException('У вас нет доступа к этому профилю');
    }

    return this.mapChildToResponse(child);
  }

  /**
   * Создать профиль ребенка
   */
  async createChild(
    parentId: string,
    dto: CreateChildDto,
  ): Promise<ChildResponseDto> {
    const child = await this.prisma.child.create({
      data: {
        ...dto,
        parentId,
      },
    });

    return this.mapChildToResponse(child);
  }

  /**
   * Обновить профиль ребенка
   */
  async updateChild(
    childId: string,
    parentId: string,
    dto: UpdateChildDto,
  ): Promise<ChildResponseDto> {
    // Проверка существования и прав доступа
    const existingChild = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!existingChild) {
      throw new NotFoundException('Ребенок не найден');
    }

    if (existingChild.parentId !== parentId) {
      throw new ForbiddenException('У вас нет доступа к этому профилю');
    }

    // Обновление
    const updatedChild = await this.prisma.child.update({
      where: { id: childId },
      data: dto,
    });

    return this.mapChildToResponse(updatedChild);
  }

  /**
   * Удалить профиль ребенка
   */
  async removeChild(childId: string, parentId: string): Promise<void> {
    // Проверка существования и прав доступа
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Ребенок не найден');
    }

    if (child.parentId !== parentId) {
      throw new ForbiddenException('У вас нет доступа к этому профилю');
    }

    await this.prisma.child.delete({
      where: { id: childId },
    });
  }

  // ========== HELPERS ==========

  /**
   * Маппинг User в UserResponseDto
   */
  private mapUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      language: user.language,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Маппинг Child в ChildResponseDto
   */
  private mapChildToResponse(child: Child): ChildResponseDto {
    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      birthDate: child.birthDate,
      gender: child.gender,
      grade: child.grade,
      schoolName: child.schoolName,
      parentId: child.parentId,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    };
  }
}
