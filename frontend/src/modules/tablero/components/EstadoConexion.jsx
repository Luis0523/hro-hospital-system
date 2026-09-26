const ESTADOS = {
  conectado: {
    etiqueta: 'En línea',
    color: 'bg-emerald-500',
    texto: 'text-emerald-700',
    fondo: 'bg-emerald-50',
  },
  reconectando: {
    etiqueta: 'Reconectando…',
    color: 'bg-amber-500',
    texto: 'text-amber-700',
    fondo: 'bg-amber-50',
  },
  desconectado: {
    etiqueta: 'Sin conexión',
    color: 'bg-red-500',
    texto: 'text-red-700',
    fondo: 'bg-red-50',
  },
  mock: {
    etiqueta: 'Datos de prueba',
    color: 'bg-blue-400',
    texto: 'text-blue-700',
    fondo: 'bg-blue-50',
  },
}

export default function EstadoConexion({ estado = 'desconectado' }) {
  const config = ESTADOS[estado] ?? ESTADOS.desconectado

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-label-md ${config.fondo} ${config.texto}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
      {config.etiqueta}
    </span>
  )
}
