<template>
  <textarea ref="editor"></textarea>
</template>
<script>
// 自研 CodeMirror 封装（替代仅支持 Vue 2 的 vue-codemirror-lite）
// 兼容旧用法：
//   <codemirror v-model="code" :options="opts" ref="editor"></codemirror>
//   <codemirror :value="code" :options="opts" @change="fn" ref="myEditor"></codemirror>
//   组件实例暴露 this.editor（CodeMirror 实例），与 vue-codemirror-lite 一致
import CodeMirror from 'codemirror'

export default {
  name: 'Codemirror',
  props: {
    modelValue: {
      type: String,
      default: undefined
    },
    value: {
      type: String,
      default: undefined
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'change'],
  data () {
    return {
      editor: null
    }
  },
  computed: {
    currentValue () {
      if (this.modelValue !== undefined && this.modelValue !== null) {
        return this.modelValue
      }
      return this.value
    }
  },
  watch: {
    currentValue (val) {
      if (this.editor && val != null && this.editor.getValue() !== val) {
        this.editor.setValue(val)
      }
    },
    options: {
      deep: true,
      handler (val) {
        if (this.editor && val) {
          for (let key in val) {
            this.editor.setOption(key, val[key])
          }
        }
      }
    }
  },
  mounted () {
    const opts = Object.assign({}, this.options, {value: this.currentValue || ''})
    this.editor = CodeMirror.fromTextArea(this.$refs.editor, opts)
    this.editor.on('change', () => {
      const val = this.editor.getValue()
      this.$emit('update:modelValue', val)
      this.$emit('change', val)
    })
  }
}
</script>
