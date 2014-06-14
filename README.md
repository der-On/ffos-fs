ffos-fs
=======

File System (fs) module for the Firefox OS

Provides file system functions for the Firefox OS and devices supporting device storage.

It tries to mimic node's fs module where possible.

By the very nature of the device storage it only implements a subset of node's fs module.

Usage
-----

### Higher level functions

```javascript
var fs = require('ffos-fs');
```

**Get files within a directory.**
Returned files are of type [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

```javascript
fs.readdir(path, callback(error, files) { ... });
```

**Read contents of a file.**

**options**

- _format_ ```String | Null``` default = 'text', can be 'text', 'binary', 'dataURL', 'buffer'
- _encoding_ ```String | Null``` default = null, text encoding if _format_ is 'text'
- _flag_ ```String``` default = 'r', can be 'r' or 'w'

```javascript
fs.readFile(path, [options], callback(error, data) { ... });
```

**Write contents to a file.**   
Will create the file if it does not exist and overwrite an existing file.

**options**

- _encoding_ ```String | Null``` default = 'utf8'
- _mimetype_ ```String | Null``` default = 'text/plain'
- _flag_ ```String``` default = 'w'

```javascript
fs.writeFile(path, data, [options], callback(error) { ... });
```

**Check if a file exists.**   
You cannot check for the existance of a directory on Firefox OS.

```javascript
fs.exists(path, callback(error, exists) { ... });
```

----------------------------

### Lower level functions

**Open a File handle.**

```flag``` can be one of 'r' or 'w'.

```fd``` is either of type [File](https://developer.mozilla.org/en-US/docs/Web/API/File) (read)
or of type [FileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileHandle) (write).

```javascript
fs.open(path, flag, callback(error, fd) { ... });
```

**Read from a file to a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob).**

```fd``` must be of type [FileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileHandle) or [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or [LockedFile](https://developer.mozilla.org/en-US/docs/Web/API/LockedFile.write).

```blob``` is the blog that the data will be written to.

```offset``` is the offset in the blob to start writing at.

```length``` is an integer specifying the number of bytes to read.

```position``` is an integer specifying where to begin reading from in the file.
If ```position``` is ```null```, data will be read from the start.

```javascript
fs.read(fd, blob, offset, length, position, callback(error, bytesRead, blob) { ... });
```

**Write from a blob to a file [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob).**

```fd``` must be of type [FileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileHandle) or [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or [LockedFile](https://developer.mozilla.org/en-US/docs/Web/API/LockedFile.write).

```blob``` is the blog that the data will be written to.

```offset``` is the offset in the blob to start writing at.

```length``` is an integer specifying the number of bytes to read.

```position``` is an integer specifying where to begin reading from in the file.
If ```position``` is ```null```, data will be read from the start.

```javascript
fs.read(fd, blob, offset, length, position, callback(error, bytesRead, blob) { ... });
```


