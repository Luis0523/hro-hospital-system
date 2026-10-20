# SCRUM-256 — Frontend: /seguimiento-enfermeria

- **Jira:** SCRUM-256
- **Responsable:** Fernanda López
- **Vencimiento:** 2026-10-21
- **Prioridad:** Highest
- **Sprint:** Sprint 3 - Archivo
- **Épica padre:** SCRUM-155
- **Rama sugerida:** `frontend-seguimiento-enfermeria`

## Contexto

La estación de enfermería ya tiene calendario/citas, registro de carnets y Mesa COEX.
Falta una pantalla operativa para **registrar y seguir los turnos/expedientes** a lo largo del día.
El mockup de referencia es:

`docs/mockups/registroySeguimiento/hro_estacion_enfermeria_prototipo.html`

## Objetivo

Implementar la pantalla `/seguimiento-enfermeria` con un libro digital por especialidad y
cinco etapas del proceso:

1. Registrado
2. Recibido
3. En clínica
4. Devuelto
5. Archivo

## Reglas generales

- Solo frontend. **No** tocar backend, base de datos, migraciones ni endpoints.
- **No** usar `localStorage` ni `sessionStorage` para el seguimiento.
- Los datos viven **en memoria**; al recargar se reinician.
- **No** crear endpoints nuevos ni inventar contratos.
- Usar el alias `@/` en imports cross-carpeta.
- Reutilizar el UI kit de `src/shared/components/ui/` (`Button`, `Input`, `Card`, `Modal`, `Alert`, `EmptyState`, `Spinner`, `Icon`, `Table`, `Toast`).
- No introducir librerías nuevas.
- No modificar la pantalla POS actual (`EnfermeriaPage`).
- Documentación y UI en español.

## Alcance

### Rutas y navegación

- Registrar la ruta privada `/seguimiento-enfermeria` en `frontend/src/router/AppRouter.jsx`,
  dentro del bloque del rol `enfermeria`.
- Agregar el ítem al submenú en `frontend/src/modules/enfermeria/seccionesEnfermeria.js`.
- Reutilizar `EnfermeriaEstacionLayout` / `AppShell`.
- La ruta debe quedar accesible sin selección de estación (`RequiereEstacion`) solo si el mockup
  no depende de estación; si depende, envolverla igual que `/enfermeria`.

### Estructura propuesta

```text
frontend/src/modules/enfermeria/
├── pages/
│   └── SeguimientoPage.jsx
├── components/
│   ├── LibroDigital.jsx
│   ├── DetalleTurnoSeguimiento.jsx
│   ├── TarjetasClinicas.jsx
│   ├── FiltrosEtapa.jsx
│   └── ResumenEtapas.jsx
└── api/
    └── seguimientoApi.js
```

### Modelo en memoria

```js
{
  id: 'ESP-01',              // correlativo visible, ej. "MI-01"
  especialidadId: '...',
  especialidadNombre: 'Medicina Interna',
  numero: 1,
  estado: 'registrado' | 'recibido' | 'en_clinica' | 'devuelto' | 'archivo',
  clinicaId: null | 1..5,
  clinicaNombre: null | 'Clínica 1',
  pacienteId: null,
  expediente: null,
  actualizadoEn: 'ISO-8601'
}
```

### `seguimientoApi.js`

Funciones mínimas:

- `listarSeguimiento()` → estado completo del día.
- `registrarTurno({ especialidadId, numero })`.
- `recibirTurno(id)`.
- `asignarClinica(id, clinicaId)`.
- `devolverClinica(id)`.
- `enviarArchivo(id)`.
- `reiniciarSeguimiento()` (útil para tests).

Cada función actualiza el arreglo en memoria y devuelve una copia para React.

### Flujo de UI

- Encabezado con fecha/jornada y badges de estado.
- Fila de resumen con contadores por etapa (`ResumenEtapas`).
- Libro por especialidad: una fila por especialidad y una grilla de correlativos.
- Buscador por especialidad o turno.
- Filtro por etapa (resalta y atenúa casillas).
- Selección de una casilla abre `DetalleTurnoSeguimiento` con:
  - correlativo y especialidad,
  - estado actual y etapa `n de 5`,
  - clínica asignada,
  - acción siguiente.
- Botón “Registrar turno” que selecciona el primer correlativo libre.
- Al llegar a `recibido`, la acción exige elegir una clínica en `TarjetasClinicas`.
- Tarjetas de clínicas 1–5 con conteo de expedientes y barra de ocupación.
- Al seleccionar una clínica ocupada se muestra un toast con el detalle (sin cambiar de etapa).
- `devolverClinica` y `enviarArchivo` completan el ciclo.
- Responsive:
  - escritorio: libro + panel de detalle en dos columnas,
  - móvil: libro con scroll horizontal y detalle debajo.

## Fuera de alcance

- WebSocket o sincronización multidispositivo.
- Integración real con carnets, COEX o Archivo.
- Persistencia real o endpoints.
- Lógica de negocio de backend.
- Cambios en `EnfermeriaPage`.

## Criterios de aceptación

- [ ] `/seguimiento-enfermeria` carga sin errores y aparece en el navbar de enfermería.
- [ ] Se registra un correlativo y se avanza por las 5 etapas.
- [ ] No se puede pasar a “En clínica” sin seleccionar clínica.
- [ ] Los contadores por etapa y por clínica se actualizan al instante.
- [ ] Recargar reinicia los datos mock.
- [ ] Funciona en desktop y móvil.
- [ ] `npm run lint`, `npm run test:run` y `npm run build` pasan sin errores nuevos.

## Validación

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

## Referencias

- Mockup: `docs/mockups/registroySeguimiento/hro_estacion_enfermeria_prototipo.html`
- Layout: `frontend/src/modules/enfermeria/components/EnfermeriaEstacionLayout.jsx`
- Submenú: `frontend/src/modules/enfermeria/seccionesEnfermeria.js`
- Rutas: `frontend/src/router/AppRouter.jsx`
- UI kit: `frontend/src/shared/components/ui/`
