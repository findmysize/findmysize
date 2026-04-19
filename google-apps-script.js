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
// Timestamp | Gender | Brand | Model | Color | Style Code | Size | Width | Email | Status | Notified At | Last Update Sent | Retailer Found | Price When Notified | Notes | Product URL
//
// STOCK REPORTS tab - Row 1 headers (copy exactly):
// Timestamp | Report Type | Gender | Brand | Model | Width | Sizes Available | Retailer | Current Price | Original Price | Sale End Date | Notes | Reporter Name | Reporter Email | Status | Product URL
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
    new Date(),              // A: Timestamp
    data.gender || '',       // B: Gender
    data.brand || '',        // C: Brand
    data.model || '',        // D: Model
    data.color || '',        // E: Color
    data.styleCode || '',    // F: Style Code
    data.size || '',         // G: Size
    data.width || 'Regular', // H: Width
    data.email || '',        // I: Email
    'Pending',               // J: Status
    '',                      // K: Notified At
    '',                      // L: Last Update Sent
    '',                      // M: Retailer Found
    '',                      // N: Price When Notified
    '',                      // O: Notes
    data.productUrl || ''    // P: Product URL
  ]);

  Logger.log('Alert request saved: ' + data.brand + ' ' + data.size + ' for ' + data.email);
}


function saveStockReport(ss, data) {
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) throw new Error('Sheet "Stock Reports" not found. Please create this tab.');

  sheet.appendRow([
    new Date(),                       // A: Timestamp
    data.reportType || 'stock',       // B: Report Type
    data.gender || 'Any',             // C: Gender
    data.brand || '',                 // D: Brand
    data.model || '',                 // E: Model
    data.width || 'Any',              // F: Width
    data.sizesAvailable || '',        // G: Sizes Available
    data.retailer || '',              // H: Retailer
    data.currentPrice || '',          // I: Current / Sale Price
    data.originalPrice || '',         // J: Original Price (specials only)
    data.saleEndDate || '',           // K: Sale End Date (specials only)
    data.notes || '',                 // L: Notes
    data.reporterName || 'Anonymous', // M: Reporter Name
    data.reporterEmail || '',         // N: Reporter Email
    'New',                            // O: Status
    data.productUrl || ''             // P: Product URL
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
  // Guard: make sure required parameters were provided
  if (!gender || !brand || !size) {
    Logger.log('ERROR: Missing required parameters. Please provide gender, brand, and size.');
    Logger.log('Example: notifyUsersForShoe("male", "Nike", "Pegasus 41", "Any", "10", "Regular", "https://...", 1999, "Superbalist")');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
  const genderLabel = genderLabels[gender] || gender;
  width = width || 'Regular';
  model = model || 'Any';
  color = color || 'Any';

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
    const rowSize      = String(row[6]).trim();
    const rowWidth     = String(row[7] || 'Regular').trim();
    const rowEmail     = String(row[8]).trim();
    const rowStatus    = String(row[9]).toLowerCase().trim();

    // Skip purchased, notified and re-notified rows — only process pending and re-notify
    if (rowStatus === 'purchased') { alreadyNotified++; continue; }
    if (rowStatus !== 'pending' && rowStatus !== 're-notify') { alreadyNotified++; continue; }

    // Check for match
    const genderMatch = rowGender === String(gender).toLowerCase();
    const brandMatch  = rowBrand.toLowerCase() === String(brand).toLowerCase();
    const sizeMatch   = rowSize === String(size).trim();
    const widthMatch  = rowWidth === width;
    const modelMatch  = model === 'Any' || rowModel === 'Any' || rowModel.toLowerCase() === String(model).toLowerCase();
    const colorMatch  = color === 'Any' || rowColor === 'Any' || rowColor.toLowerCase() === String(color).toLowerCase();

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

      // Update row status - track if this was a re-notification
      const newStatus = rowStatus === 're-notify' ? 'Re-notified' : 'Notified';
      sheet.getRange(i + 1, 10).setValue(newStatus);   // J: Status
      sheet.getRange(i + 1, 11).setValue(new Date());  // K: Notified At
      sheet.getRange(i + 1, 13).setValue(retailerName || ''); // M: Retailer Found
      sheet.getRange(i + 1, 14).setValue(price || ''); // N: Price When Notified

      Logger.log('✓ Notified: ' + rowEmail);
    }
  }

  Logger.log('--- Run complete ---');
  Logger.log('Matched & notified: ' + matchCount);
  Logger.log('Skipped (already notified): ' + alreadyNotified);
  Logger.log('Total rows checked: ' + (data.length - 1));
  return matchCount;
}


// ============================================================
// SECTION 4: NOTIFY A SINGLE USER BY ROW NUMBER
// Useful for manual one-off notifications
// ============================================================

