import {
  PrismaClient,
  TestCategory,
  QuestionType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedValidatedTests } from './test-data/psychological-tests';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // ============================================
  // АДМИНИСТРАТОР
  // ============================================

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zharqynbala.kz' },
    update: {},
    create: {
      email: 'admin@zharqynbala.kz',
      phone: '+77000000000',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'Админ',
      lastName: 'Системы',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ============================================
  // ДЕМО РОДИТЕЛЬ ДЛЯ ТЕСТИРОВАНИЯ
  // ============================================

  const parentPasswordHash = await bcrypt.hash('Parent123!', 12);

  const demoParent = await prisma.user.upsert({
    where: { email: 'parent@test.kz' },
    update: {},
    create: {
      email: 'parent@test.kz',
      phone: '+77001234567',
      passwordHash: parentPasswordHash,
      role: UserRole.PARENT,
      firstName: 'Айгуль',
      lastName: 'Тестова',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo parent created:', demoParent.email);

  // Создаём демо-ребёнка для родителя
  const demoChild = await prisma.child.upsert({
    where: { id: 'demo-child-1' },
    update: {},
    create: {
      id: 'demo-child-1',
      firstName: 'Айлин',
      lastName: 'Тестова',
      birthDate: new Date('2014-05-15'),
      gender: 'FEMALE',
      parentId: demoParent.id,
    },
  });
  console.log('✅ Demo child created:', demoChild.firstName, demoChild.lastName);

  // ============================================
  // ПСИХОЛОГИЧЕСКИЕ ТЕСТЫ
  // ============================================

  const tests = [
    {
      id: 'test-anxiety-1',
      titleRu: 'Тест на тревожность',
      titleKz: 'Үрейлілік тесті',
      descriptionRu: 'Диагностика уровня тревожности у детей и подростков. Поможет выявить скрытые переживания и страхи.',
      descriptionKz: 'Балалар мен жасөспірімдердегі үрейлілік деңгейін анықтау. Жасырын уайымдар мен қорқыныштарды анықтауға көмектеседі.',
      category: TestCategory.ANXIETY,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 15,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 1,
    },
    {
      id: 'test-motivation-1',
      titleRu: 'Школьная мотивация',
      titleKz: 'Мектеп мотивациясы',
      descriptionRu: 'Оценка учебной мотивации школьника. Поможет понять, что движет вашим ребёнком в учёбе.',
      descriptionKz: 'Оқушының оқу мотивациясын бағалау. Баланыздың оқуға деген ынтасын түсінуге көмектеседі.',
      category: TestCategory.MOTIVATION,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 10,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 2,
    },
    {
      id: 'test-selfesteem-1',
      titleRu: 'Самооценка',
      titleKz: 'Өзін-өзі бағалау',
      descriptionRu: 'Диагностика уровня самооценки подростка. Важный показатель психологического благополучия.',
      descriptionKz: 'Жасөспірімнің өзін-өзі бағалау деңгейін анықтау. Психологиялық саулықтың маңызды көрсеткіші.',
      category: TestCategory.SELF_ESTEEM,
      ageMin: 12,
      ageMax: 17,
      durationMinutes: 12,
      price: 3500,
      isPremium: true,
      isActive: true,
      order: 3,
    },
    {
      id: 'test-attention-1',
      titleRu: 'Внимание и концентрация',
      titleKz: 'Зейін және шоғырлану',
      descriptionRu: 'Оценка способности к концентрации и устойчивости внимания. Полезно для выявления проблем с учёбой.',
      descriptionKz: 'Шоғырлану және зейін тұрақтылығын бағалау. Оқудағы мәселелерді анықтауға пайдалы.',
      category: TestCategory.ATTENTION,
      ageMin: 8,
      ageMax: 15,
      durationMinutes: 20,
      price: 4000,
      isPremium: true,
      isActive: true,
      order: 4,
    },
    {
      id: 'test-emotions-1',
      titleRu: 'Эмоциональный интеллект',
      titleKz: 'Эмоционалдық интеллект',
      descriptionRu: 'Оценка способности понимать и управлять своими эмоциями.',
      descriptionKz: 'Өз эмоцияларын түсіну және басқару қабілетін бағалау.',
      category: TestCategory.EMOTIONS,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 15,
      price: 3000,
      isPremium: false,
      isActive: true,
      order: 5,
    },
    {
      id: 'test-social-1',
      titleRu: 'Социальные навыки',
      titleKz: 'Әлеуметтік дағдылар',
      descriptionRu: 'Оценка навыков общения и взаимодействия со сверстниками.',
      descriptionKz: 'Құрдастарымен қарым-қатынас дағдыларын бағалау.',
      category: TestCategory.SOCIAL,
      ageMin: 8,
      ageMax: 16,
      durationMinutes: 12,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 6,
    },
    {
      id: 'test-stress-1',
      titleRu: 'Стрессоустойчивость',
      titleKz: 'Стресске төзімділік',
      descriptionRu: 'Диагностика способности справляться со стрессовыми ситуациями.',
      descriptionKz: 'Стресстік жағдайларды жеңу қабілетін анықтау.',
      category: TestCategory.ANXIETY,
      ageMin: 12,
      ageMax: 17,
      durationMinutes: 15,
      price: 3500,
      isPremium: true,
      isActive: true,
      order: 7,
    },
    {
      id: 'test-learning-style-1',
      titleRu: 'Стиль обучения',
      titleKz: 'Оқу стилі',
      descriptionRu: 'Определение предпочтительного способа восприятия информации.',
      descriptionKz: 'Ақпаратты қабылдаудың ұнамды тәсілін анықтау.',
      category: TestCategory.COGNITIVE,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 10,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 8,
    },
  ];

  for (const testData of tests) {
    const test = await prisma.test.upsert({
      where: { id: testData.id },
      update: {},
      create: testData,
    });
    console.log('✅ Test created:', test.titleRu);
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА НА ТРЕВОЖНОСТЬ
  // ============================================

  const anxietyQuestions = [
    {
      questionTextRu: 'Как часто ты чувствуешь беспокойство без видимой причины?',
      questionTextKz: 'Сен қаншалықты жиі көрінерлік себепсіз алаңдайсың?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Очень часто', textKz: 'Өте жиі', score: 4 },
      ],
    },
    {
      questionTextRu: 'Трудно ли тебе засыпать из-за переживаний?',
      questionTextKz: 'Уайымдаудан ұйықтауға қиындайсың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Очень часто', textKz: 'Өте жиі', score: 4 },
      ],
    },
    {
      questionTextRu: 'Волнуешься ли ты перед контрольными работами?',
      questionTextKz: 'Бақылау жұмыстарының алдында толқанасың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Немного', textKz: 'Аздап', score: 1 },
        { textRu: 'Умеренно', textKz: 'Орташа', score: 2 },
        { textRu: 'Сильно', textKz: 'Қатты', score: 3 },
        { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
      ],
    },
    {
      questionTextRu: 'Боишься ли ты знакомиться с новыми людьми?',
      questionTextKz: 'Жаңа адамдармен танысудан қорқасың ба?',
      questionType: QuestionType.YES_NO,
      options: [
        { textRu: 'Да', textKz: 'Иә', score: 2 },
        { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      ],
    },
    {
      questionTextRu: 'Как ты себя чувствуешь в новой обстановке?',
      questionTextKz: 'Жаңа ортада өзіңді қалай сезінесің?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Спокойно и уверенно', textKz: 'Тыныш және сенімді', score: 0 },
        { textRu: 'Немного неуверенно', textKz: 'Біраз сенімсіз', score: 1 },
        { textRu: 'Тревожно', textKz: 'Үрейлі', score: 2 },
        { textRu: 'Очень тревожно', textKz: 'Өте үрейлі', score: 3 },
      ],
    },
  ];

  const anxietyTest = await prisma.test.findUnique({ where: { id: 'test-anxiety-1' } });
  if (anxietyTest) {
    for (let i = 0; i < anxietyQuestions.length; i++) {
      const q = anxietyQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `anxiety-q-${i + 1}` },
        update: {},
        create: {
          id: `anxiety-q-${i + 1}`,
          testId: anxietyTest.id,
          questionTextRu: q.questionTextRu,
          questionTextKz: q.questionTextKz,
          questionType: q.questionType,
          order: i + 1,
          isRequired: true,
        },
      });

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await prisma.answerOption.upsert({
          where: { id: `anxiety-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `anxiety-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Anxiety test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА МОТИВАЦИИ
  // ============================================

  const motivationQuestions = [
    {
      questionTextRu: 'Нравится ли тебе ходить в школу?',
      questionTextKz: 'Саған мектепке баруды ұнатасың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Совсем не нравится', textKz: 'Мүлдем ұнатпаймын', score: 0 },
        { textRu: 'Не очень', textKz: 'Онша емес', score: 1 },
        { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 2 },
        { textRu: 'Нравится', textKz: 'Ұнатамын', score: 3 },
        { textRu: 'Очень нравится', textKz: 'Өте ұнатамын', score: 4 },
      ],
    },
    {
      questionTextRu: 'Стараешься ли ты хорошо учиться?',
      questionTextKz: 'Жақсы оқуға тырысасың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Интересно ли тебе узнавать что-то новое?',
      questionTextKz: 'Саған жаңа нәрсе білу қызықты ма?',
      questionType: QuestionType.YES_NO,
      options: [
        { textRu: 'Да', textKz: 'Иә', score: 2 },
        { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      ],
    },
    {
      questionTextRu: 'Почему ты учишься?',
      questionTextKz: 'Неге оқисың?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Чтобы родители не ругали', textKz: 'Ата-анам ұрыспас үшін', score: 1 },
        { textRu: 'Чтобы получить хорошие оценки', textKz: 'Жақсы баға алу үшін', score: 2 },
        { textRu: 'Мне интересно учиться', textKz: 'Маған оқу қызықты', score: 4 },
        { textRu: 'Чтобы стать успешным', textKz: 'Табысты болу үшін', score: 3 },
      ],
    },
  ];

  const motivationTest = await prisma.test.findUnique({ where: { id: 'test-motivation-1' } });
  if (motivationTest) {
    for (let i = 0; i < motivationQuestions.length; i++) {
      const q = motivationQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `motivation-q-${i + 1}` },
        update: {},
        create: {
          id: `motivation-q-${i + 1}`,
          testId: motivationTest.id,
          questionTextRu: q.questionTextRu,
          questionTextKz: q.questionTextKz,
          questionType: q.questionType,
          order: i + 1,
          isRequired: true,
        },
      });

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await prisma.answerOption.upsert({
          where: { id: `motivation-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `motivation-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Motivation test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА САМООЦЕНКИ
  // ============================================

  const selfEsteemQuestions = [
    {
      questionTextRu: 'Я доволен(а) собой',
      questionTextKz: 'Мен өзіме риза',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Полностью не согласен', textKz: 'Мүлдем келіспеймін', score: 0 },
        { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
        { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 2 },
        { textRu: 'Согласен', textKz: 'Келісемін', score: 3 },
        { textRu: 'Полностью согласен', textKz: 'Толық келісемін', score: 4 },
      ],
    },
    {
      questionTextRu: 'Я думаю, что у меня есть хорошие качества',
      questionTextKz: 'Менде жақсы қасиеттер бар деп ойлаймын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Полностью не согласен', textKz: 'Мүлдем келіспеймін', score: 0 },
        { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
        { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 2 },
        { textRu: 'Согласен', textKz: 'Келісемін', score: 3 },
        { textRu: 'Полностью согласен', textKz: 'Толық келісемін', score: 4 },
      ],
    },
    {
      questionTextRu: 'Я могу делать что-то не хуже других',
      questionTextKz: 'Мен басқалардан кем емеспін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Полностью не согласен', textKz: 'Мүлдем келіспеймін', score: 0 },
        { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
        { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 2 },
        { textRu: 'Согласен', textKz: 'Келісемін', score: 3 },
        { textRu: 'Полностью согласен', textKz: 'Толық келісемін', score: 4 },
      ],
    },
  ];

  const selfEsteemTest = await prisma.test.findUnique({ where: { id: 'test-selfesteem-1' } });
  if (selfEsteemTest) {
    for (let i = 0; i < selfEsteemQuestions.length; i++) {
      const q = selfEsteemQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `selfesteem-q-${i + 1}` },
        update: {},
        create: {
          id: `selfesteem-q-${i + 1}`,
          testId: selfEsteemTest.id,
          questionTextRu: q.questionTextRu,
          questionTextKz: q.questionTextKz,
          questionType: q.questionType,
          order: i + 1,
          isRequired: true,
        },
      });

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await prisma.answerOption.upsert({
          where: { id: `selfesteem-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `selfesteem-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Self-esteem test questions created');
  }

  // ============================================
  // ВАЛИДИРОВАННЫЕ ПСИХОЛОГИЧЕСКИЕ ТЕСТЫ
  // ============================================
  await seedValidatedTests(prisma);

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 ТЕСТОВЫЕ АККАУНТЫ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚙️ АДМИН:');
  console.log('   Email: admin@zharqynbala.kz');
  console.log('   Password: Admin123!');
  console.log('');
  console.log('👩 РОДИТЕЛЬ (для тестирования):');
  console.log('   Email: parent@test.kz');
  console.log('   Password: Parent123!');
  console.log('   Ребёнок: Айлин Тестова (10 лет)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
