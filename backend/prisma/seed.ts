import {
  PrismaClient,
  TestCategory,
  QuestionType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedValidatedTests } from './test-data/psychological-tests';
import { seedHrPlusTests } from './test-data/hr-plus-tests';

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
  // ДЕМО ПСИХОЛОГ ДЛЯ ТЕСТИРОВАНИЯ
  // ============================================

  const psychologistPasswordHash = await bcrypt.hash('Psychologist123!', 12);

  const demoPsychologistUser = await prisma.user.upsert({
    where: { email: 'psychologist@test.kz' },
    update: {},
    create: {
      email: 'psychologist@test.kz',
      phone: '+77009876543',
      passwordHash: psychologistPasswordHash,
      role: UserRole.PSYCHOLOGIST,
      firstName: 'Алия',
      lastName: 'Серикова',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo psychologist user created:', demoPsychologistUser.email);

  // Создаём профиль психолога
  const demoPsychologist = await prisma.psychologist.upsert({
    where: { userId: demoPsychologistUser.id },
    update: {
      isApproved: true,
      isAvailable: true,
    },
    create: {
      userId: demoPsychologistUser.id,
      specialization: ['Детский психолог', 'Семейный психолог'],
      experienceYears: 8,
      education: 'КазНУ им. аль-Фараби, факультет психологии',
      certificateUrl: null,
      hourlyRate: 15000,
      bio: 'Практикующий детский и семейный психолог с 8-летним опытом работы. Специализируюсь на помощи детям и подросткам в преодолении тревожности, проблем с самооценкой и адаптации в школе.',
      languages: ['Русский', 'Казахский'],
      isApproved: true,
      isAvailable: true,
      rating: 4.8,
      totalConsultations: 156,
    },
  });
  console.log('✅ Demo psychologist profile created:', demoPsychologist.id);

  // Создаём второго психолога
  const psychologist2User = await prisma.user.upsert({
    where: { email: 'psychologist2@test.kz' },
    update: {},
    create: {
      email: 'psychologist2@test.kz',
      phone: '+77005554433',
      passwordHash: psychologistPasswordHash,
      role: UserRole.PSYCHOLOGIST,
      firstName: 'Марат',
      lastName: 'Ахметов',
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.psychologist.upsert({
    where: { userId: psychologist2User.id },
    update: {
      isApproved: true,
      isAvailable: true,
    },
    create: {
      userId: psychologist2User.id,
      specialization: ['Клинический психолог', 'Психотерапевт'],
      experienceYears: 12,
      education: 'МГУ им. Ломоносова, факультет психологии',
      certificateUrl: null,
      hourlyRate: 20000,
      bio: 'Клинический психолог и психотерапевт. Работаю с детьми и подростками, помогаю справиться с депрессией, СДВГ, и эмоциональными проблемами.',
      languages: ['Русский', 'Английский'],
      isApproved: true,
      isAvailable: true,
      rating: 4.9,
      totalConsultations: 234,
    },
  });
  console.log('✅ Second demo psychologist created');

  // ============================================
  // ПСИХОЛОГИЧЕСКИЕ ТЕСТЫ
  // ============================================

  // BUG-038: «5-вопросные» тесты-фикции скрываем, потому что в каталоге
  // уже сидятся валидированные методики (см. seedValidatedTests /
  // seedHrPlusTests ниже): Спилбергер-Ханин, Бек, Филлипс, Кондаш,
  // Лусканова, ДДО Климова, Олвеус, Шмишек, EPI, Шварц, Мадди-Леонтьев.
  // На 5 вопросах диагноз тревожности/мотивации/самооценки невалиден —
  // оставлять их активными значит подталкивать родителей к неверным
  // выводам. Тесты для категорий без валидной замены (ATTENTION /
  // EMOTIONS / COGNITIVE) оставляем активными, но с честной пометкой
  // «экспресс — короткий ориентировочный тест».
  const tests = [
    {
      id: 'test-anxiety-1',
      titleRu: 'Тест на тревожность (deprecated)',
      titleKz: 'Үрейлілік тесті (deprecated)',
      descriptionRu: 'УСТАРЕЛО. Используйте «Опросник школьной тревожности Филлипса», «Шкала тревоги Бека» или «Ситуативная тревожность (Спилбергер-Ханин)».',
      descriptionKz: 'ЕСКІРДІ. «Филлипс мектеп үрейлілік сауалнамасын», «Бек үрейлілік шкаласын» немесе «Спилбергер-Ханин» қолданыңыз.',
      category: TestCategory.ANXIETY,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 15,
      price: 0,
      isPremium: false,
      isActive: false,
      order: 99,
    },
    {
      id: 'test-motivation-1',
      titleRu: 'Школьная мотивация (deprecated)',
      titleKz: 'Мектеп мотивациясы (deprecated)',
      descriptionRu: 'УСТАРЕЛО. Используйте «Оценка уровня школьной мотивации» (Н.Г. Лусканова).',
      descriptionKz: 'ЕСКІРДІ. «Мектеп мотивациясы деңгейін бағалау» (Н.Г. Лусканова) қолданыңыз.',
      category: TestCategory.MOTIVATION,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 10,
      price: 0,
      isPremium: false,
      isActive: false,
      order: 99,
    },
    {
      id: 'test-selfesteem-1',
      titleRu: 'Самооценка (deprecated)',
      titleKz: 'Өзін-өзі бағалау (deprecated)',
      descriptionRu: 'УСТАРЕЛО. Используйте «Определение уровня самооценки» (Дембо-Рубинштейн).',
      descriptionKz: 'ЕСКІРДІ. «Өзін-өзі бағалау деңгейін анықтау» (Дембо-Рубинштейн) қолданыңыз.',
      category: TestCategory.SELF_ESTEEM,
      ageMin: 12,
      ageMax: 17,
      durationMinutes: 12,
      price: 3500,
      isPremium: true,
      isActive: false,
      order: 99,
    },
    {
      id: 'test-attention-1',
      titleRu: 'Внимание и концентрация (экспресс)',
      titleKz: 'Зейін және шоғырлану (экспресс)',
      descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Для полной диагностики внимания нужна очная консультация с психологом и инструментальные методики (корректурная проба, таблицы Шульте).',
      descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады. Зейінді толық диагностикалау үшін психологтың кеңесі және инструменттік әдістер қажет.',
      category: TestCategory.ATTENTION,
      ageMin: 8,
      ageMax: 15,
      durationMinutes: 5,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 80,
    },
    {
      id: 'test-emotions-1',
      titleRu: 'Эмоциональный интеллект (экспресс)',
      titleKz: 'Эмоционалдық интеллект (экспресс)',
      descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Не заменяет полную диагностику; для глубокой оценки EQ нужна очная консультация.',
      descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады. Толық диагностиканы алмастырмайды.',
      category: TestCategory.EMOTIONS,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 5,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 81,
    },
    {
      id: 'test-social-1',
      titleRu: 'Социальные навыки (экспресс)',
      titleKz: 'Әлеуметтік дағдылар (экспресс)',
      descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Для оценки буллинга и социальной адаптации лучше пройти «Опросник буллинга Олвеуса».',
      descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады. Буллингті бағалау үшін «Олвеус сауалнамасы» дұрысырақ.',
      category: TestCategory.SOCIAL,
      ageMin: 8,
      ageMax: 16,
      durationMinutes: 5,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 82,
    },
    {
      id: 'test-stress-1',
      titleRu: 'Стрессоустойчивость (deprecated)',
      titleKz: 'Стресске төзімділік (deprecated)',
      descriptionRu: 'УСТАРЕЛО. Используйте «Шкала тревожности Кондаш» или «Тест жизнестойкости (Мадди-Леонтьев)».',
      descriptionKz: 'ЕСКІРДІ. «Кондаш үрейлілік шкаласын» немесе «Өміршеңдік тесті (Мадди-Леонтьев)» қолданыңыз.',
      category: TestCategory.ANXIETY,
      ageMin: 12,
      ageMax: 17,
      durationMinutes: 15,
      price: 3500,
      isPremium: true,
      isActive: false,
      order: 99,
    },
    {
      id: 'test-learning-style-1',
      titleRu: 'Стиль обучения (экспресс)',
      titleKz: 'Оқу стилі (экспресс)',
      descriptionRu: 'Короткий ориентировочный тест на 5 вопросов. Помогает понять предпочитаемый канал восприятия (визуал/аудиал/кинестетик), но не заменяет когнитивной диагностики.',
      descriptionKz: 'Қысқа бағдар тест 5 сұрақтан тұрады. Қабылдау арнасын анықтауға көмектеседі.',
      category: TestCategory.COGNITIVE,
      ageMin: 10,
      ageMax: 17,
      durationMinutes: 5,
      price: 0,
      isPremium: false,
      isActive: true,
      order: 83,
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
  // ВОПРОСЫ ДЛЯ ТЕСТА ВНИМАНИЕ И КОНЦЕНТРАЦИЯ
  // ============================================

  const attentionQuestions = [
    {
      questionTextRu: 'Мне трудно сосредоточиться на уроке',
      questionTextKz: 'Маған сабақта назар аудару қиын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я отвлекаюсь на посторонние звуки',
      questionTextKz: 'Мен бөтен дыбыстарға алаңдаймын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я забываю что мне задали',
      questionTextKz: 'Маған не тапсырғанын ұмытамын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Мне трудно дослушать учителя до конца',
      questionTextKz: 'Мұғалімді соңына дейін тыңдау қиын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я теряю вещи (ручки, тетради)',
      questionTextKz: 'Мен заттарымды жоғалтамын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
  ];

  const attentionTest = await prisma.test.findUnique({ where: { id: 'test-attention-1' } });
  if (attentionTest) {
    for (let i = 0; i < attentionQuestions.length; i++) {
      const q = attentionQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `attention-q-${i + 1}` },
        update: {},
        create: {
          id: `attention-q-${i + 1}`,
          testId: attentionTest.id,
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
          where: { id: `attention-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `attention-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Attention test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА ЭМОЦИОНАЛЬНОГО ИНТЕЛЛЕКТА
  // ============================================

  const emotionsQuestions = [
    {
      questionTextRu: 'Я понимаю свои чувства',
      questionTextKz: 'Мен өз сезімдерімді түсінемін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я могу управлять своим гневом',
      questionTextKz: 'Мен ашуымды бақылай аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я понимаю когда друг расстроен',
      questionTextKz: 'Досым ренжігенін түсінемін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я умею мирно решать конфликты',
      questionTextKz: 'Мен дауды бейбіт жолмен шеше аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я могу выразить свои эмоции словами',
      questionTextKz: 'Мен эмоцияларымды сөзбен жеткізе аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
  ];

  const emotionsTest = await prisma.test.findUnique({ where: { id: 'test-emotions-1' } });
  if (emotionsTest) {
    for (let i = 0; i < emotionsQuestions.length; i++) {
      const q = emotionsQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `emotions-q-${i + 1}` },
        update: {},
        create: {
          id: `emotions-q-${i + 1}`,
          testId: emotionsTest.id,
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
          where: { id: `emotions-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `emotions-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Emotions test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА СОЦИАЛЬНЫХ НАВЫКОВ
  // ============================================

  const socialQuestions = [
    {
      questionTextRu: 'Мне легко знакомиться с новыми людьми',
      questionTextKz: 'Маған жаңа адамдармен танысу оңай',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я умею работать в команде',
      questionTextKz: 'Мен командада жұмыс істей аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я помогаю одноклассникам',
      questionTextKz: 'Мен сыныптастарыма көмектесемін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Мне легко попросить о помощи',
      questionTextKz: 'Маған көмек сұрау оңай',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
    {
      questionTextRu: 'Я уважаю мнение других',
      questionTextKz: 'Мен басқалардың пікірін құрметтеймін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
        { textRu: 'Редко', textKz: 'Сирек', score: 2 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
        { textRu: 'Часто', textKz: 'Жиі', score: 4 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 5 },
      ],
    },
  ];

  const socialTest = await prisma.test.findUnique({ where: { id: 'test-social-1' } });
  if (socialTest) {
    for (let i = 0; i < socialQuestions.length; i++) {
      const q = socialQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `social-q-${i + 1}` },
        update: {},
        create: {
          id: `social-q-${i + 1}`,
          testId: socialTest.id,
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
          where: { id: `social-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `social-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Social test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА СТРЕССОУСТОЙЧИВОСТИ
  // ============================================

  const stressQuestions = [
    {
      questionTextRu: 'Я чувствую напряжение перед контрольными',
      questionTextKz: 'Бақылау алдында шиеленісті сеземін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 1 },
        { textRu: 'Часто', textKz: 'Жиі', score: 2 },
        { textRu: 'Постоянно', textKz: 'Үнемі', score: 3 },
      ],
    },
    {
      questionTextRu: 'Мне трудно расслабиться после школы',
      questionTextKz: 'Мектептен кейін демалу қиын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 1 },
        { textRu: 'Часто', textKz: 'Жиі', score: 2 },
        { textRu: 'Постоянно', textKz: 'Үнемі', score: 3 },
      ],
    },
    {
      questionTextRu: 'У меня болит голова или живот от переживаний',
      questionTextKz: 'Уайымнан басым немесе ішім ауырады',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 1 },
        { textRu: 'Часто', textKz: 'Жиі', score: 2 },
        { textRu: 'Постоянно', textKz: 'Үнемі', score: 3 },
      ],
    },
    {
      questionTextRu: 'Я плохо сплю из-за тревоги',
      questionTextKz: 'Уайымнан жаман ұйықтаймын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 1 },
        { textRu: 'Часто', textKz: 'Жиі', score: 2 },
        { textRu: 'Постоянно', textKz: 'Үнемі', score: 3 },
      ],
    },
    {
      questionTextRu: 'Мне трудно справляться с проблемами',
      questionTextKz: 'Мәселелерді шешу маған қиын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 1 },
        { textRu: 'Часто', textKz: 'Жиі', score: 2 },
        { textRu: 'Постоянно', textKz: 'Үнемі', score: 3 },
      ],
    },
  ];

  const stressTest = await prisma.test.findUnique({ where: { id: 'test-stress-1' } });
  if (stressTest) {
    for (let i = 0; i < stressQuestions.length; i++) {
      const q = stressQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `stress-q-${i + 1}` },
        update: {},
        create: {
          id: `stress-q-${i + 1}`,
          testId: stressTest.id,
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
          where: { id: `stress-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `stress-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Stress test questions created');
  }

  // ============================================
  // ВОПРОСЫ ДЛЯ ТЕСТА СТИЛЯ ОБУЧЕНИЯ
  // ============================================

  const learningStyleQuestions = [
    {
      questionTextRu: 'Как тебе легче запоминать?',
      questionTextKz: 'Саған қалай есте сақтау оңай?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Прочитать', textKz: 'Оқу', score: 1 },
        { textRu: 'Послушать', textKz: 'Тыңдау', score: 2 },
        { textRu: 'Попробовать сделать', textKz: 'Істеп көру', score: 3 },
      ],
    },
    {
      questionTextRu: 'На уроке тебе помогает',
      questionTextKz: 'Сабақта саған не көмектеседі?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Таблицы и схемы', textKz: 'Кестелер мен сызбалар', score: 1 },
        { textRu: 'Объяснения учителя', textKz: 'Мұғалімнің түсіндіруі', score: 2 },
        { textRu: 'Практические задания', textKz: 'Тәжірибелік тапсырмалар', score: 3 },
      ],
    },
    {
      questionTextRu: 'В свободное время ты предпочитаешь',
      questionTextKz: 'Бос уақытыңда нені таңдайсың?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Читать/смотреть видео', textKz: 'Оқу/бейне көру', score: 1 },
        { textRu: 'Слушать музыку/подкасты', textKz: 'Музыка/подкаст тыңдау', score: 2 },
        { textRu: 'Спорт/рукоделие', textKz: 'Спорт/қолөнер', score: 3 },
      ],
    },
    {
      questionTextRu: 'Когда учишь новое слово ты',
      questionTextKz: 'Жаңа сөзді үйренгенде',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Записываешь', textKz: 'Жазасың', score: 1 },
        { textRu: 'Повторяешь вслух', textKz: 'Дауыстап қайталайсың', score: 2 },
        { textRu: 'Используешь в предложении', textKz: 'Сөйлемде қолданасың', score: 3 },
      ],
    },
    {
      questionTextRu: 'Лучше всего ты понимаешь когда',
      questionTextKz: 'Саған түсіну оңай, қашан',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Видишь картинку', textKz: 'Суретті көресің', score: 1 },
        { textRu: 'Слышишь объяснение', textKz: 'Түсіндірмені естисің', score: 2 },
        { textRu: 'Делаешь сам', textKz: 'Өзің жасайсың', score: 3 },
      ],
    },
  ];

  const learningStyleTest = await prisma.test.findUnique({ where: { id: 'test-learning-style-1' } });
  if (learningStyleTest) {
    for (let i = 0; i < learningStyleQuestions.length; i++) {
      const q = learningStyleQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `learnstyle-q-${i + 1}` },
        update: {},
        create: {
          id: `learnstyle-q-${i + 1}`,
          testId: learningStyleTest.id,
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
          where: { id: `learnstyle-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `learnstyle-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Learning style test questions created');
  }

  // ============================================
  // ВАЛИДИРОВАННЫЕ ПСИХОЛОГИЧЕСКИЕ ТЕСТЫ
  // ============================================
  await seedValidatedTests(prisma);

  // ============================================
  // HR+ (АСПМ) КАТАЛОГ ТЕСТОВ
  // ============================================
  await seedHrPlusTests(prisma);

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
  console.log('🧠 ПСИХОЛОГ 1:');
  console.log('   Email: psychologist@test.kz');
  console.log('   Password: Psychologist123!');
  console.log('   Имя: Алия Серикова');
  console.log('');
  console.log('🧠 ПСИХОЛОГ 2:');
  console.log('   Email: psychologist2@test.kz');
  console.log('   Password: Psychologist123!');
  console.log('   Имя: Марат Ахметов');
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