function sendNotificationEmail(rowNumber, retailerLink, price, retailerName, reporterName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const row = sheet.getRange(rowNumber, 1, 1, 16).getValues()[0];

  const gender     = row[1];
  const brand      = row[2];
  const model      = row[3];
  const color      = row[4];
  const styleCode  = row[5];
  const size       = row[6];
  const width      = row[7] || 'Regular';
  const email      = row[8];
  const status     = String(row[9]).toLowerCase();

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

  sheet.getRange(rowNumber, 10).setValue('Notified');  // J: Status
  sheet.getRange(rowNumber, 11).setValue(new Date());  // K: Notified At
  if (retailerName) sheet.getRange(rowNumber, 13).setValue(retailerName); // M: Retailer Found
  if (price) sheet.getRange(rowNumber, 14).setValue(price);               // N: Price When Notified

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
  const priceText  = price ? 'R' + Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
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
    const size       = data[i][6];
    const width      = data[i][7] || 'Regular';
    const status     = String(data[i][9]).toLowerCase();  // J
    const productUrl = data[i][15];                        // P: Product URL

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
    const reportType    = data[i][1];   // B
    const brand         = data[i][3];   // D
    const retailer      = data[i][7];   // H
    const reporterName  = data[i][12];  // M
    const reporterEmail = data[i][13];  // N
    const status        = data[i][14];  // O

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
// SECTION 7: PROCESS STOCK REPORTS
// ============================================================

/**
 * ⭐ MAIN FUNCTION - Run this once a day (or whenever you want)
 * Automatically checks ALL new stock reports and notifies
 * matching users in Alert Requests. No manual steps needed.
 */
function processAllNewStockReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName('Stock Reports');
  if (!reportsSheet) { Logger.log('ERROR: Sheet "Stock Reports" not found.'); return; }

  const data = reportsSheet.getDataRange().getValues();
  let processed = 0;
  let skipped = 0;

  Logger.log('========================================');
  Logger.log('Processing all new stock reports...');
  Logger.log('Total rows found: ' + (data.length - 1));
  Logger.log('========================================');

  // Loop through all stock report rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row    = data[i];

    // Process "New" and "Active" reports — skip Expired/Notified
    const status = String(row[14]).trim();  // O: Status
    if (status !== 'New' && status !== 'Active') {
      skipped++;
      continue;
    }

    const reportGender   = String(row[2]).trim() || 'Any';  // C: Gender
    const brand          = String(row[3]).trim();           // D: Brand
    const model          = String(row[4]).trim() || 'Any'; // E: Model
    const reportWidth    = String(row[5]).trim() || 'Any'; // F: Width
    const sizesAvailable = String(row[6]).trim();           // G: Sizes Available
    const retailer       = String(row[7]).trim();           // H: Retailer
    const currentPrice   = row[8];                          // I: Current Price
    const reporterName   = String(row[12]).trim();          // M: Reporter Name
    const productUrl     = String(row[15]).trim();          // P: Product URL
    const rowNumber      = i + 1;

    if (!brand || !sizesAvailable) {
      Logger.log('Row ' + rowNumber + ': Skipping - missing brand or sizes');
      skipped++;
      continue;
    }

    Logger.log('----------------------------------------');
    Logger.log('Processing row ' + rowNumber + ': ' + brand + ' ' + model + ' at ' + retailer);

    // Parse sizes - handles "8, 9, 10, 10.5" or "8,9,10,10.5"
    const sizes = sizesAvailable.split(',').map(s => s.trim()).filter(s => s !== '');
    Logger.log('Sizes: ' + sizes.join(', '));

    let rowMatchCount = 0;

    // Determine which genders and widths to check
    const gendersToCheck = reportGender === 'Any'
      ? ['male', 'female', 'unisex']
      : [reportGender];

    const widthsToCheck = reportWidth === 'Any'
      ? ['Regular', 'Wide', 'Extra Wide', 'Narrow']
      : [reportWidth];

    Logger.log('Genders: ' + gendersToCheck.join(', ') + ' | Widths: ' + widthsToCheck.join(', '));

    // Check each size against relevant genders and widths
    sizes.forEach(function(size) {
      gendersToCheck.forEach(function(gender) {
        widthsToCheck.forEach(function(width) {
          rowMatchCount += notifyUsersForShoe(
            gender,
            brand,
            model,
            'Any',
            size,
            width,
            productUrl,
            currentPrice,
            retailer,
            reporterName
          );
        });
      });
    });

    // Mark New → Active (keeps matching future requests)
    // Only change if currently "New" — leave "Active" rows as-is
    if (status === 'New') {
      reportsSheet.getRange(rowNumber, 15).setValue('Active');
      reportsSheet.getRange(rowNumber, 15).setBackground('#b3e5fc'); // Light blue
    }

    Logger.log('Row ' + rowNumber + ': ' + rowMatchCount + ' users notified | Status: ' + (status === 'New' ? 'New → Active' : 'Active (ongoing)'));
    processed++;
  }

  Logger.log('========================================');
  Logger.log('Done! Processed: ' + processed + ' | Skipped: ' + skipped);
  Logger.log('========================================');
}


// ============================================================
// SECTION 8: STOCK REPORT MANAGEMENT
// ============================================================

/**
 * Mark a stock report as Expired when shoe is no longer available
 * Call this when you check and the shoe is sold out
 * @param {number} rowNumber - Row in Stock Reports tab
 */
function expireStockReport(rowNumber) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Stock Reports not found'); return; }

  const row    = sheet.getRange(rowNumber, 1, 1, 16).getValues()[0];
  const brand  = String(row[3]).trim();
  const model  = String(row[4]).trim();
  const status = String(row[14]).trim();

  if (status === 'Expired') {
    Logger.log('Row ' + rowNumber + ' is already Expired.');
    return;
  }

  sheet.getRange(rowNumber, 15).setValue('Expired');
  sheet.getRange(rowNumber, 15).setBackground('#ffcdd2'); // Light red

  Logger.log('❌ Expired: Row ' + rowNumber + ' — ' + brand + ' ' + model + ' (was: ' + status + ')');
}


/**
 * Reactivate an expired stock report if shoe comes back in stock
 * @param {number} rowNumber - Row in Stock Reports tab
 */
function reactivateStockReport(rowNumber) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Stock Reports not found'); return; }

  const row   = sheet.getRange(rowNumber, 1, 1, 16).getValues()[0];
  const brand = String(row[3]).trim();
  const model = String(row[4]).trim();

  sheet.getRange(rowNumber, 15).setValue('New');
  sheet.getRange(rowNumber, 15).setBackground('#ffffff');

  Logger.log('✅ Reactivated: Row ' + rowNumber + ' — ' + brand + ' ' + model + ' → New');
}


