import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Select, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { imprimirTicketTurno } from '@/shared/utils/impresionTicket'
import EnfermeriaEstacionLayout from '../components/EnfermeriaEstacionLayout.jsx'
import ClinicasSeguimiento from '../components/seguimiento/ClinicasSeguimiento.jsx'
import DevolucionesClinicas from '../components/seguimiento/DevolucionesClinicas.jsx'
import SalidaEnfermeriaArchivo from '../components/seguimiento/SalidaEnfermeriaArchivo.jsx'
import DetalleTurno from '../components/seguimiento/DetalleTurno.jsx'
import EtapasSeguimiento from '../components/seguimiento/EtapasSeguimiento.jsx'
import LibroSeguimiento from '../components/seguimiento/LibroSeguimiento.jsx'
import {
  ES_MODO_MOCK,
  ETAPA_PREVIA,
  ETAPAS_SEGUIMIENTO,
  nombreEtapa,
  nombreTipoRegistro,
} from '../api/seguimientoApi'
import { listarEstaciones } from '../api/enfermeriaApi'
import { useNavegacionFlechas } from '../hooks/useNavegacionFlechas'
import { useSeguimientoEnfermeria } from '../hooks/useSeguimientoEnfermeria'

function RelojTiempoReal() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <span className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-mono text-label-md font-semibold tabular-nums text-on-surface">
      {ahora.toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}
    </span>
  )
}

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

