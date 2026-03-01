import React from 'react'
import ReactDOM from 'react-dom/client'
import { StoreProvider } from './store/index.jsx' // updated
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'))
const loadingEl = document.getElementById('loading')
if (loadingEl) loadingEl.style.display = 'none'

root.render(
  <StoreProvider>
    <App />
  </StoreProvider>
)
