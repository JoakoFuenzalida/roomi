@AGENTS.md

# Roomi

PWA mobile-first para organizar la convivencia de estudiantes que arriendan un depa juntos (Chile, UI en español es-CL). Rotación automática de tareas, lista de compras con gastos divididos, cuentas mensuales (arriendo + servicios), chat del hogar con ranking de "RoomiCoins". Un usuario puede pertenecer a varios hogares. Usuarios actuales: Joako y amigos/conocidos como testers. Producción en Vercel (según config: `roomi-gamma.vercel.app`).

Estado detallado y pendientes: ver `HANDOFF.md`. `BOOTSTRAP.md` es histórico (contexto original), no lo trates como estado actual.

## Stack

- **Next.js 16.2.10** (App Router, Turbopack, `src/`, TypeScript) + React 19. Tiene breaking changes respecto a lo que conoces: lee `node_modules/next/dist/docs/` antes de usar APIs de Next.
- **Tailwind v4** + **shadcn/ui sobre `@base-ui/react`** (NO Radix). Tokens Material Design 3 en `src/app/globals.css` (primario coral `#FF6B6B`), dark mode por clase `.dark`.
- **Prisma 7.8** con generator `prisma-client` → `src/generated/prisma/` (gitignored). Usa `@prisma/adapter-pg` + `pg`.
- **Supabase**: Postgres (región sa-east-1), Realtime (broadcast) y Storage (bucket `avatars`, también para portadas de hogar).
- **Auth.js v5 beta** (`next-auth@5.0.0-beta.31`), sesión JWT, providers Credentials (bcryptjs) + Google.
- **Zod v4** en todas las Server Actions. **web-push** (VAPID) + service worker propio `public/sw.js`. **Resend** para email (reset de contraseña).
- Extras: `@dnd-kit` (orden de participantes), `canvas-confetti` (ruleta), `react-qr-code` (invitación).

## Estructura

```
prisma/schema.prisma      21 modelos. Las migraciones en prisma/migrations/ están DESACTUALIZADAS (ver Advertencias)
prisma.config.ts          usa DIRECT_URL ?? DATABASE_URL
vercel.json               2 crons
public/                   manifest.json, sw.js (push + badge), icon*.svg/png, coins.png
scripts/test-cron.ts      prueba advance-overdue contra localhost:3000
src/actions/              Server Actions, una por dominio (task, shopping, settlement, cuentas, chat, household,
                          auth, password-reset, account, profile, push-mute, chat-mute, vacation, household-cover)
                          notices.ts: código muerto (solo lo importa muro-actions.tsx, que nadie usa)
src/app/
  page.tsx                landing (redirige a /hoy si hay sesión)
  (auth)/                 login, registro, olvidaste, reset/[token]
  (app)/layout.tsx        auth gate + BottomNav, OfflineBanner, PushPrompt, InstallPrompt, ForegroundRefresh
  (app)/hoy               tabs: Muro (dashboard de pendientes) | Chat en vivo | Ranking. No existe /muro
  (app)/tareas, compras, cuentas, hogar, perfil
  api/cron/*              protegidos con Authorization: Bearer CRON_SECRET
  api/push/subscribe      guarda PushSubscription
  api/fix-emails          ⚠️ endpoint de debug PÚBLICO, ver HANDOFF
  terminos, privacidad, unirse/[code]
src/components/           componentes cliente por dominio (*-actions.tsx) + ui/ (shadcn)
  realtime-refresh.tsx    broadcastUpdate() + <RealtimeRefresh/> (sync entre clientes)
  auto-capitalize.tsx     listener GLOBAL que pone mayúscula la primera letra de todo input de texto
src/lib/                  db, auth, session (requireUser, assertMemberOf), push, email, rate-limit,
                          rotation (fechas de tareas), validators (Zod), supabase-client, utils (cn)
check.js, check.ts, check2.ts, test-db.ts   scripts de debug en la raíz (sobran)
```

## Comandos

```bash
npm install              # postinstall corre prisma generate
npm run dev              # dev server (launch.json "dev", puerto 3000 o autoPort)
npx tsc --noEmit         # typecheck (pasa limpio)
npm run lint             # eslint: hay ~31 errores y 13 warnings preexistentes (react-hooks)
npm run build
npx prisma generate      # tras cambiar el schema; luego reinicia dev (y borra .next si no toma los modelos)
npx prisma db push       # aplica el schema a Supabase. Lo corre Joako (ver Preferencias)
npx tsx scripts/test-cron.ts   # requiere dev server corriendo
```

No hay suite de tests. Verificación = `tsc` + probar en el navegador (preview del dev server).
Deploy: Vercel desde `main` [VERIFICAR si es auto-deploy al push]. Variables en el dashboard de Vercel.

