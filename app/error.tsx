'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('VERA Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl mb-4">VERA needs recalibration</h1>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 rounded"
            >
              Restart VERA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}