# Colección Postman - Sistema Hospitalario HRO

En este directorio se encuentran los archivos para importar en Postman, Insomnia o Thunder Client para interactuar con el backend del Hospital Regional de Occidente:

## Archivos Disponibles

1. **`HRO_Hospital_System_API.postman_collection.json`**:
   - Colección oficial v2.1.0 con todos los endpoints clasificados por carpetas:
     - `01. Estación de Enfermería y Turnos` (Check-in, Colas, Llamados, Inasistencias, Reintegración, Cierre)
     - `02. Citas Médicas` (Agendamiento, Cálculo de Horas Estimadas, Reprogramación, Cancelación, Auditoría)
     - `03. Pacientes` (Admisión, Búsqueda por DPI, Consulta de Expedientes)
     - `04. Catálogos y Calendario` (Especialidades, Clínicas, Médicos, Feriados)
2. **`HRO_Local_Environment.postman_environment.json`**:
   - Variables de entorno (`baseUrl`, `usuarioId`, `clinicaId`, `citaId`, `turnoId`, `pacienteId`, `dpiEjemplo`).

## Cómo Usarlo

1. Abre **Postman**.
2. Haz clic en **Import** (esquina superior izquierda).
3. Selecciona o arrastra ambos archivos (`.postman_collection.json` y `.postman_environment.json`).
4. Selecciona el entorno activo **"HRO Local Environment (Docker)"** en la esquina superior derecha de Postman.
5. ¡Listo! Todas las peticiones ya tienen las URLs, cuerpos JSON y parámetros configurados.

> **Swagger / OpenAPI Alternativo:**  
> Con el backend levantado, también pueden consultar la documentación interactiva en:  
> `http://localhost:8081/api/v1/swagger-ui/index.html` (o `http://localhost:8081/api/v1/v3/api-docs`).
