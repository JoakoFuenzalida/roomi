# Handoff: Roomi — MVP (Aseo + Compras)

## Overview
Roomi es una PWA móvil-first para gestionar la convivencia entre estudiantes chilenos que arriendan un depa. Este paquete cubre dos módulos:

- **Aseo compartido** — rotación automática de tareas entre roommates.
- **Compras compartidas** — lista por comprar, historial, split de gastos y saldo de deudas.

Un usuario puede pertenecer a varios hogares. Dos roles: **Admin** (crea hogar, CRUD de tareas, configura items recurrentes) y **Miembro** (marca tareas listas, agrega items, registra compras).

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML** — prototipos que muestran el look y el comportamiento buscados, **no** código de producción para copiar tal cual. La tarea es **recrear estos diseños en tu codebase** (Next.js 16 + Tailwind v4 + shadcn/ui sobre @base-ui/react) usando sus patrones y componentes establecidos.

El prototipo está construido como un solo archivo (`Roomi MVP.dc.html`) que agrupa todas las pantallas en un canvas por "turnos". Cada pantalla vive dentro de un marco de teléfono de **390×844** con `data-screen-label` que la identifica. Ignora el chrome del canvas (marcos, badges `1a`/`3b`, etc.) — es andamiaje de presentación, no parte de la app.

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, spacing e interacciones son finales. Recrea la UI fielmente usando tus librerías y patrones. Los tokens de color están listos para pegar (ver `globals.css` abajo).

---

## Design Tokens

### Paleta (derivada del logo)
Primario coral `#FF6B6B`, tinta `#0F172A`. Escala MD3 completa para claro y oscuro. **Pega esto en `app/globals.css`:**

```css
:root {
  --background: #FFFBFA;      --surface: #FFFBFA;
  --surface-container-lowest: #FFFFFF;
  --surface-container-low: #FFF4F1;
  --surface-container: #FBEDE9;
  --surface-container-high: #F7E5E0;
  --on-surface: #0F172A;      --on-surface-variant: #6E605C;
  --outline: #D9C9C4;         --outline-variant: #EFE1DD;
  --primary: #FF6B6B;         --on-primary: #FFFFFF;
  --primary-container: #FFEDEB; --on-primary-container: #5C1414;
  --secondary: #0F172A;       --on-secondary: #FFFFFF;
  --secondary-container: #E9ECF3; --on-secondary-container: #0F172A;
  --error: #D92D20;           --error-container: #FEE4E2;
  --on-error-container: #7A1710;
  --success: #12A150;         --success-container: #DCFBE7;
  --on-success-container: #054F31;
  --warning: #B45309;         --warning-container: #FEF3C7;
  --on-warning-container: #7C4A02;
  --radius-card: 14px;        --radius-pill: 999px;
}
.dark {
  --background: #161211;      --surface: #161211;
  --surface-container-lowest: #100C0B;
  --surface-container-low: #1E1917;
  --surface-container: #241D1B;
  --surface-container-high: #2F2724;
  --on-surface: #F3E7E4;      --on-surface-variant: #D4C2BE;
  --outline: #9C8B87;         --outline-variant: #40342F;
  --primary: #FF8A8A;         --on-primary: #5E1216;
  --primary-container: #7A2528; --on-primary-container: #FFDAD7;
  --secondary: #C7CCDA;       --on-secondary: #1B2130;
  --secondary-container: #2B3040; --on-secondary-container: #DEE2EE;
  --error: #FFB4AB;           --error-container: #5C1A15;
  --on-error-container: #FFDAD6;
  --success: #7DDBA3;         --success-container: #0C3D25;
  --on-success-container: #B8F0CE;
  --warning: #FCD34D;         --warning-container: #40320F;
  --on-warning-container: #FDE9A8;
}
@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-container: var(--surface-container);
  --color-on-surface: var(--on-surface);
  --color-on-surface-variant: var(--on-surface-variant);
  --color-outline: var(--outline);
  --color-outline-variant: var(--outline-variant);
  --color-primary: var(--primary);
  --color-on-primary: var(--on-primary);
  --color-primary-container: var(--primary-container);
  --color-on-primary-container: var(--on-primary-container);
  --color-secondary-container: var(--secondary-container);
  --color-on-secondary-container: var(--on-secondary-container);
  --color-error: var(--error);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --font-display: "Fredoka", sans-serif;
  --font-sans: "DM Sans", sans-serif;
}
```

El toggle de tema es la clase `.dark` en `<html>` (patrón estándar de `next-themes`).

