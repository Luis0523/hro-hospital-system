import { useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import { buscarPacientePorExpediente } from '../api/doctorApi'

function normalizarNombre(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function mensajeError(error) {
  if (error?.code === 'EXPEDIENTE_INVALIDO') {
    return 'Ingresa un número de expediente válido (de 1 a 10 dígitos numéricos).'
  }
  if (error?.code === 'EXPEDIENTE_NO_ENCONTRADO') {
    return 'No encontramos un paciente ficticio con ese número de expediente.'
  }
  return error?.message ?? 'No se pudo consultar el expediente.'
}

export default function ModalExpediente({
  abierto,
  turno,
  onCerrar,
  onRegistrar,
  deshabilitado = false,
}) {
  const [expediente, setExpediente] = useState('')
  const [consulta, setConsulta] = useState(null)
  const [error, setError] = useState(null)
  const [consultando, setConsultando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    const identificado = turno?.identificado === true
    setExpediente(identificado ? (turno?.expediente ?? '') : '')
    setConsulta(
      identificado && turno?.expediente
        ? { expediente: turno.expediente, pacienteNombre: turno.pacienteNombre }
        : null,
    )
    setError(null)
    setConsultando(false)
    setGuardando(false)
  }, [abierto, turno?.id, turno?.identificado, turno?.expediente, turno?.pacienteNombre])

  const pacienteEsperado = turno?.pacienteNombre ?? ''
  const coincide =
    Boolean(consulta) &&
    normalizarNombre(consulta.pacienteNombre) === normalizarNombre(pacienteEsperado)
  const puedeAsociar =
    Boolean(consulta && coincide && expediente.trim()) && !guardando && !deshabilitado

  function cerrar() {
    if (!guardando) onCerrar?.()
  }

  function manejarCambio(evento) {
    setExpediente(evento.target.value)
    setConsulta(null)
    setError(null)
  }

  function manejarPegado(evento) {
    const texto = String(evento.clipboardData?.getData('text') ?? '').trim()
    if (!/^[0-9]{1,10}$/.test(texto)) {
      evento.preventDefault()
      setConsulta(null)
      setError({
        code: 'EXPEDIENTE_INVALIDO',
        message: 'Ingresa un número de expediente válido (de 1 a 10 dígitos numéricos).',
      })
    }
  }

  async function consultar(evento) {
    evento?.preventDefault()
    const valor = expediente.trim()

    if (!valor) {
      setError({ code: 'EXPEDIENTE_INVALIDO', message: 'Ingresa un número de expediente.' })
      setConsulta(null)
      return
    }

    setConsultando(true)
    setError(null)
    setConsulta(null)

    try {
      const paciente = await buscarPacientePorExpediente(valor)
      setConsulta(paciente)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setConsultando(false)
    }
  }

  async function asociar() {
    if (!puedeAsociar) return
    setGuardando(true)
    setError(null)
    try {
      await onRegistrar?.(consulta.expediente)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setGuardando(false)
    }
  }

  const pie = (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={cerrar} disabled={guardando}>
        Cancelar
      </Button>
      <Button type="button" onClick={asociar} disabled={!puedeAsociar} aria-busy={guardando}>
        {guardando ? 'Guardando…' : 'Asociar expediente'}
      </Button>
    </div>
  )

  return (
    <Modal open={abierto} onClose={cerrar} title="Expediente del turno" footer={pie}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
          <Icon name="badge" className="mt-0.5 text-2xl text-primary" />
          <div>
            <p className="text-base font-semibold text-on-surface">
              Turno {turno?.correlativo ?? '—'} ·{' '}
              {turno?.identificado ? turno.pacienteNombre : 'Pendiente de identificar'}
            </p>
            <p className="text-sm text-on-surface-variant">
              Expediente actual:{' '}
              {turno?.identificado && turno?.expediente ? turno.expediente : 'sin registrar'}
            </p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={consultar}>
          <Input
            id="expediente-turno"
            name="expediente"
            label="Número de expediente"
            value={expediente}
            onChange={manejarCambio}
            onPaste={manejarPegado}
            placeholder="Ej. 0000000006"
            autoComplete="off"
            autoFocus
            inputMode="numeric"
            maxLength={10}
            disabled={consultando || guardando || deshabilitado}
            aria-describedby={error ? 'expediente-error' : undefined}
            aria-invalid={Boolean(error)}
            hint="Solo dígitos, hasta 10. Se conservan los ceros iniciales."
          />
          <Button
            type="submit"
            variant="secondary"
            size="md"
            className="min-h-[44px] w-full"
            disabled={consultando || guardando || deshabilitado}
          >
            {consultando ? 'Consultando…' : 'Consultar expediente'}
          </Button>
        </form>

        <div id="expediente-error" aria-live="polite">
          {error && (
            <Alert tone="error" title="No se pudo asociar el expediente">
              {mensajeError(error)}
            </Alert>
          )}
        </div>

        {consulta && coincide && (
          <Alert tone="success" title="Paciente verificado">
            {consulta.pacienteNombre} · {consulta.expediente}
          </Alert>
        )}

        {consulta && !coincide && (
          <Alert tone="warning" title="El expediente pertenece a otro paciente">
            {consulta.expediente} corresponde a {consulta.pacienteNombre} y no al paciente de este
            turno. No se puede asociar.
          </Alert>
        )}

        {deshabilitado && (
          <Alert tone="warning" title="Jornada cerrada">
            No se pueden modificar expedientes mientras la jornada está cerrada.
          </Alert>
        )}
      </div>
    </Modal>
  )
}