// ============================================================
// SECTION 9: RE-NOTIFY FUNCTIONS
// Use when a sale didn't go through or user missed the email
// ============================================================

/**
 * ⭐ Re-notify ALL users marked as "Re-notify" in the sheet
 * Step 1: In Alert Requests sheet, change Status to "Re-notify" for rows you want to resend
 * Step 2: Run this function
 */
function processRenotifications() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const data = sheet.getDataRange().getValues();
  let count = 0;

  Logger.log('========================================');
  Logger.log('Processing re-notifications...');
  Logger.log('========================================');

  for (let i = 1; i < data.length; i++) {
    const row    = data[i];
    const status = String(row[9]).toLowerCase().trim();

    // Skip purchased rows — never re-notify someone who already bought
    if (status === 'purchased') continue;
    if (status !== 're-notify') continue;

    const gender      = String(row[1]).trim();
    const brand       = String(row[2]).trim();
    const model       = String(row[3]).trim() || 'Any';
    const size        = String(row[6]).trim();
    const width       = String(row[7] || 'Regular').trim();
    const email       = String(row[8]).trim();
    const retailer    = String(row[12]).trim() || 'Previously found retailer'; // M
    const price       = row[13];                                                // N
    const productUrl  = String(row[15]).trim();                                 // P

    const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
    const genderLabel  = genderLabels[gender] || gender;
    let sizeDesc = genderLabel + ' size ' + size;
    if (width !== 'Regular') sizeDesc += ' (' + width + ')';

    const subject  = '👟 FindMySize: Reminder — Your ' + brand + ' ' + model + ' is Still Available!';
    const htmlBody = buildRenotifyEmail({ brand, model, sizeDesc, price, retailerLink: productUrl, retailerName: retailer });

    MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody, noReply: true });

    // Update status and timestamp
    sheet.getRange(i + 1, 10).setValue('Re-notified');
    sheet.getRange(i + 1, 11).setValue(new Date());
    sheet.getRange(i + 1, 10).setBackground('#fff9c4'); // Light yellow to distinguish from first notify

    Logger.log('✓ Re-notified: ' + email + ' for ' + brand + ' ' + model + ' size ' + size);
    count++;
  }

  Logger.log('========================================');
  Logger.log('Done! ' + count + ' re-notifications sent.');
  Logger.log('========================================');
}


/**
 * Re-notify a single user by row number
 * @param {number} rowNumber - Row number in Alert Requests tab
 */
function reNotifyRow(rowNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const row = sheet.getRange(rowNumber, 1, 1, 16).getValues()[0];

  const gender      = String(row[1]).trim();
  const brand       = String(row[2]).trim();
  const model       = String(row[3]).trim() || 'Any';
  const size        = String(row[6]).trim();
  const width       = String(row[7] || 'Regular').trim();
  const email       = String(row[8]).trim();
  const retailer    = String(row[12]).trim() || 'Previously found retailer'; // M
  const price       = row[13];                                                // N
  const productUrl  = String(row[15]).trim();                                 // P

  const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
  const genderLabel  = genderLabels[gender] || gender;
  let sizeDesc = genderLabel + ' size ' + size;
  if (width !== 'Regular') sizeDesc += ' (' + width + ')';

  const subject  = '👟 FindMySize: Reminder — Your ' + brand + ' ' + model + ' is Still Available!';
  const htmlBody = buildRenotifyEmail({ brand, model, sizeDesc, price, retailerLink: productUrl, retailerName: retailer });

  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody, noReply: true });

  sheet.getRange(rowNumber, 10).setValue('Re-notified');
  sheet.getRange(rowNumber, 11).setValue(new Date());
  sheet.getRange(rowNumber, 10).setBackground('#fff9c4');

  Logger.log('✓ Re-notification sent to ' + email + ' (row ' + rowNumber + ')');
}


/**
 * Builds the re-notification email (slightly different tone - reminder)
 */
