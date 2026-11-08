import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Elementalerna Engine:", error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  private handleCopy = () => {
    const log = `Error: ${this.state.error?.toString()}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    
    // Fallback if clipboard API is not available (e.g. older mobile webviews)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(log).then(() => alert("Logg kopierad till urklipp!"));
    } else {
      // Create a temporary textarea to copy from
      const textArea = document.createElement("textarea");
      textArea.value = log;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert("Logg kopierad till urklipp!");
      } catch (err) {
        alert("Kunde inte kopiera automatiskt. Markera texten manuellt.");
      }
      document.body.removeChild(textArea);
    }
  }

  private handleClearData = () => {
    if(window.confirm("Är du säker? Detta raderar all lokalt sparad spekdata (vilket ofta löser svarta skärmar vid uppdateringar).")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-grow w-full h-full p-4 md:p-8 text-white flex flex-col items-center justify-center bg-black/95 absolute inset-0 z-[9999] overflow-y-auto">
            <h1 className="text-red-500 text-3xl md:text-4xl mb-2 font-bold text-center">SYSTEMKRASCH</h1>
            <p className="text-gray-300 mb-4 text-center">Ett oväntat fel uppstod i spelet. Ofta beror detta på gamla sparfiler vid en uppdatering.</p>
            
            <div className="flex flex-wrap gap-4 mb-6 justify-center">
              <button 
                className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded shadow-lg text-sm"
                onClick={this.handleCopy}
              >
                KOPIERA LOGG
              </button>
              <button 
                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded shadow-lg text-sm"
                onClick={this.handleClearData}
              >
                AUTO-FIXA (RENSA SPARAD DATA)
              </button>
              <button 
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded shadow-lg text-sm"
                onClick={() => window.location.reload()}
              >
                STARTA OM
              </button>
            </div>

            <div className="bg-red-950/80 p-4 border border-red-500 rounded text-left w-full max-w-4xl overflow-x-auto text-xs md:text-sm font-mono whitespace-pre-wrap text-red-200">
              <div className="font-bold text-white mb-2">{this.state.error?.toString()}</div>
              <div>{this.state.error?.stack}</div>
              <div className="mt-4 text-gray-400">{this.state.errorInfo?.componentStack}</div>
            </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
