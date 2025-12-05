import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole, Language, Gender } from '@prisma/client';
import { UpdateUserDto, CreateChildDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    phone: '+77001234567',
    passwordHash: 'hashed-password',
    firstName: 'Тест',
    lastName: 'Пользователь',
    role: UserRole.PARENT,
    language: Language.RU,
    isVerified: false,
    avatarUrl: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChild = {
    id: 'child-uuid',
    firstName: 'Айдар',
    lastName: 'Нурпеисов',
    birthDate: new Date('2015-05-20'),
    gender: Gender.MALE,
    grade: '5',
    schoolName: 'Школа №1',
    parentId: 'user-uuid',
    schoolId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    child: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid');

      expect(result).toHaveProperty('id', 'user-uuid');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      firstName: 'Новое',
      lastName: 'Имя',
    };

    it('should update user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update('user-uuid', updateDto);

      expect(result.firstName).toBe('Новое');
      expect(result.lastName).toBe('Имя');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if phone already exists', async () => {
      const dtoWithPhone: UpdateUserDto = { phone: '+77009999999' };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call - existing user
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // Second call - user with same phone

      await expect(
        service.update('user-uuid', dtoWithPhone),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      await service.remove('user-uuid');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Children Management', () => {
    describe('findChildren', () => {
      it('should return all children for a parent', async () => {
        mockPrismaService.child.findMany.mockResolvedValue([mockChild]);

        const result = await service.findChildren('user-uuid');

        expect(result).toHaveLength(1);
        expect(result[0].firstName).toBe('Айдар');
        expect(mockPrismaService.child.findMany).toHaveBeenCalledWith({
          where: { parentId: 'user-uuid' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('findChild', () => {
      it('should return child by id', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue(mockChild);

        const result = await service.findChild('child-uuid', 'user-uuid');

        expect(result.id).toBe('child-uuid');
      });

      it('should throw NotFoundException if child not found', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue(null);

        await expect(
          service.findChild('non-existent', 'user-uuid'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user is not parent', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue({
          ...mockChild,
          parentId: 'other-parent',
        });

        await expect(
          service.findChild('child-uuid', 'user-uuid'),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('createChild', () => {
      const createChildDto: CreateChildDto = {
        firstName: 'Айдар',
        lastName: 'Нурпеисов',
        birthDate: new Date('2015-05-20'),
        gender: Gender.MALE,
        grade: '5',
        schoolName: 'Школа №1',
      };

      it('should create child successfully', async () => {
        mockPrismaService.child.create.mockResolvedValue(mockChild);

        const result = await service.createChild('user-uuid', createChildDto);

        expect(result.id).toBe('child-uuid');
        expect(result.firstName).toBe('Айдар');
      });
    });

    describe('updateChild', () => {
      it('should update child successfully', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue(mockChild);
        mockPrismaService.child.update.mockResolvedValue({
          ...mockChild,
          grade: '6',
        });

        const result = await service.updateChild('child-uuid', 'user-uuid', {
          grade: '6',
        });

        expect(result.grade).toBe('6');
      });

      it('should throw ForbiddenException if user is not parent', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue({
          ...mockChild,
          parentId: 'other-parent',
        });

        await expect(
          service.updateChild('child-uuid', 'user-uuid', { grade: '6' }),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('removeChild', () => {
      it('should delete child successfully', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue(mockChild);
        mockPrismaService.child.delete.mockResolvedValue(mockChild);

        await service.removeChild('child-uuid', 'user-uuid');

        expect(mockPrismaService.child.delete).toHaveBeenCalledWith({
          where: { id: 'child-uuid' },
        });
      });

      it('should throw ForbiddenException if user is not parent', async () => {
        mockPrismaService.child.findUnique.mockResolvedValue({
          ...mockChild,
          parentId: 'other-parent',
        });

        await expect(
          service.removeChild('child-uuid', 'user-uuid'),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
