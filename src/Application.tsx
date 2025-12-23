import { AppRoot, View, ConfigProvider, AdaptivityProvider } from '@vkontakte/vkui'
import '@vkontakte/vkui/dist/vkui.css'
import ContentPanel from './screens/ContentPanel'

const Application = () => (
  <ConfigProvider>
    <AdaptivityProvider>
      <AppRoot>
        <View activePanel="home">
          <ContentPanel id="home" />
        </View>
      </AppRoot>
    </AdaptivityProvider>
  </ConfigProvider>
)

export default Application

