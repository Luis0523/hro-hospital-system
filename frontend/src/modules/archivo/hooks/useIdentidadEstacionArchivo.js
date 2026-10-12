import { useEffect, useRef, useState } from 'react'
import { MODO_AUTH, useAuth } from '@/shared/context/AuthContext.jsx'
import { resolverIdentidadApiArchivo } from '../identidadArchivo'

// Mientras la Estación de Archivo está montada, asume su identidad efectiva
// (rol `archivo`) en el contexto global de autenticación. Al desmontar restaura
// la identidad previa.
//
// IMPORTANTE: en modo `keycloak` NO se suplanta la identidad. El rol real viene
// del token y el backend lo valida; suplantarlo rompería el RBAC por rol
// (el guard de acceso usaría el rol 'archivo' y bloquearía otras estaciones) y
// mostraría un usuario ficticio. La suplantación es solo para desarrollo (`mock`).
export function useIdentidadEstacionArchivo() {
  const { usuario, establecerIdentidad } = useAuth()
  const previoRef = useRef()
  const [identidadLista, setIdentidadLista] = useState(false)
  if (previoRef.current === undefined) previoRef.current = usuario

  const suplanta = MODO_AUTH !== 'keycloak'

  useEffect(() => {
    if (suplanta) {
      establecerIdentidad(resolverIdentidadApiArchivo(previoRef.current))
    }
    setIdentidadLista(true)
    return () => {
      if (suplanta) establecerIdentidad(previoRef.current)
    }
  }, [establecerIdentidad, suplanta])

  return {
    identidad: suplanta ? resolverIdentidadApiArchivo(usuario) : usuario,
    identidadLista,
    suplanta,
  }
}
