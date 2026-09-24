import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import SelectorEstacion from '../components/SelectorEstacion.jsx'
import { estacionesMock } from '../api/mockData'

export default function SeleccionEstacionPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [seleccionada, setSeleccionada] = useState(null)

  return (
    <SelectorEstacion
      estaciones={estacionesMock}
      seleccionada={seleccionada}
      onSeleccionar={setSeleccionada}
      onConfirmar={() => navigate('/enfermeria')}
      usuario={usuario}
    />
  )
}
