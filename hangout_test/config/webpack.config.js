import webpack from 'webpack';
import path from 'path';

export default {
  entry: './src/index.js',
  cache: true,
  display: {
    errorDetails: true
  },
  output: {
    filename: './dist/app.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  resolve: {
    root: [
      path.resolve('src'),
      path.resolve('test')
    ],
    extensions: ['', '.js']
  },
  plugins: []
};
