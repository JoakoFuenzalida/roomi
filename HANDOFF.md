# Roomi — Handoff (actualizado 2026-11-10)

Contexto estable (stack, comandos, convenciones, preferencias) en `CLAUDE.md`. Este archivo es el estado del proyecto.

---

## 1. Qué estábamos haciendo y en qué quedamos

Preparar Roomi para que Joako lo pruebe con amigos y conocidos. La última sesión larga con Claude (hasta 2026-08-09) cubrió: rate limiting, borrar cuenta, banner offline, recuperación de contraseña, Realtime en todos los módulos, push en cuentas, páginas legales, mayúsculas automáticas, sheet de pago con saldo en vivo, icono PWA más grande, onboarding para usuarios sin hogar y control global de notificaciones.

Después Joako siguió solo hasta el **2026-08-26** (último commit `2dc10af`): historial de tareas, mensajes automáticos del sistema en el chat, pagos pendientes de confirmar, emails en minúscula, arreglos de PWA en iOS (zoom, teclado tapando sheets), botón de refrescar en el header y refresco al volver a la app.

Hoy (2026-11-10) el árbol de trabajo está limpio, en `main`, sin cambios sin commitear. Llevamos ~2,5 meses sin actividad. [VERIFICAR con Joako] si los testers ya la están usando y qué reportaron.

---

## 2. Terminado / a medias / falta

### Terminado (en `main`)

| Módulo | Qué hace | Archivos principales |
|---|---|---|
| Auth | Registro, login, Google OAuth con vinculación por email, logout, `safeCallback()` anti open-redirect, rate limit 5/min por IP, emails en minúscula | `actions/auth.ts`, `lib/auth.ts`, `app/(auth)/*` |
| Recuperar contraseña | Token UUID de 1 h vía Resend, mensaje genérico (no revela si el email existe), rate limit 3/min | `actions/password-reset.ts`, `lib/email.ts`, `(auth)/olvidaste`, `(auth)/reset/[token]` |
| Hogares | Crear (queda ADMIN), unirse por link `/unirse/[code]` o código, salir (soft delete `leftAt`), admin puede sacar miembros (regenera `inviteCode`), QR de invitación, foto de portada | `actions/household.ts`, `actions/household-cover.ts`, `(app)/hogar` |
| Onboarding | Usuario sin hogar ve en `/hoy` bienvenida + tabs Crear/Unirme con los forms inline | `components/onboarding-empty.tsx` |
| Tareas | Frecuencias ONCE/DAILY/WEEKLY/BIWEEKLY/MONTHLY con días específicos, participantes con orden (drag & drop + ruleta), rotación saltando vacaciones, completar en transacción (`TaskExecution @@unique([taskId, cycleNumber])`), 1,5x RC si haces la tarea de otro, swap de turno, historial de completadas | `actions/task.ts`, `lib/rotation.ts`, `components/task-actions.tsx`, `(app)/tareas` |
| Compras | Items únicos y recurrentes, marcar comprado crea `Expense` + `ExpenseSplit` (con exclusiones), deudas derivadas, pagos con confirmación del acreedor, sheet de pago con deuda y saldo restante en vivo, pagos pendientes de confirmar | `actions/shopping.ts`, `actions/settlement.ts`, `components/shopping-actions.tsx` |
| Cuentas | Piezas con costo y ocupante, boleta mensual incremental, items EQUAL/CUSTOM con exclusiones, pago y confirmación por ítem (arriendo y cada servicio), "Traer fijos", navegador de meses, borrar cobros fantasma | `actions/cuentas.ts`, `components/cuentas-actions.tsx`, `(app)/cuentas` |
| Chat | Mensajes en vivo (modelo `Notice`), menciones `@`, reacciones, long-press en móvil, silenciar por hogar (solo avisa si te mencionan), mensajes automáticos del sistema (tarea completada, compra, pago registrado/confirmado) | `actions/chat.ts`, `components/chat.tsx` |
| Ranking | RoomiCoins del mes por miembro, títulos, reset manual por admin | `(app)/hoy/client.tsx` |
| Realtime | `broadcastUpdate` + `<RealtimeRefresh>` en `/hoy`, `/tareas`, `/compras`, `/cuentas`. Además refresco al volver a primer plano y botón manual en el header | `components/realtime-refresh.tsx`, `foreground-refresh.tsx`, `header-refresh-button.tsx` |
| Push | VAPID, suscripción por usuario, push en casi todas las acciones, recordatorio diario, silenciar todo 24 h / 1 semana / siempre, segunda oportunidad para activar desde perfil | `lib/push.ts`, `actions/push-mute.ts`, `components/push-settings.tsx`, `push-prompt.tsx`, `public/sw.js` |
| Crons | `advance-overdue` 03:05 UTC (avanza tareas vencidas, 0 pts) y `daily-reminder` 14:00 UTC [VERIFICAR hora local en Chile según horario de verano] | `api/cron/*`, `vercel.json` |
| PWA | Manifest, SW, prompt de instalación con flujo iOS/Android, iconos agrandados, badge, banner offline, offset del teclado en sheets, sin zoom | `public/*`, `install-prompt.tsx`, `keyboard-offset-provider.tsx` |
| Perfil | Editar nombre y foto, hogares, notificaciones, silenciar chat, vacaciones, dark mode, cerrar sesión, borrar cuenta (anonimiza) | `(app)/perfil`, `actions/account.ts`, `actions/profile.ts` |
| Legales | `/terminos`, `/privacidad`, linkeadas desde la landing | `app/terminos`, `app/privacidad` |
| Errores | `(app)/error.tsx` (Reintentar / Ir al inicio), `not-found.tsx`, `loading.tsx` por ruta | |

