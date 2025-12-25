import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolResponseDto,
  AddStudentDto,
  SchoolStatsDto,
} from './dto/school.dto';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSchoolDto): Promise<SchoolResponseDto> {
    // Create a user for the school first
    const user = await this.prisma.user.create({
      data: {
        email: dto.email || `school_${Date.now()}@zharqynbala.kz`,
        passwordHash: 'temp_hash',
        firstName: dto.name,
        lastName: '',
        role: 'SCHOOL',
      },
    });

    const school = await this.prisma.school.create({
      data: {
        userId: user.id,
        schoolName: dto.name,
        address: dto.address || '',
        city: dto.city || '',
        region: dto.region || '',
        contactPerson: dto.name,
        contactPhone: dto.phone || '',
      },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    this.logger.log(`School created: ${school.schoolName}`);
    return this.mapToResponse(school);
  }

  async findAll(): Promise<SchoolResponseDto[]> {
    const schools = await this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    return schools.map((school) => this.mapToResponse(school));
  }

  async findOne(id: string): Promise<SchoolResponseDto> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return this.mapToResponse(school);
  }

  async update(id: string, dto: UpdateSchoolDto): Promise<SchoolResponseDto> {
    const school = await this.prisma.school.update({
      where: { id },
      data: {
        schoolName: dto.name,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        contactPhone: dto.phone,
      },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    return this.mapToResponse(school);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.school.delete({
      where: { id },
    });
  }

  async getStats(id: string): Promise<SchoolStatsDto> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: true,
            groupTests: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Calculate total students across all classes
    const totalStudents = school.classes.reduce(
      (acc, cls) => acc + cls.students.length,
      0,
    );

    // Calculate test stats from groupTests
    const totalTests = school.classes.reduce(
      (acc, cls) => acc + cls.groupTests.reduce((sum, gt) => sum + gt.totalCount, 0),
      0,
    );

    const completedTests = school.classes.reduce(
      (acc, cls) => acc + cls.groupTests.reduce((sum, gt) => sum + gt.completedCount, 0),
      0,
    );

    // Class breakdown
    const classBreakdown = school.classes.map((cls) => ({
      grade: `${cls.grade}${cls.letter}`,
      studentCount: cls.students.length,
      avgScore: 0, // Would need to calculate from results
    }));

    return {
      totalStudents,
      totalTests,
      completedTests,
      averageScore: 0, // Would need to calculate from results
      classBreakdown,
    };
  }

  async getClasses(id: string): Promise<any[]> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school.classes.map((cls) => ({
      id: cls.id,
      grade: cls.grade,
      letter: cls.letter,
      academicYear: cls.academicYear,
      studentCount: cls._count.students,
    }));
  }

  async addStudent(schoolId: string, dto: AddStudentDto): Promise<any> {
    // Find the school and get first class or create one
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { classes: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Get the child
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Update child's school name and grade
    const updatedChild = await this.prisma.child.update({
      where: { id: dto.childId },
      data: {
        schoolName: school.schoolName,
        grade: dto.grade,
      },
    });

    return updatedChild;
  }

  async importStudents(
    schoolId: string,
    students: any[],
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { classes: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    for (const student of students) {
      try {
        // Find or create class
        let schoolClass = school.classes.find(
          (c) => c.grade === parseInt(student.grade) && c.letter === (student.letter || 'А'),
        );

        if (!schoolClass) {
          schoolClass = await this.prisma.schoolClass.create({
            data: {
              schoolId,
              grade: parseInt(student.grade) || 1,
              letter: student.letter || 'А',
              academicYear: new Date().getFullYear().toString(),
            },
          });
        }

        // Create student in school class
        await this.prisma.student.create({
          data: {
            classId: schoolClass.id,
            firstName: student.firstName,
            lastName: student.lastName,
            birthDate: new Date(student.birthDate),
            gender: student.gender || 'MALE',
          },
        });
        imported++;
      } catch (error) {
        errors.push(
          `Failed to import ${student.firstName} ${student.lastName}: ${error.message}`,
        );
      }
    }

    // Update total students count
    const totalStudents = await this.prisma.student.count({
      where: {
        class: {
          schoolId,
        },
      },
    });

    await this.prisma.school.update({
      where: { id: schoolId },
      data: { totalStudents },
    });

    return { imported, errors };
  }

  async getReports(schoolId: string, type?: string): Promise<any> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: true,
            groupTests: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const totalStudents = school.classes.reduce(
      (acc, cls) => acc + cls.students.length,
      0,
    );

    const totalTests = school.classes.reduce(
      (acc, cls) =>
        acc + cls.groupTests.reduce((sum, gt) => sum + gt.completedCount, 0),
      0,
    );

    // Generate report data
    const reportData = {
      schoolName: school.schoolName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents,
        totalTests,
      },
      byClass: school.classes.map((cls) => ({
        className: `${cls.grade}${cls.letter}`,
        studentCount: cls.students.length,
        testsAssigned: cls.groupTests.length,
        testsCompleted: cls.groupTests.reduce(
          (sum, gt) => sum + gt.completedCount,
          0,
        ),
      })),
    };

    return reportData;
  }

  private mapToResponse(school: any): SchoolResponseDto {
    // Calculate student count from classes
    const studentCount = school.classes
      ? school.classes.reduce(
          (acc: number, cls: any) => acc + (cls._count?.students || cls.students?.length || 0),
          0,
        )
      : school.totalStudents || 0;

    return {
      id: school.id,
      name: school.schoolName,
      address: school.address,
      city: school.city,
      region: school.region,
      phone: school.contactPhone,
      email: '', // School model doesn't have email
      studentCount,
      isActive: true, // Schema doesn't have isActive field
      createdAt: school.createdAt,
    };
  }
}
