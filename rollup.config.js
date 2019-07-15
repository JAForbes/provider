import common from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: {
        main: 'src/index.js'
    },
    output: {
        dir: 'dist',
        format: 'esm'
    },
    plugins: [
        common(),
        resolve()
    ]
}