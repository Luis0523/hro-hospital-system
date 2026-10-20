# SCRUM-259 — Frontend: gestión de médicos en Jefe de Enfermería

- **Jira:** SCRUM-259
- **Responsable:** Luis Rolando Colop Tzoc
- **Vencimiento:** 2026-10-21
- **Prioridad:** Highest
- **Sprint:** Sprint 3 - Archivo
- **Épica padre:** SCRUM-165
- **Rama sugerida:** `frontend-jefe-medicos`

## Contexto

El CRUD de médicos ya existe en el Panel de Administración:

- `frontend/src/modules/administracion/components/MedicosTab.jsx`
- `frontend/src/modules/administracion/components/MedicoForm.jsx`
- `frontend/src/modules/administracion/hooks/useGestionCatalogo.js`
- `frontend/src/modules/administracion/api/administracionApi.js`

El Jefe de Enfermería necesita gestionar médicos desde su propia área sin duplicar lógica.

## Objetivo

Agregar la gestión de médicos al área `/jefe-enfermeria` reutilizando el CRUD administrativo,
con nombre y número de colegiado.

## Alcance

- Crear la página en `frontend/src/modules/jefeEnfermeria/pages/`.
- Registrar la ruta `/jefe-enfermeria/medicos` dentro de `JefeEnfermeriaLayout`.
- Agregar el ítem al `MenuLateralJefe`.
- Reutilizar `MedicosTab`, `MedicoForm`, `useGestionCatalogo` y `administracionApi`.
- Mantener el alta con nombre y colegiado.
- Mantener la baja lógica existente.
- No duplicar formularios, hooks ni llamadas de API.
- No modificar el comportamiento actual de `/administracion` salvo que sea estrictamente necesario.

## Estructura propuesta

```text
frontend/src/modules/jefeEnfermeria/
├── pages/
│   └── MedicosPage.jsx
└── components/
    └── MenuLateralJefe.jsx   // agregar ítem
```

`MedicosPage.jsx` debe ser una envoltura simple:

```jsx
import MedicosTab from '@/modules/administracion/components/MedicosTab.jsx'

export default function MedicosPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Médicos</h1>
        <p className="text-sm text-on-surface-variant">
          Alta, edición y baja lógica de médicos especialistas.
        </p>
      </header>
      <MedicosTab />
    </section>
  )
}
```

## Ruta y menú

En `AppRouter.jsx`:

```jsx
<Route path="medicos" element={<MedicosPage />} />
```

En `MenuLateralJefe`:

```js
{ to: '/jefe-enfermeria/medicos', etiqueta: 'Médicos', icono: 'stethoscope' }
```

Verificar que el icono exista en el componente `Icon`; si no, usar uno disponible como
`medical_services` o `badge`.

## Reglas

- No crear una segunda instancia de Axios.
- No crear un `administracionApi.js` alterno.
- No modificar backend/BD.
- Mantener el estilo visual del área Jefe (`bg-surface`, `text-on-surface`, etc.).
- El área Jefe no debe depender de `AuthContext` nuevo ni de roles no existentes.
- No eliminar la sección de médicos de `/administracion` sin confirmación explícita.

## Criterios de aceptación

- [ ] `/jefe-enfermeria/medicos` carga y aparece en el menú.
- [ ] Se listan médicos.
- [ ] Se crea un médico con nombre y colegiado.
- [ ] Se edita un médico.
- [ ] Se desactiva (baja lógica) un médico.
- [ ] Se muestran errores de validación y de API con los componentes existentes.
- [ ] Funciona en desktop y móvil.
- [ ] No se rompe `/administracion`.
- [ ] `npm run lint`, `npm run test:run` y `npm run build` pasan sin errores nuevos.

## Validación

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

## Referencias

- `frontend/src/modules/jefeEnfermeria/JefeEnfermeriaLayout.jsx`
- `frontend/src/modules/jefeEnfermeria/components/MenuLateralJefe.jsx`
- `frontend/src/modules/administracion/components/MedicosTab.jsx`
- `frontend/src/modules/administracion/components/MedicoForm.jsx`
- `frontend/src/modules/administracion/api/administracionApi.js`
- `frontend/src/router/AppRouter.jsx`
