/*
 license: The MIT License, Copyright (c) 2016-2018 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/webextensions-lib-configs
*/

'use strict';

// eslint-disable-next-line no-unused-vars
class Configs {
  constructor(aDefaults, aOptions = { syncKeys: [], logger: null }) {
    this.$default = aDefaults;
    this._logging = aOptions.logging || false;
    this.$logger = aOptions.logger;
    this._locked = new Set();
    this._lastValues = {};
    this._observers = new Set();
    this._syncKeys = aOptions.localKeys ?
      Object.keys(aDefaults).filter(x => !aOptions.localKeys.includes(x)) :
      (aOptions.syncKeys || []);
    this.$loaded = this._load();
  }

  async $reset() {
    this._applyValues(this.$default);
  }

  $addObserver(aObserver) {
    if (!this._observers.has(aObserver))
      this._observers.add(aObserver);
  }
  $removeObserver(aObserver) {
    this._observers.delete(aObserver);
  }

  _log(aMessage, ...aArgs) {
    if (!this._logging)
      return;

    aMessage = `Configs ${aMessage}`;
    if (typeof this.$logger === 'function')
      this.$logger(aMessage, ...aArgs);
    else
      console.log(aMessage, ...aArgs);
  }

  _load() {
    return this.$_promisedLoad ||
             (this.$_promisedLoad = this._tryLoad());
  }

  async _tryLoad() {
    this._log('load');
    this._applyValues(this.$default);
    let values;
    try {
      this._log(`load: try load from storage on ${location.href}`);
      // We cannot define constants and variables at a time...
      // [const localValues, let managedValues, let lockedKeys] = await Promise.all([
      // eslint-disable-next-line prefer-const
      let [localValues, managedValues, lockedKeys] = await Promise.all([
        (async () => {
          try {
            const localValues = await browser.storage.local.get(this.$default);
            this._log('load: successfully loaded local storage');
            return localValues;
          }
          catch(e) {
            this._log('load: failed to load local storage: ', String(e));
          }
          return {};
        })(),
        (async () => {
          if (!browser.storage.managed) {
            this._log('load: skip managed storage');
            return null;
          }
          try {
            const managedValues = await browser.storage.managed.get();
            this._log('load: successfully loaded managed storage');
            return managedValues || null;
          }
          catch(e) {
            this._log('load: failed to load managed storage: ', String(e));
          }
          return null;
        })(),
        (async () => {
          try {
            const lockedKeys = await browser.runtime.sendMessage({
              type: 'Configs:getLockedKeys'
            });
            this._log('load: successfully synchronized locked state');
            return lockedKeys || [];
          }
          catch(e) {
            this._log('load: failed to synchronize locked state: ', String(e));
          }
          return [];
        })()
      ]);
      this._log(`load: loaded for ${location.origin}:`, { localValues, managedValues, lockedKeys });
      values = { ...(localValues || {}), ...(managedValues || {}) };
      this._applyValues(values);
      this._log('load: values are applied');
      if (managedValues)
        lockedKeys = lockedKeys.concat(Array.from(Object.keys(managedValues)));
      for (const key of lockedKeys) {
        this._updateLocked(key, true);
      }
      this._log('load: locked state is applied');
      browser.storage.onChanged.addListener(this._onChanged.bind(this));
      if (this._syncKeys || this._syncKeys.length > 0) {
        try {
          browser.storage.sync.get(this._syncKeys).then(syncedValues => {
            this._log('load: successfully loaded sync storage');
            if (!syncedValues)
              return;
            for (const key of Object.keys(syncedValues)) {
              this[key] = syncedValues[key];
            }
          });
        }
        catch(e) {
          this._log('load: failed to read sync storage: ', String(e));
          return null;
        }
      }
      browser.runtime.onMessage.addListener(this._onMessage.bind(this));
      return values;
    }
    catch(e) {
      this._log('load: fatal error: ', e, e.stack);
      throw e;
    }
  }
  _applyValues(aValues) {
    for (const [key, value] of Object.entries(aValues)) {
      if (this._locked.has(key))
        continue;
      this._lastValues[key] = value;
      if (key in this)
        continue;
      Object.defineProperty(this, key, {
        get: () => this._lastValues[key],
        set: (aValue) => this._setValue(key, aValue)
      });
    }
  }

  _setValue(aKey, aValue) {
    if (this._locked.has(aKey)) {
      this._log(`warning: ${aKey} is locked and not updated`);
      return aValue;
    }
    if (JSON.stringify(aValue) == JSON.stringify(this._lastValues[aKey]))
      return aValue;
    this._log(`set: ${aKey} = ${aValue}`);
    this._lastValues[aKey] = aValue;

    const update = {};
    update[aKey] = aValue;
    try {
      browser.storage.local.set(update).then(() => {
        this._log('successfully saved', update);
      });
    }
    catch(e) {
      this._log('save: failed', e);
    }
    try {
      if (this._syncKeys.includes(aKey))
        browser.storage.sync.set(update).then(() => {
          this._log('successfully synced', update);
        });
    }
    catch(e) {
      this._log('sync: failed', e);
    }
    return aValue;
  }

  $lock(aKey) {
    this._log('locking: ' + aKey);
    this._updateLocked(aKey, true);
  }

  $unlock(aKey) {
    this._log('unlocking: ' + aKey);
    this._updateLocked(aKey, false);
  }

  $isLocked(aKey) {
    return this._locked.has(aKey);
  }

  _updateLocked(aKey, aLocked) {
    if (aLocked) {
      this._locked.add(aKey);
    }
    else {
      this._locked.delete(aKey);
    }
    if (browser.runtime)
      browser.runtime.sendMessage({
        type:   'Configs:updateLocked',
        key:    aKey,
        locked: this._locked.has(aKey)
      });
  }

  _onMessage(aMessage, aSender) {
    if (!aMessage ||
        typeof aMessage.type != 'string')
      return;

    this._log(`onMessage: ${aMessage.type}`, aMessage, aSender);
    switch (aMessage.type) {
      case 'Configs:getLockedKeys':
        return Promise.resolve(Array.from(this._locked.values()));

      case 'Configs:updateLocked':
        this._updateLocked(aMessage.key, aMessage.locked);
        break;
    }
  }

  _onChanged(aChanges) {
    for (const [key, change] of Object.entries(aChanges)) {
      this._lastValues[key] = change.newValue;
      this.$notifyToObservers(key);
    }
  }

  $notifyToObservers(aKey) {
    for (const observer of this._observers) {
      if (typeof observer === 'function')
        observer(aKey);
      else if (observer && typeof observer.onChangeConfig === 'function')
        observer.onChangeConfig(aKey);
    }
  }
};
