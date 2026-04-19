// ============================================================
// FindMySize - Extended Test Scenarios (20 Cases)
// Affiliate Specials + Auto Re-notify Until Purchased
// ============================================================
//
// HOW TO USE:
// 1. Paste this at the bottom of your Apps Script
// 2. Run in this order:
//    a) createExtendedTestRequests()   → creates 20 alert requests
//    b) createAffiliateSpecials()      → creates 10 affiliate specials
//    c) processAllNewStockReports()    → sends first notifications
//    d) simulateNoPurchase()           → marks some as Re-notify
//    e) processRenotifications()       → sends reminders
//    f) simulatePurchases()            → marks some as Purchased
//    g) verifyExtendedResults()        → confirms everything worked
//    h) cleanUpExtendedTestData()      → removes all test rows
// ============================================================


// ============================================================
// STEP 1: CREATE 20 ALERT REQUESTS
// ============================================================

function createExtendedTestRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests sheet not found'); return; }

  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Timestamp|Gender|Brand|Model|Color|StyleCode|Size|Width|Email|Status
  // |NotifiedAt|RetailerFound|PriceWhenNotified|Notes|ProductURL

  const requests = [

    // ── NIKE (4 requests) ─────────────────────────────────
    // EX1: Nike Pegasus 41 Male - matches AS1
    [now,'male','Nike','Pegasus 41','Any','FD2722-001','10','Regular',
     email,'Pending','','','','EXT-01',''],

    // EX2: Nike Pegasus 41 Female - matches AS1
    [now,'female','Nike','Pegasus 41','Pink/White','Not provided','7','Regular',
     email,'Pending','','','','EXT-02',''],

    // EX3: Nike Air Max Male - matches AS2
    [now,'male','Nike','Air Max 270','Black','Not provided','11','Regular',
     email,'Pending','','','','EXT-03',''],

    // EX4: Nike Air Max Unisex Wide - matches AS2
    [now,'unisex','Nike','Air Max 270','Any','Not provided','9','Wide',
     email,'Pending','','','','EXT-04',''],


    // ── ADIDAS (4 requests) ───────────────────────────────
    // EX5: Adidas Ultraboost Male - matches AS3
    [now,'male','Adidas','Ultraboost 23','Grey/White','Not provided','10','Regular',
     email,'Pending','','','','EXT-05',''],

    // EX6: Adidas Ultraboost Female - matches AS3
    [now,'female','Adidas','Ultraboost 23','Any','Not provided','7.5','Regular',
     email,'Pending','','','','EXT-06',''],

    // EX7: Adidas Samba Unisex - matches AS4
    [now,'unisex','Adidas','Samba OG','White/Black','Not provided','9','Regular',
     email,'Pending','','','','EXT-07',''],

    // EX8: Adidas NMD Unisex - matches AS4 (Any model)
    [now,'unisex','Adidas','NMD R1','Any','Not provided','8','Regular',
     email,'Pending','','','','EXT-08',''],


    // ── NEW BALANCE (3 requests) ──────────────────────────
    // EX9: NB 574 Unisex - matches AS5
    [now,'unisex','New Balance','574','Navy','Not provided','9','Regular',
     email,'Pending','','','','EXT-09',''],

    // EX10: NB Fresh Foam Female Wide - matches AS5
    [now,'female','New Balance','Fresh Foam 1080','White','Not provided','6','Wide',
     email,'Pending','','','','EXT-10',''],

    // EX11: NB Any Male - matches AS5 (Any model)
    [now,'male','New Balance','Any','Any','Not provided','10','Regular',
     email,'Pending','','','','EXT-11',''],


    // ── PUMA (2 requests) ─────────────────────────────────
    // EX12: Puma RS-X Female - matches AS6
    [now,'female','Puma','RS-X','Purple/White','Not provided','5','Regular',
     email,'Pending','','','','EXT-12',''],

    // EX13: Puma Suede Unisex - matches AS6
    [now,'unisex','Puma','Suede Classic','Any','Not provided','8','Regular',
     email,'Pending','','','','EXT-13',''],


    // ── ASICS (2 requests) ────────────────────────────────
    // EX14: ASICS Gel-Nimbus Male - matches AS7
    [now,'male','ASICS','Gel-Nimbus 25','Blue','Not provided','10.5','Regular',
     email,'Pending','','','','EXT-14',''],

    // EX15: ASICS Gel-Kayano Female - matches AS7
    [now,'female','ASICS','Gel-Kayano 30','Any','Not provided','6.5','Regular',
     email,'Pending','','','','EXT-15',''],


    // ── SAUCONY (2 requests) ──────────────────────────────
    // EX16: Saucony Ride Male - matches AS8
    [now,'male','Saucony','Ride 16','Black/White','Not provided','9','Regular',
     email,'Pending','','','','EXT-16',''],

    // EX17: Saucony Peregrine Female Wide - matches AS9
    [now,'female','Saucony','Peregrine 16','Trail Green','Not provided','6','Wide',
     email,'Pending','','','','EXT-17',''],


    // ── HOKA (2 requests) ─────────────────────────────────
    // EX18: Hoka Clifton Male - matches AS10
    [now,'male','Hoka','Clifton 9','White/Black','Not provided','10','Regular',
     email,'Pending','','','','EXT-18',''],

    // EX19: Hoka Bondi Female - matches AS10
    [now,'female','Hoka','Bondi 8','Any','Not provided','7','Regular',
     email,'Pending','','','','EXT-19',''],

    // EX20: Brooks Ghost - NO MATCH (intentional)
    [now,'male','Brooks','Ghost 15','Blue','Not provided','9.5','Regular',
     email,'Pending','','','','EXT-20-NO-MATCH',''],
  ];

  requests.forEach(function(row) { sheet.appendRow(row); });

  Logger.log('✅ Created 20 Alert Requests');
  Logger.log('   EXT-01 to EXT-19 should match affiliate specials');
  Logger.log('   EXT-20 should NOT match (Brooks - no special)');
}


