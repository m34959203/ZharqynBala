/**
 * Bulk seeder для realistic dashboard демо-данных.
 * Идемпотентен — повторный запуск пропускает уже созданные сущности.
 *
 *   npx ts-node prisma/seed-bulk.ts        # дополнить до целевых объёмов
 *   SEED_BULK_RESET=true npx ts-node prisma/seed-bulk.ts
 *                                          # сначала снести bulk-данные, потом залить заново
 *
 * Bulk-сущности маркируются через email-префикс bulk- и note-поле,
 * сохраняя в неприкосновенности «фирменные» 5 учёток из seed.ts.
 */

import { PrismaClient, UserRole, Gender, SessionStatus, RiskZone, ConsultationStatus, PaymentStatus, TransactionStatus, PaymentType, PaymentProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// Data pools (real Kazakh + Russian names)
// ─────────────────────────────────────────────────────

const KZ_FIRST_F = ['Айлин','Камила','Алия','Динара','Гульмира','Маржан','Айгерим','Балжан','Жанна','Сауле','Гульназ','Дина','Мадина','Айгуль','Зарина','Назым','Алтын','Аружан','Аяна','Балым','Жадыра','Карлыгаш','Лаззат','Махаббат','Нурбану','Сабина','Самал','Шынар','Жулдыз','Эльмира'];
const KZ_FIRST_M = ['Дамир','Арлан','Санжар','Алмаз','Бахытжан','Ерлан','Тимур','Нурлан','Аян','Дастан','Канат','Бекзат','Алибек','Жасулан','Ринат','Серик','Ержан','Айдар','Олжас','Куаныш','Аскар','Бауыржан','Ербол','Жанибек','Кайрат','Мурат','Расул','Талгат','Чингиз','Шалкар'];
const RU_FIRST_F = ['Анна','Мария','Екатерина','Ольга','Наталья','Татьяна','Елена','Светлана','Ирина','Юлия','Дарья','Александра','Полина','Виктория','Анастасия'];
const RU_FIRST_M = ['Александр','Дмитрий','Михаил','Сергей','Андрей','Иван','Николай','Максим','Артём','Владимир','Алексей','Павел','Денис','Кирилл','Илья'];
const SURNAMES_KZ_F = ['Серикова','Ахметова','Тестова','Бекбаева','Сариева','Турсунова','Каримова','Назарбаева','Жумабаева','Конысбаева','Орлова','Ракишева','Сагинтаева','Утегенова','Жунусова','Иманбаева','Курманова','Ерлепесова'];
const SURNAMES_KZ_M = ['Сериков','Ахметов','Тестов','Бекбаев','Сариев','Турсунов','Каримов','Назарбаев','Жумабаев','Конысбаев','Орлов','Ракишев','Сагинтаев','Утегенов','Жунусов','Иманбаев','Курманов','Ерлепесов'];
const SURNAMES_RU_F = ['Иванова','Петрова','Смирнова','Кузнецова','Соколова','Попова','Васильева','Морозова','Лебедева','Козлова'];
const SURNAMES_RU_M = ['Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Васильев','Морозов','Лебедев','Козлов'];

const CITIES = ['Алматы','Астана','Шымкент','Жезказган','Караганда','Актобе','Семей','Павлодар'];

const PSY_SPECS = ['Детский психолог','Подростковый','Семейный','КПТ','Профориентация','Кризисная поддержка','Игровая терапия','Гештальт-подход','Арт-терапия'];
const PSY_UNIS = ['КазНУ им. аль-Фараби','КИМЭП','КазНПУ им. Абая','ЕНУ им. Гумилёва','Назарбаев Университет','МУИТ','КарГУ им. Букетова'];

const SCHOOLS = [
  { name: 'КГУ Школа-лицей №5', region: 'Улытауская область', city: 'Жезказган', address: 'пр. Алашахана, 5' },
  { name: 'КГУ ОСШ №133', region: 'Алматинская область', city: 'Алматы', address: 'мкр. Орбита-1, 28' },
  { name: 'Гимназия №38', region: 'г. Астана', city: 'Астана', address: 'ул. Кенесары, 90' },
  { name: 'Лицей №40', region: 'Туркестанская область', city: 'Шымкент', address: 'пр. Тауке хана, 21' },
];

// ─────────────────────────────────────────────────────
// PRNG (deterministic за счёт env-seed для reproducibility)
// ─────────────────────────────────────────────────────

let _seed = 1247;
const rng = () => {
  _seed = (_seed * 9301 + 49297) % 233280;
  return _seed / 233280;
};
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};
const range = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const phone = () => `+7700${range(1000000, 9999999)}`;

