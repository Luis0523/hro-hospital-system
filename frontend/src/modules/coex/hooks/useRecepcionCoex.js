import { entregarExpedienteCiclo } from '../api/coexApi'
import { useAccionMasivaCoex } from './useAccionMasivaCoex'

// Estado desde el que Enfermería puede recibir un expediente. Es la única
// precondición que conocemos del backend; no se calculan transiciones.
export const ESTADO_ACCIONABLE_RECIBIR = 'en_transito_entrega'

// Guard defensivo: una fila es recibible solo si tiene ciclo y el backend la
// reporta en tránsito de entrega.
export function esFilaRecibible(fila) {
  return fila?.cicloId != null && fila.estadoActual === ESTADO_ACCIONABLE_RECIBIR
}

function ejecutarRecepcion(fila) {
  return entregarExpedienteCiclo(fila.cicloId)
}

// Mensajes de toast de recepción (idénticos a Fase 2).
function construirToastRecepcion({ exitosos, fallidos }) {
  const numerosFallidos = fallidos
    .map(({ fila }) => fila.numeroExpediente || fila.cicloId)
    .join(', ')

  if (fallidos.length === 0) {
    return {
      tone: 'success',
      title: `${exitosos.length} expediente${exitosos.length === 1 ? '' : 's'} recibido${
        exitosos.length === 1 ? '' : 's'
      }`,
    }
  }
  if (exitosos.length === 0) {
    return {
      tone: 'error',
      title: 'No se pudo recibir ningún expediente',
      message: numerosFallidos,
    }
  }
  return {
    tone: 'warning',
    title: `${exitosos.length} recibido${exitosos.length === 1 ? '' : 's'}, ${
      fallidos.length
    } no se pudo${fallidos.length === 1 ? '' : 'ieron'} recibir`,
    message: numerosFallidos,
  }
}

// Wrapper fino de recepción sobre el core `useAccionMasivaCoex`. Preserva la API
// pública de Fase 2 (`recibirSeleccionados` y el resto de la superficie).
export function useRecepcionCoex({ pendientesRecibir = [], recargar, mostrarToast } = {}) {
  const accion = useAccionMasivaCoex({
    filas: pendientesRecibir,
    esAccionable: esFilaRecibible,
    ejecutar: ejecutarRecepcion,
    recargar,
    mostrarToast,
    construirToast: construirToastRecepcion,
  })

  return { ...accion, recibirSeleccionados: accion.ejecutarSeleccionados }
}
