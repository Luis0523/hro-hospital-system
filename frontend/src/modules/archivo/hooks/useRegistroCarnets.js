import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  listarCarnets,
  listarEspecialidades,
  registrarCarnet,
} from '@/modules/carnets/api/carnetsApi'

// Estado de la vista "Registro de carnets" (enfermería). El flujo: elegir
// especialidad -> escanear/teclear expediente -> el backend consulta el API del
// hospital y asigna el correlativo diario por especialidad.
// `estado`: inicial | registrando | registrado | duplicado | error.
export function useRegistroCarnets() {
  const { mostrarToast } = useToast()
  const [expediente, setExpediente] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [especialidades, setEspecialidades] = useState([])
  const [registros, setRegistros] = useState([])
  const [resultado, setResultado] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [mensaje, setMensaje] = useState(null)
  const [procesando, setProcesando] = useState(false)

  const inputRef = useRef(null)
  const enCurso = useRef(false)

  const enfocar = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  const cargarRegistros = useCallback(async () => {
    try {
      setRegistros(await listarCarnets())
    } catch {
      // Silencioso: la tabla se reintenta en el próximo registro/recarga.
    }
  }, [])

  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch(() => setEspecialidades([]))
    cargarRegistros()
  }, [cargarRegistros])

  const registrar = useCallback(
    async (valor) => {
      const numero = String(valor ?? '').trim()
      if (!numero || enCurso.current) return
      if (!especialidadId) {
        setEstado('error')
        setMensaje('Seleccione la especialidad antes de registrar el carnet.')
        enfocar()
        return
      }
      enCurso.current = true
      setProcesando(true)
      setEstado('registrando')
      setMensaje(null)
      try {
        const registro = await registrarCarnet({
          numeroExpediente: numero,
          especialidadId: Number(especialidadId),
        })
        setResultado(registro)
        setEstado('registrado')
        setExpediente('')
        await cargarRegistros()
        mostrarToast({
          tone: 'success',
          title: 'Carnet registrado',
          message: `${registro.especialidadNombre} ${registro.correlativo} · ${registro.numeroExpediente}`,
        })
      } catch (fallo) {
        const status = fallo?.status
        if (status === 404) {
          setEstado('error')
          setMensaje('Expediente no encontrado. Verifique el número o consulte por DPI.')
        } else if (status === 409) {
          setEstado('duplicado')
          setMensaje(fallo.message)
        } else if (status === 502) {
          setEstado('error')
          setMensaje('No fue posible consultar el sistema hospitalario. Intente de nuevo.')
        } else {
          setEstado('error')
          setMensaje(fallo.message || 'No se pudo registrar el carnet.')
        }
      } finally {
        setProcesando(false)
        enCurso.current = false
        enfocar()
      }
    },
    [especialidadId, cargarRegistros, enfocar, mostrarToast],
  )

  return {
    expediente,
    setExpediente,
    especialidadId,
    setEspecialidadId,
    especialidades,
    registros,
    resultado,
    estado,
    mensaje,
    procesando,
    inputRef,
    registrar,
    cargarRegistros,
    enfocar,
  }
}
