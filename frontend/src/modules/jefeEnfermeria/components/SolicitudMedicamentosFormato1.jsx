import { createPortal } from 'react-dom'
import { calcularEdad } from '@/shared/utils/fecha'

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

export default function SolicitudMedicamentosFormato1({ solicitud }) {
  const paciente = solicitud?.paciente
  const medicamentos = Array.isArray(solicitud?.medicamentos) ? solicitud.medicamentos : []

  if (!paciente || medicamentos.length === 0) return null

  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const edad = calcularEdad(paciente.fechaNacimiento)

  const contenido = (
    <div
      className="solicitud-impresion solicitud-formato1"
      data-testid="solicitud-impresion-formato1"
    >
      {medicamentos.map((medicamento) => (
        <section
          key={medicamento.id ?? `${medicamento.nombre}-${medicamento.fechaHoraInicio}`}
          className="solicitud-formato1-pagina"
          data-testid="solicitud-formato1-pagina"
        >
          <header className="solicitud-encabezado">
            <div>
              <p>MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL</p>
              <p>Hospital Regional de Occidente</p>
            </div>
          </header>

          <h1>SOLICITUD DE MEDICAMENTOS ESPECIALES No.1</h1>

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
        </section>
      ))}
    </div>
  )

  if (typeof document === 'undefined') return contenido

  return createPortal(contenido, document.body)
}
