/**
 * Maalbecho – lead capture for Google Sheets
 * ---------------------------------------------------------------
 * The website form POSTs each enquiry here and it becomes a new row
 * in the "Leads" tab of the spreadsheet this script is attached to.
 *
 * How to use: see SETUP.md (open the Sheet > Extensions > Apps Script,
 * paste this file, run setup(), then Deploy > New deployment > Web app).
 */

// ===================== SETTINGS =====================
var SHEET_NAME = 'Leads';            // tab that receives the leads (created automatically)
var TIMEZONE = 'Asia/Kolkata';       // timestamps are written in this timezone
var MAX_FIELD_LENGTH = 1500;         // longer text is cut off
var SPREADSHEET_ID = '';             // leave empty when the script is opened from inside the Sheet

// Column order: [ header shown in the sheet, key sent by the website ]
var COLUMNS = [
  ['Received (IST)', 'receivedAt'],
  ['Status', 'status'],
  ['Business type', 'businessType'],
  ['Company', 'company'],
  ['Product / category', 'category'],
  ['City', 'city'],
  ['State', 'state'],
  ['Sales channel', 'channel'],
  ['Growth challenge', 'challenge'],
  ['Contact name', 'name'],
  ['Role', 'role'],
  ['Phone', 'phone'],
  ['Email', 'email'],
  ['Website / listing', 'website'],
  ['Notes from lead', 'goal'],
  ['OK to contact', 'contactConsent'],
  ['OK on WhatsApp', 'whatsappConsent'],
  ['Source', 'source'],
  ['Page URL', 'pageUrl'],
  ['Internal notes', 'internalNotes']
];
var STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Meeting booked', 'Won', 'Lost', 'Not relevant'];
var REQUIRED = ['businessType', 'company', 'category', 'city', 'state', 'channel', 'challenge', 'name', 'role', 'phone'];


// ===================== WEB APP ENTRY POINTS =====================

/** Receives a lead from the website form. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    locked = lock.tryLock(20000);                 // stops two leads writing to the same row
    if (!locked) return json_({ success: false, error: 'Server busy, please retry' });

    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    var data = JSON.parse(raw);

    if (data.hp_website) return json_({ success: true });   // hidden spam-trap field was filled: a bot

    var problem = validate_(data);
    if (problem) return json_({ success: false, error: problem });

    appendLead_(data);
    return json_({ success: true });
  } catch (err) {
    console.error(err);
    return json_({ success: false, error: 'Server error' });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/** Opening the web-app URL in a browser shows this, so you can check it is live. */
function doGet() {
  return json_({ ok: true, service: 'Maalbecho lead endpoint', time: new Date().toISOString() });
}


// ===================== RUN THESE FROM THE EDITOR =====================

/** Run once: creates the Leads tab with headers, filters, status dropdown and colours. */
function setup() {
  var sheet = getSheet_();
  Logger.log('Ready. Your leads will appear here: ' + sheet.getParent().getUrl());
}

/** Optional: adds a dummy row so you can see it works (delete the row afterwards). */
function testLead() {
  appendLead_({
    businessType: 'Manufacturer', company: 'Test Company', category: 'Packaging',
    city: 'Pune', state: 'Maharashtra', channel: 'Distributors',
    challenge: 'Finding relevant new buyers', name: 'Test Person', role: 'Owner / Founder',
    phone: '+91 98765 43210', email: 'test@example.com', website: '', goal: 'This is a test lead.',
    contactConsent: true, whatsappConsent: true, source: 'apps-script-test', pageUrl: 'editor'
  });
  Logger.log('Test lead added to the "' + SHEET_NAME + '" tab. Delete it when you have checked it.');
}


// ===================== INTERNALS =====================

function validate_(d) {
  for (var i = 0; i < REQUIRED.length; i++) {
    if (!clean_(d[REQUIRED[i]])) return 'Missing field: ' + REQUIRED[i];
  }
  if (d.contactConsent !== true && d.contactConsent !== 'true') return 'Consent is required';
  if (!/^[+0-9() .\-]{8,22}$/.test(clean_(d.phone))) return 'Invalid phone number';
  if (clean_(d.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(d.email))) return 'Invalid email';
  return '';
}

function clean_(value) {
  return String(value == null ? '' : value).trim().slice(0, MAX_FIELD_LENGTH);
}

function appendLead_(data) {
  var sheet = getSheet_();
  var row = COLUMNS.map(function (col) {
    var key = col[1];
    if (key === 'receivedAt') return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    if (key === 'status') return 'New';
    if (key === 'internalNotes') return '';
    if (key === 'contactConsent' || key === 'whatsappConsent') {
      return (data[key] === true || data[key] === 'true') ? 'Yes' : 'No';
    }
    return clean_(data[key]);
  });
  var rowNumber = sheet.getLastRow() + 1;
  var range = sheet.getRange(rowNumber, 1, 1, row.length);
  range.setNumberFormat('@');          // plain text: stops "=..." entries from running as formulas
  range.setValues([row]);
}

function getSheet_() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) formatSheet_(sheet);
  return sheet;
}

function formatSheet_(sheet) {
  var headers = COLUMNS.map(function (c) { return c[0]; });
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#14161f')
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);

  // sensible column widths
  var widths = { 1: 150, 2: 120, 3: 120, 4: 170, 5: 170, 6: 110, 7: 120, 8: 150, 9: 220, 10: 150, 11: 130, 12: 140, 13: 190, 14: 180, 15: 280, 16: 100, 17: 110, 18: 140, 19: 220, 20: 220 };
  Object.keys(widths).forEach(function (c) { sheet.setColumnWidth(Number(c), widths[c]); });

  // Status dropdown (column B) for the next 2000 rows
  var statusRule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_OPTIONS, true).setAllowInvalid(true).build();
  sheet.getRange(2, 2, 2000, 1).setDataValidation(statusRule);

  // colour the Status cells
  var statusRange = sheet.getRange(2, 2, 2000, 1);
  var rules = sheet.getConditionalFormatRules();
  [['New', '#fff3bf'], ['Contacted', '#dbe4ff'], ['Qualified', '#d3f9d8'], ['Meeting booked', '#c5f6fa'], ['Won', '#8ce99a'], ['Lost', '#e9ecef'], ['Not relevant', '#e9ecef']]
    .forEach(function (pair) {
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(pair[0]).setBackground(pair[1]).setRanges([statusRange]).build());
    });
  sheet.setConditionalFormatRules(rules);

  // filter buttons on the header row
  if (!sheet.getFilter()) sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
