const images = require("images");
const path = require("path");
const fs = require("fs");
function imgLoader(scorce) {
  // 获取文件后缀
  const ext = path.extname(this.path);
  // 临时路径
  const tempPath = path.resolve(process.cwd(), `${Date.now()}${ext}`);
  images(this.path).save(tempPath, {
    quality: 50
  });
  // 获取临时图片文件
  const _source = fs.readFileSync(tempPath);
  setTimeout(() => {
    fs.unlinkSync(tempPath);
  });
  return _source;
}

// 这只source是一个二进制的buffer
imgLoader.raw = true;

module.exports = imgLoader;