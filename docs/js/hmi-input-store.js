/**
 * SpY — hmi-input-store.js
 * Central store for HMI manual inputs.
 * Persists to localStorage, emits events via scadaBus.
 */
(function () {
  const STORAGE_KEY = 'scada_hmi_values';
  const EVENT_PREFIX = 'hmi:';

  const store = new Map();
  const listeners = new Map();

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...store.entries()]));
    } catch (e) {
      console.warn('[HMIStore] Persist failed:', e);
    }
  }

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        arr.forEach(([k, v]) => store.set(k, v));
      }
    } catch (e) {
      console.warn('[HMIStore] Load failed:', e);
    }
  }

  function _emit(event, varId, data) {
    const key = EVENT_PREFIX + event;
    const bus = window.scadaBus;
    if (bus) bus.emit(key, { varId, ...data, timestamp: Date.now() });
    if (listeners.has(event)) {
      listeners.get(event).forEach(fn => fn(varId, data));
    }
  }

  const api = {
    init() {
      _load();
      return api;
    },

    set(varId, value, unit, meta = {}) {
      const entry = {
        value,
        unit: unit || '',
        ts: Date.now(),
        quality: 'good',
        source: 'hmi',
        ...meta
      };
      store.set(varId, entry);
      _persist();
      _emit('value:set', varId, entry);
      return entry;
    },

    setMultiple(entries) {
      Object.entries(entries).forEach(([varId, { value, unit, ...meta }]) => {
        api.set(varId, value, unit, meta);
      });
    },

    get(varId) {
      return store.get(varId);
    },

    getAll() {
      return Object.fromEntries(store);
    },

    clear(varId) {
      store.delete(varId);
      _persist();
      _emit('value:cleared', varId);
    },

    clearAll() {
      store.clear();
      _persist();
      _emit('value:cleared:all', null);
    },

    has(varId) {
      return store.has(varId);
    },

    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },

    off(event, fn) {
      if (listeners.has(event)) listeners.get(event).delete(fn);
    }
  };

  _load();

  window.HMIStore = api;
  window.HMI_STORE_EVENTS = {
    VALUE_SET: EVENT_PREFIX + 'value:set',
    VALUE_CLEARED: EVENT_PREFIX + 'value:cleared',
    VALUE_CLEARED_ALL: EVENT_PREFIX + 'value:cleared:all'
  };

  if (typeof window.scadaBus !== 'undefined') {
    window.scadaBus.on(EVENT_PREFIX + 'value:set', ({ varId }) => {
      console.debug('[HMIStore] Value set:', varId);
    });
  }
})();