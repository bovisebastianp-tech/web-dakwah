/*
 * dc-lite.js
 * Runtime mini untuk halaman prototipe Cahaya Dakwah.
 *
 * Yang dikerjakan file ini:
 *  - membaca templat di dalam <x-dc> ... </x-dc>
 *  - mengganti {{ nilai }} dengan data dari renderVals()
 *  - menjalankan <sc-if> (kondisi) dan <sc-for> (perulangan)
 *  - memasang event seperti onClick="{{ fungsi }}"
 *  - menggambar ulang halaman setiap kali setState() dipanggil
 *
 * Logika tiap halaman ada di <script type="text/x-dc"> pada akhir file HTML
 * (class Component extends DCLogic). Kamu bisa mengubahnya langsung di sana.
 */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
      this._mount = null;
    }
    setState(patch) {
      const next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
      this.state = Object.assign({}, this.state, next);
      if (this._mount) this._mount();
    }
    forceUpdate() {
      if (this._mount) this._mount();
    }
  }
  window.DCLogic = DCLogic;

  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  const ANY = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    const parts = path.split('.');
    let cur = scope[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interpolate(text, scope) {
    return text.replace(ANY, function (m, path) {
      const v = lookup(path, scope);
      return v === null || v === undefined || v === false ? '' : String(v);
    });
  }

  function resolveAttr(value, scope) {
    if (value === null || value === undefined) return undefined;
    const m = WHOLE.exec(value);
    return m ? lookup(m[1], scope) : value;
  }

  function eventType(el, attrName) {
    const base = attrName.slice(2).toLowerCase();
    if (base !== 'change') return base;
    const tag = el.localName;
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (tag === 'textarea') return 'input';
    if (tag === 'input' && type !== 'checkbox' && type !== 'radio' && type !== 'range' && type !== 'file') return 'input';
    return 'change';
  }

  function renderChildren(node, scope, parent) {
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) renderNode(kids[i], scope, parent);
  }

  function renderNode(node, scope, parent) {
    if (node.nodeType === 3) {
      parent.appendChild(document.createTextNode(interpolate(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.localName;

    if (tag === 'sc-if') {
      if (resolveAttr(node.getAttribute('value'), scope)) renderChildren(node, scope, parent);
      return;
    }
    if (tag === 'sc-for') {
      const list = resolveAttr(node.getAttribute('list'), scope) || [];
      const as = node.getAttribute('as') || 'item';
      for (let i = 0; i < list.length; i++) {
        const child = Object.create(scope);
        child[as] = list[i];
        child.$index = i;
        renderChildren(node, child, parent);
      }
      return;
    }
    if (tag === 'helmet') return;

    const el = document.createElementNS(node.namespaceURI, node.localName);
    let deferredValue;
    let hasValue = false;
    let deferredChecked;
    let hasChecked = false;

    const attrs = node.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = attrs[i].name;
      const raw = attrs[i].value;
      if (name.indexOf('hint-') === 0) continue;

      const whole = WHOLE.exec(raw);

      if (/^on[a-z]+$/.test(name)) {
        if (whole) {
          const fn = lookup(whole[1], scope);
          if (typeof fn === 'function') el.addEventListener(eventType(el, name), fn);
        }
        continue;
      }

      const val = whole ? lookup(whole[1], scope) : interpolate(raw, scope);

      if (name === 'value') {
        hasValue = true;
        deferredValue = val === null || val === undefined ? '' : String(val);
        continue;
      }
      if (name === 'checked') {
        hasChecked = true;
        deferredChecked = !!val;
        continue;
      }

      const isAria = name.indexOf('aria-') === 0;
      if (val === null || val === undefined) continue;
      if (val === false && !isAria) continue;
      if (val === true && !isAria) {
        el.setAttribute(name, '');
        continue;
      }
      el.setAttribute(name, String(val));
    }

    renderChildren(node, scope, el);
    parent.appendChild(el);

    if (hasValue) el.value = deferredValue;
    if (hasChecked) el.checked = deferredChecked;
  }

  function boot() {
    // Templat halaman disimpan di <template id="x-dc"> supaya tidak ikut dimuat browser
    // sebelum diisi data. (Bentuk <x-dc> biasa juga masih didukung.)
    const xdc = document.querySelector('template#x-dc') || document.querySelector('x-dc');
    if (!xdc) return;
    const source = xdc.content || xdc;

    const helmet = source.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) {
        document.head.appendChild(c);
      });
      helmet.parentNode.removeChild(helmet);
    }

    const script = document.querySelector('script[data-dc-script]');
    const defs = JSON.parse(script.getAttribute('data-props') || '{}');
    const props = {};
    Object.keys(defs).forEach(function (k) {
      if (k.charAt(0) !== '$' && defs[k] && Object.prototype.hasOwnProperty.call(defs[k], 'default')) {
        props[k] = defs[k].default;
      }
    });

    const Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    const inst = new Component(props);

    const app = document.createElement('div');
    app.id = 'app';
    xdc.parentNode.insertBefore(app, xdc);
    if (!xdc.content) xdc.parentNode.removeChild(xdc);

    const FOCUSABLE = 'a,button,input,textarea,select';

    inst._mount = function () {
      const vals = inst.renderVals();
      const scope = Object.create(null);
      Object.keys(vals).forEach(function (k) {
        scope[k] = vals[k];
      });

      // simpan posisi fokus supaya ketikan tidak terputus saat halaman digambar ulang
      const active = document.activeElement;
      let idx = -1;
      let selStart = null;
      let selEnd = null;
      if (active && app.contains(active)) {
        idx = Array.prototype.indexOf.call(app.querySelectorAll(FOCUSABLE), active);
        try {
          selStart = active.selectionStart;
          selEnd = active.selectionEnd;
        } catch (e) {}
      }

      const frag = document.createDocumentFragment();
      renderChildren(source, scope, frag);
      app.textContent = '';
      app.appendChild(frag);

      if (idx >= 0) {
        const el = app.querySelectorAll(FOCUSABLE)[idx];
        if (el) {
          el.focus({ preventScroll: true });
          if (selStart !== null && typeof el.setSelectionRange === 'function') {
            try {
              el.setSelectionRange(selStart, selEnd);
            } catch (e) {}
          }
        }
      }
    };

    inst._mount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
