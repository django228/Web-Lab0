import React from 'react'
import ReactDOM from 'react-dom/client'
import Application from './Application'
import bridge from '@vkontakte/vk-bridge'

bridge.send('VKWebAppInit', {})
  .then(() => bridge.send('VKWebAppGetClientVersion', {}))
  .catch((err) => {
    console.warn('VK Bridge initialization warning:', err)
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Application />
  </React.StrictMode>
)

