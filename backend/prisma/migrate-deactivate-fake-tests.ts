/**
 * BUG-038: деактивировать тесты-фикции с 5 вопросами, для которых в каталоге
 * уже есть валидированные методики (Спилбергер-Ханин, Бек, Филлипс,
 * Кондаш, Лусканова, Дембо-Рубинштейн, Мадди-Леонтьев).
 *
 * Оставшиеся короткие тесты (ATTENTION/EMOTIONS/SOCIAL/COGNITIVE)
 * перемаркированы как «(экспресс)» и сохраняют isActive=true.
 *
 * Запуск:
 *   cd backend && npx ts-node prisma/migrate-deactivate-fake-tests.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEACTIVATE_IDS = [
  'test-anxiety-1',
  'test-motivation-1',
  'test-selfesteem-1',
  'test-stress-1',
];

const RELABEL: Array<{ id: string; titleRu: string; titleKz: string; descriptionRu: string; descriptionKz: string }> = [
  {
    id: 'test-attention-1',
    titleRu: 'Внимание и концентрация (экспресс)',
    titleKz: 'Зейін және шоғырлану (экспресс)',
    descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Для полной диагностики внимания нужна очная консультация с психологом и инструментальные методики (корректурная проба, таблицы Шульте).',
    descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады. Зейінді толық диагностикалау үшін психологтың кеңесі қажет.',
  },
  {
    id: 'test-emotions-1',
    titleRu: 'Эмоциональный интеллект (экспресс)',
    titleKz: 'Эмоционалдық интеллект (экспресс)',
    descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Не заменяет полную диагностику; для глубокой оценки EQ нужна очная консультация.',
    descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады.',
  },
  {
    id: 'test-social-1',
    titleRu: 'Социальные навыки (экспресс)',
    titleKz: 'Әлеуметтік дағдылар (экспресс)',
    descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Для оценки буллинга и социальной адаптации лучше пройти «Опросник буллинга Олвеуса».',
    descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады.',
  },
  {
    id: 'test-learning-style-1',
    titleRu: 'Стиль обучения (экспресс)',
    titleKz: 'Оқу стилі (экспресс)',
    descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Помогает понять предпочитаемый канал восприятия (визуал/аудиал/кинестетик), но не заменяет когнитивной диагностики.',
    descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады.',
  },
];

async function main() {
  console.log('🔧 BUG-038: деактивация фейковых тестов с 5 вопросами\n');

  for (const id of DEACTIVATE_IDS) {
    const t = await prisma.test.findUnique({ where: { id }, select: { id: true, titleRu: true, isActive: true } });
    if (!t) {
      console.log(`  ⊘ ${id} — не найден, пропускаем`);
      continue;
    }
    if (!t.isActive) {
      console.log(`  ✓ ${id} «${t.titleRu}» — уже неактивен`);
      continue;
    }
    await prisma.test.update({
      where: { id },
      data: { isActive: false, order: 99 },
    });
    console.log(`  ✓ ${id} «${t.titleRu}» — деактивирован`);
  }

  console.log('\n🏷  Пометка оставшихся коротких тестов как «(экспресс)»:\n');
  for (const r of RELABEL) {
    const t = await prisma.test.findUnique({ where: { id: r.id }, select: { id: true, titleRu: true } });
    if (!t) {
      console.log(`  ⊘ ${r.id} — не найден, пропускаем`);
      continue;
    }
    await prisma.test.update({
      where: { id: r.id },
      data: {
        titleRu: r.titleRu,
        titleKz: r.titleKz,
        descriptionRu: r.descriptionRu,
        descriptionKz: r.descriptionKz,
        durationMinutes: 5,
        price: 0,
        isPremium: false,
      },
    });
    console.log(`  ✓ ${r.id} → «${r.titleRu}»`);
  }

  const active = await prisma.test.count({ where: { isActive: true } });
  const total = await prisma.test.count();
  console.log(`\n✅ Готово. Активных тестов в каталоге: ${active} из ${total}.`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
