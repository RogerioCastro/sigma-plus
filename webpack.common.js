const path = require('path')

module.exports = {
  entry: {
    'sigma-plus': {
      import: './src/index.js',
      filename: '[name].min.js',
      publicPath: path.resolve(__dirname, 'dist'),
      library: {
        name: 'SigmaPlus',
        type: 'umd',
        export: 'default'
      }
    },
    demo: {
      dependOn: 'sigma-plus',
      import: './src/demo.js',
      filename: '[name].min.js',
      publicPath: path.resolve(__dirname, 'dist')
    }
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.glsl$|\.vs$|\.fs$/,
        use: 'webpack-glsl-loader'
      }
    ],
  }
}
