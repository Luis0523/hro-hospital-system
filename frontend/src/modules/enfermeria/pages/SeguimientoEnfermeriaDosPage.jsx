import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Select, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { imprimirTicketTurno } from '@/shared/utils/impresionTicket'
import EnfermeriaEstacionLayout from '../components/EnfermeriaEstacionLayout.jsx'
import BarraDestino from '../components/seguimiento/BarraDestino.jsx'
import CuadriculaTurnos from '../components/seguimiento/CuadriculaTurnos.jsx'
import DetalleTurno from '../components/seguimiento/DetalleTurno.jsx'
import DevolucionesClinicas from '../components/seguimiento/DevolucionesClinicas.jsx'
import HojaClinicas from '../components/seguimiento/HojaClinicas.jsx'
import ListaEspecialidades from '../components/seguimiento/ListaEspecialidades.jsx'
import PestanasEtapas from '../components/seguimiento/PestanasEtapas.jsx'
import SalidaEnfermeriaArchivo from '../components/seguimiento/SalidaEnfermeriaArchivo.jsx'
import SelectorTipoRegistro from '../components/seguimiento/SelectorTipoRegistro.jsx'
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
  const dobleEventoRef = useRef(null)
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
    eliminar,
    cambiarClinica,
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
  const [asignacionesVista, setAsignacionesVista] = useState([])
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(true)
  const [tokenAsignaciones, setTokenAsignaciones] = useState(0)
  const [registroPendiente, setRegistroPendiente] = useState(null)
  const [cambioClinicaActivo, setCambioClinicaActivo] = useState(false)
  const [especialidadActivaId, setEspecialidadActivaId] = useState(null)
  const [hojaClinicasAbierta, setHojaClinicasAbierta] = useState(false)
  const [mostrarTodasClinicas, setMostrarTodasClinicas] = useState(false)
  const [turnoPendienteClinica, setTurnoPendienteClinica] = useState(null)
  const [procesandoClinicaId, setProcesandoClinicaId] = useState(null)

  useEffect(
    () => () => {
      if (dobleEventoRef.current) clearTimeout(dobleEventoRef.current.timer)
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

  useEffect(() => {
    if (registroPendiente || cambioClinicaActivo) {
      setHojaClinicasAbierta(true)
      setMostrarTodasClinicas(false)
    }
  }, [registroPendiente, cambioClinicaActivo])

  useEffect(() => {
    setHojaClinicasAbierta(false)
    setMostrarTodasClinicas(false)
    setTurnoPendienteClinica(null)
  }, [filtro])

  const opcionesEstacion = useMemo(
    () =>
      estaciones.map((item) => ({
        value: String(item.id),
        label: `${item.codigo ?? item.id} · ${item.nombre ?? ''}`,
      })),
    [estaciones],
  )

  const especialidades = useMemo(() => libro?.especialidades ?? [], [libro])

  useEffect(() => {
    if (especialidades.length === 0) {
      setEspecialidadActivaId(null)
      return
    }
    setEspecialidadActivaId((actual) =>
      actual != null && especialidades.some((item) => String(item.id) === String(actual))
        ? actual
        : especialidades[0].id,
    )
  }, [especialidades])

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

  const filaActiva = useMemo(
    () =>
      filas.find((fila) => String(fila.id) === String(especialidadActivaId)) ?? filas[0] ?? null,
    [filas, especialidadActivaId],
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
    // Si la vista de asignaciones no trae el mapeo de la especialidad, no se
    // bloquean las clínicas: es preferible permitir elegir que dejar la barra
    // completamente deshabilitada.
    const idsDe = (especialidadId) => {
      const ids = clinicasPorEspecialidad.get(String(especialidadId))
      return ids && ids.size > 0 ? ids : null
    }

    if (cambioClinicaActivo && seleccion?.especialidadId != null) {
      return idsDe(seleccion.especialidadId)
    }
    if (filtro === 'registrado') {
      if (!registroPendiente) return new Set()
      return idsDe(registroPendiente.especialidadId)
    }
    if (filtro === 'en_clinica') {
      const especialidadId =
        seleccionCompleta?.turno?.especialidadId ??
        seleccionCompleta?.especialidadId ??
        seleccion?.especialidadId ??
        especialidadActivaId
      if (especialidadId == null) return null
      return idsDe(especialidadId)
    }
    return null
  }, [
    cambioClinicaActivo,
    clinicasPorEspecialidad,
    especialidadActivaId,
    filtro,
    registroPendiente,
    seleccion?.especialidadId,
    seleccionCompleta,
  ])

  const esElegibleClinica = useCallback(
    (clinica) => !idsClinicasElegibles || idsClinicasElegibles.has(String(clinica.id)),
    [idsClinicasElegibles],
  )

  const clinicasHoja = useMemo(() => {
    if (mostrarTodasClinicas) return clinicas
    const especialidadId =
      registroPendiente?.especialidadId ??
      seleccionCompleta?.turno?.especialidadId ??
      seleccionCompleta?.especialidadId ??
      filaActiva?.id
    if (especialidadId == null) return clinicas
    const ids = clinicasPorEspecialidad.get(String(especialidadId))
    if (!ids || ids.size === 0) return clinicas
    return clinicas.filter((clinica) => ids.has(String(clinica.id)))
  }, [
    clinicas,
    clinicasPorEspecialidad,
    filaActiva?.id,
    mostrarTodasClinicas,
    registroPendiente,
    seleccionCompleta,
  ])

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

  // Un toque registra normal; dos toques rápidos registran la presentación.
  // También sirve para Enter/doble Enter, porque los botones emiten click.
  function reaccionarConDobleEvento(clave, accionNormal, accionPresentacion) {
    const ahora = Date.now()
    const pendiente = dobleEventoRef.current

    if (pendiente && pendiente.clave === clave && ahora - pendiente.instante <= 300) {
      clearTimeout(pendiente.timer)
      dobleEventoRef.current = null
      accionPresentacion()
      return
    }

    if (pendiente) {
      clearTimeout(pendiente.timer)
      dobleEventoRef.current = null
      pendiente.accionNormal()
    }

    const timer = setTimeout(() => {
      dobleEventoRef.current = null
      accionNormal()
    }, 300)
    dobleEventoRef.current = { clave, timer, instante: ahora, accionNormal }
  }

  function activarEspecialidadConEvento(especialidadId, codigo, opciones = {}) {
    // El teclado conserva su acción inmediata; el toque espera 300 ms para
    // distinguir un toque simple de un doble toque.
    if (!opciones.puntero) {
      activarEspecialidad(especialidadId, codigo)
      return
    }
    reaccionarConDobleEvento(
      `especialidad-${especialidadId}`,
      () => activarEspecialidad(especialidadId, codigo),
      () =>
        activarEspecialidad(especialidadId, codigo, {
          tipoForzado: 'presentacion',
        }),
    )
  }

  function seleccionarConEvento(especialidadId, codigo, numero, opciones = {}) {
    if (!opciones.puntero) {
      seleccionar(especialidadId, codigo, numero)
      return
    }
    reaccionarConDobleEvento(
      `turno-${especialidadId}-${numero}`,
      () => seleccionar(especialidadId, codigo, numero),
      () =>
        seleccionar(especialidadId, codigo, numero, {
          tipoForzado: 'presentacion',
        }),
    )
  }

  function activarEspecialidad(especialidadId, codigo, opciones = {}) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const especialidad = especialidades.find((item) => String(item.id) === String(especialidadId))
    if (!especialidad) return
    setEspecialidadActivaId(especialidadId)

    if (!filtro || filtro === 'registrado') {
      iniciarRegistro(especialidad, null, opciones.tipoForzado)
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
        setTurnoPendienteClinica({ turno, especialidadId })
        mostrarToast({
          tone: 'warning',
          title: 'Seleccione una clínica física en la barra inferior.',
        })
        return
      }
      asignarTurnoAClinica(turno, especialidadId, clinica)
      return
    }

    avanzarDirecto(turno, especialidadId)
  }

  function iniciarRegistro(especialidad, numero = null, tipoForzado = undefined) {
    setEspecialidadActivaId(especialidad.id)
    const tipo = tipoForzado === undefined ? tipoRegistro : tipoForzado
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
      registrarDirecto(especialidad.id, especialidad.codigo, correlativo, null, tipo)
      return
    }
    if (elegibles.length === 1) {
      registrarDirecto(especialidad.id, especialidad.codigo, correlativo, elegibles[0], tipo)
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
      tipoRegistro: tipo,
    })
    setClinicaDestino(null)
    setCambioClinicaActivo(false)
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
    setEspecialidadActivaId(null)
    setHojaClinicasAbierta(false)
    setTurnoPendienteClinica(null)
  }

  function seleccionar(especialidadId, codigo, numero, opciones = {}) {
    if (registrando && (!filtro || filtro === 'registrado')) return
    const turno = turnosPorClave.get(`${especialidadId}-${numero}`) ?? null
    setEspecialidadActivaId(especialidadId)
    setSeleccion({ especialidadId, codigo, numero })

    if (!filtro) return

    if (filtro === 'registrado') {
      // Si ya está registrado, la selección habilita el editor de su tipo de
      // registro en el detalle del turno.
      if (turno) return
      const especialidad = especialidades.find((item) => String(item.id) === String(especialidadId))
      if (especialidad) iniciarRegistro(especialidad, numero, opciones.tipoForzado)
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
        setTurnoPendienteClinica({ turno, especialidadId })
        mostrarToast({
          tone: 'warning',
          title: 'Seleccione una clínica física en la barra inferior.',
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

  function registrarDirecto(
    especialidadId,
    codigo,
    numero,
    clinica = null,
    tipoForzado = undefined,
  ) {
    if (registrando) return
    const tipo = tipoForzado === undefined ? tipoRegistro : tipoForzado
    setEspecialidadActivaId(especialidadId)
    setSeleccion({ especialidadId, codigo, numero })
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
        setEspecialidadActivaId(creado.especialidadId ?? especialidadId)
        setRegistroPendiente(null)
        setHojaClinicasAbierta(false)
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

        const especialidadNombre =
          especialidades.find((item) => String(item.id) === String(especialidadId))?.nombre ??
          codigo
        const numeroClinica = clinica?.numero ?? clinica?.id ?? creado.clinicaNumero ?? null
        imprimirTicketTurno({
          turno: creado.numeroGeneral,
          especialidad: especialidadNombre,
          clinica: numeroClinica,
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
    setClinicaDestino(null)
    setRegistroPendiente(null)
    setCambioClinicaActivo(false)
    if (nuevo === 'devuelto' || nuevo === 'archivo') setSeleccion(null)
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

  async function eliminarSeleccionado(id, motivo) {
    try {
      await eliminar(id, motivo)
      setSeleccion(null)
      mostrarToast({ tone: 'info', title: 'Registro eliminado. La casilla quedó en blanco.' })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.message ?? 'No se pudo eliminar el registro.',
      })
      throw fallo
    }
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
    mostrarToast({
      tone: 'info',
      title: `Seleccione la nueva clínica para ${etiquetaTurno(
        turno.codigo ?? seleccionCompleta.codigo,
        turno.numero ?? seleccionCompleta.numero,
      )}.`,
    })
  }

  function elegirClinica(clinica) {
    setHojaClinicasAbierta(false)

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
        registroPendiente.tipoRegistro,
      )
      return
    }

    if (filtro === 'en_clinica') {
      if (turnoPendienteClinica?.turno) {
        const { turno, especialidadId } = turnoPendienteClinica
        setTurnoPendienteClinica(null)
        asignarTurnoAClinica(turno, especialidadId, clinica)
        return
      }
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

  async function registrarDevolucionEnClinica(clinica, cantidad = 1) {
    if (procesandoClinicaId != null) return
    setProcesandoClinicaId(clinica.id)
    try {
      const resumen = await devolverClinica(clinica.id, cantidad)
      mostrarToast({
        tone: 'success',
        title: `${clinica.nombre}: ${cantidad} devolución(es) registrada(s)`,
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
      <main
        ref={contenidoRef}
        className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full flex-col overflow-hidden bg-surface"
      >
        {(errorEstaciones || error) && (
          <div className="shrink-0 space-y-2 px-2 pt-2">
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
          </div>
        )}

        <h2 className="sr-only">Clínicas físicas</h2>

        {mostrarCarga ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner label="Cargando libro de turnos…" />
          </div>
        ) : !estacion?.id ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <EmptyState
              title="Seleccione una estación"
              description="Elija la estación de enfermería desde la cual se está abriendo esta jornada."
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <PestanasEtapas conteos={conteos} filtro={filtro} onFiltrar={cambiarFiltro} />

            {filtro !== 'devuelto' && filtro !== 'archivo' && (
              <section className="shrink-0 space-y-1 border-b border-outline-variant bg-surface-container-lowest px-2 py-1.5">
                <DetalleTurno
                  seleccion={seleccionCompleta}
                  especialidadNombre={seleccionCompleta?.especialidadNombre}
                  onRevertir={revertirSeleccionado}
                  onCambiarClinica={iniciarCambioClinica}
                  onCambiarTipoRegistro={cambiarTipoRegistroSeleccionado}
                  onEliminar={eliminarSeleccionado}
                  menuSecundario
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                    Tipo de registro
                  </span>
                  <SelectorTipoRegistro
                    valor={tipoRegistro}
                    onCambiar={elegirTipoRegistro}
                    etiqueta="Tipo de nuevo registro"
                  />
                  <button
                    type="button"
                    aria-pressed={tipoRegistro === null}
                    onClick={() => elegirTipoRegistro(null)}
                    className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-2.5 text-label-sm font-semibold transition touch-manipulation select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue active:scale-95 ${
                      tipoRegistro === null
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="label_off" className="text-[16px]" />
                    Sin marca
                  </button>
                </div>
              </section>
            )}

            {filtro === 'devuelto' ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                <DevolucionesClinicas
                  clinicas={clinicas}
                  onDevolver={registrarDevolucionEnClinica}
                  onDeshacer={deshacerDevolucionEnClinica}
                  procesandoId={procesandoClinicaId}
                />
              </div>
            ) : filtro === 'archivo' ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                <SalidaEnfermeriaArchivo
                  estacionId={estacion?.id}
                  fecha={fecha}
                  clinicas={clinicas}
                />
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] overflow-hidden">
                <ListaEspecialidades
                  filas={filas}
                  especialidadActivaId={filaActiva?.id}
                  onActivar={activarEspecialidadConEvento}
                />

                <CuadriculaTurnos
                  fila={filaActiva}
                  seleccionId={seleccion ? `${seleccion.especialidadId}-${seleccion.numero}` : null}
                  filtro={filtro}
                  onSeleccionar={seleccionarConEvento}
                />
              </div>
            )}

            {filtro === 'en_clinica' && (
              <BarraDestino
                clinicas={clinicas}
                clinicaSeleccionadaId={clinicaDestino?.id}
                onElegir={elegirClinica}
                esElegible={esElegibleClinica}
              />
            )}
          </div>
        )}

        <HojaClinicas
          open={hojaClinicasAbierta}
          onClose={() => setHojaClinicasAbierta(false)}
          clinicas={clinicasHoja}
          clinicaSeleccionadaId={
            cambioClinicaActivo ? seleccionCompleta?.turno?.clinicaId : clinicaDestino?.id
          }
          onElegir={elegirClinica}
          esElegible={esElegibleClinica}
          especialidadNombre={filaActiva?.nombre}
          mostrarTodas={mostrarTodasClinicas}
          onMostrarTodas={() => setMostrarTodasClinicas((valor) => !valor)}
          mensaje={
            cambioClinicaActivo
              ? `Turno ${etiquetaTurno(
                  seleccionCompleta?.turno?.codigo ?? seleccionCompleta?.codigo,
                  seleccionCompleta?.turno?.numero ?? seleccionCompleta?.numero,
                )}: elija su nueva clínica.`
              : turnoPendienteClinica
                ? `Turno ${etiquetaTurno(
                    turnoPendienteClinica.turno?.codigo,
                    turnoPendienteClinica.turno?.numero,
                  )}: elija la clínica de destino.`
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
      </main>
    </EnfermeriaEstacionLayout>
  )
}
