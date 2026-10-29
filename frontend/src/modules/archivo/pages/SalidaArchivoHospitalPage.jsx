import { useEffect, useState } from 'react'
import { Alert, Icon, ModalGenerandoPdf, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { listarEstaciones } from '@/modules/carnets/api/carnetsApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useSalidaArchivoHospital } from '../hooks/useSalidaArchivoHospital'
import { useEtiquetasEstacion } from '../hooks/useEtiquetasEstacion'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorSalidaHospital from '../components/salida/BuscadorSalidaHospital.jsx'
import ListaSalidosHospital from '../components/salida/ListaSalidosHospital.jsx'
import ModalRegistroManual from '../components/salida/ModalRegistroManual.jsx'

// Nombre corto para la barra superior: evita que el selector ocupe dos líneas.
// Se puede ver el nombre completo en el title del control.
function abreviarEstacion(estacion) {
  const nombre = String(estacion?.nombre ?? estacion?.codigo ?? '').trim()
  if (nombre.length <= 12) return nombre
  const sinPrefijo = nombre.replace(/^estaci[oó]n(\s+de)?\s+/i, '')
  if (sinPrefijo.length <= 12) return sinPrefijo
  return `${sinPrefijo.slice(0, 11).trimEnd()}…`
}

// POS de salidas de archivo consultadas DIRECTAMENTE al hospital (Registro
// Médico). El listado es compartido por estación: varios operadores de la misma
// estación ven y marcan lo mismo. No depende de los carnets de enfermería.
export default function SalidaArchivoHospitalPage() {
  const { mostrarToast } = useToast()
  const { estacion, seleccionarEstacion } = useEstacion()
  const { tema, alternarTema } = useTema()
  const esOscuro = tema === 'oscuro'
  const [estaciones, setEstaciones] = useState([])
  const [fecha, setFecha] = useState(hoyIso)
  const [query, setQuery] = useState('')
  const [etiquetaId, setEtiquetaId] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [progresoPdf, setProgresoPdf] = useState(0)
  const [registroManualAbierto, setRegistroManualAbierto] = useState(false)

  const {
    salidas,
    pendientes,
    cargando,
    error,
    cola,
    inputRef,
    agregar,
    registrarManual,
    generarPdf,
  } = useSalidaArchivoHospital({ fecha, estacionId: estacion?.id })
  const { etiquetas, cargando: cargandoEtiquetas } = useEtiquetasEstacion(estacion?.id)

  // Al cambiar de estación se limpia la etiqueta elegida (pertenece a otra config).
  useEffect(() => {
    setEtiquetaId('')
  }, [estacion?.id])

  useEffect(() => {
    listarEstaciones()
      .then((lista) => setEstaciones(Array.isArray(lista) ? lista : []))
      .catch(() => setEstaciones([]))
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
      className={`inline-flex max-w-[7rem] items-center gap-1 rounded-lg border px-1.5 py-1 sm:max-w-[10rem] sm:px-2 ${
        estacion
          ? 'border-outline-variant bg-surface-container-lowest'
          : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
      }`}
    >
      <Icon name="local_hospital" className="shrink-0 text-[18px] text-primary" />
      <span className="sr-only">Estación</span>
      <select
        value={estacion?.id ?? ''}
        onChange={manejarCambioEstacion}
        aria-label="Estación de la salida"
        title={
          estacion
            ? `${estacion.codigo ? `${estacion.codigo} · ` : ''}${estacion.nombre ?? ''}`
            : 'Seleccione la estación'
        }
        className={`h-8 w-full min-w-0 truncate rounded-md bg-transparent text-label-sm font-semibold outline-none ${
          estacion ? 'text-on-surface' : 'text-amber-800 dark:text-amber-200'
        }`}
      >
        <option value="">Sin estación…</option>
        {estaciones.map((e) => (
          <option key={e.id} value={e.id}>
            {abreviarEstacion(e)}
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

          <label className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-1.5 py-1 sm:px-2">
            <Icon
              name="calendar_today"
              className="hidden text-[18px] text-primary sm:inline-block"
            />
            <input
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              aria-label="Fecha de la salida"
              className="h-8 w-[6.6rem] rounded-md bg-transparent text-xs font-semibold outline-none sm:w-auto sm:text-label-sm"
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
          onAbrirRegistroManual={() => setRegistroManualAbierto(true)}
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

      <ModalRegistroManual
        abierto={registroManualAbierto}
        onCerrar={() => setRegistroManualAbierto(false)}
        onRegistrado={() => {
          setRegistroManualAbierto(false)
          inputRef.current?.focus()
          mostrarToast({ tone: 'success', title: 'Expediente registrado manualmente' })
        }}
        etiqueta={etiquetas.find((e) => String(e.id) === String(etiquetaId)) ?? null}
        onGuardar={({ numeroExpediente, pacienteNombre }) =>
          registrarManual({
            numeroExpediente,
            pacienteNombre,
            etiqueta: etiquetas.find((e) => String(e.id) === String(etiquetaId)) ?? null,
          })
        }
      />

      <ModalGenerandoPdf abierto={generandoPdf} progreso={progresoPdf} />
    </ArchivoLayout>
  )
}
