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

function EncabezadoInstitucional({ numeroExpediente }) {
  return (
    <header className="solicitud-encabezado">
      <img className="solicitud-logo" src="/logo-hro.jpg" alt="Hospital Regional de Occidente" />
      <div className="solicitud-encabezado-texto">
        <p className="solicitud-institucion">HOSPITAL REGIONAL DE OCCIDENTE</p>
        <h1>SOLICITUD DE MEDICAMENTOS ESPECIALES</h1>
        <p className="solicitud-subtitulo">Recetario personalizado · Formato No. 2</p>
      </div>
      <div className="solicitud-encabezado-codigo">
        <span className="solicitud-numero-formato">No. 2</span>
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

function ContenidoFormato2({ solicitud, copia = 1, totalCopias = 1 }) {
  const paciente = solicitud.paciente
  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const edad = calcularEdad(paciente.fechaNacimiento)
  const medicamentos = Array.isArray(solicitud.medicamentos) ? solicitud.medicamentos : []
  const filas = [...medicamentos]

  while (filas.length < 6) filas.push(null)

  return (
    <div className="solicitud-cuerpo">
      <EncabezadoInstitucional numeroExpediente={paciente.numeroExpediente} />

      <section className="solicitud-datos solicitud-panel">
        <Dato etiqueta="Paciente" className="solicitud-dato-amplio">
          {nombre}
        </Dato>
        <Dato etiqueta="Registro" className="solicitud-dato-medio">
          {texto(paciente.numeroExpediente)}
        </Dato>
        <Dato etiqueta="Edad">{edad != null ? `${edad} años` : ''}</Dato>
        <Dato etiqueta="Cama">{texto(solicitud.cama)}</Dato>
        <Dato etiqueta="Servicio">{texto(solicitud.servicio)}</Dato>
        <Dato etiqueta="Fecha">{fechaCorta(solicitud.fecha)}</Dato>
        <Dato etiqueta="Diagnóstico" className="solicitud-dato-amplio">
          {texto(solicitud.diagnostico)}
        </Dato>
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
                    {[medicamento.dosis, medicamento.via, medicamento.frecuencia]
                      .map(texto)
                      .filter(Boolean)
                      .join(' / ')}
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

      <PieInstitucional copia={copia} totalCopias={totalCopias} />
    </div>
  )
}

function PaginaCarta({ solicitud, testId }) {
  return (
    <div className="hoja-carta" data-testid={testId}>
      <div className="media-carta">
        <ContenidoFormato2 solicitud={solicitud} copia={1} totalCopias={2} />
      </div>
      <div className="linea-corte" aria-hidden="true" />
      <div className="media-carta">
        <ContenidoFormato2 solicitud={solicitud} copia={2} totalCopias={2} />
      </div>
    </div>
  )
}

export default function SolicitudMedicamentosFormato2({ solicitud, copias = 1 }) {
  const paciente = solicitud?.paciente
  if (!paciente) return null

  const totalPaginas = Math.max(1, Math.ceil(copias / 2))

  const contenido = (
    <div
      className={`solicitud-impresion solicitud-formato2 ${copias > 1 ? 'con-copias' : ''}`}
      data-testid="solicitud-impresion-formato2"
    >
      {copias > 1 ? (
        Array.from({ length: totalPaginas }, (_, indice) => (
          <PaginaCarta key={indice} solicitud={solicitud} testId="hoja-carta-formato2" />
        ))
      ) : (
        <ContenidoFormato2 solicitud={solicitud} copia={1} totalCopias={1} />
      )}
    </div>
  )

  if (typeof document === 'undefined') return contenido

  return createPortal(contenido, document.body)
}
