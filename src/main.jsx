import React from 'react'
import ReactDOM from 'react-dom/client'
import { StoreProvider } from './store/index.jsx' // updated
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'))
document.getElementById('loading').style.display = 'none'

root.render(
  <StoreProvider>
    <App />
  </StoreProvider>
)
