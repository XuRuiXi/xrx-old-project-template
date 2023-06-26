const uglifyJs = require('uglify-js');
const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const noBabelFiles = fs.readdirSync(path.resolve(cwd, 'public'));

class done {
  constructor() {
    this.name = 'done';
  }
  apply(hooks) {
    hooks.done.tap(this.name, stats => {
        console.log('done');
      //   const allfiles = stats;
      //   const jsFiles = allfiles.filter(file => file.endsWith('.js'));
      //   jsFiles.forEach(file => {
      //     // 获取文件名
      //     const fileName = path.basename(file);
      //     // 如果是不需要转译的文件，直接返回
      //     if (noBabelFiles.includes(fileName)) return;
      //     // file使用uglify-js压缩
      //     const result = uglifyJs.minify(fs.readFileSync(path.resolve(cwd, file), 'utf-8'));
      //     // 写入文件
      //     fs.writeFileSync(path.resolve(cwd, file), result.code);
      //   }
      // );
    });
  }
}

module.exports = done;
