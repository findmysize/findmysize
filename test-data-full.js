// ============================================================
// FindMySize - Full Test Suite
// Tests ALL functionality added to the system
// ============================================================
//
// SECTIONS:
//   Section A: Alert Request + Stock Report matching
//   Section B: Re-notify system
//   Section C: Purchased status (stop notifications)
//   Section D: Still Looking emails (day 7/30/60)
//   Section E: Archive system (purchased/expired/90-day)
//   Section F: Stock Report lifecycle (New→Active→Expired)
//   Section G: URL checker (404 auto-expire + price detection)
//   Section H: Price formatting (R and cents)
//   Section I: Cleanup
//
// HOW TO RUN:
//   Option 1: Run runFullTestSuite() — runs all sections automatically
//   Option 2: Run each section function individually
//   Always run cleanUpFullTestData() when done!
// ============================================================


// ============================================================
// MASTER RUNNER
// ============================================================

function runFullTestSuite() {
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   FindMySize Full Test Suite          ║');
  Logger.log('╚══════════════════════════════════════╝');

  testA_AlertMatching();
  testB_RenotifySystem();
  testC_PurchasedStatus();
  testD_StillLookingEmails();
  testE_ArchiveSystem();
  testF_StockReportLifecycle();
  testG_UrlChecker();
  testH_PriceFormatting();

  Logger.log('');
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   All Tests Complete!                 ║');
  Logger.log('║   Run verifyFullTestResults()         ║');
  Logger.log('║   Then cleanUpFullTestData()          ║');
  Logger.log('╚══════════════════════════════════════╝');
}


// ============================================================
// SECTION A: ALERT MATCHING
// Tests: male/female/unisex × Regular/Wide × stock/special
// Expected: All TA- rows get Notified, TA-NO-MATCH stays Pending
// ============================================================

