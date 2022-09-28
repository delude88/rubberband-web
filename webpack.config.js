const path = require('path');

const worklets = [
    'src/worklet/rubberband-processor.ts',
]

const getFilename = (filepath) => path.parse(filepath).name

const bundle = (worklet) => {
    return {
        entry: path.resolve(__dirname, worklet),
        module: {
            rules: [
                {
                    test: /\.(js|jsx|tsx|ts)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                }
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        performance: {
            maxAssetSize: 600000,
            maxEntrypointSize: 600000
        },
        target: "webworker",
        output: {
            filename: `${getFilename(worklet)}.js`,
            path: path.resolve(__dirname, 'public'),
        }
    }
}

module.exports = worklets.map(worklet => bundle(worklet));
