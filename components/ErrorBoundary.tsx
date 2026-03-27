'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0F172A]">
          <Card className="max-w-md p-8 bg-slate-900 border-slate-800 text-center">
            <AlertTriangle className="w-12 h-12 text-[#f59e0b] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6">Raahat had a small hiccup. Don't worry, your health data is safe.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#f59e0b] hover:bg-orange-600 text-white w-full gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
