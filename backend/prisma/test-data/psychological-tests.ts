/**
 * Валидированные психологические тесты
 * Источники:
 * - Анкета школьной мотивации Н.Г. Лускановой
 * - Тест самооценки С.В. Ковалёва
 * - ДДО Е.А. Климова (профориентация)
 */

import { TestCategory, QuestionType, PrismaClient } from '@prisma/client';

// ============================================
// ТЕСТ 1: ШКОЛЬНАЯ МОТИВАЦИЯ (Лусканова)
// ============================================

export const schoolMotivationTest = {
  id: 'test-motivation-luskanova',
  titleRu: 'Оценка уровня школьной мотивации',
  titleKz: 'Мектеп мотивациясының деңгейін бағалау',
  descriptionRu: 'Методика Н.Г. Лускановой для определения уровня школьной мотивации учащихся. Помогает выявить отношение ребёнка к школе и учёбе.',
  descriptionKz: 'Оқушылардың мектеп мотивациясының деңгейін анықтауға арналған Н.Г. Лусканова әдістемесі.',
  category: TestCategory.MOTIVATION,
  ageMin: 7,
  ageMax: 12,
  durationMinutes: 10,
  price: 0,
  isPremium: false,
  order: 1,
};

export const schoolMotivationQuestions = [
  {
    questionTextRu: 'Тебе нравится в школе?',
    questionTextKz: 'Саған мектепте ұнай ма?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Не нравится', textKz: 'Ұнамайды', score: 0 },
      { textRu: 'Не очень нравится', textKz: 'Онша ұнамайды', score: 1 },
      { textRu: 'Нравится', textKz: 'Ұнайды', score: 3 },
    ],
  },
  {
    questionTextRu: 'Утром, когда ты просыпаешься, ты всегда с радостью идёшь в школу или тебе часто хочется остаться дома?',
    questionTextKz: 'Таңертең оянғанда, сен әрқашан қуана мектепке барасың ба, әлде жиі үйде қалғың келе ме?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Чаще хочется остаться дома', textKz: 'Жиі үйде қалғым келеді', score: 0 },
      { textRu: 'Бывает по-разному', textKz: 'Әртүрлі болады', score: 1 },
      { textRu: 'Иду с радостью', textKz: 'Қуана барамын', score: 3 },
    ],
  },
  {
    questionTextRu: 'Если бы учитель сказал, что завтра в школу необязательно приходить всем ученикам, желающие могут остаться дома, ты бы пошёл в школу или остался дома?',
    questionTextKz: 'Егер мұғалім ертең мектепке барудың міндетті емес екенін, қалағандар үйде қала алатынын айтса, сен мектепке барар ма едің, әлде үйде қалар ма едің?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 0 },
      { textRu: 'Остался бы дома', textKz: 'Үйде қалар едім', score: 1 },
      { textRu: 'Пошёл бы в школу', textKz: 'Мектепке барар едім', score: 3 },
    ],
  },
  {
    questionTextRu: 'Тебе нравится, когда у вас отменяют какие-нибудь уроки?',
    questionTextKz: 'Саған сабақтар болмай қалғанда ұнай ма?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Не нравится', textKz: 'Ұнамайды', score: 3 },
      { textRu: 'Бывает по-разному', textKz: 'Әртүрлі болады', score: 1 },
      { textRu: 'Нравится', textKz: 'Ұнайды', score: 0 },
    ],
  },
  {
    questionTextRu: 'Ты хотел бы, чтобы тебе не задавали домашних заданий?',
    questionTextKz: 'Сен үй тапсырмасы берілмесін деп қалар ма едің?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Хотел бы', textKz: 'Қалар едім', score: 0 },
      { textRu: 'Не хотел бы', textKz: 'Қаламас едім', score: 3 },
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 1 },
    ],
  },
  {
    questionTextRu: 'Ты хотел бы, чтобы в школе остались одни перемены?',
    questionTextKz: 'Сен мектепте тек үзілістер ғана қалсын деп қалар ма едің?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Не знаю', textKz: 'Білмеймін', score: 1 },
      { textRu: 'Не хотел бы', textKz: 'Қаламас едім', score: 3 },
      { textRu: 'Хотел бы', textKz: 'Қалар едім', score: 0 },
    ],
  },
  {
    questionTextRu: 'Ты часто рассказываешь о школе родителям?',
    questionTextKz: 'Сен мектеп туралы ата-анаңа жиі айтасың ба?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Часто', textKz: 'Жиі', score: 3 },
      { textRu: 'Редко', textKz: 'Сирек', score: 1 },
      { textRu: 'Не рассказываю', textKz: 'Айтпаймын', score: 0 },
    ],
  },
  {
    questionTextRu: 'Ты хотел бы, чтобы у тебя был менее строгий учитель?',
    questionTextKz: 'Сен мұғалімің қатал болмаса деп қалар ма едің?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Точно не знаю', textKz: 'Нақты білмеймін', score: 1 },
      { textRu: 'Хотел бы', textKz: 'Қалар едім', score: 0 },
      { textRu: 'Не хотел бы', textKz: 'Қаламас едім', score: 3 },
    ],
  },
  {
    questionTextRu: 'У тебя в классе много друзей?',
    questionTextKz: 'Сыныпта досың көп пе?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Мало', textKz: 'Аз', score: 1 },
      { textRu: 'Много', textKz: 'Көп', score: 3 },
      { textRu: 'Нет друзей', textKz: 'Достарым жоқ', score: 0 },
    ],
  },
  {
    questionTextRu: 'Тебе нравятся твои одноклассники?',
    questionTextKz: 'Саған сыныптастарың ұнай ма?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { textRu: 'Нравятся', textKz: 'Ұнайды', score: 3 },
      { textRu: 'Не очень', textKz: 'Онша емес', score: 1 },
      { textRu: 'Не нравятся', textKz: 'Ұнамайды', score: 0 },
    ],
  },
];

