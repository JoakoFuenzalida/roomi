# Roomi — Handoff completo (actualizado 2026-08-09)

Este archivo captura el estado real del proyecto. Léelo para entender qué hay, cómo funciona, y qué decisiones se tomaron.

---

## Contexto del usuario (Joako)

- 5to año Ing. Civil Informática, Chile.
- Stack dominado: Next.js App Router + TS + Prisma + Supabase + Auth.js + Tailwind + PWA.
- Formato preferido: directo, sin relleno. Tradeoffs en 1 línea + recomendación. Pushback con argumento.
- **Joako hace todos los `git commit` y `git push`**. No los corras tú. Cuando termines un chunk, avísale "listo para commit" con qué cambió.
- Mostrar diffs de `prisma/schema.prisma` antes de correr `prisma migrate`.

## Qué es Roomi

PWA mobile-first para gestionar la convivencia entre estudiantes que arriendan un depa. Un usuario puede pertenecer a varios hogares.

---

## Stack

- **Next.js 16.2.10** + Turbopack + App Router + `src/` + TypeScript
- **Tailwind v4** + **shadcn/ui sobre `@base-ui/react`** (NO Radix)
  - Sin `asChild`. Para polimórfico: `render={<Link href="..." />}` + `nativeButton={false}`
  - Sheets usan `open` controlado (no SheetTrigger), siempre `side="bottom"`
- **Prisma v7.8.0** con generator `prisma-client`, output `src/generated/prisma/`
  - Import: `import { ... } from "@/generated/prisma/client"` (NO `@prisma/client`)
  - Requiere `adapter` en constructor. Usa `@prisma/adapter-pg` + `pg`
  - `prisma.config.ts` prioriza `DIRECT_URL ?? DATABASE_URL`
  - **Importante**: después de `prisma migrate dev` + `prisma generate`, borrar `.next` y reiniciar dev server para que el singleton Prisma cacheado tome los nuevos modelos
- **Auth.js v5 beta** (Credentials + Google OAuth + bcryptjs + Zod). `session: { strategy: "jwt" }`, callback expone `user.id`
- **Supabase Postgres** — proyecto `roomi`, region `sa-east-1`. Pooler transaction (6543) runtime, session (5432) migrate
- **Web Push VAPID** con `web-push`. Service Worker propio en `public/sw.js`
- **Zod v4** + `useActionState` (React 19) + Server Actions para todas las mutaciones
- **Vercel** deploy con cron jobs

---

## Novedades recientes (Agosto 2026 - UX & Gamificación)

- **Identidad Roomi**: Se reemplazó el término "roommates" por **roomis**, y los puntos por **RoomiCoins (RC)**.
- **Perfil global (Avatars)**: Todas las secciones muestran la foto de perfil del usuario (desde auth social, etc) en lugar de iniciales, dando más personalidad a la app.
- **Gamificación (RoomiCoins)**: 
  - La moneda ahora tiene su propio icono en formato PNG (sin bordes) y destaca más en el header (`32x32`).
  - Redirección rápida al tocar el contador hacia la tabla de ranking.
  - Multiplicador de RC al realizar tareas de otro roomi.
- **Asignación de Tareas y Turnos**:
  - Tareas repetitivas: Implementada la **Ruleta** de la suerte y re-ordenamiento arrastrando (drag & drop) para turnos justos.
  - Tareas únicas (no recurrentes): Selector de fecha por calendario y asignación grupal.
- **Chat en vivo**:
  - Función de menciones (`@roomi`) con alertas dirigidas.
  - Opción de silenciar notificaciones del chat general, recibiendo push solo cuando eres mencionado.
- **Cuentas y Finanzas**:
  - Historial mensual de cuentas: **MonthNavigator** para viajar instantáneamente a meses pasados (usando transiciones en cliente y validación en servidor).
  - Confirmación al borrar servicios, e items sugeridos por default (Luz, Agua, GGCC, Internet).
