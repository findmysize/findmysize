// ============================================================
// FindMySize - Google Apps Script
// Version 3.0 - Full update with Stock Reports support
// ============================================================
//
// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Rename Sheet1 to "Alert Requests"
// 3. Create a second tab called "Stock Reports"
// 4. Add column headers (see below)
// 5. Open Extensions > Apps Script
// 6. Paste this entire script
// 7. Click Deploy > New Deployment > Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 8. Copy the Web App URL into index.html and report-stock.html
//
// ------------------------------------------------------------
// ALERT REQUESTS tab - Row 1 headers (copy exactly):
// Timestamp | Gender | Brand | Model | Color | Style Code | Product URL | Size | Width | Email | Status | Notified At | Retailer Found | Price When Notified | Notes
//
// STOCK REPORTS tab - Row 1 headers (copy exactly):
// Timestamp | Report Type | Retailer | Brand | Model | Sizes Available | Current Price | Original Price | Sale End Date | Notes | Reporter Name | Reporter Email | Product URL | Status
// ============================================================


// ============================================================
// SECTION 1: RECEIVE FORM SUBMISSIONS
// Handles POST requests from index.html and report-stock.html
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Route to correct tab based on report type
    if (data.reportType === 'stock' || data.reportType === 'special') {
      // --- Came from report-stock.html ---
      saveStockReport(ss, data);
    } else {
      // --- Came from index.html (alert request) ---
      saveAlertRequest(ss, data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ============================================================
// SECTION 2: SAVE DATA TO CORRECT SHEET
// ============================================================

function saveAlertRequest(ss, data) {
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) throw new Error('Sheet "Alert Requests" not found. Please rename your sheet.');

  sheet.appendRow([
    new Date(),              // A: Timestamp (request received)
    data.gender || '',       // B: Gender
    data.brand || '',        // C: Brand
    data.model || '',        // D: Model
    data.color || '',        // E: Color
    data.styleCode || '',    // F: Style Code
    data.productUrl || '',   // G: Product URL
    data.size || '',         // H: Size
    data.width || 'Regular', // I: Width
    data.email || '',        // J: Email
    'Pending',               // K: Status
    '',                      // L: Notified At
    '',                      // M: Retailer Found
    '',                      // N: Price When Notified
    ''                       // O: Notes
  ]);

  Logger.log('Alert request saved: ' + data.brand + ' ' + data.size + ' for ' + data.email);
}


function saveStockReport(ss, data) {
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) throw new Error('Sheet "Stock Reports" not found. Please create this tab.');

  sheet.appendRow([
    new Date(),                    // A: Timestamp (report received)
    data.reportType || 'stock',    // B: Report Type (stock or special)
    data.retailer || '',           // C: Retailer
    data.brand || '',              // D: Brand
    data.model || '',              // E: Model
    data.sizesAvailable || '',     // F: Sizes Available
    data.currentPrice || '',       // G: Current / Sale Price
    data.originalPrice || '',      // H: Original Price (specials only)
    data.saleEndDate || '',        // I: Sale End Date (specials only)
    data.notes || '',              // J: Notes
    data.reporterName || 'Anonymous', // K: Reporter Name
    data.reporterEmail || '',      // L: Reporter Email
    data.productUrl || '',         // M: Product URL
    'New'                          // N: Status (New/Verified/Notified/Expired)
  ]);

  Logger.log('Stock report saved: ' + data.reportType + ' - ' + data.brand + ' at ' + data.retailer);
}


// ============================================================
// SECTION 3: NOTIFY USERS FOR A SPECIFIC SHOE
// Use this when you find a shoe in stock or on special
// Run manually from Apps Script editor
// ============================================================

