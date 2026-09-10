# ADR 001: Selección del Stack Tecnológico y Arquitectura

* **Fecha**: 2026-09-10
* **Estado**: Aceptado

## Contexto
El sistema hospitalario requiere manejar alta concurrencia en la asignación de citas y turnos, comunicación en tiempo real para salas de espera, integración con sistemas de laboratorio mediante mensajería HL7 y persistencia robusta con auditoría detallada.

## Decisión
1. **Backend**: Java 17/21 + Spring Boot (Maven) + Spring Data JPA + WebSocket STOMP.
2. **Frontend**: React + TailwindCSS con vistas especializadas para las 4 estaciones (Enfermería, Archivo, Admin, Tablero TV).
3. **Base de Datos**: PostgreSQL versionado con Flyway.
4. **Infraestructura**: Docker y Docker Compose para orquestación de contenedores y CI/CD con GitHub Actions.

## Consecuencias
* Tipado estático y robustez transaccional en el backend.
* Soporte nativo para mensajería HL7 con librerías maduras (HAPI HL7).
* Facilidad de despliegue y pruebas reproducibles entre todos los integrantes del equipo.
