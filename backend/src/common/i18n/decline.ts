/**
 * Склонение русских имён. Возвращает имя в нужном падеже либо исходную
 * форму, если уверенности нет (несклоняемые иностранные имена).
 *
 *   declineName('Дамир', 'MALE',   'dat')  → 'Дамиру'
 *   declineName('Дамир', 'MALE',   'gen')  → 'Дамира'
 *   declineName('Айлин', 'FEMALE', 'gen')  → 'Айлин'   (несклоняемое: ж.р. + согласная)
 *   declineName('Камила','FEMALE', 'gen')  → 'Камилы'
 *   declineName('Маша',  'FEMALE', 'gen')  → 'Маши'    (после ш → орф. -и)
 *   declineName('Алия',  'FEMALE', 'dat')  → 'Алие'
 *   declineName('Сергей','MALE',   'gen')  → 'Сергея'
 *   declineName('Илья',  'MALE',   'dat')  → 'Илье'
 *
 * Правила:
 *   - мужские с согласной → стандартное II склонение
 *   - мужские -й → Сергей→Сергея
 *   - мужские -а/-я (Никита, Илья) → как женские
 *   - женские -а → I склонение, с орф-правилом «после гкхжшщч → -и»
 *   - женские -я → Алия→Алии
 *   - всё прочее (особенно женские с согласной: Айлин, Кейт, Кармен,
 *     казахские Сауле, Гульназ) → несклоняемые, возвращаем как есть
 */

export type GrammaticalCase = 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'pre';
export type NameGender = 'MALE' | 'FEMALE';

const HUSH = new Set(['г', 'к', 'х', 'ж', 'ш', 'щ', 'ч']);

const suffixFor = (
  set: Record<Exclude<GrammaticalCase, 'nom'>, string>,
  c: GrammaticalCase,
): string => (c === 'nom' ? '' : set[c]);

export function declineName(name: string, gender: NameGender, c: GrammaticalCase): string {
  if (!name || c === 'nom') return name;
  const last = name[name.length - 1].toLowerCase();
  const prelast = name.length >= 2 ? name[name.length - 2].toLowerCase() : '';

  if (gender === 'MALE') {
    // Иностранные несклоняемые мужские: -о, -у, -е, -и, -ы, -ё, -э (Hugo, Pablo)
    if (['о', 'у', 'е', 'и', 'ы', 'ё', 'э'].includes(last)) return name;
    // -й: Сергей, Алексей → Сергея/Сергею/Сергея/Сергеем/Сергее
    if (last === 'й') {
      const base = name.slice(0, -1);
      return base + suffixFor({ gen: 'я', dat: 'ю', acc: 'я', ins: 'ем', pre: 'е' }, c);
    }
    // -ь: Игорь
    if (last === 'ь') {
      const base = name.slice(0, -1);
      return base + suffixFor({ gen: 'я', dat: 'ю', acc: 'я', ins: 'ем', pre: 'е' }, c);
    }
    // -а/-я: Никита/Илья — склоняются по «женскому» типу
    if (last === 'а') {
      const base = name.slice(0, -1);
      const set = HUSH.has(prelast)
        ? { gen: 'и', dat: 'е', acc: 'у', ins: 'ей', pre: 'е' }
        : { gen: 'ы', dat: 'е', acc: 'у', ins: 'ой', pre: 'е' };
      return base + suffixFor(set, c);
    }
    if (last === 'я') {
      const base = name.slice(0, -1);
      return base + suffixFor({ gen: 'и', dat: 'е', acc: 'ю', ins: 'ей', pre: 'е' }, c);
    }
    // Согласная (включая -к, -ш, -р, -т...): стандартный мужской
    return name + suffixFor({ gen: 'а', dat: 'у', acc: 'а', ins: 'ом', pre: 'е' }, c);
  }

  // FEMALE
  if (last === 'а') {
    const base = name.slice(0, -1);
    const set = HUSH.has(prelast)
      ? { gen: 'и', dat: 'е', acc: 'у', ins: 'ей', pre: 'е' }
      : { gen: 'ы', dat: 'е', acc: 'у', ins: 'ой', pre: 'е' };
    return base + suffixFor(set, c);
  }
  if (last === 'я') {
    const base = name.slice(0, -1);
    return base + suffixFor({ gen: 'и', dat: 'е', acc: 'ю', ins: 'ей', pre: 'е' }, c);
  }
  // Женские с согласной (Айлин, Кейт, Кармен, Сауле) или с другими гласными — несклоняемые
  return name;
}
