// Maalbecho – site interactions: mobile menu, privacy dialog, 2-step enquiry form.
(function () {
  'use strict';

  /* ---------------- Settings (edit before launch) ---------------- */
  // Paste your Google Apps Script web-app URL here (ends with /exec).
  // See google-apps-script/SETUP.md. Each submitted enquiry becomes a new row in your Google Sheet.
  // Leave empty while previewing: the form then shows a notice and a WhatsApp fallback instead.
  var CONFIG = {
    submissionEndpoint: '',
    whatsappNumber: '918796561256' // country code + number, no "+" or spaces
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- Mobile menu ---------------- */
  var menuBtn = $('menuBtn');
  var panel = $('mpanel');
  var ICON_MENU = menuBtn ? menuBtn.innerHTML : '';
  var ICON_CLOSE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';

  function setMenu(open) {
    if (!menuBtn || !panel) return;
    panel.hidden = !open;
    menuBtn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn && panel) {
    menuBtn.addEventListener('click', function () { setMenu(panel.hidden); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------------- Privacy dialog ---------------- */
  var dlg = $('privacyDialog');
  function openPrivacy() {
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    else if (dlg) dlg.setAttribute('open', '');
  }
  ['footerPrivacy', 'privacyLink'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('click', openPrivacy);
  });
  var closeBtn = $('closePrivacy');
  if (closeBtn && dlg) closeBtn.addEventListener('click', function () { dlg.close(); });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ---------------- Enquiry form (contact.html) ---------------- */
  var form = $('leadForm');
  if (!form) return;

  var one = $('stepOne'), two = $('stepTwo'), statusBox = $('formStatus');

  function setStep(n) {
    one.hidden = n !== 1;
    two.hidden = n !== 2;
    $('progressTwo').classList.toggle('active', n === 2);
    $('stepLabel').textContent = n === 1 ? 'Step 1 of 2 · Your business' : 'Step 2 of 2 · Your contact details';
    statusBox.textContent = '';
  }

  function validate(container) {
    var fields = container.querySelectorAll('input,select,textarea');
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) { fields[i].reportValidity(); return false; }
    }
    return true;
  }

  $('next').addEventListener('click', function () {
    if (validate(one)) { setStep(2); $('name').focus(); }
  });
  $('back').addEventListener('click', function () { setStep(1); $('businessType').focus(); });

  // Pre-select the business type from ?type=Manufacturer / Distributor / Wholesaler
  try {
    var t = new URLSearchParams(window.location.search).get('type');
    if (t) {
      var sel = $('businessType');
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.toLowerCase() === t.toLowerCase()) { sel.selectedIndex = i; break; }
      }
    }
  } catch (err) { /* ignore */ }

  function waSummary(d) {
    var lines = [
      'Hi Maalbecho! I\'d like to discuss my business.',
      'Business: ' + d.businessType + ' – ' + d.company,
      'Category: ' + d.category,
      'Location: ' + d.city + ', ' + d.state,
      'Sells via: ' + d.channel,
      'Challenge: ' + d.challenge,
      'Contact: ' + d.name + ' (' + d.role + '), ' + d.phone
    ];
    return 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(two)) return;

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.contactConsent = $('consent').checked;
    data.whatsappConsent = form.elements.whatsappConsent.checked;
    data.source = 'maalbecho-website';
    data.pageUrl = window.location.href;

    // Spam trap: real visitors never see or fill the hidden field. Pretend success, send nothing.
    if (data.hp_website) { showThanks(); return; }

    // Preview mode: nothing is sent anywhere.
    if (!CONFIG.submissionEndpoint) {
      statusBox.textContent = 'Preview only: your enquiry has NOT been sent or saved yet. ';
      var a = document.createElement('a');
      a.href = waSummary(data);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Send these details on WhatsApp instead →';
      statusBox.appendChild(a);
      return;
    }

    var button = $('submitBtn');
    button.disabled = true;
    button.textContent = 'Sending…';
    // Google Apps Script web apps do not answer CORS preflights, so the body is sent as
    // text/plain (a "simple" request). The script parses it as JSON on its side.
    fetch(CONFIG.submissionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(function (r) { if (!r.ok) throw new Error('Submission failed'); return r.json(); })
      .then(function (res) {
        if (res.success !== true) throw new Error(res.error || 'Submission unconfirmed');
        showThanks();
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = 'Request my growth discussion';
        statusBox.textContent = 'Sorry, something went wrong. Please try again or ';
        var a = document.createElement('a');
        a.href = waSummary(data);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'send these details on WhatsApp →';
        statusBox.appendChild(a);
      });
  });

  function showThanks() {
    form.replaceChildren();
    var h = document.createElement('h3');
    h.textContent = 'Thank you. Your enquiry has been received.';
    var p = document.createElement('p');
    p.textContent = 'Our team will review your business details and get back to you.';
    form.append(h, p);
  }
})();