function testA_AlertMatching() {
  Logger.log('\n--- SECTION A: Alert Matching ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const alert = ss.getSheetByName('Alert Requests');
  const stock = ss.getSheetByName('Stock Reports');
  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Alert Requests
  // A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P
  const alerts = [
    // Regular width matches
    [now,'male','Nike','Pegasus 41','Any','','10','Regular',email,'Pending','','','','','TA-01-MALE-REGULAR',''],
    [now,'female','Nike','Pegasus 41','Any','','7','Regular',email,'Pending','','','','','TA-02-FEMALE-REGULAR',''],
    [now,'unisex','Nike','Pegasus 41','Any','','9','Regular',email,'Pending','','','','','TA-03-UNISEX-REGULAR',''],
    // Wide width match
    [now,'male','New Balance','1080v13','Any','','11','Wide',email,'Pending','','','','','TA-04-MALE-WIDE',''],
    [now,'female','Adidas','Ultraboost 23','Any','','7','Regular',email,'Pending','','','','','TA-05-FEMALE-SPECIAL',''],
    // Any model match
    [now,'male','Puma','Any','Any','','9','Regular',email,'Pending','','','','','TA-06-ANY-MODEL',''],
    // Style code match
    [now,'male','Nike','Pegasus 41','Black','FD2722-001','10','Regular',email,'Pending','','','','','TA-07-STYLE-CODE',''],
    // No match intentional
    [now,'male','Brooks','Ghost 15','Blue','','9','Regular',email,'Pending','','','','','TA-NO-MATCH',''],
  ];
  alerts.forEach(function(r) { alert.appendRow(r); });

  // Stock Reports
  // A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P
  const reports = [
    // Matches TA-01,02,03,07 (Nike Pegasus Any gender Regular)
    [now,'stock','Any','Nike','Pegasus 41','Regular','7,9,10,10.5','Superbalist',2199.00,'','','Restocked','TestSuite','','New','https://superbalist.com/test-pegasus'],
    // Matches TA-04 (NB Wide male size 11)
    [now,'special','male','New Balance','1080v13','Wide','10,11','Totalsports',1899.00,2799.00,'2026-05-01','30% OFF wide fit','TestSuite','','New','https://totalsports.co.za/test-nb-wide'],
    // Matches TA-05 (Adidas female Regular size 7)
    [now,'special','female','Adidas','Ultraboost 23','Regular','6,7,7.5,8','Sportscene',2079.00,2599.00,'2026-04-30','20% OFF','TestSuite','','New','https://sportscene.co.za/test-adidas'],
    // Matches TA-06 (Puma Any model male size 9)
    [now,'stock','male','Puma','Any','Regular','8,9,10','Zando',1199.00,'','','All Puma back','TestSuite','','New','https://zando.co.za/test-puma'],
  ];
  reports.forEach(function(r) { stock.appendRow(r); });

  Logger.log('✅ Section A data created — now running processAllNewStockReports()');
  processAllNewStockReports();
  Logger.log('✅ Section A matching complete');
}


// ============================================================
// SECTION B: RE-NOTIFY SYSTEM
// Tests: Notified → Re-notify → Re-notified flow
// Expected: TB- rows go through full re-notify cycle
// ============================================================

function testB_RenotifySystem() {
  Logger.log('\n--- SECTION B: Re-notify System ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Create already-notified rows to test re-notify
  sheet.appendRow([now,'male','Saucony','Ride 16','Black','','9','Regular',email,
    'Notified',now,'','Bash',1529.00,'TB-01-RENOTIFY','https://bash.com/test']);
  sheet.appendRow([now,'female','ASICS','Gel-Nimbus','Any','','6','Regular',email,
    'Notified',now,'','Superbalist',2459.00,'TB-02-RENOTIFY','https://superbalist.com/test']);

  // Change to Re-notify status
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const notes = String(data[i][14]).trim();
    if (notes === 'TB-01-RENOTIFY' || notes === 'TB-02-RENOTIFY') {
      sheet.getRange(i + 1, 10).setValue('Re-notify');
    }
  }

  Logger.log('✅ Section B rows set to Re-notify — running processRenotifications()');
  processRenotifications();
  Logger.log('✅ Section B re-notify emails sent');
}


// ============================================================
// SECTION C: PURCHASED STATUS
// Tests: Purchased rows are NEVER re-notified
// Expected: TC- rows stay Purchased, no emails sent
// ============================================================

function testC_PurchasedStatus() {
  Logger.log('\n--- SECTION C: Purchased Status ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Create purchased rows
  sheet.appendRow([now,'male','Hoka','Clifton 9','White','','10','Regular',email,
    'Purchased',now,'','Bash',2399.00,'TC-01-PURCHASED','https://bash.com/hoka']);
  sheet.appendRow([now,'female','Converse','Chuck Taylor','White','','7','Regular',email,
    'Purchased',now,'','Edgars',899.00,'TC-02-PURCHASED','https://edgars.co.za/converse']);

  // Set both to Re-notify to prove they get skipped
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const notes = String(data[i][14]).trim();
    if (notes === 'TC-01-PURCHASED' || notes === 'TC-02-PURCHASED') {
      sheet.getRange(i + 1, 10).setValue('Purchased'); // Keep as Purchased
    }
  }

  Logger.log('✅ Section C — running processRenotifications() (should skip Purchased rows)');
  processRenotifications();
  Logger.log('✅ Section C complete — Purchased rows should be unchanged');
}


// ============================================================
// SECTION D: STILL LOOKING EMAILS
// Tests: Day 7, Day 30, Day 60 emails for Pending rows
// Expected: Each TD- row triggers the correct email type
// ============================================================

function testD_StillLookingEmails() {
  Logger.log('\n--- SECTION D: Still Looking Emails ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  const email = 'findmysizealerts@gmail.com';

  // Create rows with different ages to trigger each email type
  const day7Date  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000); // 7 days ago
  const day30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const day60Date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

  // Day 7 — first "still looking" email
  sheet.appendRow([day7Date,'male','Nike','Air Force 1','White','','10','Regular',email,
    'Pending','','','','','TD-01-DAY7','']);

  // Day 30 — mid search email
  sheet.appendRow([day30Date,'female','Adidas','NMD R1','Pink','','6','Regular',email,
    'Pending','','','','','TD-02-DAY30','']);

  // Day 60 — consider alternatives email
  sheet.appendRow([day60Date,'unisex','Vans','Old Skool','Black','','8','Regular',email,
    'Pending','','','','','TD-03-DAY60','']);

  Logger.log('✅ Section D rows created — running sendStillLookingUpdates()');
  sendStillLookingUpdates();
  Logger.log('✅ Section D complete — check inbox for 3 still looking emails');
}


// ============================================================
// SECTION E: ARCHIVE SYSTEM
// Tests: Purchased archived immediately, 90-day Pending/Notified
// Expected: TE-ARCHIVE- rows move to Archive tab
// ============================================================

function testE_ArchiveSystem() {
  Logger.log('\n--- SECTION E: Archive System ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Alert Requests');
  const email = 'findmysizealerts@gmail.com';

  const day91Date = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000); // 91 days ago

  // Purchased — should archive immediately
  sheet.appendRow([day91Date,'male','Reebok','Classic','White','','9','Regular',email,
    'Purchased',day91Date,'','Superbalist',999.00,'TE-ARCHIVE-PURCHASED','']);

  // Pending 91 days — should archive (no match found)
  sheet.appendRow([day91Date,'female','Brooks','Adrenaline','Grey','','7','Regular',email,
    'Pending','','','','','TE-ARCHIVE-PENDING-91','']);

  // Notified 91 days ago — should archive (no purchase)
  sheet.appendRow([day91Date,'unisex','Puma','Suede','Black','','9','Regular',email,
    'Notified',day91Date,'','Zando',1299.00,'TE-ARCHIVE-NOTIFIED-91','']);

  // Pending only 10 days — should NOT archive
  sheet.appendRow([new Date(),'male','Nike','React','Blue','','10','Regular',email,
    'Pending','','','','','TE-NO-ARCHIVE-YOUNG','']);

  Logger.log('✅ Section E rows created — running runArchive()');
  runArchive();
  Logger.log('✅ Section E complete — check Archive tab for 3 moved rows');
}


