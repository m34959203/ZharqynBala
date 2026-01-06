import { Injectable, Logger, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PdfContent {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  footer?: string;
}

interface PdfSection {
  title?: string;
  type: 'text' | 'table' | 'chart' | 'list' | 'header';
  content: any;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateResultPdf(result: {
    id: string;
    testName: string;
    childName: string;
    childAge: number;
    completedAt: Date;
    score: number;
    maxScore: number;
    categories: { name: string; score: number; maxScore: number }[];
    recommendations: string[];
    interpretation: string;
  }): Promise<Buffer> {
    const content: PdfContent = {
      title: 'Результаты психологического теста',
      subtitle: result.testName,
      sections: [
        {
          type: 'header',
          content: {
            logo: true,
            date: result.completedAt.toLocaleDateString('ru-RU'),
          },
        },
        {
          title: 'Информация о тестировании',
          type: 'table',
          content: [
            ['Ребёнок', result.childName],
            ['Возраст', `${result.childAge} лет`],
            ['Тест', result.testName],
            ['Дата прохождения', result.completedAt.toLocaleDateString('ru-RU')],
          ],
        },
        {
          title: 'Общий результат',
          type: 'chart',
          content: {
            type: 'score',
            score: result.score,
            maxScore: result.maxScore,
            percentage: Math.round((result.score / result.maxScore) * 100),
          },
        },
        {
          title: 'Результаты по категориям',
          type: 'table',
          content: result.categories.map((cat) => [
            cat.name,
            `${cat.score}/${cat.maxScore}`,
            `${Math.round((cat.score / cat.maxScore) * 100)}%`,
          ]),
        },
        {
          title: 'Интерпретация результатов',
          type: 'text',
          content: result.interpretation,
        },
        {
          title: 'Рекомендации',
          type: 'list',
          content: result.recommendations,
        },
      ],
      footer: `© ${new Date().getFullYear()} ZharqynBala. Результат #${result.id}`,
    };

    return this.generatePdf(content);
  }

  async generateChildReportPdf(report: {
    child: { name: string; birthDate: Date; school?: string; grade?: string };
    period: { from: Date; to: Date };
    tests: { name: string; date: Date; score: number; maxScore: number }[];
    progress: { category: string; change: number; trend: 'up' | 'down' | 'stable' }[];
    summary: string;
    recommendations: string[];
  }): Promise<Buffer> {
    const childAge = this.calculateAge(report.child.birthDate);

    const content: PdfContent = {
      title: 'Отчёт о развитии ребёнка',
      subtitle: report.child.name,
      sections: [
        {
          type: 'header',
          content: { logo: true, date: new Date().toLocaleDateString('ru-RU') },
        },
        {
          title: 'Информация о ребёнке',
          type: 'table',
          content: [
            ['Имя', report.child.name],
            ['Возраст', `${childAge} лет`],
            ['Школа', report.child.school || '—'],
            ['Класс', report.child.grade || '—'],
          ],
        },
        {
          title: 'Период отчёта',
          type: 'text',
          content: `${report.period.from.toLocaleDateString('ru-RU')} — ${report.period.to.toLocaleDateString('ru-RU')}`,
        },
        {
          title: 'Пройденные тесты',
          type: 'table',
          content: report.tests.map((test) => [
            test.name,
            test.date.toLocaleDateString('ru-RU'),
            `${test.score}/${test.maxScore}`,
            `${Math.round((test.score / test.maxScore) * 100)}%`,
          ]),
        },
        {
          title: 'Динамика развития',
          type: 'table',
          content: report.progress.map((p) => [
            p.category,
            p.trend === 'up' ? '↑' : p.trend === 'down' ? '↓' : '→',
            `${p.change > 0 ? '+' : ''}${p.change}%`,
          ]),
        },
        {
          title: 'Общее заключение',
          type: 'text',
          content: report.summary,
        },
        {
          title: 'Рекомендации для родителей',
          type: 'list',
          content: report.recommendations,
        },
      ],
      footer: `© ${new Date().getFullYear()} ZharqynBala`,
    };

    return this.generatePdf(content);
  }

  async generateSchoolReportPdf(report: {
    school: { name: string; address?: string };
    period: { from: Date; to: Date };
    statistics: {
      totalStudents: number;
      testedStudents: number;
      testsCompleted: number;
      averageScore: number;
    };
    classResults: {
      className: string;
      students: number;
      tested: number;
      averageScore: number;
    }[];
    riskStudents: { name: string; className: string; concern: string }[];
    recommendations: string[];
  }): Promise<Buffer> {
    const content: PdfContent = {
      title: 'Отчёт для школы',
      subtitle: report.school.name,
      sections: [
        {
          type: 'header',
          content: { logo: true, date: new Date().toLocaleDateString('ru-RU') },
        },
        {
          title: 'Общая статистика',
          type: 'table',
          content: [
            ['Всего учащихся', report.statistics.totalStudents.toString()],
            ['Прошли тестирование', report.statistics.testedStudents.toString()],
            ['Всего тестов пройдено', report.statistics.testsCompleted.toString()],
            ['Средний балл', `${report.statistics.averageScore}%`],
          ],
        },
        {
          title: 'Результаты по классам',
          type: 'table',
          content: [
            ['Класс', 'Учащихся', 'Протестировано', 'Средний балл'],
            ...report.classResults.map((c) => [
              c.className,
              c.students.toString(),
              c.tested.toString(),
              `${c.averageScore}%`,
            ]),
          ],
        },
        {
          title: 'Учащиеся, требующие внимания',
          type: 'table',
          content: [
            ['Имя', 'Класс', 'Область внимания'],
            ...report.riskStudents.map((s) => [s.name, s.className, s.concern]),
          ],
        },
        {
          title: 'Рекомендации',
          type: 'list',
          content: report.recommendations,
        },
      ],
      footer: `© ${new Date().getFullYear()} ZharqynBala. Конфиденциально.`,
    };

    return this.generatePdf(content);
  }

  private async generatePdf(content: PdfContent): Promise<Buffer> {
    // Generate HTML content
    const html = this.generateHtml(content);

    // In production, use puppeteer for PDF generation
    try {
      // @ts-ignore - puppeteer is optional dependency
      const puppeteer = await import('puppeteer').catch(() => null);
      if (!puppeteer) {
        this.logger.error('Puppeteer not installed - PDF generation unavailable');
        throw new ServiceUnavailableException(
          'PDF generation service is temporarily unavailable. Please try again later.'
        );
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (error instanceof ServiceUnavailableException || error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`PDF generation failed: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to generate PDF. Please try again later.'
      );
    }
  }

  private generateHtml(content: PdfContent): string {
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
        .logo { width: 120px; height: auto; margin-bottom: 10px; }
        h1 { color: #667eea; font-size: 24px; margin-bottom: 5px; }
        h2 { color: #333; font-size: 18px; font-weight: normal; }
        .section { margin-bottom: 30px; }
        .section-title { color: #667eea; font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: bold; }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 8px solid #667eea; display: flex; align-items: center; justify-content: center; margin: 20px auto; }
        .score-value { font-size: 32px; font-weight: bold; color: #667eea; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        .text-content { line-height: 1.8; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    `;

    const header = `
      <div class="header">
        <h1>${content.title}</h1>
        ${content.subtitle ? `<h2>${content.subtitle}</h2>` : ''}
      </div>
    `;

    const sections = content.sections
      .map((section) => {
        let sectionHtml = '';

        if (section.title) {
          sectionHtml += `<div class="section-title">${section.title}</div>`;
        }

        switch (section.type) {
          case 'text':
            sectionHtml += `<div class="text-content">${section.content}</div>`;
            break;

          case 'table':
            sectionHtml += '<table>';
            section.content.forEach((row: string[], index: number) => {
              const tag = index === 0 && section.content.length > 1 ? 'th' : 'td';
              sectionHtml += `<tr>${row.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
            });
            sectionHtml += '</table>';
            break;

          case 'chart':
            if (section.content.type === 'score') {
              sectionHtml += `
                <div class="score-circle">
                  <span class="score-value">${section.content.percentage}%</span>
                </div>
                <p style="text-align: center;">${section.content.score} из ${section.content.maxScore} баллов</p>
              `;
            }
            break;

          case 'list':
            sectionHtml += '<ul>';
            section.content.forEach((item: string) => {
              sectionHtml += `<li>${item}</li>`;
            });
            sectionHtml += '</ul>';
            break;

          case 'header':
            // Skip, already handled
            break;
        }

        return `<div class="section">${sectionHtml}</div>`;
      })
      .join('');

    const footer = content.footer
      ? `<div class="footer">${content.footer}</div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>${content.title}</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          ${header}
          ${sections}
          ${footer}
        </div>
      </body>
      </html>
    `;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
