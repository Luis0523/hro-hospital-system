import AppRouter from '@/router/AppRouter.jsx'
import ErrorBoundary from '@/shared/components/ErrorBoundary.jsx'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
