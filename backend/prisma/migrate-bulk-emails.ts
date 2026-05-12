/**
 * Однократно меняет bulk-parent-NNN@test.kz / bulk-psy-NNN@test.kz /
 * bulk-school-NNN@test.kz на человекочитаемые
 * имя.фамилия[N]@demo.zharqynbala.kz, чтобы для инвесторов было
 * правдоподобно. Bulk-prefix больше не нужен в email — оставляем
 * метку через `phone` или просто по домену @demo.zharqynbala.kz.
 *
 *   npx ts-node prisma/migrate-bulk-emails.ts
 */

import { PrismaClient } from '@prisma/client';
import { makeDemoEmail, DEMO_DOMAIN } from '../src/common/i18n/translit';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'bulk-' } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  console.log(`Найдено ${users.length} bulk-пользователей для миграции`);

  // Считаем коллизии email'ов
  const usedEmails = new Set<string>();
  // Уже занятые в БД email'ы (не-bulk), чтобы не конфликтнуть
  const existing = await prisma.user.findMany({
    where: { email: { contains: DEMO_DOMAIN } },
    select: { email: true },
  });
  existing.forEach(u => usedEmails.add(u.email));

  let updated = 0;
  for (const u of users) {
    let newEmail = makeDemoEmail(u.firstName, u.lastName);
    let n = 2;
    while (usedEmails.has(newEmail)) {
      newEmail = makeDemoEmail(u.firstName, u.lastName, n);
      n++;
    }
    usedEmails.add(newEmail);

    try {
      await prisma.user.update({
        where: { id: u.id },
        data: { email: newEmail },
      });
      updated++;
      if (updated % 25 === 0) console.log(`  ✓ ${updated}/${users.length}`);
    } catch (e: any) {
      console.warn(`  ✗ ${u.email} → ${newEmail}: ${e.message}`);
    }
  }
  console.log(`✅ Обновлено ${updated} email'ов`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
