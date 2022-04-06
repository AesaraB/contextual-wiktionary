# webextensions-lib-configs

[![Build Status](https://travis-ci.org/piroor/webextensions-lib-configs.svg?branch=master)](https://travis-ci.org/piroor/webextensions-lib-configs)

Provides ability to store/load configurations, on Firefox 52 and later.

By the [bug 1197346](https://bugzilla.mozilla.org/show_bug.cgi?id=1197346), now we don't have to do inter-sandboxes comunication to read/write configuration values.
After the bug, this library is still effective to provide easy access for configuration values.

## Required permissions

 * `storage`

## Usage

In `manifest.json`, load the file `Configs.js` from both the background page and others, like:

```json
{
  "background": {
    "scripts": [
      "path/to/Configs.js",
      "path/to/common.js"
    ]
  },
  "content_scripts": [
    {
      "all_frames": true,
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "path/to/Configs.js",
        "path/to/common.js",
        "..."
      ],
      "run_at": "document_start"
    }
  ],
  "options_ui": {
    "page": "path/to/options.html",
    "chrome_style": true
  },
  "permissions": [
    "storage"
  ]
}
```

`options.html` is:

```html
<!DOCTYPE html>
<script type="application/javascript" src="./Configs.js"></script>
<script type="application/javascript" src="./common.js"></script>
...
```

And, define an instance with default values on each namespace like:

```javascript
// common.js

var configs = new Configs({
  enabled: true,
  advanced: false,
  attributes: 'alt|title',
  entries: [],
  cache: {}
});
```

The instance has a built-in property `$loaded`. It is a `Promise`, so you can do something after all stored user values are loaded:

```javascript
configs.$loaded.then(function() {
  MyService.start();
});
```

After all values are loaded, you can access loaded values via its own properties same to the given default values:

```javascript
console.log(configs.enabled); // => true (default value)
console.log(configs.advanced); // => false (default value)
console.log(configs.attributes); // => "alt|title" (default value)
console.log(configs.cache); // => {} (default value)
```

If you set a new value, it will be notified to the background page, then stored to the local storage as the user value and dispatched to all other namespaces.

```javascript
// in the options.html
configs.enabled = false;
```

```javascript
// in content script
console.log(configs.enabled); // => false (user value)
```

You still can get default values easily, with a prefix `$default.`:

```javascript
console.log(configs.$default.enabled); // => true (default value)
configs.enabled = configs.$default.enabled; // reset to default

configs.$reset(); // reset all to default
```

### Important note around object or array values

When you hope to update a non-primitive configuration values, note that you must replace the object itself.
For example, deep clone based on `JSON.parse()` and `JSON.stringify()` will be effective:

```javascript
var newEntries = JSON.parse(JSON.stringify(configs.entries)); // deep clone
entries.push('added item');
configs.entries = newEntries;

var newCache = JSON.parse(JSON.stringify(configs.cache)); // deep clone
newCache.addedItem = true;
configs.cache = newCache;
```

In other words, following codes don't work as expected:

```javascript
// Directly modified object won't be saved.
configs.entries.push('added item');
configs.cache.addedItems = true;

// Simple assignment also uses the object itself,
// so this example is same to the previous.
{
   let newEntries = configs.entries;
   newEntries.push('added item');
   configs.entries = newEntries;

   let newCache = configs.cache;
   newCache.addedItems = true;
   configs.cache = newCache;
}

// Shallow clone is better than above, and it works as expected
// only when all values are primitive.
{
   let newEntries = configs.entries.slice(0);
   newEntries.push('added item');
   configs.entries = newEntries;

   let newCache = { ...configs.cache }; // shallow clone
   newCache.addedItems = true;
   configs.cache = newCache;
}
```

## Managed Storage

This library supports `storage.managed`. Configuration items which have any value in `storage.managed` are  treated as locked configuration and they become unchangable. For more details, see the [API documentation](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/managed).

## Sync Storage

This library supports [storage.sync](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/sync). To use it, set `syncKeys` in the optional second parameter of the `Configs` constructor to an array of the key names that should be synced:

```javascript
var configs = new Configs({
  enabled: true,
  advanced: false,
  attributes: 'alt|title'
}, {
  syncKeys: ['enabled', 'attributes']
});
```

Alternately, specify (possibly empty) array of keys which should _not_ be synced in `localKeys`:

```javascript
var configs = new Configs({
  enabled: true,
  advanced: false,
  attributes: 'alt|title'
}, {
  localKeys: ['advanced']
});
```
