import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Spinner } from '@/shared/components/ui'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { buscarExpedientePorCodigo } from '../api/archivoApi'
import { expedientesMock } from '../api/mockData'
import { resolverUsuarioArchivo } from '../identidadArchivo'
import { useExpedientes } from '../hooks/useExpedientes'
import ArchivoHeader from '../components/ArchivoHeader.jsx'
import FiltrosArchivo from '../components/FiltrosArchivo.jsx'
import ResumenEstados from '../components/ResumenEstados.jsx'
import ListadoCompactoExpediente from '../components/ListadoCompactoExpediente.jsx'
import ScannerExpediente from '../components/ScannerExpediente.jsx'

// Orden estable por hora de cita ascendente. Los expedientes sin hora quedan al
// final para no alterar el orden original de forma arbitraria.
function ordenarPorHora(expedientes) {
  return [...expedientes].sort((a, b) =>
    (a.horaEstimada ?? '99:99:99').localeCompare(b.horaEstimada ?? '99:99:99'),
  )
}

// Sección de checklist reutilizada para "Pendientes de localizar" y
// "Expedientes localizados". El marcado es puramente visual: el estado real del
// expediente no cambia. `resultadoBusqueda` solo resalta la fila encontrada por
// el buscador, sin moverla de grupo ni marcarla.
function SeccionChecklist({
  titulo,
  icono,
  expedientes,
  localizados,
  resultadoBusqueda,
  onToggle,
  vacio,
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-2 pt-1">
        <h2 className="flex items-center gap-2 text-title-md text-on-surface">
          <Icon name={icono} className="text-[20px] text-primary" />
          {titulo}
        </h2>
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
          {expedientes.length}
        </span>
      </div>

      {expedientes.length === 0 ? (
        <p className="px-2 pb-2 text-body-sm text-on-surface-variant">{vacio}</p>
      ) : (
        <ul className="space-y-2">
          {expedientes.map((expediente) => (
            <ListadoCompactoExpediente
              key={expediente.id}
              expediente={expediente}
              seleccionado={localizados.has(expediente.id)}
              resaltado={expediente.id === resultadoBusqueda}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ArchivoPage() {
  const { usuario } = useAuth()
  const { mostrarToast } = useToast()
  const usuarioArchivo = resolverUsuarioArchivo(usuario)
  const {
    fecha,
    setFecha,
    clinicaId,
    setClinicaId,
    medicoId,
    setMedicoId,
    clinicas,
    medicos,
    expedientes,
    cargando,
    error,
    total,
  } = useExpedientes()

  // Estado LOCAL del checklist: conjunto de ids marcados como localizados
  // durante la sesión. No se persiste, no toca mockData y no llama a la API.
  const [localizados, setLocalizados] = useState(() => new Set())
  // Id del expediente encontrado por el buscador. Solo resalta la fila; no la
  // marca ni la cambia de grupo.
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null)
  const [codigo, setCodigo] = useState('')

  // Guarda inmediata contra doble envío del formulario de búsqueda.
  const busquedaEnCurso = useRef(false)

  // Al cambiar cualquier filtro, el conjunto de resultados cambia: se reinicia
  // el checklist y se limpia el resaltado para no arrastrar datos fuera del
  // listado actual.
  useEffect(() => {
    setResultadoBusqueda(null)
    setLocalizados(new Set())
  }, [fecha, clinicaId, medicoId])

  const { pendientes, localizadosLista } = useMemo(() => {
    const pend = []
    const loc = []
    for (const expediente of expedientes) {
      if (localizados.has(expediente.id)) {
        loc.push(expediente)
      } else {
        pend.push(expediente)
      }
    }
    return { pendientes: ordenarPorHora(pend), localizadosLista: ordenarPorHora(loc) }
  }, [expedientes, localizados])

  // Lleva el foco/scroll a la fila encontrada por el buscador. `scrollIntoView`
  // no existe en jsdom, por eso se invoca de forma opcional.
  useEffect(() => {
    if (resultadoBusqueda == null) return
    const fila = document.querySelector(`[data-expediente-id="${resultadoBusqueda}"]`)
    fila?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    fila?.querySelector('input[type="checkbox"]')?.focus()
  }, [resultadoBusqueda])

  function alternarLocalizado(id) {
    setLocalizados((anterior) => {
      const siguiente = new Set(anterior)
      if (siguiente.has(id)) {
        siguiente.delete(id)
      } else {
        siguiente.add(id)
      }
      return siguiente
    })
  }

  async function ejecutarBusqueda(valor) {
    const buscado = valor.trim()
    if (!buscado || busquedaEnCurso.current) return
    busquedaEnCurso.current = true
    try {
      const encontrado = await buscarExpedientePorCodigo(buscado)
      if (!encontrado) {
        setResultadoBusqueda(null)
        mostrarToast({
          tone: 'error',
          title: 'Expediente no encontrado',
          message: 'Verifique el código escaneado.',
        })
        return
      }

      const visible = expedientes.some((expediente) => expediente.id === encontrado.id)
      if (!visible) {
        setResultadoBusqueda(null)
        mostrarToast({
          tone: 'warning',
          title: 'Expediente fuera del listado',
          message: 'El código existe, pero no aparece con los filtros actuales.',
        })
        return
      }

      // Solo se resalta la fila. El checkbox permanece intacto y el usuario
      // decide manualmente si la marca como localizada.
      setResultadoBusqueda(encontrado.id)
      setCodigo('')
    } catch (fallo) {
      mostrarToast({ tone: 'error', title: 'Error de búsqueda', message: fallo.message })
    } finally {
      busquedaEnCurso.current = false
    }
  }

  function manejarBusqueda(event) {
    event.preventDefault()
    ejecutarBusqueda(codigo)
  }

  function simularScan() {
    const conCodigo = expedientesMock.find((expediente) => expediente.codigo)
    if (!conCodigo) return
    setCodigo(conCodigo.codigo)
    ejecutarBusqueda(conCodigo.codigo)
  }

  return (
    <div className="min-h-screen bg-surface pb-10">
      <ArchivoHeader usuario={usuarioArchivo} />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <ScannerExpediente
          value={codigo}
          onChange={setCodigo}
          onSubmit={manejarBusqueda}
          onSimular={simularScan}
        />

        <FiltrosArchivo
          fecha={fecha}
          onFecha={setFecha}
          clinicaId={clinicaId}
          onClinica={setClinicaId}
          medicoId={medicoId}
          onMedico={setMedicoId}
          clinicas={clinicas}
          medicos={medicos}
        />

        <ResumenEstados
          total={total}
          pendientes={pendientes.length}
          localizados={localizadosLista.length}
        />

        <section aria-label="Preparación de expedientes" aria-busy={cargando} className="space-y-4">
          {cargando ? (
            <Spinner label="Cargando expedientes..." />
          ) : error ? (
            <Alert tone="error" title="No se pudieron cargar los expedientes">
              {error.message}
            </Alert>
          ) : expedientes.length === 0 ? (
            <EmptyState
              title="Sin expedientes para esta fecha"
              description="Pruebe con otra fecha, clínica o médico."
            />
          ) : (
            <>
              <SeccionChecklist
                titulo="Pendientes de localizar"
                icono="pending_actions"
                expedientes={pendientes}
                localizados={localizados}
                resultadoBusqueda={resultadoBusqueda}
                onToggle={alternarLocalizado}
                vacio="No quedan expedientes pendientes."
              />
              <SeccionChecklist
                titulo="Expedientes localizados"
                icono="check_circle"
                expedientes={localizadosLista}
                localizados={localizados}
                resultadoBusqueda={resultadoBusqueda}
                onToggle={alternarLocalizado}
                vacio="Todavía no se ha localizado ningún expediente."
              />
            </>
          )}
        </section>

        <section
          aria-label="Acciones del día"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-title-md text-on-surface">Acciones del día</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Guardado e impresión disponibles en una fase posterior (SCRUM-96).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" disabled title="Disponible en una fase posterior (SCRUM-96)">
              <Icon name="save" className="text-[18px]" />
              Guardar resumen del día
            </Button>
            <Button
              variant="secondary"
              disabled
              title="Disponible en una fase posterior (SCRUM-96)"
            >
              <Icon name="print" className="text-[18px]" />
              Imprimir / generar PDF
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
