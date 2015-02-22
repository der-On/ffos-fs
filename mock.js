"use strict";

var FileMock = function(filename, data)
{
  this.name = filename;
  this.lastModifiedDate = new Date();
  this.size = 0;
  this.type = 'text/unkown';
  this.data = data;
  this.blob = new Blob(Array.prototype.slice.call(data), {
    type: this.type
  });
  this.slice = this.blob.slice.bind(this.blob);
};

var Storage = function(type)
{
  var self = this;

  this.type = type;
  this.files = {};
  this.readdir = function(path)
  {
    var files = [];
    Object.keys(self.files).forEach(function(file) {
      if (file.indexOf(path) === 0) {
        files.push(self.files[file]);
      }
    });

    files.sort();
    return files;
  };
};

module.exports = function() {
  var global = (window || global);
  var navigator = (global.navigator || {});

  var storages = {
    'sdcard': new Storage('sdcard')
  };

  navigator.getDeviceStorage = function (type) {
    return storages[type] || null;
  };
};
module.exports.Storage = Storage;
module.exports.FileMock = FileMock;