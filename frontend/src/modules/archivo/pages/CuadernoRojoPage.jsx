import { useState } from 'react'
import { Alert, Button, Card, Icon, Modal } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearFechaLarga, hoyIsoGuatemala } from '@/shared/utils/fecha'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import CuadernoRojoConfirmacion from '../components/CuadernoRojoConfirmacion.jsx'
import CuadernoRojoEliminar from '../components/CuadernoRojoEliminar.jsx'
import CuadernoRojoHistorial from '../components/CuadernoRojoHistorial.jsx'
import CuadernoRojoModalRegistro from '../components/CuadernoRojoModalRegistro.jsx'
import { useCuadernoRojo } from '../hooks/useCuadernoRojo'
import { USANDO_DATOS_MOCK } from '../api/archivoApi'
import { descargarReporteCuaderno } from '../utils/cuadernoRojoPdf'

export default function CuadernoRojoPage() {
  const { mostrarToast } = useToast()
  const {
    valores,
    errores,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    progreso,
    cargandoDia,
    guardando,
    eliminando,
    error,
    hayCambios,
    filtros,
    iniciarRegistroNuevo,
    cambiarCampo,
    marcarTocado,
    marcarTodosTocados,
    crearRegistro,
    guardar,
    obtenerSnapshot,
    seleccionarRegistro,
    eliminarRegistro,
    aplicarFiltros,
    restablecerFiltros,
  } = useCuadernoRojo()

  const [modal, setModal] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)
  const [descarte, setDescarte] = useState(null)
  const [eliminacion, setEliminacion] = useState(null)

  function abrirCrear() {
    iniciarRegistroNuevo()
    setConfirmacion(null)
    setDescarte(null)
    setModal({ tipo: 'crear' })
  }

  function abrirEditar(registro) {
    seleccionarRegistro(registro)
    setConfirmacion(null)
    setDescarte(null)
    setModal({ tipo: 'editar' })
  }

  function solicitarCierre() {
    if (guardando) return
    if (hayCambios) {
      setDescarte({ tipo: 'cerrar', reabrir: modal?.tipo })
      setModal(null)
      return
    }
    setModal(null)
  }

  function manejarCambio(clave, valor) {
    if (clave === 'fecha' && valor !== valores.fecha && hayCambios) {
      setDescarte({ tipo: 'fecha', fecha: valor, reabrir: modal?.tipo ?? 'crear' })
      setModal(null)
      return
    }
    cambiarCampo(clave, valor)
  }

  function cancelarDescarte() {
    const pendiente = descarte
    setDescarte(null)
    if (pendiente?.reabrir) setModal({ tipo: pendiente.reabrir })
  }

  function confirmarDescarte() {
    const pendiente = descarte
    setDescarte(null)
    if (!pendiente) return

    if (pendiente.tipo === 'fecha') {
      cambiarCampo('fecha', pendiente.fecha)
      setModal({ tipo: pendiente.reabrir ?? 'crear' })
    }
  }

  function mostrarResultadoGuardado(resultado, actualizacion) {
    const titulo = actualizacion ? 'Registro actualizado' : 'Registro creado'

    if (!resultado.historialActualizado) {
      mostrarToast({
        tone: 'warning',
        title: 'Historial sin actualizar',
        message: 'El registro se guardó. Reintente aplicando el filtro de fechas.',
      })
      return
    }

    if (resultado.fueraDePeriodo) {
      mostrarToast({
        tone: 'warning',
        title: titulo,
        message: 'No aparece en el rango de fechas seleccionado. Ajuste el filtro para verlo.',
      })
      return
    }

    mostrarToast({
      tone: 'success',
      title: titulo,
      message: `Cuaderno Rojo del ${resultado.registro?.fecha ?? valores.fecha}.`,
    })
  }

  async function manejarGuardar() {
    if (modal?.tipo === 'editar') {
      const snapshot = obtenerSnapshot()
      if (!snapshot.valido) {
        marcarTodosTocados()
        mostrarToast({
          tone: 'error',
          title: 'Revise el formulario',
          message: 'Corrija las cantidades marcadas antes de actualizar.',
        })
        return
      }
      setModal(null)
      setConfirmacion(snapshot)
      return
    }

    const resultado = await crearRegistro()
    if (resultado.omitido) return

    if (resultado.duplicado) {
      seleccionarRegistro(resultado.registro)
      mostrarToast({
        tone: 'warning',
        title: 'La fecha ya tiene un registro',
        message: 'Puede editar el registro existente.',
      })
      return
    }

    if (!resultado.ok) {
      mostrarToast({
        tone: 'error',
        title: resultado.validacion ? 'Revise el formulario' : 'No se pudo guardar',
        message: resultado.error,
      })
      return
    }

    setModal(null)
    mostrarResultadoGuardado(resultado, false)
  }

  async function manejarConfirmar() {
    if (!confirmacion) return
    const resultado = await guardar(confirmacion)
    if (resultado.omitido) return

    if (!resultado.ok) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo actualizar',
        message: resultado.error,
      })
      return
    }

    setConfirmacion(null)
    mostrarResultadoGuardado(resultado, true)
  }

  function manejarCancelarConfirmacion() {
    if (guardando) return
    setConfirmacion(null)
    setModal({ tipo: 'editar' })
  }

  function editarExistente() {
    setModal({ tipo: 'editar' })
  }

  function abrirEliminar(registro) {
    if (!USANDO_DATOS_MOCK) return
    setEliminacion({ registro, paso: 1 })
  }

  function continuarEliminar() {
    setEliminacion((actual) => (actual ? { ...actual, paso: 2 } : actual))
  }

  function cancelarEliminar() {
    if (eliminando) return
    setEliminacion(null)
  }

  async function confirmarEliminar() {
    if (!eliminacion) return
    const resultado = await eliminarRegistro(eliminacion.registro.fecha)
    if (resultado.omitido) return

    if (!resultado.ok) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo eliminar',
        message: resultado.error,
      })
      return
    }

    setEliminacion(null)
    mostrarToast({
      tone: 'success',
      title: 'Registro eliminado',
      message: `Cuaderno Rojo del ${eliminacion.registro.fecha}.`,
    })
  }

  function generarPdf() {
    if (cargandoHistorial || registros.length === 0) return

    try {
      const descargado = descargarReporteCuaderno({
        registros,
        desde: filtros.desde,
        hasta: filtros.hasta,
      })
      if (!descargado) {
        mostrarToast({
          tone: 'warning',
          title: 'No se pudo iniciar la descarga',
          message: 'El navegador no permitió generar el archivo.',
        })
        return
      }
      mostrarToast({
        tone: 'success',
        title: 'Reporte generado',
        message: 'El PDF del período seleccionado se está descargando.',
      })
    } catch {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: 'Intente de nuevo con el período actual.',
      })
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full min-w-0 max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="min-w-0 space-y-1">
          <h2 className="text-headline-md text-on-surface">Cuaderno Rojo</h2>
          <p className="text-body-md text-on-surface-variant">Registro diario de Archivo</p>
          <p className="flex items-start gap-1.5 text-body-sm text-on-surface-variant">
            <Icon name="calendar_today" className="mt-0.5 shrink-0 text-[16px] text-secondary" />
            <span className="min-w-0">
              Hoy en Guatemala · {formatearFechaLarga(hoyIsoGuatemala())}
            </span>
          </p>
        </header>

        <div className="flex justify-center py-1">
          <Button
            type="button"
            size="lg"
            onClick={abrirCrear}
            className="min-h-16 w-full max-w-md gap-3 rounded-xl shadow-sm sm:w-auto sm:min-w-[20rem]"
          >
            <Icon name="add" className="text-[24px]" />
            Registrar nuevo día
          </Button>
        </div>

        {error && (
          <Alert tone="error" title="Ocurrió un problema">
            {error}
          </Alert>
        )}

        <Card className="!p-4 sm:!p-6">
          <CuadernoRojoHistorial
            registros={registros}
            cargando={cargandoHistorial}
            progreso={progreso}
            filtros={filtros}
            onAplicarFiltros={aplicarFiltros}
            onRestablecer={restablecerFiltros}
            onEditar={abrirEditar}
            onEliminar={abrirEliminar}
            puedeEliminar={USANDO_DATOS_MOCK}
            onGenerarPdf={generarPdf}
          />
        </Card>

        <CuadernoRojoModalRegistro
          abierto={Boolean(modal)}
          modo={modal?.tipo ?? 'crear'}
          valores={valores}
          errores={errores}
          tocados={tocados}
          existente={existente}
          cargandoDia={cargandoDia}
          guardando={guardando}
          onCambiar={manejarCambio}
          onBlur={marcarTocado}
          onGuardar={manejarGuardar}
          onCerrar={solicitarCierre}
          onEditarExistente={editarExistente}
        />

        <CuadernoRojoConfirmacion
          abierto={Boolean(confirmacion)}
          fecha={confirmacion?.fecha}
          valores={confirmacion?.valores}
          guardando={guardando}
          onCancelar={manejarCancelarConfirmacion}
          onConfirmar={manejarConfirmar}
        />

        <CuadernoRojoEliminar
          abierto={Boolean(eliminacion)}
          registro={eliminacion?.registro}
          paso={eliminacion?.paso ?? 1}
          eliminando={eliminando}
          onContinuar={continuarEliminar}
          onCancelar={cancelarEliminar}
          onConfirmar={confirmarEliminar}
        />

        <Modal open={Boolean(descarte)} onClose={cancelarDescarte} title="Cambios sin guardar">
          <div className="space-y-4">
            <p>
              Hay cantidades escritas que aún no se han guardado. Si cambia de fecha o cierra el
              formulario, esos cambios se perderán.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                onClick={cancelarDescarte}
              >
                Seguir editando
              </Button>
              <Button
                variant="danger"
                className="min-h-11 w-full sm:w-auto"
                onClick={confirmarDescarte}
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
