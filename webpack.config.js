const Done = require('./plugins/done')
const Start = require('./plugins/start')
// 获取环境变量
const env = process.env.NODE_ENV;

const devConfig = {
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
}

const buildConfig = {
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

module.exports = env === 'start' ? devConfig : buildConfig;