### Tipografía
- **Fredoka** (Google Fonts, weights 400/500/600/700) — display, títulos de pantalla, wordmark. Elegida por sus curvas geométrico-redondeadas, lo más cercano al wordmark del logo.
- **DM Sans** (Google Fonts, weights 400/500/600/700) — UI, body, números.

Escala aplicada:
- Título de pantalla: Fredoka 600, 26px, letter-spacing −0.5px
- Título de sheet: Fredoka 600, 20px
- Título de card: DM Sans 600, 15–17px
- Body: DM Sans 400, 14–15px
- Label: DM Sans 500/600, 12–13px
- Micro/overline: DM Sans 600/700, 11px, uppercase, letter-spacing 0.5px
- Números grandes (monto, stepper): Fredoka 600, 22–34px

Cárgalas con `next/font/google`.

### Spacing
Escala base 4px: **4 · 8 · 12 · 16 · 24 · 32**. Padding de pantalla horizontal 20px. Gap entre cards 9–12px.

### Radius
- Cards: **14px** (contenedores grandes/sheets: 16–28px)
- Pills, botones, chips, avatares: **999px**
- Íconos-contenedor cuadrados (tile de tarea/item): 12–13px

### Shadows
- Botón primario / FAB: `0 3px 9px rgba(255,107,107,.35)` a `0 8px 20px rgba(255,107,107,.45)` (sombra teñida de coral)
- Card: `0 2px 10px rgba(15,23,42,.05)`
- Sheet: `0 -10px 40px rgba(15,23,42,.25)`

### Símbolo del logo
Recreado como SVG inline (casa con techo + 3 "cabezas" = roommates). Va en el header de cada pantalla (30px) y como ilustración de estados vacíos (48–74px, sobre círculo `primary-container`). El wordmark "roomi" lleva el **punto de la "i" en color `--primary`** (coral). Extrae ambos SVG del archivo HTML (busca `viewBox="0 0 48 48"`).

---

## Navegación global
- **Móvil-first estricto**: viewport de referencia 390px, respeta safe-area de iOS (padding inferior ~22px en el nav).
- **Bottom nav fijo, 5 tabs**: `Hoy · Tareas · Compras · Hogar · Perfil`. Altura 84px, fondo `surface-container-lowest`, borde superior `outline-variant`. Tab activo en `--primary`, inactivos en `--on-surface-variant`. Íconos 22px, label 10.5px/600.
- Compras **sí** es tab propio (se decidió en revisión; el ícono es un carrito/bolsa).

---

## Screens / Views

### MÓDULO ASEO

#### 1. Landing (`/`) — pre-login
- **Layout**: columna centrada. Símbolo grande (132×132, `border-radius:40px`, fondo `primary-container`, símbolo coral 74px) → wordmark "roomi" (Fredoka 700, 46px) → tagline (Fredoka 500, 21px) → subtítulo (`on-surface-variant`, 14px). Al fondo: botón primario "Crear cuenta" + botón outline "Entrar" + microtexto legal.
- **Copy**: tagline "Convivencia que se organiza sola." / sub "El aseo rota solo entre los roommates. Se acabó pelear por quién lava la loza."

#### 2. `/registro` y `/login` — forms
- **Layout**: header con botón back (tile 38px radius 12px) + símbolo. Título Fredoka 600 28px + subtítulo. Un input por línea, label 12px/600 arriba, input con borde `outline` 1.5px radius 12px padding 14px.
- **Error inline**: borde e input en `--error` + fondo `--error-container` + texto de error `--error` 12px/600 debajo. Ejemplos: registro → email inválido ("Ese correo no se ve válido 🤔"); login → contraseña incorrecta.
- **Copy** (tono chileno cálido, "tú"): registro sub "Te toma menos que lavar un plato." / login título "Hola de nuevo 👋", sub "La casa te echaba de menos."

#### 3. `/hoy` — vista principal (claro + oscuro)
- **Header app**: símbolo 30px + wordmark 20px a la izquierda; avatar de iniciales (40px, `primary-container`) a la derecha.
- **Saludo**: "Buenas, Martín 👋" (Fredoka 600 26px) + línea de contexto (`on-surface-variant`).
- **Card "Tus tareas para hoy"**: hasta 5 tareas asignadas a mí, hoy o vencidas. Header de card con título 16px + chip contador (`primary-container`). Cada fila: tile de ícono 40px (radius 13px), título 15px, chip del hogar (`secondary-container`), puntos ("3 pts"), y a la derecha **botón "Listo"** (pill primaria). Filas separadas por borde `outline-variant`.
- **Tarea vencida**: sufijo "· Venció ayer" en `--error` 12px/700.
- **Estado vacío**: símbolo en círculo `primary-container` + "Todo limpio ✨" (Fredoka 600 22px) + "No te toca nada más hoy. Anda a echarte no más 🛋️".
- Pie: "Mañana te toca **trapear la cocina** 🧹".

