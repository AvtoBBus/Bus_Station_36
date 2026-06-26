const fs = require('fs');
const glob = require('glob');
var jimp = require('jimp');
var dotenv = require('dotenv');

const FILE_NAME = process.env.FILE_NAME ?? 'sprites'; // Имя выходного файла
const RESIZE_KOEF = process.env.RESIZE_KOEF ?? 2; // Если нужно уменьшить картинки, то поставить <1 по умолчанию для @2x используется 2

// Load in dependencies
var Spritesmith = require('spritesmith');

// Create a new spritesmith and process our images
var sprites = [...glob.sync('img/**/*.png')];
var spritesmith = new Spritesmith();
spritesmith.createImages(sprites, function handleImages(err, images) {
  if(err) throw(err);

  // Create our result
  var result = spritesmith.processImages(images);

  const sprites_png = result.image;
  const sprites_json = result.coordinates;

  // Save image
  const write_stream=fs.createWriteStream(`dist/${FILE_NAME}.png`);
  sprites_png.pipe(write_stream);
  sprites_png.on('end', () => {
    jimp.read(`dist/${FILE_NAME}.png`, (err, sprites) => {
      if (err) throw err;
      // @2x
      sprites
        .scale(RESIZE_KOEF, jimp.RESIZE_) // resize
        .write(`dist/${FILE_NAME}@2x.png`); // save
      });
  });

  // save json.
  
  // This fix here covers a particular case, should be elsewhere
  const sprites_json_fixed = Object.entries(sprites_json).reduce((dst, [key, val]) => {
    dst[key.replace('img/', '').replace('.png', '')] = {
      x: val.x + 1,
      y: val.y + 1,
      width: val.width - 2,
      height: val.height -2,
      pixelRatio: 2,
      visible: true
    };
    return dst;
  }, {});
  fs.writeFileSync(`dist/${FILE_NAME}.json`, JSON.stringify(sprites_json_fixed, null, 2));

  // @2x
  const sprites_json_2x = Object.entries(sprites_json_fixed).reduce((dst, [key, val]) => {
    dst[key.replace('img/', '').replace('.png', '')] = {
      x: RESIZE_KOEF * val.x,
      y: RESIZE_KOEF * val.y,
      width: RESIZE_KOEF * val.width,
      height: RESIZE_KOEF * val.height,
      pixelRatio: 2,
      visible: true
    };
    return dst;
  }, {});
  fs.writeFileSync(`dist/${FILE_NAME}@2x.json`, JSON.stringify(sprites_json_2x, null, 2));

});