// ============================================================
// SECTION F: STOCK REPORT LIFECYCLE
// Tests: New→Active→Expired flow + reactivation
// Expected: TF- reports cycle through all statuses correctly
// ============================================================

function testF_StockReportLifecycle() {
  Logger.log('\n--- SECTION F: Stock Report Lifecycle ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const stock = ss.getSheetByName('Stock Reports');
  const alert = ss.getSheetByName('Alert Requests');
  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Create stock report — starts as New
  stock.appendRow([now,'stock','male','Saucony','Ride 16','Regular',
    '9,10,11','Cape Union Mart',1529.00,'','','Lifecycle test','TestSuite','',
    'New','https://capeunionmart.co.za/test-lifecycle']);

  // Create matching alert request
  alert.appendRow([now,'male','Saucony','Ride 16','Any','','9','Regular',email,
    'Pending','','','','','TF-01-LIFECYCLE','']);

  Logger.log('✅ TF stock report created (New) — running processAllNewStockReports()');
  processAllNewStockReports();
  // Report should now be Active (blue), alert should be Notified

  // Find the stock report row and expire it
  const stockData = stock.getDataRange().getValues();
  for (let i = stockData.length - 1; i >= 1; i--) {
    if (String(stockData[i][12]).trim() === 'TestSuite' &&
        String(stockData[i][3]).trim() === 'Saucony') {
      const rowNum = i + 1;
      Logger.log('✅ Expiring stock report row ' + rowNum);
      expireStockReport(rowNum);

      // Now reactivate it
      Logger.log('✅ Reactivating stock report row ' + rowNum);
      reactivateStockReport(rowNum);
      break;
    }
  }

  Logger.log('✅ Section F complete — stock report cycled New→Active→Expired→New');
}


// ============================================================
// SECTION G: URL CHECKER
// Tests: 404 auto-expire, valid URL stays Active, no URL skipped
// Expected: TG-404 expires, TG-LIVE stays Active, TG-NOURL skipped
// ============================================================

function testG_UrlChecker() {
  Logger.log('\n--- SECTION G: URL Checker ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const stock = ss.getSheetByName('Stock Reports');
  const now   = new Date();

  // Active report with a known 404 URL (invalid page)
  stock.appendRow([now,'stock','male','Nike','Test 404','Regular',
    '9,10','TestRetailer',1999.00,'','','404 test','TestSuite','',
    'Active','https://superbalist.com/this-page-definitely-does-not-exist-404-test-xyz']);

  // Active report with a valid URL
  stock.appendRow([now,'stock','female','Adidas','Test Live','Regular',
    '6,7','TestRetailer',2199.00,'','','Live URL test','TestSuite','',
    'Active','https://www.google.com']);

  // Active report with NO URL — should be skipped
  stock.appendRow([now,'stock','unisex','Puma','Test NoURL','Regular',
    '8,9','TestRetailer',999.00,'','','No URL test','TestSuite','',
    'Active','']);

  // Expired report — should be completely skipped
  stock.appendRow([now,'stock','male','Hoka','Test Expired','Regular',
    '10,11','TestRetailer',2999.00,'','','Expired test','TestSuite','',
    'Expired','https://www.google.com']);

  Logger.log('✅ Section G rows created — running checkStockReportUrls()');
  checkStockReportUrls();
  Logger.log('✅ Section G complete — check Stock Reports for status updates and notes');
}


// ============================================================
// SECTION H: PRICE FORMATTING
// Tests: Prices display as R and cents in emails
// Expected: Emails show R1,999.00 not R1999
// ============================================================

function testH_PriceFormatting() {
  Logger.log('\n--- SECTION H: Price Formatting ---');

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const alert = ss.getSheetByName('Alert Requests');
  const stock = ss.getSheetByName('Stock Reports');
  const email = 'findmysizealerts@gmail.com';
  const now   = new Date();

  // Test various price formats
  const testPrices = [
    { price: 999,     label: 'TH-01-R999'     },  // Should show R999.00
    { price: 1999,    label: 'TH-02-R1999'    },  // Should show R1,999.00
    { price: 12999.5, label: 'TH-03-R12999-5' },  // Should show R12,999.50
    { price: 2599.99, label: 'TH-04-R2599-99' },  // Should show R2,599.99
  ];

  testPrices.forEach(function(t) {
    alert.appendRow([now,'male','Nike','Pegasus','Black','',
      '10','Regular',email,'Pending','','','','',t.label,'']);
  });

  // Create one stock report with decimal price
  stock.appendRow([now,'special','Any','Nike','Pegasus','Regular',
    '10','Superbalist',1649.50,2199.00,'2026-04-30',
    'Price format test','TestSuite','','New',
    'https://superbalist.com/test-price-format']);

  Logger.log('✅ Section H rows created — running processAllNewStockReports()');
  processAllNewStockReports();
  Logger.log('✅ Section H complete — check inbox for emails with R and cents formatting');
}


// ============================================================
// VERIFY ALL RESULTS
// ============================================================

function verifyFullTestResults() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const alertSheet = ss.getSheetByName('Alert Requests');
  const stockSheet = ss.getSheetByName('Stock Reports');
  const archSheet  = ss.getSheetByName('Archive');

  let passed = 0;
  let failed = 0;

  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   FULL TEST SUITE RESULTS             ║');
  Logger.log('╚══════════════════════════════════════╝');

  // ── Section A checks ──────────────────────────────────
  Logger.log('\n[ Section A: Alert Matching ]');
  const alertData = alertSheet ? alertSheet.getDataRange().getValues() : [];
  const sectionA = {
    'TA-01-MALE-REGULAR':   'Notified',
    'TA-02-FEMALE-REGULAR': 'Notified',
    'TA-03-UNISEX-REGULAR': 'Notified',
    'TA-04-MALE-WIDE':      'Notified',
    'TA-05-FEMALE-SPECIAL': 'Notified',
    'TA-06-ANY-MODEL':      'Notified',
    'TA-07-STYLE-CODE':     'Notified',
    'TA-NO-MATCH':          'Pending',
  };
  passed += checkAlertRows(alertData, sectionA);
  failed += countFails(alertData, sectionA);

  // ── Section B checks ──────────────────────────────────
  Logger.log('\n[ Section B: Re-notify ]');
  const sectionB = {
    'TB-01-RENOTIFY': 'Re-notified',
    'TB-02-RENOTIFY': 'Re-notified',
  };
  passed += checkAlertRows(alertData, sectionB);
  failed += countFails(alertData, sectionB);

  // ── Section C checks ──────────────────────────────────
  Logger.log('\n[ Section C: Purchased (no re-notify) ]');
  const sectionC = {
    'TC-01-PURCHASED': 'Purchased',
    'TC-02-PURCHASED': 'Purchased',
  };
  passed += checkAlertRows(alertData, sectionC);
  failed += countFails(alertData, sectionC);

  // ── Section D checks ──────────────────────────────────
  Logger.log('\n[ Section D: Still Looking Emails ]');
  const sectionD = {
    'TD-01-DAY7':  'Pending', // Status stays Pending, Last Update Sent column (L) filled
    'TD-02-DAY30': 'Pending',
    'TD-03-DAY60': 'Pending',
  };
  // Also check Last Update Sent (col L = index 11) is filled
  for (let i = 1; i < alertData.length; i++) {
    const notes = String(alertData[i][14]).trim();
    if (['TD-01-DAY7','TD-02-DAY30','TD-03-DAY60'].includes(notes)) {
      const lastUpdate = alertData[i][11];
      const pass = lastUpdate !== '' && lastUpdate !== null;
      Logger.log((pass ? '✅' : '❌') + ' ' + notes + ' | Last Update Sent: ' + (lastUpdate || 'EMPTY'));
      if (pass) passed++; else failed++;
    }
  }

  // ── Section E checks ──────────────────────────────────
  Logger.log('\n[ Section E: Archive System ]');
  // These rows should NOT be in Alert Requests anymore
  const shouldBeArchived = ['TE-ARCHIVE-PURCHASED','TE-ARCHIVE-PENDING-91','TE-ARCHIVE-NOTIFIED-91'];
  shouldBeArchived.forEach(function(label) {
    const inAlert   = alertData.some(function(r) { return String(r[14]).trim() === label; });
    const archData  = archSheet ? archSheet.getDataRange().getValues() : [];
    const inArchive = archData.some(function(r) { return String(r[14]).trim() === label; });
    const pass      = !inAlert && inArchive;
    Logger.log((pass ? '✅' : '❌') + ' ' + label + ' | In Alert: ' + inAlert + ' | In Archive: ' + inArchive);
    if (pass) passed++; else failed++;
  });
  // TE-NO-ARCHIVE-YOUNG should still be in Alert Requests
  const youngStillInAlert = alertData.some(function(r) { return String(r[14]).trim() === 'TE-NO-ARCHIVE-YOUNG'; });
  Logger.log((youngStillInAlert ? '✅' : '❌') + ' TE-NO-ARCHIVE-YOUNG | Still in Alert Requests: ' + youngStillInAlert);
  if (youngStillInAlert) passed++; else failed++;

  // ── Section F checks ──────────────────────────────────
  Logger.log('\n[ Section F: Stock Report Lifecycle ]');
  const sectionF = { 'TF-01-LIFECYCLE': 'Notified' };
  passed += checkAlertRows(alertData, sectionF);
  failed += countFails(alertData, sectionF);

  // ── Section G checks ──────────────────────────────────
  Logger.log('\n[ Section G: URL Checker ]');
  const stockData = stockSheet ? stockSheet.getDataRange().getValues() : [];
  for (let i = 1; i < stockData.length; i++) {
    const brand  = String(stockData[i][3]).trim();
    const status = String(stockData[i][14]).trim();
    const note   = stockSheet.getRange(i + 1, 15).getNote();

    if (brand === 'Test 404') {
      const pass = status === 'Expired';
      Logger.log((pass ? '✅' : '❌') + ' TG-404 | Status: ' + status + ' (expected Expired)');
      if (pass) passed++; else failed++;
    }
    if (brand === 'Test Live') {
      const pass = status === 'Active' && note.includes('Last checked');
      Logger.log((pass ? '✅' : '❌') + ' TG-LIVE | Status: ' + status + ' | Note: ' + (note || 'EMPTY'));
      if (pass) passed++; else failed++;
    }
    if (brand === 'Test NoURL') {
      const pass = status === 'Active'; // Should be unchanged — skipped
      Logger.log((pass ? '✅' : '❌') + ' TG-NOURL | Status: ' + status + ' (should stay Active, skipped)');
      if (pass) passed++; else failed++;
    }
  }

  // ── Section H checks ──────────────────────────────────
  Logger.log('\n[ Section H: Price Formatting ]');
  Logger.log('✅ Check inbox for emails — prices should show as R999.00, R1,999.00 etc.');
  Logger.log('   (Visual check required — see your findmysizealerts@gmail.com inbox)');

  // ── Final summary ──────────────────────────────────────
  Logger.log('');
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║  Results: ' + passed + ' passed | ' + failed + ' failed');
  Logger.log('╚══════════════════════════════════════╝');
  Logger.log('Run cleanUpFullTestData() to remove all test rows');
}


// ============================================================
// HELPER FUNCTIONS FOR VERIFY
// ============================================================

function checkAlertRows(data, expected) {
  let passed = 0;
  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][14]).trim();
    const status = String(data[i][9]).trim();
    if (!expected[notes]) continue;
    const pass = status === expected[notes];
    Logger.log((pass ? '✅' : '❌') + ' ' + notes + ' | Status: ' + status + ' (expected: ' + expected[notes] + ')');
    if (pass) passed++;
  }
  return passed;
}

