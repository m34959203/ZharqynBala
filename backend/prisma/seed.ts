import { PrismaClient, TestCategory, QuestionType, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users for each role
  const passwordHash = await bcrypt.hash('Test123!', 12);

  // ============================================
  // ТЕСТОВЫЕ АККАУНТЫ ДЛЯ КАЖДОЙ РОЛИ
  // ============================================

  // 1. Parent (Родитель)
  const testParent = await prisma.user.upsert({
    where: { email: 'parent@test.kz' },
    update: {},
    create: {
      email: 'parent@test.kz',
      phone: '+77011111111',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Айгуль',
      lastName: 'Тестова',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test parent created:', testParent.email);

  // 2. Psychologist (Психолог)
  const testPsychologist = await prisma.user.upsert({
    where: { email: 'psychologist@test.kz' },
    update: {},
    create: {
      email: 'psychologist@test.kz',
      phone: '+77022222222',
      passwordHash,
      role: UserRole.PSYCHOLOGIST,
      firstName: 'Марат',
      lastName: 'Психологов',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test psychologist created:', testPsychologist.email);

  // Create psychologist profile
  await prisma.psychologist.upsert({
    where: { userId: testPsychologist.id },
    update: {},
    create: {
      userId: testPsychologist.id,
      specialization: ['Детская психология', 'Тревожность', 'Семейная терапия'],
      experienceYears: 8,
      education: 'КазНУ им. аль-Фараби, факультет психологии',
      hourlyRate: 15000,
      bio: 'Опытный детский психолог с 8-летним стажем. Специализируюсь на работе с тревожностью и школьными проблемами.',
      isApproved: true,
      isAvailable: true,
      rating: 4.8,
      totalConsultations: 156,
    },
  });
  console.log('✅ Psychologist profile created');

  // 3. School (Школа)
  const testSchool = await prisma.user.upsert({
    where: { email: 'school@test.kz' },
    update: {},
    create: {
      email: 'school@test.kz',
      phone: '+77033333333',
      passwordHash,
      role: UserRole.SCHOOL,
      firstName: 'Гульнара',
      lastName: 'Директорова',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test school created:', testSchool.email);

  // Create school profile
  const school = await prisma.school.upsert({
    where: { userId: testSchool.id },
    update: {},
    create: {
      userId: testSchool.id,
      schoolName: 'Школа-гимназия №25',
      region: 'Алматы',
      city: 'Алматы',
      address: 'ул. Абая, 123',
      contactPerson: 'Гульнара Директорова',
      contactPhone: '+77033333333',
      totalStudents: 450,
      subscriptionUntil: new Date('2025-12-31'),
    },
  });
  console.log('✅ School profile created');

  // Create school classes
  const classes = [
    { grade: 5, letter: 'А' },
    { grade: 5, letter: 'Б' },
    { grade: 6, letter: 'А' },
    { grade: 7, letter: 'А' },
  ];
  for (const cls of classes) {
    await prisma.schoolClass.upsert({
      where: {
        schoolId_grade_letter_academicYear: {
          schoolId: school.id,
          grade: cls.grade,
          letter: cls.letter,
          academicYear: '2024-2025',
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        grade: cls.grade,
        letter: cls.letter,
        academicYear: '2024-2025',
      },
    });
  }
  console.log('✅ School classes created');

  // 4. Admin (Администратор)
  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@zharqynbala.kz' },
    update: {},
    create: {
      email: 'admin@zharqynbala.kz',
      phone: '+77044444444',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'Админ',
      lastName: 'Системы',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test admin created:', testAdmin.email);

  // ============================================
  // ДЕМО АККАУНТ (старый)
  // ============================================

  // Demo parent (для обратной совместимости)
  const demoParent = await prisma.user.upsert({
    where: { email: 'demo@zharqynbala.kz' },
    update: {},
    create: {
      email: 'demo@zharqynbala.kz',
      phone: '+77001234567',
      passwordHash: await bcrypt.hash('Demo123!', 12),
      role: UserRole.PARENT,
      firstName: 'Демо',
      lastName: 'Пользователь',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo parent created:', demoParent.email);

  // Demo child
  const demoChild = await prisma.child.upsert({
    where: { id: 'demo-child-1' },
    update: {},
    create: {
      id: 'demo-child-1',
      parentId: demoParent.id,
      firstName: 'Алия',
      lastName: 'Демо',
      birthDate: new Date('2012-05-15'),
      gender: Gender.FEMALE,
      schoolName: 'Школа №25',
      grade: '7',
    },
  });
  console.log('✅ Demo child created:', demoChild.firstName);

  // Create tests
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

  // Questions for Anxiety Test
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

  // Add questions for Anxiety Test
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

  // Questions for Motivation Test
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

  // Questions for Self-Esteem Test
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

  // Questions for Attention Test
  const attentionQuestions = [
    {
      questionTextRu: 'Как часто тебе сложно сосредоточиться на задании?',
      questionTextKz: 'Саған тапсырмаға шоғырлану қаншалықты қиын?',
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
      questionTextRu: 'Ты легко отвлекаешься на посторонние звуки?',
      questionTextKz: 'Сен бөгде дыбыстарға тез алаңдайсың ба?',
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
      questionTextRu: 'Можешь ли ты долго заниматься одним делом?',
      questionTextKz: 'Сен бір іспен ұзақ айналыса аласың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Нет, быстро переключаюсь', textKz: 'Жоқ, тез ауысамын', score: 4 },
        { textRu: 'Несколько минут', textKz: 'Бірнеше минут', score: 3 },
        { textRu: '15-20 минут', textKz: '15-20 минут', score: 2 },
        { textRu: '30-40 минут', textKz: '30-40 минут', score: 1 },
        { textRu: 'Больше часа', textKz: 'Бір сағаттан артық', score: 0 },
      ],
    },
    {
      questionTextRu: 'Забываешь ли ты о чём говорил учитель?',
      questionTextKz: 'Мұғалім не айтқанын ұмытып қаласың ба?',
      questionType: QuestionType.YES_NO,
      options: [
        { textRu: 'Да, часто', textKz: 'Иә, жиі', score: 3 },
        { textRu: 'Нет, помню хорошо', textKz: 'Жоқ, жақсы есімде', score: 0 },
      ],
    },
    {
      questionTextRu: 'Как ты себя чувствуешь после длинного урока?',
      questionTextKz: 'Ұзақ сабақтан кейін өзіңді қалай сезінесің?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Бодрым и внимательным', textKz: 'Сергек және зейінді', score: 0 },
        { textRu: 'Немного устал', textKz: 'Біраз шаршадым', score: 1 },
        { textRu: 'Устал и хочу отдохнуть', textKz: 'Шаршап, демалғым келеді', score: 2 },
        { textRu: 'Очень устал, голова болит', textKz: 'Өте шаршадым, басым ауырады', score: 3 },
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

  // Questions for Emotional Intelligence Test
  const emotionsQuestions = [
    {
      questionTextRu: 'Я понимаю, когда мой друг грустит, даже если он ничего не говорит',
      questionTextKz: 'Досым еш нәрсе айтпаса да, оның қайғылы екенін түсінемін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Я умею контролировать свой гнев',
      questionTextKz: 'Мен ашуымды бақылай аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Я могу объяснить, почему я чувствую себя определённым образом',
      questionTextKz: 'Мен өзімді неге солай сезінетінімді түсіндіре аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Когда мне грустно, я знаю, как себя утешить',
      questionTextKz: 'Қайғырғанда өзімді жұбататыны білемін',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Я могу поставить себя на место другого человека',
      questionTextKz: 'Мен өзімді басқа адамның орнына қоя аламын',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
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
    console.log('✅ Emotional Intelligence test questions created');
  }

  // Questions for Social Skills Test
  const socialQuestions = [
    {
      questionTextRu: 'Легко ли тебе заводить новых друзей?',
      questionTextKz: 'Саған жаңа достар табу оңай ма?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Очень трудно', textKz: 'Өте қиын', score: 0 },
        { textRu: 'Трудно', textKz: 'Қиын', score: 1 },
        { textRu: 'Нормально', textKz: 'Қалыпты', score: 2 },
        { textRu: 'Легко', textKz: 'Оңай', score: 3 },
        { textRu: 'Очень легко', textKz: 'Өте оңай', score: 4 },
      ],
    },
    {
      questionTextRu: 'Ты помогаешь одноклассникам, если они не понимают задание?',
      questionTextKz: 'Сыныптастарың тапсырманы түсінбесе, көмектесесің бе?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
        { textRu: 'Редко', textKz: 'Сирек', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Часто', textKz: 'Жиі', score: 3 },
        { textRu: 'Всегда', textKz: 'Әрқашан', score: 4 },
      ],
    },
    {
      questionTextRu: 'Как ты реагируешь, когда с тобой не соглашаются?',
      questionTextKz: 'Сенімен келіспегенде қалай әрекет етесің?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Злюсь и ухожу', textKz: 'Ашуланып кетемін', score: 0 },
        { textRu: 'Молчу, но обижаюсь', textKz: 'Үндемеймін, бірақ ренжимін', score: 1 },
        { textRu: 'Пытаюсь понять их точку зрения', textKz: 'Олардың көзқарасын түсінуге тырысамын', score: 3 },
        { textRu: 'Спокойно обсуждаю', textKz: 'Тыныш талқылаймын', score: 4 },
      ],
    },
    {
      questionTextRu: 'Нравится ли тебе работать в команде?',
      questionTextKz: 'Саған командада жұмыс істеу ұнай ма?',
      questionType: QuestionType.YES_NO,
      options: [
        { textRu: 'Да', textKz: 'Иә', score: 4 },
        { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      ],
    },
    {
      questionTextRu: 'Ты умеешь слушать других людей?',
      questionTextKz: 'Сен басқа адамдарды тыңдай аласың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Нет, часто перебиваю', textKz: 'Жоқ, жиі бөлемін', score: 0 },
        { textRu: 'Иногда слушаю', textKz: 'Кейде тыңдаймын', score: 2 },
        { textRu: 'Да, слушаю внимательно', textKz: 'Иә, зейін қойып тыңдаймын', score: 4 },
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
    console.log('✅ Social Skills test questions created');
  }

  // Questions for Stress Resilience Test
  const stressQuestions = [
    {
      questionTextRu: 'Как ты себя чувствуешь перед важным событием (экзамен, выступление)?',
      questionTextKz: 'Маңызды оқиғаның алдында (емтихан, сахнаға шығу) өзіңді қалай сезінесің?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Очень нервничаю', textKz: 'Өте дүрлігемін', score: 0 },
        { textRu: 'Немного волнуюсь', textKz: 'Біраз толқимын', score: 1 },
        { textRu: 'Нормально', textKz: 'Қалыпты', score: 2 },
        { textRu: 'Спокойно', textKz: 'Тыныш', score: 3 },
        { textRu: 'Совсем не волнуюсь', textKz: 'Мүлдем толқымаймын', score: 4 },
      ],
    },
    {
      questionTextRu: 'Что ты делаешь, когда что-то не получается?',
      questionTextKz: 'Бір нәрсе шықпаған кезде не істейсің?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Бросаю и ухожу', textKz: 'Тастап кетемін', score: 0 },
        { textRu: 'Расстраиваюсь и плачу', textKz: 'Ренжіп жылаймын', score: 1 },
        { textRu: 'Прошу помощи', textKz: 'Көмек сұраймын', score: 3 },
        { textRu: 'Пробую снова', textKz: 'Қайта тырысамын', score: 4 },
      ],
    },
    {
      questionTextRu: 'Ты умеешь успокаиваться, когда злишься?',
      questionTextKz: 'Ашуланғанда тыныштала аласың ба?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Нет, долго злюсь', textKz: 'Жоқ, ұзақ ашуланамын', score: 0 },
        { textRu: 'Через какое-то время', textKz: 'Біраз уақыттан кейін', score: 2 },
        { textRu: 'Да, быстро успокаиваюсь', textKz: 'Иә, тез тыныштанамын', score: 4 },
      ],
    },
    {
      questionTextRu: 'Как часто ты чувствуешь себя уставшим?',
      questionTextKz: 'Өзіңді шаршағандай қаншалықты жиі сезінесің?',
      questionType: QuestionType.SCALE,
      options: [
        { textRu: 'Каждый день', textKz: 'Күн сайын', score: 0 },
        { textRu: 'Часто', textKz: 'Жиі', score: 1 },
        { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
        { textRu: 'Редко', textKz: 'Сирек', score: 3 },
        { textRu: 'Почти никогда', textKz: 'Әрең', score: 4 },
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
    console.log('✅ Stress Resilience test questions created');
  }

  // Questions for Learning Style Test
  const learningQuestions = [
    {
      questionTextRu: 'Как тебе легче запомнить новую информацию?',
      questionTextKz: 'Жаңа ақпаратты қалай жеңіл есте сақтайсың?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Послушать объяснение', textKz: 'Түсіндірмені тыңдау', score: 1 },
        { textRu: 'Прочитать текст', textKz: 'Мәтінді оқу', score: 2 },
        { textRu: 'Посмотреть видео или картинки', textKz: 'Видео немесе суреттерді көру', score: 3 },
        { textRu: 'Сделать что-то руками', textKz: 'Қолмен бірдеме жасау', score: 4 },
      ],
    },
    {
      questionTextRu: 'Когда учитель объясняет новую тему, ты:',
      questionTextKz: 'Мұғалім жаңа тақырыпты түсіндіргенде сен:',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Внимательно слушаю', textKz: 'Зейін қойып тыңдаймын', score: 1 },
        { textRu: 'Записываю главное', textKz: 'Бастысын жазамын', score: 2 },
        { textRu: 'Смотрю на доску', textKz: 'Тақтаға қараймын', score: 3 },
        { textRu: 'Хочу сразу попробовать', textKz: 'Бірден көріп көргім келеді', score: 4 },
      ],
    },
    {
      questionTextRu: 'Какие уроки тебе больше нравятся?',
      questionTextKz: 'Қандай сабақтар саған көбірек ұнайды?',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Где много обсуждений', textKz: 'Көп талқылау болатын', score: 1 },
        { textRu: 'Где нужно много читать', textKz: 'Көп оқу керек', score: 2 },
        { textRu: 'С презентациями и видео', textKz: 'Презентациялар мен видео бар', score: 3 },
        { textRu: 'С практическими заданиями', textKz: 'Тәжірибелік тапсырмалар бар', score: 4 },
      ],
    },
    {
      questionTextRu: 'Ты лучше запоминаешь:',
      questionTextKz: 'Сен жақсырақ есте сақтайсың:',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        { textRu: 'Что слышал', textKz: 'Естігенді', score: 1 },
        { textRu: 'Что читал', textKz: 'Оқығанды', score: 2 },
        { textRu: 'Что видел', textKz: 'Көргенді', score: 3 },
        { textRu: 'Что делал сам', textKz: 'Өзің жасағанды', score: 4 },
      ],
    },
  ];

  const learningTest = await prisma.test.findUnique({ where: { id: 'test-learning-style-1' } });
  if (learningTest) {
    for (let i = 0; i < learningQuestions.length; i++) {
      const q = learningQuestions[i];
      const question = await prisma.question.upsert({
        where: { id: `learning-q-${i + 1}` },
        update: {},
        create: {
          id: `learning-q-${i + 1}`,
          testId: learningTest.id,
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
          where: { id: `learning-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `learning-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }
    console.log('✅ Learning Style test questions created');
  }

  // Child for test parent
  await prisma.child.upsert({
    where: { id: 'test-child-1' },
    update: {},
    create: {
      id: 'test-child-1',
      parentId: testParent.id,
      firstName: 'Арман',
      lastName: 'Тестов',
      birthDate: new Date('2013-03-20'),
      gender: Gender.MALE,
      schoolName: 'Школа-гимназия №25',
      grade: '6',
    },
  });
  console.log('✅ Test child created');

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 ТЕСТОВЫЕ АККАУНТЫ (пароль для всех: Test123!)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('👨‍👩‍👧 РОДИТЕЛЬ:');
  console.log('   Email: parent@test.kz');
  console.log('   Password: Test123!');
  console.log('');
  console.log('🧠 ПСИХОЛОГ:');
  console.log('   Email: psychologist@test.kz');
  console.log('   Password: Test123!');
  console.log('');
  console.log('🏫 ШКОЛА:');
  console.log('   Email: school@test.kz');
  console.log('   Password: Test123!');
  console.log('');
  console.log('⚙️ АДМИН:');
  console.log('   Email: admin@zharqynbala.kz');
  console.log('   Password: Test123!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 ДЕМО АККАУНТ (старый):');
  console.log('   Email: demo@zharqynbala.kz');
  console.log('   Password: Demo123!');
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
