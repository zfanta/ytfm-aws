const util = require('util')
const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.frontend.common')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  target: 'browserslist:last 1 Chrome versions',
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
  }
})

console.log(util.inspect(module.exports, false, null))
