import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import SelectorEstacion from '../components/SelectorEstacion.jsx'
import { listarEstaciones, registrarAccesoEstacion } from '../api/enfermeriaApi'

export default function SeleccionEstacionPage() {
  const { usuario } = useAuth()
  const { estacion, seleccionarEstacion } = useEstacion()
  const navigate = useNavigate()

  const [estaciones, setEstaciones] = useState([])
  const [seleccionada, setSeleccionada] = useState(estacion?.id ?? null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    let activo = true
    setCargando(true)
    listarEstaciones()
      .then((lista) => {
        if (activo) setEstaciones(lista)
      })
      .catch((e) => {
        if (activo) setError(e.message || 'No se pudieron cargar las estaciones')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  async function confirmar() {
    const elegida = estaciones.find((e) => e.id === seleccionada)
    if (!elegida) return
    setEntrando(true)
    try {
      await registrarAccesoEstacion(elegida.id)
    } catch {
      // La bitácora de rotación no debe bloquear el ingreso a la estación.
    }
    seleccionarEstacion({
      id: elegida.id,
      codigo: elegida.codigo,
      nombre: elegida.nombre,
      ubicacion: elegida.ubicacion,
    })
    navigate('/enfermeria')
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface text-on-surface-variant">
        <Spinner />
        <p className="text-body-md">Cargando estaciones…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <Icon name="error" className="text-[36px] text-error" />
        <div>
          <h1 className="text-headline-md text-on-surface">No se pudieron cargar las estaciones</h1>
          <p className="text-body-md text-on-surface-variant">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <Icon name="refresh" className="text-[20px]" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <SelectorEstacion
      estaciones={estaciones}
      seleccionada={seleccionada}
      onSeleccionar={setSeleccionada}
      onConfirmar={confirmar}
      usuario={usuario}
      confirmando={entrando}
    />
  )
}