// ─────────────────────────────────────────────────────
// Targets
// ─────────────────────────────────────────────────────

const TARGETS = {
  parents: 120,             // итого с уже-существующим 1 = 121, +1 admin +18 psy = 140
  psychologistsApproved: 15,
  psychologistsPending: 2,
  psychologistsRejected: 1,
  children: 175,
  schools: 4,
  testSessions: 540,
  consultations: 220,
  groupTests: 3,
};

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

const hash = async (pw: string) => bcrypt.hash(pw, 12);

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const randomBusinessDay = (rangeStart: number, rangeEnd: number): Date => {
  // weekday bias: 80% Mon-Thu, 15% Fri, 5% weekend
  for (let attempt = 0; attempt < 20; attempt++) {
    const offset = range(rangeStart, rangeEnd);
    const d = daysAgo(offset);
    const dow = d.getDay(); // 0=Sun,6=Sat
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend && rng() > 0.05) continue;
    if (dow === 5 && rng() > 0.15) continue;
    d.setHours(range(9, 19), range(0, 59), 0, 0);
    return d;
  }
  return daysAgo(range(rangeStart, rangeEnd));
};

const russianFor = (gender: Gender) => {
  const ruShare = rng() < 0.18;  // ~18% этнически русские имена
  const firstNames = gender === 'FEMALE'
    ? (ruShare ? RU_FIRST_F : KZ_FIRST_F)
    : (ruShare ? RU_FIRST_M : KZ_FIRST_M);
  const surnames = gender === 'FEMALE'
    ? (ruShare ? SURNAMES_RU_F : SURNAMES_KZ_F)
    : (ruShare ? SURNAMES_RU_M : SURNAMES_KZ_M);
  return { firstName: pick(firstNames), lastName: pick(surnames) };
};

// ─────────────────────────────────────────────────────
// Reset (only bulk-prefixed)
// ─────────────────────────────────────────────────────

async function resetBulk() {
  console.log('🧹 SEED_BULK_RESET=true → wiping bulk-prefixed данные');
  // delete payments and sessions first to avoid FK
  await prisma.payment.deleteMany({ where: { externalId: { startsWith: 'bulk-' } } });
  await prisma.consultation.deleteMany({ where: { roomName: { startsWith: 'bulk-' } } });
  await prisma.result.deleteMany({ where: { pdfUrl: { startsWith: 'bulk-' } } });
  await prisma.testSession.deleteMany({ where: { id: { in:
    (await prisma.testSession.findMany({
      where: { result: { pdfUrl: { startsWith: 'bulk-' } } },
      select: { id: true },
    })).map(s => s.id)
  } } });
  await prisma.child.deleteMany({ where: { parent: { email: { startsWith: 'bulk-' } } } });
  await prisma.psychologist.deleteMany({ where: { user: { email: { startsWith: 'bulk-' } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'bulk-' } } });
  console.log('  ✓ bulk wiped');
}

// ─────────────────────────────────────────────────────
// Step 1: Parents
// ─────────────────────────────────────────────────────

async function seedParents(passwordHash: string): Promise<string[]> {
  const existing = await prisma.user.count({
    where: { role: 'PARENT', email: { startsWith: 'bulk-parent-' } },
  });
  const need = Math.max(0, TARGETS.parents - existing);
  console.log(`👨‍👩‍👧 parents: existing ${existing}, creating ${need}`);

  const ids: string[] = [];
  for (let i = existing; i < TARGETS.parents; i++) {
    const isFemale = rng() < 0.72;  // most parents-of-record are mothers
    const g: Gender = isFemale ? 'FEMALE' : 'MALE';
    const { firstName, lastName } = russianFor(g);
    const email = `bulk-parent-${String(i + 1).padStart(3, '0')}@test.kz`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, phone: phone(),
        passwordHash, role: 'PARENT',
        firstName, lastName,
        language: 'RU',
        isVerified: true, isActive: true,
        createdAt: daysAgo(range(1, 180)),
      },
    });
    ids.push(u.id);
  }
  // also include any pre-existing parent users so children-distribution covers them
  const all = await prisma.user.findMany({
    where: { role: 'PARENT' }, select: { id: true },
  });
  return all.map(u => u.id);
}