#### 4. `/tareas` — lista del hogar activo (vista Admin)
- **Filtro por hogar** (solo si el user tiene varios): fila de chips scrollable arriba; activo en `--primary`, resto `surface-container`.
- **Card por tarea** (radius 14px): título 16px + chip de puntos (`primary-container`) arriba-derecha; fila "Le toca a **[nombre]**" con avatar 26px; fila con chip de frecuencia (`secondary-container`) + cuándo vence.
- **FAB "Nueva tarea"** (solo Admin): 56px, radius 19px, `--primary`, abajo-derecha, sobre el nav. Miembro no lo ve.

#### 5. `/tareas/nueva` — form (Admin)
- Header con botón cerrar (✕) centrado con título "Nueva tarea".
- Campos: **Título** (input); **Frecuencia** = chips seleccionables `DAILY / WEEKLY / BIWEEKLY / MONTHLY` (labels: Diaria / Semanal / Quincenal / Mensual), el seleccionado en `--primary`; **Puntos** = stepper (botón − outline 48px, número Fredoka 34px, botón + primario), rango 1–10.
- Aviso `secondary-container`: "🔄 Se asigna sola por rotación. Cada roommate toma su turno."
- Botón "Crear tarea" fijo abajo con borde superior.

#### 6. `/hogar` — hogares del user (claro + oscuro)
- **Card hogar activo** (radius 16px): nombre (Fredoka 600 19px) + chip "Activo"; avatares apilados (32px, solapados −9px) + "N miembros"; **link de invitación** en pill `surface-container` con `roomi.cl/j/x7k2` (monospace) + botón "Copiar" (cambia a "¡Copiado!" 1.6s); **orden de rotación** = lista numerada con avatar, nombre, y chip "Le toca" en el primero / "Sigue" en el segundo; botón "Salir del hogar" en `--error` (ghost).
- **Otros hogares**: card compacta con tile de iniciales + nombre + "N miembros" + chevron.
- **Al final**: botón outline "Crear otro hogar" + botón ghost "Unirme con código".

### MÓDULO COMPRAS

