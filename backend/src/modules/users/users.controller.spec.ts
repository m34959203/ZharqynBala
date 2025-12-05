import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, Language, Gender } from '@prisma/client';
import { UpdateUserDto, CreateChildDto } from './dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserResponse = {
    id: 'user-uuid',
    email: 'test@example.com',
    phone: '+77001234567',
    firstName: 'Тест',
    lastName: 'Пользователь',
    role: UserRole.PARENT,
    language: Language.RU,
    isVerified: false,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildResponse = {
    id: 'child-uuid',
    firstName: 'Айдар',
    lastName: 'Нурпеисов',
    birthDate: new Date('2015-05-20'),
    gender: Gender.MALE,
    grade: '5',
    schoolName: 'Школа №1',
    parentId: 'user-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findChildren: jest.fn(),
    findChild: jest.fn(),
    createChild: jest.fn(),
    updateChild: jest.fn(),
    removeChild: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.getProfile('user-uuid');

      expect(result).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Новое',
        lastName: 'Имя',
      };
      mockUsersService.update.mockResolvedValue({
        ...mockUserResponse,
        ...updateDto,
      });

      const result = await controller.updateProfile('user-uuid', updateDto);

      expect(result.firstName).toBe('Новое');
      expect(usersService.update).toHaveBeenCalledWith('user-uuid', updateDto);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.deleteAccount('user-uuid');

      expect(usersService.remove).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('Children Management', () => {
    describe('getChildren', () => {
      it('should return list of children', async () => {
        mockUsersService.findChildren.mockResolvedValue([mockChildResponse]);

        const result = await controller.getChildren('user-uuid');

        expect(result).toHaveLength(1);
        expect(result[0].firstName).toBe('Айдар');
      });
    });

    describe('getChild', () => {
      it('should return child by id', async () => {
        mockUsersService.findChild.mockResolvedValue(mockChildResponse);

        const result = await controller.getChild('child-uuid', 'user-uuid');

        expect(result.id).toBe('child-uuid');
      });
    });

    describe('createChild', () => {
      it('should create child profile', async () => {
        const createDto: CreateChildDto = {
          firstName: 'Айдар',
          lastName: 'Нурпеисов',
          birthDate: new Date('2015-05-20'),
          gender: Gender.MALE,
          grade: '5',
          schoolName: 'Школа №1',
        };
        mockUsersService.createChild.mockResolvedValue(mockChildResponse);

        const result = await controller.createChild('user-uuid', createDto);

        expect(result.id).toBe('child-uuid');
        expect(usersService.createChild).toHaveBeenCalledWith(
          'user-uuid',
          createDto,
        );
      });
    });

    describe('updateChild', () => {
      it('should update child profile', async () => {
        const updateDto = { grade: '6' };
        mockUsersService.updateChild.mockResolvedValue({
          ...mockChildResponse,
          grade: '6',
        });

        const result = await controller.updateChild(
          'child-uuid',
          'user-uuid',
          updateDto,
        );

        expect(result.grade).toBe('6');
      });
    });

    describe('removeChild', () => {
      it('should delete child profile', async () => {
        mockUsersService.removeChild.mockResolvedValue(undefined);

        await controller.removeChild('child-uuid', 'user-uuid');

        expect(usersService.removeChild).toHaveBeenCalledWith(
          'child-uuid',
          'user-uuid',
        );
      });
    });
  });
});
