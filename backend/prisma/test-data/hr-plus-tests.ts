/**
 * HR+ (АСПМ) каталог валидированных психологических тестов
 * 15 стандартизированных методик для школ Казахстана
 */

import { TestCategory, QuestionType, PrismaClient } from '@prisma/client';

// ============================================
// 1. Спилбергер-Ханин (ситуативная тревожность)
// ============================================

const spielbergerHaninTest = {
  id: 'test-spielberger-hanin',
  titleRu: 'Ситуативная тревожность (Спилбергер-Ханин)',
  titleKz: 'Жағдайлық үрейлілік (Спилбергер-Ханин)',
  descriptionRu: 'Шкала ситуативной тревожности Спилбергера в адаптации Ханина. Оценивает текущий уровень тревоги и эмоционального напряжения.',
  descriptionKz: 'Ханин бейімдеуіндегі Спилбергердің жағдайлық үрейлілік шкаласы. Ағымдағы үрей мен эмоционалдық күйзеліс деңгейін бағалайды.',
  category: TestCategory.ANXIETY,
  ageMin: 12,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 10,
};

const spielbergerHaninQuestions = [
  {
    questionTextRu: 'Я чувствую себя свободно',
    questionTextKz: 'Мен өзімді еркін сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 4 },
      { textRu: 'Немного', textKz: 'Аздап', score: 3 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 2 },
      { textRu: 'Очень', textKz: 'Өте', score: 1 },
    ],
  },
  {
    questionTextRu: 'Я нервничаю',
    questionTextKz: 'Мен жүйкемді тоздырамын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 1 },
      { textRu: 'Немного', textKz: 'Аздап', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень', textKz: 'Өте', score: 4 },
    ],
  },
  {
    questionTextRu: 'Мне спокойно',
    questionTextKz: 'Маған тыныш',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 4 },
      { textRu: 'Немного', textKz: 'Аздап', score: 3 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 2 },
      { textRu: 'Очень', textKz: 'Өте', score: 1 },
    ],
  },
  {
    questionTextRu: 'Я расстроен',
    questionTextKz: 'Мен ренжігенмін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 1 },
      { textRu: 'Немного', textKz: 'Аздап', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень', textKz: 'Өте', score: 4 },
    ],
  },
  {
    questionTextRu: 'Я чувствую себя уверенно',
    questionTextKz: 'Мен өзімді сенімді сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 4 },
      { textRu: 'Немного', textKz: 'Аздап', score: 3 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 2 },
      { textRu: 'Очень', textKz: 'Өте', score: 1 },
    ],
  },
  {
    questionTextRu: 'Мне тревожно',
    questionTextKz: 'Маған мазасыз',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 1 },
      { textRu: 'Немного', textKz: 'Аздап', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень', textKz: 'Өте', score: 4 },
    ],
  },
  {
    questionTextRu: 'Я чувствую усталость',
    questionTextKz: 'Мен шаршағанымды сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 1 },
      { textRu: 'Немного', textKz: 'Аздап', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень', textKz: 'Өте', score: 4 },
    ],
  },
  {
    questionTextRu: 'Мне радостно',
    questionTextKz: 'Маған қуанышты',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Совсем нет', textKz: 'Мүлдем жоқ', score: 4 },
      { textRu: 'Немного', textKz: 'Аздап', score: 3 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 2 },
      { textRu: 'Очень', textKz: 'Өте', score: 1 },
    ],
  },
];

const spielbergerHaninInterpretation = {
  levels: [
    {
      minScore: 8, maxScore: 14, level: 'low',
      titleRu: 'Низкая ситуативная тревожность',
      titleKz: 'Жағдайлық үрейліліктің төмен деңгейі',
      descriptionRu: 'Ребёнок чувствует себя спокойно и комфортно. Уровень тревоги в норме.',
      recommendations: ['Поддерживайте благоприятную атмосферу', 'Продолжайте текущую стратегию воспитания'],
    },
    {
      minScore: 15, maxScore: 23, level: 'moderate',
      titleRu: 'Умеренная ситуативная тревожность',
      titleKz: 'Жағдайлық үрейліліктің орташа деңгейі',
      descriptionRu: 'Умеренный уровень тревоги, адекватный реакциям на текущие события.',
      recommendations: ['Обсудите с ребёнком причины беспокойства', 'Обучайте техникам расслабления', 'Обеспечьте режим дня'],
    },
    {
      minScore: 24, maxScore: 32, level: 'high',
      titleRu: 'Высокая ситуативная тревожность',
      titleKz: 'Жағдайлық үрейліліктің жоғары деңгейі',
      descriptionRu: 'Высокий уровень тревоги. Ребёнок испытывает выраженное эмоциональное напряжение.',
      recommendations: ['Рекомендуется консультация психолога', 'Выясните источник стресса', 'Обучите дыхательным техникам', 'Создайте предсказуемый распорядок дня'],
    },
  ],
};

// ============================================
// 2. Шкала безнадёжности Бека
// ============================================

const beckHopelessnessTest = {
  id: 'test-beck-hopelessness',
  titleRu: 'Шкала безнадёжности Бека',
  titleKz: 'Бектің үмітсіздік шкаласы',
  descriptionRu: 'Шкала безнадёжности А. Бека для оценки негативных ожиданий относительно будущего. Важный инструмент ранней диагностики.',
  descriptionKz: 'Болашаққа қатысты теріс күтулерді бағалауға арналған А. Бектің үмітсіздік шкаласы. Ерте диагностиканың маңызды құралы.',
  category: TestCategory.EMOTIONS,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 11,
};

const beckHopelessnessQuestions = [
  {
    questionTextRu: 'Я смотрю в будущее с надеждой и энтузиазмом',
    questionTextKz: 'Мен болашаққа үмітпен және ынтамен қараймын',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 0 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 1 },
    ],
  },
  {
    questionTextRu: 'Мне лучше сдаться, так как я не могу сделать свою жизнь лучше',
    questionTextKz: 'Маған бас тартқаным жөн, өйткені мен өмірімді жақсарта алмаймын',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Когда дела идут плохо, мне помогает мысль, что всё будет хорошо',
    questionTextKz: 'Істер нашар болғанда, бәрі жақсы болады деген ой маған көмектеседі',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 0 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 1 },
    ],
  },
  {
    questionTextRu: 'Я не могу представить свою жизнь через 10 лет',
    questionTextKz: 'Мен 10 жылдан кейінгі өмірімді елестете алмаймын',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'У меня достаточно времени, чтобы успеть сделать то, что я хочу',
    questionTextKz: 'Менде қалаған нәрсемді жасауға уақыт жеткілікті',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 0 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 1 },
    ],
  },
  {
    questionTextRu: 'В будущем меня ждёт успех в том, что для меня важно',
    questionTextKz: 'Болашақта маған маңызды нәрселерде табыс күтеді',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 0 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 1 },
    ],
  },
  {
    questionTextRu: 'Моё будущее кажется мне тёмным',
    questionTextKz: 'Менің болашағым маған қараңғы болып көрінеді',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Я жду от жизни хорошего больше, чем плохого',
    questionTextKz: 'Мен өмірден жаман нәрседен гөрі жақсы нәрсені көбірек күтемін',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 0 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 1 },
    ],
  },
];

const beckHopelessnessInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 2, level: 'normal',
      titleRu: 'Нормальный уровень',
      titleKz: 'Қалыпты деңгей',
      descriptionRu: 'Безнадёжность не выявлена. Ребёнок позитивно оценивает своё будущее.',
      recommendations: ['Поддерживайте оптимистичный настрой', 'Обсуждайте планы на будущее'],
    },
    {
      minScore: 3, maxScore: 5, level: 'mild',
      titleRu: 'Лёгкая безнадёжность',
      titleKz: 'Жеңіл үмітсіздік',
      descriptionRu: 'Отмечаются некоторые негативные ожидания от будущего.',
      recommendations: ['Помогите ребёнку увидеть перспективы', 'Обсуждайте достижения и успехи', 'Ставьте достижимые цели вместе'],
    },
    {
      minScore: 6, maxScore: 8, level: 'severe',
      titleRu: 'Выраженная безнадёжность',
      titleKz: 'Айқын үмітсіздік',
      descriptionRu: 'Высокий уровень негативных ожиданий. Требуется профессиональная помощь.',
      recommendations: ['ВАЖНО: Необходима консультация психолога', 'Обратите внимание на эмоциональное состояние', 'Обеспечьте поддержку и внимание', 'Не оставляйте ребёнка одного с переживаниями'],
    },
  ],
};

