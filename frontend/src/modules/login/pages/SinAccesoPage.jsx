import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'

export default function SinAccesoPage() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()

  function volverAlLogin() {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <Icon name="block" className="text-[30px]" />
      </div>
      <div>
        <h1 className="text-headline-lg text-on-surface">Sin acceso</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Su rol {usuario?.rol ? `(${usuario.rol})` : ''} no tiene acceso a esta sección.
        </p>
      </div>
      <Button size="lg" onClick={volverAlLogin}>
        <Icon name="login" className="text-[20px]" />
        Volver al inicio de sesión
      </Button>
    </div>
  )
}