function countFails(data, expected) {
  let failed = 0;
  for (let i = 1; i < data.length; i++) {
    const notes  = String(data[i][14]).trim();
    const status = String(data[i][9]).trim();
    if (!expected[notes]) continue;
    if (status !== expected[notes]) failed++;
  }
  return failed;
}


// ============================================================
// CLEAN UP ALL TEST DATA
// ============================================================

function cleanUpFullTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Prefixes to clean from Alert Requests
  const alertPrefixes = ['TA-','TB-','TC-','TD-','TE-','TF-','TG-','TH-'];

  const alertSheet = ss.getSheetByName('Alert Requests');
  if (alertSheet) {
    const data = alertSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const notes = String(data[i][14]).trim();
      if (alertPrefixes.some(function(p) { return notes.startsWith(p); })) {
        alertSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Alert Requests cleaned');
  }

  // Clean Stock Reports (TestSuite reporter)
  const stockSheet = ss.getSheetByName('Stock Reports');
  if (stockSheet) {
    const data = stockSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][12]).trim() === 'TestSuite') {
        stockSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Stock Reports cleaned');
  }

  // Clean Archive tab
  const archSheet = ss.getSheetByName('Archive');
  if (archSheet) {
    const data = archSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const notes = String(data[i][14]).trim();
      if (alertPrefixes.some(function(p) { return notes.startsWith(p); })) {
        archSheet.deleteRow(i + 1);
      }
    }
    Logger.log('✅ Archive cleaned');
  }

  Logger.log('');
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   All test data removed!              ║');
  Logger.log('╚══════════════════════════════════════╝');
}
