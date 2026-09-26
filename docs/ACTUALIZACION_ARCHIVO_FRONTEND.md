# Actualización de la Estación de Archivo — Nuevos contratos backend (v1.5.0)

Documento para el equipo del **frontend de Archivo**. Resume **qué pedía la épica SCRUM-131**,
**qué se implementó** y **qué está disponible** ya en el backend desplegado, para que puedan
integrar la Estación de Archivo y dejar atrás los datos simulados.

- **Backend desplegado:** `https://hro-hospital-api.fly.dev/api/v1` (versión **1.5.0**)
- **Local alternativo:** `http://localhost:8081/api/v1`
- **Migración nueva:** `V9__actas_recepcion_expedientes.sql` (ya aplicada en prod)
- **Contrato detallado:** [`docs/MODULO_ARCHIVO.md`](./MODULO_ARCHIVO.md)

---

## 1. Qué pedía la épica SCRUM-131

Convertir la Estación de Archivo de un **prototipo con datos simulados** a un módulo operativo:
gestionar expedientes físicos, consultar la carga diaria, controlar estados y movimientos,
buscar por código, **generar documentos oficiales (actas y reportes)** y formalizar los
**contratos API** para el frontend.

| Historia | Subtareas | Estado |
| :--- | :--- | :--- |
| SCRUM-132 Gestionar expedientes y trazabilidad | 136 modelo, 137 estados, 138 historial | ✅ (modelo/estados/historial ya existían en V6; verificados) |
| SCRUM-133 Consultar y localizar de la jornada | 139 consulta diaria, 140 búsqueda por código, 141 ubicación | ✅ nuevo |
| SCRUM-134 Documentos y reportes | 142 actas, 143 PDF actas, 144 resumen diario, 145 PDF resumen | ✅ nuevo |
| SCRUM-135 Contratos API | 146 documentar contratos + Postman | ✅ |

---

## 2. Lo que ya está disponible (nuevo)

### 2.1 Consulta diaria de la jornada (subtarea 139)
`GET /expedientes/jornada?fecha=YYYY-MM-DD&subespecialidadId=`
(fecha por defecto: hoy; `subespecialidadId` opcional).

Devuelve las **citas del día** con los datos del expediente a preparar:

```json
{
  "citaId": 4821,
  "horaEstimada": "08:30:00",
  "pacienteId": "9b2a…-uuid",
  "pacienteNombre": "Juan López",
  "dpi": "2984123450901",
  "numeroExpediente": "EXP-001234",
  "expedienteId": "3f1c…-uuid",
  "subespecialidadId": 2,
  "subespecialidadNombre": "Medicina General",
  "cicloId": "a1b2…-uuid",
  "estadoActual": "en_busqueda",
  "ubicacionBase": { "id": 12, "pasillo": "B", "estante": "14", "balda": "3" }
}
```

Notas:
- `estadoActual` = `sin_ciclo` si la cita aún no tiene ciclo de expediente.
- `expedienteId` = `null` si el paciente no tiene expediente registrado.

> **"Clínica" = subespecialidad.** En el modelo vigente (V4) ya no existe la entidad clínica;
> la unidad de atención es la **subespecialidad**. Por eso el filtro es `subespecialidadId`.

### 2.2 Búsqueda por código (subtarea 140)
`GET /expedientes/buscar?codigo=`
- Acepta el **UUID** (escaneo QR) o el **número impreso** (código de barras).
- Devuelve `data.content` con ese expediente; **`404`** si el código no existe.
- Se conserva la búsqueda paginada por `?filtro=` (número, DPI o nombre).

### 2.3 Actas de recepción (subtareas 142 y 143)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/actas-recepcion` | Crea un acta que agrupa **N expedientes** de una jornada/unidad. Genera el número `ACT-YYYY-NNNN`. |
| `GET` | `/actas-recepcion?fecha=&subespecialidadId=` | Lista de actas. |
| `GET` | `/actas-recepcion/{id}` | Detalle con la lista de expedientes. |
| `GET` | `/actas-recepcion/{id}/pdf` | **PDF** oficial del acta (`application/pdf`). |

