import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

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
      doc.fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Rezultat psihologicheskogo testa', { align: 'center' });
      doc.moveDown(1);

      // Child info
      doc.fontSize(12);
      const child = result.session.child;
      const test = result.session.test;
      doc.text(`Test: ${test.titleRu}`);
      doc.text(`Rebyonok: ${child.firstName} ${child.lastName}`);
      doc.text(`Data: ${result.createdAt.toLocaleDateString('ru-RU')}`);
      doc.moveDown(1);

      // Score
      doc.fontSize(14).text('Rezultat', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      const percentage = result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;
      doc.text(`Ball: ${result.totalScore} / ${result.maxScore} (${percentage}%)`);
      doc.moveDown(1);

      // Interpretation
      doc.fontSize(14).text('Interpretatsiya', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(result.interpretation || 'Net interpretatcii', {
        width: 450,
        align: 'left',
      });
      doc.moveDown(1);

      // Recommendations
      doc.fontSize(14).text('Rekomendatsii', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(result.recommendations || 'Net rekomendatsii', {
        width: 450,
        align: 'left',
      });

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888888');
      doc.text('ZharqynBala - platforma psihologicheskogo zdorovya detei', { align: 'center' });
      doc.text(`Sformirovano: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
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
      doc.fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Otchyot o progresse rebyonka', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12);
      doc.text(`Rebyonok: ${child.firstName} ${child.lastName}`);
      doc.text(`Data rozhdeniya: ${child.birthDate.toLocaleDateString('ru-RU')}`);
      if (child.schoolName) doc.text(`Shkola: ${child.schoolName}`);
      if (child.grade) doc.text(`Klass: ${child.grade}`);
      doc.text(`Vsego testov projdeno: ${child.testSessions.length}`);
      doc.moveDown(1);

      doc.fontSize(14).text('Rezultaty testov', { underline: true });
      doc.moveDown(0.5);

      for (const session of child.testSessions) {
        if (!session.result) continue;
        const pct = session.result.maxScore > 0
          ? Math.round((session.result.totalScore / session.result.maxScore) * 100)
          : 0;
        doc.fontSize(11);
        doc.text(`${session.test.titleRu} - ${pct}% (${session.completedAt?.toLocaleDateString('ru-RU') || 'N/A'})`);
        if (session.result.interpretation) {
          doc.fontSize(10).fillColor('#555555').text(`  ${session.result.interpretation}`);
          doc.fillColor('#000000');
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888888');
      doc.text(`Sformirovano: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
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
      doc.fontSize(20).text('ZharqynBala', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text('Otchyot dlya shkoly', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12);
      doc.text(`Shkola: ${school.schoolName}`);
      doc.text(`Region: ${school.region || 'N/A'}, Gorod: ${school.city || 'N/A'}`);
      doc.text(`Klassov: ${school.classes.length}`);
      const totalStudents = school.classes.reduce((sum, c) => sum + c.students.length, 0);
      doc.text(`Uchenikov: ${totalStudents}`);
      doc.moveDown(1);

      doc.fontSize(14).text('Klassy', { underline: true });
      doc.moveDown(0.5);

      for (const cls of school.classes) {
        doc.fontSize(12).text(`${cls.grade}${cls.letter} (${cls.academicYear}) - ${cls.students.length} uchenikov`);
        if (cls.groupTests.length > 0) {
          for (const gt of cls.groupTests) {
            doc.fontSize(10).fillColor('#555555')
              .text(`  Test: ${gt.test.titleRu} - Zaversheno: ${gt.completedCount}/${gt.totalCount}`);
          }
          doc.fillColor('#000000');
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888888');
      doc.text(`Sformirovano: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
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

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      buildFn(doc);
      doc.end();
    });
  }
}
