
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => (
  <div className="h-screen flex flex-col items-center justify-center p-4">
    <div className="border border-zinc-800 p-8 rounded bg-zinc-950">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-zinc-300 uppercase tracking-tighter font-bold">Sistema Listo</span>
      </div>
      <p>Directorio purgado. Esperando la carga de archivos del proyecto...</p>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