## Variables de entorno (solo nombres; valores en `.env`, nunca en el repo)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres vía pooler transaccional (6543), runtime |
| `DIRECT_URL` | Postgres sesión (5432), para Prisma CLI y scripts |
| `AUTH_SECRET` | firma JWT de Auth.js (lo lee la librería) |
| `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST` | URL base de Auth.js; también base de los links de reset |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | web-push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | la usa `perfil/page.tsx` pero NO está en `.env` local (bug, ver HANDOFF) |
| `CRON_SECRET` | auth de `/api/cron/*` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente Supabase (Realtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | subida a Storage desde server actions |
| `RESEND_API_KEY`, `EMAIL_FROM` | email de reset. `EMAIL_FROM` no está en `.env` local → usa `onboarding@resend.dev` |

## Convenciones de código

- Mutaciones = Server Actions con `"use server"`, validación Zod, `requireUser()` + `assertMemberOf(userId, householdId)` al inicio, chequeo de rol ADMIN donde aplique.
- Formularios: `useActionState`; la action retorna `{ error }` o `{ success, ts }` y el cliente reacciona en `useEffect` (cerrar sheet, `broadcastUpdate`, `router.push`). No hagas `redirect()` en actions que deban notificar realtime.
- Después de mutar: `revalidatePath(...)` en el server y `broadcastUpdate(householdId)` en el cliente. Páginas con datos compartidos montan `<RealtimeRefresh householdId>`.
- Push: `sendPushToUser` / `sendPushToHousehold(householdId, payload, excludeUserId)` fire-and-forget con `.catch(() => {})`. Respetan `User.pushMutedUntil`.
- Prisma: `import { ... } from "@/generated/prisma/client"`, nunca `@prisma/client`. Cliente singleton en `@/lib/db`.
- base-ui: no existe `asChild`. Para Link como botón: `render={<Link href="..." />}` + `nativeButton={false}`.
- Sheets: siempre `side="bottom"` y `open` controlado con estado (sin SheetTrigger).
- Montos: enteros en CLP. Input con `<CurrencyInput>` (muestra `$1.000`, envía el número por un hidden). Formato `toLocaleString("es-CL")`.
- Inputs con `text-[16px]` o más (si no, iOS hace zoom al enfocar). La app bloquea zoom (`userScalable: false`).
- Fechas de vencimiento: normalizar a medianoche antes de comparar (ver `formatDue` en tareas).
- Emails siempre en minúscula al registrar/loguear.
- Textos de UI en español chileno informal ("roomis", "RoomiCoins").

## Preferencias de Joako

- Directo, sin relleno. Tradeoffs en una línea + recomendación. Si algo es mala idea, discútelo con argumentos.
- **Nunca corras `git add`, `git commit` ni `git push`.** Al terminar un bloque, di "listo para commit" y resume qué cambió. Git de solo lectura está bien.
- Antes de cambiar `prisma/schema.prisma`, muestra el diff y espera el OK. Joako corre `npx prisma db push` él mismo (el modo auto de Claude Code lo bloquea); tú puedes correr `prisma generate`.
- Actualiza `HANDOFF.md` cuando termines features relevantes.
- Verifica en el navegador los cambios visibles, sin pedirle que pruebe a mano lo que puedes probar tú.
- Nada de comentarios que expliquen lo obvio ni código de más.

## Advertencias

- **Migraciones desfasadas**: la última migración es de 2026-08-05; todo lo posterior (PasswordReset, `pushMutedUntil`, `assignedToUserId`, participantes de tareas, portada, chatMuted, etc.) se aplicó con `db push`. `prisma migrate dev` va a detectar drift y querer resetear la DB. **No lo corras.** Usa `db push` hasta que se haga un baseline.
- `src/generated/prisma/` se regenera; no lo edites. Turbopack no recarga el cliente Prisma: reinicia el dev server.
- Existe un archivo `env` (sin punto) local con secretos reales. Ya está en `.gitignore`, pero estuvo versionado y sigue en el historial de git. No lo vuelvas a agregar.
- `src/app/api/fix-emails/route.ts` expone sin auth todos los usuarios (incluido `hashedPassword`). Pendiente de borrar.
- `AutoCapitalize` es global: cualquier input nuevo sin `type` email/password/url/number recibe mayúscula inicial. Puede romper campos que distinguen mayúsculas (código de invitación).
- El chat guarda los mensajes en el modelo `Notice` (canal Realtime `room_${householdId}`). `muro-actions.tsx` y `actions/notices.ts` son restos del muro de avisos viejo; no están conectados a ninguna página.
- La sincronización de datos usa el canal `sync_${householdId}`. Los canales se cachean en un `Map` y se suscriben una vez; un `.send()` sobre un canal sin suscribir se pierde sin error.
- El rate limit (`src/lib/rate-limit.ts`) es en memoria: se reinicia en cada cold start y no se comparte entre instancias de Vercel.
- Con `onboarding@resend.dev` como remitente, Resend solo entrega al email dueño de la cuenta de Resend; los reset de contraseña a otros usuarios no llegan sin un dominio verificado.
- iOS: push solo funciona con la PWA instalada (standalone). iOS cachea el icono: hay que reinstalar para ver cambios.
