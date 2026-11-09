import mitt from 'mitt'
// Vue 3 移除了 $on/$off/$once，用 mitt 实现跨组件事件总线
// 用法：bus.emit('event', payload) / bus.on('event', handler) / bus.off('event', handler)
const bus = mitt()
export default bus
