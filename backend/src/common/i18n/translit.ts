/**
 * Транслитерация русских/казахских имён в латиницу для генерации
 * email-адресов. Используется в сидере и при импорте пользователей.
 *
 *   translit('Айгерим') → 'aigerim'
 *   translit('Серикова') → 'serikova'
 *   makeEmail('Айгерим', 'Серикова') → 'aigerim.serikova@demo.zharqynbala.kz'
 */

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // казахские
  ә: 'a', ғ: 'g', қ: 'q', ң: 'ng', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
};

export function translit(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map(c => MAP[c] ?? (/[a-z0-9]/.test(c) ? c : ''))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const DEMO_DOMAIN = 'demo.zharqynbala.kz';

export function makeDemoEmail(firstName: string, lastName: string, suffix: number | string = ''): string {
  const fn = translit(firstName);
  const ln = translit(lastName);
  const tag = suffix === '' ? '' : `${suffix}`;
  return `${fn}.${ln}${tag}@${DEMO_DOMAIN}`;
}
