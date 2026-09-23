import { Component } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full">
            <ErrorState
              title="Application Render Error"
              message={
                this.state.error?.message ||
                'A critical interface error occurred. Please reload the page to continue.'
              }
              onRetry={this.handleReset}
              retryLabel="Reload NexOps"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
