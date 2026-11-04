import { createPortal } from 'react-dom'
import { calcularEdad } from '@/shared/utils/fecha'
import CodigoBarras from './CodigoBarras.jsx'

function texto(valor) {
  return valor == null ? '' : String(valor).trim()
}

function fechaCorta(iso) {
  if (!iso) return ''
  const partes = String(iso).split('-')
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function fechaHora(valor) {
  if (!valor) return ''
  return String(valor).replace('T', ' ')
}

function EncabezadoInstitucional({ numeroExpediente }) {
  return (
    <header className="solicitud-encabezado">
      <img className="solicitud-logo" src="/logo-hro.jpg" alt="Hospital Regional de Occidente" />
      <div className="solicitud-encabezado-texto">
        <p className="solicitud-institucion">HOSPITAL REGIONAL DE OCCIDENTE</p>
        <h1>SOLICITUD DE MEDICAMENTOS ESPECIALES No.1</h1>
        <p className="solicitud-subtitulo">Recetario personalizado · Formato No. 1</p>
      </div>
      <div className="solicitud-encabezado-codigo">
        <span className="solicitud-numero-formato">No. 1</span>
        <CodigoBarras valor={numeroExpediente} className="solicitud-codigo-barras" />
        <span className="solicitud-codigo-texto">{numeroExpediente || 'Sin expediente'}</span>
      </div>
    </header>
  )
}

function PieInstitucional({ copia, totalCopias }) {
  return (
    <footer className="solicitud-pie">
      <span>Sistema HRO · Documento generado automáticamente</span>
      <span>
        Copia {copia} de {totalCopias}
      </span>
    </footer>
  )
}

function ContenidoFormato1({ solicitud, paciente, medicamento, copia = 1, totalCopias = 1 }) {
  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const edad = calcularEdad(paciente.fechaNacimiento)

  return (
    <section className="solicitud-formato1-pagina" data-testid="solicitud-formato1-pagina">
      <EncabezadoInstitucional numeroExpediente={paciente.numeroExpediente} />

      <table className="solicitud-tabla solicitud-tabla-formato1">
        <colgroup>
          <col className="solicitud-col-etiqueta" />
          <col className="solicitud-col-valor" />
          <col className="solicitud-col-etiqueta" />
          <col className="solicitud-col-valor" />
          <col className="solicitud-col-etiqueta" />
          <col className="solicitud-col-valor" />
        </colgroup>
        <tbody>
          <tr>
            <td className="solicitud-lbl">Nombre completo del paciente</td>
            <td className="solicitud-val" colSpan={5}>
              {nombre}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Edad</td>
            <td className="solicitud-val">{edad != null ? `${edad} años` : ''}</td>
            <td className="solicitud-lbl">No. de Cama</td>
            <td className="solicitud-val">{texto(solicitud.cama)}</td>
            <td className="solicitud-lbl">No. de Registro</td>
            <td className="solicitud-val">{texto(paciente.numeroExpediente)}</td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Servicio</td>
            <td className="solicitud-val" colSpan={5}>
              {texto(solicitud.servicio)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Diagnóstico</td>
            <td className="solicitud-val" colSpan={5}>
              {texto(solicitud.diagnostico)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Medicamento Solicitado</td>
            <td className="solicitud-val" colSpan={3}>
              {texto(medicamento.nombre)}
            </td>
            <td className="solicitud-lbl">Cantidad</td>
            <td className="solicitud-val">{texto(medicamento.cantidadSolicitada)}</td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Dósis y vía de Administración</td>
            <td className="solicitud-val" colSpan={5}>
              {[texto(medicamento.dosis), texto(medicamento.via)].filter(Boolean).join(' / ')}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Fecha y Hora de Inicio de Tratamiento</td>
            <td className="solicitud-val" colSpan={5}>
              {fechaHora(medicamento.fechaHoraInicio)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Cantidad despachada</td>
            <td className="solicitud-val" colSpan={5}>
              {texto(medicamento.cantidadDespachada)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Observaciones</td>
            <td className="solicitud-val solicitud-observaciones-celda" colSpan={5}>
              {texto(solicitud.observaciones)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Fecha</td>
            <td className="solicitud-val" colSpan={5}>
              {fechaCorta(solicitud.fecha)}
            </td>
          </tr>
          <tr>
            <td className="solicitud-lbl">Nombre y Firma del Médico</td>
            <td className="solicitud-val solicitud-firma-celda" colSpan={5}>
              {texto(solicitud.medicoNombre)}
            </td>
          </tr>
        </tbody>
      </table>

      <PieInstitucional copia={copia} totalCopias={totalCopias} />
    </section>
  )
}

export default function SolicitudMedicamentosFormato1({ solicitud, copias = 1 }) {
  const paciente = solicitud?.paciente
  const medicamentos = Array.isArray(solicitud?.medicamentos) ? solicitud.medicamentos : []

  if (!paciente || medicamentos.length === 0) return null

  const contenido = (
    <div
      className={`solicitud-impresion solicitud-formato1 ${copias > 1 ? 'con-copias' : ''}`}
      data-testid="solicitud-impresion-formato1"
    >
      {medicamentos.map((medicamento) => {
        const clave = medicamento.id ?? `${medicamento.nombre}-${medicamento.fechaHoraInicio}`

        if (copias <= 1) {
          return (
            <ContenidoFormato1
              key={clave}
              solicitud={solicitud}
              paciente={paciente}
              medicamento={medicamento}
              copia={1}
              totalCopias={1}
            />
          )
        }

        return (
          <div className="hoja-carta" key={clave} data-testid="hoja-carta-formato1">
            <div className="media-carta">
              <ContenidoFormato1
                solicitud={solicitud}
                paciente={paciente}
                medicamento={medicamento}
                copia={1}
                totalCopias={2}
              />
            </div>
            <div className="linea-corte" aria-hidden="true" />
            <div className="media-carta">
              <ContenidoFormato1
                solicitud={solicitud}
                paciente={paciente}
                medicamento={medicamento}
                copia={2}
                totalCopias={2}
              />
            </div>
          </div>
        )
      })}
    </div>
  )

  if (typeof document === 'undefined') return contenido

  return createPortal(contenido, document.body)
}
