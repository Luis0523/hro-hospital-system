import { useEffect, useState } from 'react'
import { Alert, Icon, ModalGenerandoPdf, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { listarEstaciones, obtenerConfiguracionArchivo } from '@/modules/carnets/api/carnetsApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useSalidaArchivoHospital } from '../hooks/useSalidaArchivoHospital'
import { useEtiquetasEstacion } from '../hooks/useEtiquetasEstacion'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorSalidaHospital from '../components/salida/BuscadorSalidaHospital.jsx'
import ListaSalidosHospital from '../components/salida/ListaSalidosHospital.jsx'

// POS de salidas de archivo consultadas DIRECTAMENTE al hospital (Registro
// Médico). El listado es compartido por estación: varios operadores de la misma
// estación ven y marcan lo mismo. No depende de los carnets de enfermería.
export default function SalidaArchivoHospitalPage() {
  const { mostrarToast } = useToast()
  const { estacion, seleccionarEstacion } = useEstacion()
  const { tema, alternarTema } = useTema()
  const esOscuro = tema === 'oscuro'
  const [estaciones, setEstaciones] = useState([])
  const [umbral, setUmbral] = useState(null)
  const [fecha, setFecha] = useState(hoyIso)
  const [query, setQuery] = useState('')
  const [etiquetaId, setEtiquetaId] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [progresoPdf, setProgresoPdf] = useState(0)

  const { salidas, pendientes, cargando, error, cola, inputRef, agregar, generarPdf } =
    useSalidaArchivoHospital({ fecha, estacionId: estacion?.id })
  const { etiquetas, cargando: cargandoEtiquetas } = useEtiquetasEstacion(estacion?.id)

  // Al cambiar de estación se limpia la etiqueta elegida (pertenece a otra config).
  useEffect(() => {
    setEtiquetaId('')
  }, [estacion?.id])

  useEffect(() => {
    listarEstaciones()
      .then((lista) => setEstaciones(Array.isArray(lista) ? lista : []))
      .catch(() => setEstaciones([]))

    obtenerConfiguracionArchivo()
      .then((config) => setUmbral(config?.umbralActivo ?? null))
      .catch(() => setUmbral(null))
  }, [])

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
    setProgresoPdf(0)
    const inicio = Date.now()
    const simulacionMs = 2200
    const timer = setInterval(() => {
      const avance = Math.min(92, Math.round(((Date.now() - inicio) / simulacionMs) * 92))
      setProgresoPdf((actual) => Math.max(actual, avance))
    }, 50)
    try {
      const [blob] = await Promise.all([
        generarPdf(),
        new Promise((resolver) => setTimeout(resolver, simulacionMs)),
      ])
      clearInterval(timer)
      setProgresoPdf(100)
      if (blob) descargarBlob(blob, `salida-archivo-hospital-${fecha}.pdf`)
      await new Promise((resolver) => setTimeout(resolver, 400))
    } catch (fallo) {
      clearInterval(timer)
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
    } finally {
      clearInterval(timer)
      setGenerandoPdf(false)
      setProgresoPdf(0)
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
    <ArchivoLayout
      acciones={
        <>
          {selectorEstacion}

          <label className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1">
            <Icon name="calendar_today" className="text-[18px] text-primary" />
            <input
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              aria-label="Fecha de la salida"
              className="h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none"
            />
          </label>

          <button
            type="button"
            onClick={alternarTema}
            aria-pressed={esOscuro}
            aria-label={esOscuro ? 'Modo claro' : 'Modo oscuro'}
            title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:bg-surface-container"
          >
            <Icon name={esOscuro ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
          </button>
        </>
      }
    >
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <h1 className="text-headline-sm font-bold text-on-surface">
          Salida de archivo (Registro Médico)
        </h1>

        <p className="text-body-sm text-on-surface-variant">
          Clasificación automática activo/pasivo
          {umbral != null ? ` · umbral ${umbral}` : ''}: los expedientes con número mayor al umbral
          son archivo activo; los menores o iguales son archivo pasivo.
        </p>

        {!estacion && (
          <Alert tone="warning" title="Seleccione la estación">
            Elija su estación arriba para registrar salidas y ver el listado compartido.
          </Alert>
        )}

        <BuscadorSalidaHospital
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          onAgregar={(valor) =>
            agregar(valor, {
              etiqueta: etiquetas.find((e) => String(e.id) === String(etiquetaId)) ?? null,
            })
          }
          disabled={!estacion}
          cola={cola}
          etiquetas={etiquetas}
          etiquetaId={etiquetaId}
          onCambiarEtiqueta={setEtiquetaId}
          cargandoEtiquetas={cargandoEtiquetas}
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

      <ModalGenerandoPdf abierto={generandoPdf} progreso={progresoPdf} />
    </ArchivoLayout>
  )
}
