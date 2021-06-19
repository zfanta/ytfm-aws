const util = require('util')
const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.frontend.common')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  target: 'browserslist',
  output: {
    path: path.join(__dirname, 'dist/frontend/build')
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  optimization: {
  }
})

console.log(util.inspect(module.exports, false, null))
