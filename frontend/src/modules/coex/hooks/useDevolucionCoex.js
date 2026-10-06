import { retornarExpedienteCiclo } from '../api/coexApi'
import { useAccionMasivaCoex } from './useAccionMasivaCoex'

// Estado desde el que Enfermería puede devolver un expediente a Archivo. Es la
// única precondición que conocemos del backend; no se calculan transiciones.
export const ESTADO_ACCIONABLE_DEVOLVER = 'entregado'

// Guard defensivo: una fila es devolvible solo si tiene ciclo y el backend la
// reporta como recibida (en uso).
export function esFilaDevolvible(fila) {
  return fila?.cicloId != null && fila.estadoActual === ESTADO_ACCIONABLE_DEVOLVER
}

function ejecutarDevolucion(fila) {
  return retornarExpedienteCiclo(fila.cicloId)
}

// Mensajes de toast de devolución (espejo de recepción).
function construirToastDevolucion({ exitosos, fallidos }) {
  const numerosFallidos = fallidos
    .map(({ fila }) => fila.numeroExpediente || fila.cicloId)
    .join(', ')

  if (fallidos.length === 0) {
    return {
      tone: 'success',
      title: `${exitosos.length} expediente${exitosos.length === 1 ? '' : 's'} devuelto${
        exitosos.length === 1 ? '' : 's'
      }`,
    }
  }
  if (exitosos.length === 0) {
    return {
      tone: 'error',
      title: 'No se pudo devolver ningún expediente',
      message: numerosFallidos,
    }
  }
  return {
    tone: 'warning',
    title: `${exitosos.length} devuelto${exitosos.length === 1 ? '' : 's'}, ${
      fallidos.length
    } no se pudo${fallidos.length === 1 ? '' : 'ieron'} devolver`,
    message: numerosFallidos,
  }
}

// Wrapper fino de devolución sobre el core `useAccionMasivaCoex`.
export function useDevolucionCoex({ enUso = [], recargar, mostrarToast } = {}) {
  const accion = useAccionMasivaCoex({
    filas: enUso,
    esAccionable: esFilaDevolvible,
    ejecutar: ejecutarDevolucion,
    recargar,
    mostrarToast,
    construirToast: construirToastDevolucion,
  })

  return { ...accion, devolverSeleccionados: accion.ejecutarSeleccionados }
}
