"use strict";

var FileMock = function(filename, type, data)
{
  var self = this;
  this.name = filename.split(':', 2)[1];
  this.lastModifiedDate = new Date();
  this.size = 0;
  this.type = 'text/plain';
  this.data = data;
  this.blob = new Blob([data], {
    type: this.type
  });
  this.buffer = getArrayBuffer();

  this.slice = this.blob.slice.bind(this.blob);

  this.toText = function()
  {
    return this.data.toString();
  };

  this.toBinaryString = function()
  {
    return this.data.toString();
  };

  this.toDataURL = function()
  {
    return this.data.toString();
  };

  this.toArrayBuffer = function()
  {
    return this.buffer;
  };

  function getArrayBuffer()
  {
    var buffer = new ArrayBuffer(self.data.length);
    for(var i = 0; i < self.data.length; i++) {
      buffer[i] = self.data[i];
    }

    return buffer;
  }
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