// ─────────────────────────────────────────────────────
// Step 2: Children (1-3 per random parent until target)
// ─────────────────────────────────────────────────────

async function seedChildren(parentIds: string[]) {
  const existing = await prisma.child.count();
  const need = Math.max(0, TARGETS.children - existing);
  console.log(`🧒 children: existing ${existing}, creating ${need}`);

  for (let i = 0; i < need; i++) {
    const parentId = pick(parentIds);
    const g: Gender = rng() < 0.51 ? 'MALE' : 'FEMALE';
    const { firstName, lastName } = russianFor(g);
    const age = range(6, 17);
    const birth = daysAgo(age * 365 + range(0, 364));
    const grade = Math.max(1, age - 6); // rough mapping
    await prisma.child.create({
      data: {
        parentId,
        firstName, lastName,
        birthDate: birth,
        gender: g,
        schoolName: rng() < 0.6 ? pick(SCHOOLS).name : null,
        grade: `${grade} класс`,
        createdAt: daysAgo(range(0, 150)),
      },
    });
  }
}

// ─────────────────────────────────────────────────────
// Step 3: Psychologists (approved + pending + rejected)
// ─────────────────────────────────────────────────────

async function seedPsychologists(passwordHash: string) {
  const existing = await prisma.psychologist.count({
    where: { user: { email: { startsWith: 'bulk-psy-' } } },
  });
  const needTotal = TARGETS.psychologistsApproved + TARGETS.psychologistsPending + TARGETS.psychologistsRejected;
  const need = Math.max(0, needTotal - existing);
  console.log(`🧠 psychologists: existing ${existing}, creating ${need} (target ${needTotal})`);

  for (let i = existing; i < needTotal; i++) {
    const isFemale = rng() < 0.7;
    const g: Gender = isFemale ? 'FEMALE' : 'MALE';
    const { firstName, lastName } = russianFor(g);
    const email = `bulk-psy-${String(i + 1).padStart(3, '0')}@test.kz`;

    let isApproved = i < TARGETS.psychologistsApproved;
    // last few are pending or rejected
    const rejected = i >= TARGETS.psychologistsApproved + TARGETS.psychologistsPending;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, phone: phone(),
        passwordHash, role: 'PSYCHOLOGIST',
        firstName, lastName,
        language: 'RU',
        isVerified: true, isActive: !rejected,
        createdAt: daysAgo(range(7, 300)),
      },
    });

    await prisma.psychologist.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialization: pickN(PSY_SPECS, range(1, 3)),
        experienceYears: range(2, 18),
        education: pick(PSY_UNIS),
        hourlyRate: range(8000, 25000),
        bio: `Работаю с детьми и подростками. Специализация: ${pick(PSY_SPECS).toLowerCase()}. Подход — поддержка без оценок, безопасное пространство.`,
        languages: ['Русский', ...(rng() < 0.6 ? ['Казахский'] : []), ...(rng() < 0.2 ? ['Английский'] : [])],
        isApproved,
        isAvailable: isApproved && rng() < 0.85,
        rating: isApproved ? Math.round((3.8 + rng() * 1.2) * 10) / 10 : 0,
        totalConsultations: isApproved ? range(20, 180) : 0,
      },
    });
  }
}

// ─────────────────────────────────────────────────────
// Step 4: Schools (4 with classes + students)
// ─────────────────────────────────────────────────────

