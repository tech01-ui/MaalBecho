// Maalbecho landing: lead form. Same settings as js/main.js (edit before launch).
(function () {
  'use strict';
  var CONFIG = { submissionEndpoint: 'https://script.google.com/macros/s/AKfycby0zCvwLrOIrfZFXBqEAA3aI68t4S6CMzEkhTKKBRzBnpFyE9Zhbukj9zABw4B84n6Y/exec', whatsappNumber: '919968669944' }; // placeholders
  // Custom dropdown
  var dd = document.getElementById('turnoverDD');
  if (dd) {
    var btn0 = dd.querySelector('.dd-btn'), list = dd.querySelector('.dd-list'), hid = dd.querySelector('input'), items = [].slice.call(list.children);
    var setOpen = function (o) { list.hidden = !o; dd.classList.toggle('open', o); btn0.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    var pick = function (li) {
      items.forEach(function (x) { x.removeAttribute('aria-selected'); });
      li.setAttribute('aria-selected', 'true'); hid.value = li.dataset.v; btn0.firstChild.textContent = li.dataset.v; setOpen(false); btn0.focus();
    };
    btn0.addEventListener('click', function () { setOpen(list.hidden); if (!list.hidden) (list.querySelector('[aria-selected]') || items[0]).focus(); });
    items.forEach(function (li, i) {
      li.addEventListener('click', function () { pick(li); });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(li); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || li).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || li).focus(); }
      });
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { setOpen(false); btn0.focus(); } });
  }

  var form = document.getElementById('leadForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  var btn = document.getElementById('submitBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {};
    new FormData(form).forEach(function (v, k) { d[k] = v; });
    d.source = 'maalbecho-landing';
    d.page = location.href;

    if (!CONFIG.submissionEndpoint) {
      var msg = 'Hi Maalbecho! I\'d like a growth call.\nName: ' + d.name + '\nCompany: ' + d.company +
        '\nPhone: ' + d.phone + '\nCategory: ' + d.category + '\nTurnover: ' + d.turnover;
      status.textContent = 'Preview only: your details have NOT been sent yet. ';
      var a = document.createElement('a');
      a.href = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(msg);
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = 'Send them on WhatsApp instead →';
      status.appendChild(a);
      return;
    }
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(CONFIG.submissionEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (r) {
        if (r.success !== true) throw 0;
        document.getElementById('formWrap').hidden = true;
        document.getElementById('formDone').hidden = false;
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Book My Growth Call →';
        status.textContent = 'Sorry, something went wrong. Please try again or call us.';
      });
  });
})();
