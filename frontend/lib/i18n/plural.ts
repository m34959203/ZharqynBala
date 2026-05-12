/**
 * Russian pluralization helpers.
 *
 * `plural(n, one, few, many)` → возвращает ТОЛЬКО слово в нужной форме,
 * без числа. Так удобно склеивать с числами по месту.
 *
 *   plural(1, 'тест', 'теста', 'тестов')   → 'тест'
 *   plural(2, 'тест', 'теста', 'тестов')   → 'теста'
 *   plural(5, 'тест', 'теста', 'тестов')   → 'тестов'
 *   plural(11, 'тест', 'теста', 'тестов')  → 'тестов'  (исключение: 11-14)
 *   plural(21, 'тест', 'теста', 'тестов')  → 'тест'    (21, 31, 41...)
 *   plural(22, 'тест', 'теста', 'тестов')  → 'теста'
 *   plural(0, 'тест', 'теста', 'тестов')   → 'тестов'
 *
 * `pluralN(n, ...)` → возвращает «число + слово»:
 *
 *   pluralN(5, 'тест', 'теста', 'тестов')  → '5 тестов'
 *
 * Правила (по «1/2-4/5+» + исключение 11-14):
 *   - окончание 1 (кроме 11)            → ONE
 *   - окончания 2-4 (кроме 12-14)       → FEW
 *   - всё остальное (0, 5-20, 25-30...) → MANY
 */

export const plural = (n: number, one: string, few: string, many: string): string => {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};

export const pluralN = (n: number, one: string, few: string, many: string): string =>
  `${n} ${plural(n, one, few, many)}`;

// Готовые наборы для частых сущностей (чтобы не повторять формы).
export const W = {
  test:           ['тест', 'теста', 'тестов'] as const,
  testInProgress: ['тест в работе', 'теста в работе', 'тестов в работе'] as const,
  year:           ['год', 'года', 'лет'] as const,
  point:          ['балл', 'балла', 'баллов'] as const,
  consult:        ['консультация', 'консультации', 'консультаций'] as const,
  slot:           ['слот', 'слота', 'слотов'] as const,
  session:        ['сессия', 'сессии', 'сессий'] as const,
  minute:         ['минута', 'минуты', 'минут'] as const,
  hour:           ['час', 'часа', 'часов'] as const,
  day:            ['день', 'дня', 'дней'] as const,
  week:           ['неделя', 'недели', 'недель'] as const,
  child:          ['ребёнок', 'ребёнка', 'детей'] as const,
  client:         ['клиент', 'клиента', 'клиентов'] as const,
  psychologist:   ['психолог', 'психолога', 'психологов'] as const,
  user:           ['пользователь', 'пользователя', 'пользователей'] as const,
  parent:         ['родитель', 'родителя', 'родителей'] as const,
  student:        ['ученик', 'ученика', 'учеников'] as const,
  request:        ['запрос', 'запроса', 'запросов'] as const,
  payment:        ['платёж', 'платежа', 'платежей'] as const,
  rating:         ['отзыв', 'отзыва', 'отзывов'] as const,
};

export type PluralForms = readonly [one: string, few: string, many: string];

// Sugar: pluralW(W.test, 5) → '5 тестов'
export const pluralW = (forms: PluralForms, n: number): string => pluralN(n, forms[0], forms[1], forms[2]);
// Sugar: plural-only (no number): plurOnly(W.test, 5) → 'тестов'
export const plurOnly = (forms: PluralForms, n: number): string => plural(n, forms[0], forms[1], forms[2]);
