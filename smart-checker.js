// ============================================================
// FindMySize - Smart Deal Finder
// Replaces broad scraper with 3 targeted methods
// ============================================================
//
// METHOD 1: Targeted URL Checker
//   Checks product URLs submitted by users in their alert requests
//   Detects price drops and stock availability on specific products
//
// METHOD 2: Google Alerts Email Parser
//   Reads Gmail for Google Alert emails about shoes
//   Auto-creates Stock Reports from deals found in alerts
//
// METHOD 3: Shopify Product Feed Checker
//   Reads /products.json from Shopify-based retailers
//   Clean JSON — no JavaScript rendering needed
//   Matches against pending Alert Requests
//
// SETUP:
//   1. Paste this at bottom of your Apps Script
//   2. Run setupSmartCheckerTrigger() ONCE
//   3. Set up Google Alerts (see instructions below)
//   4. Run testSmartChecker() to verify everything works
//
// GOOGLE ALERTS TO SET UP (google.com/alerts):
//   Search: "Nike Pegasus" sale South Africa
//   Search: "Adidas Ultraboost" special South Africa
//   Search: running shoes sale "South Africa" -pinterest
//   Search: sneakers sale site:zando.co.za
//   Search: sneakers sale site:bash.com
//   Search: sneakers sale site:totalsports.co.za
//   Deliver to: findmysizealerts@gmail.com
//   Frequency: As it happens
// ============================================================


// ============================================================
// SHOPIFY STORES — clean JSON feeds, very reliable
// ============================================================

var SHOPIFY_STORES = [
  {
    name:        'The Athletes Foot',
    domain:      'https://www.theathletesfoot.co.za',
    feedUrl:     'https://www.theathletesfoot.co.za/products.json?limit=250',
    saleTag:     'sale'
  },
  {
    name:        'Edgars',
    domain:      'https://www.edgars.co.za',
    feedUrl:     'https://www.edgars.co.za/products.json?limit=250',
    saleTag:     'sale'
  },
  {
    name:        'Kloppers Sport',
    domain:      'https://klopperssport.co.za',
    feedUrl:     'https://klopperssport.co.za/products.json?limit=250',
    saleTag:     'sale'
  }
];


// ============================================================
// MASTER RUNNER — runs all 3 methods
// Called daily via trigger
// ============================================================

function runSmartChecker() {
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   FindMySize Smart Deal Finder        ║');
  Logger.log('║   ' + new Date().toDateString());
  Logger.log('╚══════════════════════════════════════╝');

  Logger.log('\n[ Method 1: Checking user-submitted product URLs ]');
  checkUserProductUrls();

  Logger.log('\n[ Method 2: Processing Google Alert emails ]');
  processGoogleAlertEmails();

  Logger.log('\n[ Method 3: Checking Shopify product feeds ]');
  checkShopifyFeeds();

  Logger.log('\n╔══════════════════════════════════════╗');
  Logger.log('║   Smart Checker Complete!             ║');
  Logger.log('╚══════════════════════════════════════╝');
}


// ============================================================
// METHOD 1: TARGETED USER URL CHECKER
// Checks product URLs that users submitted in their requests
// ============================================================

