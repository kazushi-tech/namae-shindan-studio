import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(
  new URL('../js/core/analytics.js', import.meta.url),
  'utf8'
);
const bootSource = fs.readFileSync(
  new URL('../js/core/boot.js', import.meta.url),
  'utf8'
);

function createBrowserContext() {
  const appendedScripts = [];
  const window = {};
  const document = {
    createElement(tagName) {
      assert.equal(tagName, 'script');
      return {};
    },
    head: {
      appendChild(node) {
        appendedScripts.push(node);
      }
    }
  };
  const context = vm.createContext({
    window,
    document,
    Date,
    encodeURIComponent
  });

  vm.runInContext(source, context, { filename: 'analytics.js' });
  return { window, appendedScripts };
}

{
  const { window, appendedScripts } = createBrowserContext();

  window.Analytics.ctaClicked('before-init', 'test');
  window.Analytics.init({
    ga4MeasurementId: null,
    gtm: { enabled: true, containerId: 'GTM-TKF64R7Q' }
  });

  assert.equal(window.Analytics.isEnabled, true);
  assert.equal(appendedScripts.length, 0, 'GTM mode must not load gtag.js');
  assert.equal(window.gtag, undefined, 'GTM mode must not define gtag');
  assert.deepEqual(
    JSON.parse(JSON.stringify(window.dataLayer)),
    [{
      event: 'cta_clicked',
      cta_id: 'before-init',
      location: 'test'
    }],
    'queued event should flush to dataLayer'
  );

  window.Analytics.toolCompleted('seimei-handan', '大吉', { source: 'test' });
  assert.deepEqual(
    JSON.parse(JSON.stringify(window.dataLayer.at(-1))),
    {
      event: 'tool_completed',
      tool_type: 'seimei-handan',
      rating: '大吉',
      source: 'test'
    }
  );
}

{
  const { window, appendedScripts } = createBrowserContext();

  window.Analytics.init('G-TEST123');
  assert.equal(window.Analytics.isEnabled, true);
  assert.equal(appendedScripts.length, 1);
  assert.match(appendedScripts[0].src, /gtag\/js\?id=G-TEST123$/);

  window.Analytics.favoriteAdded('name-1', 'name');
  const eventCall = window.dataLayer.at(-1);
  assert.equal(eventCall[0], 'event');
  assert.equal(eventCall[1], 'favorite_added');
  assert.equal(eventCall[2].item_id, 'name-1');
}

{
  const { window, appendedScripts } = createBrowserContext();

  window.Analytics.init({
    ga4MeasurementId: 'G-TEST456',
    gtm: { enabled: false, containerId: 'GTM-TKF64R7Q' }
  });
  assert.equal(window.Analytics.isEnabled, true);
  assert.equal(appendedScripts.length, 1);
}

{
  const { window, appendedScripts } = createBrowserContext();

  window.Analytics.init({
    ga4MeasurementId: null,
    gtm: { enabled: true, containerId: 'invalid-container' }
  });
  assert.equal(window.Analytics.isEnabled, false);
  assert.equal(appendedScripts.length, 0);
  assert.equal(window.dataLayer, undefined);
}

console.log('analytics tests passed');

{
  const analyticsConfig = {
    ga4MeasurementId: null,
    gtm: { enabled: true, containerId: 'GTM-TKF64R7Q' },
    adsense: { enabled: false, client: null }
  };
  let initializedWith = null;
  const window = {
    Analytics: {
      init(config) {
        initializedWith = config;
      },
      affiliateClicked() {}
    }
  };
  const document = {
    readyState: 'complete',
    addEventListener() {},
    dispatchEvent() {},
    querySelector() {
      return null;
    },
    createElement() {
      return {};
    },
    head: {
      appendChild() {}
    }
  };
  const context = vm.createContext({
    window,
    document,
    CustomEvent: class CustomEvent {},
    fetch: async () => ({
      ok: true,
      json: async () => ({ analytics: analyticsConfig })
    }),
    encodeURIComponent
  });

  vm.runInContext(bootSource, context, { filename: 'boot.js' });
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(
    JSON.parse(JSON.stringify(initializedWith)),
    analyticsConfig,
    'boot should initialize Analytics with the complete analytics config'
  );
}

console.log('boot analytics initialization test passed');
