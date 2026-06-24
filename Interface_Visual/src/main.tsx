import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from './theme/theme'

const theme = getTheme()

window.onerror = function (msg, url, lineNo, columnNo, error) {
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h2>Erro Crítico na Aplicação</h2>
      <p><b>Mensagem:</b> ${msg}</p>
      <p><b>Arquivo:</b> ${url}:${lineNo}:${columnNo}</p>
      <pre style="background: #f4f4f4; padding: 10px; overflow: auto;">${error?.stack || ''}</pre>
    </div>
  `;
  return false;
};
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
