import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import EnfermeriaEstacionLayout from '../components/EnfermeriaEstacionLayout.jsx'
import ClinicasSeguimiento from '../components/seguimiento/ClinicasSeguimiento.jsx'
import DetalleTurno from '../components/seguimiento/DetalleTurno.jsx'
import EtapasSeguimiento from '../components/seguimiento/EtapasSeguimiento.jsx'
import LibroSeguimiento from '../components/seguimiento/LibroSeguimiento.jsx'
import {
  ETAPA_PREVIA,
  ETAPAS_SEGUIMIENTO,
  nombreEtapa,
  nombreTipoRegistro,
} from '../api/seguimientoApi'
import { useNavegacionFlechas } from '../hooks/useNavegacionFlechas'
import { useSeguimientoEnfermeria } from '../hooks/useSeguimientoEnfermeria'

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

// Registro y seguimiento de turnos por especialidad (mock en memoria).
export default function SeguimientoEnfermeriaPage() {
  const { libro, clinicas, cargando, error, recargar, registrar, avanzar } =
    useSeguimientoEnfermeria()
  const contenidoRef = useRef(null)
  useNavegacionFlechas(contenidoRef)
  const { mostrarToast } = useToast()

  const [seleccion, setSeleccion] = useState(null)
  const [filtro, setFiltro] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState(null)
  const [enfoqueTipo, setEnfoqueTipo] = useState(0)
  const [enfoqueCasillas, setEnfoqueCasillas] = useState(0)
  const [enfoqueRegistrado, setEnfoqueRegistrado] = useState(0)

  useEffect(() => {
    function iniciarEnRegistrado(evento) {
      if (evento.key !== 'Enter' || evento.defaultPrevented) return
      const objetivo = evento.target
      if (
        objetivo instanceof Element &&
        objetivo.closest('button, a, input, select, textarea, [contenteditable="true"]')
      ) {
        return
      }
      const etapa = contenidoRef.current?.querySelector('[data-testid="etapa-registrado"]')
      if (!etapa) return
      evento.preventDefault()
      etapa.focus()
    }

    document.addEventListener('keydown', iniciarEnRegistrado)
    return () => document.removeEventListener('keydown', iniciarEnRegistrado)
  }, [])

  useEffect(() => {
    if (enfoqueRegistrado === 0) return
    contenidoRef.current?.querySelector('[data-testid="etapa-registrado"]')?.focus()
  }, [enfoqueRegistrado])

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

  const filas = useMemo(
    () =>
      especialidades.map((especialidad) => {
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
      }),
    [especialidades, turnosPorClave],
  )

  const seleccionCompleta = useMemo(() => {
    if (!seleccion) return null
    const turno = turnosPorClave.get(`${seleccion.codigo}-${seleccion.numero}`) ?? null
    const especialidad = especialidades.find((item) => item.codigo === seleccion.codigo)
    return { ...seleccion, turno, especialidadNombre: especialidad?.nombre ?? '' }
  }, [seleccion, turnosPorClave, especialidades])

  const puedeRepartir = filtro === 'en_clinica' && seleccionCompleta?.turno?.etapa === 'recibido'

  function seleccionar(codigo, numero) {
    if (procesando) return
    const turno = turnosPorClave.get(`${codigo}-${numero}`) ?? null
    setSeleccion({ codigo, numero })

    if (!filtro) return

    if (filtro === 'registrado') {
      if (turno) {
        mostrarToast({
          tone: 'info',
          title: `El turno ${etiquetaTurno(codigo, numero)} ya está registrado.`,
        })
        return
      }
      registrarDirecto(codigo, numero)
      return
    }

    if (!turno) {
      mostrarToast({
        tone: 'warning',
        title: `La casilla ${etiquetaTurno(codigo, numero)} está vacía. Regístrela antes de marcarla como ${nombreEtapa(filtro)}.`,
      })
      return
    }

    const previa = ETAPA_PREVIA[filtro]
    if (turno.etapa !== previa) {
      mostrarToast({
        tone: 'warning',
        title: `Para marcar ${nombreEtapa(filtro)}, el turno debe estar ${nombreEtapa(previa)}.`,
      })
      return
    }

    if (filtro === 'en_clinica') {
      mostrarToast({
        tone: 'info',
        title: 'Seleccione una clínica de la parte inferior para distribuir este expediente.',
      })
      return
    }

    avanzarDirecto(turno)
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

  function registrarDirecto(codigo, numero) {
    const tipo = tipoRegistro
    ejecutarAccion(async () => {
      const creado = await registrar(codigo, numero, { tipoRegistro: tipo })
      setSeleccion({ codigo, numero })
      setTipoRegistro(null)
      setEnfoqueRegistrado((valor) => valor + 1)
      mostrarToast({
        tone: 'success',
        title: `Turno ${etiquetaTurno(creado.codigo, creado.numero)} registrado${
          tipo ? ` · ${nombreTipoRegistro(tipo)}` : ''
        }.`,
      })
    })
  }

  function elegirTipoRegistro(tipo) {
    setTipoRegistro(tipo)
    setEnfoqueCasillas((valor) => valor + 1)
  }

  function cambiarFiltro(nuevo) {
    setFiltro(nuevo)
    setTipoRegistro(null)
    if (nuevo === 'registrado') setEnfoqueTipo((valor) => valor + 1)
  }

  function avanzarDirecto(turno) {
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

  return (
    <EnfermeriaEstacionLayout tituloCentrado="Control de turnos y expedientes">
      <main ref={contenidoRef} className="mx-auto w-full max-w-7xl space-y-4 px-2 py-4">
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
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="grid gap-3 md:grid-cols-[130px_minmax(0,1fr)]">
                <aside className="space-y-1.5 md:-ml-2">
                  <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                    Flujo de seguimiento
                  </h2>
                  <EtapasSeguimiento conteos={conteos} filtro={filtro} onFiltrar={cambiarFiltro} />
                </aside>

                <LibroSeguimiento
                  filas={filas}
                  seleccionId={seleccion ? `${seleccion.codigo}-${seleccion.numero}` : null}
                  filtro={filtro}
                  onSeleccionar={seleccionar}
                  tipoRegistro={tipoRegistro}
                  onCambiarTipoRegistro={elegirTipoRegistro}
                  enfoqueTipo={enfoqueTipo}
                  enfoqueCasillas={enfoqueCasillas}
                  onIrACasillas={() => setEnfoqueCasillas((valor) => valor + 1)}
                  detalle={
                    <DetalleTurno
                      seleccion={seleccionCompleta}
                      especialidadNombre={seleccionCompleta?.especialidadNombre}
                    />
                  }
                />
              </div>

              <ClinicasSeguimiento
                clinicas={clinicas}
                puedeRepartir={puedeRepartir}
                onElegir={elegirClinica}
              />
            </div>
          </>
        )}
      </main>
    </EnfermeriaEstacionLayout>
  )
}
