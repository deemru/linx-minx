var UploadEngine = (function() {
  'use strict';

  function init(config) {
    var engine = {
      url: config.url || '/upload',
      maxFilesize: config.maxFilesize || Infinity,
      parallelUploads: config.parallelUploads || 5,
      headers: config.headers || {},
      autoProcessQueue: config.autoProcessQueue !== false,
      onFileAdded: config.onFileAdded || function() {},
      onProgress: config.onProgress || function() {},
      onSuccess: config.onSuccess || function() {},
      onError: config.onError || function() {},
      onCanceled: config.onCanceled || function() {},
      onSending: config.onSending || function() {},
      renameFile: config.renameFile || function(f) { return f.name; },
      queue: [],
      active: 0
    };

    var dropEl = typeof config.dropzone === 'string'
      ? document.querySelector(config.dropzone)
      : config.dropzone;

    if (dropEl) {
      // Click to upload
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.style.display = 'none';
      dropEl.appendChild(fileInput);

      dropEl.addEventListener('click', function(e) {
        if (e.target === fileInput) return;
        fileInput.click();
      });

      fileInput.addEventListener('change', function() {
        for (var i = 0; i < fileInput.files.length; i++) {
          addFile(engine, fileInput.files[i]);
        }
        fileInput.value = '';
      });

      // Drag & drop on the whole document
      document.addEventListener('dragover', function(e) { e.preventDefault(); });
      document.addEventListener('drop', function(e) {
        e.preventDefault();
        var items = e.dataTransfer.items;
        if (items && items.length > 0 && items[0].webkitGetAsEntry) {
          addEntries(engine, items);
        } else {
          var files = e.dataTransfer.files;
          for (var i = 0; i < files.length; i++) {
            addFile(engine, files[i]);
          }
        }
      });
    }

    engine.addFile = function(file) { addFile(engine, file); };
    engine.cancelUpload = function(file) { cancelUpload(engine, file); };
    engine.processQueue = function() { engine.autoProcessQueue = true; processQueue(engine); };

    return engine;
  }

  function addEntries(engine, items) {
    var entries = [];
    for (var i = 0; i < items.length; i++) {
      var entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    readEntries(engine, entries);
  }

  function readEntries(engine, entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isFile) {
        (function(e) {
          e.file(function(f) { addFile(engine, f); });
        })(entry);
      } else if (entry.isDirectory) {
        var reader = entry.createReader();
        (function(r) {
          r.readEntries(function(subEntries) {
            readEntries(engine, subEntries);
          });
        })(reader);
      }
    }
  }

  function addFile(engine, file) {
    // Size check (maxFilesize is in bytes)
    if (file.size > engine.maxFilesize) {
      file.status = 'error';
      engine.onFileAdded(file);
      engine.onError(file, 'File is too big (' +
        (file.size / 1024 / 1024).toFixed(1) + 'MiB). Max filesize: ' +
        (engine.maxFilesize / 1024 / 1024).toFixed(1) + 'MiB.');
      return;
    }

    file.status = 'queued';
    file._engineXhr = null;
    engine.queue.push(file);
    engine.onFileAdded(file);

    if (engine.autoProcessQueue) {
      processQueue(engine);
    }
  }

  function processQueue(engine) {
    while (engine.active < engine.parallelUploads && engine.queue.length > 0) {
      var file = engine.queue.shift();
      if (file.status === 'queued') {
        uploadFile(engine, file);
      }
    }
  }

  function uploadFile(engine, file) {
    engine.active++;
    file.status = 'uploading';

    var xhr = new XMLHttpRequest();
    file._engineXhr = xhr;

    var formData = new FormData();
    var renamedName = engine.renameFile(file);
    formData.append('file', file, renamedName);

    // Let caller add extra fields (e.g. expires)
    engine.onSending(file, xhr, formData);

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var percent = Math.round((e.loaded / e.total) * 100);
        engine.onProgress(file, percent, e.loaded);
      }
    });

    xhr.addEventListener('load', function() {
      engine.active--;
      if (xhr.status >= 200 && xhr.status < 300) {
        file.status = 'success';
        try {
          var resp = JSON.parse(xhr.responseText);
          engine.onSuccess(file, resp);
        } catch (e) {
          engine.onSuccess(file, xhr.responseText);
        }
      } else {
        file.status = 'error';
        try {
          var errResp = JSON.parse(xhr.responseText);
          engine.onError(file, errResp.error || 'Server error');
        } catch (e) {
          engine.onError(file, 'Server error (' + xhr.status + ')');
        }
      }
      processQueue(engine);
    });

    xhr.addEventListener('error', function() {
      engine.active--;
      file.status = 'error';
      engine.onError(file, 'Network error');
      processQueue(engine);
    });

    xhr.addEventListener('abort', function() {
      engine.active--;
      file.status = 'canceled';
      engine.onCanceled(file);
      processQueue(engine);
    });

    xhr.open('POST', engine.url, true);
    for (var key in engine.headers) {
      if (engine.headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, engine.headers[key]);
      }
    }
    xhr.send(formData);
  }

  function cancelUpload(engine, file) {
    if (file._engineXhr && file.status === 'uploading') {
      file._engineXhr.abort();
    } else if (file.status === 'queued') {
      file.status = 'canceled';
      var idx = engine.queue.indexOf(file);
      if (idx !== -1) engine.queue.splice(idx, 1);
      engine.onCanceled(file);
    }
  }

  return { init: init };
})();
