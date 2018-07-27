const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const baseConfig = require('./webpack.base')

module.exports = Object.assign({}, baseConfig, {
  entry: Object.assign({}, baseConfig.entry, {
    app: [
      path.join(process.cwd(), 'app', 'polyfill.js'),
      path.join(process.cwd(), 'app', 'index.js')
    ],
    'login': [
      path.join(process.cwd(), 'app', 'polyfill.js'),
      path.join(process.cwd(), 'app', 'login.js')
    ]
  }),
  plugins: baseConfig.plugins.concat([
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(process.cwd(), 'app', 'index.html'),
      favicon: path.join(process.cwd(), 'app', 'static', 'images', 'favicon.ico'),
      chunks: ['vender', 'app']
    }),
    new HtmlWebpackPlugin({
      filename: 'login.html',
      template: path.join(process.cwd(), 'app', 'login.html'),
      favicon: path.join(process.cwd(), 'app', 'static', 'images', 'favicon.ico'),
      chunks:['vender', 'login']
    })
  ]),
  devServer: Object.assign({}, baseConfig.devServer, {
    before: require('../tools/app')
  })
})
