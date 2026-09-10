# Backend - Sistema Hospitalario HRO

Servicio API REST y WebSocket desarrollado con **Java 17/21**, **Spring Boot** y gestionado con **Maven**.

### Módulos Principales:
* **API REST**: Endpoints para gestión de pacientes, citas, médicos, clínicas y auditoría.
* **Persistencia**: Spring Data JPA + PostgreSQL con migraciones versionadas por Flyway.
* **WebSocket (STOMP)**: Notificaciones y avance de turnos en tiempo real.
* **Integración HL7**: Conector de mensajería para órdenes y resultados de laboratorio (Roche).
* **Seguridad**: Spring Security con validación de tokens externos y JIT provisioning en tabla `usuario_referencia`.
