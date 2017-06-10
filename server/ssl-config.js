/**
 * Created by zkuang on 16-1-28.
 */
var path = require('path'),
  fs = require('fs');
exports.privateKey = fs.readFileSync(path.join(__dirname, './private/214086521170803.key')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, './private/214086521170803.pem')).toString();
