'use strict';

var contexts = () => {
  chrome.contextMenus.create({
    id: 'update-now',
    title: 'Update now',
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    id: 'open-converter',
    title: 'Exchange converter',
    contexts: ['browser_action']
  });
};

var reset = () => chrome.storage.local.get({
  period: 10,
  badge: true
}, prefs => {
  chrome.alarms.clearAll(() => {
    if (prefs.badge) {
      chrome.alarms.create('alarm', {
        when: Date.now() + 1000,
        periodInMinutes: prefs.period
      });
    }
    else {
      chrome.browserAction.setBadgeText({
        text: ''
      });
      chrome.browserAction.setTitle({
        title: chrome.runtime.getManifest().name
      });
    }
  });
});
const startup = () => {
  contexts();
  reset();
};
chrome.runtime.onInstalled.addListener(startup);
chrome.runtime.onStartup.addListener(startup);

var badge = (text, title, color) => {
  chrome.browserAction.setBadgeText({
    text
  });
  chrome.browserAction.setTitle({
    title
  });
  chrome.browserAction.setBadgeBackgroundColor({
    color
  });
};

function readableSize(number, decimals) {
  function i() {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(decimals) + 'M';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(decimals) + 'K';
    }
    if (number < 0.00001) {
      return (number * 1000000).toFixed(decimals) + 'u';
    }
    if (number < 0.01) {
      return (number * 1000).toFixed(decimals) + 'm';
    }
    else if (number < 0.1) {
      decimals = Math.max(2, decimals);
    }
    return number.toFixed(decimals);
  }
  return i().replace(/^0\./, '.');
}

chrome.alarms.onAlarm.addListener(() => chrome.storage.local.get({
  base: 'ETH',
  target: 'USD',
  decimals: 1,
  'color-up': '#346f34',
  'color-down': '#6d2725',
  'readable': true
}, prefs => fetch(`https://api.cryptonator.com/api/full/${prefs.base}-${prefs.target}`)
.then(r => r.json()).then(j => {
  if (j.error) {
    badge('E', j.error, 'red');
  }
  const o = j.ticker;
  const color = o.change.startsWith('-') ? prefs['color-down'] : prefs['color-up'];
  const msg = `Base currency code: ${o.base}
Target currency code: ${o.target}

Volume-weighted price: ${o.price}
Total trade volume for the last 24 hours: ${o.volume}
Past hour price change: ${o.change}

Last updated: ${(new Date()).toLocaleString()}`;

  let price = Number(j.ticker.price);
  if (prefs.readable) {
    price = readableSize(price, prefs.decimals);
  }
  else {
    price = price.toFixed(prefs.decimals);
  }
  badge(price, msg, color);
})));

chrome.browserAction.onClicked.addListener(() => chrome.storage.local.get('url', prefs => chrome.tabs.create({
  url: prefs.url
})));

chrome.contextMenus.onClicked.addListener(({menuItemId}) => {
  if (menuItemId === 'update-now') {
    reset();
  }
  else if (menuItemId === 'open-converter') {
    chrome.tabs.create({
      url: 'https://www.cryptonator.com/converter/'
    });
  }
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1,
  'last-update': 0,
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        });
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
