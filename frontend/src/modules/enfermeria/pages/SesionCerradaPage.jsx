import { useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function SesionCerradaPage() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  function volverAEntrar() {
    iniciarSesion()
    navigate('/enfermeria')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name="logout" className="text-[30px]" />
      </div>
      <div>
        <h1 className="text-headline-lg text-on-surface">Sesión cerrada</h1>
        <p className="text-body-md text-on-surface-variant">
          Puede volver a ingresar para continuar con la atención.
        </p>
      </div>
      <Button size="lg" onClick={volverAEntrar}>
        <Icon name="login" className="text-[20px]" />
        Volver a entrar
      </Button>
    </div>
  )
}
