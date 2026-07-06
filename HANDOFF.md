# Roomi — Handoff a nueva sesión

Este archivo captura el estado real después de las primeras 2 fases del MVP. Léelo **después** de `BOOTSTRAP.md`. Lo que dice acá **sobreescribe** cualquier detalle en `BOOTSTRAP.md` que se haya vuelto obsoleto por realidades de las libs.

---

## Convenciones fijadas con el usuario

- **Joako hace todos los `git commit` y `git push`**. No los corras tú. Cuando termines un chunk, avísale "listo para commit" con qué cambió.
- Formato de respuestas: directo, sin relleno. Tradeoffs en 1 línea + recomendación. Pushback con argumento.
- Es 5to año Ing. Civil Informática, viene de un proyecto anterior (Magic Rouss) con stack muy parecido.

---

## Stack real (con parches vs BOOTSTRAP.md)

- **Next.js 16.2.10** + Turbopack + App Router + `src/` + TS
- **Tailwind v4** + **shadcn/ui sobre `@base-ui/react`** (NO Radix). Cambios de API vs shadcn viejo:
  - Sin `asChild`. Para polimórfico: `render={<Link href="..." />}` + `nativeButton={false}` si el render no es un `<button>` nativo.
- **Prisma v7.8.0** con generator `prisma-client` (nuevo) y output custom a `src/generated/prisma/`. Diferencias vs BOOTSTRAP.md:
  - Import del client: `import { PrismaClient } from "@/generated/prisma/client"` (NO `@prisma/client`).
  - Prisma v7 **exige `adapter` o `accelerateUrl`** en el constructor. Ya instalado `@prisma/adapter-pg` + `pg` + `@types/pg`. Uso `PrismaPg` con `DATABASE_URL`.
  - `datasource db` en schema es minimal (solo `provider`). El URL para migraciones viene de `prisma.config.ts` (que prioriza `DIRECT_URL ?? DATABASE_URL`).
- **Auth.js v5 beta** (Credentials + bcryptjs). `session: { strategy: "jwt" }`, callback `session` expone `user.id`.
- **Supabase Postgres** — proyecto `roomi` en region `sa-east-1` (São Paulo). Pooler transaction (6543) para runtime, session pooler (5432) para migrate. Ambos configurados en `.env`.
- **Web Push VAPID** — keys generadas, en `.env`. Sin usar aún.
- **Zod v4**, **useActionState** (React 19), **Server Actions** en todos los mutations.

---

## Qué está construido y verificado end-to-end

### Fase 1 — Setup
- Scaffold Next + Tailwind + TS + turbopack.
- Deps: `prisma @prisma/client next-auth@beta bcryptjs zod web-push @prisma/adapter-pg pg` + devs.
- shadcn init (base neutral, CSS vars) + componentes: `button dialog sheet input label`.
- Prisma init + `prisma.config.ts` con `DIRECT_URL ?? DATABASE_URL`.
- VAPID generadas y guardadas.
- `.env` completo (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, VAPID, `CRON_SECRET`). `.env.example` committable.

### Fase 2 — Schema MVP migrado
Modelos migrados (solo estos, el resto de BOOTSTRAP.md queda para v1/v2):
- `User`, `Household`, `Membership`, `Task`, `TaskExecution`, `PushSubscription`.
- Migración: `prisma/migrations/20260706042111_init/migration.sql`.
- **Relaciones v1/v2 removidas del schema** (Expense, Notice, Reaction, etc.) porque Prisma exige ambos lados. Se re-agregan cuando lleguen esos modelos.

### Fase 3 — Auth (registro + login)
Testeado en browser con Chrome preview MCP:
- Registro → auto-signIn → redirect a `/hoy` ✅
- Logout → `/login` ✅
- Login OK → `/hoy` ✅
- Login wrong pass → mensaje "Email o contraseña incorrectos" ✅
- `/hoy` sin sesión → redirect `/login` ✅ (gate en `src/app/(app)/layout.tsx`)

Archivos:
- `src/lib/db.ts` — Prisma singleton con `PrismaPg` adapter
- `src/lib/auth.ts` — Auth.js config (Credentials + Zod + bcrypt)
- `src/lib/session.ts` — `requireUser()`, `assertMemberOf()`
- `src/lib/validators.ts` — Zod schemas
- `src/types/next-auth.d.ts` — module augmentation para `session.user.id`
- `src/actions/auth.ts` — `register`, `login` con soporte `callbackUrl`
- `src/app/(auth)/{login,registro}/page.tsx` — server component que lee `searchParams`
- `src/app/(auth)/{login,registro}/form.tsx` — client component con `useActionState`
- `src/app/(auth)/layout.tsx` — layout centrado
- `src/app/api/auth/[...nextauth]/route.ts` — export handlers
- `src/app/(app)/layout.tsx` — auth gate para todo `/hoy`, `/tareas`, `/hogar`
- `src/app/(app)/hoy/page.tsx` — placeholder con lista de hogares + signOut
- `src/app/page.tsx` — landing con links a login/registro