function checkUserProductUrls() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Alert Requests');
  if (!sheet) { Logger.log('ERROR: Alert Requests not found'); return; }

  var data    = sheet.getDataRange().getValues();
  var now     = new Date();
  var checked = 0;
  var found   = 0;

  for (var i = 1; i < data.length; i++) {
    var row        = data[i];
    var status     = String(row[9]).trim().toLowerCase();
    var productUrl = String(row[15]).trim();
    var email      = String(row[8]).trim();
    var brand      = String(row[2]).trim();
    var model      = String(row[3]).trim();
    var size       = String(row[6]).trim();
    var width      = String(row[7]).trim();
    var gender     = String(row[1]).trim();
    var storedPrice= row[13]; // N: Price When Notified (reuse as last known price)

    // Only check pending rows with a product URL
    if (status !== 'pending') continue;
    if (!productUrl || productUrl === '' || productUrl === 'Not provided') continue;

    checked++;

    try {
      Utilities.sleep(500);
      var response = UrlFetchApp.fetch(productUrl, {
        muteHttpExceptions: true,
        followRedirects:    true,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      var code = response.getResponseCode();

      if (code === 404) {
        // Product gone — mark URL as dead in notes
        sheet.getRange(i + 1, 15).setValue('URL 404 - ' + now.toDateString());
        Logger.log('  ❌ 404 — product removed: ' + brand + ' ' + model);
        continue;
      }

      if (code !== 200) continue;

      var html          = response.getContentText();
      var detectedPrice = extractPriceFromHtml(html);
      var inStock       = checkInStock(html);

      if (inStock && detectedPrice) {
        var priceChanged = storedPrice && Math.abs(detectedPrice - Number(storedPrice)) > 1;
        var isLower      = priceChanged && detectedPrice < Number(storedPrice);

        Logger.log('  ✅ In stock: ' + brand + ' ' + model + ' @ R' + detectedPrice.toFixed(2)
          + (priceChanged ? (isLower ? ' 📉 PRICE DROP!' : ' 📈 price up') : ' (unchanged)'));

        // Auto-create a Stock Report so processAllNewStockReports() handles notification
        var stockSheet = ss.getSheetByName('Stock Reports');
        if (stockSheet && !isDuplicateStockReport(stockSheet, brand, model, 'URL Check')) {
          stockSheet.appendRow([
            now,
            isLower ? 'special' : 'stock',   // B: Report Type
            gender,                           // C: Gender
            brand,                            // D: Brand
            model,                            // E: Model
            width || 'Regular',               // F: Width
            size,                             // G: Sizes (user's size)
            extractRetailerName(productUrl),  // H: Retailer
            detectedPrice,                    // I: Current Price
            storedPrice || '',                // J: Original Price
            '',                               // K: Sale End Date
            isLower ? 'Price dropped — found via user URL check' : 'In stock — found via user URL check',
            'FindMySize URL Checker',          // M: Reporter
            '',                               // N: Reporter Email
            'New',                            // O: Status
            productUrl                        // P: Product URL
          ]);
          found++;
          Logger.log('    → Stock Report created');
        }
      } else if (!inStock) {
        Logger.log('  ⏳ Not in stock yet: ' + brand + ' ' + model);
      } else {
        Logger.log('  ⚠️  Page live but could not read price/stock: ' + brand + ' ' + model);
      }

    } catch(e) {
      Logger.log('  💥 Error checking ' + productUrl + ': ' + e.message);
    }
  }

  Logger.log('  Checked: ' + checked + ' URLs | Stock Reports created: ' + found);

  if (found > 0) {
    Logger.log('  🔔 Running processAllNewStockReports()...');
    processAllNewStockReports();
  }
}


// ============================================================
// METHOD 2: GOOGLE ALERTS EMAIL PARSER
// Reads Gmail for Google Alert emails and extracts shoe deals
// ============================================================

function processGoogleAlertEmails() {
  var threads = GmailApp.search('from:googlealerts-noreply@google.com is:unread', 0, 20);

  if (threads.length === 0) {
    Logger.log('  No new Google Alert emails found');
    return;
  }

  Logger.log('  Found ' + threads.length + ' Google Alert email(s)');

  var ss         = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName('Stock Reports');
  var now        = new Date();
  var found      = 0;

  threads.forEach(function(thread) {
    var messages = thread.getMessages();

    messages.forEach(function(message) {
      if (message.isUnread()) {
        var subject = message.getSubject();
        var body    = message.getPlainBody();
        var html    = message.getBody();

        Logger.log('  📧 Processing: ' + subject);

        // Extract deals from the alert email
        var deals = extractDealsFromAlertEmail(body, html, subject);

        deals.forEach(function(deal) {
          if (stockSheet && !isDuplicateStockReport(stockSheet, deal.brand, deal.title, 'Google Alerts')) {
            stockSheet.appendRow([
              now,
              'special',                        // B: Report Type (alerts usually = sales)
              'Any',                            // C: Gender
              deal.brand,                       // D: Brand
              deal.title,                       // E: Model
              'Any',                            // F: Width
              'All',                            // G: Sizes
              deal.retailer || 'See link',      // H: Retailer
              deal.price || '',                 // I: Current Price
              '',                               // J: Original Price
              '',                               // K: Sale End Date
              'Found via Google Alert: ' + subject, // L: Notes
              'Google Alerts',                  // M: Reporter
              '',                               // N: Reporter Email
              'New',                            // O: Status
              deal.url || ''                    // P: Product URL
            ]);
            found++;
            Logger.log('    ✅ Stock Report created: ' + deal.brand + ' ' + deal.title);
          }
        });

        // Mark email as read so we don't process it again
        message.markRead();
      }
    });
  });

  Logger.log('  Stock Reports created from alerts: ' + found);

  if (found > 0) {
    Logger.log('  🔔 Running processAllNewStockReports()...');
    processAllNewStockReports();
  }
}


// ============================================================
// METHOD 3: SHOPIFY PRODUCT FEED CHECKER
// Reads /products.json — clean JSON, no JavaScript needed
// ============================================================

function checkShopifyFeeds() {
  var ss         = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName('Stock Reports');
  var alertSheet = ss.getSheetByName('Alert Requests');
  if (!stockSheet || !alertSheet) { Logger.log('ERROR: Sheets not found'); return; }

  var alertData    = alertSheet.getDataRange().getValues();
  var pendingBrands = getPendingBrands(alertData);
  var now          = new Date();
  var totalFound   = 0;

  Logger.log('  Pending brands to match: ' + pendingBrands.join(', '));

  SHOPIFY_STORES.forEach(function(store) {
    Logger.log('\n  🛍️  Checking: ' + store.name);

    try {
      Utilities.sleep(1000);
      var response = UrlFetchApp.fetch(store.feedUrl, {
        muteHttpExceptions: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (response.getResponseCode() !== 200) {
        Logger.log('    ❌ Feed returned: ' + response.getResponseCode());
        return;
      }

      var json     = JSON.parse(response.getContentText());
      var products = json.products || [];
      Logger.log('    📦 ' + products.length + ' products in feed');

      var storeFound = 0;

      products.forEach(function(product) {
        var title  = String(product.title || '');
        var vendor = String(product.vendor || '');
        var tags   = String(product.tags || '').toLowerCase();

        // Only process shoe products
        if (!isShoeKeyword(title)) return;

        // Check if this brand has pending requests
        var matchedBrand = pendingBrands.find(function(b) {
          return title.toLowerCase().indexOf(b.toLowerCase()) !== -1 ||
                 vendor.toLowerCase().indexOf(b.toLowerCase()) !== -1;
        });

        if (!matchedBrand) return;

        // Get the cheapest available variant
        var variants      = product.variants || [];
        var available     = variants.filter(function(v) { return v.available; });
        if (available.length === 0) return;

        var prices        = available.map(function(v) { return parseFloat(v.price); });
        var minPrice      = Math.min.apply(null, prices);
        var maxPrice      = Math.max.apply(null, prices);
        var isOnSale      = product.compare_at_price_max && parseFloat(product.compare_at_price_max) > minPrice;
        var originalPrice = isOnSale ? parseFloat(product.compare_at_price_max) : null;
        var productUrl    = store.domain + '/products/' + product.handle;

        // Get available sizes from variant titles
        var sizes = available.map(function(v) {
          return v.title.replace(/[^0-9.]/g, '').trim();
        }).filter(function(s) { return s !== ''; }).join(', ');

        // Check if any pending request matches this product + sizes
        var hasMatch = checkPendingMatch(alertData, matchedBrand, title, sizes);
        if (!hasMatch) return;

        // Avoid duplicates
        if (isDuplicateStockReport(stockSheet, matchedBrand, title, store.name)) return;

        stockSheet.appendRow([
          now,
          isOnSale ? 'special' : 'stock',   // B: Report Type
          'Any',                            // C: Gender
          matchedBrand,                     // D: Brand
          title,                            // E: Model
          'Any',                            // F: Width
          sizes,                            // G: Sizes Available
          store.name,                       // H: Retailer
          minPrice,                         // I: Current Price
          originalPrice || '',              // J: Original Price
          '',                               // K: Sale End Date
          (isOnSale ? 'ON SALE ' : '') + 'R' + minPrice.toFixed(2)
            + (maxPrice > minPrice ? ' - R' + maxPrice.toFixed(2) : '')
            + ' — Found via Shopify feed',  // L: Notes
          'FindMySize Shopify Checker',     // M: Reporter
          '',                               // N: Reporter Email
          'New',                            // O: Status
          productUrl                        // P: Product URL
        ]);

        storeFound++;
        totalFound++;
        Logger.log('    ✅ ' + matchedBrand + ' | ' + title
          + ' | R' + minPrice.toFixed(2)
          + (isOnSale ? ' (SALE!)' : '')
          + ' | Sizes: ' + (sizes || 'check page'));
      });

      Logger.log('    Found ' + storeFound + ' matching products at ' + store.name);

    } catch(e) {
      Logger.log('    💥 Error: ' + e.message);
    }
  });

  Logger.log('\n  Total Shopify matches: ' + totalFound);

  if (totalFound > 0) {
    Logger.log('  🔔 Running processAllNewStockReports()...');
    processAllNewStockReports();
  }
}


// ============================================================
// HELPERS
// ============================================================

/**
 * Get all unique brands from pending Alert Requests
 */
function getPendingBrands(alertData) {
  var brands = {};
  for (var i = 1; i < alertData.length; i++) {
    var status = String(alertData[i][9]).toLowerCase().trim();
    var brand  = String(alertData[i][2]).trim();
    if (status === 'pending' && brand && brand !== 'Any') {
      brands[brand.toLowerCase()] = brand;
    }
  }
  return Object.values(brands);
}


/**
 * Check if any pending alert matches this brand + sizes
 */
function checkPendingMatch(alertData, brand, title, sizesStr) {
  var sizes = sizesStr.split(',').map(function(s) { return s.trim(); });
  for (var i = 1; i < alertData.length; i++) {
    var row        = alertData[i];
    var status     = String(row[9]).toLowerCase().trim();
    var rowBrand   = String(row[2]).trim();
    var rowModel   = String(row[3]).trim();
    var rowSize    = String(row[6]).trim();
    if (status !== 'pending') continue;
    if (rowBrand.toLowerCase() !== brand.toLowerCase()) continue;
    if (rowModel !== 'Any' && title.toLowerCase().indexOf(rowModel.toLowerCase()) === -1) continue;
    if (sizes.length > 0 && sizes.indexOf(rowSize) === -1) continue;
    return true;
  }
  return false;
}


/**
 * Check if Active/New Stock Report already exists for this shoe + retailer
 */
function isDuplicateStockReport(sheet, brand, title, retailer) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowStatus   = String(data[i][14]).trim();
    var rowBrand    = String(data[i][3]).toLowerCase();
    var rowModel    = String(data[i][4]).toLowerCase();
    var rowRetailer = String(data[i][7]).toLowerCase();
    if (rowStatus === 'Expired') continue;
    if (rowBrand === brand.toLowerCase() &&
        rowModel.indexOf(title.toLowerCase().substring(0, 15)) !== -1 &&
        rowRetailer === retailer.toLowerCase()) {
      return true;
    }
  }
  return false;
}


/**
 * Extract retailer name from URL
 */
function extractRetailerName(url) {
  var match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
  if (!match) return 'Unknown';
  var domain = match[1].replace('.co.za','').replace('.com','');
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}


/**
 * Check if page indicates item is in stock
 */
function checkInStock(html) {
  var outOfStockPatterns = [
    /out.of.stock/i,
    /sold.out/i,
    /unavailable/i,
    /"availability"\s*:\s*"OutOfStock"/i,
    /availability.*OutOfStock/i
  ];
  var inStockPatterns = [
    /"availability"\s*:\s*"InStock"/i,
    /add.to.cart/i,
    /add.to.bag/i,
    /in.stock/i
  ];

  for (var i = 0; i < outOfStockPatterns.length; i++) {
    if (outOfStockPatterns[i].test(html)) return false;
  }
  for (var j = 0; j < inStockPatterns.length; j++) {
    if (inStockPatterns[j].test(html)) return true;
  }
  return null; // Unknown
}


/**
 * Extract deals from a Google Alert email body
 */
function extractDealsFromAlertEmail(body, html, subject) {
  var deals   = [];
  var lines   = body.split('\n');
  var subjectLower = subject.toLowerCase();

  // Detect brand from subject line
  var brands = ['Nike','Adidas','New Balance','Puma','ASICS','Saucony',
                'Brooks','Hoka','Reebok','Converse','Vans','Merrell'];
  var foundBrand = 'Unknown';
  brands.forEach(function(b) {
    if (subjectLower.indexOf(b.toLowerCase()) !== -1) foundBrand = b;
  });

  // Extract URLs from the email
  var urlPattern = /https?:\/\/[^\s<>"]+/g;
  var urls = body.match(urlPattern) || [];

  // Filter for SA retailer URLs
  var saRetailers = ['superbalist','zando','bash','sportscene','totalsports',
                     'theathletesfoot','capeunionmart','edgars','sportsmanswarehouse',
                     'mrpsport','kloppers','footgear'];

  var retailerUrls = urls.filter(function(url) {
    return saRetailers.some(function(r) { return url.indexOf(r) !== -1; });
  });

  // Extract prices from email body
  var priceMatches = body.match(/R\s*[\d,]+\.?\d*/g) || [];
  var prices = priceMatches.map(function(p) {
    return parseFloat(p.replace('R','').replace(',','').trim());
  }).filter(function(p) { return p > 0 && p < 50000; });

  // Build deals from what we found
  if (retailerUrls.length > 0) {
    retailerUrls.slice(0, 5).forEach(function(url, idx) {
      deals.push({
        brand:    foundBrand,
        title:    subject.replace(/Google Alert - /i, '').trim(),
        url:      url,
        retailer: extractRetailerName(url),
        price:    prices[idx] || null
      });
    });
  } else if (foundBrand !== 'Unknown') {
    // No retailer URL found but brand detected — create generic report
    deals.push({
      brand:    foundBrand,
      title:    subject.replace(/Google Alert - /i, '').trim(),
      url:      '',
      retailer: 'See Google Alert',
      price:    prices[0] || null
    });
  }

  return deals;
}


/**
 * Check if title contains shoe-related keywords
 */
function isShoeKeyword(title) {
  var keywords = ['shoe','sneaker','trainer','runner','boot','sandal',
    'pump','running','walking','hiking','trail','pegasus','ultraboost',
    'superstar','air max','air force','vomero','gel-','nimbus','kayano',
    'peregrine','clifton','bondi','fresh foam','574','suede','chuck',
    'old skool','predator','duramo','stan smith'];
  var t = title.toLowerCase();
  return keywords.some(function(k) { return t.indexOf(k) !== -1; });
}


// ============================================================
// TRIGGER SETUP
// Run ONCE to activate daily smart checking at 8am
// ============================================================

function setupSmartCheckerTrigger() {
  // Remove old scraper trigger if it exists
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'checkAllRetailers' ||
        trigger.getHandlerFunction() === 'runSmartChecker') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Run smart checker daily at 8am
  ScriptApp.newTrigger('runSmartChecker')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log('✅ Smart Checker trigger set! runSmartChecker() runs daily at 8am');
  Logger.log('');
  Logger.log('Full daily schedule:');
  Logger.log('  8:00am  → runSmartChecker()          ← URL check + alerts + Shopify feeds');
  Logger.log('  9:00am  → sendStillLookingUpdates()  ← keeps users informed');
  Logger.log('  10:00am → checkStockReportUrls()     ← validates active URLs');
  Logger.log('  Sunday  → runArchive()               ← cleans up old rows');
}


// ============================================================
// TEST FUNCTIONS
// ============================================================

/**
 * Test all 3 methods individually
 */
function testSmartChecker() {
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   Testing Smart Checker               ║');
  Logger.log('╚══════════════════════════════════════╝');

  Logger.log('\n[ Test 1: Shopify Feeds ]');
  testShopifyFeeds();

  Logger.log('\n[ Test 2: Google Alert Emails ]');
  testGoogleAlerts();

  Logger.log('\n[ Test 3: User URL Check ]');
  Logger.log('  Add a product URL to an Alert Request then run checkUserProductUrls()');
}


function testShopifyFeeds() {
  SHOPIFY_STORES.forEach(function(store) {
    Logger.log('\n  Testing: ' + store.name);
    Logger.log('  Feed URL: ' + store.feedUrl);

    try {
      var response = UrlFetchApp.fetch(store.feedUrl, {
        muteHttpExceptions: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      var code = response.getResponseCode();
      Logger.log('  HTTP Status: ' + code);

      if (code === 200) {
        var json     = JSON.parse(response.getContentText());
        var products = json.products || [];
        Logger.log('  Total products: ' + products.length);

        // Show first 5 shoe products
        var shoeCount = 0;
        products.forEach(function(p) {
          if (shoeCount < 5 && isShoeKeyword(p.title)) {
            var variants  = (p.variants || []).filter(function(v) { return v.available; });
            var prices    = variants.map(function(v) { return parseFloat(v.price); });
            var minPrice  = prices.length > 0 ? Math.min.apply(null, prices) : 0;
            var isOnSale  = p.compare_at_price_max && parseFloat(p.compare_at_price_max) > minPrice;
            Logger.log('  → ' + p.vendor + ' | ' + p.title
              + ' | R' + minPrice.toFixed(2)
              + (isOnSale ? ' 🏷️ SALE' : '')
              + ' | ' + variants.length + ' sizes available');
            shoeCount++;
          }
        });

        if (shoeCount === 0) Logger.log('  ⚠️  No shoe products found in feed');
        else Logger.log('  ✅ Feed working! ' + shoeCount + ' sample shoes shown above');

      } else {
        Logger.log('  ❌ Feed not accessible: ' + code);
      }
    } catch(e) {
      Logger.log('  💥 Error: ' + e.message);
    }

    Utilities.sleep(1000);
  });
}


function testGoogleAlerts() {
  var threads = GmailApp.search('from:googlealerts-noreply@google.com', 0, 5);
  Logger.log('  Google Alert emails found (all): ' + threads.length);

  var unread = GmailApp.search('from:googlealerts-noreply@google.com is:unread', 0, 5);
  Logger.log('  Unread Google Alert emails: ' + unread.length);

  if (threads.length === 0) {
    Logger.log('  ⚠️  No Google Alert emails found!');
    Logger.log('  Set up alerts at: google.com/alerts');
    Logger.log('  Deliver to: findmysizealerts@gmail.com');
    Logger.log('  Suggested searches:');
    Logger.log('    "Nike Pegasus" sale "South Africa"');
    Logger.log('    "Adidas Ultraboost" special "South Africa"');
    Logger.log('    running shoes sale site:zando.co.za');
    Logger.log('    sneakers sale site:bash.com');
    return;
  }

  // Show subjects of most recent alerts
  threads.slice(0, 3).forEach(function(thread) {
    var msg = thread.getMessages()[0];
    Logger.log('  📧 ' + msg.getDate() + ' | ' + msg.getSubject());
  });
  Logger.log('  ✅ Google Alerts connected to Gmail successfully!');
}
