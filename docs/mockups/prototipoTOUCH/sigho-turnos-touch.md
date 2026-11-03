# SIGHO — Rediseño touch de "Control de turnos y expedientes"

> Especificación para un agente de código. Objetivo: adaptar la pantalla de control de turnos para uso en monitores táctiles (Elo 15", ~1024×768) sin perder el uso con teclado.

---

## 1. Contexto

- Pantalla: **SIGHO › Control de turnos y expedientes** (sigho.hro.gob.gt).
- Se usa en ventanilla, en un monitor táctil Elo de 15" (resolución probable 1024×768, 4:3) **con teclado físico al lado**. Es posible que la pantalla sea **resistiva**: no hay multitouch ni gestos finos fiables.
- Cada estación tiene una especialidad por defecto (ej. `EST-01 · Medicina interna`).
- Etapas del flujo: **Registrar**, **Recibir/Repartir**, **Devuelto**, **Archivo**, cada una con contador.
- Hay ~12 especialidades (Medicina Interna con 130 turnos; la mayoría con 16) y más de 15 clínicas físicas (Clínica 1–12, 6a, 6b, Nutrición, Dermatología, Neuro…).

### Problemas del diseño actual

1. Todas las especialidades se muestran **apiladas verticalmente**, cada una con su cuadrícula, lo que obliga a hacer scroll.
2. Las celdas de turno miden ~20 px; el mínimo táctil recomendado es **44–48 px**.
3. Un bloque lateral con el nombre de la especialidad ("Medicina Interna · 87/130") ocupa ~120 px sin ser interactivo.
4. La barra izquierda "Flujo de seguimiento" aparece cortada.
5. La barra derecha "Clínicas físicas" ocupa espacio permanente, aunque solo se usa en la etapa **Recibir/Repartir**.
6. Los estados dependen casi solo del color y del brillo (glow cian) sobre tema oscuro, por lo que pierden contraste con la luz ambiente.
7. "Eliminar registro" está junto a botones de uso frecuente, con riesgo de toque accidental.

---

## 2. Nueva distribución (maestro-detalle)

```
┌───────────────────────────────────────────────────────────────┐
│ ☰ SIGHO  [Registrar 4][Repartir 105][Devuelto 4][Archivo 4] 09:47│  ← A. Barra superior
│ MI-89 ● Registrado    Tipo: [Presentación][Privado][✓Sin marca]  │  ← B. Barra de turno actual
├──────────────────┬────────────────────────────────────────────┤
│ ESPECIALIDADES   │  Medicina Interna · 87/130                 │  ← D. Encabezado de cuadrícula
│┌────────────────┐│   1   2   3   4   5   6   7   8   9  10 ...│
││Medicina Interna││  14  15  16  17  18  19  20  21  22  23 ...│
││ 87/130      ●  ││  ...                                       │
│└────────────────┘│  118 119 120 121 122 123 124 125 ... 130   │  ← E. Cuadrícula de turnos
│ Neurología  0/16 │                                            │
│ Reumatología 2/16│   (solo la especialidad seleccionada,      │
│ Endocrino   1/16 │    celdas grandes, sin scroll)             │
│ Clín. Mujer 13/16│                                            │
│ Dr. Astrid  2/16 │                                            │
│ ...  (scroll)    │                                            │
├──────────────────┴────────────────────────────────────────────┤
│ Destino: [Clínica 3 · 18 ▾]                     ← solo Repartir │  ← F. Barra de destino
└───────────────────────────────────────────────────────────────┘
       ↑ C. Lista de especialidades
```

Estructura sugerida en CSS Grid:

```css
.turnos-touch {
  display: grid;
  height: 100vh;
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas:
    "top     top"
    "turno   turno"
    "lista   grid"
    "destino destino";
}
```

---

## 3. Componentes

### A. Barra superior
- Menú (☰), logo SIGHO, selector de estación y reloj/indicador "REAL" como hoy.
- **Las etapas pasan a pestañas segmentadas**: `Registrar | Recibir/Repartir | Devuelto | Archivo`, cada una con su contador. Sustituyen a la barra izquierda "Flujo de seguimiento".
- Altura de cada pestaña ≥ 48 px.

### B. Barra de turno actual
- Muestra el turno asignado (`MI-89`), su estado (`● Registrado`) y la especialidad/clínica.
- Chips de **Tipo de registro**: `Presentación`, `Privado de libertad`, `Sin marca`, con altura ≥ 44 px y estado seleccionado claro (✓ + fondo sólido).
- `Historial` se queda visible. **`Eliminar registro` pasa a un menú `⋮`** y siempre pide confirmación.
- Eliminar el texto de ayuda largo ("Modo Recibir/Repartir: Enter sobre…"). Como mucho, una línea pequeña o un ícono (?) con la ayuda.

### C. Lista de especialidades (columna izquierda, ~220 px)
- Un botón por especialidad, de **≥ 56 px de alto**, con:
  - el nombre (hasta 2 líneas, con elipsis si no cabe),
  - el contador `registrados/total` (ej. `87/130`),
  - un indicador (punto o barra fina de progreso) si tiene turnos pendientes de repartir o devueltos.
- La especialidad de la estación queda **seleccionada por defecto y fijada arriba** de la lista.
- La lista hace scroll vertical si no cabe; la cuadrícula no.
- La especialidad seleccionada tiene un estado visual fuerte (fondo sólido + borde).

### D. Encabezado de cuadrícula
- Una sola línea: `Medicina Interna · 87/130` + selector de **Rango** (`Todos`, `1–130`, etc.).
- Elimina el bloque lateral grande con el nombre de la especialidad.
- El checkbox "Vista ampliada" se elimina; este diseño ya es la vista ampliada.

### E. Cuadrícula de turnos
- Muestra **solo la especialidad seleccionada**.
- Las columnas se calculan según el total, para usar todo el espacio sin scroll:
  - total > 100 → 13 columnas (130 = 13 × 10, celdas de ~58×55 px a 1024×768)
  - total 17–100 → 10 columnas
  - total ≤ 16 → 8 columnas
- Tamaño de celda: **mínimo 48×48 px, máximo ~90 px**, para que las especialidades pequeñas no se vean exageradas.
- El número va en 18–20 px y bold.
- **Estados con ícono + color** (no solo color):
  | Estado | Color actual | Ícono |
  |---|---|---|
  | Registrado | amarillo | ✓ |
  | Recibir/Repartir | morado | → |
  | Devuelto | rojo | ↩ |
  | Archivo | verde | 🗀 |
  | Libre | sin relleno | — |
- Reducir o quitar el glow cian; usar bordes sólidos de 2 px y mayor contraste. Considerar un tema claro de alto contraste para estaciones con mucha luz.

### F. Barra de destino (solo en Recibir/Repartir)
- Oculta en las demás etapas.
- Muestra un chip **`Destino: Clínica N · contador ▾`**. Si no hay destino fijado: `Destino: sin fijar ▾`.
- Al tocarlo se abre la **hoja de clínicas** (ver abajo).

### G. Hoja de clínicas (bottom sheet / modal)
- Botones grandes en una cuadrícula de 3–4 columnas, de **≥ 64 px de alto**. Cada uno muestra el nombre de la clínica y `NN expedientes en clínica`.
- **Filtrar clínicas por especialidad**: si existe el mapeo especialidad → clínicas, mostrar solo las de la especialidad seleccionada (ej. Medicina Interna → Clínicas 1–4). Incluir un enlace "Ver todas" como respaldo.
- Al elegir una clínica, queda fijada como destino y la hoja se cierra.
- Se cierra con ✕, tocando fuera o con `Esc`.

### H. Panel "Clínicas físicas" actual
- Se retira de esta pantalla.
- Su información (expedientes por clínica) pasa a una vista o pestaña de **consulta/supervisión** aparte, o queda disponible dentro de la hoja de clínicas mediante los contadores.

---

## 4. Flujos de interacción

### Registrar
1. El operador toca una especialidad en la lista (o se usa la de la estación).
2. Toca un número libre → se registra el turno con el tipo de registro seleccionado.
3. La barra de turno actual se actualiza (`MI-89 ● Registrado`).

### Recibir/Repartir
1. Aparece la barra de destino.
2. **Si hay destino fijado:** tocar un turno lo asigna a esa clínica directamente.
3. **Si no hay destino fijado y el turno no tiene clínica asignada:** tocar el turno abre la hoja de clínicas; al elegir, se asigna y (opcional) queda fijada.
4. **Si el turno ya tiene clínica asignada:** se usa esa automáticamente (igual que el comportamiento actual).

### Devuelto / Archivo
- La misma lista + cuadrícula; sin barra de destino.

---

## 5. Teclado (mantener compatibilidad)

- `↑`/`↓` o `+`/`−`: cambiar de especialidad en la lista.
- Flechas dentro de la cuadrícula: mover el foco entre celdas.
- `Enter`: misma acción que hoy (elegir el siguiente turno / confirmar).
- `Esc`: cerrar la hoja de clínicas o menús.
- Agregar un campo de **entrada directa de número de turno** (escribir `82` + Enter).
- Foco visible (`:focus-visible`) en todos los elementos.

---

## 6. Reglas técnicas para touch

```css
/* Activar el modo touch automáticamente en pantallas táctiles */
@media (pointer: coarse) {
  .panel-clinicas-lateral { display: none; }
}

.turno-cell,
.especialidad-item,
.clinica-btn,
button {
  touch-action: manipulation;          /* evita zoom por doble toque y el retardo de 300 ms */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.turno-cell:active,
.clinica-btn:active,
.especialidad-item:active {
  transform: scale(0.96);              /* feedback inmediato al toque */
}

.turno-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 13), minmax(48px, 90px));
  grid-auto-rows: minmax(48px, 90px);
  gap: 6px;
  align-content: start;
  justify-content: center;
}
```

- **Debounce de ~300 ms** en el clic de cada celda y botón de acción, para que un doble toque no registre dos veces.
- No depender de `:hover` ni de tooltips para información importante.
- Evitar gestos de deslizar y mantener presionado (pantalla posiblemente resistiva); usar solo toques simples.
- Las acciones destructivas siempre llevan confirmación.
- Separación mínima de 8 px entre objetivos táctiles distintos.

---

## 7. Criterios de aceptación

- [ ] A 1024×768, la cuadrícula de Medicina Interna (130 turnos) se ve completa **sin scroll** y cada celda mide ≥ 48×48 px.
- [ ] Solo se muestra la cuadrícula de la especialidad seleccionada; cambiar de especialidad cuesta un toque.
- [ ] La especialidad de la estación está seleccionada por defecto al cargar.
- [ ] Cada especialidad de la lista muestra su contador `registrados/total` y un indicador de pendientes.
- [ ] Las etapas están en pestañas superiores con contador; ya no hay barra izquierda de flujo.
- [ ] La barra de destino y la hoja de clínicas solo aparecen en Recibir/Repartir.
- [ ] La hoja de clínicas muestra por defecto solo las clínicas de la especialidad seleccionada (si existe el mapeo).
- [ ] Los estados se distinguen sin color (ícono por estado).
- [ ] "Eliminar registro" está en un menú secundario y pide confirmación.
- [ ] Todos los atajos de teclado actuales siguen funcionando.
- [ ] Un doble toque rápido sobre una celda no genera dos registros.
- [ ] Sin scroll horizontal en ninguna etapa.

---

## 8. Notas para el agente

- **No cambiar la lógica de negocio ni la API**: es un cambio de presentación e interacción.
- Antes de implementar, revisar el código existente para:
  - identificar el componente actual de la pantalla y cómo obtiene especialidades, turnos y clínicas;
  - confirmar si existe un mapeo especialidad → clínicas (si no existe, mostrar todas las clínicas y dejar un `TODO`);
  - respetar las convenciones del proyecto (framework, estilos, nombres de componentes). SIGHO lo desarrollan varias personas, así que hay que seguir el estilo del código que ya existe.
- Si es posible, mantener la vista actual detrás de un toggle o una preferencia de estación (`vista: clásica | touch`) para hacer la transición sin romper otras estaciones.
- Probar en 1024×768 y, si hay acceso, en el monitor Elo real.
