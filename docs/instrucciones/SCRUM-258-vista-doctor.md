# SCRUM-258 — Frontend: vista pública del doctor

- **Jira:** SCRUM-258
- **Responsable:** Andrés López
- **Rama:** `frontend-vista-doctor`
- **Estado Jira:** En curso
- **Alcance actual:** F1–F4.1 con datos ficticios locales

## Contexto

El doctor necesita llamar pacientes desde su teléfono. El tablero institucional reacciona a
`POST /turnos/{id}/llamar` mediante WebSocket, pero esta rama **todavía no está integrada**
con el backend ni con el WebSocket real. Las acciones, el orden y el cooldown se simulan
localmente.

Mockup de referencia visual:

`docs/mockups/vistaDoctor/hro_vista_doctor_movil.html`

## Objetivo

Implementar la ruta pública `/vista-doctor` con:

- acceso por número de colegiado, sin contraseña;
- identificación de la clínica mediante un enlace corto;
- lista de pacientes de la clínica, no del médico;
- nombre y expediente ocultos hasta validar el expediente;
- llamar, rellamar, no respondió y atendido;
- un solo turno activo, orden explícito de cola y cooldown local;
- registro local del médico que atendió;
- asociación local de expediente;
- resumen de jornada;
- cierre con doble confirmación y reapertura controlada.

## Reglas generales

- Solo frontend. **No** tocar backend ni base de datos.
- No crear endpoints nuevos ni inventar contratos.
- Usar `@/` para imports cross-carpeta.
- Reutilizar UI kit y la fachada `doctorApi.js`.
- No usar `AuthContext` para la identidad del doctor.
- No implementar `BroadcastChannel` ni publicar eventos al tablero real.
- UI en español, responsive móvil primero.
- No usar datos hospitalarios reales.

## Acceso y clínica

- Ruta pública: `/vista-doctor?clinica=101-11` (código corto provisional).
- También se acepta el UUID del espacio físico.
- Código ausente, inválido o desconocido: error claro; no se elige otra clínica.
- Código sin asignación diaria: error claro.
- Pantalla inicial: “¿Quién está ahí?”.
- Colegiado numérico (por ejemplo `1001`), sin prefijo `COL-`; se conserva como texto.
- Búsqueda mock; el adaptador acepta `COL-1001` por compatibilidad.
- El nombre se obtiene del registro; no se escribe manualmente.
- La identidad se guarda en `sessionStorage['hro_doctor']`.

## Lista de pacientes

- La lista pertenece a la asignación/clínica; **no** se filtra por médico.
- Scroll interno con altura máxima responsiva, scrollbar compacta y cabecera sticky en
  escritorio.
- En móvil, la pista “Desliza para ver más” aparece cuando hay contenido fuera del área.
- Correlativos alfanuméricos (`MI-1`, `REUMA-2`) sin truncar; los numéricos se normalizan a
  texto.
- El orden de la cola proviene del campo explícito `orden`, no del texto del correlativo.
- Inicialmente solo se muestra el correlativo:
  - Expediente: **Sin registrar**.
  - Nombre: **Pendiente de identificar**.
- Columnas: correlativo, expediente, paciente, estado, espera y acciones.
- Estados: `en_espera`, `llamado`, `no_responde`, `atendido`, `reintegrado`.
- Estados de interfaz: loading, success, empty, error y retry.

## Contratos reales de referencia

Los endpoints de “clínica” usados en versiones anteriores (`/clinicas`,
`/turnos/clinica/{id}`) **no existen** en el backend vigente. El modelo actual es
`EspacioFisico` + `AsignacionDiariaEspacio`.

| Operación | Contrato real |
|---|---|
| Médico por colegiado | `GET /medicos/colegiado/{numeroColegiado}` |
| Espacio físico | `GET /espacios-fisicos/{id}` |
| Asignaciones del día | `GET /asignaciones-diarias?fecha=YYYY-MM-DD` |
| Turnos de la asignación | `GET /turnos/asignacion/{asignacionDiariaEspacioId}` |
| Paciente por expediente | `GET /pacientes/expediente/{numeroExpediente}` |
| Llamar / rellamar | `POST /turnos/{id}/llamar` |
| No respondió | `POST /turnos/{id}/no-responde` |
| Atendió | `POST /turnos/{id}/atendido` |
| WebSocket | `/topic/tablero`, `/topic/clinica/{asignacionId}`, `/topic/estacion/{id}` |

No hay un endpoint para persistir el colegiado/nombre del médico en la atención ni para
registrar el expediente asociado al turno. Esas operaciones quedan locales en esta fase.

## Acciones

