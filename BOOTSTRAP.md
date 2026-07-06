# Roomi — Bootstrap para nueva sesión de Claude Code

Este archivo transfiere todo el contexto acordado en la sesión previa.
Pégalo (o pídele a Claude que lo lea) al iniciar la nueva sesión desde `C:\Users\joaki\Documents\Github\roomi`.

---

## Contexto del usuario (Joako)

- 5to año Ing. Civil Informática, Chile.
- Stack dominado: Next.js 16 App Router + TS + Prisma v7 + Supabase Postgres + Auth.js beta (Credentials) + Tailwind v4 + Material Design 3 + Web Push VAPID + Service Workers + PWA + Vercel.
- Viene de "Magic Rouss" (PWA tienda de su mamá, mismo stack).
- Formato preferido: directo, sin relleno. Tradeoffs en 1 línea + recomendación. Nada de código innecesario. Nada de comentarios que expliquen lo obvio. Pushback con argumento si algo es mala idea.

## Qué es Roomi

PWA para gestionar la convivencia entre estudiantes que arriendan un depa. Inspiración: Flatastic (alemana), en español, mejor. Un usuario puede pertenecer a varios hogares.

**Nombre:** `roomi` (dominio tentativo `roomi.cl`).

## Stack (decidido, no re-discutir)

- Next.js 16 App Router + TypeScript
- Tailwind v4 + shadcn/ui (base) + tokens Material Design 3 (encima)
- Prisma v7 + Supabase Postgres (Supabase desde día 1, sin Docker local)
- Auth.js beta con Credentials + bcryptjs
- Web Push VAPID + Service Worker propio (no next-pwa)
- Vercel Cron para recordatorios
- Zod v4 para validación en Server Actions
- Server Actions + `useOptimistic` para UI colaborativa (mejor que polling `router.refresh` para checkboxes/botones)
- Supabase Realtime para muro y compras (a partir de v1)
- Supabase Storage para fotos (v2)

## Módulos por prioridad

1. **Aseo compartido con rotación automática** ← MVP único
2. Compras compartidas (v1)
3. Muro de avisos con reacciones (v1)
4. Puntos + ranking + gamificación (v2)
5. Evidencia fotográfica opcional (v2)

## Roles

- **Admin del hogar**: crea el hogar, edita tareas, echa miembros.
- **Miembro**: marca sus tareas, agrega compras (v1), escribe en muro (v1).
- Un usuario puede pertenecer a varios hogares.

---

## `schema.prisma` completo (implementar solo modelos MVP en la 1ª migración)

Modelos del **MVP a migrar ahora**: `User`, `Household`, `Membership`, `Task`, `TaskExecution`, `PushSubscription`.
El resto queda definido en este archivo para referencia; se migran cuando lleguen v1/v2.