// Интерпретация результатов теста Лускановой
export const schoolMotivationInterpretation = {
  levels: [
    {
      minScore: 25,
      maxScore: 30,
      level: 'high',
      titleRu: 'Высокий уровень школьной мотивации',
      titleKz: 'Мектеп мотивациясының жоғары деңгейі',
      descriptionRu: 'У ребёнка высокий уровень школьной мотивации и учебной активности. Такие дети отличаются наличием высоких познавательных мотивов, стремлением наиболее успешно выполнять все предъявляемые школой требования. Они очень чётко следуют всем указаниям учителя, добросовестны и ответственны, сильно переживают, если получают неудовлетворительные оценки.',
      recommendations: [
        'Поддерживайте интерес ребёнка к учёбе',
        'Предлагайте дополнительные развивающие задания',
        'Следите, чтобы ребёнок не переутомлялся',
        'Хвалите за старание, а не только за результат',
      ],
    },
    {
      minScore: 20,
      maxScore: 24,
      level: 'good',
      titleRu: 'Хорошая школьная мотивация',
      titleKz: 'Жақсы мектеп мотивациясы',
      descriptionRu: 'Подобные показатели имеют большинство учащихся начальных классов, успешно справляющихся с учебной деятельностью. Такой уровень мотивации является средней нормой.',
      recommendations: [
        'Продолжайте поддерживать интерес к учёбе',
        'Обсуждайте с ребёнком школьные события',
        'Помогайте справляться с трудностями',
        'Поощряйте общение с одноклассниками',
      ],
    },
    {
      minScore: 15,
      maxScore: 19,
      level: 'average',
      titleRu: 'Положительное отношение к школе',
      titleKz: 'Мектепке оң көзқарас',
      descriptionRu: 'Школа привлекает таких детей внеучебной деятельностью. Такие дети достаточно благополучно чувствуют себя в школе, однако чаще ходят в школу, чтобы общаться с друзьями, учителем. Познавательные мотивы у таких детей сформированы в меньшей степени, и учебный процесс их мало привлекает.',
      recommendations: [
        'Постарайтесь заинтересовать ребёнка учебными предметами',
        'Покажите практическую пользу знаний',
        'Используйте игровые формы обучения',
        'Обратите внимание на развитие познавательных интересов',
      ],
    },
    {
      minScore: 10,
      maxScore: 14,
      level: 'low',
      titleRu: 'Низкая школьная мотивация',
      titleKz: 'Мектеп мотивациясының төмен деңгейі',
      descriptionRu: 'Подобные школьники посещают школу неохотно, предпочитают пропускать занятия. На уроках часто занимаются посторонними делами, играми. Испытывают серьёзные затруднения в учебной деятельности. Находятся в состоянии неустойчивой адаптации к школе.',
      recommendations: [
        'Выясните причины нежелания ходить в школу',
        'Поговорите с классным руководителем',
        'Обратите внимание на отношения с одноклассниками',
        'Рассмотрите возможность консультации с психологом',
        'Создайте позитивную атмосферу вокруг темы школы',
      ],
    },
    {
      minScore: 0,
      maxScore: 9,
      level: 'negative',
      titleRu: 'Негативное отношение к школе',
      titleKz: 'Мектепке теріс көзқарас',
      descriptionRu: 'Такие дети испытывают серьёзные трудности в школе: они не справляются с учебной деятельностью, испытывают проблемы в общении с одноклассниками, во взаимоотношениях с учителем. Школа нередко воспринимается ими как враждебная среда, пребывание в которой для них невыносимо.',
      recommendations: [
        'ВАЖНО: Рекомендуется консультация детского психолога',
        'Срочно выясните причины проблем в школе',
        'Поговорите с учителем и школьным психологом',
        'Проверьте, нет ли буллинга',
        'Создайте дома атмосферу безопасности и принятия',
        'Не критикуйте ребёнка за школьные неудачи',
      ],
    },
  ],
};

