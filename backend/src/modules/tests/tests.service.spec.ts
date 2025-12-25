import { Test, TestingModule } from '@nestjs/testing';
import { TestsService } from './tests.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TestsService', () => {
  let service: TestsService;
  let prisma: PrismaService;

  const mockPrisma = {
    test: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    testSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    child: {
      findUnique: jest.fn(),
    },
    answer: {
      create: jest.fn(),
    },
    result: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TestsService>(TestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active tests', async () => {
      const mockTests = [
        { id: '1', titleRu: 'Test 1', category: 'ANXIETY', isActive: true },
        { id: '2', titleRu: 'Test 2', category: 'MOTIVATION', isActive: true },
      ];

      mockPrisma.test.findMany.mockResolvedValue(mockTests);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(mockPrisma.test.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it('should filter tests by category', async () => {
      const mockTests = [
        { id: '1', titleRu: 'Anxiety Test', category: 'ANXIETY', isActive: true },
      ];

      mockPrisma.test.findMany.mockResolvedValue(mockTests);

      const result = await service.findAll({ category: 'ANXIETY' });

      expect(result).toHaveLength(1);
      expect(mockPrisma.test.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'ANXIETY' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return test with questions', async () => {
      const mockTest = {
        id: '1',
        titleRu: 'Test 1',
        questions: [
          { id: 'q1', questionTextRu: 'Question 1' },
        ],
      };

      mockPrisma.test.findUnique.mockResolvedValue(mockTest);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if test not found', async () => {
      mockPrisma.test.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startTest', () => {
    const mockUser = { id: 'user1' };
    const mockChild = { id: 'child1', parentId: 'user1', birthDate: new Date('2015-01-01') };
    const mockTest = {
      id: 'test1',
      ageMin: 5,
      ageMax: 15,
      isPremium: false,
      questions: [{ id: 'q1' }],
    };

    it('should create a test session', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(mockChild);
      mockPrisma.test.findUnique.mockResolvedValue(mockTest);
      mockPrisma.testSession.create.mockResolvedValue({
        id: 'session1',
        testId: 'test1',
        childId: 'child1',
        status: 'IN_PROGRESS',
      });

      const result = await service.startTest('test1', 'user1', { childId: 'child1' });

      expect(result).toBeDefined();
      expect(mockPrisma.testSession.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if child does not belong to user', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        ...mockChild,
        parentId: 'otherUser',
      });

      await expect(
        service.startTest('test1', 'user1', { childId: 'child1' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
