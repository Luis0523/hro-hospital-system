# SCRUM-258 — Frontend: vista pública del doctor

- **Jira:** SCRUM-258
- **Responsable:** Andrés López
- **Vencimiento:** 2026-10-21
- **Prioridad:** Highest
- **Sprint:** Sprint 3 - Archivo
- **Épica padre:** SCRUM-155
- **Rama sugerida:** `frontend-vista-doctor`

## Contexto

El doctor necesita llamar pacientes desde su teléfono. El tablero ya reacciona a
`POST /turnos/{id}/llamar` mediante WebSocket. La vista nueva usa la **misma lógica**
que la estación de enfermería; solo cambia el origen de la orden: el teléfono.

Mockup de referencia:

`docs/mockups/vistaDoctor/hro_vista_doctor_movil.html`

## Objetivo

Implementar la ruta pública `/vista-doctor` con:

- acceso solo por número de colegiado (sin contraseña),
- lista de pacientes **de la clínica** (no del médico),
- llamar, rellamar, marcar no respondió y atendido,
- fin de jornada local,
- registro del doctor que atendió: colegiado, nombre y paciente/turno.

## Reglas generales

- Solo frontend. **No** tocar backend ni base de datos.
- No crear endpoints nuevos ni inventar contratos.
- Usar `@/` para imports cross-carpeta.
- Reutilizar UI kit y `client.js`.
- No usar `AuthContext` para la identidad del doctor.
- No implementar `BroadcastChannel`: la sincronización con el tablero la hace el backend/WebSocket existente.
- UI en español, responsive móvil primero.

## Estructura propuesta

```text
frontend/src/modules/vistaDoctor/
├── pages/
│   └── VistaDoctorPage.jsx
├── components/
│   ├── AccesoDoctor.jsx
│   ├── TablaPacientesDoctor.jsx
│   ├── ResumenJornada.jsx
│   ├── AvisosDoctor.jsx
│   └── ModalFinJornada.jsx
├── api/
│   └── doctorApi.js
└── identidadDoctor.js
```

## Acceso

- Pantalla inicial: input de número de colegiado.
- Al enviar: `GET /medicos/colegiado/{numeroColegiado}`.
- Si no existe: mensaje claro, no continuar.
- Si existe: guardar en `sessionStorage` con la clave `hro_doctor`:

```js
{
  medicoId,
  nombre: nombres,
  numeroColegiado,
  usuarioReferenciaId: medico.usuarioReferenciaId ?? null,
  clinicaId: null,
  clinicaNombre: null
}
```

- No guardar en `localStorage` ni en `AuthContext`.

## Clínica de trabajo

El médico no trae clínica desde el backend. La vista se enfoca en **una clínica**.

- Soportar `?clinica=<id>` para abrir directo una clínica.
- Si no viene, mostrar selector con `GET /clinicas` (`listarClinicas` de `enfermeriaApi.js`).
- Guardar la clínica elegida en `sessionStorage.hro_doctor` y en el estado de la página.
- Mostrar una cabecera con nombre del médico, especialidad si la hay, y clínica activa.

## Listado de pacientes

- `GET /turnos/clinica/{clinicaId}?fecha=YYYY-MM-DD`.
- Reutilizar `listarTurnosClinica` de `frontend/src/modules/enfermeria/api/enfermeriaApi.js`.
- Columnas: correlativo, expediente, nombre, estado y tiempo.
- La lista **no** se filtra por médico.
- Consultar el nombre por expediente con `buscarPaciente` (expediente con respaldo DPI).
- Si el expediente no existe, marcar la fila como inválida y deshabilitar “Llamar”.

## Acciones

Reutilizar de `enfermeriaApi.js`:

- `llamarTurno(turnoId)`
- `marcarNoResponde(turnoId, motivo)`
- `marcarAtendido(turnoId)`

Estados y botones:

- `en_espera`: **Llamar**.
- `llamado`: **Rellamar**, **No respondió**, **Atendió**.
- `no_responde`: **Rellamar**.
- `atendido`: sin acciones.

El evento de llamado debe llegar al tablero por el flujo actual.
No implementar atajos locales ni canales alternos.

## Registro del doctor que atiende

Al pulsar **Atendió**, registrar la atención:

> El doctor con colegiado X, nombre X, atendió al paciente X.

- Guardar localmente el registro:

```js
{
  medicoId,
  numeroColegiado,
  nombre,
  turnoId,
  correlativo,
  paciente,
  expediente,
  atendidoEn: 'ISO-8601'
}
```

- Mostrarlo en el resumen/bitácora de la jornada.
- Si el médico trae `usuarioReferenciaId`, enviarlo como `usuarioId` en `marcarAtendido` para que el backend audite al usuario correcto.
- Si no lo trae, **no inventar** un `usuarioId`.
- Marcar como **PENDIENTE DE BACKEND** la persistencia del colegiado/nombre como campo de la atención.

## Fin de jornada

- Botón “Fin de jornada” con modal de confirmación y resumen (pendientes, en espera, atendidos).
- Al confirmar: bloquear nuevos llamados localmente.
- Estado cerrado persistido solo en `sessionStorage`.
- Permitir reabrir con confirmación.
- No imprimir resumen.

## Fuera de alcance

- Backend, endpoints nuevos o migraciones.
- Persistencia real del campo del doctor en BD.
- Sincronización por `BroadcastChannel`.
- Filtrado de pacientes por médico.
- Login con contraseña.

## Criterios de aceptación

- [ ] `/vista-doctor` es pública y pide colegiado.
- [ ] Un colegiado inexistente muestra error claro.
- [ ] La lista corresponde a la clínica seleccionada.
- [ ] “Llamar” dispara el flujo existente y el tablero recibe el evento.
- [ ] “Rellamar”, “No respondió” y “Atendió” actualizan el estado.
- [ ] Se registra el doctor que atendió (colegiado, nombre, paciente).
- [ ] “Fin de jornada” bloquea llamados y se puede reabrir.
- [ ] Funciona en móvil.
- [ ] `npm run lint`, `npm run test:run` y `npm run build` pasan sin errores nuevos.

## Validación

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

## Referencias

- Mockup: `docs/mockups/vistaDoctor/hro_vista_doctor_movil.html`
- `frontend/src/modules/enfermeria/api/enfermeriaApi.js`
- `frontend/src/modules/tablero/pages/TableroPage.jsx`
- `frontend/src/shared/api/client.js`
- `backend/src/main/java/com/hro/system/medico/controller/MedicoController.java`
- `backend/src/main/java/com/hro/system/turno/controller/TurnoController.java`
