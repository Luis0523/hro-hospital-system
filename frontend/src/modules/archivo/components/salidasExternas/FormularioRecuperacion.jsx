import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Alert, Button, Icon, Input, Modal } from '@/shared/components/ui'
import { esFechaIsoValida, instanteDesdeFechaHoraGuatemala } from '../../utils/fechaGuatemala'

// Captura con máscara: la fecha se muestra DD/MM/AAAA y la hora HH:mm, pero el
// formulario entrega a la API `YYYY-MM-DD` y `HH:mm` respectivamente.
const PATRON_FECHA_CAPTURA = /^(\d{2})\/(\d{2})\/(\d{4})$/
const PATRON_HORA_CAPTURA = /^([01]\d|2[0-3]):([0-5]\d)$/

function soloDigitos(valor, maximo) {
  return String(valor ?? '')
    .replace(/\D/g, '')
    .slice(0, maximo)
}

function contarDigitos(texto) {
  let total = 0
  for (const caracter of String(texto)) {
    if (caracter >= '0' && caracter <= '9') total += 1
  }
  return total
}

function posicionParaDigitos(texto, cantidad) {
  if (cantidad <= 0) return 0

  let vistos = 0
  for (let indice = 0; indice < texto.length; indice += 1) {
    const caracter = texto[indice]
    if (caracter >= '0' && caracter <= '9') {
      vistos += 1
      if (vistos === cantidad) return indice + 1
    }
  }
  return texto.length
}