// Registro y seguimiento de turnos por especialidad, conectado al backend real.
export default function SeguimientoEnfermeriaPage() {
  const { estacion, seleccionarEstacion } = useEstacion()
  const fecha = useMemo(() => hoyIso(), [])
  const contenidoRef = useRef(null)
  useNavegacionFlechas(contenidoRef)
  const { mostrarToast } = useToast()

  const [estaciones, setEstaciones] = useState([])
  const [cargandoEstaciones, setCargandoEstaciones] = useState(true)
  const [errorEstaciones, setErrorEstaciones] = useState(null)

  const {
    libro,
    clinicas,
    error,
    recargar,
    registrar,
    avanzar,
    revertir,
    cambiarTipoRegistro,
    devolverClinica,
    deshacerDevolucion,
  } = useSeguimientoEnfermeria(estacion?.id ?? null, fecha)

  const [seleccion, setSeleccion] = useState(null)
  const [filtro, setFiltro] = useState(null)
  const [registrando, setRegistrando] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState(null)
  const [clinicaDestino, setClinicaDestino] = useState(null)
  const [focoEspecialidad, setFocoEspecialidad] = useState({ id: null, token: 0 })
  const [correlativoModal, setCorrelativoModal] = useState(null)
  const [procesandoClinicaId, setProcesandoClinicaId] = useState(null)
  const [flujoArchivoAbierto, setFlujoArchivoAbierto] = useState(false)
  const [flujoOculto, setFlujoOculto] = useState(() => {
    try {
      return localStorage.getItem('hro_seguimiento_flujo_oculto') === 'true'
    } catch {
      return false
    }
  })
  const dobleEnterRef = useRef(null)

  function alternarFlujo() {
    setFlujoOculto((valor) => {
      const nuevo = !valor
      try {
        localStorage.setItem('hro_seguimiento_flujo_oculto', String(nuevo))
      } catch {
        // sin storage: se ignora
      }
      return nuevo
    })
  }

  useEffect(() => {
    if (!correlativoModal) return undefined
    const timer = setTimeout(() => setCorrelativoModal(null), 5000)
    return () => clearTimeout(timer)
  }, [correlativoModal])

  useEffect(
    () => () => {
      if (dobleEnterRef.current) clearTimeout(dobleEnterRef.current.timer)
    },
    [],
  )

  useEffect(() => {
    let activo = true
    setCargandoEstaciones(true)
    setErrorEstaciones(null)

    listarEstaciones()
      .then((lista) => {
        if (activo) setEstaciones(Array.isArray(lista) ? lista : [])
      })
      .catch((fallo) => {
        if (activo) {
          setErrorEstaciones(fallo?.message ?? 'No se pudieron cargar las estaciones.')
        }
      })
      .finally(() => {
        if (activo) setCargandoEstaciones(false)
      })

    return () => {
      activo = false
    }
  }, [])

  // Si la sesión no trae estación (o quedó una que ya no existe), abre la primera.
  useEffect(() => {
    if (estaciones.length === 0) return
    const actual = estaciones.find((item) => String(item.id) === String(estacion?.id))
    if (actual) return
    const primera = estaciones[0]
    seleccionarEstacion({
      id: primera.id,
      codigo: primera.codigo,
      nombre: primera.nombre,
      ubicacion: primera.ubicacion,
    })
  }, [estaciones, estacion?.id, seleccionarEstacion])

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
    if (!focoEspecialidad.id) return
    contenidoRef.current?.querySelector(`[data-especialidad-id="${focoEspecialidad.id}"]`)?.focus()
  }, [focoEspecialidad])

  const opcionesEstacion = useMemo(
    () =>
      estaciones.map((item) => ({
        value: String(item.id),
        label: `${item.codigo ?? item.id} · ${item.nombre ?? ''}`,
      })),
    [estaciones],
  )

  const especialidades = useMemo(() => libro?.especialidades ?? [], [libro])

  const turnosPorClave = useMemo(() => {
    const mapa = new Map()
    especialidades.forEach((especialidad) => {
      especialidad.turnos.forEach((turno) => {
        mapa.set(`${especialidad.id}-${turno.numero}`, turno)
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
          return {
            numero,
            turno: turnosPorClave.get(`${especialidad.id}-${numero}`) ?? null,
          }
        })
        return {
          id: especialidad.id,
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
    const turno = turnosPorClave.get(`${seleccion.especialidadId}-${seleccion.numero}`) ?? null
    const especialidad = especialidades.find(
      (item) => String(item.id) === String(seleccion.especialidadId),
    )
    return { ...seleccion, turno, especialidadNombre: especialidad?.nombre ?? '' }
  }, [seleccion, turnosPorClave, especialidades])

  function enfocarEspecialidad(especialidadId) {
    if (especialidadId == null) return
    setFocoEspecialidad((actual) => ({
      id: especialidadId,
      token: actual.token + 1,
    }))
  }

  function siguienteCorrelativo(especialidad) {
    for (let numero = 1; numero <= especialidad.maximo; numero += 1) {
      if (!turnosPorClave.has(`${especialidad.id}-${numero}`)) return numero
    }
    return null
  }

  function clinicaDeTurno(turno) {
    if (!turno?.clinicaId) return null
    return {
      id: turno.clinicaId,
      numero: turno.clinicaNumero ?? null,
      nombre:
        turno.clinicaNombre ??
        (turno.clinicaNumero ? `Clínica ${turno.clinicaNumero}` : 'Clínica asignada'),
    }
  }

  function registrarConDobleEnter(accionNormal, accionPresentacion) {
    const ahora = Date.now()
    const pendiente = dobleEnterRef.current
    if (pendiente && ahora - pendiente.instante <= 280) {
      clearTimeout(pendiente.timer)
      dobleEnterRef.current = null
      accionPresentacion()
      return
    }
    if (pendiente) clearTimeout(pendiente.timer)
    const timer = setTimeout(() => {
      dobleEnterRef.current = null
      accionNormal()
    }, 280)
    dobleEnterRef.current = { timer, instante: ahora }
  }

  function activarEspecialidad(especialidadId, codigo, opciones = {}) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const especialidad = especialidades.find((item) => String(item.id) === String(especialidadId))
    if (!especialidad) return

    // En modo Registrado (o sin etapa elegida) Enter asigna el siguiente turno.
    if (!filtro || filtro === 'registrado') {
      if (opciones.tecla === 'Enter') {
        registrarConDobleEnter(
          () => registrarSiguiente(especialidad),
          () => registrarSiguiente(especialidad, 'presentacion'),
        )
      } else {
        registrarSiguiente(especialidad)
      }
      return
    }

    const previa = ETAPA_PREVIA[filtro]
    const turno = especialidad.turnos.find((item) => item.etapa === previa)
    if (!turno) {
      mostrarToast({
        tone: 'warning',
        title: `${especialidad.nombre}: no hay turnos en ${nombreEtapa(previa)} para ${nombreEtapa(filtro)}.`,
      })
      return
    }

    setSeleccion({
      especialidadId,
      codigo,
      numero: turno.numero,
    })

    if (filtro === 'en_clinica') {
      const clinica = clinicaDeTurno(turno) ?? clinicaDestino
      if (!clinica) {
        mostrarToast({
          tone: 'warning',
          title: 'Seleccione una clínica física como destino.',
        })
        return
      }
      asignarTurnoAClinica(turno, especialidadId, clinica)
      return
    }

    avanzarDirecto(turno, especialidadId)
  }

  function registrarSiguiente(especialidad, tipoForzado = null) {
    const numero = siguienteCorrelativo(especialidad)
    if (numero == null) {
      mostrarToast({
        tone: 'warning',
        title: `${especialidad.nombre}: no hay correlativos disponibles.`,
      })
      return
    }
    registrarDirecto(especialidad.id, especialidad.codigo, numero, tipoForzado)
  }

  function manejarEstacion(valor) {
    const elegida = estaciones.find((item) => String(item.id) === String(valor))
    if (!elegida) return
    seleccionarEstacion({
      id: elegida.id,
      codigo: elegida.codigo,
      nombre: elegida.nombre,
      ubicacion: elegida.ubicacion,
    })
    setSeleccion(null)
    setFiltro(null)
    setTipoRegistro(null)
    setClinicaDestino(null)
  }

  function seleccionar(especialidadId, codigo, numero) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const turno = turnosPorClave.get(`${especialidadId}-${numero}`) ?? null
    setSeleccion({ especialidadId, codigo, numero })

    if (!filtro) return

    if (filtro === 'registrado') {
      // Si ya está registrado, la selección habilita el editor de su tipo de
      // registro en el detalle del turno.
      if (turno) return
      registrarDirecto(especialidadId, codigo, numero)
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
      const clinica = clinicaDeTurno(turno) ?? clinicaDestino
      if (!clinica) {
        mostrarToast({
          tone: 'warning',
          title: 'Seleccione una clínica física como destino.',
        })
        return
      }
      asignarTurnoAClinica(turno, especialidadId, clinica)
      return
    }

    avanzarDirecto(turno, especialidadId)
  }

  async function ejecutarAccion(accion) {
    try {
      await accion()
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.message ?? 'No fue posible actualizar el turno.',
      })
    }
  }

  function registrarDirecto(especialidadId, codigo, numero, tipoForzado = null) {
    if (registrando) return
    const tipo = tipoForzado ?? tipoRegistro
    setRegistrando(true)
    ejecutarAccion(async () => {
      try {
        const creado = await registrar({
          estacionId: estacion?.id,
          especialidadId,
          codigo,
          numero,
          tipoRegistro: tipo,
          fecha,
        })
        setSeleccion({
          especialidadId: creado.especialidadId ?? especialidadId,
          codigo: creado.codigo ?? codigo,
          numero: creado.numero,
        })
        setTipoRegistro(null)
        setCorrelativoModal({
          codigo: creado.codigo ?? codigo,
          numero: creado.numero ?? numero,
        })
        enfocarEspecialidad(especialidadId)
        mostrarToast({
          tone: 'success',
          title: `Turno ${etiquetaTurno(creado.codigo ?? codigo, creado.numero)} registrado${
            tipo ? ` · ${nombreTipoRegistro(tipo)}` : ''
          }.`,
        })

        const especialidadNombre =
          especialidades.find((item) => String(item.id) === String(especialidadId))?.nombre ??
          codigo
        imprimirTicketTurno({
          turno: creado.numeroGeneral,
          especialidad: especialidadNombre,
          clinica: creado.clinicaNumero ?? creado.clinicaNombre ?? null,
        }).catch(() => {
          mostrarToast({
            tone: 'warning',
            title: `Turno ${etiquetaTurno(creado.codigo ?? codigo, creado.numero)} registrado, pero no se pudo imprimir el ticket.`,
            message:
              'Verifique que el agente de impresión (printer-agent/iniciar.bat) esté abierto.',
          })
        })
      } finally {
        setRegistrando(false)
      }
    })
  }

  function elegirTipoRegistro(tipo) {
    setTipoRegistro(tipo)
  }

  function cambiarFiltro(nuevo) {
    setFiltro(nuevo)
    setTipoRegistro(null)
    if (nuevo !== 'en_clinica') setClinicaDestino(null)
    if (nuevo === 'devuelto' || nuevo === 'archivo') setSeleccion(null)
    enfocarEspecialidad(filas[0]?.id)
  }

  async function registrarDevolucionEnClinica(clinica) {
    if (procesandoClinicaId != null) return
    setProcesandoClinicaId(clinica.id)
    try {
      const resumen = await devolverClinica(clinica.id)
      mostrarToast({
        tone: 'success',
        title: `${clinica.nombre}: devolución registrada`,
        message: `Pendientes: ${resumen?.pendientes ?? clinica.expedientesEnClinica ?? 0}`,
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.message ?? 'No se pudo registrar la devolución.',
      })
    } finally {
      setProcesandoClinicaId(null)
    }
  }

  async function deshacerDevolucionEnClinica(clinica) {
    if (procesandoClinicaId != null) return
    setProcesandoClinicaId(clinica.id)
    try {
      const resumen = await deshacerDevolucion(clinica.id)
      mostrarToast({
        tone: 'info',
        title: `${clinica.nombre}: devolución deshecha`,
        message: `Devueltos: ${resumen?.devueltos ?? clinica.devueltos ?? 0}`,
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.message ?? 'No se pudo deshacer la devolución.',
      })
    } finally {
      setProcesandoClinicaId(null)
    }
  }

  function asignarTurnoAClinica(turno, especialidadId, clinica) {
    ejecutarAccion(async () => {
      const actualizado = await avanzar(turno.id, {
        estadoBackend: turno.estadoBackend,
        estadoOptimista: 'en_clinica',
        clinica,
        clinicaId: clinica.id,
        fecha,
      })
      enfocarEspecialidad(especialidadId)
      mostrarToast({
        tone: 'success',
        title: `${etiquetaTurno(actualizado.codigo, actualizado.numero)} · ${nombreEtapa(
          actualizado.etapa,
        )} · ${clinica.nombre}`,
      })
    })
  }

  function avanzarDirecto(turno, especialidadId) {
    ejecutarAccion(async () => {
      const actualizado = await avanzar(turno.id, {
        estadoBackend: turno.estadoBackend,
        estadoOptimista: filtro,
        fecha,
      })
      enfocarEspecialidad(especialidadId)
      mostrarToast({
        tone: 'success',
        title: `${etiquetaTurno(actualizado.codigo, actualizado.numero)} · ${nombreEtapa(
          actualizado.etapa,
        )}`,
      })
    })
  }

  function cambiarTipoRegistroSeleccionado(tipo) {
    const turno = seleccionCompleta?.turno
    if (!turno) return
    ejecutarAccion(async () => {
      const actualizado = await cambiarTipoRegistro(turno.id, tipo)
      setSeleccion({
        especialidadId: actualizado.especialidadId ?? seleccionCompleta.especialidadId,
        codigo: actualizado.codigo ?? seleccionCompleta.codigo,
        numero: actualizado.numero ?? seleccionCompleta.numero,
      })
      mostrarToast({
        tone: 'success',
        title: `${etiquetaTurno(
          actualizado.codigo ?? seleccionCompleta.codigo,
          actualizado.numero ?? seleccionCompleta.numero,
        )} · ${tipo ? nombreTipoRegistro(tipo) : 'Sin marca de registro'}`,
      })
    })
  }

  function revertirSeleccionado() {
    if (!seleccionCompleta?.turno) return
    ejecutarAccion(async () => {
      const actualizado = await revertir(seleccionCompleta.turno.id)
      enfocarEspecialidad(seleccionCompleta.especialidadId)
      mostrarToast({
        tone: 'success',
        title: `Turno ${etiquetaTurno(actualizado.codigo, actualizado.numero)} revertido a ${nombreEtapa(
          actualizado.etapa,
        )}.`,
      })
    })
  }

  function elegirClinica(clinica) {
    if (filtro === 'en_clinica') {
      const misma = String(clinicaDestino?.id) === String(clinica.id)
      setClinicaDestino(misma ? null : clinica)
      mostrarToast({
        tone: misma ? 'info' : 'success',
        title: misma
          ? `Clínica ${clinica.nombre} liberada.`
          : `${clinica.nombre} seleccionada como destino.`,
        message: misma
          ? undefined
          : 'Ahora pulse los turnos registrados que desea enviar a esta clínica.',
      })
      return
    }

    const enClinica = especialidades
      .flatMap((especialidad) => especialidad.turnos)
      .filter((turno) => turno.etapa === 'en_clinica' && turno.clinicaId === clinica.id)
    mostrarToast({
      tone: 'info',
      title: `${clinica.nombre}: ${enClinica.length} expedientes en atención`,
      message: enClinica.length
        ? enClinica
            .slice(0, 6)
            .map((turno) => etiquetaTurno(turno.codigo, turno.numero))
            .join(', ')
        : undefined,
    })
  }

  const accionesBarra = (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Select
        ariaLabel="Estación de enfermería"
        value={estacion?.id != null ? String(estacion.id) : ''}
        onChange={manejarEstacion}
        options={opcionesEstacion}
        placeholder={cargandoEstaciones ? 'Cargando…' : 'Estación'}
        className="w-48 sm:w-60"
      />
      <span className="rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant">
        {ES_MODO_MOCK ? 'DEMO' : 'REAL'}
      </span>
      <RelojTiempoReal />
    </div>
  )

  const mostrarCarga = cargandoEstaciones || (estacion?.id != null && !libro)

  return (
    <EnfermeriaEstacionLayout
      tituloCentrado="Control de turnos y expedientes"
      acciones={accionesBarra}
    >
      <main ref={contenidoRef} className="mx-auto w-full max-w-7xl space-y-4 px-2 py-4">
        {errorEstaciones && (
          <Alert tone="error" title="No se pudieron cargar las estaciones">
            <div className="mt-2 flex items-center gap-3">
              <span>{errorEstaciones}</span>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

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

        {mostrarCarga ? (
          <div className="flex justify-center py-16">
            <Spinner label="Cargando libro de turnos…" />
          </div>
        ) : !estacion?.id ? (
          <EmptyState
            title="Seleccione una estación"
            description="Elija la estación de enfermería desde la cual se está abriendo esta jornada."
          />
        ) : filtro === 'archivo' ? (
          <div className="grid gap-3 lg:grid-cols-[130px_minmax(0,1fr)]">
            <aside className="space-y-1.5 md:-ml-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  Flujo de seguimiento
                </h2>
                <button
                  type="button"
                  onClick={() => setFlujoArchivoAbierto((valor) => !valor)}
                  aria-expanded={flujoArchivoAbierto}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-label-sm font-semibold text-on-surface-variant md:hidden"
                >
                  {flujoArchivoAbierto ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className={flujoArchivoAbierto ? 'block' : 'hidden md:block'}>
                <EtapasSeguimiento conteos={conteos} filtro={filtro} onFiltrar={cambiarFiltro} />
              </div>
            </aside>
            <SalidaEnfermeriaArchivo estacionId={estacion?.id} fecha={fecha} clinicas={clinicas} />
          </div>
        ) : filtro === 'devuelto' ? (
          <div className="grid gap-3 lg:grid-cols-[130px_minmax(0,1fr)]">
            <aside className="space-y-1.5 md:-ml-2">
              <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Flujo de seguimiento
              </h2>
              <EtapasSeguimiento conteos={conteos} filtro={filtro} onFiltrar={cambiarFiltro} />
            </aside>
            <DevolucionesClinicas
              clinicas={clinicas}
              onDevolver={registrarDevolucionEnClinica}
              onDeshacer={deshacerDevolucionEnClinica}
              procesandoId={procesandoClinicaId}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={alternarFlujo}
                aria-expanded={!flujoOculto}
                aria-controls="flujo-seguimiento"
                title={
                  flujoOculto
                    ? 'Mostrar el flujo de seguimiento'
                    : 'Ocultar el flujo de seguimiento'
                }
                className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-label-md font-semibold text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
              >
                <Icon
                  name={flujoOculto ? 'menu' : 'menu_open'}
                  className="text-[20px]"
                  aria-hidden="true"
                />
                {flujoOculto ? 'Mostrar flujo' : 'Ocultar flujo'}
              </button>
            </div>

            <div
              className={`grid gap-3 ${flujoOculto ? '' : 'lg:grid-cols-[minmax(0,1fr)_250px]'}`}
            >
              <div
                className={`grid gap-3 ${flujoOculto ? '' : 'md:grid-cols-[130px_minmax(0,1fr)]'}`}
              >
                {!flujoOculto && (
                  <aside id="flujo-seguimiento" className="space-y-1.5 md:-ml-2">
                    <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                      Flujo de seguimiento
                    </h2>
                    <EtapasSeguimiento
                      conteos={conteos}
                      filtro={filtro}
                      onFiltrar={cambiarFiltro}
                    />
                  </aside>
                )}

                <LibroSeguimiento
                  filas={filas}
                  seleccionId={seleccion ? `${seleccion.especialidadId}-${seleccion.numero}` : null}
                  filtro={filtro}
                  onSeleccionar={seleccionar}
                  onActivarEspecialidad={activarEspecialidad}
                  especialidadActivaId={seleccion?.especialidadId}
                  tipoRegistro={tipoRegistro}
                  onCambiarTipoRegistro={elegirTipoRegistro}
                  onIrACasillas={() => enfocarEspecialidad(filas[0]?.id)}
                  detalle={
                    <DetalleTurno
                      seleccion={seleccionCompleta}
                      especialidadNombre={seleccionCompleta?.especialidadNombre}
                      onRevertir={revertirSeleccionado}
                      onCambiarTipoRegistro={cambiarTipoRegistroSeleccionado}
                    />
                  }
                />
              </div>

              <ClinicasSeguimiento
                clinicas={clinicas}
                modoAsignacion={filtro === 'en_clinica'}
                clinicaSeleccionadaId={clinicaDestino?.id}
                onElegir={elegirClinica}
              />
            </div>
          </div>
        )}
      </main>

      {correlativoModal && (
        <div
          role="status"
          aria-live="assertive"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="rounded-2xl border-4 border-indigo-500 bg-surface-container-lowest px-12 py-7 text-center shadow-modal dark:border-indigo-400">
            <p className="text-label-md uppercase tracking-widest text-on-surface-variant">
              Correlativo
            </p>
            <p className="mt-1 text-6xl font-black tracking-tight text-indigo-600 dark:text-indigo-300">
              {`${correlativoModal.codigo}-${String(correlativoModal.numero).padStart(2, '0')}`}
            </p>
          </div>
        </div>
      )}
    </EnfermeriaEstacionLayout>
  )
}