- **Hogar e Invitaciones**:
  - **Portada del Hogar**: Rediseño inmersivo de la sección Hogar (`/hogar`) agregando una foto de portada personalizable. Los Admins pueden subir la foto de su depa que se difumina detrás del nombre del hogar.
  - Nuevo botón para generar **Código QR** grande e invitar a roomis presencialmente escaneando la pantalla.
  - El Admin puede eliminar miembros con confirmación destructiva. Al hacerlo, el `inviteCode` del hogar **se regenera automáticamente** por seguridad.
- **UX Fluido y Nativo**:
  - Implementación de `loading.tsx` en `app/(app)` y flujos de `useTransition` (MonthNavigator) para dar percepción instantánea cross-route a nivel aplicación (spinners skeleton).
  - Corrección de bugs de overflow horizontal en mobile generados por links largos en flexboxes.

## Onboarding + control de notificaciones (2026-08-09)

### Onboarding primer uso
- Usuario nuevo que llega a `/hoy` sin hogar ahora ve un onboarding real (antes era un card simple "Todavía sin hogar").
- Componente [onboarding-empty.tsx](src/components/onboarding-empty.tsx): saludo con nombre, tarjeta con 3 features (Tareas rotan / Compras / Cuentas), tabs "Crear hogar" / "Unirme" con los forms inline (reusa `CreateHouseholdForm` y `JoinHouseholdForm`).
- El usuario no tiene que navegar a `/hogar` — puede crear o unirse desde `/hoy` directamente.

### Control global de notificaciones push
- Nuevo campo en User: `pushMutedUntil DateTime?`. Null o pasado = activas; fecha futura = silenciadas; año 9999 = "para siempre".
- Server action [push-mute.ts](src/actions/push-mute.ts): `setPushMute("24h" | "1w" | "forever" | null)`.
- `sendPushToUser` en [push.ts](src/lib/push.ts) chequea `pushMutedUntil` antes de enviar (early return).
- Componente [push-settings.tsx](src/components/push-settings.tsx) en perfil con 4 estados:
  - **Denied** (bloqueadas por navegador): mensaje para desbloquear desde configuración.
  - **Default** (nunca pidió): card con botón "Activar" — segunda oportunidad si rechazó al inicio.
  - **Granted + activas**: card verde "Activas" + chips (24h / 1 semana / Siempre).
  - **Granted + silenciadas**: card warning "Silenciadas hasta X" + botón "Reactivar".
- Activar cuando estaba muted también desmutea automáticamente.

---

## Realtime + UX pre-testers (2026-08-09)

### Realtime cross-cliente (Supabase broadcast)
- **Patrón `RealtimeRefresh` + `broadcastUpdate`**: componente cliente que se suscribe al canal `sync_${householdId}` y llama `router.refresh()` con debounce 300ms cuando llega evento `data_changed`. Cualquier acción mutante llama `broadcastUpdate(householdId)` para notificar a todos los suscritos.
- **Detalle crítico**: usa canal reutilizado por hogar (cache `Map<string, RealtimeChannel>`) con `broadcast.self: true`. La v1 creaba un canal nuevo y llamaba `.send()` sin `.subscribe()`, que Supabase descartaba silenciosamente. Ahora funciona tanto para el emisor como para los demás.
- **Módulos con realtime**: muro (`/hoy`), compras, tareas, cuentas. Las acciones broadcast: crear/completar/swap/eliminar tarea, agregar/marcar/eliminar item, marcar/confirmar/deshacer pago (arriendo + servicios), agregar/editar/eliminar gasto, agregar/editar/eliminar pieza, poblar recurrentes, crear/eliminar aviso, reaccionar, fijar.
- Archivos: `src/components/realtime-refresh.tsx`, integrado en `/hoy`, `/compras`, `/tareas`, `/cuentas`.

### Fix crear tarea (redirect + realtime)
- `createTask` ya no hace `redirect()` en el server, retorna `{ success }`. CreateTaskForm hace `broadcastUpdate` + `router.push` desde `useEffect`. Antes el redirect interrumpía el flow del cliente y ni el emisor ni los demás veían el cambio sin recargar.

