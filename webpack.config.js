const webpack = require('webpack');

module.exports = {
  entry: './public/main.js',
  output: {
    path: __dirname,
    filename: './public/bundle.js'
  },
  target: 'node',
  watch: true,
  devServer: {
    port: 5000
  }
};