// ============================================
// 3. Олвеус Буллинг
// ============================================

const olweusBullyingTest = {
  id: 'test-olweus-bullying',
  titleRu: 'Опросник буллинга Олвеуса',
  titleKz: 'Олвеустың буллинг сауалнамасы',
  descriptionRu: 'Методика Д. Олвеуса для выявления опыта школьной травли. Помогает определить наличие и степень буллинга.',
  descriptionKz: 'Мектептегі қорлау тәжірибесін анықтауға арналған Д. Олвеус әдістемесі.',
  category: TestCategory.SOCIAL,
  ageMin: 10,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 12,
};

const olweusBullyingQuestions = [
  {
    questionTextRu: 'Меня обзывали, давали обидные прозвища',
    questionTextKz: 'Мені ренжітетін лақап аттармен атады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Меня били или толкали',
    questionTextKz: 'Мені ұрды немесе итерді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Меня намеренно игнорировали, не принимали в компанию',
    questionTextKz: 'Мені әдейі елемеді, компанияға қабылдамады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Надо мной смеялись и издевались',
    questionTextKz: 'Мені мазақтап, келемеждеді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'У меня забирали или портили вещи',
    questionTextKz: 'Менің заттарымды алып қойды немесе бүлдірді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Мне угрожали или запугивали',
    questionTextKz: 'Маған қорқытып, үрейлендірді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Обо мне распространяли слухи и ложь',
    questionTextKz: 'Мен туралы өсек пен өтірік таратты',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
  {
    questionTextRu: 'Меня обижали в интернете (соцсетях, мессенджерах)',
    questionTextKz: 'Мені интернетте (әлеуметтік желілерде, мессенджерлерде) ренжітті',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: '2-3 раза в месяц', textKz: 'Айына 2-3 рет', score: 2 },
      { textRu: 'Раз в неделю', textKz: 'Аптасына бір рет', score: 3 },
      { textRu: 'Несколько раз в неделю', textKz: 'Аптасына бірнеше рет', score: 4 },
    ],
  },
];

const olweusBullyingInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 4, level: 'safe',
      titleRu: 'Буллинг не выявлен',
      titleKz: 'Буллинг анықталмады',
      descriptionRu: 'Нет признаков систематической травли. Ребёнок чувствует себя безопасно.',
      recommendations: ['Продолжайте поддерживать открытое общение', 'Обсуждайте тему безопасности в школе'],
    },
    {
      minScore: 5, maxScore: 15, level: 'mild',
      titleRu: 'Единичные случаи притеснения',
      titleKz: 'Жекелеген қысым жағдайлары',
      descriptionRu: 'Имеются эпизоды притеснения. Ситуация требует внимания.',
      recommendations: ['Поговорите с ребёнком о конкретных ситуациях', 'Свяжитесь с классным руководителем', 'Обучите ребёнка стратегиям реагирования'],
    },
    {
      minScore: 16, maxScore: 24, level: 'moderate',
      titleRu: 'Систематический буллинг',
      titleKz: 'Жүйелі буллинг',
      descriptionRu: 'Регулярная травля. Ребёнок подвергается серьёзному давлению.',
      recommendations: ['ВАЖНО: Обратитесь к школьному психологу и администрации', 'Зафиксируйте все инциденты', 'Обеспечьте ребёнку поддержку и защиту', 'Рассмотрите консультацию у специалиста'],
    },
    {
      minScore: 25, maxScore: 32, level: 'severe',
      titleRu: 'Тяжёлый буллинг',
      titleKz: 'Ауыр буллинг',
      descriptionRu: 'Интенсивная систематическая травля. Требуется немедленное вмешательство.',
      recommendations: ['СРОЧНО: Обратитесь к администрации школы и психологу', 'Рассмотрите подключение правоохранительных органов', 'Обеспечьте безопасность ребёнка', 'Необходима профессиональная психологическая помощь'],
    },
  ],
};

// ============================================
// 4. Интернет-зависимость Янг
// ============================================

const youngInternetTest = {
  id: 'test-young-internet',
  titleRu: 'Интернет-зависимость (К. Янг)',
  titleKz: 'Интернет-тәуелділік (К. Янг)',
  descriptionRu: 'Тест Кимберли Янг для диагностики интернет-зависимости. Оценивает степень вовлечённости в использование интернета.',
  descriptionKz: 'Интернет-тәуелділікті анықтауға арналған Кимберли Янг тесті. Интернетті пайдалануға қатысу дәрежесін бағалайды.',
  category: TestCategory.COGNITIVE,
  ageMin: 12,
  ageMax: 17,
  durationMinutes: 10,
  price: 3500,
  isPremium: true,
  order: 13,
};

const youngInternetQuestions = [
  {
    questionTextRu: 'Я сижу в интернете дольше, чем планировал(а)',
    questionTextKz: 'Мен интернетте жоспарлағанымнан ұзақ отырамын',
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
    questionTextRu: 'Я забываю о домашних делах из-за интернета',
    questionTextKz: 'Интернет себебінен үй тапсырмаларын ұмытамын',
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
    questionTextRu: 'Я предпочитаю интернет общению с друзьями вживую',
    questionTextKz: 'Достарыммен тірі қарым-қатынастан гөрі интернетті таңдаймын',
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
    questionTextRu: 'Я не могу заснуть из-за интернета',
    questionTextKz: 'Интернет себебінен ұйықтай алмаймын',
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
    questionTextRu: 'Я чувствую раздражение, когда не могу выйти в интернет',
    questionTextKz: 'Интернетке шыға алмағанда ашуланамын',
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
    questionTextRu: 'Я пытаюсь скрыть от родителей, сколько времени провожу в интернете',
    questionTextKz: 'Интернетте қанша уақыт өткізетінімді ата-анамнан жасыруға тырысамын',
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
    questionTextRu: 'Интернет помогает мне отвлечься от плохого настроения',
    questionTextKz: 'Интернет маған жаман көңіл-күйден алаңдатуға көмектеседі',
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
    questionTextRu: 'Мои оценки ухудшились из-за интернета',
    questionTextKz: 'Интернет себебінен бағаларым нашарлады',
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

const youngInternetInterpretation = {
  levels: [
    {
      minScore: 8, maxScore: 15, level: 'normal',
      titleRu: 'Обычный пользователь',
      titleKz: 'Кәдімгі пайдаланушы',
      descriptionRu: 'Интернет-использование в норме. Нет признаков зависимости.',
      recommendations: ['Продолжайте контролировать время в интернете', 'Поддерживайте баланс онлайн и оффлайн активностей'],
    },
    {
      minScore: 16, maxScore: 25, level: 'mild',
      titleRu: 'Склонность к чрезмерному использованию',
      titleKz: 'Шамадан тыс пайдалануға бейімділік',
      descriptionRu: 'Время от времени проводит слишком много времени в интернете.',
      recommendations: ['Установите правила использования интернета', 'Предложите альтернативные занятия', 'Ведите дневник времени в интернете'],
    },
    {
      minScore: 26, maxScore: 35, level: 'moderate',
      titleRu: 'Проблемное использование интернета',
      titleKz: 'Интернетті проблемалық пайдалану',
      descriptionRu: 'Интернет-использование создаёт проблемы в учёбе и общении.',
      recommendations: ['Ограничьте время в интернете', 'Обратите внимание на причины ухода в интернет', 'Рассмотрите консультацию психолога'],
    },
    {
      minScore: 36, maxScore: 40, level: 'severe',
      titleRu: 'Интернет-зависимость',
      titleKz: 'Интернет-тәуелділік',
      descriptionRu: 'Выраженная интернет-зависимость. Серьёзные последствия для учёбы и здоровья.',
      recommendations: ['ВАЖНО: Рекомендуется консультация специалиста', 'Необходимо постепенное снижение времени в интернете', 'Выясните глубинные причины зависимости', 'Развивайте оффлайн-интересы'],
    },
  ],
};

// ============================================
// 5. Шмишек-Леонгард (акцентуации)
// ============================================

const shmishekTest = {
  id: 'test-shmishek',
  titleRu: 'Акцентуации характера (Шмишек-Леонгард)',
  titleKz: 'Мінез акцентуациялары (Шмишек-Леонгард)',
  descriptionRu: 'Опросник Шмишека на основе концепции акцентуированных личностей К. Леонгарда. Выявляет выраженные черты характера подростка.',
  descriptionKz: 'К. Леонгардтың акцентуацияланған тұлғалар концепциясына негізделген Шмишек сауалнамасы. Жасөспірімнің айқын мінез белгілерін анықтайды.',
  category: TestCategory.EMOTIONS,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 15,
  price: 3500,
  isPremium: true,
  order: 14,
};

const shmishekQuestions = [
  {
    questionTextRu: 'У вас часто меняется настроение без видимой причины?',
    questionTextKz: 'Сіздің көңіл-күйіңіз себепсіз жиі өзгереді ме?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы быстро раздражаетесь?',
    questionTextKz: 'Сіз тез ашулана ма сыз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы часто бываете в центре внимания?',
    questionTextKz: 'Сіз жиі назар аударудың ортасында боласыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы предпочитаете одиночество компании?',
    questionTextKz: 'Сіз компаниядан гөрі жалғыздықты қалайсыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы педантичны и аккуратны во всём?',
    questionTextKz: 'Сіз барлық нәрседе педант және ұқыпты ма сыз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы легко заводите новые знакомства?',
    questionTextKz: 'Сіз жаңа танысулар оңай ба сыз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы мечтательный человек?',
    questionTextKz: 'Сіз армандағыш адам ба сыз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы часто испытываете тревогу и беспокойство?',
    questionTextKz: 'Сіз жиі үрей мен мазасыздық сезінесіз бе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы склонны к лидерству и руководству?',
    questionTextKz: 'Сіз көшбасшылық пен басшылыққа бейім бе сіз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы легко обижаетесь и долго помните обиды?',
    questionTextKz: 'Сіз оңай ренжіп, ренішті ұзақ есте сақтайсыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
];

const shmishekInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 3, level: 'balanced',
      titleRu: 'Сбалансированный профиль',
      titleKz: 'Теңгерілген профиль',
      descriptionRu: 'Черты характера выражены умеренно. Нет явных акцентуаций.',
      recommendations: ['Поддерживайте гармоничное развитие личности', 'Обратите внимание на сильные стороны ребёнка'],
    },
    {
      minScore: 4, maxScore: 6, level: 'tendencies',
      titleRu: 'Выраженные тенденции',
      titleKz: 'Айқын тенденциялар',
      descriptionRu: 'Некоторые черты характера выражены ярче. Это может быть как ресурсом, так и зоной риска.',
      recommendations: ['Обсудите с ребёнком его сильные стороны', 'Помогите осознать особенности характера', 'Развивайте гибкость поведения'],
    },
    {
      minScore: 7, maxScore: 10, level: 'accentuation',
      titleRu: 'Выраженная акцентуация',
      titleKz: 'Айқын акцентуация',
      descriptionRu: 'Яркие черты характера, которые могут влиять на поведение и общение.',
      recommendations: ['Рекомендуется консультация психолога', 'Помогите ребёнку принять свои особенности', 'Обучите стратегиям саморегуляции', 'Создайте условия для реализации сильных сторон'],
    },
  ],
};

