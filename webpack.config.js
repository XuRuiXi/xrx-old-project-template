const Done = require('./plugins/done')
const Start = require('./plugins/start')
module.exports = {
  devServer: {
    hot: true,
    open: true,
    proxy: {
      // 代理
      '/portal': {
        target: 'http://10.10.192.44:12022',
        pathRewrite: { '^/api': '' },
        changeOrigin: true,
      },
    }
  },
  loaders: [
    // {
    //   test: /\.(png|jpg)$/,
    //   use: require('./loaders/imgLoader'),
    // },
    {
      test: /\.js$/,
      use: function(source) {
        return `${source}`
      },
    }
  ],
  plugins: [new Done(), new Start()]
}
