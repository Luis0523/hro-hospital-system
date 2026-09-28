import AppRouter from '@/router/AppRouter.jsx'
import ErrorBoundary from '@/shared/components/ErrorBoundary.jsx'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