// ============================================
// 6. Шкала тревожности Кондаш
// ============================================

const kondashTest = {
  id: 'test-kondash',
  titleRu: 'Шкала тревожности Кондаш',
  titleKz: 'Кондаш үрейлілік шкаласы',
  descriptionRu: 'Шкала социально-ситуативной тревожности О. Кондаша. Оценивает тревожность в различных школьных ситуациях.',
  descriptionKz: 'О. Кондаштың әлеуметтік-жағдайлық үрейлілік шкаласы. Мектептің әр түрлі жағдайларындағы үрейлілікті бағалайды.',
  category: TestCategory.ANXIETY,
  ageMin: 10,
  ageMax: 16,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 15,
};

const kondashQuestions = [
  {
    questionTextRu: 'Отвечать у доски',
    questionTextKz: 'Тақта алдында жауап беру',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Получить плохую оценку',
    questionTextKz: 'Нашар баға алу',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Быть наказанным за плохое поведение',
    questionTextKz: 'Жаман мінез үшін жазалану',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Не понять объяснение учителя',
    questionTextKz: 'Мұғалімнің түсіндірмесін түсінбеу',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Не справиться с контрольным заданием',
    questionTextKz: 'Бақылау тапсырмасын орындай алмау',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Думать о своём будущем',
    questionTextKz: 'Болашағыңды ойлау',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Разговор с директором школы',
    questionTextKz: 'Мектеп директорымен сөйлесу',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
  {
    questionTextRu: 'Контрольная работа',
    questionTextKz: 'Бақылау жұмысы',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет тревоги', textKz: 'Үрей жоқ', score: 0 },
      { textRu: 'Немного', textKz: 'Аздап', score: 1 },
      { textRu: 'Достаточно', textKz: 'Жеткілікті', score: 2 },
      { textRu: 'Значительно', textKz: 'Айтарлықтай', score: 3 },
      { textRu: 'Очень сильно', textKz: 'Өте қатты', score: 4 },
    ],
  },
];

const kondashInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 8, level: 'low',
      titleRu: 'Низкая школьная тревожность',
      titleKz: 'Мектеп үрейлілігінің төмен деңгейі',
      descriptionRu: 'Школьные ситуации не вызывают значимой тревоги. Ребёнок адаптирован к школьной среде.',
      recommendations: ['Поддерживайте позитивное отношение к школе', 'Продолжайте создавать безопасную атмосферу'],
    },
    {
      minScore: 9, maxScore: 18, level: 'moderate',
      titleRu: 'Умеренная школьная тревожность',
      titleKz: 'Мектеп үрейлілігінің орташа деңгейі',
      descriptionRu: 'Нормальный уровень тревоги, адекватный школьным требованиям.',
      recommendations: ['Обсуждайте трудности с ребёнком', 'Обучайте стратегиям справления со стрессом', 'Помогайте готовиться к контрольным'],
    },
    {
      minScore: 19, maxScore: 32, level: 'high',
      titleRu: 'Высокая школьная тревожность',
      titleKz: 'Мектеп үрейлілігінің жоғары деңгейі',
      descriptionRu: 'Выраженная школьная тревожность. Школьные ситуации вызывают сильное беспокойство.',
      recommendations: ['Рекомендуется консультация школьного психолога', 'Снижайте давление по учёбе', 'Обучите техникам релаксации', 'Создавайте ситуации успеха для ребёнка'],
    },
  ],
};

// ============================================
// 7. Жизнестойкость (Мадди/Леонтьев)
// ============================================

const maddiHardinessTest = {
  id: 'test-maddi-hardiness',
  titleRu: 'Тест жизнестойкости (Мадди-Леонтьев)',
  titleKz: 'Өміршеңдік тесті (Мадди-Леонтьев)',
  descriptionRu: 'Методика С. Мадди в адаптации Д.А. Леонтьева. Оценивает способность переносить стрессовые ситуации, сохраняя внутренний баланс.',
  descriptionKz: 'Д.А. Леонтьев бейімдеуіндегі С. Мадди әдістемесі. Стресстік жағдайларды ішкі тепе-теңдікті сақтай отырып жеңу қабілетін бағалайды.',
  category: TestCategory.EMOTIONS,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 3500,
  isPremium: true,
  order: 16,
};

