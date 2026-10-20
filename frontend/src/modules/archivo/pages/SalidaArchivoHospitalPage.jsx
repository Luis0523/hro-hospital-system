import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { listarEstaciones } from '@/modules/carnets/api/carnetsApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useSalidaArchivoHospital } from '../hooks/useSalidaArchivoHospital'
import SalidaArchivoHeader from '../components/salida/SalidaArchivoHeader.jsx'
import BuscadorSalidaHospital from '../components/salida/BuscadorSalidaHospital.jsx'
import ListaSalidosHospital from '../components/salida/ListaSalidosHospital.jsx'

// POS de salidas de archivo consultadas DIRECTAMENTE al hospital (Registro
// Médico). El listado es compartido por estación: varios operadores de la misma
// estación ven y marcan lo mismo. No depende de los carnets de enfermería.
export default function SalidaArchivoHospitalPage() {
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const { estacion, seleccionarEstacion } = useEstacion()
  const [estaciones, setEstaciones] = useState([])
  const [fecha, setFecha] = useState(hoyIso)
  const [query, setQuery] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)

  const { salidas, pendientes, cargando, error, fallidos, cola, inputRef, agregar, generarPdf } =
    useSalidaArchivoHospital({ fecha, estacionId: estacion?.id })

  useEffect(() => {
    listarEstaciones()
      .then((lista) => setEstaciones(Array.isArray(lista) ? lista : []))
      .catch(() => setEstaciones([]))
  }, [])

  // Reloj en vivo (hora local).
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hora = ahora.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  function manejarCambioEstacion(evento) {
    const id = Number(evento.target.value)
    const elegida = estaciones.find((e) => e.id === id)
    seleccionarEstacion(
      elegida
        ? {
            id: elegida.id,
            codigo: elegida.codigo,
            nombre: elegida.nombre,
            ubicacion: elegida.ubicacion,
          }
        : null,
    )
  }

  async function descargarPdf() {
    setGenerandoPdf(true)
    try {
      const blob = await generarPdf()
      if (blob) descargarBlob(blob, `salida-archivo-hospital-${fecha}.pdf`)
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
    } finally {
      setGenerandoPdf(false)
    }
  }

  const selectorEstacion = (
    <label
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
        estacion
          ? 'border-outline-variant bg-surface-container-lowest'
          : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
      }`}
    >
      <Icon name="local_hospital" className="text-[18px] text-primary" />
      <span className="sr-only">Estación</span>
      <select
        value={estacion?.id ?? ''}
        onChange={manejarCambioEstacion}
        aria-label="Estación de la salida"
        title={estacion ? 'Estación seleccionada' : 'Seleccione la estación'}
        className={`h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none ${
          estacion ? 'text-on-surface' : 'text-amber-800 dark:text-amber-200'
        }`}
      >
        <option value="">Sin estación…</option>
        {estaciones.map((e) => (
          <option key={e.id} value={e.id}>
            {e.codigo ? `${e.codigo} · ` : ''}
            {e.nombre}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="min-h-screen bg-surface">
      <SalidaArchivoHeader
        titulo="Salida de archivo (Registro Médico)"
        fecha={fecha}
        onFecha={setFecha}
        hora={hora}
        pendientes={null}
        confirmando={cola}
        fallidos={fallidos}
        selectorEstacion={selectorEstacion}
        accionesExtra={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/archivo/salida')}
            title="Salida de archivo (desde los carnets de enfermería)"
          >
            <Icon name="outbound" className="text-[18px]" />
            Salida de archivo
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        {!estacion && (
          <Alert tone="warning" title="Seleccione la estación">
            Elija su estación arriba para registrar salidas y ver el listado compartido.
          </Alert>
        )}

        <BuscadorSalidaHospital
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          onAgregar={agregar}
          disabled={!estacion}
          cola={cola}
        />

        {error && (
          <Alert tone="error" title="No se pudieron cargar las salidas">
            {error.message}
          </Alert>
        )}

        {cargando ? (
          <Spinner label="Cargando salidas…" />
        ) : (
          <ListaSalidosHospital
            salidos={salidas}
            pendientes={pendientes}
            generandoPdf={generandoPdf}
            onDescargarPdf={descargarPdf}
          />
        )}
      </main>
    </div>
  )
}