### MarkPaidSheet con vista de deuda y cálculo en vivo
- El sheet de registrar pago (deuda en compras) ahora recibe `myDebts: MyDebt[]` y opcionalmente `preselectedToUserId`.
- Los chips de usuarios muestran badge con la deuda ($X.XXX).
- Al seleccionar usuario, el monto se autocompleta con la deuda exacta.
- Muestra en vivo: "✓ Quedas al día" (verde), "Aún debes: $X" (warning), o "Pagas $X de más (crédito a favor)" (primary).
- Botón "Pagar" en una deuda específica preselecciona ese usuario y monto — un click y confirma.
- `CurrencyInput` ahora soporta prop `value` controlada (además de `defaultValue`).

### Push notifications en cuentas (completado)
- `deshacerPagoRoom` y `deshacerPagoBillItem` avisan al miembro que su pago fue revertido.
- `poblarRecurrentes` avisa al hogar cuando el admin carga los fijos del mes.

### Mayúsculas automáticas (mobile)
- `autoCapitalize="sentences"` en: título de tarea, contenido de aviso, mensaje de chat, título/cantidad/nota de compras, nombre de pieza, concepto de gasto, nombre de hogar.
- `autoCapitalize="words"` en: nombre de perfil, nombre en registro.
- No aplicado a: email, password, código de invitación, montos (currency).

### Páginas legales
- `/terminos` y `/privacidad` públicas con branding Roomi (RoomiSymbol + botón volver). 10 secciones cada una.
- Links reales en la landing.
- Archivos: `src/app/terminos/page.tsx`, `src/app/privacidad/page.tsx`.

---

## Hardening pre-testers + Fase 2 (2026-08-08)

### Seguridad y Auth
- **Google OAuth**: Provider Google agregado a Auth.js. Botón "Continuar con Google" en login y registro. Auto-linking por email: si el usuario ya existe con credentials, Google login lo vincula; si no existe, lo crea. `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en `.env`.
- **Rate limiting en login/registro**: 5 intentos por minuto por IP. Rate limiter in-memory con auto-cleanup. Archivo: `src/lib/rate-limit.ts`.
- **Validación de uploads**: Server-side file type (`ALLOWED_IMAGE_TYPES`) y tamaño (5 MB max) en `uploadAvatar`.
- **Fix seguridad chat**: `deleteChatMessage` ahora valida que el mensaje pertenezca al hogar del usuario (antes cualquier usuario autenticado podía borrar mensajes de otros hogares).
- **Fix crypto**: `require("crypto").randomUUID()` reemplazado por `crypto.randomUUID()` nativo en `household.ts`.

### UX / Bug fixes mobile
- **Chat: menú contextual mobile**: Reemplazado `group-hover` (invisible en touch) por long-press (500ms). Menú pill flotante con opciones: Copiar, Me gusta/Quitar, Borrar (solo mensajes propios). Se cierra al tocar fuera. También funciona con right-click en desktop.
- **Perfil: overflow horizontal**: Agregado `overflow-x-hidden` a `<main>` de perfil y al layout wrapper de `(app)`.
- **Bottom nav sticky**: Corregido indirectamente por el fix de overflow (el overflow horizontal rompía `fixed` en mobile Safari).

### Fase 2
- **Eliminar cuenta**: Estrategia de anonimización (preserva datos compartidos). En una transacción: elimina reacciones y push subs, sale de todos los hogares (`leftAt`), anonimiza nombre/email/imagen. UI: link "Eliminar mi cuenta" en perfil con confirmación (escribir "ELIMINAR"). Archivos: `src/actions/account.ts`, `src/components/delete-account-button.tsx`.
- **Offline feedback**: Banner rojo fijo en top `z-50` cuando `navigator.onLine` es false. Se muestra/oculta automáticamente con eventos `online`/`offline`. Archivo: `src/components/offline-banner.tsx`.
- **Error boundary**: `src/app/(app)/error.tsx` — captura errores en el route group (app) con botones Reintentar e Ir al inicio.
- **404 personalizado**: `src/app/not-found.tsx` — página con branding Roomi.

---

## Módulos implementados (todos funcionales y verificados)

### 1. Auth (registro + login + Google OAuth)
- Registro con auto-login, login con callbackUrl, logout
- Google OAuth con auto-linking por email (find-or-create en `signIn` callback)
- Rate limiting: 5 intentos/min por IP en login y registro (`src/lib/rate-limit.ts`)
- `safeCallback()` anti-open-redirect (solo paths `/`, no `//`)
- Archivos: `src/actions/auth.ts`, `src/app/(auth)/{login,registro}/`, `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/rate-limit.ts`