const maddiHardinessQuestions = [
  {
    questionTextRu: 'Я часто чувствую, что мало влияю на то, что со мной происходит',
    questionTextKz: 'Мен өзіме не болып жатқанына аз әсер ететінімді жиі сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 3 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 1 },
      { textRu: 'Да', textKz: 'Иә', score: 0 },
    ],
  },
  {
    questionTextRu: 'Я люблю новые впечатления и приключения',
    questionTextKz: 'Мен жаңа әсерлер мен шытырман оқиғаларды жақсы көремін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
  {
    questionTextRu: 'Я чувствую уверенность в себе и своих силах',
    questionTextKz: 'Мен өзіме және күшіме сенімдімін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
  {
    questionTextRu: 'Мне трудно справляться с трудностями и проблемами',
    questionTextKz: 'Маған қиындықтар мен мәселелерді жеңу қиын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 3 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 1 },
      { textRu: 'Да', textKz: 'Иә', score: 0 },
    ],
  },
  {
    questionTextRu: 'Я легко адаптируюсь к новым условиям',
    questionTextKz: 'Мен жаңа жағдайларға оңай бейімделемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
  {
    questionTextRu: 'Я чувствую, что моя жизнь имеет смысл и цель',
    questionTextKz: 'Мен өмірімнің мәні мен мақсаты бар екенін сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
  {
    questionTextRu: 'Я стараюсь контролировать ситуацию, а не плыть по течению',
    questionTextKz: 'Мен ағымға қарсы бағытта жағдайды бақылауға тырысамын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
  {
    questionTextRu: 'Перемены в жизни — это интересно и увлекательно',
    questionTextKz: 'Өмірдегі өзгерістер — бұл қызықты және тартымды',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 2 },
      { textRu: 'Да', textKz: 'Иә', score: 3 },
    ],
  },
];

const maddiHardinessInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 8, level: 'low',
      titleRu: 'Низкая жизнестойкость',
      titleKz: 'Төмен өміршеңдік',
      descriptionRu: 'Ребёнок уязвим к стрессу, склонен к пассивности и избеганию трудностей.',
      recommendations: ['Рекомендуется консультация психолога', 'Постепенно расширяйте зону комфорта', 'Обучайте навыкам решения проблем', 'Помогайте ставить маленькие достижимые цели'],
    },
    {
      minScore: 9, maxScore: 16, level: 'moderate',
      titleRu: 'Средняя жизнестойкость',
      titleKz: 'Орташа өміршеңдік',
      descriptionRu: 'Нормальный уровень жизнестойкости. Ребёнок в целом справляется с трудностями.',
      recommendations: ['Поддерживайте инициативу ребёнка', 'Обсуждайте способы решения проблем', 'Поощряйте новый опыт'],
    },
    {
      minScore: 17, maxScore: 24, level: 'high',
      titleRu: 'Высокая жизнестойкость',
      titleKz: 'Жоғары өміршеңдік',
      descriptionRu: 'Ребёнок хорошо адаптируется к стрессу, активен и целеустремлён.',
      recommendations: ['Поддерживайте и развивайте ресурсы', 'Предоставляйте возможности для роста', 'Следите, чтобы не было перенапряжения'],
    },
  ],
};

// ============================================
// 8. Опросник Кейрси (темперамент)
// ============================================

const keirseyTest = {
  id: 'test-keirsey',
  titleRu: 'Определение темперамента (Кейрси)',
  titleKz: 'Темпераментті анықтау (Кейрси)',
  descriptionRu: 'Опросник Д. Кейрси для определения типа темперамента. Помогает понять предпочтения и стиль поведения подростка.',
  descriptionKz: 'Д. Кейрсидің темперамент типін анықтауға арналған сауалнамасы. Жасөспірімнің қалаулары мен мінез-құлық стилін түсінуге көмектеседі.',
  category: TestCategory.CAREER,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 15,
  price: 0,
  isPremium: false,
  order: 17,
};

const keirseyQuestions = [
  {
    questionTextRu: 'В свободное время вы предпочитаете:',
    questionTextKz: 'Бос уақытта сіз қалайсыз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Общаться с друзьями', textKz: 'Достарыңызбен сөйлесу', score: 1 },
      { textRu: 'Проводить время в одиночестве', textKz: 'Жалғыз уақыт өткізу', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы больше доверяете:',
    questionTextKz: 'Сіз көбірек сенесіз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Своему опыту и фактам', textKz: 'Өз тәжірибеңізге және деректерге', score: 0 },
      { textRu: 'Своей интуиции и предчувствиям', textKz: 'Өз интуицияңызға және сезімдеріңізге', score: 1 },
    ],
  },
  {
    questionTextRu: 'Принимая решения, вы опираетесь на:',
    questionTextKz: 'Шешім қабылдағанда сіз не арқылы жасайсыз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Логику и объективность', textKz: 'Логика және объективтілік', score: 0 },
      { textRu: 'Чувства и ценности', textKz: 'Сезімдер мен құндылықтар', score: 1 },
    ],
  },
  {
    questionTextRu: 'Вы предпочитаете:',
    questionTextKz: 'Сіз қалайсыз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Планировать заранее', textKz: 'Алдын ала жоспарлау', score: 0 },
      { textRu: 'Действовать по ситуации', textKz: 'Жағдайға қарай әрекет ету', score: 1 },
    ],
  },
  {
    questionTextRu: 'На вечеринке вы обычно:',
    questionTextKz: 'Кешкі отырыста сіз әдетте:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Знакомитесь с новыми людьми', textKz: 'Жаңа адамдармен танысасыз', score: 1 },
      { textRu: 'Общаетесь с теми, кого знаете', textKz: 'Таныстарыңызбен сөйлесесіз', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вам интереснее:',
    questionTextKz: 'Сізге қызығырақ:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Конкретные факты и детали', textKz: 'Нақты фактілер мен мәліметтер', score: 0 },
      { textRu: 'Идеи и возможности', textKz: 'Идеялар мен мүмкіндіктер', score: 1 },
    ],
  },
  {
    questionTextRu: 'В споре вас убеждает:',
    questionTextKz: 'Дауда сізді не сендіреді:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Логичные аргументы', textKz: 'Қисынды дәлелдер', score: 0 },
      { textRu: 'Эмоциональная убедительность', textKz: 'Эмоционалдық сенімділік', score: 1 },
    ],
  },
  {
    questionTextRu: 'Вы комфортнее себя чувствуете, когда:',
    questionTextKz: 'Сіз қай кезде жайлырақ сезінесіз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Всё решено и определено', textKz: 'Бәрі шешілген және анықталған', score: 0 },
      { textRu: 'Есть варианты и гибкость', textKz: 'Нұсқалар мен икемділік бар', score: 1 },
    ],
  },
  {
    questionTextRu: 'После напряжённого дня вы предпочитаете:',
    questionTextKz: 'Қиын күннен кейін сіз қалайсыз:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Встретиться с друзьями', textKz: 'Достарыңызбен кездесу', score: 1 },
      { textRu: 'Побыть одному', textKz: 'Жалғыз болу', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вас больше привлекают:',
    questionTextKz: 'Сізді не көбірек тартады:',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Практические навыки', textKz: 'Практикалық дағдылар', score: 0 },
      { textRu: 'Теоретические знания', textKz: 'Теориялық білім', score: 1 },
    ],
  },
];

const keirseyInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 3, level: 'guardian',
      titleRu: 'Хранитель (SJ) — практичный и ответственный',
      titleKz: 'Сақтаушы (SJ) — практикалық және жауапты',
      descriptionRu: 'Ребёнок ориентирован на порядок, стабильность и традиции. Надёжен и ответственен.',
      recommendations: ['Поддерживайте стремление к порядку', 'Давайте чёткие инструкции', 'Цените надёжность ребёнка', 'Постепенно учите гибкости'],
    },
    {
      minScore: 4, maxScore: 5, level: 'artisan',
      titleRu: 'Мастер (SP) — активный и практичный',
      titleKz: 'Шебер (SP) — белсенді және практикалық',
      descriptionRu: 'Ребёнок ориентирован на действие, практику и конкретные результаты.',
      recommendations: ['Предоставляйте свободу действий', 'Предлагайте практические задания', 'Поощряйте спорт и активности', 'Помогайте с планированием'],
    },
    {
      minScore: 6, maxScore: 7, level: 'idealist',
      titleRu: 'Идеалист (NF) — чуткий и творческий',
      titleKz: 'Идеалист (NF) — сезімтал және шығармашыл',
      descriptionRu: 'Ребёнок ориентирован на людей, гармонию и самовыражение.',
      recommendations: ['Поддерживайте творческие увлечения', 'Уважайте чувства и переживания', 'Помогайте развивать эмпатию', 'Поощряйте самовыражение'],
    },
    {
      minScore: 8, maxScore: 10, level: 'rational',
      titleRu: 'Рационалист (NT) — аналитичный и независимый',
      titleKz: 'Рационалист (NT) — талдамалы және тәуелсіз',
      descriptionRu: 'Ребёнок ориентирован на знания, логику и самостоятельность.',
      recommendations: ['Предоставляйте интеллектуальные задачи', 'Поощряйте любознательность', 'Уважайте потребность в самостоятельности', 'Помогайте развивать эмоциональный интеллект'],
    },
  ],
};

