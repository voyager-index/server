const webpack = require('webpack');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        main: './public/main.js'
    },
    output: {
        path: __dirname,
        filename: './public/[name].bundle.js',
        library: "Voyager",
        libraryTarget: "umd",
        chunkFilename: '[name]-[chunkhash].js'
    },
    target: 'web',
    watch: false,
    devServer: {
        port: 5000
    },
    cache: true
};
