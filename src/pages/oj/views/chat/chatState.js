import { reactive } from 'vue'

// Vue 3 下用 reactive() 替代 new Vue({data}) 作为跨组件响应式状态
const chatState = reactive({
  messages: [],
  aiModel: 'agent',
  inputText: ''
})

export default chatState
