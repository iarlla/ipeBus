const fs = require('node:fs');
const path = require('node:path');

class Persistence {
  constructor({ storageKey = 'ipebus-save', baseDir = process.cwd() } = {}) {
    this.storageKey = storageKey;
    this.baseDir = baseDir;
  }

  saveGarageProgress(progress, targetPath = null) {
    return this.save({ garage: progress }, targetPath);
  }

  loadGarageProgress(targetPath = null, fallbackValue = null) {
    const payload = this.load(targetPath, null);
    return payload?.garage ?? fallbackValue;
  }

  save(data, targetPath = null) {
    const serialized = JSON.stringify(data, null, 2);

    if (this._canUseLocalStorage() && !targetPath) {
      globalThis.localStorage.setItem(this.storageKey, serialized);
      return true;
    }

    const filePath = this._resolvePath(targetPath || `${this.storageKey}.json`);
    fs.writeFileSync(filePath, serialized, 'utf8');
    return true;
  }

  load(targetPath = null, fallbackValue = null) {
    if (this._canUseLocalStorage() && !targetPath) {
      const raw = globalThis.localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : fallbackValue;
    }

    const filePath = this._resolvePath(targetPath || `${this.storageKey}.json`);
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallbackValue;
  }

  delete(targetPath = null) {
    if (this._canUseLocalStorage() && !targetPath) {
      globalThis.localStorage.removeItem(this.storageKey);
      return true;
    }

    const filePath = this._resolvePath(targetPath || `${this.storageKey}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return true;
  }

  _resolvePath(targetPath) {
    return path.isAbsolute(targetPath)
      ? targetPath
      : path.join(this.baseDir, targetPath);
  }

  _canUseLocalStorage() {
    return typeof globalThis.localStorage !== 'undefined';
  }
}

module.exports = Persistence;
