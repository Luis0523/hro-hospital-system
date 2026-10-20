import { useMemo, useState } from 'react'
import { Alert, Button, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import EnfermeriaEstacionLayout from '../components/EnfermeriaEstacionLayout.jsx'
import ClinicasSeguimiento from '../components/seguimiento/ClinicasSeguimiento.jsx'
import DetalleTurno from '../components/seguimiento/DetalleTurno.jsx'
import EtapasSeguimiento from '../components/seguimiento/EtapasSeguimiento.jsx'
import LibroSeguimiento from '../components/seguimiento/LibroSeguimiento.jsx'
import { ETAPAS_SEGUIMIENTO, nombreEtapa } from '../api/seguimientoApi'
import { useSeguimientoEnfermeria } from '../hooks/useSeguimientoEnfermeria'

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

// Registro y seguimiento de turnos por especialidad (mock en memoria).
export default function SeguimientoEnfermeriaPage() {
  const { libro, clinicas, cargando, error, recargar, registrar, avanzar } =
    useSeguimientoEnfermeria()
  const { mostrarToast } = useToast()

  const [seleccion, setSeleccion] = useState(null)
  const [filtro, setFiltro] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [procesando, setProcesando] = useState(false)

  const especialidades = useMemo(() => libro?.especialidades ?? [], [libro])

  const turnosPorClave = useMemo(() => {
    const mapa = new Map()
    especialidades.forEach((especialidad) => {
      especialidad.turnos.forEach((turno) => {
        mapa.set(`${turno.codigo}-${turno.numero}`, turno)
      })
    })
    return mapa
  }, [especialidades])

  const conteos = useMemo(() => {
    const base = Object.fromEntries(ETAPAS_SEGUIMIENTO.map((etapa) => [etapa.id, 0]))
    especialidades.forEach((especialidad) => {
      especialidad.turnos.forEach((turno) => {
        base[turno.etapa] = (base[turno.etapa] ?? 0) + 1
      })
    })
    return base
  }, [especialidades])

  const filas = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase()
    return especialidades
      .map((especialidad) => {
        const slots = Array.from({ length: especialidad.maximo }, (_, indice) => {
          const numero = indice + 1
          return { numero, turno: turnosPorClave.get(`${especialidad.codigo}-${numero}`) ?? null }
        })
        return {
          codigo: especialidad.codigo,
          nombre: especialidad.nombre,
          maximo: especialidad.maximo,
          registrados: especialidad.turnos.length,
          slots,
        }
      })
      .filter((fila) => {
        if (!consulta) return true
        if (`${fila.nombre} ${fila.codigo}`.toLowerCase().includes(consulta)) return true
        return fila.slots.some((slot) =>
          etiquetaTurno(fila.codigo, slot.numero).toLowerCase().includes(consulta),
        )
      })
  }, [especialidades, turnosPorClave, busqueda])

  const seleccionCompleta = useMemo(() => {
    if (!seleccion) return null
    const turno = turnosPorClave.get(`${seleccion.codigo}-${seleccion.numero}`) ?? null
    const especialidad = especialidades.find((item) => item.codigo === seleccion.codigo)
    return { ...seleccion, turno, especialidadNombre: especialidad?.nombre ?? '' }
  }, [seleccion, turnosPorClave, especialidades])

  const puedeRepartir = seleccionCompleta?.turno?.etapa === 'recibido'

  function seleccionar(codigo, numero) {
    setSeleccion({ codigo, numero })
  }

  async function ejecutarAccion(accion) {
    if (procesando) return
    setProcesando(true)
    try {
      await accion()
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.message ?? 'No fue posible actualizar el turno.',
      })
    } finally {
      setProcesando(false)
    }
  }

  function manejarAccion() {
    if (!seleccionCompleta) return
    const { codigo, numero, turno } = seleccionCompleta

    if (!turno) {
      ejecutarAccion(async () => {
        const creado = await registrar(codigo, numero)
        mostrarToast({
          tone: 'success',
          title: `Turno ${etiquetaTurno(creado.codigo, creado.numero)} registrado.`,
        })
      })
      return
    }

    if (turno.etapa === 'recibido') {
      mostrarToast({
        tone: 'info',
        title: 'Seleccione una clínica de la parte inferior para distribuir este expediente.',
      })
      return
    }

    ejecutarAccion(async () => {
      const actualizado = await avanzar(turno.id)
      mostrarToast({
        tone: 'success',
        title: `${etiquetaTurno(actualizado.codigo, actualizado.numero)} · ${nombreEtapa(
          actualizado.etapa,
        )}`,
      })
    })
  }

  function elegirClinica(clinica) {
    if (puedeRepartir && seleccionCompleta?.turno) {
      ejecutarAccion(async () => {
        const actualizado = await avanzar(seleccionCompleta.turno.id, { clinicaId: clinica.id })
        mostrarToast({
          tone: 'success',
          title: `${etiquetaTurno(actualizado.codigo, actualizado.numero)} · ${nombreEtapa(
            actualizado.etapa,
          )} · Clínica ${clinica.id}`,
        })
      })
      return
    }

    const enClinica = especialidades
      .flatMap((especialidad) => especialidad.turnos)
      .filter((turno) => turno.etapa === 'en_clinica' && turno.clinicaId === clinica.id)
    mostrarToast({
      tone: 'info',
      title: `Clínica ${clinica.id}: ${enClinica.length} expedientes en atención`,
      message: enClinica.length
        ? enClinica
            .slice(0, 6)
            .map((turno) => etiquetaTurno(turno.codigo, turno.numero))
            .join(', ')
        : undefined,
    })
  }

  function registrarSiguiente() {
    for (const especialidad of especialidades) {
      for (let numero = 1; numero <= especialidad.maximo; numero += 1) {
        if (!turnosPorClave.has(`${especialidad.codigo}-${numero}`)) {
          setFiltro(null)
          setBusqueda('')
          setSeleccion({ codigo: especialidad.codigo, numero })
          mostrarToast({
            tone: 'info',
            title: `Correlativo ${etiquetaTurno(especialidad.codigo, numero)} listo para registrar.`,
          })
          return
        }
      }
    }
    mostrarToast({ tone: 'warning', title: 'No hay correlativos disponibles por ahora.' })
  }

  function limpiarFiltros() {
    setFiltro(null)
    setBusqueda('')
  }

  return (
    <EnfermeriaEstacionLayout>
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label-sm uppercase tracking-widest text-primary">
              Consulta Externa · Segundo Nivel
            </p>
            <h1 className="mt-1 text-headline-lg text-on-surface">
              Control de turnos y expedientes
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Recepción, distribución y devolución · Cuaderno digital por especialidad
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
              PROTOTIPO · DATOS DE EJEMPLO
            </span>
            <span className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-sm text-on-surface">
              Jornada de hoy
            </span>
          </div>
        </header>

        {error && (
          <Alert tone="error" title="No se pudo cargar el libro de turnos">
            <div className="mt-2 flex items-center gap-3">
              <span>{error}</span>
              <Button variant="secondary" size="sm" onClick={recargar}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {cargando ? (
          <div className="flex justify-center py-16">
            <Spinner label="Cargando libro de turnos…" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="mb-2 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Flujo de seguimiento · Seleccione una etapa para resaltarla
              </h2>
              <EtapasSeguimiento conteos={conteos} filtro={filtro} onFiltrar={setFiltro} />
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
              <LibroSeguimiento
                filas={filas}
                totalRegistrados={libro?.totalRegistrados ?? 0}
                seleccionId={seleccion ? `${seleccion.codigo}-${seleccion.numero}` : null}
                filtro={filtro}
                busqueda={busqueda}
                onBuscar={setBusqueda}
                onLimpiar={limpiarFiltros}
                onRegistrar={registrarSiguiente}
                onSeleccionar={seleccionar}
              />
              <DetalleTurno
                seleccion={seleccionCompleta}
                especialidadNombre={seleccionCompleta?.especialidadNombre}
                onAccion={manejarAccion}
                procesando={procesando}
              />
            </div>

            <ClinicasSeguimiento
              clinicas={clinicas}
              puedeRepartir={puedeRepartir}
              onElegir={elegirClinica}
            />

            <footer className="flex flex-wrap justify-between gap-2 pt-2 text-label-sm text-on-surface-variant">
              <span>
                Los números corresponden a correlativos de atención, no a números de expediente.
              </span>
              <span>Vista demostrativa sin conexión a base de datos · SIGHO / HRO</span>
            </footer>
          </>
        )}
      </main>
    </EnfermeriaEstacionLayout>
  )
}
