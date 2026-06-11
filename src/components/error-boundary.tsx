"use client"

import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="p-6 text-center space-y-3">
          <p className="text-red-500 font-medium">Error: {this.state.error?.message || "Unknown error"}</p>
          <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-lg max-h-40 overflow-auto text-left">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-amber-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
