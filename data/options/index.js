'use strict';

fetch('/data/assets/currencies.json').then(r => r.json()).then(j => j.rows).then(arr => {
  const fiat = document.createDocumentFragment();
  const populars = document.createDocumentFragment();
  const others = document.createDocumentFragment();
  arr.forEach(o => {
    let target = others;
    if (['USD', 'EUR', 'RUR', 'GBP'].indexOf(o.code) !== -1) {
      target = fiat;
    }
    else if (['BTC', 'LTC', 'DOGE', 'ETH'].indexOf(o.code) !== -1) {
      target = populars;
    }
    target.appendChild(Object.assign(document.createElement('option'), o, {
      value: o.code,
      textContent: `${o.name} (${o.code})`,
    }));
  });
  document.querySelector('#base [data-id=fiat]').appendChild(fiat.cloneNode(true));
  document.querySelector('#target [data-id=fiat]').appendChild(fiat);
  document.querySelector('#base [data-id=populars]').appendChild(populars.cloneNode(true));
  document.querySelector('#target [data-id=populars]').appendChild(populars);
  document.querySelector('#base [data-id=others]').appendChild(others.cloneNode(true));
  document.querySelector('#target [data-id=others]').appendChild(others);

  chrome.storage.local.get({
    badge: true,
    readable: true,
    period: 15,
    decimals: 1,
    'color-up': '#346f34',
    'color-down': '#6d2725',
    base: 'ETH',
    target: 'USD',
    url: 'https://www.cryptonator.com/winners-losers/USD/'
  }, prefs => {
    document.getElementById('badge').checked = prefs.badge;
    document.getElementById('readable').checked = prefs.readable;
    document.getElementById('period').value = prefs.period;
    document.getElementById('decimals').value = prefs.decimals;
    document.getElementById('color-up').value = prefs['color-up'];
    document.getElementById('color-down').value = prefs['color-down'];
    document.getElementById('base').value = prefs.base;
    document.getElementById('target').value = prefs.target;
    document.getElementById('url').value = prefs.url;
  });
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    badge: document.getElementById('badge').checked,
    readable: document.getElementById('readable').checked,
    period: Math.max(5, Number(document.getElementById('period').value)),
    decimals: Math.max(0, Number(document.getElementById('decimals').value)),
    'color-up': document.getElementById('color-up').value,
    'color-down': document.getElementById('color-down').value,
    base: document.getElementById('base').value,
    target: document.getElementById('target').value,
    url: document.getElementById('url').value
  }, () => {
    const info = document.getElementById('info');
    info.textContent = 'Options saved';
    chrome.storage.local.get({
      period: 15,
      decimals: 1
    }, prefs => {
      document.getElementById('period').value = prefs.period;
      document.getElementById('decimals').value = prefs.decimals;
    });
    chrome.runtime.getBackgroundPage(b => b.reset());
    window.setTimeout(() => info.textContent = '', 750);
  });
});
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
