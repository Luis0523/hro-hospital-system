import Modal from '@/shared/components/ui/Modal.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import { etiquetaAccion, formatearTabla, textoDetalleJson } from '../utils/auditoria.js'
import { formatearFechaHora } from '../utils/fechas.js'

function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-slate-400">{etiqueta}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-700">{children}</dd>
    </div>
  )
}

function BloqueJson({ titulo, valor }) {
  const texto = textoDetalleJson(valor)

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</p>
      {texto === null ? (
        <p className="text-sm text-slate-400">No disponible</p>
      ) : (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {texto}
        </pre>
      )}
    </div>
  )
}

export default function AuditoriaDetalleModal({ abierto, registro, onCerrar }) {
  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      title="Detalle de auditoría"
      footer={
        <Button size="sm" variant="secondary" onClick={onCerrar}>
          Cerrar
        </Button>
      }
    >
      {registro && (
        <div className="space-y-4">
          <dl className="space-y-2">
            <Dato etiqueta="Fecha">{formatearFechaHora(registro.fecha)}</Dato>
            <Dato etiqueta="Usuario">
              {registro.usuarioNombre || <span className="text-slate-400">No disponible</span>}
            </Dato>
            <Dato etiqueta="Acción">{etiquetaAccion(registro.accion)}</Dato>
            <Dato etiqueta="Tabla">{formatearTabla(registro.tablaAfectada)}</Dato>
            <Dato etiqueta="Entidad">
              {registro.entidadId ? (
                <span className="font-mono break-all text-xs">{registro.entidadId}</span>
              ) : (
                <span className="text-slate-400">No disponible</span>
              )}
            </Dato>
          </dl>

          <BloqueJson titulo="Valores anteriores" valor={registro.valoresAnteriores} />
          <BloqueJson titulo="Valores nuevos" valor={registro.valoresNuevos} />
        </div>
      )}
    </Modal>
  )
}