// ============================================
// 9. Айзенк EPI (экстраверсия/нейротизм)
// ============================================

const eysenckEpiTest = {
  id: 'test-eysenck-epi',
  titleRu: 'Темперамент (Айзенк EPI)',
  titleKz: 'Темперамент (Айзенк EPI)',
  descriptionRu: 'Личностный опросник Г. Айзенка (EPI) для определения типа темперамента по шкалам экстраверсии и нейротизма.',
  descriptionKz: 'Г. Айзенктің экстраверсия мен нейротизм шкалалары бойынша темперамент типін анықтауға арналған тұлғалық сауалнамасы.',
  category: TestCategory.CAREER,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 3500,
  isPremium: true,
  order: 18,
};

const eysenckEpiQuestions = [
  {
    questionTextRu: 'Часто ли вы ищете новые впечатления и развлечения?',
    questionTextKz: 'Сіз жиі жаңа әсерлер мен ойын-сауық іздейсіз бе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы считаете себя общительным человеком?',
    questionTextKz: 'Сіз өзіңізді қарым-қатынасшыл адам деп санайсыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Часто ли вам нужна поддержка и одобрение друзей?',
    questionTextKz: 'Сізге достарыңыздың қолдауы мен мақұлдауы жиі қажет пе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы обычно беззаботный человек?',
    questionTextKz: 'Сіз әдетте уайымсыз адам ба сыз?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вам нравятся шумные компании и вечеринки?',
    questionTextKz: 'Сізге шулы компаниялар мен кештер ұнай ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Часто ли у вас бывают перепады настроения?',
    questionTextKz: 'Сізде көңіл-күй құбылуы жиі бола ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы легко обижаетесь?',
    questionTextKz: 'Сіз оңай ренжисіз бе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы часто чувствуете себя усталым без причины?',
    questionTextKz: 'Сіз жиі себепсіз шаршағаныңызды сезінесіз бе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вы любите действовать быстро, не раздумывая?',
    questionTextKz: 'Сіз ойланбай тез әрекет еткенді ұнатасыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Вас беспокоит чувство вины?',
    questionTextKz: 'Сізді кінә сезімі мазалайды ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
];

const eysenckEpiInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 3, level: 'phlegmatic',
      titleRu: 'Флегматик — спокойный и уравновешенный',
      titleKz: 'Флегматик — тыныш және теңдессіз',
      descriptionRu: 'Интровертированный и эмоционально устойчивый тип. Спокоен, надёжен, но может быть медлителен.',
      recommendations: ['Уважайте потребность в уединении', 'Не торопите ребёнка', 'Поощряйте социальную активность', 'Давайте время на обдумывание'],
    },
    {
      minScore: 4, maxScore: 5, level: 'melancholic',
      titleRu: 'Меланхолик — чувствительный и глубокий',
      titleKz: 'Меланхолик — сезімтал және терең',
      descriptionRu: 'Интровертированный и эмоционально чувствительный тип. Глубоко переживает, склонен к анализу.',
      recommendations: ['Создайте безопасную атмосферу', 'Не критикуйте публично', 'Поддерживайте творческие интересы', 'Обучайте эмоциональной саморегуляции'],
    },
    {
      minScore: 6, maxScore: 7, level: 'sanguine',
      titleRu: 'Сангвиник — общительный и оптимистичный',
      titleKz: 'Сангвиник — қарым-қатынасшыл және оптимист',
      descriptionRu: 'Экстравертированный и эмоционально устойчивый тип. Общителен, активен, оптимистичен.',
      recommendations: ['Предоставляйте разнообразные активности', 'Помогайте доводить дела до конца', 'Поощряйте социальные навыки', 'Обучайте ответственности'],
    },
    {
      minScore: 8, maxScore: 10, level: 'choleric',
      titleRu: 'Холерик — энергичный и импульсивный',
      titleKz: 'Холерик — қуатты және импульсивті',
      descriptionRu: 'Экстравертированный и эмоционально нестабильный тип. Энергичен, но может быть вспыльчивым.',
      recommendations: ['Направляйте энергию в конструктивное русло', 'Обучайте управлению гневом', 'Предоставляйте физические нагрузки', 'Развивайте самоконтроль'],
    },
  ],
};

// ============================================
// 10. Тест Шварца (ценности)
// ============================================

const schwartzValuesTest = {
  id: 'test-schwartz-values',
  titleRu: 'Ценностные ориентации (Шварц)',
  titleKz: 'Құндылық бағдарлар (Шварц)',
  descriptionRu: 'Методика Ш. Шварца для определения ценностных приоритетов. Помогает понять, что наиболее важно для подростка.',
  descriptionKz: 'Ш. Шварцтың құндылық басымдықтарын анықтау әдістемесі. Жасөспірім үшін ең маңызды нәрсені түсінуге көмектеседі.',
  category: TestCategory.CAREER,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 19,
};

const schwartzValuesQuestions = [
  {
    questionTextRu: 'Насколько для вас важна власть и влияние на людей?',
    questionTextKz: 'Сіз үшін билік пен адамдарға ықпал ету қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важны новые впечатления и приключения?',
    questionTextKz: 'Сіз үшін жаңа әсерлер мен оқиғалар қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важна помощь окружающим людям?',
    questionTextKz: 'Сіз үшін айналадағы адамдарға көмектесу қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важна безопасность семьи?',
    questionTextKz: 'Сіз үшін отбасы қауіпсіздігі қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важно творчество и самовыражение?',
    questionTextKz: 'Сіз үшін шығармашылық пен өзін-өзі көрсету қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важны традиции и обычаи?',
    questionTextKz: 'Сіз үшін дәстүрлер мен салт-сана қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важна независимость и свобода выбора?',
    questionTextKz: 'Сіз үшін тәуелсіздік пен таңдау еркіндігі қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важно равенство и справедливость?',
    questionTextKz: 'Сіз үшін теңдік пен әділдік қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важен порядок и дисциплина?',
    questionTextKz: 'Сіз үшін тәртіп пен тәрбие қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
  {
    questionTextRu: 'Насколько для вас важно наслаждение жизнью и удовольствия?',
    questionTextKz: 'Сіз үшін өмірден ләззат алу қаншалықты маңызды?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не важно', textKz: 'Маңызды емес', score: 1 },
      { textRu: 'Немного важно', textKz: 'Аздап маңызды', score: 2 },
      { textRu: 'Важно', textKz: 'Маңызды', score: 3 },
      { textRu: 'Довольно важно', textKz: 'Жеткілікті маңызды', score: 4 },
      { textRu: 'Очень важно', textKz: 'Өте маңызды', score: 5 },
      { textRu: 'Высшая ценность', textKz: 'Ең жоғарғы құндылық', score: 6 },
    ],
  },
];

const schwartzValuesInterpretation = {
  levels: [
    {
      minScore: 10, maxScore: 25, level: 'conservative',
      titleRu: 'Консервативные ценности',
      titleKz: 'Консервативтік құндылықтар',
      descriptionRu: 'Преобладают ценности безопасности, традиций и конформизма.',
      recommendations: ['Уважайте ценности ребёнка', 'Помогите расширить кругозор', 'Развивайте открытость к новому опыту'],
    },
    {
      minScore: 26, maxScore: 40, level: 'balanced',
      titleRu: 'Сбалансированная система ценностей',
      titleKz: 'Теңгерілген құндылықтар жүйесі',
      descriptionRu: 'Гармоничное сочетание различных ценностей.',
      recommendations: ['Поддерживайте многообразие интересов', 'Помогайте расставлять приоритеты', 'Развивайте критическое мышление'],
    },
    {
      minScore: 41, maxScore: 60, level: 'openness',
      titleRu: 'Ценности открытости и роста',
      titleKz: 'Ашықтық пен даму құндылықтары',
      descriptionRu: 'Преобладают ценности самостоятельности, творчества и новизны.',
      recommendations: ['Поощряйте творческие инициативы', 'Предоставляйте свободу выбора', 'Помогайте структурировать идеи', 'Учите ответственности за решения'],
    },
  ],
};

