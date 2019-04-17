const webpack = require('webpack');

module.exports = {
  entry: './main.js',
  output: {
    path: __dirname,
    filename: './public/bundle.js'
  },
  target: 'node',
  devServer: {
    port: 5000
  }
};
