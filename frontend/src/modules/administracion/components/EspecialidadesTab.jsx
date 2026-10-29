import { useCallback, useMemo, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  actualizarEspecialidad,
  crearEspecialidad,
  desactivarEspecialidad,
  listarEspecialidades,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import EspecialidadForm from './EspecialidadForm.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'nombre', label: 'Especialidad' },
  { key: 'abreviatura', label: 'Abreviatura' },
  {
    key: 'correlativoMax',
    label: 'Correlativo máx.',
    render: (fila) => fila.correlativoMax ?? 18,
  },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Especialidad creada',
  editar: 'Especialidad actualizada',
  desactivar: 'Especialidad desactivada',
}

// Búsqueda insensible a mayúsculas y acentos (p. ej. "pediatria" ≈ "Pediatría").
function normalizar(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function EspecialidadesTab({ conBuscador = false }) {
  const [busqueda, setBusqueda] = useState('')
  const cargar = useCallback(() => listarEspecialidades(), [])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearEspecialidad,
    actualizar: actualizarEspecialidad,
    desactivar: desactivarEspecialidad,
    mensajes: MENSAJES,
  })

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nueva especialidad'
      : gestion.modal?.modo === 'editar'
        ? 'Editar especialidad'
        : 'Detalle de especialidad'

  const consulta = normalizar(busqueda).trim()
  const filtrando = conBuscador && consulta.length > 0
  const datosVisibles = useMemo(() => {
    if (!filtrando) return gestion.datos
    return gestion.datos.filter((fila) =>
      [fila.nombre, fila.abreviatura, fila.correlativoMax].some((valor) =>
        normalizar(valor).includes(consulta),
      ),
    )
  }, [filtrando, consulta, gestion.datos])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Especialidades médicas registradas.</p>
        <Button onClick={gestion.abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
      </div>

      {conBuscador && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              aria-label="Buscar especialidad"
              placeholder="Buscar por nombre o abreviatura…"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-10 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
          <span
            aria-live="polite"
            className="text-sm text-on-surface-variant"
            data-testid="conteo-especialidades"
          >
            {filtrando
              ? `${datosVisibles.length} de ${gestion.datos.length}`
              : `${gestion.datos.length} especialidad${gestion.datos.length === 1 ? '' : 'es'}`}
          </span>
        </div>
      )}

      <TablaCatalogo
        columnas={COLUMNAS}
        datos={datosVisibles}
        cargando={gestion.cargando}
        error={gestion.error}
        onReintentar={gestion.recargar}
        onVer={gestion.abrirVer}
        onEditar={gestion.abrirEditar}
        onDesactivar={gestion.solicitarDesactivar}
        vacioTitulo={filtrando ? 'Sin coincidencias' : 'Sin especialidades registradas'}
        vacioDescripcion={
          filtrando
            ? 'Pruebe con otro nombre o abreviatura.'
            : 'Agregue la primera especialidad médica.'
        }
      />

      <ModalCatalogo
        abierto={Boolean(gestion.modal)}
        modo={gestion.modal?.modo}
        titulo={tituloModal}
        onCerrar={gestion.cerrarModal}
        guardando={gestion.guardando}
        textoGuardar={gestion.modal?.modo === 'editar' ? 'Guardar cambios' : 'Crear'}
      >
        {gestion.modal && (
          <EspecialidadForm
            valoresIniciales={gestion.modal.registro}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar especialidad"
        mensaje={`¿Deseas desactivar este registro? Especialidad: ${
          gestion.porDesactivar?.nombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
