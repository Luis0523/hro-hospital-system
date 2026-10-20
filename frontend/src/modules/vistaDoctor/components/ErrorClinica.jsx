import Button from '@/shared/components/ui/Button.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

const MENSAJES = {
  CLINICA_REQUERIDA: {
    titulo: 'Abre el enlace de tu clínica',
    detalle:
      'Este acceso necesita el enlace QR de la clínica. Escanea el código de tu consultorio para continuar.',
  },
  CLINICA_INVALIDA: {
    titulo: 'El enlace de la clínica no es válido',
    detalle:
      'El código QR no contiene un identificador de clínica válido. Vuelve a escanear el código del consultorio.',
  },
  CLINICA_NO_DISPONIBLE: {
    titulo: 'Clínica no disponible',
    detalle:
      'La clínica no existe o está fuera de servicio. Verifica el código QR o contacta al administrador.',
  },
  SIN_ASIGNACION: {
    titulo: 'Sin atención asignada para hoy',
    detalle:
      'Esta clínica no tiene una asignación de atención para la fecha actual. Contacta al jefe de enfermería.',
  },
  ERROR_SIMULADO: {
    titulo: 'No se pudo abrir la clínica',
    detalle: 'Ocurrió un problema temporal al leer la información de la clínica.',
  },
}

const MENSAJE_GENERICO = {
  titulo: 'No se pudo abrir la vista del doctor',
  detalle: 'Ocurrió un problema inesperado. Intenta de nuevo.',
}

export default function ErrorClinica({ error, onReintentar }) {
  const mensaje = MENSAJES[error?.code] ?? MENSAJE_GENERICO

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8">
      <div role="alert">
        <Card className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <Icon name="qr_code_scanner" className="text-3xl" />
          </div>
          <div>
            <h1 className="text-headline-md text-on-surface">{mensaje.titulo}</h1>
            <p className="mt-2 text-sm text-on-surface-variant sm:text-base">{mensaje.detalle}</p>
            {error?.message && error.message !== mensaje.detalle && (
              <p className="mt-2 text-sm text-on-surface-variant">{error.message}</p>
            )}
          </div>
          <Button type="button" size="lg" className="min-h-[48px] w-full" onClick={onReintentar}>
            Reintentar
          </Button>
          <p className="text-sm text-on-surface-variant">
            No se selecciona otra clínica automáticamente.
          </p>
        </Card>
      </div>
    </div>
  )
}
