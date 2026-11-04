import { useState } from 'react'
import { Alert, Button, Card, Icon, Modal } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearFechaLarga, hoyIsoGuatemala } from '@/shared/utils/fecha'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import CuadernoRojoConfirmacion from '../components/CuadernoRojoConfirmacion.jsx'
import CuadernoRojoFormulario from '../components/CuadernoRojoFormulario.jsx'
import CuadernoRojoHistorial from '../components/CuadernoRojoHistorial.jsx'
import { useCuadernoRojo } from '../hooks/useCuadernoRojo'

// Plantilla estática servida desde `public/`. Se compone con la base URL de Vite
// para funcionar igual en desarrollo y bajo un subdirectorio de despliegue.
const RUTA_PLANTILLA_PDF = `${import.meta.env.BASE_URL || '/'}plantillas/cuaderno-rojo.pdf`

const ESTILOS_ESTADO = {
  nuevo: {
    caja: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    punto: 'bg-emerald-500',
    texto: 'Nuevo',
  },
  editando: {
    caja: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    punto: 'bg-amber-500',
    texto: 'Editando',
  },
  consultando: {
    caja: 'bg-surface-container text-on-surface-variant',
    punto: 'bg-primary animate-pulse',
    texto: 'Consultando…',
  },
}

function ChipEstado({ estado }) {
  const estilo = ESTILOS_ESTADO[estado] ?? ESTILOS_ESTADO.nuevo
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-semibold ${estilo.caja}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
      {estilo.texto}
    </span>
  )
}

export default function CuadernoRojoPage() {
  const { mostrarToast } = useToast()
  const {
    valores,
    errores,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    cargandoDia,
    guardando,
    error,
    hayCambios,
    cambiarCampo,
    marcarTocado,
    guardar,
    obtenerSnapshot,
    seleccionarRegistro,
    recargarHistorial,
    filtros,
    anioActual,
    cambiarFiltro,
    restablecerFiltros,
  } = useCuadernoRojo()

  const [confirmacion, setConfirmacion] = useState(null)
  const [descartePendiente, setDescartePendiente] = useState(null)

  const estado = cargandoDia ? 'consultando' : existente ? 'editando' : 'nuevo'

  async function ejecutarGuardado(confirmado, actualizacion) {
    const resultado = await guardar(confirmado)
    if (resultado.omitido) return

    if (resultado.ok) {
      setConfirmacion(null)
      const titulo = actualizacion ? 'Registro actualizado' : 'Registro creado'

      if (!resultado.historialActualizado) {
        mostrarToast({
          tone: 'warning',
          title: 'Historial sin actualizar',
          message: 'El registro se guardó. Reintente desde el historial.',
        })
        return
      }

      if (resultado.fueraDePeriodo) {
        mostrarToast({
          tone: 'warning',
          title: titulo,
          message: 'No aparece en el período filtrado. Cambie Año o Mes para verlo.',
        })
        return
      }

      mostrarToast({
        tone: 'success',
        title: titulo,
        message: `Cuaderno Rojo del ${resultado.registro?.fecha ?? valores.fecha}.`,
      })
      return
    }

    mostrarToast({
      tone: 'error',
      title: resultado.validacion ? 'Revise el formulario' : 'No se pudo guardar',
      message: resultado.error,
    })
  }

  function manejarGuardar() {
    const snapshot = obtenerSnapshot()
    if (snapshot.valido && existente) {
      setConfirmacion(snapshot)
      return
    }
    ejecutarGuardado(null, false)
  }

  function manejarConfirmar() {
    if (confirmacion) ejecutarGuardado(confirmacion, true)
  }

  function manejarCancelarConfirmacion() {
    if (!guardando) setConfirmacion(null)
  }

  function aplicarDescarte(pendiente) {
    if (!pendiente) return

    if (pendiente.tipo === 'registro') {
      seleccionarRegistro(pendiente.registro)
    } else if (pendiente.tipo === 'fecha') {
      cambiarCampo('fecha', pendiente.fecha)
    }

    setDescartePendiente(null)
  }

  function manejarCambio(clave, valor) {
    if (clave === 'fecha' && valor !== valores.fecha && hayCambios) {
      setDescartePendiente({ tipo: 'fecha', fecha: valor })
      return
    }
    cambiarCampo(clave, valor)
  }

  function manejarSeleccion(registro) {
    if (guardando) return
    if (hayCambios) {
      setDescartePendiente({ tipo: 'registro', registro })
      return
    }
    aplicarDescarte({ tipo: 'registro', registro })
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full min-w-0 max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-headline-md text-on-surface">Cuaderno Rojo</h2>
              <ChipEstado estado={estado} />
            </div>
            <p className="text-body-md text-on-surface-variant">Registro diario de Archivo</p>
            <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Icon name="calendar_today" className="text-[16px] text-secondary" />
              Hoy en Guatemala · {formatearFechaLarga(hoyIsoGuatemala())}
            </p>
          </div>

          <a
            href={RUTA_PLANTILLA_PDF}
            download="cuaderno-rojo.pdf"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-semibold text-primary transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name="download" className="text-[18px]" />
            Plantilla PDF
          </a>
        </header>

        {error && (
          <Alert tone="error" title="Ocurrió un problema">
            {error}
          </Alert>
        )}

        <Card className="!p-4 sm:!p-6">
          <CuadernoRojoFormulario
            valores={valores}
            errores={errores}
            tocados={tocados}
            existente={existente}
            cargandoDia={cargandoDia}
            guardando={guardando}
            onCambiar={manejarCambio}
            onBlur={marcarTocado}
            onGuardar={manejarGuardar}
          />
        </Card>

        <Card className="!p-4 sm:!p-6">
          <CuadernoRojoHistorial
            registros={registros}
            cargando={cargandoHistorial}
            onRecargar={recargarHistorial}
            onSeleccionar={manejarSeleccion}
            fechaSeleccionada={valores.fecha}
            deshabilitado={guardando || cargandoDia}
            filtros={filtros}
            anioActual={anioActual}
            onCambiarFiltro={cambiarFiltro}
            onRestablecer={restablecerFiltros}
            registroEnEdicion={existente ? valores.fecha : null}
          />
        </Card>

        <CuadernoRojoConfirmacion
          abierto={Boolean(confirmacion)}
          fecha={confirmacion?.fecha}
          valores={confirmacion?.valores}
          guardando={guardando}
          onCancelar={manejarCancelarConfirmacion}
          onConfirmar={manejarConfirmar}
        />

        <Modal
          open={Boolean(descartePendiente)}
          onClose={() => setDescartePendiente(null)}
          title="Cambios sin guardar"
        >
          <div className="space-y-4">
            <p>
              Hay cantidades escritas que aún no se han guardado. Si cambia de fecha o de registro,
              esos cambios se perderán.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setDescartePendiente(null)}
              >
                Seguir editando
              </Button>
              <Button
                variant="danger"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => aplicarDescarte(descartePendiente)}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </ArchivoLayout>
  )
}
