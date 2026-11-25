# Send website leads to Google Sheets

Every enquiry from the Contact page becomes **a new row** in your Google Sheet. About 5 minutes, no coding.

## 1. Create the Sheet and paste the script
1. Go to <https://sheets.new> and name the sheet, e.g. **Maalbecho Leads**.
2. In the Sheet: **Extensions > Apps Script**.
3. Delete the sample code, then paste the **whole** content of [`Code.gs`](Code.gs). Click **Save** (disk icon).
4. In the function dropdown at the top choose **`setup`** and click **Run**.
   Google asks for permission the first time: **Review permissions > choose your account > Advanced > Go to project (unsafe) > Allow**.
   This is normal for your own script. It only gets access to spreadsheets.
5. Go back to the Sheet: a **Leads** tab now exists with headers, a Status dropdown and filters.
6. *(Optional)* Choose **`testLead`** and **Run**. A test row appears. Delete it afterwards.

## 2. Publish it as a web app
1. In Apps Script click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Settings:
   - **Execute as:** Me
   - **Who has access:** **Anyone** (visitors are not signed in, so this is required)
4. Click **Deploy** and copy the **Web app URL**. It ends with `/exec`.
5. Open that URL in a browser. You should see `{"ok":true,"service":"Maalbecho lead endpoint",...}`.

## 3. Connect the website
Open `js/main.js` and paste the URL:

```js
var CONFIG = {
  submissionEndpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  whatsappNumber: '918796561256'   // already set: country code + number, no "+" or spaces
};
```

Submit the form on `contact.html`. A new row should appear in the **Leads** tab within a few seconds.

## What lands in the Sheet
| Column | Notes |
|---|---|
| Received (IST) | Timestamp, `yyyy-MM-dd HH:mm:ss` (Asia/Kolkata) |
| Status | Starts as **New**. Dropdown: New, Contacted, Qualified, Meeting booked, Won, Lost, Not relevant (colour-coded) |
| Business type, Company, Product / category, City, State, Sales channel, Growth challenge | Step 1 of the form |
| Contact name, Role, Phone, Email, Website / listing, Notes from lead | Step 2 of the form |
| OK to contact, OK on WhatsApp | Yes / No, the consent the visitor gave |
| Source, Page URL | Where the lead came from |
| Internal notes | Empty: for your team |

Values are stored as plain text, so nobody can inject a spreadsheet formula through the form.

## Built-in protection
- Hidden spam-trap field: bots that fill it are silently ignored.
- Server-side checks: required fields, valid phone and email, consent ticked, text capped at 1500 characters.
- A lock ensures two leads arriving together never overwrite each other.

## If you change the script later
Edits are **not live** until you publish a new version:
**Deploy > Manage deployments > pencil icon > Version: New version > Deploy.** The URL stays the same.

## Troubleshooting
| Problem | Fix |
|---|---|
| Form says "Sorry, something went wrong" | Check **Who has access = Anyone** and that you copied the `/exec` URL (not `/dev`). |
| Browser shows a Google sign-in page for the URL | Access is not set to **Anyone**. Redeploy with that setting. |
| Rows missing after editing the script | You forgot **New version** (see above). |
| Want to see errors | Apps Script > **Executions** (left menu) lists every run and any error. |
| Email alert on each lead | In the Sheet: **Tools > Notification rules**, or ask for an email notification to be added to the script. |

## Privacy
The sheet holds personal data (names, phones, emails). Keep it shared only with people who need it, and publish your Privacy Policy before going live (the footer link currently opens a placeholder).
