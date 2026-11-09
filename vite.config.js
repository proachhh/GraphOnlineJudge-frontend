import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const resolve = (dir) => path.resolve(__dirname, dir)

// 生产构建使用 CDN 占位符前缀（由服务器 entrypoint.sh 的 sed 替换机制接管，与旧 webpack 构建保持一致）
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/__STATIC_CDN_HOST__/' : '/',
  plugins: [vue({
    template: {
      compilerOptions: {
        // @vue/compat 迁移构建：以 Vue 2 兼容模式编译既有模板
        // （支持旧 filter 管道、slot 属性、slot-scope、.sync 等语法，后续渐进清理）
        compatConfig: { MODE: 2 }
      },
      // 模板资源 URL 转换只处理相对路径/@别名（src/assets 下的图）；
      // 绝对路径（/static/pictures/... 指向 public 目录）保持原样，交给运行时按 URL 加载
      transformAssetUrls: {
        // plugin-vue 5.x / compiler-sfc 3.5 的选项名为 includeAbsolute（非 includeAbsoluteUrls）
        includeAbsolute: false
      }
    }
  })],
  resolve: {
    alias: {
      'vue': '@vue/compat',
      '@': resolve('src'),
      '@oj': resolve('src/pages/oj'),
      '@admin': resolve('src/pages/admin')
    },
    extensions: ['.mjs', '.js', '.vue', '.json']
  },
  publicDir: 'public',
  define: {
    'process.env.VERSION': JSON.stringify(process.env.VERSION || 'dev'),
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development')
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    chunkSizeWarningLimit: 2048,
    rollupOptions: {
      input: {
        index: resolve('index.html'),
        admin: resolve('admin/index.html')
      },
      output: {
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names && assetInfo.names[0] ? assetInfo.names[0] : ''
          if (name.endsWith('.css')) {
            return 'static/css/[name].[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
            return 'static/img/[name].[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
            return 'static/fonts/[name].[hash][extname]'
          }
          return 'static/other/[name].[hash][extname]'
        }
      }
    }
  }
}))
