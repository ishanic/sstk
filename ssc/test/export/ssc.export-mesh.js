'use strict';
/* jshint esversion: 6 */

var async = require('async');
var expect = require('chai').expect;
var shell = require('shelljs');
var fs = require('fs');
var path = require('path');
//var csvparser = require('papaparse');
var STK = require('../../stk-ssc');
var _ = STK.util;

var testutil = require('../render/render-testutil');
var referenceDir = __dirname + '/ref/';
var outputDir = __dirname + '/out/';

var sscdir = __dirname + "/../../";
//var data = STK.util.readSync(__dirname + '/data/suncg/testScenes.csv');
//var parsed = csvparser.parse(data, { header: true, skipEmptyLines: true, dynamicTyping: true });
//var testEntries = parsed.data;

var shapeNetTestIds = [
  '2c55ab36465941714dad8cf98230ae26', // Bookcase with books (white redundant surface)
  'd8358969dad764edbb6f5a9e4b6b8b34', // Chair with cover (cover has patterned surface and inner side has material as chair)
  '146d5859bbd8d629bbf88898fc491e0c', // Microwave with cup inside (white inner surface that should be kept)
  '9ae261771f20269a2cc2573cdc390405', // Keyboard - lots of pieces so current hausdorff distance takes too long (white redundant surface)
  '11c8463ba58a134b68661782af60b711', // Clock with texture - some issue in getting image data in branch with three r84, okay with three r95
  '2b4f2fc77c47056eaefb25a27e962525', // not so great chair with inner surface that is visible
  '77daa3ded63dc634d83e8d4109d37961', // glass table (white redundant surface)
  'eeabc27816119ff429ae5ea47a8f21e0', // ping pong table (white redundant surface)
  '5ef9520bbefc05c9e8b292c1c2152aed', // weird transparent coffee table box
  '537c7bd16e8a00adbbc9440457e303e',  // Chair with texture
  '764abaffc5872775f0dff71ec76b46f7', // Transparent png
  '4b71f633ddb55c6e309160eb001312fe', // Chair with inner red surface, other white surface
  'dac4af24e2facd7d3000ca4b04fcd6ac', // Chair with patterned green and white (some are double sided)
  '7aabc57856fc6659597976c675750537', // Chair with fine texture
  '1cc9f441f6633b932d9da001bf4482cc', // Piano with inner surface (all front surfaces)
  '225905a8841620d7f6fe1e625c287cfa', // Refrigerator with internal structure
  '1175801334a9e410df3a1b0d597ce76e', // Refrigerator with internal structure
  '6bf1559769018cbb354b166143712fb3', // headphone
  '118083b82350b53cb23e7e4bd2944793', // monitor
  '14c9e39b05dd2cf2a07f2e5419bb2c4', // flat screen monitor
  'a87214036fbca69e84a172a28c2dc', // monitor with image and extra internal surfaces
  '12a73c63681d65587a0f32fa630f6a0e', // transparent table
];
function getShapeNetFileEntry(id) {
  return {
    'input': `/Users/angelx/work/sample-points/${id}/${id}.kmz`,
//    'input': `/Users/angelx/work/kmzv2/${id}/${id}.kmz`,
    input_type: "path"
  };
}
function getShapeNetIdEntry(id) {
  return {
    input: `3dw.${id}`,
    input_type: "id"
  }
}
var testEntries = [];
for (var i = 0; i < shapeNetTestIds.length; i++) {
//  testEntries.push(getShapeNetFileEntry(shapeNetTestIds[i]));
  testEntries.push(getShapeNetIdEntry(shapeNetTestIds[i]));
}

describe('STK SSC export-mesh', function () {
  before(function (done) {  // runs before all tests in this block
    // clear out previous test images
    testutil.clear_dir(outputDir);
    done();
  });

  after(function (done) {  // runs after all tests in this block
    done();
  });

  async.each(testEntries, function (entry, cb) {
    var name;
    if (entry.input_type === 'id') {
      name = entry.input.split('.')[1];
    } else {
      name = path.basename(entry.input).split('.')[0];
    }
    it('export obj/mtl for ' + name, function (done) {
      var opts = _.map(entry, function(v,k) { return `--${k} ${v}`}).join(' ');
      var sample_cmd = `${sscdir}/export-mesh.js --input_format kmz --assetType model --output_format obj --export_textures copy --texture_path images --require_faces --use_search_controller --include_group  --normalize_size diagonal --center --handle_material_side --output_dir ${outputDir} ${opts}`;
      console.log("Running " + sample_cmd);
      shell.exec(sample_cmd);
      var exportMeshFilename = `${outputDir}/${name}/${name}.obj`;
      expect(fs.existsSync(exportMeshFilename), 'Has obj mesh output file ' + exportMeshFilename).to.be.ok;
      var render_cmd = `${sscdir}/render-file.js --config_file ${sscdir}/config/render_shapenetv2_obj.json --assetType model --width 500 --height 500 --compress_png --input ${exportMeshFilename} --output_dir ${outputDir}/${name}`;
      testutil.run_and_compare(render_cmd, `${referenceDir}/${name}/`, `${outputDir}/${name}/`, name + '.png', 0.01);
      done();
    }).timeout(120000);  // wait up to two minutes
    cb();
  });
});
