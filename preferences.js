'use strict';

// Storage can be unavailable for local files or under privacy restrictions.
// In that case, switches still work for the current page.
const preferences = {
  read(key, allowed, fallback) {
    try {
      const value = localStorage.getItem('calculator.' + key);
      return allowed.includes(value) ? value : fallback;
    } catch { return fallback; }
  },
  save(key, value) {
    try { localStorage.setItem('calculator.' + key, value); } catch { /* Session-only settings. */ }
  }
};
let theme = preferences.read('theme', ['light', 'dark'], 'light');
let language = preferences.read('language', ['zh-CN', 'en'], 'zh-CN');
document.documentElement.dataset.theme = theme;
document.documentElement.lang = language;
