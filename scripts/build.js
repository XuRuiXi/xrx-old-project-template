const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const outputPath = path.resolve(cwd, 'dist');
const { exec } = require('child_process');
const { SyncHook } = require('tapable');
const babel = require('@babel/core');

const cheerio = require('cheerio');

const hooks ={
  start: new SyncHook(['none']),
  done: new SyncHook(['stats']),
}

// 存放所有文件的路径
let allFiles = [];

// 获取配置的loader
const { loaders } = require(path.resolve(cwd, 'webpack.config.js'));
// 获取配置的plugins
const { plugins = [] } = require(path.resolve(cwd, 'webpack.config.js'));

plugins.forEach(plugin => {
  plugin.apply(hooks);
});

console.time('总耗时');
// 过滤掉的目录
const filterDirs = ['node_modules', 'dist', 'scripts', 'loaders', 'plugins'];
// 过滤掉的文件
const filterFiles = ['package.json', 'postcss.config.js', '.babelrc', 'webpack.config.js'];
// 过滤掉的目录和文件
const filterDirsAndFiles = [...filterDirs, ...filterFiles];
// 不处理转译的文件
const noBabelFiles = fs.readdirSync(path.resolve(cwd, 'public'));

// 文件总数
let total = 0;

// 已处理文件总数
let jsParsedTotal = 0;

// 输出执行情况
function logDetail() {
  console.log(`已处理${jsParsedTotal}/${total}个文件`);
  if (jsParsedTotal === total) {
    console.log('打包完成');
    console.timeEnd('总耗时');
    // 执行plugin开始钩子
    hooks.done.call(allFiles);
  }
}

// 解决路径的问题
function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

// 删除这个目录和里面的文件
function deleteDir(dir) {
  // 读取目录
  const paths = fs.readdirSync(dir);
  paths.forEach((path) => {
    const _path = dir + '/' + path;
    const stat = fs.statSync(_path);
    // 判断是否为文件
    if (stat.isFile()) fs.unlinkSync(_path);
    // 如果是目录，递归调用自身
    else if (stat.isDirectory()) deleteDir(_path);
  });
  // 删除目录
  fs.rmdirSync(dir);
}

// 建立一个空的dist目录
if (fs.existsSync(outputPath)) deleteDir(outputPath);
fs.mkdirSync(outputPath);

// 返回一个promise的exec函数，用于执行命令
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

// 处理html文件
function handleHtml(_src, _dist) {
  return new Promise(async (_resolve) => {
    // 读取文件内容
    let data = fs.readFileSync(_src, 'utf8');
    const $ = cheerio.load(data);
    const scripts = $('script');
    const styles = $('style');

    // 统计已处理的标签数据
    let parsedTagTotal = 0;
    // 总的标签数据
    const totalTag = scripts.length + styles.length;


    // 处理script标签
    scripts.each((i, script) => {
      const code = $(script).html();
      // 如果没用js代码，直接返回
      if (!code) {
        parsedTagTotal++;
        return;
      }
      // 创建一个临时的js文件，用于babel编译
      const tempJsPath = path.resolve(outputPath, Math.random() + '.js');
      // 写入js，并使用babel编译js代码
      fs.writeFileSync(tempJsPath, code, 'utf8');
      // 使用babel编译js代码
      babel.transformFile(tempJsPath, {}, (err, result) => {
        if (err) throw err;
        // 读取编译后的js代码
        const babelCode = result.code;
        // 删除临时的js文件
        fs.unlinkSync(tempJsPath);
        // 替换原来的js代码
        $(script).html(babelCode)
        // 写入文件
        fs.writeFileSync(_dist, $.html(), 'utf8');
        // 如果已经处理完所有标签，执行resolve
        if (++parsedTagTotal === totalTag) _resolve();
      });
    });

    // 处理style标签
    styles.each((i, style) => {
      const code = $(style).html();
      // 如果没用css代码，直接返回
      if (!code) {
        parsedTagTotal++;
        return;
      }
      // 创建一个临时的css文件，用于postcss编译
      const tempCssPath = path.resolve(outputPath, Math.random() + '.css');
      // 写入css，并使用postcss编译css代码
      fs.writeFileSync(tempCssPath, code, 'utf8');
      // 使用postcss编译css代码
      execPromise(`${resolve('./node_modules/.bin/postcss')} ${tempCssPath} -o ${tempCssPath}`).then(() => {
        // 读取编译后的css代码
        const postcssCode = fs.readFileSync(tempCssPath, 'utf8');
        // 删除临时的css文件
        fs.unlinkSync(tempCssPath);
        // 替换原来的css代码
        $(style).html(postcssCode)
        // 写入文件
        fs.writeFileSync(_dist, $.html(), 'utf8');
        // 如果已经处理完所有标签，执行resolve
        if (++parsedTagTotal === totalTag) _resolve();
      });
    });
  });
}

