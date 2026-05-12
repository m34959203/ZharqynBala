/**
 * Демо-история для parent@test.kz: 2 ребёнка, 22 прохождения, 4 консультации,
 * 4 платежа. Идемпотентен. Запуск:
 *   npx ts-node prisma/seed-parent-demo.ts
 */

import { PrismaClient, Gender, SessionStatus, RiskZone, ConsultationStatus, PaymentStatus, TransactionStatus, PaymentType, PaymentProvider } from '@prisma/client';

const prisma = new PrismaClient();

const PARENT_EMAIL = 'parent@test.kz';
const PSY_EMAIL = 'psychologist@test.kz';

const AILIN_FIRST = 'Айлин';
const AILIN_LAST  = 'Тестова';
const DAMIR_FIRST = 'Дамир';
const DAMIR_LAST  = 'Тестов';

const daysAgo = (n: number, hour = 12): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('🌱 demo parent seed start');

  const parent = await prisma.user.findUnique({ where: { email: PARENT_EMAIL } });
  if (!parent) {
    console.error('❌ no parent@test.kz — run main seed.ts first');
    process.exit(1);
  }

  const psyUser = await prisma.user.findUnique({
    where: { email: PSY_EMAIL },
    include: { psychologist: true },
  });
  if (!psyUser?.psychologist) {
    console.error('❌ no psychologist@test.kz with profile');
    process.exit(1);
  }
  const psyId = psyUser.psychologist.id;

  // ─── Children: Айлин + Дамир ───
  let ailin = await prisma.child.findFirst({
    where: { parentId: parent.id, firstName: AILIN_FIRST },
  });
  if (!ailin) {
    ailin = await prisma.child.create({
      data: {
        parentId: parent.id,
        firstName: AILIN_FIRST,
        lastName: AILIN_LAST,
        birthDate: new Date('2014-03-12'),
        gender: Gender.FEMALE,
        schoolName: 'КГУ Школа-лицей №5',
        grade: '5 класс',
        createdAt: daysAgo(120),
      },
    });
    console.log(`  ✓ created Айлин ${ailin.id}`);
  } else {
    console.log(`  • Айлин exists ${ailin.id}`);
  }

  let damir = await prisma.child.findFirst({
    where: { parentId: parent.id, firstName: DAMIR_FIRST },
  });
  if (!damir) {
    damir = await prisma.child.create({
      data: {
        parentId: parent.id,
        firstName: DAMIR_FIRST,
        lastName: DAMIR_LAST,
        birthDate: new Date('2016-09-08'),
        gender: Gender.MALE,
        schoolName: 'КГУ Школа-лицей №5',
        grade: '3 класс',
        createdAt: daysAgo(95),
      },
    });
    console.log(`  ✓ created Дамир ${damir.id}`);
  }

  // ─── Test sessions для детей ───
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    select: { id: true, isPremium: true, price: true, category: true, titleRu: true },
  });

  const seedAttempts = async (
    childId: string,
    childName: string,
    counts: { count: number; days: number; mix: { green: number; yellow: number; red: number } },
  ) => {
    const existingForChild = await prisma.testSession.count({
      where: { childId, status: 'COMPLETED' },
    });
    if (existingForChild >= counts.count) {
      console.log(`  • ${childName}: ${existingForChild} sessions already (target ${counts.count})`);
      return;
    }
    const need = counts.count - existingForChild;
    let remaining = { ...counts.mix };
    const usedTestIds = new Set<string>();
    const recentTests = await prisma.testSession.findMany({
      where: { childId }, select: { testId: true },
    });
    recentTests.forEach(t => usedTestIds.add(t.testId));

    for (let i = 0; i < need; i++) {
      // pick zone with remaining capacity
      const total = remaining.green + remaining.yellow + remaining.red;
      if (total <= 0) break;
      const r = Math.random() * total;
      let zone: RiskZone;
      if (r < remaining.green) { zone = 'GREEN'; remaining.green--; }
      else if (r < remaining.green + remaining.yellow) { zone = 'YELLOW'; remaining.yellow--; }
      else { zone = 'RED'; remaining.red--; }

      // pick test (prefer not-yet-passed for child)
      const available = tests.filter(t => !usedTestIds.has(t.id));
      const test = available.length ? pick(available) : pick(tests);
      usedTestIds.add(test.id);

      const offset = Math.floor((counts.days / counts.count) * i) + Math.floor(Math.random() * 3);
      const startedAt = daysAgo(offset, 14 + Math.floor(Math.random() * 6));
      const completedAt = new Date(startedAt.getTime() + (10 + Math.floor(Math.random() * 20)) * 60_000);

      const maxScore = 50;
      const ratio = zone === 'GREEN' ? 0.6 + Math.random() * 0.35
                  : zone === 'YELLOW' ? 0.35 + Math.random() * 0.20
                  : 0.10 + Math.random() * 0.20;
      const totalScore = Math.round(maxScore * ratio);

      const session = await prisma.testSession.create({
        data: {
          testId: test.id,
          childId,
          status: SessionStatus.COMPLETED,
          startedAt, completedAt,
        },
      });
      await prisma.result.create({
        data: {
          sessionId: session.id,
          totalScore, maxScore,
          interpretation: zone === 'GREEN'
            ? `${childName}: показатели в норме.`
            : zone === 'YELLOW'
            ? `${childName}: есть зоны, требующие наблюдения. Рекомендуем повторно через 3-4 недели.`
            : `${childName}: показатели вне нормы. Рекомендуем очную консультацию специалиста.`,
          recommendations: zone === 'RED' ? 'Запись к психологу в течение недели.' : 'Продолжать наблюдение.',
          riskZone: zone,
          pdfUrl: 'demo-parent',
        },
      });

      if (test.isPremium && test.price > 0 && Math.random() < 0.5) {
        await prisma.payment.create({
          data: {
            userId: parent.id,
            amount: test.price,
            currency: 'KZT',
            paymentType: PaymentType.DIAGNOSTIC,
            relatedId: session.id,
            provider: PaymentProvider.KASPI,
            externalId: `demo-parent-${session.id.slice(0, 8)}`,
            status: TransactionStatus.COMPLETED,
            createdAt: startedAt,
            completedAt: new Date(startedAt.getTime() + 60_000),
          },
        });
      }
    }
    console.log(`  ✓ ${childName}: created ${need} sessions`);
  };

  await seedAttempts(ailin.id, 'Айлин', { count: 18, days: 60, mix: { green: 12, yellow: 4, red: 2 } });
  await seedAttempts(damir.id, 'Дамир', { count: 4,  days: 60, mix: { green: 3,  yellow: 1, red: 0 } });

  // ─── Consultations ───
  const existingConsults = await prisma.consultation.count({
    where: { clientId: parent.id },
  });
  const needConsults = Math.max(0, 4 - existingConsults);
  console.log(`  • consultations: ${existingConsults}, creating ${needConsults}`);

  for (let i = 0; i < needConsults; i++) {
    // 3 completed + 1 upcoming
    const isUpcoming = i === needConsults - 1 && existingConsults === 0;
    const offset = isUpcoming ? -7 : (10 + i * 12);
    const scheduledAt = daysAgo(offset, 16);
    const status: ConsultationStatus = isUpcoming ? ConsultationStatus.CONFIRMED : ConsultationStatus.COMPLETED;
    const price = 18000;

    const c = await prisma.consultation.create({
      data: {
        psychologistId: psyId,
        clientId: parent.id,
        childId: ailin.id,
        scheduledAt,
        durationMinutes: 50,
        status,
        roomName: `demo-parent-${i + 1}`,
        price,
        paymentStatus: isUpcoming ? PaymentStatus.PENDING : PaymentStatus.PAID,
        rating: !isUpcoming ? 5 : null,
        review: !isUpcoming && i === 0 ? 'Очень бережный подход. Айлин стала спокойнее на следующий день.' : null,
        completedAt: !isUpcoming ? new Date(scheduledAt.getTime() + 50 * 60_000) : null,
        notes: isUpcoming ? 'Хочу обсудить тревожность Айлин перед контрольной по математике.' : null,
      },
    });

    if (!isUpcoming) {
      await prisma.payment.create({
        data: {
          userId: parent.id,
          amount: price,
          currency: 'KZT',
          paymentType: PaymentType.CONSULTATION,
          relatedId: c.id,
          provider: PaymentProvider.KASPI,
          externalId: `demo-parent-c-${c.id.slice(0, 8)}`,
          status: TransactionStatus.COMPLETED,
          createdAt: scheduledAt,
          completedAt: new Date(scheduledAt.getTime() + 60_000),
        },
      });
    }
  }

  console.log('✅ demo parent seed done');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
