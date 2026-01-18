// Patch require to handle electron properly
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'electron') {
    // Try to get electron from process.electronBinding or similar
    try {
      return process.electronBinding ? process.electronBinding('electron') : originalRequire.call(this, id);
    } catch (e) {
      return originalRequire.call(this, id);
    }
  }
  return originalRequire.call(this, id);
};

require('./out/main/index.cjs');
