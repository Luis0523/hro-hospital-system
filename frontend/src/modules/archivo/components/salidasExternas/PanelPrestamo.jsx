import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Icon, Input } from '@/shared/components/ui'
import { CODIGO_ENTRADA_INVALIDA, CODIGO_PRESTAMO_DUPLICADO } from '../../api/salidasExternasApi'
import {
  CODIGO_EXPEDIENTE_NO_ENCONTRADO,
  CODIGO_VERIFICACION_FALLIDA,
  MODO_VERIFICACION_DESHABILITADA,
  MODO_VERIFICACION_NO_DISPONIBLE,
  MODO_VERIFICACION_REAL,
  VERIFICACION_ENCONTRADO,
} from '../../api/verificacionExpedienteApi'
import { formatearFechaHoraGuatemala } from '../../utils/fechaGuatemala'
import { numeroExpedienteVisible } from '../../utils/prestamosExternos'

// Sugerencias para el motivo. Es un `datalist`: el operador puede escribir
// cualquier otro texto; no es un catálogo cerrado.
const MOTIVOS_SUGERIDOS = [
  'Investigación universitaria',
  'Tesis',
  'Revisión administrativa',
  'Consulta institucional',
]

const ID_SUGERENCIAS_MOTIVO = 'motivos-salidas-externas'
const PATRON_DIGITOS = /^\d*$/
const PATRON_MANUAL = /^\d*(-\d*)?$/

function describirError(error) {
  if (!error) return null

  if (error.codigo === CODIGO_ENTRADA_INVALIDA) {
    return { tone: 'warning', title: 'Revise los datos', detalle: error.mensaje }
  }

  if (error.codigo === CODIGO_PRESTAMO_DUPLICADO) {
    return {
      tone: 'error',
      title: 'Préstamo activo',
      detalle: error.mensaje,
      registro: error.registro,
    }
  }

  if (error.codigo === CODIGO_EXPEDIENTE_NO_ENCONTRADO) {
    return {
      tone: 'error',
      title: 'Expediente no encontrado',
      detalle: error.mensaje,
    }
  }

  if (error.codigo === CODIGO_VERIFICACION_FALLIDA) {
    return {
      tone: 'error',
      title: 'No se pudo verificar',
      detalle: error.mensaje,
    }
  }

  return { tone: 'error', title: 'No se pudo registrar', detalle: error.mensaje }
}

function detalleDuplicado(registro) {
  if (!registro) return null
  const persona = registro.personaRetira ? `Prestado a ${registro.personaRetira}` : 'Prestado'
  const fecha = formatearFechaHoraGuatemala(registro.fechaSalida)
  const numero = numeroExpedienteVisible(registro)
  const cabecera = numero ? `Expediente ${numero}. ` : ''
  return fecha ? `${cabecera}${persona} el ${fecha}.` : `${cabecera}${persona}.`
}

/**
 * Formulario de registro individual de préstamos.
 * Componente controlado: el estado y las operaciones viven en
 * `useSalidasExternas`; aquí solo se gestiona el foco y el modo de captura.
 */
