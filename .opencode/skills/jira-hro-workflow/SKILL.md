---
name: jira-hro-workflow
description: Flujo de trabajo con Jira (MCP Atlassian) para el proyecto SCRUM del HRO. Úsala para consultar tareas, moverlas de estado (Por hacer, En curso, En revisión, Bloqueado, Finalizado) o crear tareas/subtareas antes de trabajar. Actívala cuando el usuario mencione Jira, tickets, tareas, épica SCRUM-109, o pida registrar/actualizar avance de trabajo.
---

# Workflow Jira — HRO (proyecto SCRUM)

Integración vía MCP `atlassian` (remoto, OAuth 2.1), ya configurado globalmente en
`~/.config/opencode/opencode.jsonc`. Los tools se exponen como `atlassian_*`.
Si no aparecen, reiniciar opencode. Guía extendida local: `context/jira-workflow.md`.

## Datos fijos (usar siempre)

| Dato | Valor |
|---|---|
| `cloudId` | `fe904de8-d012-4568-a58c-a17d7998f5b7` |
| Sitio | https://luiscolop90.atlassian.net |
| Proyecto | `SCRUM` (HRO - FINAL) |
| Board / sprint activo | `1` / id `1` ("Sprint 2 – Frontend funcional") |
| Mi accountId | `5f4e6779d0884f00492c57f0` |
| Épica backend admin | `SCRUM-109` |

**Tipos:** `Epic`, `Historia` (Story), `Tarea`, `Revisión`, `Subtask`.
**Estados:** `Por hacer` → `En curso` → `En revisión` → `Finalizado` (+ `Bloqueado`).

## Reglas (evitar saturar de tareas)

- **SÍ** crear/mover tarea: funcionalidad nueva, bug relevante, cambio de contrato de
  API / esquema BD / flujo entre estaciones, o trabajo de varias sesiones.
- **NO** crear tarea: typos, formato, renombres, refactors menores, config local,
  o correcciones dentro de una tarea ya abierta.
- **Antes de trabajar**: buscar si ya existe la tarea. Si existe → mover a **En curso**.
  Si no existe y aplica → crearla **antes**. Al terminar → **En revisión** (o **Finalizado** si fue trivial).
- No crear tareas sin confirmar con el usuario el título y a qué épica/historia padre cuelga.

## Operaciones MCP

Pasar siempre `cloudId`.

- **Buscar** (`atlassian_searchJiraIssuesUsingJql`):
  - `parent = SCRUM-109 ORDER BY key ASC` (hijas de la épica)
  - `project = SCRUM AND statusCategory != Done ORDER BY priority DESC`
  - `project = SCRUM AND summary ~ "texto" ORDER BY created DESC` (¿ya existe?)
  - `project = SCRUM AND assignee = currentUser() AND status = "En curso"`
  - `fields`: `["summary","status","issuetype","assignee","priority","parent"]`
- **Ver** (`atlassian_getJiraIssue`): `{ "issueIdOrKey": "SCRUM-110" }`.
- **Mover**: primero `atlassian_executeRead` → `listJiraIssueTransitions`
  `inputs:{ "issueIdOrKey": "..." }` para obtener el `transitionId` válido **del estado actual**;
  luego `atlassian_transitionJiraIssue` `{ "issueIdOrKey":"...", "transitionId":"..." }`.
  Referencia observada (Historias): En curso `3`, Por hacer `11`, En revisión `31`, Bloqueado `2`.
  **No confiar ciegamente**: consultar transiciones del issue antes de mover.
- **Crear** (`atlassian_createJiraIssue`): `projectKey:"SCRUM"`, `issueType:"Historia"`,
  `summary`, `description` (markdown), `parent:"SCRUM-109"` (épica o historia padre),
  `priority` (`Highest`/`High`/`Medium`/`Low`/`Lowest`), `assignee` (accountId).
  Subtareas: `issueType:"Subtask"` + `parent` = historia padre.
- **Comentar** (`atlassian_addOrEditJiraIssueComment`): `{ cloudId, issueIdOrKey, commentBody }`.

## Flujo "voy a trabajar en X"

1. Buscar por texto si ya existe la tarea.
2. Decidir: mover a **En curso** o crear (previa confirmación) bajo la épica/historia correcta.
3. Trabajar el código.
4. Cerrar: mover a **En revisión** y comentar qué se hizo (y commit/PR si aplica).

## Épica SCRUM-109 (referencia)

Historias: `SCRUM-110` catálogos · `SCRUM-113` médicos/programación · `SCRUM-117` usuarios/roles ·
`SCRUM-118` calendario · `SCRUM-119` disponibilidad · `SCRUM-120` dashboard · `SCRUM-121` reportes ·
`SCRUM-122` auditoría. Subtasks: `SCRUM-111`, `SCRUM-112`, `SCRUM-114`–`SCRUM-116`, `SCRUM-123`–`SCRUM-130`.
