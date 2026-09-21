import { useEffect, useRef, useState } from 'react'
import { Alert, EmptyState, Spinner } from '@/shared/components/ui'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { buscarExpedientePorCodigo } from '../api/archivoApi'
import { expedientesMock } from '../api/mockData'
import { metadatosEstado } from '../estadosExpediente'
import { resolverUsuarioArchivo } from '../identidadArchivo'
import { useExpedientes } from '../hooks/useExpedientes'
import ArchivoHeader from '../components/ArchivoHeader.jsx'
import FiltrosArchivo from '../components/FiltrosArchivo.jsx'
import ResumenEstados from '../components/ResumenEstados.jsx'
import ExpedienteCard from '../components/ExpedienteCard.jsx'
import ExpedienteDetalle from '../components/ExpedienteDetalle.jsx'
import ScannerExpediente from '../components/ScannerExpediente.jsx'

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
    resumen,
    total,
    avanzar,
    marcarNoLocalizado,
    crear,
  } = useExpedientes()

  const [seleccionado, setSeleccionado] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Guardas inmediatas (ref) contra doble tap/activación concurrente. Se
  // activan antes de esperar la operación async y se liberan en finally. No
  // dependen del re-render de React ni del atributo disabled.
  const operacionEnCurso = useRef(false)
  const busquedaEnCurso = useRef(false)

  // Al cambiar cualquier filtro, el expediente seleccionado puede dejar de
  // pertenecer al resultado: se cierra el detalle para no mostrar datos fuera
  // del listado actual.
  useEffect(() => {
    setSeleccionado(null)
  }, [fecha, clinicaId, medicoId])

  async function ejecutarOperacion(accion) {
    if (operacionEnCurso.current) return
    operacionEnCurso.current = true
    setProcesando(true)
    try {
      await accion()
    } finally {
      operacionEnCurso.current = false
      setProcesando(false)
    }
  }

  async function ejecutarBusqueda(valor) {
    const buscado = valor.trim()
    if (!buscado || busquedaEnCurso.current) return
    busquedaEnCurso.current = true
    try {
      const encontrado = await buscarExpedientePorCodigo(buscado)
      if (!encontrado) {
        mostrarToast({
          tone: 'error',
          title: 'Expediente no encontrado',
          message: 'Verifique el código escaneado.',
        })
        return
      }
      setSeleccionado(encontrado)
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

  async function manejarAvanzar() {
    if (!seleccionado) return
    await ejecutarOperacion(async () => {
      try {
        const actualizado = await avanzar(seleccionado.id)
        setSeleccionado(actualizado)
        mostrarToast({
          tone: 'success',
          title: 'Estado actualizado',
          message: `${actualizado.pacienteNombre} · ${metadatosEstado(actualizado.estado).etiqueta}`,
        })
      } catch (fallo) {
        mostrarToast({ tone: 'error', title: 'No se pudo avanzar', message: fallo.message })
      }
    })
  }

  async function manejarNoLocalizado() {
    if (!seleccionado) return
    await ejecutarOperacion(async () => {
      try {
        const actualizado = await marcarNoLocalizado(seleccionado.id)
        setSeleccionado(actualizado)
        mostrarToast({
          tone: 'warning',
          title: 'Expediente no localizado',
          message: 'Se requiere búsqueda por otro medio o preparar un expediente provisional.',
        })
      } catch (fallo) {
        mostrarToast({ tone: 'error', title: 'No se pudo actualizar', message: fallo.message })
      }
    })
  }

  async function manejarCrear() {
    if (!seleccionado) return
    await ejecutarOperacion(async () => {
      try {
        const creado = await crear(seleccionado.pacienteId)
        setSeleccionado(creado)
        mostrarToast({
          tone: 'success',
          title: 'Expediente físico creado',
          message: `${creado.pacienteNombre} · ${creado.numeroExpediente}`,
        })
      } catch (fallo) {
        mostrarToast({ tone: 'error', title: 'No se pudo crear', message: fallo.message })
      }
    })
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

        <ResumenEstados resumen={resumen} total={total} />

        <section aria-label="Listado de expedientes" aria-busy={cargando}>
          <h2 className="mb-3 text-headline-sm text-on-surface">Expedientes a preparar</h2>

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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {expedientes.map((expediente) => (
                <ExpedienteCard
                  key={expediente.id}
                  expediente={expediente}
                  activo={seleccionado?.id === expediente.id}
                  onSeleccionar={setSeleccionado}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ExpedienteDetalle
        expediente={seleccionado}
        abierto={Boolean(seleccionado)}
        onCerrar={() => setSeleccionado(null)}
        onAvanzar={manejarAvanzar}
        onNoLocalizado={manejarNoLocalizado}
        onCrear={manejarCrear}
        procesando={procesando}
      />
    </div>
  )
}
