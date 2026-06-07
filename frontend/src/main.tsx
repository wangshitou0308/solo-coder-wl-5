import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('发现新版本，是否立即更新？')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用')
  },
  onRegistered(r) {
    console.log('Service Worker 已注册:', r)
  },
  onRegisterError(error) {
    console.error('Service Worker 注册失败:', error)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
