import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';

const ttl = process.env.CACHE_TTL || 60 * 60;

class Cache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: ttl,
    });
    this.loadCache();
  }

  async get(key, storeFunction) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    }

    if (typeof storeFunction === 'function') {
      const result = await storeFunction();
      this.set(key, result);
      return result;
    }
    return null;
  }

  flush(key) {
    if (key) {
      this.cache.del(key);
    } else {
      this.cache.flushAll();
    }
    this.saveCache();
  }

  set(key, value) {
    this.cache.set(key, value);
    this.saveCache();
  }

  saveCache() {
    fs.mkdirSync('./tmp', { recursive: true });

    if (this.cache.keys().length) {
      fs.writeFileSync('./tmp/.cache.json', JSON.stringify(this.cache.data));
    } else {
      fs.unlinkSync(path.join('./tmp/.cache.json'));
    }
  }

  loadCache() {
    const filePath = path.join('./tmp/.cache.json');

    if (!fs.existsSync(filePath)) {
      return;
    }
    try {
      const jsonData = fs.readFileSync(filePath, 'utf8');
      this.cache.data = JSON.parse(jsonData);
    } catch (e) {
      this.cache.data = {};
    }
  }
}

export default Cache;