// ============================================
// 11. Гарднер (типы интеллекта)
// ============================================

const gardnerIntelligenceTest = {
  id: 'test-gardner-intelligence',
  titleRu: 'Типы интеллекта (Г. Гарднер)',
  titleKz: 'Интеллект түрлері (Г. Гарднер)',
  descriptionRu: 'Тест на основе теории множественного интеллекта Г. Гарднера. Определяет ведущие типы интеллекта ребёнка.',
  descriptionKz: 'Г. Гарднердің көпкомпонентті интеллект теориясына негізделген тест. Баланың жетекші интеллект түрлерін анықтайды.',
  category: TestCategory.COGNITIVE,
  ageMin: 10,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 20,
};

const gardnerIntelligenceQuestions = [
  {
    questionTextRu: 'Я люблю читать книги и писать сочинения',
    questionTextKz: 'Мен кітап оқуды және шығарма жазуды жақсы көремін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Мне легко решать математические задачи',
    questionTextKz: 'Маған математикалық есептерді шешу оңай',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Мне нравится рисовать, чертить, создавать модели',
    questionTextKz: 'Маған сурет салу, сызу, модельдер жасау ұнайды',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Я люблю музыку и легко запоминаю мелодии',
    questionTextKz: 'Мен музыканы жақсы көремін және әуендерді оңай есте сақтаймын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Я люблю спорт и физическую активность',
    questionTextKz: 'Мен спорт пен дене белсенділігін жақсы көремін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Мне легко общаться и находить общий язык с людьми',
    questionTextKz: 'Маған адамдармен қарым-қатынас жасау және ортақ тіл табу оңай',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Я люблю природу и интересуюсь животными и растениями',
    questionTextKz: 'Мен табиғатты жақсы көремін, жануарлар мен өсімдіктерге қызығамын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
  {
    questionTextRu: 'Я часто думаю о себе, своих чувствах и поступках',
    questionTextKz: 'Мен жиі өзім, сезімдерім мен іс-әрекеттерім туралы ойланамын',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Не согласен', textKz: 'Келіспеймін', score: 1 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 2 },
      { textRu: 'Нейтрально', textKz: 'Бейтарап', score: 3 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 4 },
      { textRu: 'Согласен', textKz: 'Келісемін', score: 5 },
    ],
  },
];

const gardnerIntelligenceInterpretation = {
  levels: [
    {
      minScore: 8, maxScore: 18, level: 'developing',
      titleRu: 'Интеллектуальные способности в стадии развития',
      titleKz: 'Интеллектуалдық қабілеттер даму кезеңінде',
      descriptionRu: 'Ребёнок ещё формирует свои предпочтения. Полезно пробовать разные активности.',
      recommendations: ['Предлагайте разнообразные активности', 'Не ограничивайте выбор ребёнка', 'Поощряйте любознательность'],
    },
    {
      minScore: 19, maxScore: 30, level: 'balanced',
      titleRu: 'Разносторонние способности',
      titleKz: 'Жан-жақты қабілеттер',
      descriptionRu: 'Ребёнок проявляет интерес к различным сферам. Развитый баланс способностей.',
      recommendations: ['Поддерживайте многообразие интересов', 'Помогайте углублять сильные стороны', 'Развивайте межпредметные связи'],
    },
    {
      minScore: 31, maxScore: 40, level: 'specialized',
      titleRu: 'Выраженные доминирующие способности',
      titleKz: 'Айқын басым қабілеттер',
      descriptionRu: 'Чётко выражены один или несколько типов интеллекта. Ребёнок знает свои сильные стороны.',
      recommendations: ['Развивайте ведущие способности', 'Предоставьте профильные занятия', 'Используйте сильные стороны для мотивации', 'Подберите подходящие кружки и секции'],
    },
  ],
};

// ============================================
// 12. КОС (коммуникативные и организаторские склонности)
// ============================================

const kosTest = {
  id: 'test-kos',
  titleRu: 'Коммуникативные и организаторские склонности (КОС)',
  titleKz: 'Коммуникативтік және ұйымдастырушылық қабілеттер (КОС)',
  descriptionRu: 'Методика КОС-1 для оценки коммуникативных и организаторских склонностей подростка.',
  descriptionKz: 'Жасөспірімнің коммуникативтік және ұйымдастырушылық қабілеттерін бағалауға арналған КОС-1 әдістемесі.',
  category: TestCategory.SOCIAL,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 21,
};

const kosQuestions = [
  {
    questionTextRu: 'Есть ли у вас стремление к установлению новых знакомств?',
    questionTextKz: 'Сізде жаңа танысулар орнатуға ұмтылыс бар ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Нравится ли вам выступать публично?',
    questionTextKz: 'Сізге аудитория алдында сөйлеу ұнай ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Легко ли вам заводить друзей?',
    questionTextKz: 'Сізге дос табу оңай ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Нравится ли вам организовывать мероприятия?',
    questionTextKz: 'Сізге шараларды ұйымдастыру ұнай ма?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Легко ли вы вступаете в разговор с незнакомыми людьми?',
    questionTextKz: 'Бейтаныс адамдармен сөйлесуге оңай кірісесіз бе?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Берёте ли вы на себя инициативу в группе?',
    questionTextKz: 'Топта бастаманы өз қолыңызға аласыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Предпочитаете ли вы командную работу индивидуальной?',
    questionTextKz: 'Сіз жеке жұмыстан гөрі командалық жұмысты қалайсыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Можете ли вы убедить других в своей точке зрения?',
    questionTextKz: 'Сіз басқаларды өз көзқарасыңызға сендіре аласыз ба?',
    questionType: QuestionType.YES_NO,
    options: [
      { textRu: 'Да', textKz: 'Иә', score: 1 },
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
    ],
  },
];

const kosInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 2, level: 'low',
      titleRu: 'Низкий уровень КОС',
      titleKz: 'КОС-тың төмен деңгейі',
      descriptionRu: 'Низкие коммуникативные и организаторские склонности. Ребёнок застенчив и избегает публичности.',
      recommendations: ['Постепенно расширяйте круг общения', 'Создавайте безопасные ситуации для выступлений', 'Не давите, поддерживайте'],
    },
    {
      minScore: 3, maxScore: 5, level: 'moderate',
      titleRu: 'Средний уровень КОС',
      titleKz: 'КОС-тың орташа деңгейі',
      descriptionRu: 'Средние коммуникативные и организаторские склонности. Ребёнок общителен, но не всегда проявляет инициативу.',
      recommendations: ['Поощряйте инициативу', 'Давайте ответственные поручения', 'Развивайте навыки презентации'],
    },
    {
      minScore: 6, maxScore: 8, level: 'high',
      titleRu: 'Высокий уровень КОС',
      titleKz: 'КОС-тың жоғары деңгейі',
      descriptionRu: 'Высокие коммуникативные и организаторские склонности. Ребёнок лидер, легко общается.',
      recommendations: ['Предоставляйте возможности для лидерства', 'Развивайте навыки управления', 'Поддерживайте участие в общественных мероприятиях', 'Учите уважению к другим мнениям'],
    },
  ],
};

// ============================================
// 13. Одиночество (Корчагина)
// ============================================

const korchaginaLonelinessTest = {
  id: 'test-korchagina-loneliness',
  titleRu: 'Диагностика одиночества (Корчагина)',
  titleKz: 'Жалғыздық диагностикасы (Корчагина)',
  descriptionRu: 'Методика С.Г. Корчагиной для выявления переживания одиночества у подростков.',
  descriptionKz: 'Жасөспірімдердің жалғыздық сезімін анықтауға арналған С.Г. Корчагина әдістемесі.',
  category: TestCategory.SOCIAL,
  ageMin: 12,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 22,
};

