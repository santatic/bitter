// https://github.com/jsecademy/webpack-express-typescript
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    target: 'node',
    devtool: 'inline-source-map',
    entry: {
        main: './src/server.ts'
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
            }]
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.node'],
        modules: [
            `${global}/node_modules`,
            'node_modules'
        ]
    },
    output: {
        filename: 'server.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: "commonjs"
    },
    externals: [
        /^[a-z\-0-9]+$/ // Ignore node_modules folder
    ],
    plugins: [
        new UglifyJsPlugin()
    ]
};