```prisma
// ============ USUARIOS Y HOGARES ============

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  hashedPassword String?
  name           String
  image          String?
  createdAt      DateTime @default(now())

  memberships     Membership[]
  taskExecutions  TaskExecution[]
  paidExpenses    Expense[]        @relation("payer")
  expenseSplits   ExpenseSplit[]
  itemsCreated    ShoppingItem[]   @relation("itemCreator")
  itemsChecked    ShoppingItem[]   @relation("itemChecker")
  notices         Notice[]
  reactions       Reaction[]
  pushSubs        PushSubscription[]
  settlementsSent Settlement[]     @relation("settleFrom")
  settlementsRcvd Settlement[]     @relation("settleTo")
}

model Household {
  id         String   @id @default(cuid())
  name       String
  inviteCode String   @unique @default(cuid())
  createdAt  DateTime @default(now())

  members       Membership[]
  tasks         Task[]
  shoppingItems ShoppingItem[]
  expenses      Expense[]
  notices       Notice[]
  settlements   Settlement[]
}

enum HouseholdRole { ADMIN MEMBER }

model Membership {
  id              String    @id @default(cuid())
  userId          String
  householdId     String
  role            HouseholdRole @default(MEMBER)
  rotationOrder   Int       // posición en el ciclo, densa por hogar
  onVacationUntil DateTime?
  joinedAt        DateTime  @default(now())
  leftAt          DateTime? // soft delete; conserva historial

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  household Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  assignedTasks Task[] @relation("nextAssignee")

  @@unique([userId, householdId])
  @@index([householdId, leftAt, rotationOrder])
}

// ============ TAREAS + ROTACIÓN ============

enum TaskFrequency { DAILY WEEKLY BIWEEKLY MONTHLY }

model Task {
  id          String   @id @default(cuid())
  householdId String
  title       String
  frequency   TaskFrequency
  points      Int      @default(1)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  // Estado de rotación denormalizado en la tarea
  nextAssigneeMembershipId String?
  nextDueDate              DateTime
  cycleNumber              Int    @default(0)

  household    Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  nextAssignee Membership? @relation("nextAssignee", fields: [nextAssigneeMembershipId], references: [id])
  executions   TaskExecution[]

  @@index([householdId, active, nextDueDate])
}

model TaskExecution {
  id            String   @id @default(cuid())
  taskId        String
  completedById String
  cycleNumber   Int
  wasAssigned   Boolean  // false = alguien se ofreció fuera de turno
  photoUrl      String?
  pointsEarned  Int
  completedAt   DateTime @default(now())

  task        Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  completedBy User @relation(fields: [completedById], references: [id])

  @@unique([taskId, cycleNumber])       // mata races: 2 personas tocando Listo, 1 gana
  @@index([completedById, completedAt]) // ranking mensual
}

// ============ COMPRAS Y GASTOS (v1, no migrar aún) ============

model ShoppingItem {
  id              String    @id @default(cuid())
  householdId     String
  title           String
  quantity        String?
  createdById     String
  createdAt       DateTime  @default(now())
  checkedById     String?
  checkedAt       DateTime?
  linkedExpenseId String?

  household     Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdBy     User      @relation("itemCreator", fields: [createdById], references: [id])
  checkedBy     User?     @relation("itemChecker", fields: [checkedById], references: [id])
  linkedExpense Expense?  @relation(fields: [linkedExpenseId], references: [id])

  @@index([householdId, checkedAt])
}

model Expense {
  id          String   @id @default(cuid())
  householdId String
  payerId     String
  amount      Int      // CLP entero
  title       String
  category    String?
  receiptUrl  String?
  paidAt      DateTime @default(now())

  household Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  payer     User      @relation("payer", fields: [payerId], references: [id])
  splits    ExpenseSplit[]
  fromItems ShoppingItem[]

  @@index([householdId, paidAt])
}

model ExpenseSplit {
  id        String @id @default(cuid())
  expenseId String
  userId    String
  amount    Int    // permite splits desiguales

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@unique([expenseId, userId])
}

model Settlement {
  id          String   @id @default(cuid())
  householdId String
  fromUserId  String
  toUserId    String
  amount      Int
  note        String?
  paidAt      DateTime @default(now())

  household Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  fromUser  User      @relation("settleFrom", fields: [fromUserId], references: [id])
  toUser    User      @relation("settleTo",   fields: [toUserId],   references: [id])

  @@index([householdId, paidAt])
}

// ============ MURO (v1, no migrar aún) ============

model Notice {
  id          String   @id @default(cuid())
  householdId String
  authorId    String
  content     String
  createdAt   DateTime @default(now())

  household Household  @relation(fields: [householdId], references: [id], onDelete: Cascade)
  author    User       @relation(fields: [authorId], references: [id])
  reactions Reaction[]

  @@index([householdId, createdAt])
}

model Reaction {
  id       String @id @default(cuid())
  noticeId String
  userId   String
  emoji    String

  notice Notice @relation(fields: [noticeId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])

  @@unique([noticeId, userId, emoji])
}

// ============ PUSH ============

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Decisiones no obvias del schema (para no re-discutir)

- **NO existe tabla `Debt`** — la deuda entre A y B es derivada: `sum(ExpenseSplit) - sum(Settlement)`. Persistirla duplica la verdad.
- **`Membership` con soft delete (`leftAt`)** — si eliminas la fila pierdes historial. `TaskExecution` apunta a `User`, no a `Membership`, así aunque salga el miembro los registros se leen bien.
- **`Membership.rotationOrder`** en vez de fórmula `(inicial + ciclo) mod N` — la fórmula falla con joins/leaves. Con orden denso sobre activos + puntero explícito en la Task es robusto.
- **`Task.nextAssigneeMembershipId` + `nextDueDate` denormalizados** — ahorra recalcular en cada render. Única mutación: la transacción de "marcar tarea".
- **`TaskExecution @@unique([taskId, cycleNumber])`** — idempotencia natural, mata race conditions sin locks aplicativos.
- **`ExpenseSplit.amount` en pesos enteros** (no porcentaje, no float) — permite splits desiguales y cero problemas de floats.
- **`PushSubscription` cuelga de `User`** (no de `Membership`) — la notificación es al humano; si estás en 2 hogares, un device recibe ambos.

---

## Algoritmo de rotación (decisiones cerradas)

### Reglas

- **Miembros activos** = `Membership WHERE leftAt IS NULL AND (onVacationUntil IS NULL OR onVacationUntil < now())` ordenados por `rotationOrder ASC`.
- **Tarea no completada al vencer** → **se salta al siguiente** (el asignado gana `0` puntos, queda registrado como saltada). Contador visible "tareas saltadas este mes" como incentivo social; nada de puntos negativos.
- **Al ofrecerse alguien fuera de turno** → gana los puntos igual (`wasAssigned: false`), avanza puntero normal.
- **Cadencia = de la tarea, no de la última ejecución**: `nextDueDate = nextDueDate + interval(frequency)`, no `hoy + interval`. Así completar temprano/tarde no altera el ritmo.

### Casos borde

| Caso | Comportamiento |
|---|---|
| Nuevo miembro entra | `rotationOrder = max + 1`. Se une al final del ciclo. No re-asignamos tareas en curso. |
| Miembro se va | `leftAt = now()`. Sus tareas asignadas se re-asignan al siguiente activo en la misma transacción. |
| Modo vacaciones | `onVacationUntil` en el futuro → el algoritmo lo salta. Al vencer, vuelve al ciclo automático. |
| Cambio de frecuencia | Update `frequency` + recalcular `nextDueDate` desde hoy. `cycleNumber` intacto. |
| Nueva tarea creada | `nextAssignee = primer miembro activo por rotationOrder`, `nextDueDate = hoy`. |
| Tarea eliminada | Soft delete `active = false`. Executions preservadas. |

### `completarTarea` (Server Action, pseudocódigo)

```ts
async function completarTarea(taskId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId }})

    await tx.taskExecution.create({
      data: {
        taskId,
        cycleNumber: task.cycleNumber,
        completedById: userId,
        wasAssigned: task.nextAssignee?.userId === userId,
        pointsEarned: task.points,
      }
    })

    const activos = await tx.membership.findMany({
      where: {
        householdId: task.householdId,
        leftAt: null,
        OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() }}]
      },
      orderBy: { rotationOrder: 'asc' }
    })

    const idxActual = activos.findIndex(m => m.id === task.nextAssigneeMembershipId)
    const siguiente = activos[(idxActual + 1) % activos.length]

    await tx.task.update({
      where: { id: taskId },
      data: {
        nextAssigneeMembershipId: siguiente.id,
        nextDueDate: addInterval(task.nextDueDate, task.frequency),
        cycleNumber: { increment: 1 }
      }
    })
  })
}
```

### Cron nocturno `advance-overdue`

Corre a las 03:05 UTC. Para cada `Task WHERE nextDueDate < today AND active = true`:
- Crear `TaskExecution` con `pointsEarned: 0`, `completedById = usuario del nextAssignee`.
- Avanzar puntero y fecha igual que en el flujo normal.

---

## Split de gastos (v1, algoritmo)

**Greedy de 2 punteros** (mismo que Splitwise usa por debajo):

1. Calcular balance neto de cada miembro = `sum(ExpenseSplit propios) - sum(pagos hechos) + sum(Settlements recibidos) - sum(Settlements enviados)`.
2. Ordenar por balance: `deudores` (negativo) y `acreedores` (positivo).
3. Loop: toma el mayor deudor y el mayor acreedor. Genera transacción de `min(|a|, |b|)`. Actualiza ambos, elimina el que quede en cero. Repite.
4. Resultado: como máximo `N-1` transacciones (óptimo).

**Regla de negocio decidida:** al crear un gasto, el default es **dividir entre TODOS los miembros activos, partes iguales**. El usuario puede editar splits o excluir en la misma pantalla.

---

## Plan de fases

### MVP (2–3 semanas) — solo aseo + rotación + push

1. Setup: repo, Prisma, Supabase, Auth.js, deploy Vercel en vacío.
2. Auth Credentials (registro + login).
3. Crear hogar + unirse con `inviteCode` (link compartible).
4. CRUD tareas (solo admin).
5. Vista **"Hoy"**: mis tareas pendientes + botón Listo.
6. Server Action `completarTarea` con transacción del algoritmo.
7. Suscripción push + guardar `PushSubscription`.
8. Push instantáneo al hogar al completar ("Varo limpió el living ✨").
9. Vercel Cron 13 UTC (≈10 AM Chile): notifica a cada asignado del día.
10. Vercel Cron nocturno: avanza tareas vencidas con `pointsEarned: 0`.
11. PWA install (manifest + SW propio + iconos).
12. Vista **"Hogar"**: miembros, código de invitación, salir.

**Fuera del MVP:** compras, muro, ranking, evidencia foto, modo vacaciones UI (campo existe en DB, no expuesto), swap de turnos, splits desiguales.

### v1

- Compras compartidas (Supabase Realtime, greedy split, settlements).
- Muro de avisos + reacciones (Realtime).
- Modo vacaciones desde UI.
- Historial mensual por persona.

### v2

- Puntos + ranking + premio configurable.
- Evidencia fotográfica (Supabase Storage + RLS por hogar).
- Reservas del living (calendario ligero).
- Swap de turnos con confirmación.
- Splits desiguales y exclusiones.

---

## Estructura del repo

```
roomi/
├── prisma/
│   └── schema.prisma            ← solo modelos MVP en 1ª migración
├── public/
│   ├── manifest.json
│   ├── sw.js                    ← SW propio (push + install)
│   └── icons/                   ← 192, 512, maskable
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← landing / redirect a /hoy si logueado
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx       ← sesión + bottom nav + install prompt
│   │   │   ├── hoy/page.tsx
│   │   │   ├── tareas/
│   │   │   │   ├── page.tsx
│   │   │   │   └── nueva/page.tsx
│   │   │   ├── hogar/page.tsx
│   │   │   └── perfil/page.tsx
│   │   ├── unirse/[code]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── push/subscribe/route.ts
│   │       └── cron/
│   │           ├── reminder-10am/route.ts
│   │           └── advance-overdue/route.ts
│   ├── actions/
│   │   ├── task.ts
│   │   ├── household.ts
│   │   └── push.ts
│   ├── lib/
│   │   ├── db.ts                ← singleton Prisma
│   │   ├── auth.ts              ← config Auth.js
│   │   ├── push.ts              ← wrapper web-push
│   │   ├── rotation.ts          ← siguienteAsignado(), addInterval()
│   │   └── validators.ts        ← schemas Zod
│   ├── components/
│   │   ├── ui/                  ← shadcn
│   │   ├── task-card.tsx
│   │   ├── bottom-nav.tsx
│   │   └── install-prompt.tsx
│   └── middleware.ts            ← protege (app)/*
├── vercel.json
├── .env.example
└── package.json
```

## Comandos de bootstrap (correr en `C:\Users\joaki\Documents\Github\roomi`)

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir --turbopack --import-alias "@/*"

# core
npm i prisma @prisma/client next-auth@beta bcryptjs zod web-push
npm i -D @types/bcryptjs @types/web-push tsx

# UI base
npx shadcn@latest init
npx shadcn@latest add button dialog sheet input label

# DB
npx prisma init --datasource-provider postgresql

# VAPID (guardar output en .env)
npx web-push generate-vapid-keys
```

## `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/reminder-10am", "schedule": "0 13 * * *" },
    { "path": "/api/cron/advance-overdue", "schedule": "5 3 * * *" }
  ]
}
```

Nota TZ: Vercel Cron es UTC. `13 UTC ≈ 10 AM Chile verano / 9 AM invierno`. Suficiente para MVP.

## `.env.example`

```
# Supabase Postgres
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://..."

# Auth.js
AUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Web Push VAPID
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:tu@correo.cl"

# Vercel Cron
CRON_SECRET=""
```

---

## Convenciones fijadas

1. **Zod obligatorio** en la 1ª línea de cada Server Action (`schema.parse(input)`).
2. **Autorización explícita**: helper `assertMemberOf(userId, householdId)` corre antes de cualquier lectura/escritura. Nunca confiar en el cliente.
3. **Cron endpoints** protegidos con `Authorization: Bearer ${CRON_SECRET}`.
4. **Enteros para dinero (CLP)** y para horas/minutos. Cero floats, cero strings ISO comparadas a mano.
5. **Redirects post-action** con `revalidatePath` + `redirect()`, no `router.push` desde cliente.

---

## Siguiente paso al abrir la nueva sesión

Pídele a Claude:

> "Lee `BOOTSTRAP.md` en la raíz. Ese es todo el contexto del proyecto. Partamos ejecutando los comandos de bootstrap (create-next-app, prisma, shadcn, VAPID) y luego escribimos el `schema.prisma` con solo los modelos del MVP: `User`, `Household`, `Membership`, `Task`, `TaskExecution`, `PushSubscription`. Antes de correr `prisma migrate`, muéstrame el schema para revisar."