const korchaginaLonelinessQuestions = [
  {
    questionTextRu: 'Мне не хватает компании и общения',
    questionTextKz: 'Маған компания мен қарым-қатынас жетіспейді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
      { textRu: 'Редко', textKz: 'Сирек', score: 2 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
      { textRu: 'Часто', textKz: 'Жиі', score: 4 },
    ],
  },
  {
    questionTextRu: 'Я чувствую себя одиноким(ой)',
    questionTextKz: 'Мен өзімді жалғыз сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
      { textRu: 'Редко', textKz: 'Сирек', score: 2 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
      { textRu: 'Часто', textKz: 'Жиі', score: 4 },
    ],
  },
  {
    questionTextRu: 'Мне не с кем поговорить о важных вещах',
    questionTextKz: 'Маңызды нәрселер туралы сөйлесетін адам жоқ',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
      { textRu: 'Редко', textKz: 'Сирек', score: 2 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
      { textRu: 'Часто', textKz: 'Жиі', score: 4 },
    ],
  },
  {
    questionTextRu: 'Я чувствую себя частью группы друзей',
    questionTextKz: 'Мен достар тобының бөлігі екенімді сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 4 },
      { textRu: 'Редко', textKz: 'Сирек', score: 3 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
      { textRu: 'Часто', textKz: 'Жиі', score: 1 },
    ],
  },
  {
    questionTextRu: 'Мне кажется, что меня никто не понимает',
    questionTextKz: 'Маған ешкім мені түсінбейтін сияқты',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
      { textRu: 'Редко', textKz: 'Сирек', score: 2 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
      { textRu: 'Часто', textKz: 'Жиі', score: 4 },
    ],
  },
  {
    questionTextRu: 'У меня есть близкие люди, которым я доверяю',
    questionTextKz: 'Менде сенетін жақын адамдарым бар',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 4 },
      { textRu: 'Редко', textKz: 'Сирек', score: 3 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
      { textRu: 'Часто', textKz: 'Жиі', score: 1 },
    ],
  },
  {
    questionTextRu: 'Я чувствую себя забытым(ой) и ненужным(ой)',
    questionTextKz: 'Мен өзімді ұмытылған және қажетсіз сезінемін',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 1 },
      { textRu: 'Редко', textKz: 'Сирек', score: 2 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 3 },
      { textRu: 'Часто', textKz: 'Жиі', score: 4 },
    ],
  },
  {
    questionTextRu: 'Мне легко найти компанию для совместных занятий',
    questionTextKz: 'Маған бірлескен іс-шаралар үшін компания табу оңай',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 4 },
      { textRu: 'Редко', textKz: 'Сирек', score: 3 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
      { textRu: 'Часто', textKz: 'Жиі', score: 1 },
    ],
  },
];

const korchaginaLonelinessInterpretation = {
  levels: [
    {
      minScore: 8, maxScore: 14, level: 'low',
      titleRu: 'Низкий уровень одиночества',
      titleKz: 'Жалғыздықтың төмен деңгейі',
      descriptionRu: 'Ребёнок не испытывает значительного одиночества, чувствует себя включённым в социальные связи.',
      recommendations: ['Поддерживайте дружеские контакты', 'Продолжайте создавать тёплую атмосферу в семье'],
    },
    {
      minScore: 15, maxScore: 23, level: 'moderate',
      titleRu: 'Умеренное переживание одиночества',
      titleKz: 'Жалғыздықтың орташа деңгейі',
      descriptionRu: 'Периодически возникают чувства одиночества и непонимания.',
      recommendations: ['Уделяйте больше внимания общению с ребёнком', 'Помогайте находить друзей по интересам', 'Поощряйте участие в групповых активностях'],
    },
    {
      minScore: 24, maxScore: 32, level: 'high',
      titleRu: 'Высокий уровень одиночества',
      titleKz: 'Жалғыздықтың жоғары деңгейі',
      descriptionRu: 'Выраженное переживание одиночества. Ребёнок чувствует себя изолированным.',
      recommendations: ['ВАЖНО: Рекомендуется консультация психолога', 'Обеспечьте тёплый эмоциональный контакт', 'Помогите найти группу по интересам', 'Проверьте, нет ли проблем с буллингом'],
    },
  ],
};

// ============================================
// 14. Кибербуллинг (Ракишева)
// ============================================

const cyberbullyingTest = {
  id: 'test-cyberbullying-rakisheva',
  titleRu: 'Диагностика кибербуллинга (Ракишева)',
  titleKz: 'Кибербуллинг диагностикасы (Ракишева)',
  descriptionRu: 'Методика для выявления опыта кибербуллинга у детей и подростков. Актуальная проблема цифрового мира.',
  descriptionKz: 'Балалар мен жасөспірімдердегі кибербуллинг тәжірибесін анықтау әдістемесі. Цифрлық әлемнің өзекті мәселесі.',
  category: TestCategory.SOCIAL,
  ageMin: 10,
  ageMax: 17,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 23,
};

const cyberbullyingQuestions = [
  {
    questionTextRu: 'Мне присылали оскорбительные сообщения',
    questionTextKz: 'Маған қорлайтын хабарламалар жіберді',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Обо мне публиковали ложную или унизительную информацию',
    questionTextKz: 'Мен туралы жалған немесе кемсітетін ақпарат жариялады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Мне угрожали в интернете',
    questionTextKz: 'Маған интернетте қорқытты',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Мои фото или видео распространяли без моего согласия',
    questionTextKz: 'Менің фото немесе видеомды менің келісімімсіз таратты',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Меня исключали из онлайн-групп или чатов',
    questionTextKz: 'Мені онлайн-топтардан немесе чаттардан шығарып тастады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Кто-то создавал фейковые аккаунты от моего имени',
    questionTextKz: 'Біреу менің атымнан жалған аккаунт жасады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Меня травили в комментариях под постами',
    questionTextKz: 'Мені посттар астындағы комментарийлерде қудалады',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
  {
    questionTextRu: 'Мои личные данные или переписка были разглашены без согласия',
    questionTextKz: 'Менің жеке деректерім немесе хат алмасуым келісімсіз жарияланды',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: '1-2 раза', textKz: '1-2 рет', score: 1 },
      { textRu: 'Несколько раз', textKz: 'Бірнеше рет', score: 2 },
      { textRu: 'Регулярно', textKz: 'Тұрақты', score: 3 },
    ],
  },
];

const cyberbullyingInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 3, level: 'safe',
      titleRu: 'Кибербуллинг не выявлен',
      titleKz: 'Кибербуллинг анықталмады',
      descriptionRu: 'Нет значимого опыта кибербуллинга. Ребёнок чувствует себя безопасно в интернете.',
      recommendations: ['Обсуждайте правила безопасности в интернете', 'Поддерживайте открытое общение о цифровом опыте'],
    },
    {
      minScore: 4, maxScore: 10, level: 'mild',
      titleRu: 'Единичные случаи кибербуллинга',
      titleKz: 'Жекелеген кибербуллинг жағдайлары',
      descriptionRu: 'Имеются отдельные случаи онлайн-притеснения.',
      recommendations: ['Поговорите о конкретных инцидентах', 'Обучите блокировке и жалобам', 'Настройте приватность аккаунтов', 'Объясните, что это не вина ребёнка'],
    },
    {
      minScore: 11, maxScore: 17, level: 'moderate',
      titleRu: 'Систематический кибербуллинг',
      titleKz: 'Жүйелі кибербуллинг',
      descriptionRu: 'Регулярное онлайн-притеснение. Ситуация требует вмешательства.',
      recommendations: ['Зафиксируйте все инциденты (скриншоты)', 'Обратитесь к школьному психологу', 'Ограничьте доступ обидчиков', 'Рассмотрите обращение к администрации платформ'],
    },
    {
      minScore: 18, maxScore: 24, level: 'severe',
      titleRu: 'Тяжёлый кибербуллинг',
      titleKz: 'Ауыр кибербуллинг',
      descriptionRu: 'Интенсивная онлайн-травля. Необходимы срочные меры.',
      recommendations: ['СРОЧНО: Обратитесь к школе и правоохранительным органам', 'Обеспечьте психологическую поддержку', 'Сохраните все доказательства', 'При угрозах — немедленно обратитесь в полицию'],
    },
  ],
};

// ============================================
// 15. Склонность к риску Шуберта
// ============================================

const schubertRiskTest = {
  id: 'test-schubert-risk',
  titleRu: 'Склонность к риску (Шуберт)',
  titleKz: 'Тәуекелге бейімділік (Шуберт)',
  descriptionRu: 'Методика Г. Шуберта для диагностики склонности к рискованному поведению. Важный инструмент для профилактической работы.',
  descriptionKz: 'Г. Шуберттің тәуекелді мінез-құлыққа бейімділікті анықтау әдістемесі. Алдын алу жұмысының маңызды құралы.',
  category: TestCategory.CAREER,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 10,
  price: 3500,
  isPremium: true,
  order: 24,
};

