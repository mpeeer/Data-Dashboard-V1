import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './utils/useTheme';
// Tailwind v4 + shadcn vars must be imported BEFORE glass.css so the
// preflight (reset) runs first and Lumen's component-level styles
// override Tailwind utilities where appropriate.
import './index.css';
import './styles/glass.css';

// Prevent theme-transition flash on initial paint — transitions
// only activate after this class lands (see glass.css).
document.body.classList.add('theme-ready');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
