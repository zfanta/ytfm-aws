const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  context: __dirname,
  entry: './src/frontend/index.tsx',
  resolve: {
    extensions: ['.json', '.ts', '.tsx', '.mjs', '.js', '.jsx'],
    symlinks: false,
    cacheWithContext: false,
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib'
    }
  },
  output: {
    path: path.join(__dirname, 'dist/frontend/serve'),
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'esbuild-loader',
      options: {
        loader: 'tsx',
        target: 'chrome91'
      }
    }, {
      test: /\.yaml$/,
      type: 'asset/resource'
    }, {
      test: /\.png$/,
      type: 'asset/resource'
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/frontend/index.html'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  devServer: {
    port: 1234,
    contentBase: path.join(__dirname, 'src/frontend'),
    historyApiFallback: {
      index: '/'
    },
    proxy: {
      '/api': 'http://localhost:3000/dev'
    }
  }
}