### Fase 4 — Hogares (crear, unirse, salir)
Testeado en browser end-to-end:
- Crear hogar "Depa Vitacura" → user es ADMIN con rotationOrder 1 ✅
- `/hogar` lista hogares con miembros, invite link, copy button, salir ✅
- Compartir link `/unirse/[code]` → preview público con botones a login/registro con `callbackUrl` ✅
- Registrar desde link compartido → auto-login → vuelve a `/unirse/[code]` ✅
- Confirmar unirse → membership con `rotationOrder = max + 1` ✅
- Salir → `leftAt = now()` (soft delete) ✅
- Re-unirse → membership reactivada con nuevo `rotationOrder` ✅

Archivos:
- `src/actions/household.ts` — `createHousehold`, `joinHousehold` (useActionState), `joinByCode` (para /unirse), `leaveHousehold`, `joinCore` privado
- `src/components/household-forms.tsx` — client forms
- `src/components/copy-button.tsx` — client, `navigator.clipboard`
- `src/app/(app)/hogar/page.tsx` — dashboard
- `src/app/unirse/[code]/page.tsx` — join público con preview

---

## Decisiones no obvias tomadas en el camino

1. **`callbackUrl` con validación anti-open-redirect**: `safeCallback()` en `src/actions/auth.ts` — solo acepta paths que empiezan con `/` y no con `//`. Bloquea `//attacker.com` como redirect.
2. **`joinByCode(code)` separado de `joinHousehold(prev, formData)`**: hay 2 wrappers sobre `joinCore` privado — evita `FormData` sintético en el flujo `/unirse/[code]` (viene por URL).
3. **Rotación al reactivar membership**: cuando alguien vuelve al hogar del que salió, `rotationOrder = max(rotationOrder) + 1` sobre TODAS las memberships (incluidas las soft-deleted). Coherente con "nuevo miembro entra al final".
4. **Route groups `(auth)` y `(app)`**: `(app)` tiene layout con `auth()` + `redirect("/login")` — gate único para todas las páginas protegidas. `(auth)` es solo estilo (centrado). `/unirse/[code]` es público a propósito.
5. **Página login/registro split server/client**: server component lee `searchParams` (async en Next 16), pasa `callbackUrl` como prop al client component con `useActionState`. Evita el Suspense boundary que exige `useSearchParams()`.
6. **`preview_click` de Chrome MCP no submitea formularios con botones base-ui**. Workaround en testing: `form.requestSubmit()` via `preview_eval`. Solo relevante para verificación automatizada, en un navegador real el submit funciona.

---

## Estado de la DB en Supabase (después de la sesión)

Usuarios que quedaron creados durante testing:
- `test@roomi.cl` / `testpassword123` — dueño del hogar "Depa Vitacura", rotationOrder 1, role ADMIN.
- `dos@roomi.cl` / `testpassword123` — miembro "Depa Vitacura", rotationOrder 3 (fue 2, salió, volvió).

Bórralos con `DELETE FROM "User"` o desde Supabase si quieres arrancar limpio. La UI para admin no existe aún.

---

## Setup específico de la sesión que puede que necesites replicar

- `.claude/launch.json` con config `dev` (comando `npm run dev`, puerto 3000). Sirve para arrancar el server con `preview_start` de Chrome MCP.
- Nota TZ: Windows genera warnings de LF→CRLF en git. Ignorables.
- El comando `create-next-app@latest .` **rechaza directorios no vacíos**. Truco: mover `BOOTSTRAP.md`/`HANDOFF.md` a la carpeta padre, correr scaffold, mover de vuelta.

---

## Estructura actual del repo (relevante)

