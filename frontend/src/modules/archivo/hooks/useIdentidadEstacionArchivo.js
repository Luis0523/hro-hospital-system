import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { resolverIdentidadApiArchivo } from '../identidadArchivo'

// Mientras la Estación de Archivo está montada, asume su identidad efectiva
// (rol `archivo`) en el contexto global de autenticación. Al desmontar restaura
// la identidad previa. No escribe cabeceras por su cuenta: `client.js` sigue
// tomando la identidad de `hro_usuario`, que este hook actualiza vía AuthContext.
//
// Devuelve `identidadLista` para que el layout NO renderice la parte operativa
// hasta que la identidad de estación esté establecida: así ninguna primera
// petición puede salir con el rol previo.
export function useIdentidadEstacionArchivo() {
  const { usuario, establecerIdentidad } = useAuth()
  const previoRef = useRef()
  const [identidadLista, setIdentidadLista] = useState(false)
  if (previoRef.current === undefined) previoRef.current = usuario

  useEffect(() => {
    establecerIdentidad(resolverIdentidadApiArchivo(previoRef.current))
    setIdentidadLista(true)
    return () => establecerIdentidad(previoRef.current)
  }, [establecerIdentidad])

  return { identidad: resolverIdentidadApiArchivo(usuario), identidadLista }
}
