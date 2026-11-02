import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Icon } from '@/shared/components/ui'
import {
  CODIGO_ENTRADA_INVALIDA,
  CODIGO_SIN_PRESTAMO_PENDIENTE,
  CODIGO_YA_DEVUELTO,
} from '../../api/salidasExternasApi'

const PATRON_DIGITOS = /^\d*$/
const PATRON_MANUAL = /^\d*(-\d*)?$/

function describirError(error) {
  if (!error) return null

  if (error.codigo === CODIGO_SIN_PRESTAMO_PENDIENTE) {
    return {
      tone: 'warning',
      title: 'Sin préstamo pendiente',
      detalle: 'No existe un préstamo pendiente para este expediente.',
    }
  }
  if (error.codigo === CODIGO_YA_DEVUELTO) {
    return { tone: 'info', title: 'Devolución ya registrada', detalle: error.mensaje }
  }
  if (error.codigo === CODIGO_ENTRADA_INVALIDA) {
    return { tone: 'warning', title: 'Revise el expediente', detalle: error.mensaje }
  }
  return { tone: 'error', title: 'No se pudo registrar la devolución', detalle: error.mensaje }
}

/**
 * Registro directo de devolución: una sola acción (Enter o botón), sin tarjeta
 * de confirmación previa. La API valida que exista un préstamo pendiente.
 */
export default function PanelDevolucion({
  numeroExpediente,
  onNumeroExpediente,
  onRegistrar,
  guardando = false,
  error = null,
  exito = null,
}) {
  const numeroRef = useRef(null)
  const manualRef = useRef(null)
  const esperandoResultadoRef = useRef(false)

  const [manualAbierto, setManualAbierto] = useState(false)
  const [avisoNumero, setAvisoNumero] = useState(null)
  const [enfocar, setEnfocar] = useState(null)

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
    if (guardando) return
    onRegistrar()
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

  return (
    <section
      aria-labelledby="titulo-panel-devolucion"
      className="rounded-2xl border-2 border-emerald-200 bg-surface-container-lowest p-4 shadow-card dark:border-emerald-900 sm:p-6"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Icon name="assignment_return" className="text-[22px]" />
        </span>
        <div className="min-w-0">
          <h3 id="titulo-panel-devolucion" className="text-title-md font-semibold text-on-surface">
            Registrar devolución
          </h3>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            Escanee o escriba el expediente y presione Enter. La devolución se registra en un solo
            paso.
          </p>
        </div>
      </header>

      <form onSubmit={manejarEnvio} className="mt-4 space-y-4" noValidate aria-busy={guardando}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              <Icon name="badge" className="text-[18px] text-emerald-700 dark:text-emerald-400" />
              <label htmlFor="salidas-externas-devolucion-expediente">Número de expediente</label>
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
              className="pointer-events-none absolute left-4 text-[26px] text-emerald-700 dark:text-emerald-400"
            />
            {manualAbierto ? (
              <input
                id="salidas-externas-devolucion-expediente"
                name="numeroExpedienteDevolucionManual"
                ref={manualRef}
                value={numeroExpediente}
                onChange={(evento) => cambiarNumeroManual(evento.target.value)}
                onFocus={(evento) => evento.target.select()}
                placeholder="Ejemplo: 91-1330"
                inputMode="numeric"
                autoComplete="off"
                maxLength={31}
                aria-describedby="salidas-externas-ayuda-devolucion"
                className="h-16 w-full rounded-xl bg-surface-container-low pl-14 pr-4 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-emerald-600/20"
              />
            ) : (
              <input
                id="salidas-externas-devolucion-expediente"
                name="numeroExpedienteDevolucion"
                ref={numeroRef}
                value={numeroExpediente}
                onChange={(evento) => cambiarNumero(evento.target.value)}
                onFocus={(evento) => evento.target.select()}
                placeholder="Escriba o escanee el expediente"
                inputMode="numeric"
                autoComplete="off"
                maxLength={30}
                aria-describedby="salidas-externas-ayuda-devolucion"
                className="h-16 w-full rounded-xl bg-surface-container-low pl-14 pr-4 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-emerald-600/20"
              />
            )}
          </div>

          <p
            id="salidas-externas-ayuda-devolucion"
            className="mt-1 text-label-sm text-on-surface-variant"
          >
            {manualAbierto
              ? 'Ingreso manual: escriba los dígitos y coloque un único guion donde corresponda.'
              : 'Presione Enter o el botón para registrar la devolución.'}
          </p>
          {avisoNumero && (
            <p className="mt-1 text-label-sm text-error" role="alert">
              {avisoNumero}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={guardando}
          className="min-h-[52px] w-full sm:w-auto"
          aria-busy={guardando}
        >
          <Icon
            name={guardando ? 'hourglass_top' : 'assignment_turned_in'}
            className="text-[20px]"
          />
          {guardando ? 'Registrando…' : 'Registrar devolución'}
        </Button>
      </form>

      <div className="mt-4 space-y-3" aria-live="polite">
        {aviso && (
          <Alert tone={aviso.tone} title={aviso.title}>
            <p>{aviso.detalle}</p>
          </Alert>
        )}
        {exito && (
          <Alert tone="success" title="Devolución guardada">
            <p>{exito}</p>
            <p className="mt-1">Puede capturar el siguiente expediente.</p>
          </Alert>
        )}
      </div>
    </section>
  )
}