### 2. Hogares (crear, unirse, salir)
- Crear hogar (user = ADMIN), unirse con invite link `/unirse/[code]`, salir (soft delete), re-unirse
- Archivos: `src/actions/household.ts`, `src/components/household-forms.tsx`, `src/app/(app)/hogar/page.tsx`, `src/app/unirse/[code]/page.tsx`

### 3. Tareas con rotación automática
- CRUD tareas (admin), completar (cualquiera), rotación por `rotationOrder` saltando vacaciones
- Frecuencias: DAILY, WEEKLY, BIWEEKLY, MONTHLY con días específicos (`daysOfWeek`, `daysOfMonth`)
- `completarTarea` en `$transaction`: crea `TaskExecution` (@@unique mata races), rota asignado, avanza `nextDueDate`
- Swap de turnos: el asignado puede pasar su tarea a otro miembro + push notification
- Archivos: `src/actions/task.ts`, `src/components/task-actions.tsx`, `src/lib/rotation.ts`, `src/app/(app)/tareas/`

### 4. Compras compartidas
- Lista de compras con items one-shot y recurrentes
- Al marcar comprado: crea `Expense` + `ExpenseSplit` equitativo (con exclusiones)
- Deudas derivadas: `sum(ExpenseSplit) - sum(Settlement confirmados)`
- Settlements con confirmación bidireccional (marcar pagado + confirmar pago)
- Push en compra, pago, y confirmación
- Archivos: `src/actions/shopping.ts`, `src/actions/settlement.ts`, `src/components/shopping-actions.tsx`, `src/app/(app)/compras/page.tsx`

### 5. Cuentas (gastos fijos mensuales)
- Reemplaza Google Sheets del hogar para arriendo + servicios
- **Piezas (Room)**: CRUD admin, cada pieza tiene costo y ocupante (via membership)
- **Boleta mensual incremental**: items se agregan a medida que llegan (arriendo el 1, GGCC el 20, etc.)
- **Refactor Granular de Pagos (Agosto 2026)**:
  - Antes había un estado único de "pagado" por mes, ahora cada `BillItemSplit` (ej. Luz, Agua) y cada `MonthlyCharge.room` tiene su propio estado de pago y confirmación (`paidAt`, `confirmedAt`).
  - La tarjeta de cobro (`ChargeCard`) ahora es un desplegable que lista cada ítem adeudado individualmente, permitiendo pagar Arriendo o Servicios por separado.
  - Al agregar un `BillItem` en modo "Partes iguales" (`EQUAL`), ahora se materializan los `BillItemSplit` inmediatamente en la BD para rastrear pagos individualizados.
- **Items recurrentes**: flag `isRecurring` + `dayOfMonth`, botón "Traer fijos" copia del mes anterior
- **Exclusiones por item**: `excludedUserIds` para gastos que no aplican a todos (ej: gimnasio)
- **Pagos**: miembro marca pagado (individual o todo) + push al admin, admin confirma + push al miembro
- Archivos: `src/actions/cuentas.ts`, `src/components/cuentas-actions.tsx`, `src/components/cuentas-add-bill-button.tsx`, `src/app/(app)/cuentas/page.tsx`

### 6. Muro de avisos con reacciones
- Avisos por hogar, ordenados pinned-first + fecha desc
- Reacciones emoji toggle (@@unique por notice+user+emoji)
- Quick-add emojis (muestra los 3 no usados aún)
- Admin puede fijar/desfijar avisos, autor o admin puede borrar
- Push al publicar aviso
- Archivos: `src/actions/notices.ts`, `src/components/muro-actions.tsx`, `src/app/(app)/muro/page.tsx`

