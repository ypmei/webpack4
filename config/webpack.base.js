const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const I18nPlugin = require("i18n-webpack-plugin")

const lanuages = {
  'cn':null
}

module.exports = {
  entry: {},
  output: {
    publicPath: '',
    libraryTarget: 'umd',
    filename: 'scripts/[name].js',
    chunkFilename: 'scripts/[name].js',
    path: path.join(process.cwd(), 'dist')
  },
  optimization:{
    splitChunks:{
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        },
        commons: {
          name: 'vender',
          chunks: "all",
          minChunks: 2
        }
      }
    }
  },
  module:{
    rules: [
      {
        test: /\.js$/,
        exclude:[/node_modules/],
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => {
                return [
                  require('postcss-import')({root: loader.resourcePath}),
                  require('precss'),
                  require('postcss-advanced-variables'),
                  require('autoprefixer'),
                  require('cssnano')({
                    zindex: false
                  })
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.ico$/,
        loader: 'file-loader',
        query : {
          context:'app/',
          publicPath: '',
          name:'[path][name].[ext]'
        }
      },
      {
        test : /\.(woff|woff2|svg|eot|ttf|png|jpg|swf|jpeg)(\?t=[0-9]+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'static/[path][name]-[hash:8].[ext]',
              context: 'app/',
              publicPath: ''
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      YPMEI: path.join(process.cwd(), 'app', 'predefine.js'),
      "window.YPMEI": path.join(process.cwd(), 'app', 'predefine.js')
    }),
    new MiniCssExtractPlugin({filename: "styles/[name].css"}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      YPMEI_LOGIN_URL:JSON.stringify('ypmei')
    }),
    new I18nPlugin(lanuages['cn'])
  ],
  devServer: {
    noInfo: false,
    port: 3000,
    host: '0.0.0.0',
    stats: {
      chunks: false,
      assets: true,
      source: false,
      reasons: false,
      modules: false
    }
  }
}
