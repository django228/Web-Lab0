import React from 'react'
import ReactDOM from 'react-dom/client'
import Application from './Application'
import bridge from '@vkontakte/vk-bridge'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Application />
)

bridge.send('VKWebAppInit', {})
  .then(() => bridge.send('VKWebAppGetClientVersion', {}))
  .catch(() => {})

