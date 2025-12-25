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
    const school = await this.prisma.school.create({
      data: dto,
    });

    this.logger.log(`School created: ${school.name}`);
    return this.mapToResponse(school);
  }

  async findAll(): Promise<SchoolResponseDto[]> {
    const schools = await this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return schools.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<SchoolResponseDto> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
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
      data: dto,
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
        students: {
          include: {
            sessions: {
              include: {
                result: true,
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const totalStudents = school.students.length;
    const totalSessions = school.students.reduce(
      (acc, s) => acc + s.sessions.length,
      0,
    );
    const completedSessions = school.students.reduce(
      (acc, s) => acc + s.sessions.filter((sess) => sess.status === 'COMPLETED').length,
      0,
    );

    // Calculate average score
    let totalScore = 0;
    let scoreCount = 0;
    school.students.forEach((student) => {
      student.sessions.forEach((session) => {
        if (session.result) {
          totalScore += (session.result.totalScore / session.result.maxScore) * 100;
          scoreCount++;
        }
      });
    });

    const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return {
      totalStudents,
      totalTests: totalSessions,
      completedTests: completedSessions,
      averageScore,
      classBreakdown: [], // TODO: Implement class breakdown
    };
  }

  async getClasses(id: string): Promise<any[]> {
    const students = await this.prisma.child.findMany({
      where: { schoolId: id },
      select: { grade: true },
    });

    const classMap = new Map<string, number>();
    students.forEach((s) => {
      if (s.grade) {
        classMap.set(s.grade, (classMap.get(s.grade) || 0) + 1);
      }
    });

    return Array.from(classMap.entries()).map(([grade, count]) => ({
      grade,
      studentCount: count,
    }));
  }

  async addStudent(schoolId: string, dto: AddStudentDto): Promise<any> {
    const child = await this.prisma.child.update({
      where: { id: dto.childId },
      data: {
        schoolId,
        grade: dto.grade,
      },
    });

    return child;
  }

  async importStudents(schoolId: string, students: any[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const student of students) {
      try {
        // Create or update child
        await this.prisma.child.create({
          data: {
            firstName: student.firstName,
            lastName: student.lastName,
            birthDate: new Date(student.birthDate),
            gender: student.gender || 'MALE',
            grade: student.grade,
            schoolId,
            parentId: student.parentId, // This should be linked to parent
          },
        });
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${student.firstName} ${student.lastName}: ${error.message}`);
      }
    }

    return { imported, errors };
  }

  async getReports(schoolId: string, type?: string): Promise<any> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        students: {
          include: {
            sessions: {
              where: { status: 'COMPLETED' },
              include: {
                test: true,
                result: true,
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Generate report data
    const reportData = {
      schoolName: school.name,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: school.students.length,
        totalTests: school.students.reduce((acc, s) => acc + s.sessions.length, 0),
      },
      byCategory: {} as Record<string, { count: number; avgScore: number }>,
      byGrade: {} as Record<string, { count: number; avgScore: number }>,
    };

    // Aggregate by category and grade
    school.students.forEach((student) => {
      student.sessions.forEach((session) => {
        if (session.result) {
          const category = session.test.category;
          const grade = student.grade || 'Unknown';
          const score = (session.result.totalScore / session.result.maxScore) * 100;

          // By category
          if (!reportData.byCategory[category]) {
            reportData.byCategory[category] = { count: 0, avgScore: 0 };
          }
          reportData.byCategory[category].count++;
          reportData.byCategory[category].avgScore += score;

          // By grade
          if (!reportData.byGrade[grade]) {
            reportData.byGrade[grade] = { count: 0, avgScore: 0 };
          }
          reportData.byGrade[grade].count++;
          reportData.byGrade[grade].avgScore += score;
        }
      });
    });

    // Calculate averages
    Object.keys(reportData.byCategory).forEach((cat) => {
      if (reportData.byCategory[cat].count > 0) {
        reportData.byCategory[cat].avgScore = Math.round(
          reportData.byCategory[cat].avgScore / reportData.byCategory[cat].count,
        );
      }
    });

    Object.keys(reportData.byGrade).forEach((grade) => {
      if (reportData.byGrade[grade].count > 0) {
        reportData.byGrade[grade].avgScore = Math.round(
          reportData.byGrade[grade].avgScore / reportData.byGrade[grade].count,
        );
      }
    });

    return reportData;
  }

  private mapToResponse(school: any): SchoolResponseDto {
    return {
      id: school.id,
      name: school.name,
      address: school.address,
      city: school.city,
      region: school.region,
      phone: school.phone,
      email: school.email,
      studentCount: school._count?.students || 0,
      isActive: school.isActive,
      createdAt: school.createdAt,
    };
  }
}
