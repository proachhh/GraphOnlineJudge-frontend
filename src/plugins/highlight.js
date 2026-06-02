import hljs from 'highlight.js/lib/highlight'
import cpp from 'highlight.js/lib/languages/cpp'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/atom-one-light.css'

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)

export default {
  install (Vue, options) {
    function setSelectable (target) {
      function applyStyle (el) {
        const style = el.style
        style.userSelect = 'text'
        style.webkitUserSelect = 'text'
        style.mozUserSelect = 'text'
        style.msUserSelect = 'text'
      }
      applyStyle(target)
      const walker = document.createTreeWalker(target, 1, null, false)
      let node
      while ((node = walker.nextNode())) {
        applyStyle(node)
      }
    }
    Vue.directive('highlight', {
      deep: true,
      bind: function (el, binding) {
        el.style.userSelect = 'text'
        el.style.webkitUserSelect = 'text'
        Array.from(el.querySelectorAll('code')).forEach((target) => {
          if (binding.value) {
            target.textContent = binding.value
          }
          hljs.highlightBlock(target)
          setSelectable(target)
        })
      },
      componentUpdated: function (el, binding) {
        el.style.userSelect = 'text'
        el.style.webkitUserSelect = 'text'
        Array.from(el.querySelectorAll('code')).forEach((target) => {
          if (binding.value) {
            target.textContent = binding.value
          }
          hljs.highlightBlock(target)
          setSelectable(target)
        })
      }
    })
  }
}
