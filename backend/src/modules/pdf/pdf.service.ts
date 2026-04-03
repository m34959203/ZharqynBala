import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateResultPdf(resultId: string): Promise<Buffer> {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        session: {
          include: {
            test: true,
            child: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return this.createPdfBuffer((doc) => {
      // Header
      doc.font('Bold').fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Результат психологического теста', { align: 'center' });
      doc.moveDown(1);

      // Child info
      doc.font('Regular').fontSize(12);
      const child = result.session.child;
      const test = result.session.test;
      doc.text(`Тест: ${test.titleRu}`);
      doc.text(`Ребёнок: ${child.firstName} ${child.lastName}`);
      doc.text(`Дата: ${result.createdAt.toLocaleDateString('ru-RU')}`);
      doc.moveDown(1);

      // Score
      doc.font('Bold').fontSize(14).text('Результат', { underline: true });
      doc.moveDown(0.5);
      doc.font('Regular').fontSize(12);
      const percentage = result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;
      doc.text(`Балл: ${result.totalScore} / ${result.maxScore} (${percentage}%)`);
      doc.moveDown(1);

      // Interpretation
      doc.font('Bold').fontSize(14).text('Интерпретация', { underline: true });
      doc.moveDown(0.5);
      doc.font('Regular').fontSize(11).text(result.interpretation || 'Нет интерпретации', {
        width: 450,
        align: 'left',
      });
      doc.moveDown(1);

      // Recommendations
      doc.font('Bold').fontSize(14).text('Рекомендации', { underline: true });
      doc.moveDown(0.5);
      doc.font('Regular').fontSize(11).text(result.recommendations || 'Нет рекомендаций', {
        width: 450,
        align: 'left',
      });

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888888');
      doc.text('ZharqynBala — платформа психологического здоровья детей', { align: 'center' });
      doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
    });
  }

  async generateChildReportPdf(childId: string): Promise<Buffer> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        testSessions: {
          where: { status: 'COMPLETED' },
          include: {
            test: true,
            result: true,
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return this.createPdfBuffer((doc) => {
      doc.font('Bold').fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Отчёт о прогрессе ребёнка', { align: 'center' });
      doc.moveDown(1);

      doc.font('Regular').fontSize(12);
      doc.text(`Ребёнок: ${child.firstName} ${child.lastName}`);
      doc.text(`Дата рождения: ${child.birthDate.toLocaleDateString('ru-RU')}`);
      if (child.schoolName) doc.text(`Школа: ${child.schoolName}`);
      if (child.grade) doc.text(`Класс: ${child.grade}`);
      doc.text(`Всего тестов пройдено: ${child.testSessions.length}`);
      doc.moveDown(1);

      doc.font('Bold').fontSize(14).text('Результаты тестов', { underline: true });
      doc.moveDown(0.5);

      for (const session of child.testSessions) {
        if (!session.result) continue;
        const pct = session.result.maxScore > 0
          ? Math.round((session.result.totalScore / session.result.maxScore) * 100)
          : 0;
        doc.font('Regular').fontSize(11);
        doc.text(`${session.test.titleRu} - ${pct}% (${session.completedAt?.toLocaleDateString('ru-RU') || 'N/A'})`);
        if (session.result.interpretation) {
          doc.fontSize(10).fillColor('#555555').text(`  ${session.result.interpretation}`);
          doc.fillColor('#000000');
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(2);
      doc.font('Regular').fontSize(9).fillColor('#888888');
      doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
    });
  }

  async generateSchoolReportPdf(schoolId: string): Promise<Buffer> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: true,
            groupTests: {
              include: { test: true },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return this.createPdfBuffer((doc) => {
      doc.font('Bold').fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Отчёт для школы', { align: 'center' });
      doc.moveDown(1);

      doc.font('Regular').fontSize(12);
      doc.text(`Школа: ${school.schoolName}`);
      doc.text(`Регион: ${school.region || 'N/A'}, Город: ${school.city || 'N/A'}`);
      doc.text(`Классов: ${school.classes.length}`);
      const totalStudents = school.classes.reduce((sum, c) => sum + c.students.length, 0);
      doc.text(`Учеников: ${totalStudents}`);
      doc.moveDown(1);

      doc.font('Bold').fontSize(14).text('Классы', { underline: true });
      doc.moveDown(0.5);

      for (const cls of school.classes) {
        doc.font('Regular').fontSize(12).text(`${cls.grade}${cls.letter} (${cls.academicYear}) - ${cls.students.length} учеников`);
        if (cls.groupTests.length > 0) {
          for (const gt of cls.groupTests) {
            doc.fontSize(10).fillColor('#555555')
              .text(`  Тест: ${gt.test.titleRu} — Завершено: ${gt.completedCount}/${gt.totalCount}`);
          }
          doc.fillColor('#000000');
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(2);
      doc.font('Regular').fontSize(9).fillColor('#888888');
      doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
    });
  }

  private createPdfBuffer(buildFn: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'ZharqynBala Report',
          Author: 'ZharqynBala Platform',
        },
      });

      // Register Cyrillic-capable fonts
      const fontPath = path.join(__dirname, '..', '..', '..', 'assets', 'fonts');
      const regularFont = path.join(fontPath, 'DejaVuSans.ttf');
      const boldFont = path.join(fontPath, 'DejaVuSans-Bold.ttf');

      if (fs.existsSync(regularFont)) {
        doc.registerFont('Regular', regularFont);
        doc.registerFont('Bold', boldFont);
        doc.font('Regular');
      } else {
        this.logger.warn(`Cyrillic fonts not found at ${fontPath}, falling back to Helvetica`);
      }

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      buildFn(doc);
      doc.end();
    });
  }
}
