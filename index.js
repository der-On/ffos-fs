var mock = require('./mock');

module.exports = new (function() {
  function hasDeviceStorage()
  {
    if (!navigator || typeof navigator.getDeviceStorage !== 'function') {
      console.warn('Your Browser does not support device storage.');
      return false;
    }

    return true;
  }

  hasDeviceStorage();

  var self = this;
  var mocked = false;

  function toArray(arr)
  {
    return Array.prototype.slice.apply(arr);
  }

  function getStorageTypeFromPath(path)
  {
    var type = path.split(':', 2)[0];
    return type;
  }

  function getPathWithoutStorageType(path)
  {
    var parts = path.split(':');
    if (parts.length > 1) {
      return parts.slice(1).join(':');
    }
    else {
      return path;
    }
  }

  function getStorage(type)
  {
    if (!hasDeviceStorage()) {
      return null;
    };

    return navigator.getDeviceStorage(type);
  }

  function getStorageForPath(path)
  {
    return getStorage(
      getStorageTypeFromPath(path)
    );
  }

  function getEditableFile(fd, callback)
  {
    if (fd instanceof LockedFile)
    {
      callback(null, fd);
      return;
    }
    else if(fd instanceof File)
    {
      self.open(fd.fullname || fd.name, 'w', callback);
      return;
    }
    else if (fd instanceof FileHandle)
    {
      callback(null, fd.open());
    }
    else {
      callback(new Error('No valid File given.'));
      return;
    }
  }

  function getReadableFile(fd, callback)
  {
    if (fd instanceof LockedFile)
    {
      callback(null, fd);
      return;
    }
    else if(fd instanceof File)
    {
      callback(null, fd);
      return;
    }
    else if (fd instanceof FileHandle)
    {
      var request = fd.getFile();
      request.onsuccess = function() {
        callback(null, this.file);
      };
      request.onerror = function()
      {
        callback(this.error);
      };
      return;
    }
    else {
      callback(new Error('No valid File given.'));
      return;
    }
  }

  /**
   * Sets the filesystem to a mocking in-memory filesystem.
   */
  this.mock = function()
  {
    mock();
    mocked = true;
    console.warn('Using in memory mock for filesystem now.');
  };

  this.open = function(path, flags, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    path = path.trim();
    var storage = getStorageForPath(path);

    if (!storage) {
      callback(new Error('Unable to find entry point for ' + path + '.'));
      return;
    }

    var method = 'get';

    switch(flags) {
      case 'r':
        method = 'get';
        break;

      case 'w':
        method = 'getEditable';
        break;
    }

    var request = storage[method](getPathWithoutStorageType(path));

    request.onsuccess = function() {
      callback(null, this.result);
    };
    request.onerror = function() {
      callback(this.error, null);
    };
  };

  this.exists = function(path, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    if (mocked) {
      existsMock(path, callback);
      return;
    }

    this.open(path, 'r', function(error, file) {
      callback(null, (error) ? false : true);
    });
  };

  function existsMock(path, callback)
  {
    var storage = getStorageForPath(path);
    if (storage) {
      callback(null, (storage.files[path]) ? true : false);
    }
    else {
      callback(new Error('Unable to find entry point for ' + path + '.'));
    }
  }

  this.read = function(fd, blob, offset, length, position, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    if (!fd) {
      throw new Error('Missing File.');
      return;
    }
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('Missing or invalid Blob.');
      return;
    }

    getReadableFile(fd, function(error, fd) {
      if (error) {
        callback(error);
        return;
      }

      var offset = offset || 0;
      var length = length || fd.size;
      if (length > fd.size) {
        length = fd.size;
      }
      var position = position || 0;

      blob.splice(
        offset,
        length,
        fd.slice(position, length)
      );
      callback(null, length, blob);
    });
  };

  this.readFile = function(/* filename, [options], callback */)
  {
    var args = toArray(arguments);

    var filename = args.shift();
    var callback = args.pop();
    var opts = args.pop() || {};

    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    var options = {
      encoding: opts.encoding || 'utf8',
      format: opts.format || 'text',
      flag: opts.flag || 'r'
    };

    if (mocked) {
      readFileMock(filename, options, callback);
      return;
    }

    this.open(filename, options.flag, function(error, fd) {
      if (error) {
        callback(error);
        return;
      }

      getReadableFile(fd, function(error, fd) {
        if (error) {
          callback(error);
          return;
        }

        var reader = new FileReader();

        reader.onerror = function(error)
        {
          callback(error);
        };
        reader.addEventListener('loadend', function() {
          callback(null, reader.result);
        });

        switch(options.format) {
          case null:
          case 'text':
            reader.readAsText(fd, options.encoding);
            break;
          case 'binary':
            reader.readAsBinaryString(fd);
            break;

          case 'dataURL':
            reader.readAsDataURL(fd);
            break;

          case 'buffer':
            reader.readAsArrayBuffer(fd);
            break;

          default:
            reader.readAsText(fd, options.encoding);
        }
      });
    });
  };

  function readFileMock(filename, options, callback)
  {
    var storage = getStorageForPath(filename);

    if (!storage) {
      callback(new Error('Unable to find entry point for ' + filename + '.'));
      return;
    }

    var file = storage.files[filename] || null;
    var data = null;
    if (file) {
      switch(options.format) {
        case 'text':
          data = file.toText();
          break;

        case 'binary':
          data = file.toBinaryString();
          break;

        case 'dataURL':
          data = file.toDataURL();
          break;

        case 'buffer':
          data = file.toArrayBuffer();
          break;

        default:
          data = file.toText();
      }
    }

    callback(null, data);
  }

  this.write = function(fd, buffer, offset, length, position, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    if (!fd) {
      throw new Error('Missing File.');
      return;
    }

    if (!buffer || (!(buffer instanceof ArrayBuffer) && typeof buffer !== 'string')) {
      throw new Error('Missing or invalid Buffer.');
      return;
    }

    getEditableFile(fd, function(error, fd) {
      if (error) {
        callback(error);
        return;
      }

      var offset = offset || 0;
      var length = length || buffer.length;
      if (length > buffer.length) {
        length = buffer.length;
      }
      var position = position || 0;
      var data;

      if (buffer instanceof ArrayBuffer) {
        data = buffer.slice(offset, length);
      }
      else {
        data = buffer.substr(offset, length);
      }

      var request = fd.write(data);
      request.onsuccess = function() {
        callback(null, length, buffer);
      };
      request.onerror = function() {
        callback(this.error, 0, buffer);
      };
    });
  };

  this.writeFile = function(/* filename, data, [options], callback */)
  {
    var args = toArray(arguments);

    var filename = args.shift();
    var data = args.shift();
    var callback = args.pop();
    var opts = args.pop() || {};
    var options = {
      encoding: opts.encoding || 'utf8',
      mimetype: opts.mimetype || 'text/plain',
      flag: opts.flag || 'w'
    };

    if (typeof callback !== 'function') {
      var callback = function() {};
    }

    this.exists(filename, function(error, exists) {
      if (error) {
        callback(error);
        return;
      }

      if (mocked) {
        writeFileMock(filename, data, options, callback);
        return;
      }

      var storage = getStorageForPath(filename);

      if (!storage) {
        callback(new Error('Unable to find entry point for ' + filename + '.'));
        return;
      }

      // get existing file for writing
      if (exists) {
        self.open(filename, options, function(err, fd) {
          if (err) {
            callback(err);
            return;
          }

          // TODO: convert blob data to ArrayBuffer here?
          var buffer = data;
          fd.fullname = filename;

          self.write(fd, buffer, 0, buffer.length, 0, function(err) {
            if (err) {
              callback(err);
              return;
            }

            callback(null);
          });
        });
      }
      // create new file
      else {
        var file = (data instanceof Blob) ? data : new Blob([data], { type: options.mimetype });
        var filepath = getPathWithoutStorageType(filename);

        var request = storage.addNamed(file, filepath);
        request.onsuccess = function()
        {
          callback(null);
        };
        request.onerror = function()
        {
          callback(this.error);
        };
      }
    });
  };

  function writeFileMock(filename, data, options, callback)
  {
    var storage = getStorageForPath(filename);

    if (!storage) {
      callback(new Error('Unable to find entry point for ' + filename + '.'));
      return;
    }

    storage.files[filename] = new mock.FileMock(filename, options.mimetype, data);
    callback(null);
  }

  this.readdir = function(path, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }
    var storage = getStorageForPath(path);
    if (!storage) {
      callback(new Error('Unable to find entry point for ' + path + '.'));
      return;
    }

    if (mocked) {
      callback(null, storage.readdir(path));
      return;
    }

    var dirpath = getPathWithoutStorageType(path);
    var cursor = storage.enumerate(dirpath);

    var files = [];

    cursor.onsuccess = function()
    {
      if (this.result) {
        files.push(this.result);

        this.continue();
      }
      else if (this.done) {
        callback(null, files);
      }
    };
    cursor.onerror = function()
    {
      callback(this.error, files);
    }
  };

  this.unlink = function(path, callback)
  {
    if (typeof callback !== 'function') {
      var callback = function() {};
    }
    var filepath = getPathWithoutStorageType(path);
    var storage = getStorageForPath(path);
    if (!storage) {
      callback(new Error('Unable to find entry point for ' + path + '.'));
      return;
    }

    if (mocked) {
      delete storage.files[path];
      callback(null);
      return;
    }

    var request = storage.delete(filepath);
    request.onsuccess = function()
    {
      callback(null);
    };
    request.onerror = function()
    {
      callback(this.error);
    };
  };
})();