### A medias / con problemas conocidos

- **`src/app/api/fix-emails/route.ts`**: borrado el 2026-11-24 (exponía usuarios con `hashedPassword` sin auth). Falta desplegar y decidir si rotar algo.
- **Activar push desde perfil probablemente falla**: `perfil/page.tsx` pasa `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`, que no existe en `.env` local; el layout usa `VAPID_PUBLIC_KEY`. [VERIFICAR si está definida en Vercel.] Si no, `pushManager.subscribe` recibe `undefined`.
- ~~Código de invitación vs `AutoCapitalize`~~ (arreglado 2026-11-24, verificado): `joinHousehold` pasa el código a minúscula y `AutoCapitalize` respeta `autocapitalize="none"/"off"` (opt-out para inputs futuros).
- ~~Doble tap en "Listo" completaba la tarea 2 veces~~ (arreglado 2026-11-24, verificado): `completarTarea(taskId, expectedCycle)` solo completa si el ciclo coincide y captura `P2002` (dos usuarios a la vez) devolviendo `{ error }`. El mensaje del chat ahora muestra los puntos reales (1,5x si era de otro).
- ~~Tareas pegadas en el cron~~ (arreglado 2026-11-24, falta deploy): las mensuales con día 31 quedaban fijas en el 30 de meses cortos (`computeNextDueDate` devolvía la misma fecha) y las ONCE vencidas también; cada noche se registraba un "salto" y rotaba el asignado (en prod: 2 mensuales con 55 saltos, 1 ONCE con 107). Ahora `rotation.ts` usa `dayOfMonth()`/`nextMonthly()` (sin overflow de `setMonth`, siempre avanza), el cron ignora ONCE (queda pendiente con la misma persona) y se pone al día en un solo salto. Dry-run contra prod: las 2 mensuales pasan al 2026-11-30 en la primera corrida. Las ~217 ejecuciones falsas de 0 pts siguen en la DB (no afectan puntos).
- Borrar gastos (2026-11-24): `eliminarGasto` en `actions/shopping.ts`, solo quien pagó o un admin; deja mensaje 🗑️ en el chat. Botón en "Últimas compras".
- Velocidad (2026-11-24): `vercel.json` con `regions: ["gru1"]` (antes default `iad1`, con la DB en sa-east-1: cada query cruzaba el continente). [VERIFICAR] que el dashboard de Vercel no tenga otra región forzada. "Listo" muestra el check al instante (estado local por `cycleNumber`).
- ~~Zona horaria~~ (arreglado 2026-11-24): las fechas guardadas están entre 00:00 y 05:24 UTC, así que su día calendario UTC es el día real. `lib/dates.ts` calcula "hoy" en America/Santiago (`chileToday()` = medianoche UTC del día chileno), `daysUntil`, `dueInfo`. `rotation.ts` usa solo métodos UTC (da igual la TZ de la máquina). Cron `advance-overdue` usa `chileToday()` y pasó a 04:05 UTC (00:05/01:05 en Chile todo el año).
- Rediseño de puntos (2026-11-24): esfuerzo fijo Liviana 1 / Media 3 / Pesada 5 (`lib/effort.ts`). Solo el admin lo elige al crear (los demás crean "Liviana") y lo cambia desde el chip de la tarjeta (`EffortBadge`, `setTaskEffort`). Tarea con 1 participante = personal: 0 RC, chip "Personal". Tareas viejas con otros valores (2, 4…) se muestran con la etiqueta más cercana hasta que el admin las ajuste. `createTask` ahora filtra `participantIds` a miembros del hogar.
- Hoy rediseñado (2026-11-24): "Tus tareas" con Atrasadas / Para hoy / Próximos días (7) / Puedes ayudar (+50% RC, tareas de otros vencidas u hoy donde participo). `DueChip` con colores (rojo atrasada, amarillo hoy) también en `/tareas`. El historial de 24 h marca los saltos del cron como "Nadie la hizo".
- "Listo" desde la notificación (2026-11-24): el recordatorio diario (`daily-reminder`) manda una notificación por tarea (máx. 3 por persona + 1 de resumen) con `tag` y datos de la tarea; `sw.js` le agrega el botón "✅ Listo" (Android/desktop, iOS no muestra acciones) que hace POST a `/api/tasks/complete` (sesión por cookie, `{ taskId, cycle }`) y reemplaza la notificación por una confirmación silenciosa. La lógica de completar vive en `lib/complete-task.ts` (la usan la server action y el endpoint). `lib/realtime-server.ts` hace broadcast vía REST de Supabase Realtime para que los demás vean el cambio sin app abierta. Endpoint verificado (401/400/409/200 + refresco en vivo); la notificación real en Android [VERIFICAR] tras deploy.
- Hogar de prueba en prod: "Zz Prueba Claude" con Test Ana (admin) y Test Beto. Credenciales en `.env.test` (ignorado).
- **Reset de contraseña a terceros**: sin `EMAIL_FROM` con dominio verificado en Resend, los emails solo llegan al dueño de la cuenta de Resend. [VERIFICAR qué hay en Vercel.]
- **Emails viejos con mayúsculas**: el login ahora busca en minúscula. Usuarios creados antes del 2026-08-25 con mayúsculas en el email no podrían entrar con credenciales. [VERIFICAR si se normalizaron en la DB; probablemente para eso era `fix-emails`.]
- Scripts de debug versionados en la raíz: `check.js`, `check.ts`, `check2.ts`, `test-db.ts`.
- Código muerto: `components/muro-actions.tsx` y `actions/notices.ts` (muro de avisos viejo, nadie los importa). El trabajo de realtime que se hizo sobre ellos no tiene efecto.
- Lint: 31 errores y 13 warnings (mayoría `react-hooks/set-state-in-effect`). `tsc` pasa limpio.

