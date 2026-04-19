// ============================================================
// FindMySize - Test Data Generator
// ============================================================
// HOW TO USE:
// 1. Open Google Sheet → Extensions → Apps Script
// 2. Paste this entire file at the bottom of your script
// 3. Select "runAllTests" from the dropdown
// 4. Click Run
// 5. Check both sheets for the test data
// 6. Run processAllNewStockReports() to test matching
// 7. Run cleanUpTestData() when done to remove test rows
// ============================================================


// ============================================================
// STEP 1: CREATE ALL TEST DATA
// Run this first
// ============================================================

function runAllTests() {
  createTestAlertRequests();
  createTestStockReports();
  Logger.log('========================================');
  Logger.log('✅ All test data created!');
  Logger.log('Now run: processAllNewStockReports()');
  Logger.log('Then check your inbox for notifications');
  Logger.log('========================================');
}


// ============================================================
// STEP 2: CREATE 15 ALERT REQUESTS
// 5 Male, 5 Female, 5 Unisex
// ============================================================

function createTestAlertRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const email = 'findmysizealerts@gmail.com';
  const now = new Date();

  const requests = [

    // ── MALE (5 requests) ──────────────────────────────────
    // Timestamp | Gender | Brand | Model | Color | StyleCode | Size | Width | Email | Status | NotifiedAt | RetailerFound | PriceWhenNotified | Notes | ProductURL

    // M1: Nike Pegasus - will match Stock Report S1
    [now, 'male', 'Nike', 'Pegasus 41', 'Black/White', 'FD2722-001', '10', 'Regular',
     email, 'Pending', '', '', '', 'TEST-M1', ''],

    // M2: Adidas Ultraboost - will match Stock Report S2
    [now, 'male', 'Adidas', 'Ultraboost 22', 'Grey', 'Not provided', '9', 'Regular',
     email, 'Pending', '', '', '', 'TEST-M2', ''],

    // M3: New Balance Wide - will match Special SP3
    [now, 'male', 'New Balance', '1080v13', 'Navy', 'Not provided', '11', 'Wide',
     email, 'Pending', '', '', '', 'TEST-M3', ''],

    // M4: ASICS - will match Stock Report S4
    [now, 'male', 'ASICS', 'Gel-Kayano 30', 'Blue/Silver', 'Not provided', '10.5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-M4', ''],

    // M5: Hoka - no match (to test non-matching scenario)
    [now, 'male', 'Hoka', 'Clifton 9', 'White', 'Not provided', '9.5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-M5-NO-MATCH', ''],


    // ── FEMALE (5 requests) ────────────────────────────────

    // F1: Nike Pegasus Female - will match Stock Report S1 (same shoe, diff gender)
    [now, 'female', 'Nike', 'Pegasus 41', 'Pink/White', 'Not provided', '7', 'Regular',
     email, 'Pending', '', '', '', 'TEST-F1', ''],

    // F2: Puma - will match Special SP2
    [now, 'female', 'Puma', 'Suede Classic', 'Grey', 'Not provided', '5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-F2', ''],

    // F3: Saucony Wide - will match Special SP3
    [now, 'female', 'Saucony', 'Peregrine 16', 'Any', 'Not provided', '6', 'Wide',
     email, 'Pending', '', '', '', 'TEST-F3', ''],

    // F4: New Balance Trail - will match Stock Report S4 (Any model)
    [now, 'female', 'New Balance', 'Any', 'Purple', 'Not provided', '5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-F4', ''],

    // F5: Brooks - no match (to test non-matching scenario)
    [now, 'female', 'Brooks', 'Ghost 15', 'Coral', 'Not provided', '7.5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-F5-NO-MATCH', ''],


    // ── UNISEX (5 requests) ────────────────────────────────

    // U1: Converse - will match Stock Report S5
    [now, 'unisex', 'Converse', 'Chuck Taylor All Star', 'White', 'Not provided', '9', 'Regular',
     email, 'Pending', '', '', '', 'TEST-U1', ''],

    // U2: Nike Air Force - will match Special SP1
    [now, 'unisex', 'Nike', 'Air Force 1', 'Any', 'Not provided', '10', 'Regular',
     email, 'Pending', '', '', '', 'TEST-U2', ''],

    // U3: Vans - will match Special SP2
    [now, 'unisex', 'Vans', 'Old Skool', 'Black/White', 'Not provided', '8', 'Regular',
     email, 'Pending', '', '', '', 'TEST-U3', ''],

    // U4: Adidas Ultraboost Unisex - will match Stock Report S2
    [now, 'unisex', 'Adidas', 'Ultraboost 22', 'Any', 'Not provided', '9', 'Regular',
     email, 'Pending', '', '', '', 'TEST-U4', ''],

    // U5: Reebok - no match (to test non-matching scenario)
    [now, 'unisex', 'Reebok', 'Classic Leather', 'White', 'Not provided', '8.5', 'Regular',
     email, 'Pending', '', '', '', 'TEST-U5-NO-MATCH', ''],
  ];

  requests.forEach(function(row) { sheet.appendRow(row); });

  Logger.log('✅ Created 15 Alert Requests (5 male, 5 female, 5 unisex)');
  Logger.log('   - 12 should match stock/special reports');
  Logger.log('   - 3 should NOT match (M5, F5, U5)');
}


