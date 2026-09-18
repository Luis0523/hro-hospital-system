# Colección Postman - Sistema Hospitalario HRO

En este directorio se encuentran los archivos para importar en Postman, Insomnia o Thunder Client para interactuar con el backend del Hospital Regional de Occidente:

## Archivos Disponibles

1. **`HRO_Hospital_System_API.postman_collection.json`**:
   - Colección oficial v2.1.0 con todos los endpoints clasificados por carpetas:
     - `00. Autenticación (Mock)` (Modo de autenticación y perfil simulado)
     - `01. Estación de Enfermería y Turnos` (Check-in, Colas, Llamados, Inasistencias, Reintegración, Cierre)
     - `02. Citas Médicas` (Agendamiento, Cálculo de Horas Estimadas, Reprogramación, Cancelación, Auditoría)
     - `03. Pacientes` (Admisión, Búsqueda por DPI, Consulta de Expedientes)
     - `04. Catálogos y Calendario` (Especialidades, Subespecialidades, Espacios físicos, Médicos, Feriados)
     - `05. Asignación Diaria (Jefe de Enfermería)` (Asignar sala por día, cobertura, cierre, duplicar y reasignación en caliente)
2. **`HRO_Local_Environment.postman_environment.json`**:
   - Variables de entorno (`baseUrl`, `clinicaId`, `citaId`, `turnoId`, `pacienteId`, `dpiEjemplo`).
   - Variables de autenticación simulada (`usuarioExterno`, `usuarioRol`, `usuarioNombre`).

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