### 7. Push notifications
- Suscripción VAPID, `PushSubscription` por User (no por Membership)
- `sendPushToUser(userId, payload)` y `sendPushToHousehold(householdId, payload, excludeUserId)`
- Push en: completar tarea, marcar comprado, pagar deuda, confirmar pago, nuevo gasto cuentas, pago cuentas, nuevo aviso
- Archivos: `src/lib/push.ts`, `src/app/api/push/subscribe/route.ts`, `src/components/push-prompt.tsx`

### 8. PWA
- `manifest.json` con iconos, `sw.js` para push + offline
- Install prompt con dismiss 7 días en localStorage
- Archivos: `public/manifest.json`, `public/sw.js`, `src/components/sw-register.tsx`, `src/components/install-prompt.tsx`

### 9. Dark mode
- Tokens MD3 completos en CSS (`:root` + `.dark`)
- Script anti-FOUC en `<head>` (lee localStorage antes del paint)
- `ThemeProvider` contexto React + `useTheme()` hook
- Toggle en página de perfil con persistencia localStorage
- Respeta `prefers-color-scheme` como default si no hay preferencia guardada
- Archivos: `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/app/globals.css`

### 10. Perfil
- Datos del usuario (nombre, email, foto)
- Editar perfil (nombre + foto de perfil via Supabase Storage)
- Lista de hogares con badge Admin
- Silenciar chat por hogar
- Vacation mode toggle por hogar
- Dark mode toggle
- Cerrar sesión
- Eliminar cuenta (anonimización + salir de hogares + confirmación "ELIMINAR")
- Accesible desde avatar en header de todas las páginas
- Archivos: `src/app/(app)/perfil/page.tsx`, `src/components/vacation-toggle.tsx`, `src/components/profile-actions.tsx`, `src/components/delete-account-button.tsx`, `src/actions/account.ts`

### 11. Vacation mode
- Campo `onVacationUntil` en Membership (ya existía en schema original)
- UI en perfil: activar con date picker, desactivar con un click
- Mientras activo: usuario es saltado en rotación de tareas y compras
- Archivos: `src/actions/vacation.ts`, `src/components/vacation-toggle.tsx`

### 12. Cron jobs
- **`/api/cron/advance-overdue`** (03:05 UTC): avanza tareas vencidas, asigna 0 pts, rota al siguiente
- **`/api/cron/daily-reminder`** (13:00 UTC = 10 AM Chile): push "Hoy te toca X" a cada asignado
- Protegidos con `Authorization: Bearer ${CRON_SECRET}`
- Archivos: `src/app/api/cron/advance-overdue/route.ts`, `src/app/api/cron/daily-reminder/route.ts`, `vercel.json`

### 13. Swap de turnos
- El asignado actual puede pasar su tarea a otro miembro activo
- Dropdown con avatares de los otros miembros
- Push notification al receptor
- Archivos: `swapTurno` en `src/actions/task.ts`, `SwapButton` en `src/components/task-actions.tsx`

### 14. Input de Monedas Enmascarado
- Componente `CurrencyInput` para mostrar precios en formato Chileno (`$1.000`) mientras mantiene un input numérico oculto para Server Actions.
- Aplicado en formularios de `/cuentas` y `/compras`.
- Archivo: `src/components/currency-input.tsx`

### 15. Eliminación de Cobros (Fantasmas) y Ajustes de RoomiCoins
- Botón "Reiniciar Ranking" movido de `/hogar` a la pestaña de ranking en `/hoy` exclusivo para admins.
- Botón (Modo edición - Lápiz) en "Cobros por persona" (`/cuentas`) que habilita la eliminación de cobros mensuales enteros (para limpiar cobros fantasmas).
- Icono visual de RoomiCoins (`coins.png`) incluido en el formulario de creación de Tareas.
- Archivos: `src/components/cuentas-actions.tsx`, `src/app/(app)/cuentas/page.tsx`, `src/app/(app)/hoy/client.tsx`, `src/components/task-actions.tsx`