async function seedSchools(passwordHash: string) {
  const existing = await prisma.school.count();
  console.log(`🏫 schools: existing ${existing}, creating up to ${TARGETS.schools}`);

  for (let i = existing; i < TARGETS.schools; i++) {
    const sch = SCHOOLS[i];
    const email = `bulk-school-${i + 1}@test.kz`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, phone: phone(),
        passwordHash, role: 'SCHOOL',
        firstName: 'Администрация',
        lastName: sch.name.replace('КГУ ', ''),
        language: 'RU', isVerified: true, isActive: true,
        createdAt: daysAgo(range(30, 300)),
      },
    });

    const totalStudents = range(200, 250);
    const school = await prisma.school.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        schoolName: sch.name,
        region: sch.region,
        city: sch.city,
        address: sch.address,
        contactPerson: `${pick(KZ_FIRST_F)} ${pick(SURNAMES_KZ_F)}`,
        contactPhone: phone(),
        totalStudents,
      },
    });

    // create 5-8 classes
    const classCount = range(5, 8);
    for (let c = 0; c < classCount; c++) {
      const grade = 5 + c;  // 5-12
      const letter = pick(['А','Б','В','Г']);
      try {
        const cls = await prisma.schoolClass.create({
          data: {
            schoolId: school.id,
            grade,
            letter,
            academicYear: '2025-2026',
          },
        });
        // 18-30 students per class
        const studentsCount = range(18, 30);
        for (let s = 0; s < studentsCount; s++) {
          const g: Gender = rng() < 0.51 ? 'MALE' : 'FEMALE';
          const { firstName, lastName } = russianFor(g);
          await prisma.student.create({
            data: {
              classId: cls.id,
              firstName, lastName,
              birthDate: daysAgo((grade + 7) * 365 + range(0, 364)),
              gender: g,
            },
          });
        }
      } catch (e) {
        // unique constraint on (schoolId, grade, letter, academicYear) — skip dupes
      }
    }
  }
}

// ─────────────────────────────────────────────────────
// Step 5: Test sessions (distributed over 90 days)
// ─────────────────────────────────────────────────────

