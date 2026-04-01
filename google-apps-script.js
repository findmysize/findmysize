// Google Apps Script for handling form submissions
// This script connects your HTML form directly to Google Sheets
// NO HOSTING REQUIRED - Google handles everything!

// SETUP INSTRUCTIONS:
// 1. Create a Google Sheet with these column headers in Row 1:
//    Timestamp | Gender | Brand | Model | Color | Style Code | Product URL | Size | Width | Email | Status | Notified At | Retailer Found | Price When Notified | Notes
// 2. Open Extensions > Apps Script
// 3. Paste this code
// 4. Click Deploy > New Deployment
// 5. Select "Web App"
// 6. Execute as: "Me"
// 7. Who has access: "Anyone"
// 8. Copy the Web App URL and add it to your index.html

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Append the data as a new row
    sheet.appendRow([
      new Date(),           // A: Timestamp
      data.gender,          // B: Gender (male/female/unisex)
      data.brand,           // C: Brand
      data.model,           // D: Model
      data.color,           // E: Color
      data.styleCode,       // F: Style Code
      data.productUrl,      // G: Product URL
      data.size,            // H: Size
      data.width,           // I: Width (Regular/Wide/Extra Wide/Narrow)
      data.email,           // J: Email
      'pending',            // K: Status
      '',                   // L: Notified At (empty initially)
      '',                   // M: Retailer Found (empty initially)
      '',                   // N: Price When Notified (empty initially)
      ''                    // O: Notes (empty initially)
    ]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Alert request saved successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Function to send notification emails when you find shoes
function sendNotificationEmail(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getRange(rowNumber, 1, 1, 15).getValues()[0];

  const timestamp = row[0];   // A
  const gender = row[1];      // B
  const brand = row[2];       // C
  const model = row[3];       // D
  const color = row[4];       // E
  const styleCode = row[5];   // F
  const productUrl = row[6];  // G
  const size = row[7];        // H
  const width = row[8];       // I
  const email = row[9];       // J
  const status = row[10];     // K

  // Only send if status is 'pending'
  if (status === 'pending') {
    const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
    const genderLabel = genderLabels[gender] || gender;

    // Include width in size description if not Regular
    let sizeDescription = size;
    if (width && width !== 'Regular') {
      sizeDescription += ` ${width}`;
    }

    const subject = `FindMySize Alert: ${brand} ${model} ${color} (${genderLabel} ${sizeDescription}) Available!`;
    const body = `
Hi there!

Great news! The shoe you requested is now available:

Brand: ${brand}
Model: ${model}
Color: ${color}
${styleCode !== 'Not provided' ? 'Style Code: ' + styleCode : ''}
Size: ${genderLabel} ${sizeDescription}

[Add retailer link and price here]

Happy shopping!

FindMySize Team

---
To unsubscribe from alerts, reply to this email with "UNSUBSCRIBE"
    `;

    MailApp.sendEmail(email, subject, body);

    // Update status to 'notified' (Column K)
    sheet.getRange(rowNumber, 11).setValue('notified');
    // Add notified timestamp (Column L)
    sheet.getRange(rowNumber, 12).setValue(new Date());

    Logger.log(`Email sent to ${email} for ${genderLabel} ${brand} ${model} ${color} size ${sizeDescription}`);
  }
}

// Optional: Function to send email to ALL users who requested a specific shoe
function notifyUsersForShoe(gender, brand, model, color, size, width, retailerLink, price, retailerName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const genderLabels = { 'male': "Men's", 'female': "Women's", 'unisex': 'Unisex' };
  const genderLabel = genderLabels[gender] || gender;

  // Default width to Regular if not specified
  width = width || 'Regular';

  Logger.log(`Looking for: ${gender}, ${brand}, ${model}, ${color}, ${size}, ${width}`);
  let matchCount = 0;

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowGender = row[1];      // B
    const rowBrand = row[2];       // C
    const rowModel = row[3];       // D
    const rowColor = row[4];       // E
    const rowStyleCode = row[5];   // F
    const rowSize = String(row[7]); // H - Convert to string for comparison
    const rowWidth = row[8] || 'Regular'; // I - Default to Regular if empty
    const rowEmail = row[9];       // J
    const rowStatus = row[10];     // K

    Logger.log(`Row ${i + 1}: ${rowGender}, ${rowBrand}, ${rowModel}, ${rowColor}, ${rowSize}, ${rowWidth}, ${rowStatus}`);

    // Match gender, brand, size, width, color, and status
    // Model and color can be flexible (use "Any" to match all)
    if (rowGender === gender &&
        rowBrand === brand &&
        rowSize === String(size) && // Convert both to string
        rowWidth === width &&
        (rowModel === model || rowModel === 'Any') &&
        (rowColor === color || color === 'Any') &&
        rowStatus === 'pending') {

      matchCount++;

      // Include width in size description if not Regular
      let sizeDescription = size;
      if (width !== 'Regular') {
        sizeDescription += ` ${width}`;
      }

      const subject = `FindMySize Alert: ${brand} ${model} ${color} (${genderLabel} ${sizeDescription}) Available!`;
      const body = `
Hi there!

Great news! The shoe you requested is now available:

Brand: ${brand}
Model: ${model}
Color: ${color}
${rowStyleCode !== 'Not provided' ? 'Style Code: ' + rowStyleCode : ''}
Size: ${genderLabel} ${sizeDescription}
Price: R${price}

Buy now: ${retailerLink}

Happy shopping!

FindMySize Team

---
To unsubscribe from alerts, reply to this email with "UNSUBSCRIBE"
      `;

      MailApp.sendEmail(rowEmail, subject, body);

      // Update status (Column K)
      sheet.getRange(i + 1, 11).setValue('notified');
      // Add notified timestamp (Column L)
      sheet.getRange(i + 1, 12).setValue(new Date());
      // Add retailer name (Column M)
      if (retailerName) {
        sheet.getRange(i + 1, 13).setValue(retailerName);
      }
      // Add price (Column N)
      if (price) {
        sheet.getRange(i + 1, 14).setValue(price);
      }

      Logger.log(`✓ Notified ${rowEmail}`);
    }
  }

  Logger.log(`Total matches found: ${matchCount}`);
}

