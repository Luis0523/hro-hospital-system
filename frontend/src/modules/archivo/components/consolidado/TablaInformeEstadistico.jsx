import { useState } from 'react'
import { calcularHA, calcularTotalInforme } from '../../utils/metricasConsolidado'

// Tabla 1 — "Informe Estadístico de Archivo" (resumen por día).
// Orden de columnas del Excel: DIA, HA, EH, HDT, HDC, SOBRES, HR, HD, TOTAL, TIA.
// HDC y HD vienen del backend; HDC y HD son de solo lectura; TOTAL y HA se
// calculan. EH, HDT, SOBRES, HR y TIA son de captura manual (input); no se
// inventan valores.

function CeldaManual({ dia, campo, etiqueta, valor, onCambio }) {
  return (
    <td className="px-2 py-1.5">
      <input
        type="number"
        min="0"
        inputMode="numeric"
        aria-label={`${etiqueta} ${dia}`}
        value={valor}
        onChange={(evento) => onCambio(dia, campo, evento.target.value)}
        className="w-16 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-right tabular-nums text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
      />
    </td>
  )
}

export default function TablaInformeEstadistico({ informe = [] }) {
  const [manual, setManual] = useState({})

  function actualizar(dia, campo, valor) {
    setManual((previo) => ({
      ...previo,
      [dia]: { ...(previo[dia] ?? {}), [campo]: valor },
    }))
  }

  function numero(dia, campo) {
    const valor = manual[dia]?.[campo]
    if (valor === '' || valor == null) return 0
    return Number(valor) || 0
  }

  return (
    <section className="space-y-2">
      <h3 className="text-title-md text-on-surface">
        Tabla 1 · Informe Estadístico de Archivo (por día)
      </h3>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[54rem] text-left text-body-sm">
          <thead className="bg-surface-container-low text-label-sm uppercase tracking-wide text-on-surface-variant">
            <tr>
              {['DÍA', 'HA', 'EH', 'HDT', 'HDC', 'SOBRES', 'HR', 'HD', 'TOTAL', 'TIA'].map(
                (etiqueta) => (
                  <th key={etiqueta} scope="col" className="px-3 py-2 font-semibold">
                    {etiqueta}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {informe.map((fila) => {
              const eh = numero(fila.dia, 'eh')
              const hdt = numero(fila.dia, 'hdt')
              const sobres = numero(fila.dia, 'sobres')
              const hr = numero(fila.dia, 'hr')
              const total = calcularTotalInforme({
                eh,
                hdt,
                hdc: fila.hdc,
                sobres,
                hr,
                hd: fila.hd,
              })
              const ha = calcularHA(total)

              return (
                <tr key={fila.dia} className="hover:bg-surface-container-low/60">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-on-surface-variant">
                    {fila.dia}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-on-surface">{ha}</td>
                  <CeldaManual
                    dia={fila.dia}
                    campo="eh"
                    etiqueta="EH"
                    valor={manual[fila.dia]?.eh ?? ''}
                    onCambio={actualizar}
                  />
                  <CeldaManual
                    dia={fila.dia}
                    campo="hdt"
                    etiqueta="HDT"
                    valor={manual[fila.dia]?.hdt ?? ''}
                    onCambio={actualizar}
                  />
                  <td className="px-3 py-2 tabular-nums text-on-surface-variant">{fila.hdc}</td>
                  <CeldaManual
                    dia={fila.dia}
                    campo="sobres"
                    etiqueta="SOBRES"
                    valor={manual[fila.dia]?.sobres ?? ''}
                    onCambio={actualizar}
                  />
                  <CeldaManual
                    dia={fila.dia}
                    campo="hr"
                    etiqueta="HR"
                    valor={manual[fila.dia]?.hr ?? ''}
                    onCambio={actualizar}
                  />
                  <td className="px-3 py-2 tabular-nums text-on-surface-variant">{fila.hd}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums text-on-surface">{total}</td>
                  <CeldaManual
                    dia={fila.dia}
                    campo="tia"
                    etiqueta="TIA"
                    valor={manual[fila.dia]?.tia ?? ''}
                    onCambio={actualizar}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-label-sm text-on-surface-variant">
        HDC y HD provienen del sistema. EH, HDT, SOBRES, HR y TIA son de captura manual (aún no
        persistida). TOTAL = EH + HDT + HDC + SOBRES + HR + HD; HA = TOTAL × 2 (por confirmar con
        Archivo).
      </p>
    </section>
  )
}