async function seedTestSessions() {
  const existing = await prisma.testSession.count();
  const need = Math.max(0, TARGETS.testSessions - existing);
  console.log(`📋 test sessions: existing ${existing}, creating ${need}`);

  if (!need) return;

  const tests = await prisma.test.findMany({ select: { id: true, price: true, isPremium: true } });
  const children = await prisma.child.findMany({ select: { id: true } });

  if (!tests.length || !children.length) {
    console.warn('  ⚠️ no tests or children — skipping sessions');
    return;
  }

  for (let i = 0; i < need; i++) {
    const test = pick(tests);
    const child = pick(children);
    const startedAt = randomBusinessDay(0, 90);
    const completed = rng() < 0.92;  // 92% completed, 8% abandoned

    const session = await prisma.testSession.create({
      data: {
        testId: test.id,
        childId: child.id,
        status: completed ? SessionStatus.COMPLETED : SessionStatus.ABANDONED,
        startedAt,
        completedAt: completed ? new Date(startedAt.getTime() + range(8, 35) * 60_000) : null,
      },
    });

    if (completed) {
      // risk distribution: 70% GREEN, 22% YELLOW, 8% RED
      const r = rng();
      const zone: RiskZone = r < 0.70 ? 'GREEN' : r < 0.92 ? 'YELLOW' : 'RED';
      const maxScore = range(20, 50);
      const ratio = zone === 'GREEN' ? rng() * 0.45 + 0.55
                  : zone === 'YELLOW' ? rng() * 0.25 + 0.30
                  : rng() * 0.30;
      const totalScore = Math.round(maxScore * ratio);
      await prisma.result.create({
        data: {
          sessionId: session.id,
          totalScore, maxScore,
          interpretation: zone === 'GREEN'
            ? 'Показатели в норме. Состояние стабильное.'
            : zone === 'YELLOW'
            ? 'Есть зоны, требующие наблюдения. Рекомендуем повторную диагностику через 3-4 недели.'
            : 'Показатели вне нормы. Рекомендуем обратиться к специалисту для очной консультации.',
          recommendations: zone === 'RED'
            ? 'Запись к психологу в течение 7 дней. Снизить учебную нагрузку. Поддерживающий разговор с близкими.'
            : 'Продолжать наблюдение. Поддерживать режим сна и отдыха.',
          riskZone: zone,
          pdfUrl: 'bulk-seed',
        },
      });

      // If test was premium, create a paid Payment record
      if (test.isPremium && test.price > 0) {
        const parentId = (await prisma.child.findUnique({
          where: { id: child.id }, select: { parentId: true },
        }))?.parentId;
        if (parentId) {
          await prisma.payment.create({
            data: {
              userId: parentId,
              amount: test.price,
              currency: 'KZT',
              paymentType: PaymentType.DIAGNOSTIC,
              relatedId: session.id,
              provider: PaymentProvider.KASPI,
              externalId: `bulk-kaspi-${session.id.slice(0, 8)}`,
              status: rng() < 0.92 ? TransactionStatus.COMPLETED : (rng() < 0.5 ? TransactionStatus.PENDING : TransactionStatus.FAILED),
              createdAt: startedAt,
              completedAt: rng() < 0.92 ? new Date(startedAt.getTime() + 60_000) : null,
            },
          });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────
// Step 6: Consultations + matching payments
// ─────────────────────────────────────────────────────

async function seedConsultations() {
  const existing = await prisma.consultation.count();
  const need = Math.max(0, TARGETS.consultations - existing);
  console.log(`💬 consultations: existing ${existing}, creating ${need}`);

  if (!need) return;

  const approvedPsychologists = await prisma.psychologist.findMany({
    where: { isApproved: true },
    select: { id: true, userId: true, hourlyRate: true },
  });
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' }, select: { id: true },
  });
  const children = await prisma.child.findMany({ select: { id: true, parentId: true } });

  if (!approvedPsychologists.length || !parents.length) {
    console.warn('  ⚠️ no approved psychologists or parents');
    return;
  }

  // status distribution: COMPLETED 78%, CONFIRMED 12%, NO_SHOW 6%, CANCELLED 4%
  for (let i = 0; i < need; i++) {
    const psy = pick(approvedPsychologists);
    const parent = pick(parents);
    // try to pick a child that belongs to this parent; if not, pick any child or null
    const ownChildren = children.filter(c => c.parentId === parent.id);
    const child = ownChildren.length ? pick(ownChildren) : (rng() < 0.85 ? pick(children) : null);

    const r = rng();
    const status: ConsultationStatus = r < 0.78 ? ConsultationStatus.COMPLETED
                  : r < 0.90 ? ConsultationStatus.CONFIRMED
                  : r < 0.96 ? ConsultationStatus.NO_SHOW
                  : ConsultationStatus.CANCELLED;

    // future for confirmed, past for completed
    const offsetDays = status === ConsultationStatus.CONFIRMED
      ? -range(1, 14)
      : range(0, 60);
    const scheduledAt = randomBusinessDay(offsetDays, offsetDays);

    const price = Math.max(psy.hourlyRate, 15000) + range(0, 5000);
    const isPaid = status === ConsultationStatus.COMPLETED && rng() < 0.92;

    const c = await prisma.consultation.create({
      data: {
        psychologistId: psy.id,
        clientId: parent.id,
        childId: child?.id,
        scheduledAt,
        durationMinutes: 50,
        status,
        roomName: `bulk-room-${i + 1}`,
        price,
        paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
        rating: status === ConsultationStatus.COMPLETED && rng() < 0.7
          ? range(4, 5)
          : null,
        review: status === ConsultationStatus.COMPLETED && rng() < 0.3
          ? pick([
              'Спасибо за бережный подход к ребёнку.',
              'После сессии стало спокойнее, рекомендации понятные.',
              'Хороший специалист, видно опыт.',
              'Сын начал говорить о школе сам — это первый сдвиг за месяц.',
              'Рекомендую. Тёплая подача без морализаторства.',
            ])
          : null,
        completedAt: status === ConsultationStatus.COMPLETED
          ? new Date(scheduledAt.getTime() + 50 * 60_000)
          : null,
      },
    });

    // matching Payment if paid
    if (isPaid) {
      await prisma.payment.create({
        data: {
          userId: parent.id,
          amount: price,
          currency: 'KZT',
          paymentType: PaymentType.CONSULTATION,
          relatedId: c.id,
          provider: PaymentProvider.KASPI,
          externalId: `bulk-kaspi-c-${c.id.slice(0, 8)}`,
          status: TransactionStatus.COMPLETED,
          createdAt: scheduledAt,
          completedAt: new Date(scheduledAt.getTime() + 60_000),
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Bulk seed start');
  console.log(`   targets: ${JSON.stringify(TARGETS)}`);

  if (process.env.SEED_BULK_RESET === 'true') {
    await resetBulk();
  }

  const passwordHash = await hash('Admin123!');

  const parentIds = await seedParents(passwordHash);
  await seedChildren(parentIds);
  await seedPsychologists(passwordHash);
  await seedSchools(passwordHash);
  await seedTestSessions();
  await seedConsultations();

  console.log('✅ Bulk seed done');
  console.log('   Tip: run `npm run db:counts` to verify, or query users/children/etc');
}

main()
  .catch(e => {
    console.error('❌ seed-bulk failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
