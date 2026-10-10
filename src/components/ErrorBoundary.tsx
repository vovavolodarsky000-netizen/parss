import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary для перехвата ошибок рендеринга
 * Предотвращает падение всего приложения при ошибке в компоненте
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Ошибка перехвачена:', error, errorInfo);

    // Логируем ошибку в сервис мониторинга (например, Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Логируем в localStorage для отладки
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      errorLog.push({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('error_log', JSON.stringify(errorLog.slice(-10)));
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Кастомный fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Дефолтный UI при ошибке
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-gray-600 mb-4">
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 bg-gray-50 rounded-lg p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Информация об ошибке
                </summary>
                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <i className="fas fa-redo mr-2"></i>
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <i className="fas fa-sync mr-2"></i>
                Обновить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary для асинхронных ошибок (Promise rejections)
 */
export class AsyncErrorBoundary extends Component<{ children: ReactNode }> {
  componentDidMount(): void {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    console.error('[AsyncErrorBoundary] Необработанное отклонение промиса:', event.reason);
    event.preventDefault();
  };

  render(): ReactNode {
    return this.props.children;
  }
}

export default ErrorBoundary;