function formatearFechaCaptura(valor) {
  const digitos = soloDigitos(valor, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

function formatearHoraCaptura(valor) {
  const digitos = soloDigitos(valor, 4)
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`
}

/** Acepta pegar una fecha ISO (AAAA-MM-DD) y la reordena para la máscara. */
function extraerFechaDesdeTexto(texto) {
  const valor = String(texto ?? '').trim()
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(valor)
  if (iso) return `${iso[3].padStart(2, '0')}${iso[2].padStart(2, '0')}${iso[1]}`
  return valor
}

/** Acepta pegar "9:30" y lo normaliza a "0930" para la máscara. */
function extraerHoraDesdeTexto(texto) {
  const valor = String(texto ?? '').trim()
  const partes = valor.split(':')
  if (partes.length === 2 && /^\d{1,2}$/.test(partes[0]) && /^\d{1,2}$/.test(partes[1])) {
    return `${partes[0].padStart(2, '0')}${partes[1].padStart(2, '0')}`
  }
  return valor
}

/** DD/MM/AAAA → YYYY-MM-DD validando que la fecha exista en el calendario. */
function fechaCapturaAIso(texto) {
  const coincidencia = PATRON_FECHA_CAPTURA.exec(String(texto ?? '').trim())
  if (!coincidencia) return null

  const iso = `${coincidencia[3]}-${coincidencia[2]}-${coincidencia[1]}`
  return esFechaIsoValida(iso) ? iso : null
}

/**
 * Recuperación manual de un préstamo pendiente desde un reporte impreso.
 * Contingencia para cuando la sesión se perdió (el mock no persiste).
 * Se presenta como modal y no registra devoluciones.
 */
export default function FormularioRecuperacion({
  abierto = false,
  onCerrar,
  onRecuperar,
  recuperando = false,
  error = null,
}) {
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [personaRetira, setPersonaRetira] = useState('')
  const [motivo, setMotivo] = useState('')
  const [fechaTexto, setFechaTexto] = useState('')
  const [horaTexto, setHoraTexto] = useState('')
  const [errorLocal, setErrorLocal] = useState(null)

  const expedienteRef = useRef(null)
  const fechaRef = useRef(null)
  const horaRef = useRef(null)
  // Posición pendiente del cursor tras reformatear la entrada.
  const caretRef = useRef({ campo: null, posicion: null })

  function limpiar() {
    setNumeroExpediente('')
    setPersonaRetira('')
    setMotivo('')
    setFechaTexto('')
    setHoraTexto('')
    setErrorLocal(null)
  }

  // Al abrir: formulario limpio y foco en el expediente.
  useEffect(() => {
    if (!abierto) return
    limpiar()
    const temporizador = setTimeout(() => expedienteRef.current?.focus(), 0)
    return () => clearTimeout(temporizador)
  }, [abierto])

  // Reposiciona el cursor tras la máscara para no interrumpir la edición.
  useLayoutEffect(() => {
    const { campo, posicion } = caretRef.current
    if (!campo || posicion == null) return

    const input = campo === 'fecha' ? fechaRef.current : horaRef.current
    if (input) input.setSelectionRange(posicion, posicion)
    caretRef.current = { campo: null, posicion: null }
  })

  function cerrar() {
    if (recuperando) return
    limpiar()
    onCerrar?.()
  }

  function escribirFecha(crudo, posicionEnCrudo) {
    const digitosAntes = contarDigitos(String(crudo).slice(0, posicionEnCrudo))
    const formateado = formatearFechaCaptura(crudo)

    setFechaTexto(formateado)
    setErrorLocal(null)
    caretRef.current = { campo: 'fecha', posicion: posicionParaDigitos(formateado, digitosAntes) }
  }

  function escribirHora(crudo, posicionEnCrudo) {
    const digitosAntes = contarDigitos(String(crudo).slice(0, posicionEnCrudo))
    const formateado = formatearHoraCaptura(crudo)

    setHoraTexto(formateado)
    setErrorLocal(null)
    caretRef.current = { campo: 'hora', posicion: posicionParaDigitos(formateado, digitosAntes) }
  }

  function manejarCambioFecha(evento) {
    const input = evento.currentTarget
    const crudo = input.value
    const posicion = input.selectionStart ?? crudo.length
    const esIso = /^\d{4}-\d{1,2}-\d{1,2}$/.test(crudo.trim())

    escribirFecha(extraerFechaDesdeTexto(crudo), esIso ? 8 : posicion)
  }

  function manejarCambioHora(evento) {
    const input = evento.currentTarget
    const crudo = input.value
    const posicion = input.selectionStart ?? crudo.length
    const normalizada = extraerHoraDesdeTexto(crudo)
    const esConSeparador = normalizada !== crudo.trim()

    escribirHora(normalizada, esConSeparador ? normalizada.length : posicion)
  }

  // Backspace/Delete sobre el separador debe borrar un dígito, no quedarse
  // atascado reinsertando la barra o los dos puntos.
  function manejarTeclaFecha(evento) {
    const input = evento.currentTarget
    const inicio = input.selectionStart ?? 0
    const fin = input.selectionEnd ?? 0
    if (inicio !== fin) return

    if (evento.key === 'Backspace' && inicio > 0 && input.value[inicio - 1] === '/') {
      evento.preventDefault()
      const crudo = input.value.slice(0, inicio - 2) + input.value.slice(inicio)
      escribirFecha(crudo, Math.max(0, inicio - 2))
      return
    }

    if (evento.key === 'Delete' && input.value[inicio] === '/') {
      evento.preventDefault()
      const crudo = input.value.slice(0, inicio) + input.value.slice(inicio + 2)
      escribirFecha(crudo, inicio)
    }
  }

  function manejarTeclaHora(evento) {
    const input = evento.currentTarget
    const inicio = input.selectionStart ?? 0
    const fin = input.selectionEnd ?? 0
    if (inicio !== fin) return

    if (evento.key === 'Backspace' && inicio > 0 && input.value[inicio - 1] === ':') {
      evento.preventDefault()
      const crudo = input.value.slice(0, inicio - 2) + input.value.slice(inicio)
      escribirHora(crudo, Math.max(0, inicio - 2))
      return
    }

    if (evento.key === 'Delete' && input.value[inicio] === ':') {
      evento.preventDefault()
      const crudo = input.value.slice(0, inicio) + input.value.slice(inicio + 2)
      escribirHora(crudo, inicio)
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (recuperando) return

    if (!numeroExpediente.trim() || !personaRetira.trim() || !motivo.trim()) {
      setErrorLocal('Complete el expediente, la persona y el motivo del préstamo.')
      expedienteRef.current?.focus()
      return
    }

    if (!fechaTexto) {
      setErrorLocal('Indique la fecha original de salida (DD/MM/AAAA).')
      fechaRef.current?.focus()
      return
    }

    const fechaIso = fechaCapturaAIso(fechaTexto)
    if (!fechaIso) {
      setErrorLocal('La fecha original no es válida. Use DD/MM/AAAA, por ejemplo 01/11/2026.')
      fechaRef.current?.focus()
      return
    }

    if (!horaTexto) {
      setErrorLocal('Indique la hora original de salida (HH:mm).')
      horaRef.current?.focus()
      return
    }

    if (!PATRON_HORA_CAPTURA.test(horaTexto)) {
      setErrorLocal(
        'La hora original no es válida. Use HH:mm en formato de 24 horas (00:00–23:59).',
      )
      horaRef.current?.focus()
      return
    }

    const instante = instanteDesdeFechaHoraGuatemala(fechaIso, horaTexto)
    if (!instante) {
      setErrorLocal('La fecha u hora original no es válida.')
      return
    }

    if (instante.getTime() > Date.now()) {
      setErrorLocal(
        'La fecha y la hora originales no pueden ser posteriores al momento de la recuperación.',
      )
      fechaRef.current?.focus()
      return
    }

    setErrorLocal(null)
    const creado = await onRecuperar({
      numeroExpediente,
      personaRetira,
      motivo,
      fechaSalida: fechaIso,
      horaSalida: horaTexto,
    })

    // El mensaje de éxito lo muestra la página; aquí solo se cierra.
    if (creado) {
      limpiar()
      onCerrar?.()
    }
  }

  return (
    <Modal open={abierto} onClose={cerrar} title="Recuperar préstamo pendiente" size="md">
      {/* Altura limitada al viewport (incluido el teclado virtual en móvil) y
          scroll vertical propio; el título del modal queda fijo arriba. */}
      <div
        data-testid="recuperacion-scroll"
        className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain pr-1"
      >
        <p className="text-body-sm text-on-surface-variant">
          Utilice esta opción únicamente para volver a registrar un expediente que figura como
          pendiente en un reporte anterior. La fecha y la hora deben ser las originales del
          préstamo.
        </p>

        <form onSubmit={manejarEnvio} className="mt-4 space-y-3" noValidate aria-busy={recuperando}>
          <div>
            <div className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              <Icon name="badge" className="text-[18px] text-primary" />
              <label htmlFor="recuperacion-expediente">Número de expediente a recuperar</label>
            </div>
            <input
              id="recuperacion-expediente"
              name="numeroExpedienteRecuperado"
              ref={expedienteRef}
              value={numeroExpediente}
              onChange={(evento) => setNumeroExpediente(evento.target.value)}
              onFocus={(evento) => evento.target.select()}
              placeholder="Escriba o escanee el expediente"
              inputMode="numeric"
              autoComplete="off"
              maxLength={30}
              className="mt-2 h-14 w-full rounded-lg bg-surface-container-low px-4 text-[22px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="recuperacion-persona"
              name="personaRetiraRecuperada"
              label="Persona que retiró"
              value={personaRetira}
              onChange={(evento) => setPersonaRetira(evento.target.value)}
              placeholder="Nombre completo"
              autoComplete="off"
              maxLength={120}
            />
            <Input
              id="recuperacion-motivo"
              name="motivoRecuperado"
              label="Motivo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Tesis, investigación, revisión…"
              autoComplete="off"
              maxLength={120}
            />

            <div className="block space-y-1">
              <label
                htmlFor="recuperacion-fecha"
                className="block text-sm font-medium text-on-surface"
              >
                Fecha original de salida
              </label>
              <input
                id="recuperacion-fecha"
                name="fechaSalidaRecuperada"
                ref={fechaRef}
                value={fechaTexto}
                onChange={manejarCambioFecha}
                onKeyDown={manejarTeclaFecha}
                placeholder="DD/MM/AAAA"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                aria-describedby="recuperacion-fecha-ayuda"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
              />
              <span id="recuperacion-fecha-ayuda" className="block text-xs text-on-surface-variant">
                Escriba solo dígitos: las barras se colocan solas (ejemplo 01/11/2026).
              </span>
            </div>

            <div className="block space-y-1">
              <label
                htmlFor="recuperacion-hora"
                className="block text-sm font-medium text-on-surface"
              >
                Hora original de salida
              </label>
              <input
                id="recuperacion-hora"
                name="horaSalidaRecuperada"
                ref={horaRef}
                value={horaTexto}
                onChange={manejarCambioHora}
                onKeyDown={manejarTeclaHora}
                placeholder="HH:mm"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                aria-describedby="recuperacion-hora-ayuda"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
              />
              <span id="recuperacion-hora-ayuda" className="block text-xs text-on-surface-variant">
                Formato de 24 horas: HH:mm (ejemplo 09:15).
              </span>
            </div>
          </div>

          <div className="space-y-2" aria-live="polite">
            {errorLocal && (
              <Alert tone="warning" title="Faltan datos">
                <p>{errorLocal}</p>
              </Alert>
            )}
            {error && (
              <Alert tone="error" title="No se pudo recuperar el préstamo">
                <p>{error.mensaje}</p>
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={cerrar}
              disabled={recuperando}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={recuperando}
              className="min-h-[52px] w-full !bg-red-600 !text-white hover:brightness-110 sm:w-auto"
            >
              <Icon name={recuperando ? 'hourglass_top' : 'restore'} className="text-[20px]" />
              {recuperando ? 'Recuperando…' : 'Recuperar préstamo'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
