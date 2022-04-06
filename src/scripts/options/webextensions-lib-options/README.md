# webextensions-lib-options

[![Build Status](https://travis-ci.org/piroor/webextensions-lib-options.svg?branch=master)](https://travis-ci.org/piroor/webextensions-lib-options)

Provides ability to build options page.

## Required permissions

This does not require any special permission.

## Dependencies

 * [webextensions-lib-configs](https://github.com/piroor/webextensions-lib-configs)

## Usage

Load the file `Options.js` from your options page:

```json
{
  "default_locale": "en_US",
  "options_ui": {
    "page": "path/to/options.html",
    "chrome_style": true
  }
}
```

`options.html` is:

```html
<!DOCTYPE html>

<script type="application/javascript" src="path/to/Configs.js"></script>
<script type="application/javascript" src="path/to/Options.js"></script>
<script type="application/javascript">
  var configs = new Configs({
    // define default configurations at here
    enabled:    true,
    advanced:   false,
    attributes: 'alt|title',
    bgColor:    '#ffffff',
    mode:       'compatible'
  });
  // initialize options UI with this library
  var options = new Options(configs);
</script>

<!-- checkbox -->
<p><label><input type="checkbox" id="enabled"> Activate basic features</label></p>
<p><label><input type="checkbox" id="advanced"> Activate advanced features</label></p>

<!-- input field -->
<p><label>List of attributes: <input type="text" id="attributes"></label></p>

<!-- color picker -->
<p><label>Background color: <input type="color" id="bgColor"></label></p>

<!-- radio -->
<p>Mode:</p>
<ul><li><label><input type="radio" name="mode" value="compatible"> Compatible</label></li>
    <li><label><input type="radio" name="mode" value="medium"> Agressive</label></li></ul>
```

Then the `Options` detects an element which has its own ID same to each given config (defined with [`Configs`](https://github.com/piroor/webextensions-lib-configs)), and bind the config to the element. The element is initialized with the current value. If you change the state of the element itself, then it will be synchronized to the value of the related config.