// ============================================================
// STEP 2: CREATE 10 AFFILIATE SPECIALS
// These simulate deals found via affiliate programs
// ============================================================

function createAffiliateSpecials() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Stock Reports');
  if (!sheet) { Logger.log('ERROR: Stock Reports sheet not found'); return; }

  const now     = new Date();
  const saleEnd = '2026-04-30';

  // Timestamp|ReportType|Gender|Brand|Model|Width|SizesAvailable|Retailer
  // |CurrentPrice|OriginalPrice|SaleEndDate|Notes|ReporterName|ReporterEmail|Status|ProductURL

  const specials = [

    // AS1: Nike Pegasus 41 - 25% off via Superbalist affiliate
    [now,'special','Any','Nike','Pegasus 41','Regular',
     '6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11',
     'Superbalist', 1649, 2199, saleEnd,
     '25% OFF via affiliate link - All genders',
     'Superbalist Affiliate','',
     'New','https://superbalist.com/nike-pegasus-41?aff=FINDMYSIZE'],

    // AS2: Nike Air Max 270 - 30% off via Bash affiliate
    [now,'special','Any','Nike','Air Max 270','Any',
     '8, 9, 10, 11, 12',
     'Bash', 1399, 1999, saleEnd,
     '30% OFF - All widths, all genders',
     'Bash Affiliate','',
     'New','https://bash.com/nike-air-max-270?aff=FINDMYSIZE'],

    // AS3: Adidas Ultraboost 23 - 20% off via Sportscene affiliate
    [now,'special','Any','Adidas','Ultraboost 23','Regular',
     '6, 6.5, 7, 7.5, 8, 9, 10, 10.5',
     'Sportscene', 2079, 2599, saleEnd,
     '20% OFF via Sportscene affiliate',
     'Sportscene Affiliate','',
     'New','https://sportscene.co.za/adidas-ultraboost-23?aff=FINDMYSIZE'],

    // AS4: Adidas Any model - 15% off via Totalsports affiliate
    [now,'special','unisex','Adidas','Any','Regular',
     '7, 8, 9, 10, 11',
     'Totalsports', 999, 1199, saleEnd,
     '15% OFF all Adidas unisex - weekend special',
     'Totalsports Affiliate','',
     'New','https://totalsports.co.za/adidas-sale?aff=FINDMYSIZE'],

    // AS5: New Balance Any model - 22% off via The Athletes Foot affiliate
    [now,'special','Any','New Balance','Any','Any',
     '5, 6, 7, 8, 9, 10, 11',
     'The Athletes Foot', 1559, 1999, saleEnd,
     '22% OFF all New Balance models and widths',
     'Athletes Foot Affiliate','',
     'New','https://theathletesfoot.co.za/new-balance-sale?aff=FINDMYSIZE'],

    // AS6: Puma - 28% off via Zando affiliate
    [now,'special','Any','Puma','Any','Regular',
     '4, 5, 6, 7, 8, 9, 10',
     'Zando', 863, 1199, saleEnd,
     '28% OFF all Puma styles - limited time',
     'Zando Affiliate','',
     'New','https://zando.co.za/puma-sale?aff=FINDMYSIZE'],

    // AS7: ASICS - 18% off via Superbalist affiliate
    [now,'special','Any','ASICS','Any','Regular',
     '5, 6, 6.5, 7, 8, 9, 10, 10.5, 11',
     'Superbalist', 2459, 2999, saleEnd,
     '18% OFF ASICS Gel range',
     'Superbalist Affiliate','',
     'New','https://superbalist.com/asics-sale?aff=FINDMYSIZE'],

    // AS8: Saucony Ride - 23% off via Cape Union Mart affiliate
    [now,'special','male','Saucony','Ride 16','Regular',
     '7, 8, 9, 10, 11',
     'Cape Union Mart', 1529, 1999, saleEnd,
     '23% OFF Saucony Ride 16 mens',
     'Cape Union Mart Affiliate','',
     'New','https://capeunionmart.co.za/saucony-ride-16?aff=FINDMYSIZE'],

    // AS9: Saucony Peregrine Wide - 25% off via The Athletes Foot affiliate
    [now,'special','female','Saucony','Peregrine 16','Wide',
     '5, 5.5, 6, 6.5, 7',
     'The Athletes Foot', 1649, 2199, saleEnd,
     '25% OFF Saucony Peregrine female wide fit',
     'Athletes Foot Affiliate','',
     'New','https://theathletesfoot.co.za/saucony-peregrine-wide?aff=FINDMYSIZE'],

    // AS10: Hoka - 20% off via Bash affiliate
    [now,'special','Any','Hoka','Any','Regular',
     '6, 7, 8, 9, 10, 11',
     'Bash', 2399, 2999, saleEnd,
     '20% OFF all Hoka models - affiliate exclusive deal',
     'Bash Affiliate','',
     'New','https://bash.com/hoka-sale?aff=FINDMYSIZE'],
  ];

  specials.forEach(function(row) { sheet.appendRow(row); });

  Logger.log('✅ Created 10 Affiliate Specials in Stock Reports');
  Logger.log('Now run: processAllNewStockReports()');
}