### 16. Instalación PWA y Notificaciones (Estrategia iOS/Android)
- `InstallPrompt`: Adaptado con lógica condicional iOS vs Android. En Android usa `beforeinstallprompt` + popup nativo; en iOS detecta plataforma y obliga/guía manual ("Compartir > Agregar a Inicio"). Demoras de ocultamiento eliminadas (persistencia agresiva).
- `PushPrompt`: Se omite la solicitud si el iPhone no está en modo `standalone`. Esto fuerza al usuario de iOS a primero instalar la PWA para luego activar Notificaciones.
- Archivos: `src/components/install-prompt.tsx`, `src/components/push-prompt.tsx`

---

## Navegación

**Bottom nav (5 tabs):** Hoy | Tareas | Compras | Cuentas | Hogar

- `/hoy` — dashboard con 3 tabs (Muro | Chat en vivo | Ranking). No hay ruta `/muro` — el muro es un tab acá.
- `/tareas` — lista de tareas + crear nueva + swap
- `/compras` — lista de compras + gastos + deudas + settlements
- `/cuentas` — piezas + boleta mensual + cobros
- `/hogar` — miembros + invite link + salir
- `/perfil` — accesible desde avatar header (no tiene tab)
- `/terminos`, `/privacidad` — páginas públicas linkeadas desde landing

Multi-hogar: todas las páginas tienen chip selector cuando el usuario pertenece a >1 hogar.

---

## Estructura del repo

```
roomi/
├── BOOTSTRAP.md              ← contexto original (referencia histórica)
├── HANDOFF.md                ← ESTE ARCHIVO (estado actual)
├── AGENTS.md                 ← reglas Next.js para agentes
├── .env                      ← secretos (gitignored)
├── prisma/
│   ├── schema.prisma         ← 18 modelos
│   ├── prisma.config.ts
│   └── migrations/           ← 5 migraciones aplicadas
├── vercel.json               ← 2 cron jobs
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon.svg, icon-192.png, icon-512.png
│   └── screenshots/
├── src/
│   ├── generated/prisma/     ← client generado (no editar)
│   ├── actions/
│   │   ├── auth.ts           ← register, login, googleSignIn (+ rate limiting)
│   │   ├── account.ts        ← deleteAccount (anonimización)
│   │   ├── household.ts      ← create/join/leave
│   │   ├── task.ts           ← createTask, completarTarea, deleteTask, swapTurno
│   │   ├── shopping.ts       ← CRUD items, marcarComprado
│   │   ├── settlement.ts     ← marcarPagado, confirmarPago, getBalances
│   │   ├── cuentas.ts        ← rooms CRUD, billItems, charges, recurrentes
│   │   ├── notices.ts        ← crearAviso, eliminar, togglePin, toggleReaction
│   │   ├── chat.ts           ← sendChatMessage, deleteChatMessage, toggleChatReaction
│   │   ├── chat-mute.ts      ← toggleChatMute
│   │   ├── profile.ts        ← updateProfileName, uploadAvatar (con validación)
│   │   └── vacation.ts       ← setVacation
│   ├── app/
│   │   ├── layout.tsx        ← root layout, fonts, ThemeProvider, anti-FOUC script
│   │   ├── globals.css       ← MD3 tokens light + dark
│   │   ├── page.tsx          ← landing
│   │   ├── (auth)/           ← login, registro (server+client split)
│   │   ├── not-found.tsx     ← 404 personalizado con branding
│   │   ├── (app)/
│   │   │   ├── layout.tsx    ← auth gate + BottomNav + OfflineBanner + PushPrompt + InstallPrompt
│   │   │   ├── error.tsx     ← error boundary con Reintentar + Ir al inicio
│   │   │   ├── muro/         ← notice board
│   │   │   ├── hoy/          ← today dashboard
│   │   │   ├── tareas/       ← task list + /nueva
│   │   │   ├── compras/      ← shopping + expenses + settlements
│   │   │   ├── cuentas/      ← fixed costs (rooms + bills + charges)
│   │   │   ├── hogar/        ← household management
│   │   │   └── perfil/       ← profile + settings
│   │   ├── unirse/[code]/    ← public join page
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── push/subscribe/route.ts
│   │       └── cron/
│   │           ├── advance-overdue/route.ts
│   │           └── daily-reminder/route.ts
│   ├── components/
│   │   ├── ui/               ← shadcn (button, dialog, sheet, input, label)
│   │   ├── avatar-initials.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── copy-button.tsx
│   │   ├── cuentas-actions.tsx
│   │   ├── cuentas-add-bill-button.tsx
│   │   ├── household-forms.tsx
│   │   ├── chat.tsx              ← ChatClient con Realtime + long-press context menu
│   │   ├── chat-mute-toggle.tsx
│   │   ├── delete-account-button.tsx
│   │   ├── install-prompt.tsx
│   │   ├── muro-actions.tsx
│   │   ├── offline-banner.tsx
│   │   ├── profile-actions.tsx    ← EditProfileButton + EditProfileSheet
│   │   ├── profile-picture-upload.tsx
│   │   ├── push-prompt.tsx
│   │   ├── qr-invite.tsx
│   │   ├── roomi-logo.tsx
│   │   ├── shopping-actions.tsx
│   │   ├── sw-register.tsx
│   │   ├── task-actions.tsx
│   │   ├── task-participants-order.tsx ← drag & drop (@dnd-kit) + ruleta (confetti)
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── user-header-nav.tsx    ← server component, RC + avatar
│   │   └── vacation-toggle.tsx
│   ├── lib/
│   │   ├── db.ts             ← Prisma singleton con PrismaPg adapter
│   │   ├── auth.ts           ← Auth.js config (Credentials + Google)
│   │   ├── session.ts        ← requireUser(), assertMemberOf()
│   │   ├── push.ts           ← sendPushToUser, sendPushToHousehold
│   │   ├── rate-limit.ts     ← in-memory rate limiter por IP
│   │   ├── rotation.ts       ← computeInitialDueDate, computeNextDueDate
│   │   ├── supabase-client.ts ← Supabase client para Realtime
│   │   ├── validators.ts     ← Zod schemas
│   │   └── utils.ts          ← cn()
│   └── types/next-auth.d.ts
```