// ============================================================
// STEP 3: CREATE 10 STOCK/SPECIAL REPORTS
// 5 Stock Reports, 5 Specials
// ============================================================

function createTestStockReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Sheet "Stock Reports" not found.'); return; }

  const now = new Date();
  const reporter = 'TestUser';

  const reports = [

    // ── STOCK REPORTS (5) ──────────────────────────────────
    // Timestamp | ReportType | Gender | Brand | Model | Width | SizesAvailable | Retailer
    // | CurrentPrice | OriginalPrice | SaleEndDate | Notes | ReporterName | ReporterEmail | Status | ProductURL

    // S1: Nike Pegasus 41 - matches M1 (size 10) and F1 (size 7)
    [now, 'stock', 'Any', 'Nike', 'Pegasus 41', 'Regular',
     '7, 8, 9, 10, 10.5, 11',
     'Superbalist', 2199, '', '', 'Just restocked - limited stock!',
     reporter, '', 'New',
     'https://superbalist.com/nike-pegasus-41-test'],

    // S2: Adidas Ultraboost - matches M2 (size 9 Regular) and U4 (size 9 Any)
    [now, 'stock', 'Any', 'Adidas', 'Ultraboost 22', 'Regular',
     '8, 8.5, 9, 9.5, 10',
     'Sportscene', 2599, '', '', 'Back in stock across all sizes',
     reporter, '', 'New',
     'https://sportscene.co.za/adidas-ultraboost-22-test'],

    // S3: Converse - matches U1 (size 9 unisex)
    [now, 'stock', 'unisex', 'Converse', 'Chuck Taylor All Star', 'Regular',
     '7, 8, 9, 10, 11',
     'Edgars', 899, '', '', 'New colorways just arrived',
     reporter, '', 'New',
     'https://edgars.co.za/converse-chuck-taylor-test'],

    // S4: New Balance - matches M4 (size 10.5 male) and F4 (size 5 female, Any model)
    [now, 'stock', 'Any', 'New Balance', 'Any', 'Regular',
     '5, 6, 7, 8, 9, 10, 10.5, 11',
     'The Athletes Foot', 1999, '', '', 'Multiple NB models back in stock',
     reporter, '', 'New',
     'https://theathletesfoot.co.za/new-balance-test'],

    // S5: Puma - matches F2 (size 5 female)
    [now, 'stock', 'female', 'Puma', 'Suede Classic', 'Regular',
     '4, 4.5, 5, 5.5, 6, 6.5',
     'Zando', 1299, '', '', 'Grey colorway back in stock',
     reporter, '', 'New',
     'https://zando.co.za/puma-suede-classic-grey-test'],


    // ── SPECIALS (5) ───────────────────────────────────────

    // SP1: Nike Air Force 1 SALE - matches U2 (size 10 unisex)
    [now, 'special', 'unisex', 'Nike', 'Air Force 1', 'Regular',
     '8, 9, 10, 11',
     'Bash', 999, 1499, '2026-04-30', '33% OFF - Weekend special only!',
     reporter, '', 'New',
     'https://bash.com/nike-air-force-1-sale-test'],

    // SP2: Vans Old Skool SALE - matches U3 (size 8 unisex)
    [now, 'special', 'unisex', 'Vans', 'Old Skool', 'Regular',
     '7, 8, 9, 10',
     'Totalsports', 799, 1099, '2026-04-25', '27% OFF - Clearance sale',
     reporter, '', 'New',
     'https://totalsports.co.za/vans-old-skool-test'],

    // SP3: New Balance Wide SALE - matches M3 (size 11 male Wide) and F3 (size 6 female Wide)
    [now, 'special', 'Any', 'New Balance', '1080v13', 'Wide',
     '6, 7, 8, 9, 10, 11',
     'Cape Union Mart', 1899, 2799, '2026-05-01', '32% OFF - Wide fit sizes on sale',
     reporter, '', 'New',
     'https://capeunionmart.co.za/new-balance-wide-test'],

    // SP4: Saucony Peregrine SALE - matches F3 (size 6 female Wide)
    [now, 'special', 'female', 'Saucony', 'Peregrine 16', 'Wide',
     '5, 5.5, 6, 6.5, 7',
     'The Athletes Foot', 1599, 2199, '2026-04-28', '27% OFF - Trail running sale',
     reporter, '', 'New',
     'https://theathletesfoot.co.za/saucony-peregrine-16-wide-test'],

    // SP5: ASICS Gel-Kayano SALE - matches M4 (size 10.5 male)
    [now, 'special', 'male', 'ASICS', 'Gel-Kayano 30', 'Regular',
     '9, 9.5, 10, 10.5, 11',
     'Superbalist', 2499, 3299, '2026-04-30', '24% OFF - End of season sale',
     reporter, '', 'New',
     'https://superbalist.com/asics-gel-kayano-30-test'],
  ];

  reports.forEach(function(row) { sheet.appendRow(row); });

  Logger.log('✅ Created 10 Stock/Special Reports (5 stock, 5 specials)');
}