// ============================================
// ТЕСТ 2: САМООЦЕНКА (Ковалёв)
// ============================================

export const selfEsteemTest = {
  id: 'test-selfesteem-kovalev',
  titleRu: 'Определение уровня самооценки',
  titleKz: 'Өзін-өзі бағалау деңгейін анықтау',
  descriptionRu: 'Методика С.В. Ковалёва для определения уровня самооценки личности. Помогает понять, как ребёнок воспринимает себя и свои возможности.',
  descriptionKz: 'Тұлғаның өзін-өзі бағалау деңгейін анықтауға арналған С.В. Ковалёв әдістемесі.',
  category: TestCategory.SELF_ESTEEM,
  ageMin: 12,
  ageMax: 17,
  durationMinutes: 15,
  price: 0,
  isPremium: false,
  order: 2,
};

export const selfEsteemQuestions = [
  {
    questionTextRu: 'Мне хочется, чтобы мои друзья подбадривали меня.',
    questionTextKz: 'Мен достарымның мені қолдауын қалаймын.',
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
    // Вопрос 2 - ПОЗИТИВНОЕ утверждение (ответственность = высокая самооценка)
    // Требует ИНВЕРТИРОВАННОЙ шкалы: часто = меньше баллов
    questionTextRu: 'Постоянно чувствую свою ответственность за работу (учёбу).',
    questionTextKz: 'Мен жұмысым (оқуым) үшін жауапкершілікті үнемі сезінемін.',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 4 },
      { textRu: 'Редко', textKz: 'Сирек', score: 3 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
      { textRu: 'Часто', textKz: 'Жиі', score: 1 },
      { textRu: 'Очень часто', textKz: 'Өте жиі', score: 0 },
    ],
  },
  {
    questionTextRu: 'Я беспокоюсь о своём будущем.',
    questionTextKz: 'Мен болашағым туралы алаңдаймын.',
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
    questionTextRu: 'Многие меня ненавидят.',
    questionTextKz: 'Көптеген адамдар мені жек көреді.',
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
    questionTextRu: 'Я обладаю меньшей инициативой, нежели другие.',
    questionTextKz: 'Менің бастамашылығым басқаларға қарағанда аз.',
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
    questionTextRu: 'Я беспокоюсь за своё психическое состояние.',
    questionTextKz: 'Мен психикалық жағдайым туралы алаңдаймын.',
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
    questionTextRu: 'Я боюсь выглядеть глупцом.',
    questionTextKz: 'Мен ақымақ болып көрінуден қорқамын.',
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
    questionTextRu: 'Внешний вид других куда лучше, чем мой.',
    questionTextKz: 'Басқалардың сыртқы көрінісі менікінен әлдеқайда жақсы.',
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
    questionTextRu: 'Я боюсь выступать с речью перед незнакомыми людьми.',
    questionTextKz: 'Мен бейтаныс адамдардың алдында сөйлеуден қорқамын.',
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
    questionTextRu: 'Я часто допускаю ошибки.',
    questionTextKz: 'Мен жиі қателесемін.',
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
    questionTextRu: 'Как жаль, что я не умею говорить как следует с людьми.',
    questionTextKz: 'Мен адамдармен дұрыс сөйлесе алмайтыным өкінішті.',
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
    questionTextRu: 'Как жаль, что мне не хватает уверенности в себе.',
    questionTextKz: 'Маған өзіме деген сенімділік жетіспейтіні өкінішті.',
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
    questionTextRu: 'Мне бы хотелось, чтобы мои действия одобрялись другими чаще.',
    questionTextKz: 'Менің әрекеттерім басқалар тарапынан жиі мақұлдансын деп қалар едім.',
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
    questionTextRu: 'Я слишком скромен.',
    questionTextKz: 'Мен тым қарапайыммын.',
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
    questionTextRu: 'Моя жизнь бесполезна.',
    questionTextKz: 'Менің өмірім пайдасыз.',
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
    questionTextRu: 'Многие неправильного мнения обо мне.',
    questionTextKz: 'Көптеген адамдар мен туралы қате пікірде.',
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
    questionTextRu: 'Мне не с кем поделиться своими мыслями.',
    questionTextKz: 'Менің ойларыммен бөлісетін адамым жоқ.',
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
    questionTextRu: 'Люди ждут от меня многого.',
    questionTextKz: 'Адамдар менен көп нәрсе күтеді.',
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
    questionTextRu: 'Люди не особенно интересуются моими достижениями.',
    questionTextKz: 'Адамдар менің жетістіктеріме онша қызықпайды.',
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
    questionTextRu: 'Я слегка смущаюсь.',
    questionTextKz: 'Мен сәл ұялшақпын.',
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
    questionTextRu: 'Я чувствую, что многие люди не понимают меня.',
    questionTextKz: 'Мен көптеген адамдардың мені түсінбейтінін сезінемін.',
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
    questionTextRu: 'Я не чувствую себя в безопасности.',
    questionTextKz: 'Мен өзімді қауіпсіздікте сезінбеймін.',
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
    questionTextRu: 'Я часто понапрасну волнуюсь.',
    questionTextKz: 'Мен жиі бекер толқимын.',
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
    questionTextRu: 'Я чувствую себя неловко, когда вхожу в комнату, где уже сидят люди.',
    questionTextKz: 'Мен адамдар отырған бөлмеге кіргенде өзімді ыңғайсыз сезінемін.',
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
    questionTextRu: 'Я чувствую себя скованным.',
    questionTextKz: 'Мен өзімді тежелген сезінемін.',
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
    questionTextRu: 'Я чувствую, что люди говорят обо мне за моей спиной.',
    questionTextKz: 'Мен адамдардың мен туралы артымнан сөйлейтінін сезінемін.',
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
    questionTextRu: 'Я уверен, что люди почти всё принимают легче, чем я.',
    questionTextKz: 'Мен адамдардың барлығын менен оңайырақ қабылдайтынына сенімдімін.',
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
    questionTextRu: 'Мне кажется, что со мной должна случиться какая-нибудь неприятность.',
    questionTextKz: 'Маған бірдеңе жаман болатын сияқты көрінеді.',
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
    questionTextRu: 'Меня волнует мысль о том, как люди относятся ко мне.',
    questionTextKz: 'Адамдардың маған қалай қарайтыны туралы ойлар мені толғандырады.',
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
    questionTextRu: 'Как жаль, что я не так общителен.',
    questionTextKz: 'Мен онша қарым-қатынасшыл еместігім өкінішті.',
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
    questionTextRu: 'В спорах я высказываюсь только тогда, когда уверен в своей правоте.',
    questionTextKz: 'Дауларда мен тек өзімнің дұрыс екеніме сенімді болғанда ғана пікірімді айтамын.',
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
    questionTextRu: 'Я думаю о том, чего ждут от меня люди.',
    questionTextKz: 'Мен адамдардың менен не күтетіні туралы ойлаймын.',
    questionType: QuestionType.SCALE,
    options: [
      { textRu: 'Никогда', textKz: 'Ешқашан', score: 0 },
      { textRu: 'Редко', textKz: 'Сирек', score: 1 },
      { textRu: 'Иногда', textKz: 'Кейде', score: 2 },
      { textRu: 'Часто', textKz: 'Жиі', score: 3 },
      { textRu: 'Очень часто', textKz: 'Өте жиі', score: 4 },
    ],
  },
];