### Falta (no empezado)

- Evidencia fotográfica al completar tarea (`TaskExecution.photoUrl` ya existe en el schema).
- Verificación de email al registrarse.
- Baseline de migraciones Prisma.
- Rotar secretos / limpiar el historial de git (Joako decidió no hacerlo, ver §3).

---

## 3. Decisiones técnicas

### Tomadas (y por qué)

- **Deudas derivadas, no persistidas**: balance = `sum(ExpenseSplit)` − `sum(Settlement confirmados)`, compensando entre pares. Evita desincronizar una tabla `Debt`.
- **Borrar cuenta = anonimizar** (sale de todos los hogares, borra reacciones y suscripciones push, anonimiza nombre/email/imagen). Hard delete rompería gastos, tareas y mensajes de los demás.
- **Rate limit en memoria**: suficiente para pocos testers; aceptado que no se comparte entre instancias.
- **Realtime por broadcast + `router.refresh()`** en vez de `postgres_changes` o estado cliente: reutiliza los server components tal como están y no requiere RLS ni replicación.
- **Canal por hogar cacheado y suscrito una vez, con `broadcast.self: true`**: la versión anterior mandaba `.send()` en canales sin suscribir y Supabase descartaba los mensajes.
- **`createTask` sin `redirect()` en el server**: el cliente hace `broadcastUpdate` + `router.push`. El redirect cortaba el flujo y nadie veía la tarea nueva.
- **`pushMutedUntil` como único campo**: null o pasado = activas, futuro = silenciadas, año 9999 = siempre. Se chequea en `sendPushToUser`.
- **`prisma db push` en vez de `migrate dev`**: hubo cambios aplicados directo a la DB (otra sesión/IA) y `migrate dev` detectaba drift.
- **Resend** para email transaccional; tokens de reset de 1 h, de un solo uso.
- **No rotar secretos** pese a que el archivo `env` estuvo versionado en el repo público: decisión de Joako (repo sin visibilidad). Se sacó del tracking (`edd721a`) y se agregó `env` al `.gitignore`. El contenido sigue en el historial.
- **Emails normalizados a minúscula** en registro, login y Google.
- **Mensajes del sistema en el chat** al completar tareas, comprar y pagar (se guardan como `Notice` del usuario que actuó).
- **Inputs ≥16px y `userScalable: false`** para evitar el zoom de iOS.
- **Mayúscula inicial global por JS** (`AutoCapitalize`) además del atributo `autoCapitalize`: el atributo solo afecta teclados móviles.

