# Sistema Hospitalario HRO (Gestión de Citas, Agendas y Turnos)

Sistema web para optimización de citas médicas, administración de cupos, gestión de colas de espera en tiempo real e integración con laboratorio (HL7) para consulta externa.

---

## 🏗️ Estructura del Proyecto

```text
hro-hospital-system/
│
├── frontend/                 # Aplicación cliente (React) para las 4 estaciones
├── backend/                  # API REST, reglas de negocio y WebSocket (Java + Spring Boot + Maven)
├── database/                 # Modelado, migraciones (Flyway) y datos de prueba (PostgreSQL)
│   ├── migrations/           # Scripts DDL versionados para Flyway (V1__init.sql, etc.)
│   └── seeds/                # Datos iniciales para pruebas y catálogos
├── docker/                   # Configuraciones de contenedores (Dockerfiles por servicio)
│   ├── backend/              # Dockerfile para Spring Boot (Eclipse Temurin JDK)
│   ├── frontend/             # Dockerfile para React / Nginx
│   └── nginx/                # Configuración de proxy inverso
├── docs/                     # Documentación técnica, diagramas (ERD), HL7, mockups y ADRs
│   ├── adrs/                 # Registros de decisiones arquitectónicas (ADRs)
│   ├── diagrams/             # Diagramas ERD, estados de cita y flujos
│   ├── hl7/                  # Especificación técnica de integración con laboratorio
│   ├── mockups/              # Mockups e interfaces de usuario
│   └── data-dictionary/      # Diccionario de datos
├── .github/
│   └── workflows/            # Pipelines de CI/CD para frontend y backend
│
├── .env.example              # Plantilla de variables de entorno globales
├── docker-compose.yml        # Orquestación de servicios (frontend, backend, postgres, redis)
├── .gitignore                # Reglas de exclusión de Git
└── README.md                 # Documento principal de inicio rápido
```

---

## 💻 Stack Tecnológico

* **Frontend**: React, TailwindCSS, WebSocket STOMP / SockJS client.
  * *Estaciones*: Enfermería (Desktop), Archivo (Mobile), Administración (Desktop/Mobile), Tablero de Turnos (Smart TV / Pantalla completa).
* **Backend**: Java 17/21, Spring Boot, Spring Data JPA, Spring Security, Spring WebSocket (STOMP), HAPI HL7, Maven.
* **Base de Datos**: PostgreSQL 15+ administrada con Flyway.
* **Tiempo Real y Caché**: WebSocket STOMP + Redis.
* **Infraestructura**: Docker y Docker Compose.

---

## 🚀 Puesta en Marcha Rápida (Local)

1. Copiar las variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Levantar la infraestructura con Docker Compose:
   ```bash
   docker-compose up -d
   ```
