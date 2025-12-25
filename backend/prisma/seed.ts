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
