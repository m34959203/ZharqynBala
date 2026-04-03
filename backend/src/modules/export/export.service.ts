import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async exportUserResults(userId: string): Promise<Buffer> {
    const children = await this.prisma.child.findMany({
      where: { parentId: userId },
      include: {
        testSessions: {
          where: { status: 'COMPLETED' },
          include: { test: true, result: true },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ZharqynBala';
    wb.created = new Date();
    const ws = wb.addWorksheet('Результаты');

    ws.columns = [
      { header: 'Ребёнок', key: 'child', width: 20 },
      { header: 'Тест', key: 'test', width: 35 },
      { header: 'Категория', key: 'category', width: 18 },
      { header: 'Балл', key: 'score', width: 10 },
      { header: 'Макс', key: 'maxScore', width: 10 },
      { header: 'Процент', key: 'percentage', width: 12 },
      { header: 'Интерпретация', key: 'interpretation', width: 40 },
      { header: 'Дата', key: 'date', width: 15 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const child of children) {
      for (const session of child.testSessions) {
        if (!session.result) continue;
        const pct = session.result.maxScore > 0
          ? Math.round((session.result.totalScore / session.result.maxScore) * 100)
          : 0;
        ws.addRow({
          child: `${child.firstName} ${child.lastName}`,
          test: session.test.titleRu,
          category: session.test.category,
          score: session.result.totalScore,
          maxScore: session.result.maxScore,
          percentage: `${pct}%`,
          interpretation: session.result.interpretation,
          date: session.completedAt?.toLocaleDateString('ru-RU') || '',
        });
      }
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async exportChildResults(childId: string): Promise<Buffer> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        testSessions: {
          where: { status: 'COMPLETED' },
          include: { test: true, result: true },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ZharqynBala';
    wb.created = new Date();

    const ws = wb.addWorksheet('Rezultaty');

    // Header styling
    ws.columns = [
      { header: 'Test', key: 'test', width: 35 },
      { header: 'Kategoriya', key: 'category', width: 18 },
      { header: 'Ball', key: 'score', width: 10 },
      { header: 'Maks ball', key: 'maxScore', width: 12 },
      { header: 'Procent', key: 'percentage', width: 12 },
      { header: 'Interpretaciya', key: 'interpretation', width: 40 },
      { header: 'Data', key: 'date', width: 15 },
    ];

    // Style header row
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const session of child?.testSessions || []) {
      if (!session.result) continue;
      const pct = session.result.maxScore > 0
        ? Math.round((session.result.totalScore / session.result.maxScore) * 100)
        : 0;
      ws.addRow({
        test: session.test.titleRu,
        category: session.test.category,
        score: session.result.totalScore,
        maxScore: session.result.maxScore,
        percentage: `${pct}%`,
        interpretation: session.result.interpretation,
        date: session.completedAt?.toLocaleDateString('ru-RU') || '',
      });
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async exportSchoolReport(schoolId: string): Promise<Buffer> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: true,
            groupTests: { include: { test: true } },
          },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ZharqynBala';

    // Classes sheet
    const wsClasses = wb.addWorksheet('Klassy');
    wsClasses.columns = [
      { header: 'Klass', key: 'class', width: 12 },
      { header: 'God', key: 'year', width: 15 },
      { header: 'Uchenikov', key: 'students', width: 12 },
      { header: 'Testov naznacheno', key: 'tests', width: 20 },
    ];
    wsClasses.getRow(1).font = { bold: true };

    for (const cls of school?.classes || []) {
      wsClasses.addRow({
        class: `${cls.grade}${cls.letter}`,
        year: cls.academicYear,
        students: cls.students.length,
        tests: cls.groupTests.length,
      });
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async exportUsers(): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Polzovateli');

    ws.columns = [
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Imya', key: 'name', width: 25 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Aktiven', key: 'active', width: 10 },
      { header: 'Verificirovan', key: 'verified', width: 15 },
      { header: 'Registraciya', key: 'created', width: 15 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const u of users) {
      ws.addRow({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        active: u.isActive ? 'Da' : 'Net',
        verified: u.isVerified ? 'Da' : 'Net',
        created: u.createdAt.toLocaleDateString('ru-RU'),
      });
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async exportPayments(from?: string, to?: string): Promise<Buffer> {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Platezhi');

    ws.columns = [
      { header: 'ID', key: 'id', width: 28 },
      { header: 'Polzovatel', key: 'user', width: 25 },
      { header: 'Summa', key: 'amount', width: 12 },
      { header: 'Valyuta', key: 'currency', width: 8 },
      { header: 'Tip', key: 'type', width: 15 },
      { header: 'Provaider', key: 'provider', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Data', key: 'date', width: 15 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const p of payments) {
      ws.addRow({
        id: p.id,
        user: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.userId,
        amount: p.amount,
        currency: p.currency,
        type: p.paymentType,
        provider: p.provider,
        status: p.status,
        date: p.createdAt.toLocaleDateString('ru-RU'),
      });
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
