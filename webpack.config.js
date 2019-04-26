const webpack = require('webpack');

module.exports = {
    entry: './public/main.js',
    output: {
        path: __dirname,
        filename: './public/bundle.js'
    },
    target: 'node',
    watch: false,
    devServer: {
        port: 5000
    },
    cache: true,
    devtool: 'cheap-module-eval-source-map'
};
