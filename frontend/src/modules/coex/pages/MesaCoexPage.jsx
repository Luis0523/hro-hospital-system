import { useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import InputFecha from '@/shared/components/ui/InputFecha.jsx'
import AppShell from '@/shared/components/AppShell.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { SECCIONES_ENFERMERIA } from '@/modules/enfermeria/seccionesEnfermeria'
import SeccionCarnetsCoex from '../components/SeccionCarnetsCoex.jsx'
import { useReportesCoex } from '../hooks/useReportesCoex'

// Mesa COEX: los expedientes que salieron de archivo llegan aquí y se marca su
// salida de enfermería (devolución a archivo). Se actualiza en tiempo real.
export default function MesaCoexPage() {
  const { estacion } = useEstacion()
  const { mostrarToast } = useToast()
  const [fecha, setFecha] = useState(hoyIso)
  const [recargaKey, setRecargaKey] = useState(0)

  const {
    descargandoSalidaArchivo,
    descargandoSalidaEnfermeria,
    descargarSalidaArchivo,
    descargarSalidaEnfermeria,
  } = useReportesCoex({ fecha, mostrarToast })

  return (
    <AppShell
      titulo="Mesa COEX"
      icono="inventory_2"
      secciones={SECCIONES_ENFERMERIA}
      contexto={
        estacion ? (
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="truncate text-title-sm font-semibold text-on-surface">
              {estacion.nombre ?? estacion.codigo}
            </p>
            <p className="truncate text-label-sm uppercase text-on-surface-variant">
              {estacion.codigo}
              {estacion.ubicacion ? ` · ${estacion.ubicacion}` : ''}
            </p>
          </div>
        ) : null
      }
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="w-full max-w-xs">
          <InputFecha
            label="Fecha de trabajo"
            name="fecha"
            value={fecha}
            onChange={(valor) => setFecha(valor)}
          />
        </div>

        <SeccionCarnetsCoex fecha={fecha} estacionId={estacion?.id} recargaKey={recargaKey} />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => setRecargaKey((clave) => clave + 1)}
          >
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={descargarSalidaArchivo}
            disabled={descargandoSalidaArchivo || descargandoSalidaEnfermeria}
            aria-busy={descargandoSalidaArchivo || undefined}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            {descargandoSalidaArchivo ? 'Generando…' : 'Salida de archivo (PDF)'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={descargarSalidaEnfermeria}
            disabled={descargandoSalidaArchivo || descargandoSalidaEnfermeria}
            aria-busy={descargandoSalidaEnfermeria || undefined}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            {descargandoSalidaEnfermeria ? 'Generando…' : 'Salida de enfermería (PDF)'}
          </Button>
        </div>
      </main>
    </AppShell>
  )
}