Request de creación:
```json
{
  "fecha": "2026-11-09",
  "subespecialidadId": 1,
  "usuarioEntregaId": 2,
  "usuarioRecibeId": 3,
  "observaciones": "Entrega de expedientes del día",
  "expedienteIds": ["3f1c…-uuid", "7d9e…-uuid"]
}
```
- Si se omite `usuarioEntregaId`, se usa el usuario autenticado.
- `usuarioRecibeId` es opcional.
- Si el expediente tiene ciclo para esa fecha, el detalle enlaza su cita.

### 2.4 Resumen operativo diario (subtareas 144 y 145)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/archivo/resumen?fecha=` | Indicadores del día por estado. |
| `GET` | `/archivo/resumen/pdf?fecha=` | **PDF** del resumen (`application/pdf`), con fecha y usuario generador. |

```json
{
  "fecha": "2026-11-09",
  "totalCiclos": 18,
  "pendienteLocalizar": 3, "enBusqueda": 2, "localizado": 1,
  "enTransitoEntrega": 4, "enTransitoRetorno": 2, "enTransito": 6,
  "entregado": 5, "archivado": 2, "noLocalizado": 1,
  "expedientesNuevos": 4
}
```

---

## 3. Estados del ciclo (recordatorio)

Valores exactos (snake_case) en `estadoActual`:

`pendiente_localizar` → `en_busqueda` → `localizado` → `en_transito_entrega` → `entregado`
→ `en_transito_retorno` → `archivado`. Incidencia: `no_localizado` (reintentable).

Las transiciones siguen igual que antes (ver `MODULO_ARCHIVO.md` §3 y §4.4); el backend valida
los cambios permitidos y rechaza los inválidos con `400`.

---

## 4. Ubicación física (subtarea 141)

**No cambió el esquema.** Se mantiene `ubicacion_archivo (pasillo, estante, balda)`.
Equivalencia operativa con el vocabulario del ticket:

| Ticket | Campo backend |
| :--- | :--- |
| Archivo | `pasillo` |
| Estante | `estante` |
| Caja | `balda` |
| Fila | (no modelado) |

Se gestiona con `GET/POST /ubicaciones-archivo` y `PATCH /expedientes/{id}/ubicacion-base`.

---

## 5. Manejo de errores

| Código | Cuándo | Acción sugerida en UI |
| :--- | :--- | :--- |
| `400` | Transición inválida o validación de campos | Mostrar alerta / resaltar campos y refrescar el ciclo. |
| `404` | Expediente/ciclo/acta no encontrado; código inexistente | Ofrecer búsqueda manual o creación. |
| `409` | La cita ya tiene ciclo; `numeroExpediente`/ubicación duplicados | Abrir el recurso existente. |

Errores envueltos en `ApiResponse` con `success=false` y `message`; algunos incluyen `codigo`.

---

## 6. Cómo integrarlo (recomendaciones)

1. **Reemplazar mocks por el cliente HTTP real** (`shared/api/client.js`); alternar con `VITE_USE_MOCK`.
2. **Pantalla principal:** cargar la jornada con `GET /expedientes/jornada?fecha=` (y filtro de subespecialidad) para listar lo que hay que preparar.
3. **Escaneo:** QR → `GET /expedientes/{id}`; barras → `GET /expedientes/buscar?codigo=` (unifica ambos).
4. **Operar el ciclo:** usar las transiciones existentes según `estadoActual`.
5. **Cierre del día:** crear acta (`POST /actas-recepcion`) y descargar su PDF; generar el resumen diario (`GET /archivo/resumen[/pdf]`).
6. **No calcular** indicadores ni validar transiciones en el cliente: el backend es la fuente de verdad.

---

## 7. Verificación rápida

```bash
BASE=https://hro-hospital-api.fly.dev/api/v1
curl "$BASE/health"                                  # version 1.5.0
curl "$BASE/expedientes/jornada?fecha=2026-11-09"
curl "$BASE/expedientes/buscar?codigo=EXP-001234"
curl "$BASE/actas-recepcion"
curl "$BASE/archivo/resumen?fecha=2026-11-09"
curl -OJ "$BASE/archivo/resumen/pdf?fecha=2026-11-09"
```

---

## 8. Referencias

- Contrato completo del módulo: [`docs/MODULO_ARCHIVO.md`](./MODULO_ARCHIVO.md)
- Colección Postman: `docs/postman/` (carpeta **06. Estación de Archivo**)
- Épica Jira: **SCRUM-131** (subtareas 136–146)
