import { createContext, useCallback, useContext, useState } from 'react'
import Toast from '@/shared/components/ui/Toast.jsx'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const mostrarToast = useCallback(({ title, message, tone = 'info' }) => {
    const id = Date.now()
    setToast({ id, title, message, tone })
    setTimeout(() => {
      setToast((actual) => (actual?.id === id ? null : actual))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
