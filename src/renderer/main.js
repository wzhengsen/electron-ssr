import Vue from 'vue'
import './components'
import { getInitConfig, register } from './ipc'
import store from './store'
import App from './App'
import i18n from './i18n'
register()
Vue.config.productionTip = false

// 启动应用时获取初始化数据
getInitConfig().then(() => {
  /* eslint-disable no-new */
  new Vue({
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')
})
