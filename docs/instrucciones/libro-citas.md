# Libro de Citas — Digitalización del libro físico de citas

> **Nombre corto de la vista:** **Libro de Citas**
> **Módulo sugerido:** `frontend/src/modules/libroCitas/` · **Ruta sugerida:** `/libro-citas`
> **Backend:** `https://hro-hospital-api.fly.dev/api/v1`
> **Tipo de trabajo:** **solo frontend** (la integración con la API se explicará aparte).
> **Diseño de referencia:** módulo `frontend/src/modules/archivo/`

Este documento es la guía para construir la vista **Libro de Citas**. Explica **por qué** se
hace, **qué se espera** y **detalla** los campos, la tabla y las rutas del backend a las que
apuntará.

---

## 1. Motivo y qué se espera (contexto)

En el hospital, las citas se llevan en un **libro físico** (papel). Ese libro es la fuente de
la verdad hoy, pero:

- No es consultable en el sistema ni sirve para que **Archivo** sepa qué expedientes preparar.
- Digitalizarlo a mano **sin estructura** no ayuda.
- Necesitamos **migrar** esas citas a la base de datos del SIGHO de forma ordenada.

Por eso esta vista permite **digitalizar el libro de citas**: el personal **ingresa cada cita por
su número de expediente**, el sistema **consulta al paciente** para **corroborar el nombre**, y
cuando coincide se **agrega a una tabla**. Al final, todo el "paquete" capturado se **guarda de
una vez**.

**Cómo ayuda:**
- Deja las citas en el sistema (trazables y consultables).
- Permite que **Archivo** sepa cuántos expedientes y de qué área se preparan.
- El personal **verifica visualmente** que el expediente corresponde a la persona correcta antes
  de guardar.

> Fase 1: captura **manual**. La integración real con la API se explicará en persona; aquí se
> dejan documentadas las rutas para no perder el contrato.

---

## 2. Alcance

- **Sí:** construir la pantalla, el formulario, la tabla y las validaciones.
- **No (por ahora):** conectar la API. Aun así, se documenta el contrato (§6) para que el código
  quede listo y sea fácil de "encender" después.

---

## 3. Layout y navegación

- La vista tiene su **propio layout** (cabecera + navbar).
- El **navbar** debe contener **únicamente**:
  1. **Libro de Citas** (la sección activa).
  2. **Cerrar sesión** (mismo comportamiento que en el módulo de Archivo: `useAuth().cerrarSesion`
     y navegar a la ruta de login del modo actual).
- **Basarse visualmente en el módulo de Archivo** (`frontend/src/modules/archivo/`): mismos
  tokens de color (`bg-surface`, `text-on-surface`, `primary`, `outline-variant`, …) y componentes
  compartidos (`frontend/src/shared/components/ui/*`: `Button`, `Input`, `Select`, `Card`,
  `Alert`, `EmptyState`, `Spinner`, `Icon`, `Toast`).

---

## 4. Formulario de captura

Debe permitir ingresar **una cita** y agregarla a la tabla.

| Campo | Tipo | Obligatorio | Detalle |
|---|---|---|---|
| **Fecha de la cita** | `date` | Sí | La fecha a la que corresponde la cita. |
| **Especialidad** | `select` | Sí | **Un único select.** Por ahora solo **Medicina Interna** y **Medicina General**. Se irán agregando más. |
| **Número de expediente** | `text` | Sí | Formato **`NNNN-NN`** = 4 dígitos + guion + 2 dígitos. Ejemplo: **`1323-23`**. El backend valida el patrón (`^\d{4}-\d{2}$`); el frontend debe aplicar la misma validación. |
| **Nombre del paciente** | texto de lectura | — | Se muestra **automáticamente** al ingresar el expediente (resultado de la consulta). No se escribe a mano. |
| Botón **"Agregar a la lista"** | — | — | Valida y agrega la fila a la tabla; limpia el campo de expediente. |

**Comportamiento esperado del flujo:**
1. El usuario escribe el **número de expediente** (p. ej. `1401-24`).
2. El sistema **consulta al paciente** por ese expediente (ver §6.1) y **muestra el nombre**.
3. El usuario **corrobora** que el nombre coincide con la persona.
4. Pulsa **"Agregar a la lista"** → se agrega a la tabla (con expediente, nombre, fecha y
   especialidad).
5. Repite para todas las citas del día.

> **Validaciones:** fecha requerida; especialidad requerida; expediente con formato válido;
> **no permitir el mismo expediente repetido** en la tabla (misma fecha y especialidad).

---

## 5. Tabla acumulada

El usuario va formando su "paquete" de citas. La tabla debe mostrar:

