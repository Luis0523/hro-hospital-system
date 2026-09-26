# Colección Postman - Sistema Hospitalario HRO

En este directorio se encuentran los archivos para importar en Postman, Insomnia o Thunder Client para interactuar con el backend del Hospital Regional de Occidente:

## Archivos Disponibles

1. **`HRO_Hospital_System_API.postman_collection.json`**:
   - Colección oficial v2.2.0 con todos los endpoints clasificados por carpetas:
     - `00. Autenticación (Mock)` (Modo de autenticación y perfil simulado)
     - `01. Estación de Enfermería y Turnos` (Check-in, Colas, Llamados, Inasistencias, Reintegración, Cierre)
     - `02. Citas Médicas` (Agendamiento, Cálculo de Horas Estimadas, Reprogramación, Cancelación, Disponibilidad para reprogramación, Auditoría)
     - `03. Pacientes` (Admisión, Búsqueda por DPI, Consulta de Expedientes)
     - `04. Catálogos y Calendario` (Especialidades, Subespecialidades, Espacios físicos, Médicos, Programación, Feriados, filtros por estado y reactivación)
     - `05. Asignación Diaria (Jefe de Enfermería)` (Selección de subespecialidad por sala — upsert `PUT` y vista de salas; cobertura, cierre, duplicar y reasignación en caliente)
     - `06. Estación de Archivo (Expedientes Físicos)` (Ubicaciones, expedientes, consulta diaria de jornada, búsqueda por código, ciclos y transiciones, actas de recepción + PDF y resumen operativo + PDF)
     - `07. Panel de Administración (Usuarios, Roles y Permisos)` (Usuarios, roles, permisos por subespecialidad)
     - `08. Dashboard (Admin)` (Resumen administrativo con alertas)
     - `09. Reportes (Admin)` (Citas por estado, demanda por especialidad, utilización de cupos)
     - `10. Auditoría (Admin)` (Bitácora con filtros combinados y paginación; solo rol administrador)
2. **`HRO_Local_Environment.postman_environment.json`**:
   - Variables de entorno (`baseUrl`, `citaId`, `turnoId`, `pacienteId`, `dpiEjemplo`).
   - Variables del modelo V4 (`subespecialidadId`, `espacioFisicoId`, `asignacionId`, `medicoSubespecialidadId`).
   - Variables del módulo de Archivo (`expedienteId`, `numeroExpediente`, `expedienteCicloId`, `ubicacionArchivoId`).
   - Variables de autenticación simulada (`usuarioExterno`, `usuarioRol`, `usuarioNombre`).

## Identificadores UUID (modelo V5)

Desde la versión **1.2.0**, los identificadores de `paciente`, `medico`, `medico_subespecialidad`, `espacio_fisico`, `cupo_diario`, `orden_laboratorio`, `resultado_laboratorio` y `mensaje_hl7_log` son **UUID** (texto), no números. Las demás entidades (`cita`, `turno`, `asignacion_diaria_espacio`, `usuario_referencia`, etc.) mantienen id numérico.

- Las variables `pacienteId`, `medicoId`, `cupoDiarioId`, `espacioFisicoId`, `medicoSubespecialidadId`, `asignacionId` del entorno deben contener el UUID real (o el id numérico según corresponda).
- Copia los valores reales desde las respuestas de `GET /pacientes`, `GET /espacios-fisicos`, `GET /cupos`, etc.

## Módulo de Archivo (Expedientes Físicos)

La carpeta `06. Estación de Archivo (Expedientes Físicos)` cubre el ciclo de vida físico del expediente y las mejoras operativas de la épica **SCRUM-131** (backend **v1.5.0**, migraciones **V6** y **V9**):

- `ubicaciones-archivo` (catálogo), `expedientes` (objeto físico, PK UUID escaneable) y `expediente-ciclos` (un viaje por cita).
- Transiciones: `iniciar-busqueda`, `localizar`, `despachar`, `entregar`, `retornar`, `archivar`, `no-localizado`, `reintentar-busqueda`.
- **Consulta diaria de la jornada:** `GET /expedientes/jornada?fecha=&subespecialidadId=`.
- **Búsqueda por código:** `GET /expedientes/buscar?codigo=` (UUID/QR o número/barras).
- **Actas de recepción + PDF:** `POST/GET /actas-recepcion` y `GET /actas-recepcion/{id}/pdf`.
- **Resumen operativo diario + PDF:** `GET /archivo/resumen[/pdf]?fecha=`.

El contrato completo (entidades, estados y ejemplos de respuesta) está en [`docs/MODULO_ARCHIVO.md`](../MODULO_ARCHIVO.md) y la guía para el frontend en [`docs/ACTUALIZACION_ARCHIVO_FRONTEND.md`](../ACTUALIZACION_ARCHIVO_FRONTEND.md).

## Panel de Administración (backend v1.5.0)

Las carpetas `07`–`10` cubren el backend del Panel de Administración (épica SCRUM-109): usuarios/roles/permisos, dashboard, reportes y auditoría; además de los filtros por estado y la reactivación en catálogos, médicos y programación (carpeta `04`), y la disponibilidad para reprogramación (carpeta `02`).

- Contratos y guía de implementación para el frontend: [`docs/ACTUALIZACION_ADMIN_FRONTEND.md`](../ACTUALIZACION_ADMIN_FRONTEND.md).
- `GET /auditoria` exige rol `administrador` (otro rol → `403` `ACCESO_DENEGADO`).
- Requiere las migraciones **V7** (columna `activo` en `permiso_subespecialidad`) y **V8** (índices de auditoría).

## Autenticación simulada (Mock)
El backend aún no se conecta al servicio de autenticación externo del hospital. En su lugar, **la colección inyecta automáticamente** las cabeceras `X-Usuario-Id`, `X-Usuario-Rol` y `X-Usuario-Nombre` mediante un *pre-request script* a nivel de colección.

- Usuario por defecto: `admin-hro-01` (rol `administrador`).
- Para simular otra estación, cambia las variables del entorno:
  - Enfermería: `usuarioExterno = enfermeria-01`, `usuarioRol = enfermeria`
  - Ventanilla: `usuarioExterno = personal-citas-01`, `usuarioRol = personal_citas`
  - Médico: `usuarioExterno = medico-01`, `usuarioRol = medico`
  - Archivo: `usuarioExterno = archivo-01`, `usuarioRol = archivo`
- El campo `usuarioId` ya **no es obligatorio** en los cuerpos: si se omite, el backend usa la identidad simulada.

## Cómo Usarlo

1. Abre **Postman**.
2. Haz clic en **Import** (esquina superior izquierda).
3. Selecciona o arrastra ambos archivos (`.postman_collection.json` y `.postman_environment.json`).
4. Selecciona el entorno activo **"HRO Local Environment (Docker)"** en la esquina superior derecha de Postman.
5. ¡Listo! Todas las peticiones ya tienen las URLs, cuerpos JSON y parámetros configurados.

> **Swagger / OpenAPI Alternativo:**  
> Con el backend levantado, también pueden consultar la documentación interactiva en:  
> `http://localhost:8081/api/v1/swagger-ui/index.html` (o `http://localhost:8081/api/v1/v3/api-docs`).
