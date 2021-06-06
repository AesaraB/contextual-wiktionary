/*
 license: The MIT License, Copyright (c) 2016-2018 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/webextensions-lib-options
*/

class Options {
  constructor(configs) {
    this.configs = configs;
    this.uiNodes = new Map();
    this.throttleTimers = new Map();

    this.onReady = this.onReady.bind(this);
    this.onConfigChanged = this.onConfigChanged.bind(this)
    document.addEventListener('DOMContentLoaded', this.onReady);
  }

  findUIsForKey(key) {
    return document.querySelectorAll(`[name="${key}"], #${key}, [data-config-key="${key}"]`);
  }

  detectUIType(node) {
    if (!node)
      return this.UI_MISSING;

    if (node.localName == 'textarea')
      return this.UI_TYPE_TEXT_FIELD;

    if (node.localName == 'select')
      return this.UI_TYPE_SELECTBOX;

    if (node.localName != 'input')
      return this.UI_TYPE_UNKNOWN;

    switch (node.type) {
      case 'text':
      case 'password':
      case 'number':
      case 'color':
        return this.UI_TYPE_TEXT_FIELD;

      case 'checkbox':
        return this.UI_TYPE_CHECKBOX;

      case 'radio':
        return this.UI_TYPE_RADIO;

      default:
        return this.UI_TYPE_UNKNOWN;
    }
  }

  throttledUpdate(key, uiNode, value) {
    if (this.throttleTimers.has(key))
      clearTimeout(this.throttleTimers.get(key));
    uiNode.dataset.configValueUpdating = true;
    this.throttleTimers.set(key, setTimeout(() => {
      this.throttleTimers.delete(key);
      this.configs[key] = this.UIValueToConfigValue(key, value);
      setTimeout(() => {
        uiNode.dataset.configValueUpdating = false;
      }, 50);
    }, 250));
  }

  UIValueToConfigValue(key, value) {
    switch (typeof this.configs.$default[key]) {
      case 'string':
        return String(value);

      case 'number':
        return Number(value);

      case 'boolean':
        if (typeof value == 'string')
          return value != 'false';
        else
          return Boolean(value);

      default: // object
        if (typeof value == 'string')
          return JSON.parse(value || 'null');
        else
          return value;
    }
  }

  configValueToUIValue(value) {
    if (typeof value == 'object') {
      value = JSON.stringify(value);
      if (value == 'null')
        value = '';
      return value;
    }
    else
      return value;
  }

  bindToCheckbox(key, node) {
    node.checked = this.configValueToUIValue(this.configs[key]);
    node.addEventListener('change', () => {
      this.throttledUpdate(key, node, node.checked);
    });
    node.disabled = this.configs.$isLocked(key);
    this.addResetMethod(key, node);
    const nodes = this.uiNodes.get(key) || [];
    nodes.push(node);
    this.uiNodes.set(key, nodes);
  }
  bindToRadio(key, node) {
    const group  = node.getAttribute('name');
    const radios = document.querySelectorAll(`input[name="${group}"]`);
    let activated = false;
    for (const radio of radios) {
      const id    = `${key}-${group}-${radio.value}`;
      const nodes = this.uiNodes.get(id) || [];
      if (nodes.includes(radio))
        continue;
      radio.disabled = this.configs.$isLocked(key);
      nodes.push(radio);
      this.uiNodes.set(id, nodes);
      radio.addEventListener('change', () => {
        if (!activated)
          return;
        const stringifiedValue = this.configs[key];
        if (stringifiedValue != radio.value)
          this.throttledUpdate(key, radio, radio.value);
      });
    }
    const chosens = this.uiNodes.get(`${key}-${group}-${this.configs[key]}`);
    if (chosens && chosens.length > 0)
      chosens.map(chosen => { chosen.checked = true; });
    setTimeout(() => {
      activated = true;
    }, 0);
  }
  bindToTextField(key, node) {
    node.value = this.configValueToUIValue(this.configs[key]);
    node.addEventListener('input', () => {
      this.throttledUpdate(key, node, node.value);
    });
    node.disabled = this.configs.$isLocked(key);
    this.addResetMethod(key, node);
    const nodes = this.uiNodes.get(key) || [];
    nodes.push(node);
    this.uiNodes.set(key, nodes);
  }
  bindToSelectBox(key, node) {
    node.value = this.configValueToUIValue(this.configs[key]);
    node.addEventListener('change', () => {
      this.throttledUpdate(key, node, node.value);
    });
    node.disabled = this.configs.$isLocked(key);
    this.addResetMethod(key, node);
    const nodes = this.uiNodes.get(key) || [];
    nodes.push(node);
    this.uiNodes.set(key, nodes);
  }
  addResetMethod(key, node) {
    node.$reset = () => {
      const value = this.configs[key] =
          this.configs.$default[key];
      if (this.detectUIType(node) == this.UI_TYPE_CHECKBOX)
        node.checked = value;
      else
        node.value = value;
    };
  }