// Example usage:
// notifyUsersForShoe('female', 'Nike', 'Pegasus 41', 'Black/White', '8', 'Regular', 'https://takealot.com/...', 1999, 'Takealot');

// Test function - Run this from Apps Script to test notifications
function testNotification() {
  notifyUsersForShoe(
    'female',              // gender
    'Saucony',            // brand
    'Peregrine 16',       // model
    'Any',                // color (use 'Any' to match all colors)
    '5.5',                // size
    'Regular',            // width
    'https://theathletesfoot.co.za/collections/buy-ladies-trail-running-shoes-online/products/mens-peregrine-16-s11066-130?_pos=8&_fid=b59e0f171&_ss=c&variant=46960338075905',
    2599,                 // price
    'The Athletes Foot'   // retailer name
  );
}


// Optional: Get statistics about requests
function getAlertStatistics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
    const gender = data[i][1];      // B
    const brand = data[i][2];       // C
    const color = data[i][4];       // E
    const styleCode = data[i][5];   // F
    const productUrl = data[i][6];  // G
    const size = data[i][7];        // H
    const width = data[i][8];       // I
    const status = data[i][10];     // K

    // Count by gender
    stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;

    // Count by brand
    stats.byBrand[brand] = (stats.byBrand[brand] || 0) + 1;

    // Count by size
    stats.bySize[size] = (stats.bySize[size] || 0) + 1;

    // Count by width
    const widthValue = width || 'Regular';
    stats.byWidth[widthValue] = (stats.byWidth[widthValue] || 0) + 1;

    // Count by color
    stats.byColor[color] = (stats.byColor[color] || 0) + 1;

    // Count by status
    if (status === 'pending') stats.pending++;
    if (status === 'notified') stats.notified++;

    // Count how many provided style codes
    if (styleCode !== 'Not provided') stats.withStyleCode++;

    // Count how many provided product URLs
    if (productUrl !== 'Not provided') stats.withProductUrl++;
  }

  Logger.log(JSON.stringify(stats, null, 2));
  return stats;
}
