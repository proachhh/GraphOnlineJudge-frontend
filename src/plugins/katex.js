import 'katex'
import renderMathInElement from 'katex/contrib/auto-render/auto-render'
import 'katex/dist/katex.min.css'

function _ () {
}

const defaultOptions = {
  errorCallback: _,
  throwOnError: false,
  delimiters: [
    {left: '$$', right: '$$', display: true},
    {left: '$', right: '$', display: false},
    {left: '\\[', right: '\\]', display: true},
    {left: '\\(', right: '\\)', display: false}
  ]
}

function render (el, binding) {
  let options = {}
  if (binding && binding.value) {
    options = binding.value.options || {}
  }
  Object.assign(options, defaultOptions)
  renderMathInElement(el, options)
}

// 手动渲染指定元素内的数学公式
export function renderElement (el) {
  renderMathInElement(el, defaultOptions)
}

export default {
  install: function (Vue, options) {
    Vue.directive('katex', {
      bind: render,
      // update 在子节点更新前触发，用 nextTick 延迟到 DOM 更新后渲染
      update: function (el, binding) {
        Vue.nextTick(() => render(el, binding))
      },
      componentUpdated: render
    })
  }
}