/**
 * Notify all users who requested a specific shoe
 *
 * @param {string} gender       - 'male', 'female', or 'unisex'
 * @param {string} brand        - e.g., 'Nike' (must match exactly)
 * @param {string} model        - e.g., 'Pegasus 41' or 'Any' to match all
 * @param {string} color        - e.g., 'Black/White' or 'Any' to match all
 * @param {string} size         - e.g., '10' or '10.5'
 * @param {string} width        - 'Regular', 'Wide', 'Extra Wide', 'Narrow'
 * @param {string} retailerLink - Full URL to product page
 * @param {number} price        - Price in Rands
 * @param {string} retailerName - e.g., 'Superbalist'
 * @param {string} reporterName - Optional: name of community member who found it
 */
function notifyUsersForShoe(gender, brand, model, color, size, width, retailerLink, price, retailerName, reporterName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
  const genderLabel = genderLabels[gender] || gender;
  width = width || 'Regular';

  Logger.log('--- Starting notification run ---');
  Logger.log('Looking for: ' + gender + ', ' + brand + ', ' + model + ', size ' + size + ', ' + width);

  let matchCount = 0;
  let alreadyNotified = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowGender    = String(row[1]).toLowerCase().trim();
    const rowBrand     = String(row[2]).trim();
    const rowModel     = String(row[3]).trim();
    const rowColor     = String(row[4]).trim();
    const rowStyleCode = String(row[5]).trim();
    const rowSize      = String(row[7]).trim();
    const rowWidth     = String(row[8] || 'Regular').trim();
    const rowEmail     = String(row[9]).trim();
    const rowStatus    = String(row[10]).toLowerCase().trim();

    // Skip already notified rows
    if (rowStatus !== 'pending') { alreadyNotified++; continue; }

    // Check for match
    const genderMatch = rowGender === gender.toLowerCase();
    const brandMatch  = rowBrand.toLowerCase() === brand.toLowerCase();
    const sizeMatch   = rowSize === String(size).trim();
    const widthMatch  = rowWidth === width;
    const modelMatch  = model === 'Any' || rowModel === 'Any' || rowModel.toLowerCase() === model.toLowerCase();
    const colorMatch  = color === 'Any' || rowColor === 'Any' || rowColor.toLowerCase() === color.toLowerCase();

    if (genderMatch && brandMatch && sizeMatch && widthMatch && modelMatch && colorMatch) {
      matchCount++;

      // Build size description
      let sizeDesc = genderLabel + ' size ' + size;
      if (width !== 'Regular') sizeDesc += ' (' + width + ')';

      // Send HTML email
      const subject = '👟 FindMySize: Your ' + brand + ' ' + (model !== 'Any' ? model + ' ' : '') + 'is Available!';
      const htmlBody = buildNotificationEmail({
        brand, model, color, styleCode: rowStyleCode,
        sizeDesc, price, retailerLink, retailerName, reporterName
      });

      MailApp.sendEmail({
        to: rowEmail,
        subject: subject,
        htmlBody: htmlBody,
        noReply: true
      });

      // Update row status
      sheet.getRange(i + 1, 11).setValue('Notified');
      sheet.getRange(i + 1, 12).setValue(new Date());
      sheet.getRange(i + 1, 13).setValue(retailerName || '');
      sheet.getRange(i + 1, 14).setValue(price || '');

      Logger.log('✓ Notified: ' + rowEmail);
    }
  }

  Logger.log('--- Run complete ---');
  Logger.log('Matched & notified: ' + matchCount);
  Logger.log('Skipped (already notified): ' + alreadyNotified);
  Logger.log('Total rows checked: ' + (data.length - 1));
}


// ============================================================
// SECTION 4: NOTIFY A SINGLE USER BY ROW NUMBER
// Useful for manual one-off notifications
// ============================================================

