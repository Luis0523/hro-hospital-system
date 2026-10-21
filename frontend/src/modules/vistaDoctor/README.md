# Vista Doctor — F4.1

Pantalla pública `/vista-doctor` para identificación por colegiado, consulta de la cola de una
clínica y operación local de turnos. Esta entrega usa **solo datos ficticios locales**; no
realiza peticiones HTTP, mutaciones ni publicaciones WebSocket contra el backend hospitalario.

## Ruta pública

```text
/vista-doctor?clinica=101-11
/vista-doctor?clinica=202-11
/vista-doctor?clinica=303-00
```

- El código corto se resuelve internamente contra los fixtures.
- Se conserva compatibilidad con el UUID del espacio físico.
- `escenario=vacio` fuerza una lista vacía.
- `escenario=error` fuerza un error de lectura o de acción.
- El código corto es provisional, no una credencial de seguridad.

## Fixtures

| Uso | Valor |
|---|---|
| Clínica 3, cola MI | `101-11` |
| Clínica 5, cola REUMA | `202-11` |
| Clínica 7, sin asignación | `303-00` |
| Colegiados válidos | `1001`, `1002`, `3001` |
| Colegiado inactivo | `2001` |
| Colegiado inexistente | `9999` |
| Expediente de Carlos | `0000000006` |
| Expediente de otro paciente | `0000000999` |

La cola de Clínica 3 usa correlativos `MI-1` a `MI-6`; la de Clínica 5 usa `REUMA-1` a
`REUMA-3`.

## Arquitectura

```text
VistaDoctorPage
  ├── useClinicaDoctor
  ├── useSesionDoctor
  ├── useTurnosDoctor
  ├── useCooldown
  └── useAccionesTurno
        ↓
doctorApi.js
        ↓
doctorMockApi.js  ←→ sessionStorage
        ↓
doctorAcciones.js / doctorMappers.js
```

- `doctorApi.js` es la fachada estable.
- `doctorMockApi.js` implementa la fuente mock y la persistencia.
- `doctorAcciones.js` concentra orden, turno activo, cooldown, transiciones y estadísticas.
- `doctorMappers.js` normaliza correlativos como texto y conserva `orden` explícito.
- Los componentes visuales no importan fixtures directamente.

## Lista y scroll

- Región desplazable con `max-height: 60vh` (`38rem` en pantallas grandes).
- Scrollbar nativa delgada de 6 px, con `scrollbar-width: thin` y
  `scrollbar-color`; pseudoelementos WebKit en `vistaDoctor.css`.
- Cabecera sticky en escritorio.
- Región con `role="region"`, nombre accesible y `tabIndex=0`.
- En móvil se muestra la pista “Desliza para ver más” cuando hay contenido fuera del área.
- Encabezado, estadísticas y **Fin de jornada** quedan fuera del scroll.
- No hay paginación, scroll infinito ni virtualización.

## Correlativos y orden

- `correlativo` es un identificador de presentación alfanumérico (`MI-1`, `REUMA-2`).
- Los correlativos numéricos se normalizan a texto (`12` → `"12"`).
- El `id` interno del turno es independiente del correlativo.
- La cola se ordena por el campo explícito `orden`, no por el texto del correlativo.

## Privacidad inicial del paciente

- Inicialmente solo se muestra el correlativo.
- Expediente: **Sin registrar**.
- Nombre: **Pendiente de identificar**.
- El nombre y el expediente solo se muestran después de validar el expediente en el modal.
- Las sesiones antiguas de jornada se invalidan mediante la versión 2 de
  `hro_jornada_operativa` / `hro_jornada_cerrada`.

## Expedientes simulados

- Acción **Registrar expediente** o **Editar expediente** por turno.
- El expediente es numérico, de **1 a 10 dígitos**; se conserva como texto y admite ceros
  iniciales. No se usa `type="number"`.
- El modal consulta el registro ficticio, muestra el paciente y bloquea:
  - entradas vacías o inválidas;
  - expedientes inexistentes;
  - expedientes de otro paciente;
  - turnos ya atendidos.
- La asociación se guarda en el turno dentro de `hro_jornada_operativa`.
- Al marcar **Atendió**, se exige expediente validado y se registra localmente el médico,
  colegiado, turno, paciente, expediente y fecha/hora.
- **No respondió** no exige expediente.
- No se usa `PUT /pacientes/{id}` ni se modifica un registro institucional.