| Columna | Valor |
|---|---|
| **Número de expediente** | `1401-24` |
| **Nombre del paciente** | (obtenido de la consulta) |
| **Fecha de la cita** | `2026-10-06` |
| **Especialidad** | Medicina Interna / Medicina General |
| **Acción** | Eliminar la fila |

- Al final, un botón **"Guardar"** envía **todas** las filas de la tabla (ver §6.2).
- Tras guardar: mostrar confirmación (`Toast`), y **limpiar la tabla**.
- Estados de **carga / error / vacío** con los componentes compartidos.

---

## 6. Rutas del backend (contrato a usar)

Base: `{{baseUrl}} = https://hro-hospital-api.fly.dev/api/v1`
Respuestas envueltas en `ApiResponse`: `{ timestamp, success, message, data }`.

### 6.1 Consultar paciente por número de expediente (el nombre)

```http
GET /pacientes/expediente/{numeroExpediente}
```
- Ejemplo: `GET /pacientes/expediente/1401-24`
- Respuesta:
```json
{
  "timestamp": "...",
  "success": true,
  "message": "Paciente localizado",
  "data": {
    "id": "9b2a…-uuid",
    "dpi": "2984…",
    "nombres": "María",
    "apellidos": "López",
    "fechaNacimiento": "1985-03-20",
    "sexo": "F",
    "numeroExpediente": "1401-24"
  }
}
```
- **De aquí se obtiene el nombre** (`nombres + apellidos`) que se muestra para corroborar.
- `404` si el expediente no existe → mostrar "Expediente no encontrado".

### 6.2 Guardar el paquete (lista de citas capturadas)

Al pulsar **Guardar**, se envía **la lista completa** de filas de la tabla:

```http
POST /libro-citas/expedientes
Content-Type: application/json
X-Usuario-Id: registro-01
X-Usuario-Rol: personal_citas
X-Usuario-Nombre: Registro Médico

{
  "items": [
    { "numeroExpediente": "1401-24", "pacienteId": "9b2a…-uuid", "fecha": "2026-10-06", "subespecialidadId": 1 },
    { "numeroExpediente": "1402-24", "pacienteId": "7c2d…-uuid", "fecha": "2026-10-06", "subespecialidadId": 2 }
  ]
}
```
- Respuesta:
```json
{
  "timestamp": "...",
  "success": true,
  "message": "Libro de citas guardado",
  "data": { "total": 2, "insertados": 2 }
}
```
- Errores: `400` validación (formato de expediente, campos faltantes) · `409` expediente
  duplicado.

> **Nota para el desarrollo:** por ahora **no** se conecta la API. Cuando se integre, estas son
> las dos llamadas a usar. El contrato de §6.2 **ya está implementado en el backend desplegado**
> (expedientes individuales, `POST /libro-citas/expedientes`). El número de expediente debe venir
> con el formato real **`NNNN-NN`** (ej. `1323-23`); otro formato responde **400**.

### 6.3 Cabeceras (modo mock)

Como aún no hay login, la identidad va por cabeceras (el cliente Axios compartido
`shared/api/client.js` ya las envía desde `localStorage`):

| Cabecera | Valor sugerido |
|---|---|
| `X-Usuario-Id` | `registro-01` |
| `X-Usuario-Rol` | `personal_citas` |
| `X-Usuario-Nombre` | Registro Médico |

En `frontend/.env`:
```
VITE_BACKEND_URL=https://hro-hospital-api.fly.dev
VITE_USUARIO_ID=registro-01
VITE_USUARIO_ROL=personal_citas
VITE_USUARIO_NOMBRE=Registro Médico
```

---

## 7. Criterios de aceptación

- [ ] Navbar con **solo** "Libro de Citas" y "Cerrar sesión".
- [ ] Formulario con **fecha**, **especialidad (select único)** y **número de expediente**.
- [ ] Validación del formato de expediente (**`NNNN-NN`**, ej. `1401-24`) y campos requeridos.
- [ ] Al ingresar el expediente se muestra el **nombre del paciente** (consulta §6.1).
- [ ] Botón "Agregar a la lista" agrega la fila; se impiden **duplicados**.
- [ ] Tabla con columnas: expediente, nombre del paciente, fecha, especialidad y eliminar.
- [ ] Botón **"Guardar"** que envía el paquete completo (§6.2) y limpia la tabla.
- [ ] Estados de carga / error / vacío; responsive; accesible por teclado.
- [ ] Pruebas con Vitest + Testing Library; `npm run lint` y `npm run build` sin errores nuevos.

---

## 8. Referencias

- `frontend/src/modules/archivo/` — implementación y diseño de referencia.
- `docs/MODULO_ARCHIVO.md` — ejemplo de contrato de un módulo completo.
- `docs/instrucciones/mesa-coex.md` — otro documento de instrucciones (formato similar).
