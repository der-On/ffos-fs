"use strict";

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
        files.push(file);
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