// 根据路径复制文件
function copyFile(_src, _dist) {
  fs.copyFileSync(_src, _dist);
  jsParsedTotal++;
  logDetail();
}

// 执行plugin开始钩子
hooks.start.call([]);

function copyDir(src, dist) {

  let paths = fs.readdirSync(src, 'utf8');

  paths = paths.filter((path) => !filterDirsAndFiles.includes(path));

  // 查找出所有文件
  const files = paths.filter((_path) => fs.statSync(path.resolve(src, _path)).isFile());

  total += files.length;
  // 查找出所有目录
  const dirs = paths.filter((_path) => fs.statSync(path.resolve(src, _path)).isDirectory());

  for (let i = 0; i < files.length; i++) {
    let _src = path.resolve(src, files[i]);
    const _dist = path.resolve(dist, files[i]);
    allFiles.push(_dist);

    // 是否产生临时文件
    let isTempFile = false;
    // 临时文件路径
    let tempPath = '';

    loaders.length && loaders.forEach((loader) => {
      // 如果是不处理列表中的文件，不做任何操作
    if (noBabelFiles.includes(files[i])) return;
      if (loader.test.test(_src)) {
        // 获取文件后缀
        const ext = path.extname(_src);
        tempPath = path.resolve(outputPath, Math.random() + ext);

        // 将_src的文件，复制到_tempPath
        fs.copyFileSync(_src, tempPath);
        isTempFile = true;

        const sourceType = loader.use.raw ? '' : 'utf8';
        let source = fs.readFileSync(_src, sourceType);
        source = loader.use.call({
          path: _src
        }, source)
        fs.writeFileSync(tempPath, source, sourceType);
      }
    });


    // 如果有临时文件，则_src为临时文件路径
    if (isTempFile) _src = tempPath;


    // 如果是不处理列表中的文件，直接复制
    if (noBabelFiles.includes(files[i])) {
      copyFile(_src, _dist)
    }

    // 判断是否js文件，如果是，就调用babel进行编译。
    // 使用这种方式编译的js，也会受到.babelrc的影响
    else if (_src.endsWith('.js')) {
      babel.transformFile(_src, {}, (err, result) => {
        if (err) throw err;
        fs.writeFileSync(_dist, result.code, 'utf8');
        jsParsedTotal++;
        logDetail();
        // 如果有临时文件，则删除
        if (isTempFile) fs.unlinkSync(_src)
      });
    }

    // 判断是否为css文件，如果是，就调用postcss进行编译
    else if (_src.endsWith('.css')) {
      execPromise(`${resolve('./node_modules/.bin/postcss')} ${_src} -o ${_dist}`).then(() => {
        jsParsedTotal++;
        logDetail();
        // 如果有临时文件，则删除
        if (isTempFile) fs.unlinkSync(_src)
      });
    }

    // 判断是不是html文件
    else if (_src.endsWith('.html')) {
      handleHtml(_src, _dist).then(() => {
        jsParsedTotal++;
        logDetail();
      });
    }

    else {
      /* 除了js、css、html外文件的处理 */
      copyFile(_src, _dist);
      if (isTempFile) fs.unlinkSync(_src)
    }
  }

  for (let i = 0; i < dirs.length; i++) {
    const _src = path.resolve(src, dirs[i]);
    const _dist = path.resolve(dist, dirs[i]);
    // 递归目录
    if (!fs.existsSync(_dist)) fs.mkdirSync(_dist);
    copyDir(_src, _dist)
  }
}

copyDir(path.resolve(cwd), outputPath);