// ============================================================
// STEP 3: SIMULATE NO PURCHASE (for re-notify testing)
// Marks some notified rows back to "Re-notify"
// In real life you would do this manually after 3-5 days
// ============================================================

function simulateNoPurchase() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  const data = sheet.getDataRange().getValues();

  // These test cases simulate customers who didn't buy first time
  const renotifyTests = ['EXT-01','EXT-03','EXT-05','EXT-07','EXT-09',
                         'EXT-12','EXT-14','EXT-16','EXT-18','EXT-19'];

  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][13]).trim();
    const status = String(data[i][9]).trim();

    if (renotifyTests.includes(notes) && status === 'Notified') {
      sheet.getRange(i + 1, 10).setValue('Re-notify');
      sheet.getRange(i + 1, 10).setBackground('#fff3cd'); // Yellow
      Logger.log('↩️  Marked for re-notify: ' + notes);
      count++;
    }
  }

  Logger.log('✅ ' + count + ' rows marked as Re-notify');
  Logger.log('Now run: processRenotifications()');
}


// ============================================================
// STEP 4: SIMULATE PURCHASES
// Marks some re-notified rows as "Purchased"
// In real life users would click the affiliate link and buy
// ============================================================

function simulatePurchases() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  const data = sheet.getDataRange().getValues();

  // These simulate customers who bought after the re-notification
  const purchasedTests = ['EXT-01','EXT-05','EXT-09','EXT-14','EXT-18'];

  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][13]).trim();
    const status = String(data[i][9]).trim();

    if (purchasedTests.includes(notes) && status === 'Re-notified') {
      sheet.getRange(i + 1, 10).setValue('Purchased');
      sheet.getRange(i + 1, 10).setBackground('#a5d6a7'); // Dark green
      Logger.log('🛒 Purchased: ' + notes);
      count++;
    }
  }

  Logger.log('✅ ' + count + ' rows marked as Purchased');
  Logger.log('These customers bought — stop notifying them!');
  Logger.log('Now run: verifyExtendedResults()');
}


// ============================================================
// STEP 5: VERIFY ALL RESULTS
// ============================================================

