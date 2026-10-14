import { useState } from 'react'
import { Alert, Button, Icon, Input } from '@/shared/components/ui'
import { CAMPOS_CUADERNO_ROJO, validarFormulario, valoresIniciales } from '../cuadernoRojoCampos'

// Formulario de captura del Cuaderno Rojo. El estado es solo de interfaz
// (valores, campos tocados y errores de validación); no persiste ni envía datos.
//
// Las cantidades usan `text` + `inputMode="numeric"` para que cualquier entrada
// (negativos, decimales, texto) llegue al validador propio y produzca un mensaje
// claro, en lugar de que el navegador la descarte en silencio.
export default function CuadernoRojoFormulario() {
  const [valores, setValores] = useState(valoresIniciales)
  const [tocados, setTocados] = useState({})

  const { errores } = validarFormulario(valores)

  function manejarCambio(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }))
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
  }

  function marcarTocado(clave) {
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
  }

  return (
    <form className="space-y-4" noValidate onSubmit={(evento) => evento.preventDefault()}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CAMPOS_CUADERNO_ROJO.map((campo) => {
          const esFecha = campo.tipo === 'fecha'
          const error = tocados[campo.clave] ? errores[campo.clave] : undefined

          return (
            <Input
              key={campo.clave}
              id={`cuaderno-rojo-${campo.clave}`}
              name={campo.clave}
              label={campo.etiqueta}
              type={esFecha ? 'date' : 'text'}
              inputMode={esFecha ? undefined : 'numeric'}
              autoComplete="off"
              value={valores[campo.clave]}
              error={error}
              onChange={(evento) => manejarCambio(campo.clave, evento.target.value)}
              onBlur={() => marcarTocado(campo.clave)}
            />
          )
        })}
      </div>

      <Alert tone="warning" title="Guardado pendiente de integración">
        Esta pantalla todavía no cuenta con integración de backend. Los datos no se guardan ni se
        envían a ningún servidor; la acción de guardar permanecerá deshabilitada hasta que exista el
        contrato correspondiente.
      </Alert>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled
          title="Disponible cuando exista integración con el backend del Cuaderno Rojo."
        >
          <Icon name="save" className="text-[18px]" />
          Guardar registro
        </Button>
      </div>
    </form>
  )
}