const schubertRiskQuestions = [
  {
    questionTextRu: 'Превысили бы вы установленную скорость, чтобы быстрее добраться?',
    questionTextKz: 'Тезірек жету үшін белгіленген жылдамдықтан асар ма едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Согласились бы вы на опасную работу за хорошие деньги?',
    questionTextKz: 'Жақсы ақша үшін қауіпті жұмысқа келісер ме едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Стали бы вы на пути разъярённого быка?',
    questionTextKz: 'Ашулы бұқаның жолына тұрар ма едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Проехали бы вы на красный сигнал светофора ночью?',
    questionTextKz: 'Түнде бағдаршамның қызыл сигналынан өтер ме едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Рискнули бы вы первым войти в тёмное незнакомое помещение?',
    questionTextKz: 'Қараңғы бейтаныс бөлмеге бірінші болып кіруге тәуекел етер ме едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Могли бы вы прыгнуть с парашютом?',
    questionTextKz: 'Парашютпен секіре алар ма едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Могли бы вы по своей воле участвовать в экстремальном спорте?',
    questionTextKz: 'Өз еркіңізбен экстремалды спортқа қатыса алар ма едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
  {
    questionTextRu: 'Могли бы вы ехать на крыше вагона поезда?',
    questionTextKz: 'Пойыз вагонының шатырында жүре алар ма едіңіз?',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Нет', textKz: 'Жоқ', score: 0 },
      { textRu: 'Скорее нет', textKz: 'Жоққа жақын', score: 1 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 2 },
      { textRu: 'Скорее да', textKz: 'Иәге жақын', score: 3 },
      { textRu: 'Да', textKz: 'Иә', score: 4 },
    ],
  },
];

const schubertRiskInterpretation = {
  levels: [
    {
      minScore: 0, maxScore: 8, level: 'low',
      titleRu: 'Низкая склонность к риску',
      titleKz: 'Тәуекелге бейімділіктің төмен деңгейі',
      descriptionRu: 'Ребёнок осторожен и избегает рискованных ситуаций. Это нормально и безопасно.',
      recommendations: ['Поддерживайте разумную осторожность', 'Помогайте преодолевать излишние страхи', 'Поощряйте безопасные эксперименты'],
    },
    {
      minScore: 9, maxScore: 18, level: 'moderate',
      titleRu: 'Умеренная склонность к риску',
      titleKz: 'Тәуекелге орташа бейімділік',
      descriptionRu: 'Средний уровень склонности к риску. Ребёнок оценивает ситуацию, прежде чем рисковать.',
      recommendations: ['Обсуждайте последствия рискованных решений', 'Развивайте навыки оценки рисков', 'Предлагайте безопасные альтернативы для адреналина'],
    },
    {
      minScore: 19, maxScore: 25, level: 'high',
      titleRu: 'Высокая склонность к риску',
      titleKz: 'Тәуекелге жоғары бейімділік',
      descriptionRu: 'Повышенная склонность к рискованному поведению. Требуется внимание.',
      recommendations: ['Обсуждайте безопасность без осуждения', 'Направляйте энергию в безопасное русло (спорт)', 'Развивайте навыки принятия решений', 'Рассмотрите консультацию психолога'],
    },
    {
      minScore: 26, maxScore: 32, level: 'extreme',
      titleRu: 'Экстремальная склонность к риску',
      titleKz: 'Тәуекелге экстремалды бейімділік',
      descriptionRu: 'Опасно высокая склонность к риску. Ребёнок может подвергать себя серьёзной опасности.',
      recommendations: ['ВАЖНО: Рекомендуется консультация психолога', 'Обеспечьте безопасную среду', 'Предложите контролируемые экстремальные активности', 'Обсудите ценность жизни и здоровья'],
    },
  ],
};


// ============================================
// SEED FUNCTION
// ============================================

interface TestConfig {
  test: Record<string, any>;
  questions: Array<{
    questionTextRu: string;
    questionTextKz: string;
    questionType: QuestionType;
    options: Array<{ textRu: string; textKz: string; score: number }>;
  }>;
  interpretation: { levels: Array<Record<string, any>> };
  prefix: string;
}

export async function seedHrPlusTests(prisma: PrismaClient) {
  console.log('\n  Seeding HR+ (ASPPM) validated tests...');

  const allTests: TestConfig[] = [
    { test: spielbergerHaninTest, questions: spielbergerHaninQuestions, interpretation: spielbergerHaninInterpretation, prefix: 'spielberger' },
    { test: beckHopelessnessTest, questions: beckHopelessnessQuestions, interpretation: beckHopelessnessInterpretation, prefix: 'beck' },
    { test: olweusBullyingTest, questions: olweusBullyingQuestions, interpretation: olweusBullyingInterpretation, prefix: 'olweus' },
    { test: youngInternetTest, questions: youngInternetQuestions, interpretation: youngInternetInterpretation, prefix: 'young' },
    { test: shmishekTest, questions: shmishekQuestions, interpretation: shmishekInterpretation, prefix: 'shmishek' },
    { test: kondashTest, questions: kondashQuestions, interpretation: kondashInterpretation, prefix: 'kondash' },
    { test: maddiHardinessTest, questions: maddiHardinessQuestions, interpretation: maddiHardinessInterpretation, prefix: 'maddi' },
    { test: keirseyTest, questions: keirseyQuestions, interpretation: keirseyInterpretation, prefix: 'keirsey' },
    { test: eysenckEpiTest, questions: eysenckEpiQuestions, interpretation: eysenckEpiInterpretation, prefix: 'eysenck' },
    { test: schwartzValuesTest, questions: schwartzValuesQuestions, interpretation: schwartzValuesInterpretation, prefix: 'schwartz' },
    { test: gardnerIntelligenceTest, questions: gardnerIntelligenceQuestions, interpretation: gardnerIntelligenceInterpretation, prefix: 'gardner' },
    { test: kosTest, questions: kosQuestions, interpretation: kosInterpretation, prefix: 'kos' },
    { test: korchaginaLonelinessTest, questions: korchaginaLonelinessQuestions, interpretation: korchaginaLonelinessInterpretation, prefix: 'korchagina' },
    { test: cyberbullyingTest, questions: cyberbullyingQuestions, interpretation: cyberbullyingInterpretation, prefix: 'cyberbully' },
    { test: schubertRiskTest, questions: schubertRiskQuestions, interpretation: schubertRiskInterpretation, prefix: 'schubert' },
  ];

  let totalQuestions = 0;

  for (const { test, questions, interpretation, prefix } of allTests) {
    const interpretationConfig = {
      ranges: interpretation.levels.map(level => ({
        min: level.minScore,
        max: level.maxScore,
        level: level.level,
        title: level.titleRu,
        description: level.descriptionRu,
        recommendations: level.recommendations.join('\n'),
      })),
    };

    const testRecord = await prisma.test.upsert({
      where: { id: test.id },
      update: {
        scoringType: 'absolute',
        interpretationConfig,
      },
      create: {
        id: test.id,
        titleRu: test.titleRu,
        titleKz: test.titleKz,
        descriptionRu: test.descriptionRu,
        descriptionKz: test.descriptionKz,
        category: test.category,
        ageMin: test.ageMin,
        ageMax: test.ageMax,
        durationMinutes: test.durationMinutes,
        price: test.price,
        isPremium: test.isPremium,
        order: test.order,
        isActive: true,
        scoringType: 'absolute',
        interpretationConfig,
      },
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionId = `${prefix}-q-${i + 1}`;

      const question = await prisma.question.upsert({
        where: { id: questionId },
        update: {},
        create: {
          id: questionId,
          testId: testRecord.id,
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
          where: { id: `${prefix}-q${i + 1}-opt${j + 1}` },
          update: {},
          create: {
            id: `${prefix}-q${i + 1}-opt${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }

    totalQuestions += questions.length;
    console.log(`  ✅ ${test.titleRu} - ${questions.length} вопросов`);
  }

  console.log(`✅ HR+ tests seeded successfully!`);
  console.log(`   Total: ${allTests.length} tests, ${totalQuestions} questions`);
}
