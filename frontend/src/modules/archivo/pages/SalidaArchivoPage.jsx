import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { descargarSalidaCarnetsPdfPorIds } from '@/modules/carnets/api/carnetsApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useSalidaArchivo } from '../hooks/useSalidaArchivo'
import SalidaArchivoHeader from '../components/salida/SalidaArchivoHeader.jsx'
import BuscadorSalida from '../components/salida/BuscadorSalida.jsx'
import TablaSalidaPendientes from '../components/salida/TablaSalidaPendientes.jsx'
import ListaSalidos from '../components/salida/ListaSalidos.jsx'

// Pantalla POS de salidas de archivo (sin barra lateral). El operador teclea el
// número de expediente, la coincidencia local se auto-selecciona y Enter marca la
// salida de inmediato; el POST se confirma en segundo plano para no frenar el lote.
export default function SalidaArchivoPage() {
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [fecha, setFecha] = useState(hoyIso)

  const {
    pendientes,
    salidasSesion,
    coincidencias,
    query,
    setQuery,
    inputRef,
    cargando,
    error,
    confirmandoIds,
    fallidos,
    recargar,
    marcarSalida,
    enfocar,
  } = useSalidaArchivo({ fecha })

  const [animandoIds, setAnimandoIds] = useState(() => new Set())
  const [ultimo, setUltimo] = useState(null)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // Reloj en vivo (hora local) para operar contra el sistema.
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

  function manejarMarcar(carnet) {
    const ok = marcarSalida(carnet)
    if (!ok) return
    setUltimo(carnet)
    setAnimandoIds((prev) => {
      const siguiente = new Set(prev)
      siguiente.add(carnet.id)
      return siguiente
    })
    window.setTimeout(() => {
      setAnimandoIds((prev) => {
        const siguiente = new Set(prev)
        siguiente.delete(carnet.id)
        return siguiente
      })
    }, 700)
    window.setTimeout(() => setUltimo(null), 3000)
  }

  function manejarSinCoincidencia() {
    mostrarToast({
      tone: 'warning',
      title: 'Sin coincidencia',
      message: 'No hay expediente pendiente con ese número (o ya salió).',
    })
  }

  async function descargarPdf() {
    const ids = salidasSesion.map((carnet) => carnet.id)
    if (ids.length === 0) return
    setGenerandoPdf(true)
    try {
      const blob = await descargarSalidaCarnetsPdfPorIds(ids)
      descargarBlob(blob, `reporte-salida-archivo-${fecha}.pdf`)
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

  return (
    <div className="min-h-screen bg-surface">
      <SalidaArchivoHeader
        fecha={fecha}
        onFecha={setFecha}
        hora={hora}
        pendientes={pendientes.length}
        confirmando={confirmandoIds.size}
        fallidos={fallidos.length}
        accionesExtra={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/archivo/salida-hospital')}
            title="Salida consultando al Registro Médico (hospital)"
          >
            <Icon name="local_hospital" className="text-[18px]" />
            Registro Médico
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <BuscadorSalida
          value={query}
          onChange={setQuery}
          coincidencias={coincidencias}
          inputRef={inputRef}
          onMarcar={manejarMarcar}
          onSinCoincidencia={manejarSinCoincidencia}
        />

        {ultimo && (
          <p
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-title-sm font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
          >
            <Icon name="task_alt" className="text-[20px]" />
            Salida registrada: {ultimo.numeroExpediente} · {ultimo.pacienteNombre}
          </p>
        )}

        {error && (
          <Alert tone="error" title="No se pudieron cargar los carnets">
            {error.message}
          </Alert>
        )}

        {cargando ? (
          <Spinner label="Cargando expedientes…" />
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <TablaSalidaPendientes
              pendientes={pendientes}
              onMarcar={(carnet) => {
                manejarMarcar(carnet)
                enfocar()
              }}
            />
            <ListaSalidos
              salidos={salidasSesion}
              confirmandoIds={confirmandoIds}
              animandoIds={animandoIds}
              generandoPdf={generandoPdf}
              onDescargarPdf={descargarPdf}
            />
          </div>
        )}

        <button type="button" onClick={recargar} className="sr-only">
          Recargar
        </button>
      </main>
    </div>
  )
}
