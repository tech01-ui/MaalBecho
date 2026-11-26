// Maalbecho landing: lead form. Same settings as js/main.js (edit before launch).
(function () {
  'use strict';
  var CONFIG = { submissionEndpoint: '', whatsappNumber: '1234567890' }; // placeholders
  var form = document.getElementById('leadForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  var btn = document.getElementById('submitBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {};
    new FormData(form).forEach(function (v, k) { d[k] = v; });
    d.source = 'maalbecho-landing';

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
    fetch(CONFIG.submissionEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
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