- **Llamar:** `en_espera` o `reintegrado` → `llamado`.
- **Rellamar:** `llamado` o `no_responde` → `llamado`, incrementa intentos y conserva
  correlativo. En `no_responde` no equivale a reintegrar al final de la cola.
- **No respondió:** `llamado` → `no_responde`; no exige expediente.
- **Atendió:** `llamado` → `atendido`; exige expediente validado y guarda atención local con
  médico, colegiado, turno, paciente, expediente y fecha/hora.
- Las transiciones inválidas, dobles clics y acciones con jornada cerrada se bloquean.
- Solo puede existir un turno `llamado` por cola.
- Para llamar un turno `en_espera` o `reintegrado`, debe ser el primero elegible por `orden`.
- Mientras exista un turno activo, no se puede llamar a otro.
- `Atendió` y `No respondió` liberan la atención.
- Cooldown local de 10 s entre llamados/rellamados; el botón muestra el tiempo restante.
  Atender, no responder, consultar/registrar expediente y cerrar jornada no esperan cooldown.
- En modo mock la exclusividad es local a la pestaña; no hay garantía entre dispositivos.

## Expediente

- Acción **Registrar expediente** o **Editar expediente** por fila.
- El expediente es numérico, de **1 a 10 dígitos**, se conserva como texto y admite ceros
  iniciales.
- El nombre y el expediente no se muestran hasta que el médico valida el número en el modal.
- El modal consulta el registro ficticio y muestra el nombre del paciente.
- Si el expediente no existe, se muestra error.
- Si corresponde a otro paciente, se bloquea la asociación.
- Si el turno ya fue atendido, no se permite modificar.
- La asociación se guarda en el turno dentro de `hro_jornada_operativa` y sobrevive a la
  recarga de la misma pestaña.
- No se usa `PUT /pacientes/{id}` ni se modifica un registro institucional.
- La versión 2 de la jornada invalida datos antiguos de F4 para no exponer nombres ni
  expedientes desde sesiones previas.

## Estadísticas

- **Pendientes:** `llamado` + `no_responde`.
- **En espera:** `en_espera` + `reintegrado`.
- **Atendidos:** `atendido`.

Son categorías disjuntas. Se calculan con los turnos ficticios de la pestaña; no son cifras
institucionales. Un rellamado no crea un paciente ni una atención nuevos.

## Fin de jornada

- Doble confirmación: resumen y advertencia, luego confirmación final.
- Al confirmar: se guarda `hro_jornada_cerrada`, se elimina `hro_jornada_operativa` y
  `hro_doctor`; se vuelve a “¿Quién está ahí?”.
- El mismo médico y clínica puede reabrir con confirmación explícita.
- Otro médico no reabre automáticamente la jornada anterior.
- No modifica la jornada institucional ni la sesión global de HRO.

## Fuera de alcance actual

- Backend, migraciones y endpoints nuevos.
- Persistencia real de expediente o del médico en la atención.
- WebSocket y tablero real.
- Autenticación segura de la vista pública.
- Resolución institucional de códigos cortos y múltiples asignaciones por clínica.
- Exclusividad, orden y cooldown transaccionales entre múltiples dispositivos.
- Estadísticas institucionales.

## Criterios de aceptación

Comprobables con mocks:

- [x] `/vista-doctor` es pública y pide colegiado.
- [x] Colegiado inexistente/inactivo muestra error.
- [x] La lista corresponde a la clínica y no al médico.
- [x] Nombre y expediente ocultos hasta validar.
- [x] Llamar, rellamar, no respondió y atendió actualizan el estado local.
- [x] Un solo turno activo, orden explícito y cooldown local.
- [x] El médico que atendió queda registrado localmente.
- [x] Fin de jornada bloquea acciones y permite reapertura controlada.
- [x] La interfaz funciona en móvil.
- [x] Asociación local de expediente con validación de paciente.

Pendientes de backend real:

- [ ] El tablero institucional recibe el llamado real.
- [ ] El médico y el expediente se persisten institucionalmente.
- [ ] La vista pública tiene autenticación/autorización segura.
- [ ] Los códigos cortos se resuelven con un contrato institucional.
- [ ] La exclusividad, el orden y el cooldown se validan entre dispositivos.

## Validación

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

## Referencias

- `frontend/src/modules/vistaDoctor/README.md`
- `frontend/src/modules/vistaDoctor/api/doctorApi.js`
- `frontend/src/modules/vistaDoctor/api/doctorMockApi.js`
- `frontend/src/modules/vistaDoctor/api/doctorAcciones.js`
- `frontend/src/modules/vistaDoctor/pages/VistaDoctorPage.jsx`
- `backend/src/main/java/com/hro/system/medico/controller/MedicoController.java`
- `backend/src/main/java/com/hro/system/turno/controller/TurnoController.java`
