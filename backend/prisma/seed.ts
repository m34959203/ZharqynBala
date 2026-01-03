import {
  PrismaClient,
  TestCategory,
  QuestionType,
  UserRole,
  Gender,
  SessionStatus,
  ConsultationStatus,
  SubscriptionPlan,
  PaymentStatus,
  PaymentType,
  PaymentProvider
} from '@prisma/client';
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

  // ============================================
  // ДОПОЛНИТЕЛЬНЫЕ КЛИЕНТЫ ДЛЯ ПСИХОЛОГА
  // ============================================

  // Client 1: Асем Нурпеисова
  const client1 = await prisma.user.upsert({
    where: { email: 'asem@mail.kz' },
    update: {},
    create: {
      email: 'asem@mail.kz',
      phone: '+77011234567',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Асем',
      lastName: 'Нурпеисова',
      isVerified: true,
      isActive: true,
    },
  });

  const client1Child1 = await prisma.child.upsert({
    where: { id: 'client1-child-1' },
    update: {},
    create: {
      id: 'client1-child-1',
      parentId: client1.id,
      firstName: 'Айгерим',
      lastName: 'Нурпеисова',
      birthDate: new Date('2012-03-15'),
      gender: Gender.FEMALE,
      schoolName: 'Гимназия №56',
      grade: '7',
    },
  });

  const client1Child2 = await prisma.child.upsert({
    where: { id: 'client1-child-2' },
    update: {},
    create: {
      id: 'client1-child-2',
      parentId: client1.id,
      firstName: 'Алихан',
      lastName: 'Нурпеисов',
      birthDate: new Date('2017-08-20'),
      gender: Gender.MALE,
      schoolName: 'Школа №45',
      grade: '2',
    },
  });

  // Client 2: Марат Сагынбаев
  const client2 = await prisma.user.upsert({
    where: { email: 'marat@mail.kz' },
    update: {},
    create: {
      email: 'marat@mail.kz',
      phone: '+77022345678',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Марат',
      lastName: 'Сагынбаев',
      isVerified: true,
      isActive: true,
    },
  });

  const client2Child1 = await prisma.child.upsert({
    where: { id: 'client2-child-1' },
    update: {},
    create: {
      id: 'client2-child-1',
      parentId: client2.id,
      firstName: 'Алишер',
      lastName: 'Сагынбаев',
      birthDate: new Date('2015-01-10'),
      gender: Gender.MALE,
      schoolName: 'Школа №25',
      grade: '4',
    },
  });

  // Client 3: Динара Жумабаева
  const client3 = await prisma.user.upsert({
    where: { email: 'dinara@mail.kz' },
    update: {},
    create: {
      email: 'dinara@mail.kz',
      phone: '+77073456789',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Динара',
      lastName: 'Жумабаева',
      isVerified: true,
      isActive: true,
    },
  });

  const client3Child1 = await prisma.child.upsert({
    where: { id: 'client3-child-1' },
    update: {},
    create: {
      id: 'client3-child-1',
      parentId: client3.id,
      firstName: 'Камила',
      lastName: 'Жумабаева',
      birthDate: new Date('2011-06-25'),
      gender: Gender.FEMALE,
      schoolName: 'Лицей №71',
      grade: '8',
    },
  });

  // Client 4: Бауыржан Касымов (неактивный)
  const client4 = await prisma.user.upsert({
    where: { email: 'baurzhan@mail.kz' },
    update: {},
    create: {
      email: 'baurzhan@mail.kz',
      phone: '+77054567890',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Бауыржан',
      lastName: 'Касымов',
      isVerified: true,
      isActive: false,
    },
  });

  const client4Child1 = await prisma.child.upsert({
    where: { id: 'client4-child-1' },
    update: {},
    create: {
      id: 'client4-child-1',
      parentId: client4.id,
      firstName: 'Ернар',
      lastName: 'Касымов',
      birthDate: new Date('2016-11-05'),
      gender: Gender.MALE,
      schoolName: 'Школа №33',
      grade: '3',
    },
  });

  // Client 5: Гульнара Ахметова
  const client5 = await prisma.user.upsert({
    where: { email: 'gulnara@mail.kz' },
    update: {},
    create: {
      email: 'gulnara@mail.kz',
      phone: '+77015678901',
      passwordHash,
      role: UserRole.PARENT,
      firstName: 'Гульнара',
      lastName: 'Ахметова',
      isVerified: true,
      isActive: true,
    },
  });

  const client5Child1 = await prisma.child.upsert({
    where: { id: 'client5-child-1' },
    update: {},
    create: {
      id: 'client5-child-1',
      parentId: client5.id,
      firstName: 'Дана',
      lastName: 'Ахметова',
      birthDate: new Date('2013-04-12'),
      gender: Gender.FEMALE,
      schoolName: 'Гимназия №56',
      grade: '6',
    },
  });

  console.log('✅ Additional client parents created');

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

  // ============================================
  // ДЕМО ДАННЫЕ - ДЕТИ
  // ============================================

  // Children for test parent
  const child1 = await prisma.child.upsert({
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

  const child2 = await prisma.child.upsert({
    where: { id: 'test-child-2' },
    update: {},
    create: {
      id: 'test-child-2',
      parentId: testParent.id,
      firstName: 'Айлин',
      lastName: 'Тестова',
      birthDate: new Date('2015-07-10'),
      gender: Gender.FEMALE,
      schoolName: 'Школа-гимназия №25',
      grade: '4',
    },
  });
  console.log('✅ Test children created');

  // ============================================
  // ДЕМО ДАННЫЕ - РЕЗУЛЬТАТЫ ТЕСТОВ
  // ============================================

  // Test sessions and results for child1
  const session1 = await prisma.testSession.upsert({
    where: { id: 'demo-session-1' },
    update: {},
    create: {
      id: 'demo-session-1',
      testId: 'test-anxiety-1',
      childId: child1.id,
      status: SessionStatus.COMPLETED,
      currentQuestion: 5,
      startedAt: new Date('2025-12-20T10:00:00'),
      completedAt: new Date('2025-12-20T10:15:00'),
    },
  });

  await prisma.result.upsert({
    where: { id: 'demo-result-1' },
    update: {},
    create: {
      id: 'demo-result-1',
      sessionId: session1.id,
      totalScore: 8,
      maxScore: 20,
      interpretation: 'Уровень тревожности: Низкий. Ребёнок демонстрирует здоровый уровень эмоциональной устойчивости. Справляется с повседневными стрессами адекватно.',
      recommendations: '• Продолжать поддерживающее общение\n• Поощрять открытое выражение эмоций\n• Сохранять стабильный режим дня',
    },
  });

  const session2 = await prisma.testSession.upsert({
    where: { id: 'demo-session-2' },
    update: {},
    create: {
      id: 'demo-session-2',
      testId: 'test-motivation-1',
      childId: child1.id,
      status: SessionStatus.COMPLETED,
      currentQuestion: 4,
      startedAt: new Date('2025-12-21T14:00:00'),
      completedAt: new Date('2025-12-21T14:12:00'),
    },
  });

  await prisma.result.upsert({
    where: { id: 'demo-result-2' },
    update: {},
    create: {
      id: 'demo-result-2',
      sessionId: session2.id,
      totalScore: 14,
      maxScore: 16,
      interpretation: 'Уровень учебной мотивации: Высокий. Ребёнок проявляет искренний интерес к учёбе и стремится к знаниям.',
      recommendations: '• Поддерживать познавательный интерес\n• Предлагать дополнительные развивающие материалы\n• Поощрять самостоятельное обучение',
    },
  });

  const session3 = await prisma.testSession.upsert({
    where: { id: 'demo-session-3' },
    update: {},
    create: {
      id: 'demo-session-3',
      testId: 'test-emotions-1',
      childId: child1.id,
      status: SessionStatus.COMPLETED,
      currentQuestion: 5,
      startedAt: new Date('2025-12-22T11:00:00'),
      completedAt: new Date('2025-12-22T11:18:00'),
    },
  });

  await prisma.result.upsert({
    where: { id: 'demo-result-3' },
    update: {},
    create: {
      id: 'demo-result-3',
      sessionId: session3.id,
      totalScore: 16,
      maxScore: 20,
      interpretation: 'Эмоциональный интеллект: Выше среднего. Ребёнок хорошо понимает свои и чужие эмоции, умеет сопереживать.',
      recommendations: '• Развивать навыки активного слушания\n• Обсуждать эмоции в разных ситуациях\n• Читать книги с глубоким психологическим содержанием',
    },
  });

  // Test for child2
  const session4 = await prisma.testSession.upsert({
    where: { id: 'demo-session-4' },
    update: {},
    create: {
      id: 'demo-session-4',
      testId: 'test-social-1',
      childId: child2.id,
      status: SessionStatus.COMPLETED,
      currentQuestion: 5,
      startedAt: new Date('2025-12-23T09:00:00'),
      completedAt: new Date('2025-12-23T09:12:00'),
    },
  });

  await prisma.result.upsert({
    where: { id: 'demo-result-4' },
    update: {},
    create: {
      id: 'demo-result-4',
      sessionId: session4.id,
      totalScore: 15,
      maxScore: 20,
      interpretation: 'Социальные навыки: Хорошие. Ребёнок легко находит общий язык со сверстниками и умеет работать в команде.',
      recommendations: '• Поощрять участие в групповых активностях\n• Развивать лидерские качества\n• Учить разрешать конфликты конструктивно',
    },
  });

  console.log('✅ Demo test sessions and results created for testParent children');

  // ============================================
  // РЕЗУЛЬТАТЫ ТЕСТОВ ДЛЯ ВСЕХ КЛИЕНТОВ
  // ============================================

  // Helper function to create test session and result
  const createTestResult = async (
    sessionId: string,
    testId: string,
    childId: string,
    date: string,
    totalScore: number,
    maxScore: number,
    interpretation: string,
    recommendations: string
  ) => {
    const session = await prisma.testSession.upsert({
      where: { id: sessionId },
      update: {},
      create: {
        id: sessionId,
        testId: testId,
        childId: childId,
        status: SessionStatus.COMPLETED,
        currentQuestion: 5,
        startedAt: new Date(date),
        completedAt: new Date(new Date(date).getTime() + 15 * 60 * 1000),
      },
    });

    await prisma.result.upsert({
      where: { id: `result-${sessionId}` },
      update: {},
      create: {
        id: `result-${sessionId}`,
        sessionId: session.id,
        totalScore,
        maxScore,
        interpretation,
        recommendations,
      },
    });
  };

  // Client 1 Children Tests (Айгерим и Алихан Нурпеисовы)
  await createTestResult('session-c1c1-1', 'test-anxiety-1', client1Child1.id, '2025-10-10T10:00:00', 12, 20,
    'Уровень тревожности: Умеренный. Рекомендуется обратить внимание на ситуации, вызывающие беспокойство.',
    '• Регулярные беседы о школьных событиях\n• Техники дыхания при волнении\n• Поддержка при новых ситуациях'
  );
  await createTestResult('session-c1c1-2', 'test-motivation-1', client1Child1.id, '2025-10-25T14:00:00', 12, 16,
    'Уровень мотивации: Хороший. Ребёнок заинтересован в учёбе.',
    '• Поощрять успехи\n• Ставить достижимые цели\n• Развивать самостоятельность'
  );
  await createTestResult('session-c1c1-3', 'test-selfesteem-1', client1Child1.id, '2025-11-15T11:00:00', 10, 12,
    'Самооценка: Адекватная. Ребёнок реалистично оценивает свои способности.',
    '• Продолжать поддержку\n• Хвалить за конкретные достижения'
  );
  await createTestResult('session-c1c1-4', 'test-emotions-1', client1Child1.id, '2025-12-05T09:00:00', 17, 20,
    'Эмоциональный интеллект: Высокий. Отлично понимает свои и чужие эмоции.',
    '• Развивать эмпатию\n• Обсуждать сложные эмоциональные ситуации'
  );

  await createTestResult('session-c1c2-1', 'test-anxiety-1', client1Child2.id, '2025-12-10T10:00:00', 6, 20,
    'Уровень тревожности: Низкий. Ребёнок эмоционально устойчив.',
    '• Поддерживать позитивную атмосферу'
  );
  await createTestResult('session-c1c2-2', 'test-social-1', client1Child2.id, '2025-12-15T14:00:00', 18, 20,
    'Социальные навыки: Отличные. Легко находит друзей.',
    '• Поддерживать общение со сверстниками'
  );

  // Client 2 Children Tests (Алишер Сагынбаев)
  await createTestResult('session-c2c1-1', 'test-attention-1', client2Child1.id, '2025-11-01T10:00:00', 14, 20,
    'Внимание: Требует развития. Есть сложности с концентрацией.',
    '• Короткие задания\n• Частые перерывы\n• Игры на внимание'
  );
  await createTestResult('session-c2c1-2', 'test-motivation-1', client2Child1.id, '2025-11-20T14:00:00', 10, 16,
    'Мотивация: Средняя. Интерес к учёбе неустойчивый.',
    '• Найти интересные темы\n• Геймификация обучения'
  );
  await createTestResult('session-c2c1-3', 'test-learning-style-1', client2Child1.id, '2025-12-10T11:00:00', 14, 16,
    'Стиль обучения: Кинестетический. Лучше усваивает через практику.',
    '• Больше практических заданий\n• Движение во время учёбы'
  );

  // Client 3 Children Tests (Камила Жумабаева)
  await createTestResult('session-c3c1-1', 'test-selfesteem-1', client3Child1.id, '2025-11-15T10:00:00', 7, 12,
    'Самооценка: Заниженная. Требуется работа над уверенностью.',
    '• Регулярная похвала\n• Фокус на сильных сторонах\n• Постепенное повышение сложности задач'
  );
  await createTestResult('session-c3c1-2', 'test-anxiety-1', client3Child1.id, '2025-12-01T14:00:00', 14, 20,
    'Тревожность: Повышенная. Рекомендуется работа с психологом.',
    '• Техники релаксации\n• Работа со страхами\n• Поддержка родителей'
  );
  await createTestResult('session-c3c1-3', 'test-emotions-1', client3Child1.id, '2025-12-12T11:00:00', 12, 20,
    'Эмоциональный интеллект: Средний. Есть потенциал для развития.',
    '• Обсуждение эмоций\n• Чтение книг с эмоциональным содержанием'
  );

  // Client 4 Children Tests (Ернар Касымов)
  await createTestResult('session-c4c1-1', 'test-anxiety-1', client4Child1.id, '2025-06-05T10:00:00', 16, 20,
    'Тревожность: Высокая. Было рекомендовано пройти курс консультаций.',
    '• Работа с психологом\n• Поддержка семьи'
  );
  await createTestResult('session-c4c1-2', 'test-anxiety-1', client4Child1.id, '2025-09-10T14:00:00', 10, 20,
    'Тревожность: Снизилась до умеренной. Положительная динамика.',
    '• Продолжить техники релаксации'
  );
  await createTestResult('session-c4c1-3', 'test-anxiety-1', client4Child1.id, '2025-11-20T11:00:00', 6, 20,
    'Тревожность: Низкая. Отличный результат работы!',
    '• Поддерживать достигнутые результаты'
  );
  await createTestResult('session-c4c1-4', 'test-motivation-1', client4Child1.id, '2025-08-15T10:00:00', 13, 16,
    'Мотивация: Хорошая.',
    '• Поддерживать интерес к учёбе'
  );
  await createTestResult('session-c4c1-5', 'test-social-1', client4Child1.id, '2025-10-01T14:00:00', 15, 20,
    'Социальные навыки: Хорошие.',
    '• Поощрять общение'
  );

  // Client 5 Children Tests (Дана Ахметова)
  await createTestResult('session-c5c1-1', 'test-anxiety-1', client5Child1.id, '2025-11-28T10:00:00', 15, 20,
    'Тревожность: Повышенная. Связана со школой.',
    '• Работа над школьными страхами\n• Техники успокоения'
  );
  await createTestResult('session-c5c1-2', 'test-motivation-1', client5Child1.id, '2025-12-08T14:00:00', 14, 16,
    'Мотивация: Высокая несмотря на тревожность.',
    '• Поддержать интерес\n• Снизить давление'
  );
  await createTestResult('session-c5c1-3', 'test-stress-1', client5Child1.id, '2025-12-18T11:00:00', 8, 16,
    'Стрессоустойчивость: Требует развития.',
    '• Техники управления стрессом\n• Достаточный отдых'
  );

  console.log('✅ Demo test results created for all clients (20+ results)');

  // ============================================
  // ДЕМО ДАННЫЕ - КОНСУЛЬТАЦИИ
  // ============================================

  // Get psychologist profile
  const psychProfile = await prisma.psychologist.findUnique({
    where: { userId: testPsychologist.id }
  });

  if (psychProfile) {
    // ========== Консультации для Асем Нурпеисовой (client1) - 8 консультаций ==========
    const client1Consultations = [
      { id: 'cons-client1-1', date: '2025-10-15T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Очень профессиональный подход!', notes: 'Первичная консультация. Обсудили проблемы с адаптацией в школе.' },
      { id: 'cons-client1-2', date: '2025-10-29T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Рекомендации очень помогли', notes: 'Повторная консультация. Улучшение в поведении.' },
      { id: 'cons-client1-3', date: '2025-11-12T14:00:00', status: ConsultationStatus.COMPLETED, rating: 4, review: 'Хороший специалист', notes: 'Работа над эмоциональной регуляцией.' },
      { id: 'cons-client1-4', date: '2025-11-26T09:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Замечательно!', notes: 'Позитивная динамика.' },
      { id: 'cons-client1-5', date: '2025-12-05T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Ребёнок стал увереннее', notes: 'Закрепление результатов.' },
      { id: 'cons-client1-6', date: '2025-12-12T15:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Отличная работа!', notes: 'Консультация по второму ребёнку.' },
      { id: 'cons-client1-7', date: '2025-12-20T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Спасибо за помощь!', notes: 'Подготовка к зимним каникулам.' },
      { id: 'cons-client1-8', date: '2025-12-30T10:00:00', status: ConsultationStatus.SCHEDULED, notes: 'Запланированная консультация.' },
    ];

    for (const cons of client1Consultations) {
      await prisma.consultation.upsert({
        where: { id: cons.id },
        update: {},
        create: {
          id: cons.id,
          psychologistId: psychProfile.id,
          parentId: client1.id,
          childId: client1Child1.id,
          scheduledAt: new Date(cons.date),
          durationMinutes: 60,
          status: cons.status,
          meetingUrl: `https://meet.google.com/${cons.id}`,
          price: 15000,
          notes: cons.notes,
          rating: cons.rating,
          review: cons.review,
          completedAt: cons.status === ConsultationStatus.COMPLETED ? new Date(new Date(cons.date).getTime() + 60 * 60 * 1000) : undefined,
        },
      });
    }

    // ========== Консультации для Марата Сагынбаева (client2) - 5 консультаций ==========
    const client2Consultations = [
      { id: 'cons-client2-1', date: '2025-11-05T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Прекрасный психолог!', notes: 'Первичная консультация. Проблемы с концентрацией.' },
      { id: 'cons-client2-2', date: '2025-11-19T14:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Очень помог!', notes: 'Работа над вниманием.' },
      { id: 'cons-client2-3', date: '2025-12-03T11:00:00', status: ConsultationStatus.COMPLETED, rating: 4, review: 'Хорошие результаты', notes: 'Игровая терапия.' },
      { id: 'cons-client2-4', date: '2025-12-18T09:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Рекомендую!', notes: 'Подведение итогов.' },
      { id: 'cons-client2-5', date: '2025-12-29T15:00:00', status: ConsultationStatus.SCHEDULED, notes: 'Планируемый контроль.' },
    ];

    for (const cons of client2Consultations) {
      await prisma.consultation.upsert({
        where: { id: cons.id },
        update: {},
        create: {
          id: cons.id,
          psychologistId: psychProfile.id,
          parentId: client2.id,
          childId: client2Child1.id,
          scheduledAt: new Date(cons.date),
          durationMinutes: 60,
          status: cons.status,
          meetingUrl: `https://meet.google.com/${cons.id}`,
          price: 15000,
          notes: cons.notes,
          rating: cons.rating,
          review: cons.review,
          completedAt: cons.status === ConsultationStatus.COMPLETED ? new Date(new Date(cons.date).getTime() + 60 * 60 * 1000) : undefined,
        },
      });
    }

    // ========== Консультации для Динары Жумабаевой (client3) - 3 консультации ==========
    const client3Consultations = [
      { id: 'cons-client3-1', date: '2025-11-20T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Отличный опыт!', notes: 'Первичная консультация. Подростковые проблемы.' },
      { id: 'cons-client3-2', date: '2025-12-04T14:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Очень благодарна!', notes: 'Работа над самооценкой.' },
      { id: 'cons-client3-3', date: '2025-12-15T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Дочь стала открытее', notes: 'Положительные изменения.' },
    ];

    for (const cons of client3Consultations) {
      await prisma.consultation.upsert({
        where: { id: cons.id },
        update: {},
        create: {
          id: cons.id,
          psychologistId: psychProfile.id,
          parentId: client3.id,
          childId: client3Child1.id,
          scheduledAt: new Date(cons.date),
          durationMinutes: 60,
          status: cons.status,
          meetingUrl: `https://meet.google.com/${cons.id}`,
          price: 15000,
          notes: cons.notes,
          rating: cons.rating,
          review: cons.review,
          completedAt: cons.status === ConsultationStatus.COMPLETED ? new Date(new Date(cons.date).getTime() + 60 * 60 * 1000) : undefined,
        },
      });
    }

    // ========== Консультации для Бауыржана Касымова (client4, неактивный) - 12 консультаций ==========
    const client4Consultations = [
      { id: 'cons-client4-1', date: '2025-06-10T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Первичная консультация.' },
      { id: 'cons-client4-2', date: '2025-06-24T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Продолжение работы.' },
      { id: 'cons-client4-3', date: '2025-07-08T14:00:00', status: ConsultationStatus.COMPLETED, rating: 4, notes: 'Регулярная сессия.' },
      { id: 'cons-client4-4', date: '2025-07-22T09:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Хорошая динамика.' },
      { id: 'cons-client4-5', date: '2025-08-05T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Работа над страхами.' },
      { id: 'cons-client4-6', date: '2025-08-19T15:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Прогресс заметен.' },
      { id: 'cons-client4-7', date: '2025-09-02T11:00:00', status: ConsultationStatus.COMPLETED, rating: 4, notes: 'Подготовка к школе.' },
      { id: 'cons-client4-8', date: '2025-09-16T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Адаптация к школе.' },
      { id: 'cons-client4-9', date: '2025-09-30T14:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Контрольная сессия.' },
      { id: 'cons-client4-10', date: '2025-10-14T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Закрепление.' },
      { id: 'cons-client4-11', date: '2025-10-28T09:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Завершающая сессия.' },
      { id: 'cons-client4-12', date: '2025-11-28T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, notes: 'Последняя консультация.' },
    ];

    for (const cons of client4Consultations) {
      await prisma.consultation.upsert({
        where: { id: cons.id },
        update: {},
        create: {
          id: cons.id,
          psychologistId: psychProfile.id,
          parentId: client4.id,
          childId: client4Child1.id,
          scheduledAt: new Date(cons.date),
          durationMinutes: 60,
          status: cons.status,
          meetingUrl: `https://meet.google.com/${cons.id}`,
          price: 15000,
          notes: cons.notes,
          rating: cons.rating,
          completedAt: cons.status === ConsultationStatus.COMPLETED ? new Date(new Date(cons.date).getTime() + 60 * 60 * 1000) : undefined,
        },
      });
    }

    // ========== Консультации для Гульнары Ахметовой (client5) - 4 консультации ==========
    const client5Consultations = [
      { id: 'cons-client5-1', date: '2025-12-02T10:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Отличный специалист!', notes: 'Первичная консультация. Школьная тревожность.' },
      { id: 'cons-client5-2', date: '2025-12-10T14:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Очень довольны!', notes: 'Работа над тревожностью.' },
      { id: 'cons-client5-3', date: '2025-12-19T11:00:00', status: ConsultationStatus.COMPLETED, rating: 5, review: 'Результаты видны!', notes: 'Техники релаксации.' },
      { id: 'cons-client5-4', date: '2025-12-27T10:00:00', status: ConsultationStatus.SCHEDULED, notes: 'Плановая консультация.' },
    ];

    for (const cons of client5Consultations) {
      await prisma.consultation.upsert({
        where: { id: cons.id },
        update: {},
        create: {
          id: cons.id,
          psychologistId: psychProfile.id,
          parentId: client5.id,
          childId: client5Child1.id,
          scheduledAt: new Date(cons.date),
          durationMinutes: 60,
          status: cons.status,
          meetingUrl: `https://meet.google.com/${cons.id}`,
          price: 15000,
          notes: cons.notes,
          rating: cons.rating,
          review: cons.review,
          completedAt: cons.status === ConsultationStatus.COMPLETED ? new Date(new Date(cons.date).getTime() + 60 * 60 * 1000) : undefined,
        },
      });
    }

    // ========== Консультации для testParent ==========
    await prisma.consultation.upsert({
      where: { id: 'demo-consultation-1' },
      update: {},
      create: {
        id: 'demo-consultation-1',
        psychologistId: psychProfile.id,
        parentId: testParent.id,
        childId: child1.id,
        scheduledAt: new Date('2025-12-18T10:00:00'),
        durationMinutes: 60,
        status: ConsultationStatus.COMPLETED,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        price: 15000,
        notes: 'Первичная консультация. Обсудили результаты тестов на тревожность.',
        rating: 5,
        review: 'Отличный специалист!',
        completedAt: new Date('2025-12-18T11:00:00'),
      },
    });

    await prisma.consultation.upsert({
      where: { id: 'demo-consultation-2' },
      update: {},
      create: {
        id: 'demo-consultation-2',
        psychologistId: psychProfile.id,
        parentId: testParent.id,
        childId: child1.id,
        scheduledAt: new Date('2025-12-22T15:00:00'),
        durationMinutes: 45,
        status: ConsultationStatus.COMPLETED,
        meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
        price: 12000,
        notes: 'Повторная консультация. Положительная динамика.',
        rating: 5,
        review: 'Видим улучшения!',
        completedAt: new Date('2025-12-22T15:45:00'),
      },
    });

    await prisma.consultation.upsert({
      where: { id: 'demo-consultation-3' },
      update: {},
      create: {
        id: 'demo-consultation-3',
        psychologistId: psychProfile.id,
        parentId: testParent.id,
        childId: child2.id,
        scheduledAt: new Date('2025-12-28T14:00:00'),
        durationMinutes: 60,
        status: ConsultationStatus.SCHEDULED,
        meetingUrl: 'https://meet.google.com/new-meet-url',
        price: 15000,
        notes: null,
      },
    });

    // Psychologist availability slots (dayOfWeek: 0=Monday to 6=Sunday)
    // Create availability for weekdays (Monday-Friday)
    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
      for (let hour = 9; hour <= 17; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        const slotId = `avail-${psychProfile.id}-${dayOfWeek}-${hour}`;

        await prisma.psychologistAvailability.upsert({
          where: { id: slotId },
          update: {},
          create: {
            id: slotId,
            psychologistId: psychProfile.id,
            dayOfWeek: dayOfWeek,
            startTime: startTime,
            endTime: endTime,
          },
        });
      }
    }

    console.log('✅ Demo consultations and availability created (35+ consultations)');
  }

  // ============================================
  // ДЕМО ДАННЫЕ - УЧЕНИКИ В КЛАССАХ
  // ============================================

  const schoolClasses = await prisma.schoolClass.findMany({
    where: { schoolId: school.id }
  });

  const studentNames = [
    { firstName: 'Алихан', lastName: 'Сериков', gender: Gender.MALE },
    { firstName: 'Дана', lastName: 'Нурланова', gender: Gender.FEMALE },
    { firstName: 'Темирлан', lastName: 'Касымов', gender: Gender.MALE },
    { firstName: 'Айгерим', lastName: 'Бектурова', gender: Gender.FEMALE },
    { firstName: 'Нурсултан', lastName: 'Омаров', gender: Gender.MALE },
    { firstName: 'Камила', lastName: 'Жумабекова', gender: Gender.FEMALE },
    { firstName: 'Ерболат', lastName: 'Сатпаев', gender: Gender.MALE },
    { firstName: 'Асель', lastName: 'Мухамедова', gender: Gender.FEMALE },
    { firstName: 'Бауыржан', lastName: 'Токаев', gender: Gender.MALE },
    { firstName: 'Жанель', lastName: 'Алиева', gender: Gender.FEMALE },
    { firstName: 'Санжар', lastName: 'Кенжебаев', gender: Gender.MALE },
    { firstName: 'Мадина', lastName: 'Ахметова', gender: Gender.FEMALE },
  ];

  let studentIndex = 0;
  for (const cls of schoolClasses) {
    // Add 6-8 students per class
    const studentsCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < studentsCount && studentIndex < studentNames.length * 2; i++) {
      const nameData = studentNames[studentIndex % studentNames.length];
      const studentId = `student-${cls.id}-${i + 1}`;

      const birthYear = 2025 - cls.grade - 6;
      const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));

      await prisma.student.upsert({
        where: { id: studentId },
        update: {},
        create: {
          id: studentId,
          classId: cls.id,
          firstName: nameData.firstName,
          lastName: nameData.lastName + (studentIndex >= studentNames.length ? 'а' : ''),
          birthDate: birthDate,
          gender: nameData.gender,
        },
      });
      studentIndex++;
    }
  }
  console.log('✅ Demo students created');

  // ============================================
  // ДЕМО ДАННЫЕ - ПОДПИСКИ
  // ============================================

  await prisma.subscription.upsert({
    where: { id: 'demo-subscription-1' },
    update: {},
    create: {
      id: 'demo-subscription-1',
      userId: testParent.id,
      plan: SubscriptionPlan.STANDARD,
      startedAt: new Date('2025-12-01'),
      expiresAt: new Date('2026-01-01'),
      isActive: true,
      autoRenew: true,
      diagnosticsLeft: 8,
    },
  });

  await prisma.subscription.upsert({
    where: { id: 'demo-subscription-2' },
    update: {},
    create: {
      id: 'demo-subscription-2',
      userId: demoParent.id,
      plan: SubscriptionPlan.BASIC,
      startedAt: new Date('2025-11-15'),
      expiresAt: new Date('2025-12-15'),
      isActive: false,
      autoRenew: false,
      diagnosticsLeft: 0,
    },
  });
  console.log('✅ Demo subscriptions created');

  // ============================================
  // ДЕМО ДАННЫЕ - ПЛАТЕЖИ
  // ============================================

  // Subscription payments
  await prisma.payment.upsert({
    where: { id: 'demo-payment-1' },
    update: {},
    create: {
      id: 'demo-payment-1',
      userId: testParent.id,
      amount: 5000,
      currency: 'KZT',
      paymentType: PaymentType.SUBSCRIPTION,
      relatedId: 'demo-subscription-1',
      provider: PaymentProvider.KASPI,
      externalId: 'KASPI-12345678',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date('2025-12-01T10:00:00'),
      completedAt: new Date('2025-12-01T10:01:00'),
    },
  });

  // Consultation payments
  await prisma.payment.upsert({
    where: { id: 'demo-payment-2' },
    update: {},
    create: {
      id: 'demo-payment-2',
      userId: testParent.id,
      amount: 15000,
      currency: 'KZT',
      paymentType: PaymentType.CONSULTATION,
      relatedId: 'demo-consultation-1',
      provider: PaymentProvider.KASPI,
      externalId: 'KASPI-23456789',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date('2025-12-17T18:00:00'),
      completedAt: new Date('2025-12-17T18:02:00'),
    },
  });

  await prisma.payment.upsert({
    where: { id: 'demo-payment-3' },
    update: {},
    create: {
      id: 'demo-payment-3',
      userId: testParent.id,
      amount: 12000,
      currency: 'KZT',
      paymentType: PaymentType.CONSULTATION,
      relatedId: 'demo-consultation-2',
      provider: PaymentProvider.KASPI,
      externalId: 'KASPI-34567890',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date('2025-12-21T20:00:00'),
      completedAt: new Date('2025-12-21T20:01:00'),
    },
  });

  // Pending payment for upcoming consultation
  await prisma.payment.upsert({
    where: { id: 'demo-payment-4' },
    update: {},
    create: {
      id: 'demo-payment-4',
      userId: testParent.id,
      amount: 15000,
      currency: 'KZT',
      paymentType: PaymentType.CONSULTATION,
      relatedId: 'demo-consultation-3',
      provider: PaymentProvider.KASPI,
      externalId: 'KASPI-45678901',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date('2025-12-26T09:00:00'),
      completedAt: new Date('2025-12-26T09:01:00'),
    },
  });

  // Diagnostic payment
  await prisma.payment.upsert({
    where: { id: 'demo-payment-5' },
    update: {},
    create: {
      id: 'demo-payment-5',
      userId: testParent.id,
      amount: 3500,
      currency: 'KZT',
      paymentType: PaymentType.DIAGNOSTIC,
      relatedId: 'test-selfesteem-1',
      provider: PaymentProvider.KASPI,
      externalId: 'KASPI-56789012',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date('2025-12-15T14:00:00'),
      completedAt: new Date('2025-12-15T14:00:30'),
    },
  });

  console.log('✅ Demo payments created');

  // ============================================
  // ДЕМО ДАННЫЕ - ГРУППОВЫЕ ТЕСТЫ (ШКОЛА)
  // ============================================

  if (schoolClasses.length > 0) {
    // Completed group test
    await prisma.groupTest.upsert({
      where: { id: 'demo-group-test-1' },
      update: {},
      create: {
        id: 'demo-group-test-1',
        schoolId: school.id,
        classId: schoolClasses[0].id,
        testId: 'test-anxiety-1',
        assignedAt: new Date('2025-12-15'),
        deadline: new Date('2025-12-20'),
        completedCount: 6,
        totalCount: 6,
      },
    });

    // In-progress group test
    await prisma.groupTest.upsert({
      where: { id: 'demo-group-test-2' },
      update: {},
      create: {
        id: 'demo-group-test-2',
        schoolId: school.id,
        classId: schoolClasses[1].id,
        testId: 'test-motivation-1',
        assignedAt: new Date('2025-12-22'),
        deadline: new Date('2025-12-30'),
        completedCount: 3,
        totalCount: 7,
      },
    });

    // Scheduled group test
    await prisma.groupTest.upsert({
      where: { id: 'demo-group-test-3' },
      update: {},
      create: {
        id: 'demo-group-test-3',
        schoolId: school.id,
        classId: schoolClasses[2].id,
        testId: 'test-social-1',
        assignedAt: new Date('2025-12-26'),
        deadline: new Date('2026-01-10'),
        completedCount: 0,
        totalCount: 8,
      },
    });

    console.log('✅ Demo group tests created');
  }

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