function verifyExtendedResults() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  const data = sheet.getDataRange().getValues();

  Logger.log('============================================');
  Logger.log('EXTENDED TEST RESULTS');
  Logger.log('============================================');

  // Expected final status for each test
  const expected = {
    'EXT-01': 'Purchased',      // Nike Pegasus M - bought after re-notify
    'EXT-02': 'Notified',       // Nike Pegasus F - notified, didn't re-notify
    'EXT-03': 'Re-notified',    // Nike Air Max M - re-notified, didn't buy
    'EXT-04': 'Notified',       // Nike Air Max U Wide - notified
    'EXT-05': 'Purchased',      // Adidas UB M - bought after re-notify
    'EXT-06': 'Notified',       // Adidas UB F - notified
    'EXT-07': 'Re-notified',    // Adidas Samba U - re-notified
    'EXT-08': 'Notified',       // Adidas NMD U - notified
    'EXT-09': 'Purchased',      // NB 574 U - bought after re-notify
    'EXT-10': 'Notified',       // NB Fresh Foam F Wide - notified
    'EXT-11': 'Notified',       // NB Any M - notified
    'EXT-12': 'Re-notified',    // Puma RS-X F - re-notified
    'EXT-13': 'Notified',       // Puma Suede U - notified
    'EXT-14': 'Purchased',      // ASICS M - bought after re-notify
    'EXT-15': 'Notified',       // ASICS F - notified
    'EXT-16': 'Re-notified',    // Saucony Ride M - re-notified
    'EXT-17': 'Notified',       // Saucony Peregrine F Wide - notified
    'EXT-18': 'Purchased',      // Hoka Clifton M - bought after re-notify
    'EXT-19': 'Re-notified',    // Hoka Bondi F - re-notified
    'EXT-20-NO-MATCH': 'Pending' // Brooks - no match, still pending
  };

  let passed = 0;
  let failed = 0;

  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][13]).trim();
    const status = String(data[i][9]).trim();

    if (!expected[notes]) continue;

    const pass = status === expected[notes];

    if (pass) {
      Logger.log('✅ PASS | ' + notes.padEnd(20) + ' | ' + status);
      passed++;
    } else {
      Logger.log('❌ FAIL | ' + notes.padEnd(20) + ' | Got: ' + status + ' | Expected: ' + expected[notes]);
      failed++;
    }
  }

  Logger.log('============================================');
  Logger.log('Results: ' + passed + ' passed | ' + failed + ' failed out of 20');
  Logger.log('');
  Logger.log('Status breakdown:');
  Logger.log('  🛒 Purchased (5):    EXT-01,05,09,14,18');
  Logger.log('  🔔 Notified (9):     EXT-02,04,06,08,10,11,13,15,17');
  Logger.log('  🔁 Re-notified (5):  EXT-03,07,12,16,19');
  Logger.log('  ⏳ Pending (1):      EXT-20 (no match)');
  Logger.log('============================================');
}


// ============================================================
// STEP 6: CLEAN UP ALL EXTENDED TEST DATA
// ============================================================

function cleanUpExtendedTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clean Alert Requests
  const alertSheet = ss.getSheetByName('Alert Requests');
  if (alertSheet) {
    const data = alertSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][13]).startsWith('EXT-')) {
        alertSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Cleaned Alert Requests');
  }

  // Clean Stock Reports
  const reportsSheet = ss.getSheetByName('Stock Reports');
  if (reportsSheet) {
    const data = reportsSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const reporter = String(data[i][12]).trim();
      if (reporter.includes('Affiliate')) {
        reportsSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Cleaned Stock Reports');
  }

  Logger.log('============================================');
  Logger.log('All extended test data removed!');
  Logger.log('============================================');
}


// ============================================================
// BONUS: RUN FULL EXTENDED TEST SUITE IN ONE GO
// ============================================================

function runFullExtendedTestSuite() {
  Logger.log('============================================');
  Logger.log('STARTING FULL EXTENDED TEST SUITE');
  Logger.log('============================================');

  Logger.log('\n--- Step 1: Creating 20 Alert Requests ---');
  createExtendedTestRequests();

  Logger.log('\n--- Step 2: Creating 10 Affiliate Specials ---');
  createAffiliateSpecials();

  Logger.log('\n--- Step 3: Processing all stock reports ---');
  processAllNewStockReports();

  Logger.log('\n--- Step 4: Simulating no-purchase (10 rows) ---');
  simulateNoPurchase();

  Logger.log('\n--- Step 5: Sending re-notifications ---');
  processRenotifications();

  Logger.log('\n--- Step 6: Simulating purchases (5 rows) ---');
  simulatePurchases();

  Logger.log('\n--- Step 7: Verifying results ---');
  verifyExtendedResults();

  Logger.log('\n============================================');
  Logger.log('✅ FULL TEST SUITE COMPLETE!');
  Logger.log('Check your inbox at findmysizealerts@gmail.com');
  Logger.log('Run cleanUpExtendedTestData() when done');
  Logger.log('============================================');
}
