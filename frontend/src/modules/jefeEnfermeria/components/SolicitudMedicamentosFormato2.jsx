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

function celdasVacias() {
  return Array.from({ length: 5 }, (_, indice) => <td key={indice}>&nbsp;</td>)
}

function Dato({ etiqueta, children, className = '' }) {
  return (
    <div className={`solicitud-dato ${className}`}>
      <span className="solicitud-etiqueta">{etiqueta}</span>
      <span className="solicitud-valor">{children}</span>
    </div>
  )
}

export default function SolicitudMedicamentosFormato2({ solicitud }) {
  const paciente = solicitud?.paciente
  if (!paciente) return null

  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const edad = calcularEdad(paciente.fechaNacimiento)
  const medicamentos = Array.isArray(solicitud.medicamentos) ? solicitud.medicamentos : []
  const filas = [...medicamentos]

  while (filas.length < 6) filas.push(null)

  const contenido = (
    <div
      className="solicitud-impresion solicitud-formato2"
      data-testid="solicitud-impresion-formato2"
    >
      <header className="solicitud-encabezado">
        <div>
          <p>MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL</p>
          <p>HOSPITAL REGIONAL DE OCCIDENTE</p>
        </div>
        <p>No. 2</p>
      </header>

      <h1>SOLICITUD MEDICAMENTOS ESPECIALES</h1>

      <section className="solicitud-datos">
        <Dato etiqueta="Nombre del paciente" className="solicitud-dato-amplio">
          {nombre}
        </Dato>
        <Dato etiqueta="Dx." className="solicitud-dato-amplio">
          {texto(solicitud.diagnostico)}
        </Dato>
        <Dato etiqueta="Edad">{edad != null ? `${edad} años` : ''}</Dato>
        <Dato etiqueta="Cama">{texto(solicitud.cama)}</Dato>
        <Dato etiqueta="Registro" className="solicitud-dato-medio">
          {texto(paciente.numeroExpediente)}
        </Dato>
        <Dato etiqueta="Servicio">{texto(solicitud.servicio)}</Dato>
        <Dato etiqueta="Fecha">{fechaCorta(solicitud.fecha)}</Dato>
      </section>

      <table className="solicitud-tabla">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Dosis/Vía/Frecuencia</th>
            <th>Fecha/Hora inicio</th>
            <th>Cantidad Solicitada</th>
            <th>Cantidad Despachada</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((medicamento, indice) => (
            <tr
              key={medicamento?.id ?? `fila-vacia-${indice}`}
              data-testid={medicamento ? 'fila-impresa' : 'fila-vacia'}
            >
              {medicamento ? (
                <>
                  <td>{texto(medicamento.nombre)}</td>
                  <td>
                    <span>{texto(medicamento.dosis)}</span>
                    <span>{texto(medicamento.via)}</span>
                    <span>{texto(medicamento.frecuencia)}</span>
                  </td>
                  <td>{fechaHora(medicamento.fechaHoraInicio)}</td>
                  <td>{texto(medicamento.cantidadSolicitada)}</td>
                  <td>{texto(medicamento.cantidadDespachada)}</td>
                </>
              ) : (
                celdasVacias()
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <section className="solicitud-observaciones">
        <p className="solicitud-etiqueta">Observaciones</p>
        <p className="solicitud-valor-largo">{texto(solicitud.observaciones)}</p>
      </section>

      <section className="solicitud-firmas">
        <div className="solicitud-firma-bloque">
          <p>Nombre y firma del médico:</p>
          <p className="solicitud-firma">{texto(solicitud.medicoNombre)}</p>
        </div>
        <div className="solicitud-firma-bloque">
          <p>Despacho de farmacia interna:</p>
          <p className="solicitud-firma">&nbsp;</p>
        </div>
        <div className="solicitud-firma-bloque">
          <p>Recibo conforme:</p>
          <p className="solicitud-firma">&nbsp;</p>
        </div>
      </section>
    </div>
  )

  if (typeof document === 'undefined') return contenido

  return createPortal(contenido, document.body)
}