  async onReady() {
    document.removeEventListener('DOMContentLoaded', this.onReady);

    if (!this.configs || !this.configs.$loaded)
      throw new Error('you must give configs!');

    this.configs.$addObserver(this.onConfigChanged);
    await this.configs.$loaded;
    for (const key of Object.keys(this.configs.$default)) {
      const nodes = this.findUIsForKey(key);
      if (!nodes.length)
        continue;
      for (const node of nodes) {
        switch (this.detectUIType(node)) {
          case this.UI_TYPE_CHECKBOX:
            this.bindToCheckbox(key, node);
            break;

          case this.UI_TYPE_RADIO:
            this.bindToRadio(key, node);
            break;

          case this.UI_TYPE_TEXT_FIELD:
            this.bindToTextField(key, node);
            break;

          case this.UI_TYPE_SELECTBOX:
            this.bindToSelectBox(key, node);
            break;

          case this.UI_MISSING:
            continue;

          default:
            throw new Error(`unknown type UI element for ${key}`);
        }
      }
    }
  }

  onConfigChanged(key) {
    let nodes = this.uiNodes.get(key);
    if (!nodes) // possibly radio
      nodes = this.uiNodes.get(`${key}-${this.configs[key]}`);
    if (!nodes || !nodes.length)
      return;

    for (const node of nodes) {
      if (node.dataset.configValueUpdating)
        continue;
      if ('checked' in node) {
        node.checked = !!this.configs[key];
      }
      else {
        node.value = this.configValueToUIValue(this.configs[key]);
      }
      node.disabled = this.configs.$isLocked(key);
    }
  }