function sendNotificationEmail(rowNumber, retailerLink, price, retailerName, reporterName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const row = sheet.getRange(rowNumber, 1, 1, 15).getValues()[0];

  const gender     = row[1];
  const brand      = row[2];
  const model      = row[3];
  const color      = row[4];
  const styleCode  = row[5];
  const size       = row[7];
  const width      = row[8] || 'Regular';
  const email      = row[9];
  const status     = String(row[10]).toLowerCase();

  if (status !== 'pending') {
    Logger.log('Skipping row ' + rowNumber + ' - status is already: ' + status);
    return;
  }

  const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
  const genderLabel = genderLabels[gender] || gender;

  let sizeDesc = genderLabel + ' size ' + size;
  if (width !== 'Regular') sizeDesc += ' (' + width + ')';

  const subject = '👟 FindMySize: Your ' + brand + ' ' + model + ' is Available!';
  const htmlBody = buildNotificationEmail({
    brand, model, color, styleCode,
    sizeDesc, price, retailerLink, retailerName, reporterName
  });

  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody, noReply: true });

  sheet.getRange(rowNumber, 11).setValue('Notified');
  sheet.getRange(rowNumber, 12).setValue(new Date());
  if (retailerName) sheet.getRange(rowNumber, 13).setValue(retailerName);
  if (price) sheet.getRange(rowNumber, 14).setValue(price);

  Logger.log('✓ Notification sent to ' + email + ' for row ' + rowNumber);
}


// ============================================================
// SECTION 5: EMAIL TEMPLATE
// Builds a clean HTML email for notifications
// ============================================================

function buildNotificationEmail(details) {
  const { brand, model, color, styleCode, sizeDesc, price, retailerLink, retailerName, reporterName } = details;
  const modelText  = (model && model !== 'Any' && model !== 'Not specified') ? model : '';
  const colorText  = (color && color !== 'Any' && color !== 'Not specified') ? color : '';
  const styleText  = (styleCode && styleCode !== 'Not provided' && styleCode !== '') ? styleCode : '';
  const priceText  = price ? 'R' + Number(price).toLocaleString('en-ZA') : '';
  const foundBy    = reporterName && reporterName !== 'Anonymous' ? '🙌 Thanks to <strong>' + reporterName + '</strong> for spotting this!' : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea,#764ba2); padding:35px 40px; text-align:center;">
              <h1 style="margin:0; color:white; font-size:28px; font-weight:700;">FindMySize</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:15px;">Your shoe is available!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px 40px;">

              <p style="margin:0 0 20px; color:#333; font-size:16px; line-height:1.6;">
                Great news! We found the shoe you've been waiting for. 🎉
              </p>

              <!-- Shoe details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff; border-radius:10px; border-left:4px solid #667eea; margin-bottom:25px;">
                <tr>
                  <td style="padding:20px 25px;">
                    <p style="margin:0 0 12px; color:#667eea; font-weight:700; font-size:16px;">Shoe Details</p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr><td style="color:#888; font-size:14px; width:110px;">Brand</td><td style="color:#333; font-size:14px; font-weight:600;">${brand}</td></tr>
                      ${modelText ? `<tr><td style="color:#888; font-size:14px;">Model</td><td style="color:#333; font-size:14px; font-weight:600;">${modelText}</td></tr>` : ''}
                      ${colorText ? `<tr><td style="color:#888; font-size:14px;">Color</td><td style="color:#333; font-size:14px; font-weight:600;">${colorText}</td></tr>` : ''}
                      ${styleText ? `<tr><td style="color:#888; font-size:14px;">Style Code</td><td style="color:#333; font-size:14px; font-weight:600;">${styleText}</td></tr>` : ''}
                      <tr><td style="color:#888; font-size:14px;">Size</td><td style="color:#333; font-size:14px; font-weight:600;">${sizeDesc}</td></tr>
                      ${priceText ? `<tr><td style="color:#888; font-size:14px;">Price</td><td style="color:#333; font-size:14px; font-weight:600;">${priceText}</td></tr>` : ''}
                      <tr><td style="color:#888; font-size:14px;">Retailer</td><td style="color:#333; font-size:14px; font-weight:600;">${retailerName || 'See link below'}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${foundBy ? `<p style="margin:0 0 20px; color:#555; font-size:14px; text-align:center;">${foundBy}</p>` : ''}

              <!-- CTA Button -->
              ${retailerLink ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td align="center">
                    <a href="${retailerLink}"
                      style="display:inline-block; padding:16px 40px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; text-decoration:none; border-radius:10px; font-weight:700; font-size:16px;">
                      Buy Now →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin:0; color:#888; font-size:13px; line-height:1.6; text-align:center;">
                ⚡ Stock goes fast — sizes sell out quickly!<br>
                We recommend buying as soon as possible.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa; padding:20px 40px; border-top:1px solid #e0e0e0;">
              <p style="margin:0; color:#aaa; font-size:12px; text-align:center; line-height:1.8;">
                You received this because you signed up for alerts at <strong>FindMySize</strong>.<br>
                To unsubscribe, reply to this email with <strong>UNSUBSCRIBE</strong>.<br>
                We comply with POPIA — your data is never shared or sold.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}


// ============================================================
// SECTION 6: STATISTICS
// Run getAlertStatistics() to see what's in demand
// Run getStockReportStats() to see community activity
// ============================================================

function getAlertStatistics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const data = sheet.getDataRange().getValues();

  const stats = {
    total: data.length - 1,
    byGender: {},
    byBrand: {},
    bySize: {},
    byWidth: {},
    byColor: {},
    pending: 0,
    notified: 0,
    withStyleCode: 0,
    withProductUrl: 0
  };

  for (let i = 1; i < data.length; i++) {
    const gender     = data[i][1];
    const brand      = data[i][2];
    const color      = data[i][4];
    const styleCode  = data[i][5];
    const productUrl = data[i][6];
    const size       = data[i][7];
    const width      = data[i][8] || 'Regular';
    const status     = String(data[i][10]).toLowerCase();

    if (gender) stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;
    if (brand)  stats.byBrand[brand]   = (stats.byBrand[brand]   || 0) + 1;
    if (size)   stats.bySize[size]     = (stats.bySize[size]     || 0) + 1;
    stats.byWidth[width]               = (stats.byWidth[width]   || 0) + 1;
    if (color)  stats.byColor[color]   = (stats.byColor[color]   || 0) + 1;

    if (status === 'pending')  stats.pending++;
    if (status === 'notified') stats.notified++;
    if (styleCode && styleCode !== 'Not provided' && styleCode !== '') stats.withStyleCode++;
    if (productUrl && productUrl !== 'Not provided' && productUrl !== '') stats.withProductUrl++;
  }

  Logger.log('=== ALERT REQUEST STATISTICS ===');
  Logger.log(JSON.stringify(stats, null, 2));
  return stats;
}


function getStockReportStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Sheet "Stock Reports" not found.'); return; }

  const data = sheet.getDataRange().getValues();

  const stats = {
    total: data.length - 1,
    stockReports: 0,
    specialReports: 0,
    byRetailer: {},
    byBrand: {},
    byStatus: {},
    withReporterName: 0,
    withReporterEmail: 0
  };

  for (let i = 1; i < data.length; i++) {
    const reportType   = data[i][1];
    const retailer     = data[i][2];
    const brand        = data[i][3];
    const reporterName = data[i][10];
    const reporterEmail= data[i][11];
    const status       = data[i][13];

    if (reportType === 'stock')   stats.stockReports++;
    if (reportType === 'special') stats.specialReports++;
    if (retailer) stats.byRetailer[retailer] = (stats.byRetailer[retailer] || 0) + 1;
    if (brand)    stats.byBrand[brand]        = (stats.byBrand[brand]       || 0) + 1;
    if (status)   stats.byStatus[status]      = (stats.byStatus[status]     || 0) + 1;
    if (reporterName && reporterName !== 'Anonymous') stats.withReporterName++;
    if (reporterEmail) stats.withReporterEmail++;
  }

  Logger.log('=== STOCK REPORT STATISTICS ===');
  Logger.log(JSON.stringify(stats, null, 2));
  return stats;
}


// ============================================================
// SECTION 7: PROCESS A STOCK REPORT
// Run this after verifying a community stock report
// It will find matching alert requests and notify them
// ============================================================

