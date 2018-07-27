const devConfig = require('./webpack.prod')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = Object.assign({}, devConfig, {
  plugins: devConfig.plugins.concat([
    new BundleAnalyzerPlugin()
  ]),
  devServer:{
    disableHostCheck: true,
    proxy: {
      '/ypmei': {
        target: 'http://127.0.0.1:8000/',
        changeOrigin: true
      }
    },
    noInfo:false,
    port: 3000,
    host:'0.0.0.0',
    stats:{
      chunks:false,
      assets:true,
      source:false,
      reasons:false,
      modules:false
    }
  }
})