  buildUIForAllConfigs(parent) {
    parent = parent || document.body;
    const range = document.createRange();
    range.selectNodeContents(parent);
    range.collapse(false);
    const rows = [];
    for (const key of Object.keys(this.configs.$default).sort()) {
      const value = this.configs.$default[key];
      const type = typeof value == 'number' ? 'number' :
        typeof value == 'boolean' ? 'checkbox' :
          'text' ;
      rows.push(`
        <tr ${rows.length > 0 ? 'style="border-top: 1px solid rgba(0, 0, 0, 0.2);"' : ''}>
          <td style="width: 45%; word-break: break-all;">
            <label for="allconfigs-field-${key}">${key}</label>
          </td>
          <td style="width: 35%;">
            <input id="allconfigs-field-${key}"
                   type="${type}"
                   ${type != 'checkbox' && type != 'radio' ? 'style="width: 100%;"' : ''}>
          </td>
          <td>
            <button id="allconfigs-reset-${key}">Reset</button>
          </td>
        </tr>
      `);
    }
    const fragment = range.createContextualFragment(`
      <table id="allconfigs-table"
             style="border-collapse: collapse">
        <tbody>${rows.join('')}</tbody>
      </table>
      <div>
        <button id="allconfigs-reset-all">Reset All</button>
        <button id="allconfigs-export">Export</button>
        <a id="allconfigs-export-file"
           type="application/json"
           download="configs-${browser.runtime.id}.json"
           style="display:none"></a>
        <button id="allconfigs-import">Import</button>
        <input id="allconfigs-import-file"
               type="file"
               accept="application/json"
               style="display:none">
      </div>
    `);
    range.insertNode(fragment);
    range.detach();
    const table = document.getElementById('allconfigs-table');
    for (const input of table.querySelectorAll('input')) {
      const key = input.id.replace(/^allconfigs-field-/, '');
      switch (this.detectUIType(input)) {
        case this.UI_TYPE_CHECKBOX:
          this.bindToCheckbox(key, input);
          break;

        case this.UI_TYPE_TEXT_FIELD:
          this.bindToTextField(key, input);
          break;
      }
      const button = table.querySelector(`#allconfigs-reset-${key}`);
      button.addEventListener('click', () => {
        input.$reset();
      });
      button.addEventListener('keyup', event => {
        if (event.key == 'Enter' || event.key == ' ')
          input.$reset();
      });
    }
    const resetAllButton = document.getElementById('allconfigs-reset-all');
    resetAllButton.addEventListener('keydown', event => {
      if (event.key == 'Enter' || event.key == ' ')
        this.resetAll();
    });
    resetAllButton.addEventListener('click', event => {
      if (event.button == 0)
        this.resetAll();
    });
    const exportButton = document.getElementById('allconfigs-export');
    exportButton.addEventListener('keydown', event => {
      if (event.key == 'Enter' || event.key == ' ')
        this.exportToFile();
    });
    exportButton.addEventListener('click', event => {
      if (event.button == 0)
        this.exportToFile();
    });
    const importButton = document.getElementById('allconfigs-import');
    importButton.addEventListener('keydown', event => {
      if (event.key == 'Enter' || event.key == ' ')
        this.importFromFile();
    });
    importButton.addEventListener('click', event => {
      if (event.button == 0)
        this.importFromFile();
    });
    const fileField = document.getElementById('allconfigs-import-file');
    fileField.addEventListener('change', _event => {
      const reader = new FileReader();
      reader.onload = event => {
        const values = JSON.parse(event.target.result);
        for (const key of Object.keys(this.configs.$default)) {
          this.configs[key] = values[key] !== undefined ? values[key] : this.configs.$default[key];
        }
      };
      reader.readAsText(fileField.files.item(0), 'utf-8');
    });
  }

  resetAll() {
    for (const key of Object.keys(this.configs.$default)) {
      this.configs[key] = this.configs.$default[key];
    }
  }

  importFromFile() {
    document.getElementById('allconfigs-import-file').click();
  }

  exportToFile() {
    const values = {};
    for (const key of Object.keys(this.configs.$default).sort()) {
      const defaultValue = JSON.stringify(this.configs.$default[key]);
      const currentValue = JSON.stringify(this.configs[key]);
      if (defaultValue !== currentValue) {
        values[key] = this.configs[key];
      }
    }
    // Pretty print the exported JSON, because some major addons
    // including Stylus and uBlock do that.
    const exported = JSON.stringify(values, null, 2);
    const link = document.getElementById('allconfigs-export-file');
    link.href = URL.createObjectURL(new Blob([exported], { type: 'application/json' }));
    link.click();
  }
};

Options.prototype.UI_TYPE_UNKNOWN    = 0;
Options.prototype.UI_TYPE_TEXT_FIELD = 1 << 0;
Options.prototype.UI_TYPE_CHECKBOX   = 1 << 1;
Options.prototype.UI_TYPE_RADIO      = 1 << 2;
Options.prototype.UI_TYPE_SELECTBOX  = 1 << 3;