### Solo discutidas (no decididas)

- App nativa con Capacitor o React Native si la PWA se valida.
- Borrar `env` del historial con `git filter-repo` + force push.
- `useOptimistic` para la UI colaborativa (estaba en `BOOTSTRAP.md`; se optó por `router.refresh()`).

---

## 4. Bugs encontrados y soluciones

| Bug | Causa | Solución |
|---|---|---|
| Tarea ONCE con fecha de hoy decía "Venció hace 1 día" | Se comparaba medianoche contra la hora actual con `Math.floor` | Normalizar ambas fechas a 00:00 y usar `Math.round` (`formatDue`) |
| Realtime no llegaba (marcar comprado, etc.) | `.send()` sobre canal no suscrito | Cache de canales suscritos en `realtime-refresh.tsx` |
| Crear tarea no aparecía sin recargar | `redirect()` en la action | Retornar success y navegar desde el cliente |
| `prisma migrate dev` fallaba | Drift entre migraciones y DB | Usar `prisma db push` |
| `prisma db push` bloqueado en Claude Code | Clasificador del modo auto | Lo corre Joako |
| `revalidatePath("/muro")` apuntaba a una ruta inexistente | El muro es un tab de `/hoy` | Cambiado a `/hoy` |
| Secretos en el repo | Archivo `env` sin punto escapaba a `.env*` | `git rm --cached env` + `env` en `.gitignore` |
| Zoom al enfocar inputs en iOS | font-size < 16px | `text-[16px]` + viewport sin zoom |
| Teclado tapaba los sheets en iPhone | El sheet no seguía al visual viewport | `KeyboardOffsetProvider` + `--keyboard-offset` en `ui/sheet.tsx` |
| Login con Gmail / emails con mayúsculas | Búsqueda exacta por email | Normalizar a minúscula |
| `CurrencyInput` no se podía controlar | Solo tenía `defaultValue` | Prop `value` opcional sincronizada por `useEffect` |

Abiertos: los de §2 "A medias".

---

## 5. Cambios sin commitear y ramas

- Sin cambios sin commitear al 2026-11-10. Única rama: `main` (sigue a `origin/main`). Sin stashes.
- Archivos locales ignorados con secretos: `.env` y `env` (este último sobra, tiene valores viejos).
- Este `HANDOFF.md` y `CLAUDE.md` se acaban de reescribir y quedan sin commitear.

---

## 6. Próximos pasos (en orden)

1. ~~Borrar `src/app/api/fix-emails/route.ts`~~ (hecho 2026-11-24). Desplegar y, con Joako, decidir si rotar algo: el endpoint expuso hashes bcrypt y emails.
2. Arreglar la key VAPID en `perfil/page.tsx` (usar `VAPID_PUBLIC_KEY`, que ya está en el server) y probar "Activar" desde perfil en un navegador real.
3. Probar unirse pegando un código pelado. Si falla, excluir ese input de `AutoCapitalize` (atributo opt-out) y/o hacer la búsqueda del código insensible a mayúsculas.
4. Confirmar `EMAIL_FROM` / dominio verificado en Resend para que el reset llegue a cualquier usuario.
5. Revisar en la DB que no queden emails con mayúsculas.
6. Borrar los scripts de debug de la raíz (`check*.ts`, `check.js`, `test-db.ts`) y el código muerto (`muro-actions.tsx`, `actions/notices.ts`) o decidir reutilizarlo.
7. Bajar los errores de lint.
8. Baseline de migraciones (`prisma migrate diff` desde la DB actual → migración inicial marcada como aplicada) para volver a usar `migrate`. Mostrarle el plan a Joako antes.
9. Pedir feedback a los testers y priorizar.
10. Features pendientes: foto al completar tarea, verificación de email.

---

## 7. Para el próximo Claude

Lee `CLAUDE.md` y este archivo antes de tocar nada, y revisa `git log` por si Joako avanzó después del 2026-11-10. Lo primero es el endpoint `api/fix-emails`: es una fuga de datos activa, propónle borrarlo antes de cualquier otra cosa. Trabaja en español, directo y con recomendaciones concretas; Joako hace todos los commits y pushes, tú cierras cada bloque con "listo para commit" y un resumen. Cualquier cambio de schema va con diff previo y él corre `prisma db push`; no uses `migrate dev`. Las cosas marcadas [VERIFICAR] no están confirmadas: compruébalas en el código, la DB o preguntándole antes de asumirlas. Verifica en el navegador lo que cambies y actualiza este archivo al terminar.