export default function PanelPrestamo({
  personaRetira,
  onPersonaRetira,
  motivo,
  onMotivo,
  numeroExpediente,
  onNumeroExpediente,
  onRegistrar,
  guardando = false,
  error = null,
  exito = null,
  verificando = false,
  verificacion = null,
  modoVerificacion = MODO_VERIFICACION_DESHABILITADA,
}) {
  const numeroRef = useRef(null)
  const manualRef = useRef(null)
  const esperandoResultadoRef = useRef(false)

  const [manualAbierto, setManualAbierto] = useState(false)
  const [avisoPersona, setAvisoPersona] = useState(null)
  const [avisoNumero, setAvisoNumero] = useState(null)
  const [enfocar, setEnfocar] = useState(null)

  // El hook no expone refs de DOM. Al terminar una operación exitosa (sin error
  // y con el número limpio) se devuelve el foco al mecanismo activo.
  useEffect(() => {
    if (guardando) {
      esperandoResultadoRef.current = true
      return
    }
    if (!esperandoResultadoRef.current) return

    esperandoResultadoRef.current = false
    if (!error && !numeroExpediente) {
      const destino = manualAbierto ? manualRef : numeroRef
      destino.current?.focus()
    }
  }, [guardando, error, numeroExpediente, manualAbierto])

  useEffect(() => {
    if (!enfocar) return
    const destino = enfocar === 'manual' ? manualRef : numeroRef
    destino.current?.focus()
    setEnfocar(null)
  }, [enfocar])

  function manejarEnvio(evento) {
    evento.preventDefault()
    if (guardando || verificando) return
    onRegistrar()
  }

  function cambiarPersona(valor) {
    // No se aceptan números; se filtran al escribir o pegar.
    const filtrado = String(valor).replace(/\d/g, '')
    setAvisoPersona(
      filtrado !== valor ? 'Solo se permiten letras, espacios y signos de nombre.' : null,
    )
    onPersonaRetira(filtrado)
  }

  function cambiarNumero(valor) {
    if (PATRON_DIGITOS.test(valor)) {
      setAvisoNumero(null)
      onNumeroExpediente(valor)
      return
    }
    setAvisoNumero('Solo se admiten dígitos. Use «Ingreso manual» para capturar con guion.')
  }

  function cambiarNumeroManual(valor) {
    if (PATRON_MANUAL.test(valor)) {
      setAvisoNumero(null)
      onNumeroExpediente(valor, valor)
      return
    }
    setAvisoNumero('Use solo dígitos y un único guion entre grupos (p. ej. 91-1330).')
  }

  function alternarManual(abrir) {
    setManualAbierto(abrir)
    setAvisoNumero(null)
    onNumeroExpediente('', null)
    setEnfocar(abrir ? 'manual' : 'normal')
  }

  const aviso = describirError(error)
  const detalle = aviso?.registro ? detalleDuplicado(aviso.registro) : null
  const numeroManualInvalido = manualAbierto && numeroExpediente.endsWith('-')
  const mensajeVerificacion = verificando
    ? 'Verificando existencia del expediente…'
    : verificacion?.modo === MODO_VERIFICACION_REAL &&
        verificacion.estado === VERIFICACION_ENCONTRADO
      ? 'Expediente confirmado en el sistema.'
      : null

  return (
    <section
      aria-labelledby="titulo-panel-prestamo"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:p-6"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name="assignment_add" className="text-[22px]" />
        </span>
        <div className="min-w-0">
          <h3 id="titulo-panel-prestamo" className="text-title-md font-semibold text-on-surface">
            Nuevo préstamo
          </h3>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            Un expediente por registro. La persona y el motivo se conservan para las siguientes
            capturas.
          </p>
        </div>
      </header>

      <form
        onSubmit={manejarEnvio}
        className="mt-4 space-y-4"
        noValidate
        aria-busy={guardando || verificando}
      >
        <div>
          <Input
            id="salidas-externas-persona"
            name="personaRetira"
            label="Persona que retira"
            value={personaRetira}
            onChange={(evento) => cambiarPersona(evento.target.value)}
            placeholder="Nombre completo"
            autoComplete="off"
            maxLength={120}
            error={avisoPersona}
            required
          />
          {!avisoPersona && (
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Solo letras, espacios, puntos, guiones y apóstrofos.
            </p>
          )}
        </div>

        <div>
          <Input
            id="salidas-externas-motivo"
            name="motivo"
            label="Motivo del préstamo"
            value={motivo}
            onChange={(evento) => onMotivo(evento.target.value)}
            placeholder="Tesis, investigación, revisión…"
            list={ID_SUGERENCIAS_MOTIVO}
            autoComplete="off"
            maxLength={120}
            required
          />
          <datalist id={ID_SUGERENCIAS_MOTIVO}>
            {MOTIVOS_SUGERIDOS.map((sugerencia) => (
              <option key={sugerencia} value={sugerencia} />
            ))}
          </datalist>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              <Icon name="badge" className="text-[18px] text-primary" />
              <label htmlFor="salidas-externas-expediente">Número de expediente</label>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => alternarManual(!manualAbierto)}
              disabled={guardando}
              className="min-h-11"
            >
              <Icon name="keyboard" className="text-[18px]" />
              {manualAbierto ? 'Captura normal' : 'Ingreso manual'}
            </Button>
          </div>

          <div className="relative mt-2 flex items-center">
            <Icon
              name="qr_code_scanner"
              className="pointer-events-none absolute left-4 text-[26px] text-primary"
            />
            {manualAbierto ? (
              <input
                id="salidas-externas-expediente"
                name="numeroExpedienteManual"
                ref={manualRef}
                value={numeroExpediente}
                onChange={(evento) => cambiarNumeroManual(evento.target.value)}
                onFocus={(evento) => evento.target.select()}
                placeholder="Ejemplo: 91-1330"
                inputMode="numeric"
                autoComplete="off"
                maxLength={31}
                aria-describedby="salidas-externas-ayuda-expediente"
                className="h-16 w-full rounded-xl bg-surface-container-low pl-14 pr-4 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
              />
            ) : (
              <input
                id="salidas-externas-expediente"
                name="numeroExpediente"
                ref={numeroRef}
                value={numeroExpediente}
                onChange={(evento) => cambiarNumero(evento.target.value)}
                onFocus={(evento) => evento.target.select()}
                placeholder="Escriba o escanee el expediente"
                inputMode="numeric"
                autoComplete="off"
                maxLength={30}
                aria-describedby="salidas-externas-ayuda-expediente"
                className="h-16 w-full rounded-xl bg-surface-container-low pl-14 pr-4 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
              />
            )}
          </div>

          <p
            id="salidas-externas-ayuda-expediente"
            className="mt-1 text-label-sm text-on-surface-variant"
          >
            {manualAbierto
              ? 'Ingreso manual: escriba los dígitos y coloque un único guion donde corresponda.'
              : 'Presione Enter o el botón para registrar. El campo queda listo para el siguiente expediente.'}
          </p>
          {avisoNumero && (
            <p className="mt-1 text-label-sm text-error" role="alert">
              {avisoNumero}
            </p>
          )}
          {numeroManualInvalido && (
            <p className="mt-1 text-label-sm text-error">
              El guion no puede quedar al final del número.
            </p>
          )}

          {modoVerificacion !== MODO_VERIFICACION_REAL && (
            <p className="mt-1 flex items-start gap-1 text-label-sm text-on-surface-variant">
              <Icon name="info" className="mt-[1px] text-[14px] text-secondary" />
              {modoVerificacion === MODO_VERIFICACION_NO_DISPONIBLE
                ? 'Verificación no disponible: el expediente no se confirmará contra la base de datos.'
                : 'Modo simulación: la existencia del expediente no se verifica contra la base de datos.'}
            </p>
          )}

          {mensajeVerificacion && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-1 flex items-center gap-1 text-label-sm ${
                verificacion?.estado === VERIFICACION_ENCONTRADO
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-on-surface-variant'
              }`}
            >
              <Icon name={verificando ? 'hourglass_top' : 'check_circle'} className="text-[16px]" />
              {mensajeVerificacion}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={guardando || verificando}
          className="min-h-[52px] w-full sm:w-auto"
          aria-busy={guardando || verificando}
        >
          <Icon name={guardando ? 'hourglass_top' : 'check_circle'} className="text-[20px]" />
          {verificando ? 'Verificando…' : guardando ? 'Registrando…' : 'Registrar préstamo'}
        </Button>
      </form>

      <div className="mt-4 space-y-3" aria-live="polite">
        {aviso && (
          <Alert tone={aviso.tone} title={aviso.title}>
            <p>{aviso.detalle}</p>
            {detalle && <p className="mt-1">{detalle}</p>}
            {aviso.title === 'Préstamo activo' && (
              <p className="mt-1">
                No puede registrarse de nuevo mientras el préstamo siga pendiente.
              </p>
            )}
          </Alert>
        )}

        {exito && (
          <Alert tone="success" title="Préstamo guardado">
            <p>{exito}</p>
            <p className="mt-1">Puede capturar el siguiente expediente.</p>
          </Alert>
        )}
      </div>
    </section>
  )
}
