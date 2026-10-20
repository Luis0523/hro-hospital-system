# SCRUM-257 — Frontend: audios del tablero y nuevo anuncio

- **Jira:** SCRUM-257
- **Responsable:** Catherine Coti
- **Vencimiento:** 2026-10-21
- **Prioridad:** Highest
- **Sprint:** Sprint 3 - Archivo
- **Épica padre:** SCRUM-44
- **Rama sugerida:** `frontend-audios-tablero`

## Contexto

El tablero ya reproduce el llamado con `speechSynthesis` desde
`frontend/src/modules/tablero/api/comunicacionVoz.js`. Se reemplazará por audios grabados
para tener una voz institucional uniforme.

## Objetivo

Completar los audios faltantes y reproducir el anuncio:

> “Paciente número X, pasar a clínica Y.”

manteniendo `speechSynthesis` como respaldo.

## Audios

### Existentes

- `frontend/public/audio/tablero/generales/`
  - `paciente.mp3`
  - `pasara_a.mp3`
  - `pasar_a.mp3`
  - `siguientes_pacientes_clinica.mp3`
- `frontend/public/audio/tablero/numeros/`
  - `001.mp3` … `200.mp3`
  - `6a.mp3`, `6b.mp3`

### Faltantes por generar

Generales (`generales/`):

- `numero.mp3`
- `clinica.mp3`
- `buenos_dias.mp3`
- `buenas_tardes.mp3`
- `gracias_por_visitarnos.mp3`

Números (`numeros/`):

- `201.mp3` … `300.mp3`

### Formato

Mantener coherencia con los audios existentes:

- MP3, mono, 24 kHz, ~96 kbps.
- Misma voz, tono y volumen.
- Recortar silencios largos al final (ideal < 300 ms) para que el anuncio no tenga pausas raras.

Solo se generan los archivos; **no** se integran todavía “Buenos días”, “Buenas tardes” ni
“Gracias por visitarnos”.

## Alcance

- Crear `frontend/src/modules/tablero/api/audioTablero.js`.
- Precargar audios al activar la voz.
- Encadenar segmentos para el anuncio de `LLAMADO`.
- Integrar en `TableroPage` **solo** para el evento `LLAMADO`.
- Mantener la cola, repetición y “últimos llamados” existentes.
- Fallback a `speechSynthesis` si:
  - el navegador no permite autoplay,
  - falta un archivo,
  - falla la reproducción.

## API sugerida

```js
// audioTablero.js
export function precargarAudioTablero()
export function estaDisponibleAudioTablero()
export function reproducirLlamado({ turno, clinicaNumero, onEnd, onError })
export function detenerAudioTablero()
```

`reproducirLlamado` arma la secuencia:

1. `paciente.mp3`
2. `numero.mp3`
3. `numeros/{turno}.mp3`
4. `pasar_a.mp3`
5. `clinica.mp3`
6. `numeros/{clinica}.mp3`

Si `turno` es mayor a 300, no existe audio: usar `speechSynthesis` solo para ese llamado.

## Integración en `TableroPage`

- En `iniciarSiguiente` / `reproducir`, usar `reproducirLlamado` en lugar de `anunciarTurno`.
- Conservar `anunciarTurno` como fallback.
- En `ControlVoz`, al activar la voz, llamar `precargarAudioTablero()`.
- `vozActiva` debe ser requisito para reproducir audio, igual que hoy.
- No reproducir al cerrar sesión ni al desmontar.

## Fuera de alcance

- Integrar saludos/despedidas.
- Cambiar la lógica de cola, WebSocket o simulación.
- Cambiar el texto del `LlamadoGrande`.
- Backend.

## Criterios de aceptación

- [ ] Al llamar un turno se escucha “Paciente número X, pasar a clínica Y.”
- [ ] Ya no se usa la frase “Turno número… consultorio…”.
- [ ] Los archivos faltantes existen con nombres exactos.
- [ ] Si falta un MP3 o falla, suena el fallback `speechSynthesis`.
- [ ] La voz se precarga al activarla y la primera reproducción no se corta.
- [ ] No se rompe la cola, la repetición ni los últimos llamados.
- [ ] `npm run lint`, `npm run test:run` y `npm run build` pasan sin errores nuevos.

## Pruebas sugeridas

- Prueba unitaria de `audioTablero.js` con `Audio` mockeado:
  - arma la secuencia correcta,
  - llama `onEnd`,
  - cae al fallback si falta un archivo.
- Verificar que `TableroPage` siga reproduciendo dos veces cuando la voz está activa.

## Validación

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

## Referencias

- `frontend/src/modules/tablero/pages/TableroPage.jsx`
- `frontend/src/modules/tablero/api/comunicacionVoz.js`
- `frontend/src/modules/tablero/components/ControlVoz.jsx`
- `frontend/public/audio/tablero/`
