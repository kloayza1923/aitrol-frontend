import React from 'react';
import { ReduxProvider } from '@/providers/ReduxProvider';

// Ejemplo de integración en App.tsx o main.tsx

function App() {
  return (
    <ReduxProvider>
      {/* Tu aplicación existente aquí */}
      <div>
        <h1>Mi Aplicación ERP</h1>
        {/* Tus componentes actuales siguen funcionando igual */}
      </div>
    </ReduxProvider>
  );
}

export default App;

// Alternativamente, en main.tsx:
/*
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReduxProvider } from '@/providers/ReduxProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider>
      <App />
    </ReduxProvider>
  </StrictMode>
);
*/
