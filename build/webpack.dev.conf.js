'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

module.exports = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',
  devServer: {
    hot: true,
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/admin/index.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:80',   // Docker 后端暴露在 80 端口
        changeOrigin: true,
        logLevel: 'debug'                 // 可选，便于调试
      },
      '/public': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        logLevel: 'debug',
        onProxyRes: function(proxyRes, req, res) {
          delete proxyRes.headers['x-frame-options'];
          delete proxyRes.headers['X-Frame-Options'];
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),

    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: config.build.ojIndex,
      template: config.build.ojTemplate,
      chunks: ['oj'],
      inject: true
    }),
    new HtmlWebpackPlugin({
      filename: config.build.adminIndex,
      template: config.build.adminTemplate,
      chunks: ['admin'],
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
})