// Интерпретация теста самооценки Ковалёва
export const selfEsteemInterpretation = {
  levels: [
    {
      minScore: 0,
      maxScore: 25,
      level: 'high',
      titleRu: 'Высокий уровень самооценки',
      titleKz: 'Өзін-өзі бағалаудың жоғары деңгейі',
      descriptionRu: 'У подростка адекватно высокий уровень самооценки. Он уверен в себе, объективно оценивает свои возможности и способности. Это является хорошим показателем психологического здоровья.',
      recommendations: [
        'Поддерживайте уверенность ребёнка в себе',
        'Поощряйте новые начинания и инициативы',
        'Помогайте ставить реалистичные цели',
        'Учите конструктивно воспринимать критику',
      ],
    },
    {
      minScore: 26,
      maxScore: 45,
      level: 'average',
      titleRu: 'Средний уровень самооценки',
      titleKz: 'Өзін-өзі бағалаудың орташа деңгейі',
      descriptionRu: 'Самооценка находится в пределах нормы. Подросток в целом адекватно оценивает себя, но в отдельных ситуациях может испытывать неуверенность. Это нормальное состояние для подросткового возраста.',
      recommendations: [
        'Обращайте внимание на достижения ребёнка',
        'Помогайте справляться с неудачами',
        'Поддерживайте в стрессовых ситуациях',
        'Развивайте сильные стороны подростка',
      ],
    },
    {
      minScore: 46,
      maxScore: 128,
      level: 'low',
      titleRu: 'Низкий уровень самооценки',
      titleKz: 'Өзін-өзі бағалаудың төмен деңгейі',
      descriptionRu: 'У подростка выявлен низкий уровень самооценки. Он склонен недооценивать себя и свои возможности, может испытывать трудности в общении и принятии решений. Требуется особое внимание к психологическому состоянию.',
      recommendations: [
        'ВАЖНО: Рекомендуется консультация психолога',
        'Создайте атмосферу безусловного принятия дома',
        'Никогда не сравнивайте ребёнка с другими',
        'Отмечайте даже небольшие успехи',
        'Избегайте критики личности, критикуйте только поступки',
        'Помогите найти увлечение, где ребёнок успешен',
        'Развивайте навыки общения в безопасной среде',
      ],
    },
  ],
};

