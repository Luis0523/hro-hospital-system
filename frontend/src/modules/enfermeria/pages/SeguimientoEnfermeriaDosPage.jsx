import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, EmptyState, Select, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import EnfermeriaEstacionLayout from '../components/EnfermeriaEstacionLayout.jsx'
import ClinicasSeguimiento from '../components/seguimiento/ClinicasSeguimiento.jsx'
import DetalleTurno from '../components/seguimiento/DetalleTurno.jsx'
import EtapasSeguimiento from '../components/seguimiento/EtapasSeguimiento.jsx'
import LibroSeguimiento from '../components/seguimiento/LibroSeguimiento.jsx'
import {
  ES_MODO_MOCK,
  ETAPA_PREVIA,
  ETAPAS_SEGUIMIENTO,
  listarAsignacionesClinicas,
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
export default function SeguimientoEnfermeriaDosPage() {
  const { estacion, seleccionarEstacion } = useEstacion()
  const fecha = useMemo(() => hoyIso(), [])
  const contenidoRef = useRef(null)
  useNavegacionFlechas(contenidoRef)
  const { mostrarToast } = useToast()

  const [estaciones, setEstaciones] = useState([])
  const [cargandoEstaciones, setCargandoEstaciones] = useState(true)
  const [errorEstaciones, setErrorEstaciones] = useState(null)

  const { libro, clinicas, error, recargar, registrar, avanzar, revertir, cambiarClinica } =
    useSeguimientoEnfermeria(estacion?.id ?? null, fecha)

  const [seleccion, setSeleccion] = useState(null)
  const [filtro, setFiltro] = useState(null)
  const [registrando, setRegistrando] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState(null)
  const [clinicaDestino, setClinicaDestino] = useState(null)
  const [focoEspecialidad, setFocoEspecialidad] = useState({ id: null, token: 0 })
  const [asignacionesVista, setAsignacionesVista] = useState([])
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(true)
  const [tokenAsignaciones, setTokenAsignaciones] = useState(0)
  const [registroPendiente, setRegistroPendiente] = useState(null)
  const [cambioClinicaActivo, setCambioClinicaActivo] = useState(false)
  const [focoClinicas, setFocoClinicas] = useState(0)

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

  useEffect(() => {
    let activo = true
    setCargandoAsignaciones(true)
    listarAsignacionesClinicas(fecha)
      .then((lista) => {
        if (activo) setAsignacionesVista(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (activo) setAsignacionesVista([])
      })
      .finally(() => {
        if (activo) setCargandoAsignaciones(false)
      })
    return () => {
      activo = false
    }
  }, [fecha, tokenAsignaciones])

  useEffect(() => {
    setCambioClinicaActivo(false)
  }, [seleccion?.especialidadId, seleccion?.numero, filtro])

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

  const clinicasPorEspecialidad = useMemo(() => {
    const mapa = new Map()
    for (const item of asignacionesVista) {
      const clinicaId = item.espacioFisicoId ?? item.id
      if (clinicaId == null) continue
      for (const asignacion of item.asignaciones ?? []) {
        const clave = String(asignacion.especialidadId)
        if (!mapa.has(clave)) mapa.set(clave, new Set())
        mapa.get(clave).add(String(clinicaId))
      }
    }
    return mapa
  }, [asignacionesVista])

  const idsClinicasElegibles = useMemo(() => {
    if (cambioClinicaActivo && seleccion?.especialidadId != null) {
      return clinicasPorEspecialidad.get(String(seleccion.especialidadId)) ?? new Set()
    }
    if (filtro === 'registrado') {
      if (!registroPendiente) return new Set()
      return clinicasPorEspecialidad.get(String(registroPendiente.especialidadId)) ?? new Set()
    }
    if (filtro === 'en_clinica' && seleccionCompleta?.turno) {
      const especialidadId =
        seleccionCompleta.turno.especialidadId ?? seleccionCompleta.especialidadId
      return clinicasPorEspecialidad.get(String(especialidadId)) ?? new Set()
    }
    return null
  }, [
    cambioClinicaActivo,
    clinicasPorEspecialidad,
    filtro,
    registroPendiente,
    seleccion?.especialidadId,
    seleccionCompleta,
  ])

  const esElegibleClinica = useCallback(
    (clinica) => !idsClinicasElegibles || idsClinicasElegibles.has(String(clinica.id)),
    [idsClinicasElegibles],
  )

  function clinicasElegiblesPara(especialidadId) {
    const ids = clinicasPorEspecialidad.get(String(especialidadId)) ?? new Set()
    return clinicas.filter((clinica) => ids.has(String(clinica.id)))
  }

  function clinicaDelTurno(turno) {
    if (!turno) return null
    const encontrada = clinicas.find((clinica) => String(clinica.id) === String(turno.clinicaId))
    if (encontrada) return encontrada
    if (turno.clinicaId == null) return null
    return {
      id: turno.clinicaId,
      nombre: turno.clinicaNombre ?? `Clínica ${turno.clinicaNumero ?? turno.clinicaId}`,
    }
  }

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

  function activarEspecialidad(especialidadId, codigo) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const especialidad = especialidades.find((item) => String(item.id) === String(especialidadId))
    if (!especialidad) return

    if (!filtro || filtro === 'registrado') {
      iniciarRegistro(especialidad)
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
      const clinica = clinicaDestino ?? clinicaDelTurno(turno)
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

  function iniciarRegistro(especialidad, numero = null) {
    const correlativo = numero ?? siguienteCorrelativo(especialidad)
    if (correlativo == null) {
      mostrarToast({
        tone: 'warning',
        title: `${especialidad.nombre}: no hay correlativos disponibles.`,
      })
      return
    }

    const elegibles = clinicasElegiblesPara(especialidad.id)
    if (elegibles.length === 0) {
      registrarDirecto(especialidad.id, especialidad.codigo, correlativo, null)
      return
    }
    if (elegibles.length === 1) {
      registrarDirecto(especialidad.id, especialidad.codigo, correlativo, elegibles[0])
      return
    }

    setSeleccion({
      especialidadId: especialidad.id,
      codigo: especialidad.codigo,
      numero: correlativo,
    })
    setRegistroPendiente({
      especialidadId: especialidad.id,
      codigo: especialidad.codigo,
      numero: correlativo,
      nombre: especialidad.nombre,
    })
    setClinicaDestino(null)
    setCambioClinicaActivo(false)
    setFocoClinicas((valor) => valor + 1)
    mostrarToast({
      tone: 'info',
      title: `Seleccione la clínica para ${especialidad.nombre}.`,
      message: 'Las clínicas no asignadas a la especialidad están deshabilitadas.',
    })
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
    setRegistroPendiente(null)
    setCambioClinicaActivo(false)
  }

  function seleccionar(especialidadId, codigo, numero) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const turno = turnosPorClave.get(`${especialidadId}-${numero}`) ?? null
    setSeleccion({ especialidadId, codigo, numero })

    if (!filtro) return

    if (filtro === 'registrado') {
      if (turno) {
        mostrarToast({
          tone: 'info',
          title: `El turno ${etiquetaTurno(codigo, numero)} ya está registrado.`,
        })
        return
      }
      const especialidad = especialidades.find((item) => String(item.id) === String(especialidadId))
      if (especialidad) iniciarRegistro(especialidad, numero)
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
      const clinica = clinicaDestino ?? clinicaDelTurno(turno)
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

  function registrarDirecto(especialidadId, codigo, numero, clinica = null) {
    if (registrando) return
    const tipo = tipoRegistro
    setRegistrando(true)
    ejecutarAccion(async () => {
      try {
        const creado = await registrar({
          estacionId: estacion?.id,
          especialidadId,
          codigo,
          numero,
          tipoRegistro: tipo,
          espacioFisicoId: clinica?.id ?? null,
          fecha,
        })
        setSeleccion({
          especialidadId: creado.especialidadId ?? especialidadId,
          codigo: creado.codigo ?? codigo,
          numero: creado.numero,
        })
        setRegistroPendiente(null)
        setCambioClinicaActivo(false)
        setTipoRegistro(null)
        enfocarEspecialidad(especialidadId)
        mostrarToast({
          tone: 'success',
          title: `Turno ${etiquetaTurno(creado.codigo ?? codigo, creado.numero)} registrado${
            tipo ? ` · ${nombreTipoRegistro(tipo)}` : ''
          }${clinica ? ` · ${clinica.nombre}` : ''}.`,
          message: clinica
            ? undefined
            : 'Sin clínica asignada. Puede asignarla desde el detalle antes de En clínica.',
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
    setClinicaDestino(null)
    setRegistroPendiente(null)
    setCambioClinicaActivo(false)
    enfocarEspecialidad(filas[0]?.id)
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

  function iniciarCambioClinica() {
    const turno = seleccionCompleta?.turno
    if (!turno) return
    const estado = turno.estadoBackend ?? turno.etapa
    if (!['registrado', 'recibido'].includes(estado)) {
      mostrarToast({
        tone: 'warning',
        title: 'La clínica solo se puede cambiar antes de En clínica.',
      })
      return
    }
    setRegistroPendiente(null)
    setCambioClinicaActivo(true)
    setClinicaDestino(null)
    setFocoClinicas((valor) => valor + 1)
    mostrarToast({
      tone: 'info',
      title: `Seleccione la nueva clínica para ${etiquetaTurno(
        turno.codigo ?? seleccionCompleta.codigo,
        turno.numero ?? seleccionCompleta.numero,
      )}.`,
    })
  }

  function elegirClinica(clinica) {
    if (cambioClinicaActivo && seleccionCompleta?.turno) {
      const turno = seleccionCompleta.turno
      ejecutarAccion(async () => {
        const actualizado = await cambiarClinica(turno.id, clinica.id)
        setSeleccion({
          especialidadId: actualizado.especialidadId ?? seleccionCompleta.especialidadId,
          codigo: actualizado.codigo ?? seleccionCompleta.codigo,
          numero: actualizado.numero ?? seleccionCompleta.numero,
        })
        setCambioClinicaActivo(false)
        setClinicaDestino(null)
        enfocarEspecialidad(seleccionCompleta.especialidadId)
        mostrarToast({
          tone: 'success',
          title: `Clínica actualizada a ${clinica.nombre}.`,
          message: 'Recuerde que el ticket impreso puede mostrar la clínica anterior.',
        })
      })
      return
    }

    if (filtro === 'registrado') {
      if (!registroPendiente) {
        mostrarToast({
          tone: 'info',
          title: 'Elija primero una especialidad para habilitar sus clínicas.',
        })
        return
      }
      registrarDirecto(
        registroPendiente.especialidadId,
        registroPendiente.codigo,
        registroPendiente.numero,
        clinica,
      )
      return
    }

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
          : 'Ahora pulse los turnos recibidos que desea enviar a esta clínica.',
      })
      return
    }

    const enClinica = especialidades
      .flatMap((especialidad) => especialidad.turnos)
      .filter(
        (turno) => turno.etapa === 'en_clinica' && String(turno.clinicaId) === String(clinica.id),
      )
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

  function recargarTodo() {
    recargar()
    setTokenAsignaciones((valor) => valor + 1)
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

  const mostrarCarga =
    cargandoEstaciones || cargandoAsignaciones || (estacion?.id != null && !libro)

  return (
    <EnfermeriaEstacionLayout
      tituloCentrado="Control de turnos y expedientes · Prueba"
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
              <Button variant="secondary" size="sm" onClick={recargarTodo}>
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
        ) : (
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
                    onCambiarClinica={iniciarCambioClinica}
                  />
                }
              />
            </div>

            <ClinicasSeguimiento
              clinicas={clinicas}
              modoAsignacion={filtro === 'en_clinica'}
              modoRegistro={filtro === 'registrado'}
              modoCambio={cambioClinicaActivo}
              clinicaSeleccionadaId={
                cambioClinicaActivo ? seleccionCompleta?.turno?.clinicaId : clinicaDestino?.id
              }
              onElegir={elegirClinica}
              esElegible={esElegibleClinica}
              focusToken={focoClinicas}
              mensaje={
                cambioClinicaActivo
                  ? `Turno ${etiquetaTurno(
                      seleccionCompleta?.turno?.codigo ?? seleccionCompleta?.codigo,
                      seleccionCompleta?.turno?.numero ?? seleccionCompleta?.numero,
                    )}: elija su nueva clínica.`
                  : filtro === 'registrado'
                    ? registroPendiente
                      ? `${registroPendiente.nombre}: elija la clínica para el turno ${etiquetaTurno(
                          registroPendiente.codigo,
                          registroPendiente.numero,
                        )}.`
                      : 'Elija una especialidad para habilitar sus clínicas.'
                    : null
              }
            />
          </div>
        )}
      </main>
    </EnfermeriaEstacionLayout>
  )
}
