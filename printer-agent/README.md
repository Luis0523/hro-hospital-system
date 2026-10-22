# HRO Print Agent (MVP)

Servicio local para imprimir tickets ESC/POS en una impresora térmica USB de
80 mm **sin diálogos, sin PDF y sin elegir impresora**. El navegador le envía el
ticket por HTTP a `127.0.0.1` y el agente escribe los bytes RAW directamente al
spooler de Windows (usa el driver ya instalado).

## Requisitos

- Windows 10/11.
- Node.js 18 o superior (`node --version`).
- .NET Framework 4 (incluido en Windows) para compilar `RawPrint.exe` la primera vez.
- Impresora instalada y funcionando, por ejemplo `AON Printer`.

## Configuración

Opcional: copie `config.example.json` como `config.json` y ajuste:

```json
{
  "puerto": 17777,
  "impresora": "AON Printer",
  "columnas": 48,
  "corte": true,
  "token": "",
  "origen": "*"
}
```

También se puede configurar por variables de entorno:

| Variable | Por defecto | Descripción |
|---|---|---|
| `HRO_PRINT_PORT` | `17777` | Puerto local del agente |
| `HRO_PRINT_PRINTER` | `AON Printer` | Nombre exacto en Windows |
| `HRO_PRINT_COLUMNAS` | `48` | 48 para 80 mm (fuente A), 64 para fuente B |
| `HRO_PRINT_CORTE` | `true` | Envía el comando de corte |
| `HRO_PRINT_TOKEN` | vacío | Si se define, exige la cabecera `X-Print-Token` |

Para ver el nombre exacto de la impresora:

```powershell
Get-Printer | Select-Object Name, DriverName, PortName
```

## Ejecutar

```bat
iniciar.bat
```

o:

```powershell
node src\server.js
```

Debe mostrar:

```text
HRO Print Agent v0.1.0 escuchando en http://127.0.0.1:17777
Impresora: AON Printer | 48 columnas | corte: sí
```

## Probar

```powershell
Invoke-RestMethod http://127.0.0.1:17777/health

Invoke-RestMethod -Method Post http://127.0.0.1:17777/print -ContentType "application/json" -Body '{
  "turno": 1,
  "especialidad": "Medicina General",
  "clinica": "01"
}'
```

## API

- `GET /health` → estado del agente y de la impresora.
- `POST /print` → imprime un ticket.
- `POST /print/test` → imprime un ticket de prueba (turno 1 si no se envía).

Cuerpo de `POST /print`:

```json
{
  "turno": 42,
  "especialidad": "Pediatría",
  "clinica": "02",
  "fechaHora": "21/10/2026 14:35",
  "copias": 1
}
```

`fechaHora` es opcional; si falta, el agente usa la hora del servidor.

## Arranque automático (opcional)

Crear una tarea en el Programador de tareas de Windows:

- Desencadenador: **Al iniciar sesión**.
- Acción: iniciar `iniciar.bat` (o `node.exe` con `src\server.js`).
- Directorio de inicio: esta carpeta.

## Notas

- El agente escucha **solo** en `127.0.0.1`; no queda expuesto a la red.
- `RawPrint.exe` se compila automáticamente en `bin/` la primera ejecución.
- Si el ticket sale con símbolos raros, revise `columnas` y confirme que la
  impresora usa la página de códigos PC850 (el agente la configura al inicio).
- Si no hay cortador, ponga `"corte": false`.