// ============================================================
// STEP 4: VERIFY EXPECTED MATCHES
// Run this AFTER processAllNewStockReports() to check results
// ============================================================

function verifyTestResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Sheet "Alert Requests" not found.'); return; }

  const data = sheet.getDataRange().getValues();

  Logger.log('========================================');
  Logger.log('TEST RESULTS VERIFICATION');
  Logger.log('========================================');

  const expected = {
    'TEST-M1':          { shouldMatch: true,  report: 'S1 - Nike Pegasus 41 @ Superbalist' },
    'TEST-M2':          { shouldMatch: true,  report: 'S2 - Adidas Ultraboost @ Sportscene' },
    'TEST-M3':          { shouldMatch: true,  report: 'SP3 - NB 1080v13 Wide SALE @ Cape Union Mart' },
    'TEST-M4':          { shouldMatch: true,  report: 'S4 + SP5 - NB Any + ASICS @ Athletes Foot/Superbalist' },
    'TEST-M5-NO-MATCH': { shouldMatch: false, report: 'None - Hoka not in any report' },
    'TEST-F1':          { shouldMatch: true,  report: 'S1 - Nike Pegasus 41 @ Superbalist' },
    'TEST-F2':          { shouldMatch: true,  report: 'S5 - Puma Suede Classic @ Zando' },
    'TEST-F3':          { shouldMatch: true,  report: 'SP3 + SP4 - NB Wide + Saucony Wide' },
    'TEST-F4':          { shouldMatch: true,  report: 'S4 - New Balance Any @ Athletes Foot' },
    'TEST-F5-NO-MATCH': { shouldMatch: false, report: 'None - Brooks not in any report' },
    'TEST-U1':          { shouldMatch: true,  report: 'S3 - Converse Chuck Taylor @ Edgars' },
    'TEST-U2':          { shouldMatch: true,  report: 'SP1 - Nike Air Force 1 SALE @ Bash' },
    'TEST-U3':          { shouldMatch: true,  report: 'SP2 - Vans Old Skool SALE @ Totalsports' },
    'TEST-U4':          { shouldMatch: true,  report: 'S2 - Adidas Ultraboost @ Sportscene' },
    'TEST-U5-NO-MATCH': { shouldMatch: false, report: 'None - Reebok not in any report' },
  };

  let passed = 0;
  let failed = 0;

  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][13]).trim();
    const status = String(data[i][9]).trim();

    if (!expected[notes]) continue;

    const test        = expected[notes];
    const wasNotified = status === 'Notified' || status === 'Re-notified';
    const pass        = test.shouldMatch ? wasNotified : !wasNotified;

    if (pass) {
      Logger.log('✅ PASS | ' + notes + ' | Status: ' + status);
      passed++;
    } else {
      Logger.log('❌ FAIL | ' + notes + ' | Status: ' + status + ' | Expected match: ' + test.shouldMatch);
      Logger.log('        Expected report: ' + test.report);
      failed++;
    }
  }

  Logger.log('========================================');
  Logger.log('Results: ' + passed + ' passed | ' + failed + ' failed');
  Logger.log('Expected: 12 matches + 3 non-matches');
  Logger.log('========================================');
}


// ============================================================
// STEP 5: CLEAN UP TEST DATA
// Run this when you are done testing
// ============================================================

function cleanUpTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clean Alert Requests
  const alertSheet = ss.getSheetByName('Alert Requests');
  if (alertSheet) {
    const alertData = alertSheet.getDataRange().getValues();
    for (let i = alertData.length - 1; i >= 1; i--) {
      const notes = String(alertData[i][13]).trim();
      if (notes.startsWith('TEST-')) {
        alertSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Cleaned up test rows from Alert Requests');
  }

  // Clean Stock Reports
  const reportsSheet = ss.getSheetByName('Stock Reports');
  if (reportsSheet) {
    const reportsData = reportsSheet.getDataRange().getValues();
    for (let i = reportsData.length - 1; i >= 1; i--) {
      const reporter = String(reportsData[i][12]).trim();
      if (reporter === 'TestUser') {
        reportsSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Cleaned up test rows from Stock Reports');
  }

  Logger.log('========================================');
  Logger.log('All test data removed. Sheets are clean!');
  Logger.log('========================================');
}