// ============================================
// ТЕСТ 3: ПРОФОРИЕНТАЦИЯ (ДДО Климова)
// ============================================

export const careerTest = {
  id: 'test-career-klimov',
  titleRu: 'Профориентация (ДДО Климова)',
  titleKz: 'Кәсіптік бағдар (Климов ДДО)',
  descriptionRu: 'Дифференциально-диагностический опросник Е.А. Климова для определения склонности к различным типам профессий. Помогает в выборе будущей специальности.',
  descriptionKz: 'Әртүрлі кәсіп түрлеріне бейімділікті анықтауға арналған Е.А. Климовтың дифференциалдық-диагностикалық сауалнамасы.',
  category: TestCategory.CAREER,
  ageMin: 14,
  ageMax: 17,
  durationMinutes: 20,
  price: 0,
  isPremium: false,
  order: 3,
};

export const careerQuestions = [
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 1,
    options: [
      { textRu: 'Ухаживать за животными', textKz: 'Жануарларға күтім жасау', score: 1, category: 'nature' },
      { textRu: 'Обслуживать машины, приборы (следить, регулировать)', textKz: 'Машиналарға, аспаптарға қызмет көрсету', score: 1, category: 'tech' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 2,
    options: [
      { textRu: 'Помогать больным', textKz: 'Ауруларға көмектесу', score: 1, category: 'human' },
      { textRu: 'Составлять таблицы, схемы, программы', textKz: 'Кестелер, схемалар, бағдарламалар құрастыру', score: 1, category: 'sign' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 3,
    options: [
      { textRu: 'Следить за качеством книжных иллюстраций, плакатов', textKz: 'Кітап иллюстрацияларының сапасын бақылау', score: 1, category: 'art' },
      { textRu: 'Следить за состоянием, развитием растений', textKz: 'Өсімдіктердің жай-күйін бақылау', score: 1, category: 'nature' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 4,
    options: [
      { textRu: 'Обрабатывать материалы (дерево, ткань, металл)', textKz: 'Материалдарды өңдеу (ағаш, мата, металл)', score: 1, category: 'tech' },
      { textRu: 'Доводить товары до потребителя, рекламировать, продавать', textKz: 'Тауарларды тұтынушыға жеткізу, жарнамалау', score: 1, category: 'human' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 5,
    options: [
      { textRu: 'Обсуждать научно-популярные книги, статьи', textKz: 'Ғылыми-көпшілік кітаптарды талқылау', score: 1, category: 'sign' },
      { textRu: 'Обсуждать художественные книги, пьесы, концерты', textKz: 'Көркем кітаптарды, спектакльдерді талқылау', score: 1, category: 'art' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 6,
    options: [
      { textRu: 'Выращивать молодняк животных', textKz: 'Жас малдарды өсіру', score: 1, category: 'nature' },
      { textRu: 'Тренировать товарищей в выполнении действий', textKz: 'Жолдастарды әрекеттерді орындауға үйрету', score: 1, category: 'human' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 7,
    options: [
      { textRu: 'Копировать рисунки, настраивать музыкальные инструменты', textKz: 'Суреттерді көшіру, музыкалық аспаптарды баптау', score: 1, category: 'art' },
      { textRu: 'Управлять грузовым транспортом, краном', textKz: 'Жүк көлігін, кранды басқару', score: 1, category: 'tech' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 8,
    options: [
      { textRu: 'Сообщать, разъяснять людям нужные им сведения', textKz: 'Адамдарға қажетті мәліметтерді түсіндіру', score: 1, category: 'human' },
      { textRu: 'Оформлять выставки, витрины', textKz: 'Көрмелерді, витриналарды безендіру', score: 1, category: 'art' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 9,
    options: [
      { textRu: 'Ремонтировать вещи, изделия, жилище', textKz: 'Заттарды, бұйымдарды жөндеу', score: 1, category: 'tech' },
      { textRu: 'Искать и исправлять ошибки в текстах, таблицах', textKz: 'Мәтіндердегі қателерді іздеу және түзету', score: 1, category: 'sign' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 10,
    options: [
      { textRu: 'Лечить животных', textKz: 'Жануарларды емдеу', score: 1, category: 'nature' },
      { textRu: 'Выполнять вычисления, расчёты', textKz: 'Есептеулер жүргізу', score: 1, category: 'sign' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 11,
    options: [
      { textRu: 'Выводить новые сорта растений', textKz: 'Өсімдіктердің жаңа сорттарын шығару', score: 1, category: 'nature' },
      { textRu: 'Конструировать, проектировать новые виды изделий', textKz: 'Жаңа бұйым түрлерін құрастыру, жобалау', score: 1, category: 'tech' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 12,
    options: [
      { textRu: 'Разбирать споры, ссоры между людьми, убеждать', textKz: 'Адамдар арасындағы дауларды шешу, сендіру', score: 1, category: 'human' },
      { textRu: 'Разбираться в чертежах, схемах, таблицах', textKz: 'Сызбаларды, схемаларды түсіну', score: 1, category: 'sign' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 13,
    options: [
      { textRu: 'Наблюдать, изучать работу кружков художественной самодеятельности', textKz: 'Көркемөнерпаздар үйірмелерінің жұмысын бақылау', score: 1, category: 'art' },
      { textRu: 'Наблюдать, изучать жизнь микробов', textKz: 'Микробтардың тіршілігін бақылау, зерттеу', score: 1, category: 'nature' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 14,
    options: [
      { textRu: 'Обслуживать, налаживать медицинские приборы', textKz: 'Медициналық аспаптарға қызмет көрсету', score: 1, category: 'tech' },
      { textRu: 'Оказывать людям медицинскую помощь при ранениях', textKz: 'Адамдарға жарақат кезінде медициналық көмек көрсету', score: 1, category: 'human' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 15,
    options: [
      { textRu: 'Составлять точные описания-отчёты о наблюдаемых явлениях', textKz: 'Бақыланатын құбылыстар туралы есептер жасау', score: 1, category: 'sign' },
      { textRu: 'Художественно описывать, изображать события', textKz: 'Оқиғаларды көркем сипаттау, бейнелеу', score: 1, category: 'art' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 16,
    options: [
      { textRu: 'Делать лабораторные анализы в больнице', textKz: 'Ауруханада зертханалық талдаулар жасау', score: 1, category: 'nature' },
      { textRu: 'Принимать, осматривать больных, беседовать с ними', textKz: 'Науқастарды қабылдау, олармен әңгімелесу', score: 1, category: 'human' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 17,
    options: [
      { textRu: 'Красить или расписывать стены помещений', textKz: 'Бөлме қабырғаларын бояу немесе суретпен безендіру', score: 1, category: 'art' },
      { textRu: 'Осуществлять монтаж или сборку машин, приборов', textKz: 'Машиналарды, аспаптарды монтаждау немесе құрастыру', score: 1, category: 'tech' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 18,
    options: [
      { textRu: 'Организовать культпоходы в театры, музеи, экскурсии', textKz: 'Театрларға, мұражайларға мәдени сапарлар ұйымдастыру', score: 1, category: 'human' },
      { textRu: 'Играть на сцене, принимать участие в концертах', textKz: 'Сахнада ойнау, концерттерге қатысу', score: 1, category: 'art' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 19,
    options: [
      { textRu: 'Изготовлять по чертежам детали, изделия, строить здания', textKz: 'Сызбалар бойынша бөлшектер, бұйымдар жасау', score: 1, category: 'tech' },
      { textRu: 'Заниматься черчением, копировать чертежи, карты', textKz: 'Сызумен айналысу, сызбаларды, карталарды көшіру', score: 1, category: 'sign' },
    ],
  },
  {
    questionTextRu: 'Какая деятельность вам ближе?',
    questionTextKz: 'Сізге қай қызмет жақынырақ?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    pairNumber: 20,
    options: [
      { textRu: 'Вести борьбу с болезнями растений, с вредителями леса', textKz: 'Өсімдік ауруларымен, орман зиянкестерімен күресу', score: 1, category: 'nature' },
      { textRu: 'Работать на клавишных машинах (компьютер, набор текста)', textKz: 'Пернетақта машиналарында жұмыс істеу (компьютер)', score: 1, category: 'sign' },
    ],
  },
];

// Интерпретация теста ДДО Климова
export const careerInterpretation = {
  categories: {
    nature: {
      titleRu: 'Человек — Природа',
      titleKz: 'Адам — Табиғат',
      descriptionRu: 'Вам подходят профессии, связанные с живой и неживой природой: агроном, ветеринар, эколог, геолог, биолог, лесник, садовник, фермер.',
      professions: ['Агроном', 'Ветеринар', 'Эколог', 'Биолог', 'Геолог', 'Лесник', 'Фермер', 'Садовник', 'Зоолог'],
    },
    tech: {
      titleRu: 'Человек — Техника',
      titleKz: 'Адам — Техника',
      descriptionRu: 'Вам подходят профессии, связанные с техникой: инженер, программист, механик, электрик, архитектор, строитель, водитель.',
      professions: ['Инженер', 'Программист', 'Механик', 'Электрик', 'Архитектор', 'Строитель', 'Системный администратор', 'Робототехник'],
    },
    human: {
      titleRu: 'Человек — Человек',
      titleKz: 'Адам — Адам',
      descriptionRu: 'Вам подходят профессии, связанные с общением и помощью людям: врач, учитель, психолог, менеджер, продавец, юрист, журналист.',
      professions: ['Врач', 'Учитель', 'Психолог', 'Менеджер', 'Юрист', 'Журналист', 'Социальный работник', 'HR-специалист'],
    },
    sign: {
      titleRu: 'Человек — Знаковая система',
      titleKz: 'Адам — Белгі жүйесі',
      descriptionRu: 'Вам подходят профессии, связанные с информацией и знаками: программист, бухгалтер, переводчик, экономист, математик, аналитик.',
      professions: ['Программист', 'Бухгалтер', 'Переводчик', 'Экономист', 'Аналитик данных', 'Математик', 'Статистик', 'Редактор'],
    },
    art: {
      titleRu: 'Человек — Художественный образ',
      titleKz: 'Адам — Көркем бейне',
      descriptionRu: 'Вам подходят творческие профессии: художник, дизайнер, музыкант, актёр, режиссёр, писатель, фотограф, модельер.',
      professions: ['Художник', 'Дизайнер', 'Музыкант', 'Актёр', 'Режиссёр', 'Фотограф', 'Модельер', 'Архитектор'],
    },
  },
};

// ============================================
// ФУНКЦИЯ SEED ДЛЯ ДОБАВЛЕНИЯ ТЕСТОВ В БД
// ============================================

/**
 * Добавляет валидированные психологические тесты в базу данных
 */
export async function seedValidatedTests(prisma: PrismaClient): Promise<void> {
  console.log('📚 Seeding validated psychological tests...');

  // ============================================
  // ТЕСТ 1: Школьная мотивация (Лусканова)
  // ============================================

  // Формируем конфигурацию интерпретации для теста Лускановой
  const luskanovaInterpretationConfig = {
    ranges: schoolMotivationInterpretation.levels.map(level => ({
      min: level.minScore,
      max: level.maxScore,
      level: level.level,
      title: level.titleRu,
      description: level.descriptionRu,
      recommendations: level.recommendations.join('\n• '),
    })),
  };

  const motivationTest = await prisma.test.upsert({
    where: { id: schoolMotivationTest.id },
    update: {
      scoringType: 'absolute',
      interpretationConfig: luskanovaInterpretationConfig,
    },
    create: {
      id: schoolMotivationTest.id,
      titleRu: schoolMotivationTest.titleRu,
      titleKz: schoolMotivationTest.titleKz,
      descriptionRu: schoolMotivationTest.descriptionRu,
      descriptionKz: schoolMotivationTest.descriptionKz,
      category: schoolMotivationTest.category,
      ageMin: schoolMotivationTest.ageMin,
      ageMax: schoolMotivationTest.ageMax,
      durationMinutes: schoolMotivationTest.durationMinutes,
      price: schoolMotivationTest.price,
      isPremium: schoolMotivationTest.isPremium,
      order: schoolMotivationTest.order,
      scoringType: 'absolute',
      interpretationConfig: luskanovaInterpretationConfig,
    },
  });

  // Добавляем вопросы школьной мотивации
  for (let i = 0; i < schoolMotivationQuestions.length; i++) {
    const q = schoolMotivationQuestions[i];
    const questionId = `luskanova-q-${i + 1}`;

    const question = await prisma.question.upsert({
      where: { id: questionId },
      update: {},
      create: {
        id: questionId,
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
        where: { id: `luskanova-q${i + 1}-opt${j + 1}` },
        update: {},
        create: {
          id: `luskanova-q${i + 1}-opt${j + 1}`,
          questionId: question.id,
          optionTextRu: opt.textRu,
          optionTextKz: opt.textKz,
          score: opt.score,
          order: j + 1,
        },
      });
    }
  }
  console.log('  ✅ Школьная мотивация (Лусканова) - 10 вопросов');

  // ============================================
  // ТЕСТ 2: Самооценка (Ковалёв)
  // ============================================
  const selfEsteemTestRecord = await prisma.test.upsert({
    where: { id: selfEsteemTest.id },
    update: {},
    create: {
      id: selfEsteemTest.id,
      titleRu: selfEsteemTest.titleRu,
      titleKz: selfEsteemTest.titleKz,
      descriptionRu: selfEsteemTest.descriptionRu,
      descriptionKz: selfEsteemTest.descriptionKz,
      category: selfEsteemTest.category,
      ageMin: selfEsteemTest.ageMin,
      ageMax: selfEsteemTest.ageMax,
      durationMinutes: selfEsteemTest.durationMinutes,
      price: selfEsteemTest.price,
      isPremium: selfEsteemTest.isPremium,
      order: selfEsteemTest.order,
    },
  });

  // Добавляем вопросы самооценки
  for (let i = 0; i < selfEsteemQuestions.length; i++) {
    const q = selfEsteemQuestions[i];
    const questionId = `kovalev-q-${i + 1}`;

    const question = await prisma.question.upsert({
      where: { id: questionId },
      update: {},
      create: {
        id: questionId,
        testId: selfEsteemTestRecord.id,
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
        where: { id: `kovalev-q${i + 1}-opt${j + 1}` },
        update: {},
        create: {
          id: `kovalev-q${i + 1}-opt${j + 1}`,
          questionId: question.id,
          optionTextRu: opt.textRu,
          optionTextKz: opt.textKz,
          score: opt.score,
          order: j + 1,
        },
      });
    }
  }
  console.log('  ✅ Самооценка (Ковалёв) - 32 вопроса');

  // ============================================
  // ТЕСТ 3: Профориентация (ДДО Климова)
  // ============================================
  const careerTestRecord = await prisma.test.upsert({
    where: { id: careerTest.id },
    update: {},
    create: {
      id: careerTest.id,
      titleRu: careerTest.titleRu,
      titleKz: careerTest.titleKz,
      descriptionRu: careerTest.descriptionRu,
      descriptionKz: careerTest.descriptionKz,
      category: careerTest.category,
      ageMin: careerTest.ageMin,
      ageMax: careerTest.ageMax,
      durationMinutes: careerTest.durationMinutes,
      price: careerTest.price,
      isPremium: careerTest.isPremium,
      order: careerTest.order,
    },
  });

  // Добавляем вопросы профориентации
  for (let i = 0; i < careerQuestions.length; i++) {
    const q = careerQuestions[i];
    const questionId = `klimov-q-${i + 1}`;

    const question = await prisma.question.upsert({
      where: { id: questionId },
      update: {},
      create: {
        id: questionId,
        testId: careerTestRecord.id,
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
        where: { id: `klimov-q${i + 1}-opt${j + 1}` },
        update: {},
        create: {
          id: `klimov-q${i + 1}-opt${j + 1}`,
          questionId: question.id,
          optionTextRu: opt.textRu,
          optionTextKz: opt.textKz,
          score: opt.score,
          order: j + 1,
          metadata: { category: opt.category },
        },
      });
    }
  }
  console.log('  ✅ Профориентация (ДДО Климова) - 20 вопросов');

  console.log('✅ Validated psychological tests seeded successfully!');
  console.log('   Total: 3 tests, 62 questions');
}
