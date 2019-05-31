const webpack = require('webpack')
const fs = require('fs')
const {resolve, join} = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const ManifestPlugin = require('webpack-manifest-plugin')
const {getIfUtils, removeEmpty} = require('webpack-config-utils')
const {ifProduction} = getIfUtils(process.env.NODE_ENV)
const nodeModules = {}

fs.readdirSync('node_modules')
  .filter(file => !file.includes('.bin'))
  .forEach((module) => {
    nodeModules[module] = `commonjs ${module}`
  })

module.exports = {
  mode: ifProduction('production', 'development'),
  entry: './src/app',
  output: {
    path: resolve('app/dist/static'),
    chunkFilename: ifProduction('scripts/[name].chunk.js?v=[chunkhash]', 'scripts/[name].chunk.js')
  },
  resolve: {
    modules: [
      resolve('src'),
      'node_modules'
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    mainFiles: ['index']
  },
  stats: {
    colors: true,
    reasons: true,
    chunks: false
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: resolve(__dirname, 'src')
      },
      {
        test: /\.tsx?$/,
        loader: 'tslint-loader',
        enforce: 'pre',
        include: resolve(__dirname, 'src')
      },
      {
        test: /\.(t|j)sx?$/,
        include: resolve(__dirname, 'src'),
        use: [
          {loader: 'babel-loader'},
          {loader: 'ts-loader'}
        ]
      },
      {
        test: /\.css$/,
        include: resolve(__dirname, 'src'),
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            query: {
              minimize: true,
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: '[local]_[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: resolve(__dirname, 'shared'),
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            query: { minimize: true }
          }
        ]
      },
      {
        test: /\.(ttf|eot|otf|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        include: resolve(__dirname, 'src'),
        loader: 'url-loader',
        options: {
          ...(process.env.TARGET !== 'electron-renderer' ? { limit: 1024 } : null),
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\.(ico|png|jpg|svg|gif)$/,
        include: resolve(__dirname, 'src'),
        loader: 'url-loader',
        options: {
          ...(process.env.TARGET !== 'electron-renderer' ? { limit: 10240 } : null),
          name: 'images/[name].[ext]?v=[hash:base64:5]'
        }
      }
    ]
  },
  plugins: removeEmpty([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
        APP_ENV: JSON.stringify(process.env.APP_ENV || 'production')
      }
    }),
    new webpack.NormalModuleReplacementPlugin(/.\/production/, `./${process.env.APP_ENV}.json`),
    new MiniCssExtractPlugin({
      filename: ifProduction('styles/bundle.css?v=[hash]', 'styles/bundle.css'),
      chunkFilename: ifProduction('styles/[name].chunk.css?v=[chunkhash]', 'styles/[name].chunk.css')
    }),
    new HtmlWebpackPlugin({
      inject: false,
      minify: { collapseWhitespace: true },
      template: 'app/index.html',
      appMountId: 'app',
      mobile: true
    }),
    new CopyWebpackPlugin([
      {
        from: join(__dirname, 'src/libs'),
        to: join(__dirname, 'app/dist/libs')
      }
    ], { copyUnmodified: true })
  ])
}