```
roomi/
├── BOOTSTRAP.md               ← contexto original completo (léelo primero)
├── HANDOFF.md                 ← este archivo
├── .env                       ← con secretos reales (gitignored)
├── .env.example
├── prisma/
│   ├── schema.prisma          ← 6 modelos MVP + generator prisma-client
│   └── migrations/20260706042111_init/
├── prisma.config.ts
├── src/
│   ├── generated/prisma/      ← client generado, ignorado en runtime edits
│   ├── actions/
│   │   ├── auth.ts            ← register + login
│   │   └── household.ts       ← create/join/joinByCode/leave
│   ├── app/
│   │   ├── page.tsx           ← landing
│   │   ├── (auth)/{login,registro}/  ← server + client split
│   │   ├── (app)/
│   │   │   ├── layout.tsx     ← auth gate
│   │   │   ├── hoy/           ← placeholder
│   │   │   └── hogar/
│   │   ├── unirse/[code]/     ← public join
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── ui/                ← shadcn
│   │   ├── copy-button.tsx
│   │   └── household-forms.tsx
│   ├── lib/
│   │   ├── db.ts              ← Prisma + PrismaPg singleton
│   │   ├── auth.ts            ← Auth.js config
│   │   ├── session.ts         ← requireUser + assertMemberOf
│   │   ├── validators.ts      ← Zod schemas
│   │   └── utils.ts           ← shadcn cn()
│   └── types/next-auth.d.ts
```

---

## Próximo paso — Fase 5: CRUD de tareas

Lo que sigue del MVP (BOOTSTRAP.md fases 4-6):

1. **`src/actions/task.ts`**:
   - `createTask({ householdId, title, frequency, points })` — solo si `role === ADMIN` (usar `assertMemberOf` + check role). Setea `nextAssigneeMembershipId` = primer miembro activo por rotationOrder, `nextDueDate = new Date()`, `cycleNumber: 0`.
   - `updateTask(taskId, ...)` — solo admin.
   - `deleteTask(taskId)` — soft delete (`active = false`), no borra ejecuciones.
2. **`src/app/(app)/tareas/page.tsx`** — lista tareas del hogar (query por membership activa). Si eres admin: link a `/tareas/nueva` + botón "editar" por tarea.
3. **`src/app/(app)/tareas/nueva/page.tsx`** — form (title, frequency select, points).
4. **UI en `/hoy`** — mostrar tareas donde `nextAssigneeMembershipId` es tu membership + vencen hoy o antes. Botón "Listo".
5. **Server Action `completarTarea(taskId)`** — la transacción del BOOTSTRAP.md líneas 298-334. Es el corazón del algoritmo. Tiene que:
   - Crear `TaskExecution` con `@@unique([taskId, cycleNumber])` para matar races.
   - Recalcular `nextAssigneeMembershipId` = siguiente activo por rotationOrder (usando `onVacationUntil`).
   - Avanzar `nextDueDate` sumando el interval de la frecuencia.
   - Incrementar `cycleNumber`.
   - Usar `db.$transaction()`.
6. **Helper `addInterval(date, freq)` en `src/lib/rotation.ts`** — dias por frecuencia: DAILY=1, WEEKLY=7, BIWEEKLY=14, MONTHLY=30 (o real months, decidir).

**Multi-hogar decisión pendiente**: el usuario puede pertenecer a N hogares. Para `/hoy` y `/tareas`, la vista está scopada a UN hogar. Necesitamos:
- Selector de hogar activo (top de la pantalla), o
- Vista combinada (todas mis tareas de todos mis hogares) con badge del hogar.

Recomendación: **vista combinada en `/hoy`** (mostrar todas), y **selector en `/tareas`** (para crear necesitas contexto de un hogar). Preguntarle al usuario antes de implementar.

---

## Cosas que dejé sin hacer (a propósito, no eran MVP fase actual)

- Bottom nav (`src/components/bottom-nav.tsx` en BOOTSTRAP.md) — se puede agregar cuando haya más de 2 rutas navegables.
- Middleware `src/middleware.ts` — hoy el gate está en `(app)/layout.tsx`, es suficiente para MVP. Middleware sería más eficiente pero no crítico.
- PWA (manifest + sw.js + iconos) — fase 11 del MVP, después de tareas.
- Vercel Cron endpoints — fase 9-10, después de push.
- Web Push wiring — fase 7-8.

---

## Cómo verificar que todo sigue funcionando al abrir la sesión nueva

1. `npm install` (si es un clon fresco).
2. `npx prisma generate`.
3. `npm run dev`.
4. Ir a `http://localhost:3000` → landing.
5. Registrarse con user nuevo o login con `test@roomi.cl` / `testpassword123`.
6. `/hogar` debería mostrar "Depa Vitacura" si logueaste como test@.
7. Crear una tarea aún no se puede — es lo próximo.

Si `prisma generate` falla porque cambió el schema pero el generated/ está viejo, borrar `src/generated/prisma/` y regenerar.

---

## Frase mágica para arrancar la nueva sesión

> "Lee `BOOTSTRAP.md` (contexto original) y luego `HANDOFF.md` (estado real después de fases 1-4). Sigamos con la fase 5 del MVP: CRUD de tareas + Server Action `completarTarea` con la transacción de rotación. Antes de codear, dime cómo vas a manejar el multi-hogar en `/hoy` y `/tareas`, y espera OK."
