const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        popup: './src/popup.js',
        inject: './src/inject.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        iife: false,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: 'static' }],
        }),
    ],
    mode: "production",
}