function buildRenotifyEmail(details) {
  const { brand, model, sizeDesc, price, retailerLink, retailerName } = details;
  const modelText = (model && model !== 'Any' && model !== 'Not specified') ? model : '';
  const priceText = price ? 'R' + Number(price).toLocaleString('en-ZA') : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ff9800,#f57c00); padding:35px 40px; text-align:center;">
            <h1 style="margin:0; color:white; font-size:28px; font-weight:700;">FindMySize</h1>
            <p style="margin:8px 0 0; color:rgba(255,255,255,0.95); font-size:15px;">⏰ Friendly Reminder — Still Available!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:35px 40px;">
            <p style="margin:0 0 20px; color:#333; font-size:16px; line-height:1.6;">
              Just a reminder — the shoe you've been waiting for is <strong>still available</strong>! Don't miss out this time. 🏃
            </p>

            <!-- Shoe details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0; border-radius:10px; border-left:4px solid #ff9800; margin-bottom:25px;">
              <tr><td style="padding:20px 25px;">
                <p style="margin:0 0 12px; color:#f57c00; font-weight:700; font-size:16px;">Shoe Details</p>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr><td style="color:#888; font-size:14px; width:110px;">Brand</td><td style="color:#333; font-size:14px; font-weight:600;">${brand}</td></tr>
                  ${modelText ? `<tr><td style="color:#888; font-size:14px;">Model</td><td style="color:#333; font-size:14px; font-weight:600;">${modelText}</td></tr>` : ''}
                  <tr><td style="color:#888; font-size:14px;">Size</td><td style="color:#333; font-size:14px; font-weight:600;">${sizeDesc}</td></tr>
                  ${priceText ? `<tr><td style="color:#888; font-size:14px;">Price</td><td style="color:#333; font-size:14px; font-weight:600;">${priceText}</td></tr>` : ''}
                  <tr><td style="color:#888; font-size:14px;">Retailer</td><td style="color:#333; font-size:14px; font-weight:600;">${retailerName}</td></tr>
                </table>
              </td></tr>
            </table>

            ${retailerLink && retailerLink !== 'Not provided' ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
              <tr><td align="center">
                <a href="${retailerLink}" style="display:inline-block; padding:16px 40px; background:linear-gradient(135deg,#ff9800,#f57c00); color:white; text-decoration:none; border-radius:10px; font-weight:700; font-size:16px;">
                  Buy Now →
                </a>
              </td></tr>
            </table>` : ''}

            <p style="margin:0; color:#888; font-size:13px; text-align:center; line-height:1.6;">
              ⚡ Popular sizes sell out fast — we recommend buying soon!<br>
              This is your last reminder for this shoe.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa; padding:20px 40px; border-top:1px solid #e0e0e0;">
            <p style="margin:0; color:#aaa; font-size:12px; text-align:center; line-height:1.8;">
              You received this because you signed up for alerts at <strong>FindMySize</strong>.<br>
              To unsubscribe, reply with <strong>UNSUBSCRIBE</strong>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


// ============================================================
// SECTION 9: STILL LOOKING UPDATES
// Keeps users informed when we haven't found their shoe yet
// Run this daily via a time-based trigger
// ============================================================

/**
 * ⭐ Run daily via trigger
 * Sends "still looking" emails to Pending users at 7, 30, and 60 days
 */
function sendStillLookingUpdates() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  const data = sheet.getDataRange().getValues();
  const now  = new Date();

  let day7Count  = 0;
  let day30Count = 0;
  let day60Count = 0;
  let skipped    = 0;

  Logger.log('========================================');
  Logger.log('Running Still Looking Updates...');
  Logger.log('========================================');

  for (let i = 1; i < data.length; i++) {
    const row             = data[i];
    const timestamp       = new Date(row[0]);
    const brand           = String(row[2]).trim();
    const model           = String(row[3]).trim();
    const size            = String(row[6]).trim();
    const width           = String(row[7] || 'Regular').trim();
    const email           = String(row[8]).trim();
    const status          = String(row[9]).toLowerCase().trim();
    const lastUpdateSent  = row[11] ? new Date(row[11]) : null; // L: Last Update Sent

    // Only send to Pending rows
    if (status !== 'pending') { skipped++; continue; }
    if (!email || !brand)     { skipped++; continue; }

    const daysSinceSubmit = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
    const daysSinceUpdate = lastUpdateSent
      ? Math.floor((now - lastUpdateSent) / (1000 * 60 * 60 * 24))
      : 999;

    const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
    const gender       = String(row[1]).trim();
    const genderLabel  = genderLabels[gender] || gender;
    let sizeDesc       = genderLabel + ' size ' + size;
    if (width !== 'Regular') sizeDesc += ' (' + width + ')';

    const shoeDesc = brand + (model && model !== 'Any' ? ' ' + model : '');

    let emailType = null;

    // Day 7 check — first update, never sent before
    if (daysSinceSubmit >= 7 && !lastUpdateSent) {
      emailType = 'day7';

    // Day 30 check — at least 23 days since last update
    } else if (daysSinceSubmit >= 30 && daysSinceUpdate >= 23) {
      emailType = 'day30';

    // Day 60 check — at least 28 days since last update
    } else if (daysSinceSubmit >= 60 && daysSinceUpdate >= 28) {
      emailType = 'day60';
    }

    if (!emailType) { skipped++; continue; }

    // Build and send email
    const emailContent = buildStillLookingEmail(emailType, {
      shoeDesc, sizeDesc, daysSinceSubmit, brand, model
    });

    MailApp.sendEmail({
      to:       email,
      subject:  emailContent.subject,
      htmlBody: emailContent.body,
      noReply:  true
    });

    // Update Last Update Sent (column L = 12)
    sheet.getRange(i + 1, 12).setValue(now);

    Logger.log('✉️  ' + emailType + ' sent to ' + email + ' for ' + shoeDesc + ' (' + daysSinceSubmit + ' days)');

    if (emailType === 'day7')  day7Count++;
    if (emailType === 'day30') day30Count++;
    if (emailType === 'day60') day60Count++;
  }

  Logger.log('========================================');
  Logger.log('Done! Day7: ' + day7Count + ' | Day30: ' + day30Count + ' | Day60: ' + day60Count);
  Logger.log('Skipped: ' + skipped);
  Logger.log('========================================');
}


/**
 * Builds the still-looking email based on how long we've been searching
 */
function buildStillLookingEmail(type, details) {
  const { shoeDesc, sizeDesc, daysSinceSubmit, brand, model } = details;

  const subjects = {
    day7:  '👟 FindMySize: We\'re still searching for your ' + brand + '!',
    day30: '🔍 FindMySize: ' + daysSinceSubmit + ' days searching for your ' + brand + ' — update inside',
    day60: '⏰ FindMySize: Still no luck on your ' + brand + ' — want to change your request?'
  };

  const headers = {
    day7:  { bg: 'linear-gradient(135deg,#667eea,#764ba2)', emoji: '🔍', title: 'Still Searching!',         sub: 'We haven\'t forgotten about you' },
    day30: { bg: 'linear-gradient(135deg,#ff9800,#f57c00)', emoji: '📡', title: 'Still On The Hunt!',       sub: daysSinceSubmit + ' days and counting — we\'re watching every retailer' },
    day60: { bg: 'linear-gradient(135deg,#e53935,#c62828)', emoji: '⏰', title: 'Long Time Searching...',   sub: 'Want to update or change your request?' }
  };

  const messages = {
    day7: `
      <p style="margin:0 0 15px; color:#333; font-size:16px; line-height:1.6;">
        Just a quick note to let you know we're <strong>actively watching</strong> for your shoe!
      </p>
      <p style="margin:0 0 15px; color:#555; font-size:15px; line-height:1.6;">
        We monitor <strong>10+ South African retailers</strong> including Superbalist, Sportscene,
        Totalsports, The Athletes Foot, Zando, Bash and more — every single day.
      </p>
      <p style="margin:0 0 15px; color:#555; font-size:15px; line-height:1.6;">
        The moment your size becomes available or goes on special, you'll be the
        <strong>first to know</strong>. No action needed from you — just sit tight!
      </p>`,

    day30: `
      <p style="margin:0 0 15px; color:#333; font-size:16px; line-height:1.6;">
        We've been searching for <strong>${daysSinceSubmit} days</strong> and we're still on it!
      </p>
      <p style="margin:0 0 15px; color:#555; font-size:15px; line-height:1.6;">
        Popular shoes like yours sometimes take time to restock — especially in specific sizes.
        We're watching all major SA retailers daily and will notify you the instant we find it.
      </p>
      <p style="margin:0 0 15px; color:#555; font-size:15px; line-height:1.6;">
        💡 <strong>Tip:</strong> If you'd like to broaden your search (e.g., accept any color
        or model), simply submit a new alert at
        <a href="https://findmysize.github.io/findmysize" style="color:#667eea;">FindMySize</a>
        with wider preferences.
      </p>`,

    day60: `
      <p style="margin:0 0 15px; color:#333; font-size:16px; line-height:1.6;">
        We've been searching for <strong>${daysSinceSubmit} days</strong> without luck.
        This shoe may be discontinued or very hard to find in your size.
      </p>
      <p style="margin:0 0 15px; color:#555; font-size:15px; line-height:1.6;">
        Here are some options:
      </p>
      <ul style="color:#555; font-size:15px; line-height:2;">
        <li>🔄 <strong>Update your request</strong> — try a different model or color</li>
        <li>📐 <strong>Try half a size up or down</strong> — some brands run small/large</li>
        <li>🌍 <strong>Consider international retailers</strong> — Amazon ships to SA</li>
        <li>❌ <strong>Cancel your alert</strong> — reply with REMOVE to stop alerts</li>
      </ul>
      <p style="margin:15px 0 0; color:#555; font-size:15px; line-height:1.6;">
        We'll keep searching unless you ask us to stop. No action needed if you want
        us to continue!
      </p>`
  };

  const h = headers[type];

  const body = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:${h.bg}; padding:35px 40px; text-align:center;">
            <p style="margin:0 0 8px; font-size:36px;">${h.emoji}</p>
            <h1 style="margin:0 0 8px; color:white; font-size:26px; font-weight:700;">
              ${h.title}
            </h1>
            <p style="margin:0; color:rgba(255,255,255,0.9); font-size:14px;">${h.sub}</p>
          </td>
        </tr>

        <!-- Shoe reminder box -->
        <tr>
          <td style="padding:30px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f8f9ff; border-radius:10px; border-left:4px solid #667eea;">
              <tr><td style="padding:18px 20px;">
                <p style="margin:0 0 8px; color:#667eea; font-weight:700; font-size:14px;">
                  YOUR ALERT
                </p>
                <p style="margin:0; color:#333; font-size:18px; font-weight:700;">
                  ${shoeDesc}
                </p>
                <p style="margin:4px 0 0; color:#777; font-size:14px;">${sizeDesc}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Message body -->
        <tr>
          <td style="padding:25px 40px;">
            ${messages[type]}
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 30px; text-align:center;">
            <a href="https://findmysize.github.io/findmysize/report-stock.html"
              style="display:inline-block; padding:14px 30px; background:linear-gradient(135deg,#667eea,#764ba2);
              color:white; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px; margin-right:10px;">
              Found It? Report Stock →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa; padding:20px 40px; border-top:1px solid #e0e0e0;">
            <p style="margin:0; color:#aaa; font-size:12px; text-align:center; line-height:1.8;">
              You signed up for alerts at <strong>FindMySize</strong>.<br>
              To unsubscribe reply <strong>UNSUBSCRIBE</strong> | To remove this alert reply <strong>REMOVE</strong>.<br>
              POPIA compliant — your data is never sold or shared.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: subjects[type], body };
}


// ============================================================
// SET UP DAILY TRIGGER FOR STILL LOOKING UPDATES
// Run this ONCE to set up the automatic daily check
// ============================================================

function setupDailyTrigger() {
  // Remove existing triggers first to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendStillLookingUpdates') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new daily trigger at 9am
  ScriptApp.newTrigger('sendStillLookingUpdates')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('✅ Daily trigger set! sendStillLookingUpdates() will run every day at 9am.');
}


// ============================================================
// SECTION 10: ARCHIVING SYSTEM
// Auto-archives completed and expired rows to keep main sheet clean
// ============================================================

/**
 * ⭐ MAIN ARCHIVE FUNCTION
 * Moves rows to Archive tab based on status and age:
 *   - Purchased       → archive immediately
 *   - Notified        → archive after 90 days
 *   - Re-notified     → archive after 90 days
 *   - Pending         → archive after 90 days (no match found)
 *   - Unsubscribed    → archive immediately
 *
 * Set up via setupWeeklyArchiveTrigger() — runs every Sunday at 8am
 */
function runArchive() {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const alertSheet   = ss.getSheetByName('Alert Requests');
  const archiveSheet = ss.getSheetByName('Archive') || createArchiveSheet(ss);

  if (!alertSheet) { Logger.log('ERROR: Alert Requests sheet not found'); return; }

  const data = alertSheet.getDataRange().getValues();
  const now  = new Date();

  let archived = 0;
  let skipped  = 0;

  Logger.log('========================================');
  Logger.log('Running Archive...');
  Logger.log('Checking ' + (data.length - 1) + ' rows...');
  Logger.log('========================================');

  // Loop backwards so row deletion doesn't affect index
  for (let i = data.length - 1; i >= 1; i--) {
    const row             = data[i];
    const timestamp       = new Date(row[0]);
    const brand           = String(row[2]).trim();
    const size            = String(row[6]).trim();
    const status          = String(row[9]).trim().toLowerCase();
    const notifiedAt      = row[10] ? new Date(row[10]) : null;
    const daysSinceSubmit = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
    const daysSinceNotify = notifiedAt
      ? Math.floor((now - notifiedAt) / (1000 * 60 * 60 * 24))
      : 0;

    let archiveReason = null;

    // Purchased — archive immediately
    if (status === 'purchased') {
      archiveReason = 'Purchased';

    // Unsubscribed — archive immediately
    } else if (status === 'unsubscribed') {
      archiveReason = 'Unsubscribed';

    // Notified or Re-notified — archive after 90 days since notification
    } else if ((status === 'notified' || status === 're-notified') && daysSinceNotify >= 90) {
      archiveReason = 'Notified - No purchase after 90 days';

    // Pending — archive after 90 days (no match ever found)
    } else if (status === 'pending' && daysSinceSubmit >= 90) {
      archiveReason = 'Expired - No match found after 90 days';
    }

    if (!archiveReason) { skipped++; continue; }

    // Build archive row — all 16 original columns + Archive Reason (Q)
    const archiveRow = [
      row[0],  // A: Timestamp
      row[1],  // B: Gender
      row[2],  // C: Brand
      row[3],  // D: Model
      row[4],  // E: Color
      row[5],  // F: Style Code
      row[6],  // G: Size
      row[7],  // H: Width
      row[8],  // I: Email
      row[9],  // J: Status
      row[10], // K: Notified At
      row[11], // L: Last Update Sent
      row[12], // M: Retailer Found
      row[13], // N: Price When Notified
      row[14], // O: Notes
      row[15], // P: Product URL
      archiveReason, // Q: Archive Reason
      now            // R: Archived At
    ];

    // Append to Archive tab
    archiveSheet.appendRow(archiveRow);

    // Delete from Alert Requests
    alertSheet.deleteRow(i + 1);

    Logger.log('📦 Archived: ' + brand + ' size ' + size + ' | ' + archiveReason);
    archived++;
  }

  Logger.log('========================================');
  Logger.log('Done! Archived: ' + archived + ' | Skipped: ' + skipped);
  Logger.log('========================================');
}


/**
 * Archive a single row manually by row number
 * @param {number} rowNumber - Row in Alert Requests to archive
 * @param {string} reason    - Optional reason override
 */
function archiveRow(rowNumber, reason) {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const alertSheet   = ss.getSheetByName('Alert Requests');
  const archiveSheet = ss.getSheetByName('Archive') || createArchiveSheet(ss);

  if (!alertSheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  const row    = alertSheet.getRange(rowNumber, 1, 1, 16).getValues()[0];
  const brand  = String(row[2]).trim();
  const size   = String(row[6]).trim();
  const status = String(row[9]).trim();

  const archiveReason = reason || 'Manually archived';

  archiveSheet.appendRow([
    row[0], row[1], row[2], row[3], row[4], row[5],
    row[6], row[7], row[8], row[9], row[10], row[11],
    row[12], row[13], row[14], row[15],
    archiveReason,
    new Date()
  ]);

  alertSheet.deleteRow(rowNumber);

  Logger.log('📦 Archived row ' + rowNumber + ': ' + brand + ' size ' + size + ' (' + status + ')');
}


/**
 * Creates the Archive tab with correct headers if it doesn't exist
 */
function createArchiveSheet(ss) {
  const sheet = ss.insertSheet('Archive');

  sheet.getRange(1, 1, 1, 18).setValues([[
    'Timestamp', 'Gender', 'Brand', 'Model', 'Color', 'Style Code',
    'Size', 'Width', 'Email', 'Status', 'Notified At', 'Last Update Sent',
    'Retailer Found', 'Price When Notified', 'Notes', 'Product URL',
    'Archive Reason', 'Archived At'
  ]]);

  // Style header row - dark grey
  sheet.getRange(1, 1, 1, 18)
    .setBackground('#37474f')
    .setFontColor('white')
    .setFontWeight('bold');

  sheet.setFrozenRows(1);

  Logger.log('✅ Archive tab created with headers');
  return sheet;
}


/**
 * Sets up a weekly trigger to run runArchive() every Sunday at 8am
 * Run this ONCE to activate
 */
function setupWeeklyArchiveTrigger() {
  // Remove existing archive triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runArchive') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('runArchive')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)
    .create();

  Logger.log('✅ Weekly archive trigger set! runArchive() will run every Sunday at 8am.');
}


/**
 * View archive statistics
 */
function getArchiveStats() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Archive');

  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('Archive is empty or does not exist yet.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const stats = { total: data.length - 1, byReason: {}, byBrand: {} };

  for (let i = 1; i < data.length; i++) {
    const brand  = String(data[i][2]).trim();
    const reason = String(data[i][16]).trim();
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
    stats.byBrand[brand]   = (stats.byBrand[brand]   || 0) + 1;
  }

  Logger.log('=== ARCHIVE STATISTICS ===');
  Logger.log(JSON.stringify(stats, null, 2));
}


// ============================================================
// SECTION 11: URL AVAILABILITY CHECKER
// Checks all Active Stock Report URLs daily
// Auto-expires reports where URL returns 404 (sold out)
// ============================================================

/**
 * ⭐ Run daily via trigger (added to setupDailyTrigger)
 * Checks every Active Stock Report URL
 * 404 = sold out → auto-expires the report
 * 200 = still live → leaves Active
 * Other errors → flags for manual review
 */
function checkStockReportUrls() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Stock Reports not found'); return; }

  const data = sheet.getDataRange().getValues();
  const now  = new Date();

  let checked  = 0;
  let expired  = 0;
  let live     = 0;
  let noUrl    = 0;
  let errors   = 0;

  Logger.log('========================================');
  Logger.log('Checking Stock Report URLs...');
  Logger.log('========================================');

  for (let i = 1; i < data.length; i++) {
    const row        = data[i];
    const status     = String(row[14]).trim(); // O: Status
    const productUrl = String(row[15]).trim(); // P: Product URL
    const brand      = String(row[3]).trim();
    const model      = String(row[4]).trim();
    const retailer   = String(row[7]).trim();
    const rowNumber  = i + 1;

    // Only check Active reports
    if (status !== 'Active') continue;

    // Skip if no URL provided
    if (!productUrl || productUrl === '' || productUrl === 'Not provided') {
      Logger.log('⚠️  Row ' + rowNumber + ': ' + brand + ' ' + model + ' — No URL to check');
      noUrl++;
      continue;
    }

    checked++;

    try {
      const response = UrlFetchApp.fetch(productUrl, {
        muteHttpExceptions: true,  // Don't throw on 404 — handle it ourselves
        followRedirects: true,
        headers: {
          // Mimic a real browser to reduce blocking
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseCode = response.getResponseCode();

      if (responseCode === 404) {
        // Definitely sold out or page removed
        sheet.getRange(rowNumber, 15).setValue('Expired');
        sheet.getRange(rowNumber, 15).setBackground('#ffcdd2'); // Light red
        sheet.getRange(rowNumber, 15).setNote('Auto-expired on ' + now.toDateString() + ' — URL returned 404');
        Logger.log('❌ EXPIRED Row ' + rowNumber + ': ' + brand + ' ' + model + ' @ ' + retailer + ' (404)');
        expired++;

      } else if (responseCode === 200) {
        // Still live — try to extract current price from page HTML
        const html         = response.getContentText();
        const detectedPrice = extractPriceFromHtml(html);
        const originalPrice = row[8]; // I: Current Price stored when reported

        if (detectedPrice) {
          const priceDiff = detectedPrice - Number(originalPrice);

          if (Math.abs(priceDiff) > 1) {
            // Price has changed — update the stored price and add note
            sheet.getRange(rowNumber, 9).setValue(detectedPrice); // I: Update Current Price
            const direction = priceDiff > 0 ? '📈 up' : '📉 down';
            const note = 'Last checked: ' + now.toDateString()
              + ' — Price ' + direction + ' from R' + Number(originalPrice).toFixed(2)
              + ' to R' + detectedPrice.toFixed(2);
            sheet.getRange(rowNumber, 15).setNote(note);
            Logger.log('💰 PRICE CHANGE Row ' + rowNumber + ': ' + brand + ' ' + model
              + ' — R' + Number(originalPrice).toFixed(2) + ' → R' + detectedPrice.toFixed(2)
              + ' (' + direction + ')');
          } else {
            // Price unchanged
            sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString()
              + ' — OK, price unchanged at R' + detectedPrice.toFixed(2));
            Logger.log('✅ LIVE     Row ' + rowNumber + ': ' + brand + ' ' + model
              + ' @ ' + retailer + ' — R' + detectedPrice.toFixed(2) + ' (unchanged)');
          }
        } else {
          // Couldn't extract price — page live but price not readable
          sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString()
            + ' — OK (price not readable from page — verify manually)');
          Logger.log('✅ LIVE     Row ' + rowNumber + ': ' + brand + ' ' + model
            + ' @ ' + retailer + ' — price not extractable');
        }
        live++;

      } else if (responseCode === 301 || responseCode === 302) {
        // Redirected — probably still live but URL changed
        sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString() + ' — Redirected (' + responseCode + ') — verify URL');
        Logger.log('🔀 REDIRECT Row ' + rowNumber + ': ' + brand + ' ' + model + ' @ ' + retailer + ' (' + responseCode + ')');
        live++;

      } else if (responseCode === 403 || responseCode === 429) {
        // Blocked by retailer — can't determine status
        sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString() + ' — Blocked by retailer (' + responseCode + ') — check manually');
        Logger.log('🚫 BLOCKED  Row ' + rowNumber + ': ' + brand + ' ' + model + ' @ ' + retailer + ' (' + responseCode + ') — check manually');
        errors++;

      } else {
        // Unknown response — flag for manual review
        sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString() + ' — Unexpected response (' + responseCode + ') — check manually');
        Logger.log('❓ UNKNOWN  Row ' + rowNumber + ': ' + brand + ' ' + model + ' @ ' + retailer + ' (' + responseCode + ')');
        errors++;
      }

      // Small pause to avoid hitting rate limits
      Utilities.sleep(500);

    } catch (error) {
      Logger.log('⚠️  ERROR   Row ' + rowNumber + ': ' + brand + ' ' + model + ' — ' + error.toString());
      sheet.getRange(rowNumber, 15).setNote('Last checked: ' + now.toDateString() + ' — Error: ' + error.toString());
      errors++;
    }
  }

  Logger.log('========================================');
  Logger.log('URL Check Complete:');
  Logger.log('  ✅ Live:     ' + live);
  Logger.log('  ❌ Expired:  ' + expired);
  Logger.log('  🚫 Blocked:  ' + errors);
  Logger.log('  ⚠️  No URL:   ' + noUrl);
  Logger.log('  📊 Total checked: ' + checked);
  Logger.log('========================================');
}


/**
 * Tries to extract a price from raw HTML
 * Checks common price patterns used by SA retailers
 * Returns a number or null if not found
 */
function extractPriceFromHtml(html) {
  // Patterns to try in order of reliability

  // 1. JSON-LD structured data (most reliable — used by many retailers)
  const jsonLdMatch = html.match(/"price"\s*:\s*"?([\d,]+\.?\d*)"?/);
  if (jsonLdMatch) return parseFloat(jsonLdMatch[1].replace(',', ''));

  // 2. Open Graph price meta tag
  const ogPriceMatch = html.match(/property="og:price:amount"\s+content="([\d,]+\.?\d*)"/);
  if (ogPriceMatch) return parseFloat(ogPriceMatch[1].replace(',', ''));

  // 3. Common price class patterns (Superbalist, Zando, etc.)
  const classPriceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>\s*R?\s*([\d\s,]+\.?\d*)/i);
  if (classPriceMatch) return parseFloat(classPriceMatch[1].replace(/[\s,]/g, ''));

  // 4. Schema.org price itemprop
  const itemPropMatch = html.match(/itemprop="price"\s+content="([\d,]+\.?\d*)"/);
  if (itemPropMatch) return parseFloat(itemPropMatch[1].replace(',', ''));

  // 5. Generic R price pattern (last resort — less reliable)
  const genericMatch = html.match(/R\s*([\d,]+\.?\d{2})/);
  if (genericMatch) return parseFloat(genericMatch[1].replace(',', ''));

  return null;
}


/**
 * Run this ONCE to add URL checking to the daily trigger
 * This adds checkStockReportUrls() alongside sendStillLookingUpdates()
 */
function setupDailyTrigger() {
  // Remove existing daily triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendStillLookingUpdates' ||
        trigger.getHandlerFunction() === 'checkStockReportUrls') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Still looking emails — 9am daily
  ScriptApp.newTrigger('sendStillLookingUpdates')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  // URL availability check — 10am daily (after still looking)
  ScriptApp.newTrigger('checkStockReportUrls')
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();

  Logger.log('✅ Daily triggers set:');
  Logger.log('   9am  → sendStillLookingUpdates()');
  Logger.log('   10am → checkStockReportUrls()');
}


// ============================================================
// SECTION 12: TEST FUNCTIONS
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
// STATUS FLOW:
//
// ALERT REQUESTS:
//   Pending → Notified → Re-notify → Re-notified → Re-notify → ...
//                                                        ↓
//                                                   Purchased (STOP)
//
//   Pending      = Waiting for matching stock/special
//   Notified     = First notification sent         (green)
//   Re-notify    = Set manually - send reminder    (yellow)
//   Re-notified  = Reminder sent                   (orange)
//   Purchased    = Customer bought - STOP          (dark green)
//
// STOCK REPORTS:
//   New → Active → Expired
//
//   New          = Just submitted, not yet processed  (white)
//   Active       = Verified & keeps matching new requests (blue)
//   Expired      = Sold out - stop matching           (red)
//
// KEY BEHAVIOUR:
//   Active stock reports keep notifying NEW alert requests as they come in
//   Only set to Expired when you confirm the shoe is sold out:
//     expireStockReport(rowNumber)
//   Reactivate if stock comes back:
//     reactivateStockReport(rowNumber)
//
// DAILY WORKFLOW:
//
// 1. Check "Stock Reports" tab for new rows (Status = "New")
// 2. Verify the links are real and in stock
// 3. Run: processAllNewStockReports()
//    → Matches ALL new reports to ALL pending/re-notify requests
//    → Notifies matching users by email
//    → Updates status to "Notified" (green)
//
// AFTER 3-5 DAYS (if no purchase):
// 4. Change Status to "Re-notify" for rows you want to follow up
// 5. Run: processRenotifications()
//    → Sends reminder email with orange header
//    → Updates status to "Re-notified"
//    → Skips anyone marked "Purchased"
//
// WHEN CUSTOMER BUYS:
// 6. Change Status to "Purchased" manually
//    → No more notifications ever sent to this row
//
// MANUAL (if needed):
//    notifyUsersForShoe('male', 'Nike', 'Pegasus 41', 'Any', '10', 'Regular', 'https://...', 1999, 'Superbalist')
//
// CHECK DEMAND:
//    getAlertStatistics()     ← see what shoes people want most
//    getStockReportStats()    ← see community reporting activity
//    getArchiveStats()        ← see archived row breakdown
//
// NOTIFY ONE PERSON:
//    sendNotificationEmail(5, 'https://...', 1999, 'Superbalist')  ← notify row 5
//
// ARCHIVE:
//    runArchive()             ← manually trigger archive run
//    archiveRow(5)            ← archive one specific row
//
// URL CHECKER (runs daily 10am automatically):
//    checkStockReportUrls()   ← manually check all Active URLs now
//
// ============================================================