---

## Decisiones de diseño clave

1. **Deudas derivadas, no persistidas**: balance = `sum(ExpenseSplit) - sum(Settlement confirmados)`. Sin tabla `Debt`.
2. **Cuentas incrementales y granulares**: items se agregan a lo largo del mes. Los pagos ahora son individualizados por servicio (`BillItemSplit`) y arriendo (`roomPaidAt`).
3. **`excludedUserIds` por BillItem**: permite gastos que no aplican a todos (ej: gimnasio solo para algunos).
4. **Rotación por `rotationOrder`**: posición densa en el ciclo. Nuevo miembro entra al final. `onVacationUntil` en el futuro = saltado.
5. **`TaskExecution @@unique([taskId, cycleNumber])`**: idempotencia natural, mata races sin locks.
6. **`PushSubscription` por User** (no por Membership): la notificación es al humano, no al rol.
7. **Server Actions con `useActionState`**: returns void, state updates via hook. No retornar valores desde transitions.
8. **Controlled Sheet open state**: base-ui Dialog portal tiene issues con revalidation, se maneja con `useEffect` watching state.
9. **Anti-FOUC dark mode**: inline script en `<head>` lee localStorage antes de React hydration. `suppressHydrationWarning` en `<html>`.

---

## Datos de prueba en Supabase

- `test@roomi.cl` / `testpassword123` — ADMIN de "Depa Vitacura"
- `dos@roomi.cl` / `testpassword123` — MEMBER de "Depa Vitacura"

---

## Setup para nueva sesión

```bash
npm install
npx prisma generate
npm run dev
```

Si `prisma generate` falla, borrar `src/generated/prisma/` y regenerar. Si los modelos nuevos no aparecen en runtime, borrar `.next` y reiniciar.

---

## Qué queda por hacer (nice-to-have, todo lo core está hecho)

- **Evidencia fotográfica** — Supabase Storage + foto opcional al completar tarea
- **Email verification** — cualquier email sirve para registrarse
- **App nativa** — considerar Capacitor o React Native si se valida con testers
