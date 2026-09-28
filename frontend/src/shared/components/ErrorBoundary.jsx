import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info)
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-6">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-xl font-bold text-primary">Ocurrió un error inesperado</h1>
            <p className="text-sm text-on-surface-variant">{error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              Recargar la página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
