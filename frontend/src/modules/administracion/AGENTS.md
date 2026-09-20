\# AGENTS.md — Panel de Administración HRO



\## Contexto



Este módulo pertenece al sistema web hospitalario del Hospital Regional de Occidente (HRO).



Rama de trabajo:



`frontend-administrador`



El trabajo de esta rama corresponde exclusivamente al FRONTEND del Panel de Administración.



\## Área principal de trabajo



La implementación propia del módulo debe permanecer en:



`frontend/src/modules/administracion/`



Única modificación cross-module prevista:



`frontend/src/router/AppRouter.jsx`



para registrar las rutas del Panel de Administración.



Antes de modificar cualquier otro archivo fuera del módulo, justificar la necesidad y solicitar autorización.



\---



\## Restricciones de alcance



NO modificar:



\- `frontend/src/modules/enfermeria/`

\- `frontend/src/modules/archivo/`

\- `frontend/src/modules/tablero/`



NO modificar `frontend/src/shared/` salvo necesidad técnica real y previamente autorizada.



NO modificar backend ni base de datos.



NO crear un proyecto React nuevo.



NO introducir una nueva biblioteca de estilos.



NO crear una segunda instancia de Axios.



NO agregar WebSocket al Panel de Administración.



NO inventar endpoints del backend.



NO implementar en frontend reglas de negocio que correspondan al backend.



NO hacer commit ni push salvo instrucción explícita del usuario.



\---



\## Stack del frontend



Seguir el stack existente del repositorio:



\- React 18

\- Vite 5

\- JavaScript / JSX

\- React Router 6

\- TailwindCSS 3

\- Axios mediante `src/shared/api/client.js`

\- Vitest

\- React Testing Library



Usar el alias:



`@/`



para imports entre carpetas cuando corresponda.



\---



\## Componentes compartidos



Antes de crear componentes básicos nuevos, revisar:



`frontend/src/shared/components/ui/`



Reutilizar cuando corresponda:



\- Button

\- Input

\- Select

\- Card

\- EstadoBadge

\- Modal

\- Alert

\- EmptyState

\- Spinner

\- Table

\- Icon

\- Toast



Para autenticación y mensajes revisar:



\- `shared/context/AuthContext.jsx`

\- `shared/context/ToastContext.jsx`



Para HTTP utilizar exclusivamente:



`shared/api/client.js`



\---



\## Estructura esperada del módulo



Mantener una estructura equivalente a:



frontend/src/modules/administracion/

├── pages/

├── components/

├── api/

│   ├── administracionApi.js

│   └── mockData.js

└── hooks/



Crear carpetas únicamente cuando sean necesarias.



No generar abstracciones prematuras.



\---



\## Navegación interna



El Panel de Administración requiere navegación propia.



Rutas previstas:



\- `/administracion`

\- `/administracion/usuarios`

\- `/administracion/clinicas`

\- `/administracion/cupos`

\- `/administracion/calendario`

\- `/administracion/reportes`

\- `/administracion/auditoria`



No debe existir desde este panel navegación visible hacia Enfermería, Archivo o Tablero de Turnos.



\---



\## Secciones funcionales



\### Dashboard



Resumen general.



Puede mostrar:



\- citas del día;

\- cupos disponibles;

\- inasistencias;

\- alertas administrativas.



No duplicar tablas completas de otras secciones.



\### Usuarios y roles



Administrar usuarios locales provenientes del proveedor externo de autenticación.



El frontend NO administra contraseñas ni credenciales.



Debe contemplar:



\- listado;

\- activación/desactivación;

\- roles locales;

\- permisos por clínica.



\### Clínicas



Mantener la jerarquía:



Especialidad

→ Subespecialidad

→ Clínica



No aplanar esta relación.



También deberá contemplarse la asociación entre médicos y clínicas según el contrato definitivo del backend.



\### Cupos y capacidad



La interfaz configura parámetros.



El frontend NO calcula disponibilidad real ni genera `cupo\_diario`.



Esas reglas pertenecen al backend.



\### Calendario institucional



Administrar días no laborables.



Ante un conflicto de citas:



1\. enviar solicitud;

2\. mostrar el resultado devuelto por backend;

3\. solicitar confirmación explícita;

4\. reenviar con opción de forzar si el contrato lo permite.



El frontend NO determina por sí mismo si existen conflictos.



\### Reportes



Mostrar resultados calculados por backend.



Como mínimo contemplar:



\- citas programadas;

\- atendidas;

\- canceladas;

\- reprogramadas;

\- inasistencias;

\- demanda por especialidad/subespecialidad;

\- utilización de cupos.



Filtros mínimos:



\- rango de fechas;

\- clínica cuando aplique.



No calcular reportes agregados en frontend.



\### Auditoría



Vista exclusivamente de lectura.



Filtros previstos:



\- usuario;

\- fecha;

\- tipo de acción.



No editar ni eliminar registros de auditoría.



\---



\## API y mocks



Utilizar:



`shared/api/client.js`



No importar Axios directamente dentro del módulo.



Mientras los endpoints definitivos no estén disponibles, utilizar mocks claramente identificados.



Debe poder alternarse mediante el mecanismo existente de:



`VITE\_USE\_MOCK`



No inventar un contrato definitivo de backend.



Si falta un endpoint:



1\. utilizar mock;

2\. documentar el contrato esperado;

3\. marcarlo como pendiente de coordinación con backend.



\---



\## Responsive



Todas las secciones deben ser utilizables tanto en:



\- computadora;

\- teléfono.



Las tablas extensas deben adaptarse de forma razonable a pantallas pequeñas.



No sacrificar funcionalidad esencial en móvil.



\---



\## Flujo de trabajo



Para cada fase:



1\. analizar;

2\. proponer plan;

3\. esperar aprobación cuando la tarea sea significativa;

4\. implementar;

5\. revisar `git diff`;

6\. ejecutar pruebas relevantes;

7\. ejecutar lint;

8\. ejecutar build cuando la fase lo amerite;

9\. corregir errores antes de continuar.



No implementar varias fases grandes simultáneamente.



\---



\## Comandos de validación



Ejecutar desde `frontend/`:



`npm run test:run`



`npm run lint`



`npm run format:check`



`npm run build`



No considerar terminada una fase si introduce errores nuevos.



\---



\## Prioridad de fuentes



Cuando existan contradicciones, utilizar este orden:



1\. requerimientos específicos del Panel de Administración proporcionados por el equipo;

2\. estado real del repositorio en `frontend-administrador`;

3\. contratos backend confirmados en documentación/Postman/Swagger;

4\. mockups visuales;

5\. supuestos del agente.



Nunca convertir un supuesto en requisito sin indicarlo.



\---



\## Regla fundamental



El Panel de Administración:



SOLICITA datos,

MUESTRA información,

EDITA configuración,

y REFLEJA decisiones del backend.



No replica lógica de negocio del servidor.

