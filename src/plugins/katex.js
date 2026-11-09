import 'katex'
import renderMathInElement from 'katex/contrib/auto-render/auto-render'
import 'katex/dist/katex.min.css'
import { nextTick } from 'vue'

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
  install: function (app, options) {
    // Vue 3 指令钩子：bind → beforeMount, update/componentUpdated → updated
    app.directive('katex', {
      beforeMount: render,
      updated: function (el, binding) {
        nextTick(() => render(el, binding))
      }
    })
  }
}
