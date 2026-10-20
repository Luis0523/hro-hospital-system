import { useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import { buscarMedicoPorColegiado } from '../api/doctorApi'
import { COLEGIADOS_DEMO } from '../api/mockData'

const COLEGIADO_RE = /^\d{3,10}$/

const MENSAJES = {
  COLEGIADO_INVALIDO: 'Ingresa un número de colegiado válido (solo dígitos, mínimo 3).',
  MEDICO_NO_ENCONTRADO: 'No encontramos un médico con ese número de colegiado.',
  MEDICO_INACTIVO: 'El médico está inactivo. Contacta al administrador.',
}

function mensajeDeError(error) {
  return MENSAJES[error?.code] ?? error?.message ?? 'No se pudo validar el colegiado.'
}

export default function AccesoDoctor({ clinica, asignacion, onIdentificado }) {
  const [colegiado, setColegiado] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const valor = colegiado.trim()

    if (!COLEGIADO_RE.test(valor)) {
      setError({
        code: 'COLEGIADO_INVALIDO',
        message: MENSAJES.COLEGIADO_INVALIDO,
      })
      return
    }

    setCargando(true)
    setError(null)

    try {
      const medico = await buscarMedicoPorColegiado(valor)
      onIdentificado(medico)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setCargando(false)
    }
  }

  function manejarCambio(evento) {
    setColegiado(evento.target.value)
    if (error) setError(null)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-primary">
        <Icon name="local_hospital" className="text-2xl" />
        <span className="text-sm font-bold tracking-[0.2em]">SIGHO</span>
      </div>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Clínica validada
          </p>
          <h1 className="mt-1 text-headline-lg text-on-surface">¿Quién está ahí?</h1>
          <p className="mt-1 text-base text-on-surface-variant">
            Clínica {clinica.numero} · {clinica.nombre}
          </p>
          <p className="text-sm text-on-surface-variant">
            {asignacion.subespecialidadNombre} · Nivel {clinica.nivel}
          </p>
          {clinica.codigo && (
            <p className="mt-1 text-sm text-on-surface-variant">Código {clinica.codigo}</p>
          )}
        </div>

        <form className="space-y-4" onSubmit={manejarEnvio}>
          <Input
            id="colegiado"
            name="colegiado"
            label="Número de colegiado"
            value={colegiado}
            onChange={manejarCambio}
            placeholder="Ej. 1001"
            autoComplete="off"
            autoFocus
            inputMode="numeric"
            maxLength={10}
            disabled={cargando}
            aria-describedby={error ? 'acceso-doctor-error' : undefined}
            aria-invalid={Boolean(error)}
            hint="Tu nombre se obtiene automáticamente del registro de médicos."
          />

          <Button type="submit" size="lg" className="min-h-[48px] w-full" disabled={cargando}>
            {cargando ? 'Buscando médico…' : 'Continuar'}
          </Button>
        </form>

        <div id="acceso-doctor-error" aria-live="polite">
          {error && (
            <Alert tone="error" title="No se pudo identificar al médico">
              {mensajeDeError(error)}
            </Alert>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface">Datos de demostración</p>
          <p className="mt-1">
            Válidos: {COLEGIADOS_DEMO.validos.join(', ')}. Inactivo: {COLEGIADOS_DEMO.inactivo}.
            Inexistente: {COLEGIADOS_DEMO.inexistente}.
          </p>
        </div>
      </Card>
    </div>
  )
}