#### 7. `/compras` — vista principal (claro + oscuro), scrollable
Tres secciones apiladas + FAB extendido:
- **Por comprar**: header "Por comprar" + chip contador. Cada item: tile de ícono 38px, título 15px, "Agregó [quién] · [tiempo]". Items recurrentes llevan chip "🔁 le toca a [nombre]" (`primary-container`). Item normal: botón check circular outline a la derecha (marca comprado → abre sheet #9). **Swipe-to-delete**: al deslizar, revela fondo `--error` con ícono papelera + "Borrar" (en el mock el 1er item está deslizado ~84px para mostrarlo).
  - Vacío: "Nada en la lista. Toca + para agregar."
- **Últimas compras** (últimas 5–8): título, "Compró [quién] · [tiempo]", a la derecha avatares apilados 22px de quiénes pagan + monto (DM Sans 700). Tap → detalle (#10).
  - Vacío: **no mostrar la sección**.
- **Estado de cuentas** (máx 3 líneas + "Ver todo"): fila con avatar 30px + "**[nombre]** te debe" / "Le debes a **[nombre]**" + monto (`--success` si te deben `+$`, `--error` si debes `−$`). Tap en fila → mini-sheet de detalle (#12).
  - Sin deudas: "Todos al día 🎉".
- **FAB extendido** abajo-derecha: pill "＋ Agregar item" (`--primary`) → abre sheet #8.

#### 8. Sheet "Agregar item" (modal desde abajo)
- Handle 40×5px arriba. Campos: **Título** (input grande, autofocus); checkbox "Es una compra que se repite" → si marcado, aparece selector de frecuencia (semanal/quincenal/mensual) + texto "Le tocará comprar a **[siguiente en rotación]**". Botón "Agregar".
- Solo Admin puede marcar el item como recurrente.

#### 9. Sheet "Marcar como comprado" (claro + oscuro) — **interacción crítica**
Se abre al tocar un item en "Por comprar". Fondo dimmed + scrim `rgba(15,23,42,.45)`.
- **Item** pre-llenado y **no editable** (fondo `surface-container`, ícono candado).
- **Precio (CLP)**: input con "$" grande (Fredoka), sin decimales, formateado con separador de miles chileno (`6000 → $6.000`). Borde `--primary`.
- **¿Quiénes pagan?**: fila horizontal scrollable de avatares 52px con nombre debajo. **Todos seleccionados por default.** Seleccionado = coral con badge check verde (✓) esquina inferior. Excluido = gris con borde dashed + opacidad 0.55. Tap alterna. Debajo, texto dinámico: **"Se divide en $X por persona entre N"** (recalcula al instante; si N=0 → "Elige al menos a una persona").
  - *El split default es "entre todos, partes iguales"; excluir a alguien es un tap directo sobre su chip — nunca escondido en un menú.*
- **¿Quién compró?**: dropdown, default = user actual ("Tú (Martín)").
- Botón "Registrar compra".

#### 10. `/compras/[itemId]` — detalle de compra hecha
- Muestra: título, quién compró, cuándo, monto total, lista de quiénes pagan con **monto exacto a cada uno**, y quiénes ya se liquidaron. Botón "Marqué pagado" al lado de cada deuda pendiente.

#### 11. `/compras/deudas` — estado de cuentas completo (claro + oscuro)
- Header con back + "Deudas" + subtítulo "Depa Ñuñoa · N pendientes".
- **Card por deuda**, con botón según **mi rol** en esa deuda:
  - **Soy acreedor** (me deben): "**[nombre]** te debe", monto `+$` en `--success`, botón **outline "Ya me pagó"** (flujo secundario).
  - **Soy deudor** (debo): "Le debes a **[nombre]**", monto `−$` en `--error`, botón **primario "Marqué pagado"** (flujo primario) → abre sheet #13.
- **Balance neto** al final: fila por persona con avatar + monto neto (`+`/`−`, verde/rojo).

#### 12. Mini-sheet detalle de deuda (desde "Estado de cuentas" en /compras)
- Al tocar una línea del resumen: sheet con lista de las **compras que componen esa deuda** (item + monto) + botón "Marcar todo como pagado" para saldar todo de una.

#### 13. Sheet "Marcar deuda como pagada" (modal desde abajo)
- Resumen: avatar + "Le pagaste a **[nombre]**" + items + monto exacto.
- **"¿Cómo pagaste?"** (opcional, default vacío): tags `Transferencia / Efectivo / Otro`. Es solo un tag, no valida nada; tap alterna (se puede des-seleccionar).
- Nota `secondary-container`: "🔔 Le vamos a avisar a **[nombre]** para que confirme."
- Botón "Confirmar pago".

#### 14. Push notification (visual)
- Card estilo notificación push: "Cata registró que te pagó $1.200 por papel higiénico. ¿Recibiste?" con acciones inline **[Sí, confirmar]** (primario) y **[Reportar error]** (outline). Reportar error revierte el settlement.

---

## Interactions & Behavior

### Aseo
- **Tocar "Listo" en una tarea**: check con microanimación de éxito (pop + ring que se expande), se suma el puntaje y la tarea **rota al siguiente en el orden del hogar**. Actualización **optimista**: se marca al toque y se sincroniza en segundo plano.
- **Vencida vs pendiente vs recién completada**:
  - *Vencida* = sufijo "Venció ayer" en `--error`.
  - *Pendiente* = chip del hogar + puntos, tono neutral.
  - *Recién completada* = título tachado, check verde animado y "¡Listo!".
- **Frecuencia (chips)** y **puntos (stepper 1–10)** son controles seleccionables en `/tareas/nueva`.

### Compras
- **Chips de payers** (sheet "Marcar como comprado"): tap alterna seleccionado/excluido; el texto de split se recalcula en vivo. Estado no depende solo de color (badge ✓ vs borde dashed + opacidad).
- **Marcar como comprado**: al confirmar → **celebración breve** (confeti sutil o el chip/estado cambiando con un pop de éxito, ~600ms). No usar spinner.
- **Saldar deuda**: cualquiera de las dos personas puede marcar pagado, pero el **flujo primario es del deudor** ("Marqué pagado") y el secundario del acreedor ("Ya me pagó"). Al confirmar → push a la contraparte (#14) con opción "Reportar error" que revierte. El historial guarda **quién marcó el pago y cuándo**.

### Estados de settlement (visualmente distintos, accesibles — no solo color)
- **Pagado/confirmado**: `--success` + ✓.
- **Pendiente de confirmación**: borde y chip `--warning` (ámbar) + ícono de reloj + label "Esperando que [nombre] confirme" + acción "Deshacer". Monto tachado. Se auto-confirma tras X horas (regla a definir).
- **Error reportado**: `--error` + ícono de alerta + label explícito.

### Loading & Offline (PWA)
- **Loading = skeletons** (shimmer con `surface-container` → `surface-container-high`), **nunca spinners**.
- **Offline**: marcar tareas y registrar acciones funciona sin conexión — se guarda local y se sube al reconectar. Banner sutil "Sin conexión — se guardó local".

---

## State Management
- **Sesión/usuario**: user actual, hogares a los que pertenece, hogar activo, rol (Admin/Miembro) por hogar.
- **Aseo**: lista de tareas por hogar (título, frecuencia, puntos, asignado actual, próximo en rotación, fecha de vencimiento, estado done). Completar tarea = mutación optimista + avanzar rotación.
- **Compras**: items por comprar (título, creador, timestamp, recurrente + frecuencia + siguiente en rotación); compras registradas (item, comprador, monto, payers[], per-person, timestamp); deudas derivadas (deudor, acreedor, monto, items que la componen, estado: pendiente/pagado/esperando-confirmación/error, quién marcó + cuándo, método opcional).
- **Sheets**: estado local del modal (payers seleccionados, precio, método de pago, comprador).
- **Tema**: claro/oscuro vía `next-themes` (clase `.dark`).

## Assets
- **Símbolo + wordmark de Roomi**: SVG inline en el HTML (no hay archivo de imagen aparte; extráelos del prototipo). Punto de la "i" en `--primary`.
- **Íconos de UI** (nav, tareas, items, back, candado, reloj, papelera, check): SVGs inline stroke-based, 22–24px, `stroke-width` 2. Reemplázalos por tu set de íconos (p. ej. lucide-react) manteniendo el peso de línea.
- **Fuentes**: Fredoka + DM Sans desde Google Fonts.
- Sin imágenes rasterizadas.

## Screenshots
Referencia visual de cada pantalla en `screenshots/` (claro y oscuro):

| # | Archivo | Pantalla |
|---|---------|----------|
| 01 | `01-design-system.png` | Mini design system (paleta, tipografía, componentes) |
| 02 | `02-hoy-light.png` | /hoy — claro |
| 03 | `03-tareas.png` | /tareas (Admin, con FAB) |
| 04 | `04-hogar-light.png` | /hogar — claro |
| 05 | `05-hoy-dark.png` | /hoy — oscuro |
| 06 | `06-hogar-dark.png` | /hogar — oscuro |
| 07 | `07-landing.png` | Landing (/) |
| 08 | `08-registro.png` | /registro (error inline) |
| 09 | `09-login.png` | /login (error inline) |
| 10 | `10-tarea-nueva.png` | /tareas/nueva |
| 11 | `11-tokens-notas.png` | Tokens CSS + notas de interacción |
| 12 | `12-compras-light.png` | /compras — claro |
| 13 | `13-sheet-marcar-comprado.png` | Sheet "Marcar como comprado" |
| 14 | `14-deudas-light.png` | /compras/deudas — claro |
| 15 | `15-sheet-marcar-deuda-pagada.png` | Sheet "Marcar deuda como pagada" |

## Files
- `Roomi MVP.dc.html` — prototipo completo con todas las pantallas (agrupadas por turnos en un canvas). Ábrelo en el navegador para ver/interactuar. Busca los `data-screen-label` para ubicar cada pantalla; los marcos de teléfono y badges son andamiaje de presentación.
- `globals.css.txt` — el bloque de tokens de arriba, aislado y listo para pegar.

## Notas para tu stack (Next.js 16 + Tailwind v4 + shadcn/ui / @base-ui/react)
- Los sheets modales → componente Sheet/Drawer de shadcn (variante bottom).
- Chips de frecuencia/payers → Toggle / ToggleGroup.
- Stepper de puntos → dos Button + estado numérico.
- Dropdown "quién compró" → Select.
- Bottom nav → componente propio fijo (`fixed bottom-0`), respeta `env(safe-area-inset-bottom)`.
- Los colores ya están como CSS vars MD3 → mapea a tu `@theme inline` (incluido arriba) y usa clases `bg-surface`, `text-on-surface`, `bg-primary`, etc.
- No se usaron componentes exóticos: todo es card, button, input, chip, avatar, sheet, select, FAB, bottom-nav.
