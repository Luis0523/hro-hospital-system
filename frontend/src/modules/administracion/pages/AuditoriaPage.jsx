import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { listarUsuarios, obtenerAuditoria } from '../api/administracionApi.js'
import AuditoriaDetalleModal from '../components/AuditoriaDetalleModal.jsx'
import AuditoriaFiltros from '../components/AuditoriaFiltros.jsx'
import AuditoriaTabla from '../components/AuditoriaTabla.jsx'
import PaginacionResultados from '../components/PaginacionResultados.jsx'

const TAMANO_PAGINA = 20

const PAGINA_VACIA = {
  content: [],
  number: 0,
  size: TAMANO_PAGINA,
  totalElements: 0,
  totalPages: 0,
  numberOfElements: 0,
  first: true,
  last: true,
  empty: true,
}

export default function AuditoriaPage() {
  const [usuarios, setUsuarios] = useState([])

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [tabla, setTabla] = useState('')
  const [accion, setAccion] = useState('')
  const [pagina, setPagina] = useState(0)

  const [resultado, setResultado] = useState(PAGINA_VACIA)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [detalle, setDetalle] = useState(null)

  // Carga de usuarios para el filtro. Un fallo no debe impedir usar la auditoría.
  useEffect(() => {
    let vigente = true
    listarUsuarios({ estado: 'todos' })
      .then((lista) => {
        if (vigente) setUsuarios(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vigente) setUsuarios([])
      })
    return () => {
      vigente = false
    }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await obtenerAuditoria({
        tabla: tabla.trim() || undefined,
        usuarioId: usuarioId ? Number(usuarioId) : undefined,
        accion: accion.trim() || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        page: pagina,
        size: TAMANO_PAGINA,
      })
      setResultado({ ...PAGINA_VACIA, ...datos })
      setSinPermiso(false)
    } catch (fallo) {
      setResultado(PAGINA_VACIA)
      if (fallo?.status === 403 || fallo?.codigo === 'ACCESO_DENEGADO') {
        setSinPermiso(true)
      } else {
        setSinPermiso(false)
        setError(fallo?.message || 'No se pudo cargar la auditoría')
      }
    } finally {
      setCargando(false)
    }
  }, [tabla, accion, fechaInicio, fechaFin, usuarioId, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cambiarFiltro = (actualizar) => (valor) => {
    actualizar(valor)
    setPagina(0)
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-headline-md text-primary">Auditoría</h2>
        <p className="text-sm text-outline">
          Consulta de trazabilidad de las operaciones del sistema (solo lectura).
        </p>
      </header>

      {sinPermiso ? (
        <div className="space-y-3">
          <Alert tone="error">
            <h3 className="text-base font-semibold">
              No tienes permisos para consultar la auditoría.
            </h3>
            <p className="mt-1">
              Esta sección está restringida al rol administrador. Solicita acceso al área
              correspondiente.
            </p>
          </Alert>
          <Button size="sm" variant="secondary" onClick={cargar} disabled={cargando}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <AuditoriaFiltros
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onCambiarInicio={cambiarFiltro(setFechaInicio)}
            onCambiarFin={cambiarFiltro(setFechaFin)}
            usuarioId={usuarioId}
            onCambiarUsuario={cambiarFiltro(setUsuarioId)}
            usuarios={usuarios}
            tabla={tabla}
            onCambiarTabla={cambiarFiltro(setTabla)}
            accion={accion}
            onCambiarAccion={cambiarFiltro(setAccion)}
          />

          {cargando && <Spinner label="Cargando auditoría..." />}

          {!cargando && error && (
            <Alert tone="error" title="No se pudo cargar la auditoría">
              <p>{error}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={cargar}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {!cargando && !error && (
            <>
              <AuditoriaTabla registros={resultado.content} onVerDetalle={setDetalle} />
              <PaginacionResultados
                pagina={resultado.number}
                totalPaginas={resultado.totalPages}
                esPrimera={resultado.first}
                esUltima={resultado.last}
                onAnterior={() => setPagina((anterior) => Math.max(0, anterior - 1))}
                onSiguiente={() => setPagina((anterior) => anterior + 1)}
              />
            </>
          )}
        </>
      )}

      <AuditoriaDetalleModal
        abierto={Boolean(detalle)}
        registro={detalle}
        onCerrar={() => setDetalle(null)}
      />
    </section>
  )
}
