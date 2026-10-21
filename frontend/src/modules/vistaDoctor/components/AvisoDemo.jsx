import Alert from '@/shared/components/ui/Alert.jsx'

export default function AvisoDemo() {
  return (
    <Alert tone="info" title="Modo demostración">
      <p>
        Los pacientes y las clínicas son ficticios. Las acciones y las estadísticas se guardan solo
        en esta pestaña y no se envían al tablero real.
      </p>
    </Alert>
  )
}
