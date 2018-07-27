const webpack = require('webpack')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const devConfig = require('./webpack.dev')

module.exports = Object.assign({}, devConfig, {
  output: Object.assign({}, devConfig.output, {
    filename: 'scripts/[name]-[hash].js',
    chunkFilename: 'scripts/[name]-[hash].js'
  }),
  plugins:devConfig.plugins.filter((p) => {
    return p.constructor !== MiniCssExtractPlugin && p.constructor !== webpack.DefinePlugin
  }).concat([
    new webpack.DefinePlugin({
      YPMEi_LOGIN_URL:JSON.stringify('login.html')
    }),
    new MiniCssExtractPlugin({filename: "styles/[name]-[chunkhash:8].css"})
  ])
})
