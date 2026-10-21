import Alert from '@/shared/components/ui/Alert.jsx'
import { esModoDemo } from '../api/doctorApi'

export default function AvisoDemo() {
  if (!esModoDemo) return null

  return (
    <Alert tone="info" title="Modo demostración">
      <p>
        Los pacientes y las clínicas son ficticios. Las acciones y las estadísticas se guardan solo
        en esta pestaña y no se envían al tablero real.
      </p>
    </Alert>
  )
}