## Regla de turno activo y orden

- Solo puede existir un turno `llamado` por cola de clínica/asignación.
- Para llamar un turno `en_espera` o `reintegrado`, debe ser el primero elegible por `orden`.
- Mientras exista un `llamado`, no se puede llamar a otro turno.
- Un `no_responde` puede rellamarse si no hay otro turno activo; conserva su correlativo.
- **Atendió** y **No respondió** liberan la atención.
- Las reglas se validan en la UI y nuevamente en el adaptador mock.

## Cooldown

- `COOLDOWN_MS = 10000` en `doctorAcciones.js`.
- Se aplica globalmente a la cola para llamar o rellamar.
- El primer llamado no espera.
- El botón muestra el tiempo restante (`Rellamar en 8 s`).
- Atender, no responder, consultar/registrar expediente y cerrar jornada no esperan cooldown.
- El instante `ultimoLlamadoEn` se guarda en la jornada local y sobrevive a la recarga.
- El intervalo de React se limpia al vencer o desmontar.

## Estadísticas

- **Pendientes**: `llamado` + `no_responde`.
- **En espera**: `en_espera` + `reintegrado`.
- **Atendidos**: `atendido`.

Categorías disjuntas, calculadas desde los estados reales de la cola mock. Un rellamado no
crea un paciente nuevo ni una atención nueva.

## Almacenamiento local

| Clave | Uso |
|---|---|
| `hro_doctor` | Identidad, clínica, asignación y código |
| `hro_jornada_operativa` | Turnos, expedientes, atenciones y `ultimoLlamadoEn` |
| `hro_jornada_cerrada` | Último cierre y estado para reapertura |

Versión de jornada: `2`. Los datos de F4 con versión anterior se ignoran y no exponen nombres
ni expedientes. Al cerrar la pestaña se pierde `sessionStorage`.

## Fin de jornada

1. Modal con médico, clínica, resumen y advertencia.
2. Confirmación final explícita.
3. Se guarda la jornada cerrada, se bloquean acciones y se elimina `hro_doctor`.
4. Se vuelve a “¿Quién está ahí?”.
5. El mismo médico, clínica y asignación puede confirmar la reapertura; otro médico no.

## Integración futura

| Operación mock | Contrato real previsto |
|---|---|
| `buscarMedicoPorColegiado` | `GET /medicos/colegiado/{numeroColegiado}` |
| `resolverClinicaPorQr` | `GET /espacios-fisicos/{id}` + `GET /asignaciones-diarias?fecha=` |
| `listarTurnos` / `obtenerCola` | `GET /turnos/asignacion/{asignacionDiariaEspacioId}` |
| `buscarPacientePorExpediente` | `GET /pacientes/expediente/{numeroExpediente}` |
| `llamarTurno` | `POST /turnos/{id}/llamar` |
| `marcarNoResponde` | `POST /turnos/{id}/no-responde` |
| `marcarAtendido` | `POST /turnos/{id}/atendido` |
| `registrarExpediente` | Pendiente de definición backend |
| `cerrarJornada` / `reabrirJornada` | Local; pendiente de definición backend |

Pendientes expresos del backend:

- Exclusividad transaccional de un solo turno activo.
- Orden autoritativo de la cola.
- Cooldown validado por servidor.
- Persistencia institucional del médico y del expediente en la atención.
- Autenticación/autorización segura de la vista pública.
- Resolución institucional de códigos cortos y múltiples asignaciones por clínica.
- Estadísticas institucionales y llamado real al tablero.

En modo mock la exclusividad es local a la pestaña. No existe garantía entre múltiples
teléfonos, pestañas o usuarios.

## Criterios de Scrum

Comprobables con mocks:

- Acceso por colegiado.
- Clínica por enlace.
- Lista por clínica sin filtro por médico.
- Nombre/expediente ocultos hasta validación.
- Llamar, rellamar, no respondió, atendió.
- Un solo turno activo, orden y cooldown locales.
- Estadísticas y cierre/reapertura.
- Asociación local de expediente.

Pendientes de backend real:

- Persistencia institucional del médico/expediente.
- Llamado real visible en el tablero.
- Exclusividad y cooldown entre dispositivos.
- Autenticación y autorización de datos clínicos.

## Comandos

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

Desde la raíz:

```bash
git diff --check
git status -sb
```