/**
 * Process a verified stock report and notify matching users
 * @param {number} reportRow - Row number in Stock Reports tab
 */
function processStockReport(reportRow) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName('Stock Reports');
  if (!reportsSheet) { Logger.log('ERROR: Sheet "Stock Reports" not found.'); return; }

  const row = reportsSheet.getRange(reportRow, 1, 1, 14).getValues()[0];

  const reportType     = row[1];
  const retailer       = row[2];
  const brand          = row[3];
  const model          = row[4] || 'Any';
  const sizesAvailable = String(row[5]);
  const currentPrice   = row[6];
  const productUrl     = row[12];
  const reporterName   = row[10];
  const status         = row[13];

  if (status === 'Notified') {
    Logger.log('Row ' + reportRow + ' already processed.');
    return;
  }

  // Parse sizes into array
  const sizes = sizesAvailable.split(',').map(s => s.trim()).filter(s => s !== '');

  Logger.log('Processing stock report: ' + brand + ' at ' + retailer);
  Logger.log('Sizes to notify: ' + sizes.join(', '));

  let totalNotified = 0;

  // Notify for each size
  sizes.forEach(function(size) {
    // Try all genders since one report can match multiple
    ['male', 'female', 'unisex'].forEach(function(gender) {
      notifyUsersForShoe(
        gender,
        brand,
        model,
        'Any',           // Match any color
        size,
        'Regular',       // Default to regular - will add wide support later
        productUrl,
        currentPrice,
        retailer,
        reporterName
      );
    });
  });

  // Mark report as Notified
  reportsSheet.getRange(reportRow, 14).setValue('Notified');
  reportsSheet.getRange(reportRow, 14).setBackground('#c8e6c9'); // Light green

  Logger.log('✓ Stock report processed. Row ' + reportRow + ' marked as Notified.');
}


// ============================================================
// SECTION 8: TEST FUNCTIONS
// Use these to test without real data
// ============================================================

function testNotification() {
  notifyUsersForShoe(
    'female',              // gender
    'Saucony',             // brand
    'Peregrine 16',        // model
    'Any',                 // color (use 'Any' to match all)
    '5.5',                 // size
    'Regular',             // width
    'https://theathletesfoot.co.za/collections/buy-ladies-trail-running-shoes-online/products/mens-peregrine-16-s11066-130',
    2599,                  // price
    'The Athletes Foot',   // retailer
    'Bill'                 // reporter name (optional)
  );
}

function testStockReport() {
  // Simulates receiving a stock report from the community
  const testData = {
    reportType: 'stock',
    retailer: 'Superbalist',
    brand: 'Nike',
    model: 'Pegasus 41',
    sizesAvailable: '8, 9, 10, 10.5',
    currentPrice: '1999',
    originalPrice: '',
    saleEndDate: '',
    notes: 'Just went back in stock',
    reporterName: 'Sarah',
    reporterEmail: '',
    productUrl: 'https://superbalist.com/test'
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  saveStockReport(ss, testData);
  Logger.log('Test stock report saved to Stock Reports tab.');
}


// ============================================================
// QUICK REFERENCE
// ============================================================
//
// DAILY WORKFLOW:
//
// 1. Check "Stock Reports" tab for new rows with Status = "New"
// 2. Verify the link is real and in stock
// 3. Run: processStockReport(ROW_NUMBER)
//    e.g., processStockReport(3)  ← processes row 3
//
// OR manually run:
//    notifyUsersForShoe('male', 'Nike', 'Pegasus 41', 'Any', '10', 'Regular', 'https://...', 1999, 'Superbalist')
//
// CHECK DEMAND:
//    getAlertStatistics()     ← see what shoes people want most
//    getStockReportStats()    ← see community reporting activity
//
// NOTIFY ONE PERSON:
//    sendNotificationEmail(5, 'https://...', 1999, 'Superbalist')  ← notify row 5
//
// ============================================================
