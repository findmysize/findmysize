// ============================================================
// FindMySize - Retailer Sale Scraper
// Version 1.0
// ============================================================
//
// WHAT IT DOES:
//   Checks 16 SA shoe retailers daily for sales and new stock
//   Automatically creates Stock Reports when shoes are found
//   processAllNewStockReports() then handles user notifications
//
// HOW TO USE:
//   1. Paste this file into Apps Script alongside main script
//   2. Run setupScraperTrigger() ONCE to activate daily checks
//   3. Run checkAllRetailers() manually anytime to test
//   4. Check Stock Reports tab for found deals
//
// DAILY SCHEDULE (after setup):
//   8:00am  → checkAllRetailers()       ← finds deals
//   9:00am  → sendStillLookingUpdates() ← keeps users informed
//   10:00am → checkStockReportUrls()    ← validates URLs
//   Sunday  → runArchive()              ← cleans up old rows
//
// REALISTIC EXPECTATIONS:
//   ✅ Simple/static sites:    80-90% success rate
//   ⚠️  JavaScript-heavy sites: 30-50% success rate
//   ❌ Login-required pages:   Not possible
//   The script improves as we learn each site's HTML structure
// ============================================================


// ============================================================
// RETAILER CONFIGURATION
// Add/remove retailers here — no code changes needed elsewhere
// ============================================================

var RETAILERS = [

  // ── CURRENT STORES ──────────────────────────────────────

  {
    name:       'Superbalist',
    saleUrls:   [
      'https://superbalist.com/shoes?sort=sale',
      'https://superbalist.com/women/shoes?sort=sale',
      'https://superbalist.com/men/shoes?sort=sale'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Zando',
    saleUrls:   [
      'https://www.zando.co.za/sale/?category=shoes-sneakers',
      'https://www.zando.co.za/sale/?category=shoes-running',
      'https://www.zando.co.za/sale/?category=shoes'
    ],
    pricePattern:   /class="[^"]*price[^"]*"[^>]*>\s*R\s*([\d,]+\.?\d*)/i,
    titlePattern:   /class="[^"]*product[^"]*title[^"]*"[^>]*>\s*([^<]+)/i,
    brandPattern:   /class="[^"]*brand[^"]*"[^>]*>\s*([^<]+)/i,
    active:     true
  },

  {
    name:       'Sportscene',
    saleUrls:   [
      'https://www.sportscene.co.za/c/footwear',
      'https://www.sportscene.co.za/c/sale'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Totalsports',
    saleUrls:   [
      'https://www.totalsports.co.za/sale/shoes',
      'https://www.totalsports.co.za/footwear/sale'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'The Athletes Foot',
    saleUrls:   [
      'https://www.theathletesfoot.co.za/collections/sale',
      'https://www.theathletesfoot.co.za/collections/running-shoes-sale'
    ],
    pricePattern:   /"price"\s*:\s*([\d]+)/,
    titlePattern:   /"title"\s*:\s*"([^"]+)"/,
    brandPattern:   /"vendor"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Bash',
    saleUrls:   [
      'https://www.bash.com/shoes',
      'https://www.bash.com/women/shoes',
      'https://www.bash.com/men/shoes'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Cape Union Mart',
    saleUrls:   [
      'https://www.capeunionmart.co.za/sale/footwear',
      'https://www.capeunionmart.co.za/specials/footwear'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Edgars',
    saleUrls:   [
      'https://www.edgars.co.za/c/shoes',
      'https://www.edgars.co.za/c/footwear'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },


  // ── NEW STORES ───────────────────────────────────────────

  {
    name:       'Sportsmans Warehouse',
    saleUrls:   [
      'https://www.sportsmanswarehouse.co.za/footwear',
      'https://www.sportsmanswarehouse.co.za/footwear/running-shoes'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Mr Price Sport',
    saleUrls:   [
      'https://www.mrpsport.com/category/shoes/sale',
      'https://www.mrpsport.com/category/shoes?priceTo=999'
    ],
    pricePattern:   /class="[^"]*price[^"]*"[^>]*>\s*R\s*([\d,]+\.?\d*)/i,
    titlePattern:   /class="[^"]*product[^"]*name[^"]*"[^>]*>\s*([^<]+)/i,
    brandPattern:   /class="[^"]*brand[^"]*"[^>]*>\s*([^<]+)/i,
    active:     true
  },

  {
    name:       'New Balance SA',
    saleUrls:   [
      'https://www.newbalance.co.za/en/sale/',
      'https://www.newbalance.co.za/en/sale/footwear/'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   null,
    defaultBrand:   'New Balance',
    active:     false  // 403 - blocked, disable for now
  },

  {
    name:       'Nike SA',
    saleUrls:   [
      'https://www.nike.com/za/w/sale-shoes-3yaepzy7ok',
      'https://www.nike.com/za/w/mens-sale-shoes-3yaepznik1zy7ok',
      'https://www.nike.com/za/w/womens-sale-shoes-3yaepz5e18zy7ok'
    ],
    pricePattern:   /"currentPrice"\s*:\s*([\d.]+)/,
    titlePattern:   /"title"\s*:\s*"([^"]+)"/,
    brandPattern:   null, // Always Nike
    defaultBrand:   'Nike',
    active:     true
  },

  {
    name:       'Adidas SA',
    saleUrls:   [
      'https://www.adidas.co.za/sale/shoes',
      'https://www.adidas.co.za/men-shoes-sale',
      'https://www.adidas.co.za/women-shoes-sale'
    ],
    pricePattern:   /"salePrice"\s*:\s*([\d.]+)/,
    titlePattern:   /"modelName"\s*:\s*"([^"]+)"/,
    brandPattern:   null,
    defaultBrand:   'Adidas',
    active:     false  // 403 - blocked, disable for now
  },

  {
    name:       'Pick n Pay Clothing',
    saleUrls:   [
      'https://www.pnpclothing.co.za/c/footwear',
      'https://www.pnpclothing.co.za/c/shoes'
    ],
    pricePattern:   /class="[^"]*sale[^"]*price[^"]*"[^>]*>\s*R\s*([\d,]+\.?\d*)/i,
    titlePattern:   /class="[^"]*product[^"]*title[^"]*"[^>]*>\s*([^<]+)/i,
    brandPattern:   /class="[^"]*brand[^"]*"[^>]*>\s*([^<]+)/i,
    active:     true
  },

  {
    name:       'De Jagers',
    saleUrls:   [
      'https://dejagers.co.za/specials',
      'https://dejagers.co.za/shoes'
    ],
    pricePattern:   /R\s*([\d,]+\.?\d{2})/,
    titlePattern:   /class="[^"]*product[^"]*name[^"]*"[^>]*>\s*([^<]+)/i,
    brandPattern:   /class="[^"]*brand[^"]*"[^>]*>\s*([^<]+)/i,
    active:     true
  },

  {
    name:       'Footgear',
    saleUrls:   [
      'https://www.footgear.co.za/footwear',
      'https://www.footgear.co.za/footwear/sneakers'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  },

  {
    name:       'Kloppers Sport',
    saleUrls:   [
      'https://www.kloppers.co.za/footwear',
      'https://www.kloppers.co.za/footwear/running'
    ],
    pricePattern:   /"price"\s*:\s*"?([\d.]+)"?/,
    titlePattern:   /"name"\s*:\s*"([^"]+)"/,
    brandPattern:   /"brand"\s*:\s*"([^"]+)"/,
    active:     true
  }

];


// ============================================================
// KNOWN SHOE BRANDS (for smarter matching)
// ============================================================

var KNOWN_BRANDS = [
  'Nike', 'Adidas', 'New Balance', 'Puma', 'ASICS', 'Saucony',
  'Brooks', 'Hoka', 'Reebok', 'Converse', 'Vans', 'Timberland',
  'Merrell', 'Salomon', 'On Running', 'Under Armour', 'Fila',
  'Lacoste', 'Tommy Hilfiger', 'Steve Madden', 'Polo', 'Hi-Tec',
  'Lotto', 'Bata', 'Caterpillar', 'CAT', 'Wolverine', 'Sketchers',
  'DC', 'Clarks', 'Ecco', 'Geox', 'Guess', 'Call It Spring'
];


// ============================================================
// MAIN SCRAPER FUNCTION
// Runs daily at 8am via trigger
// ============================================================

function checkAllRetailers() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName('Stock Reports');
  const logSheet = getOrCreateScraperLog(ss);

  if (!sheet) { Logger.log('ERROR: Stock Reports sheet not found'); return; }

  const now        = new Date();
  let totalFound   = 0;
  let totalSkipped = 0;
  let totalErrors  = 0;

  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   FindMySize Retailer Scraper         ║');
  Logger.log('║   ' + now.toDateString() + '              ║');
  Logger.log('╚══════════════════════════════════════╝');

  RETAILERS.forEach(function(retailer) {
    if (!retailer.active) {
      Logger.log('\n⏭️  SKIPPED: ' + retailer.name + ' (inactive)');
      return;
    }

    Logger.log('\n─────────────────────────────────────');
    Logger.log('🔍 Checking: ' + retailer.name);

    retailer.saleUrls.forEach(function(url) {
      try {
        Utilities.sleep(1000); // Pause between requests — be polite!

        const response = UrlFetchApp.fetch(url, {
          muteHttpExceptions: true,
          followRedirects:    true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.9'
          }
        });

        const code = response.getResponseCode();

        if (code === 200) {
          const html    = response.getContentText();
          const deals   = extractDealsFromHtml(html, retailer, url);

          if (deals.length > 0) {
            deals.forEach(function(deal) {
              // Check if we already have an Active/New report for this deal
              if (!isDuplicateReport(sheet, deal.brand, deal.title, retailer.name)) {
                saveScrapedDeal(sheet, deal, retailer.name, url, now);
                totalFound++;
                Logger.log('  ✅ Found: ' + deal.brand + ' ' + deal.title
                  + ' — R' + Number(deal.price).toFixed(2)
                  + (deal.originalPrice ? ' (was R' + Number(deal.originalPrice).toFixed(2) + ')' : ''));
              } else {
                totalSkipped++;
              }
            });

            Logger.log('  📦 ' + deals.length + ' deals found at ' + url);
          } else {
            Logger.log('  ℹ️  No deals extracted from ' + url + ' (may be JS-rendered)');
          }

        } else if (code === 403 || code === 429) {
          Logger.log('  🚫 Blocked by ' + retailer.name + ' (' + code + ') — ' + url);
          totalErrors++;
        } else if (code === 404) {
          Logger.log('  ❌ Page not found (' + code + ') — ' + url);
          totalErrors++;
        } else {
          Logger.log('  ⚠️  Unexpected response ' + code + ' — ' + url);
          totalErrors++;
        }

      } catch (error) {
        Logger.log('  ⚠️  Error checking ' + url + ': ' + error.toString());
        totalErrors++;
      }
    });
  });

  // Log summary to Scraper Log sheet
  logSheet.appendRow([
    now,
    totalFound,
    totalSkipped,
    totalErrors,
    RETAILERS.filter(function(r) { return r.active; }).length
  ]);

  Logger.log('\n╔══════════════════════════════════════╗');
  Logger.log('║  Scraper Summary:                     ║');
  Logger.log('║  ✅ New deals found:   ' + totalFound);
  Logger.log('║  ⏭️  Duplicates skipped: ' + totalSkipped);
  Logger.log('║  ⚠️  Errors:            ' + totalErrors);
  Logger.log('╚══════════════════════════════════════╝');

  // Auto-trigger notifications for any new deals found
  if (totalFound > 0) {
    Logger.log('\n🔔 Running processAllNewStockReports() for new deals...');
    processAllNewStockReports();
  }
}


// ============================================================
// DEAL EXTRACTION ENGINE
// Tries multiple patterns to extract shoe deals from HTML
// ============================================================

function extractDealsFromHtml(html, retailer, url) {
  const deals = [];

  // ── Method 1: JSON-LD Structured Data (most reliable) ────
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    jsonLdMatches.forEach(function(block) {
      try {
        const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, '').trim());
        const items = Array.isArray(json) ? json : [json];

        items.forEach(function(item) {
          if (item['@type'] === 'Product' || item['@type'] === 'Offer') {
            const price         = extractJsonPrice(item);
            const originalPrice = extractJsonOriginalPrice(item);
            const title         = item.name || item.title || '';
            const brand         = extractJsonBrand(item, retailer);

            if (price && title && isShoeProduct(title)) {
              deals.push({
                brand:         brand || detectBrandFromTitle(title),
                title:         title,
                price:         price,
                originalPrice: originalPrice,
                url:           item.url || url
              });
            }
          }
        });
      } catch(e) { /* JSON parse failed — try next method */ }
    });
  }

  // ── Method 2: Shopify product JSON (used by Athletes Foot, Runner's World) ──
  const shopifyMatch = html.match(/var meta = ({[\s\S]*?"product"[\s\S]*?});/);
  if (shopifyMatch && deals.length === 0) {
    try {
      const meta  = JSON.parse(shopifyMatch[1]);
      const prod  = meta.product;
      if (prod && isShoeProduct(prod.title || '')) {
        const price = prod.price ? prod.price / 100 : null;
        deals.push({
          brand:         prod.vendor || detectBrandFromTitle(prod.title),
          title:         prod.title || '',
          price:         price,
          originalPrice: prod.compare_at_price ? prod.compare_at_price / 100 : null,
          url:           url
        });
      }
    } catch(e) { /* failed */ }
  }

  // ── Method 3: Retailer-specific patterns ─────────────────
  if (deals.length === 0 && retailer.pricePattern && retailer.titlePattern) {
    const prices  = [];
    const titles  = [];
    const brands  = [];

    let priceMatch;
    const priceRegex = new RegExp(retailer.pricePattern.source, 'g');
    while ((priceMatch = priceRegex.exec(html)) !== null) {
      prices.push(parseFloat(priceMatch[1].replace(/,/g, '')));
    }

    let titleMatch;
    const titleRegex = new RegExp(retailer.titlePattern.source, 'gi');
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const title = titleMatch[1].trim();
      if (title.length > 3 && title.length < 100) titles.push(title);
    }

    if (retailer.brandPattern) {
      let brandMatch;
      const brandRegex = new RegExp(retailer.brandPattern.source, 'gi');
      while ((brandMatch = brandRegex.exec(html)) !== null) {
        brands.push(brandMatch[1].trim());
      }
    }

    // Match up prices with titles
    const count = Math.min(prices.length, titles.length, 20); // Max 20 per page
    for (let i = 0; i < count; i++) {
      const title = titles[i] || '';
      if (!isShoeProduct(title)) continue;

      deals.push({
        brand:         brands[i] || retailer.defaultBrand || detectBrandFromTitle(title),
        title:         title,
        price:         prices[i],
        originalPrice: null,
        url:           url
      });
    }
  }

  return deals;
}


// ============================================================
// HELPER: Extract JSON price fields
// ============================================================

function extractJsonPrice(item) {
  if (item.offers) {
    const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
    return offer.price ? parseFloat(offer.price) : null;
  }
  if (item.price) return parseFloat(item.price);
  return null;
}

function extractJsonOriginalPrice(item) {
  if (item.offers) {
    const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
    if (offer.priceValidUntil || offer.eligibleQuantity) {
      return offer.highPrice ? parseFloat(offer.highPrice) : null;
    }
  }
  return null;
}

function extractJsonBrand(item, retailer) {
  if (retailer.defaultBrand) return retailer.defaultBrand;
  if (item.brand) {
    return typeof item.brand === 'string' ? item.brand : (item.brand.name || '');
  }
  return null;
}


// ============================================================
// HELPER: Detect brand from product title
// ============================================================

function detectBrandFromTitle(title) {
  const titleUpper = title.toUpperCase();
  for (let i = 0; i < KNOWN_BRANDS.length; i++) {
    if (titleUpper.indexOf(KNOWN_BRANDS[i].toUpperCase()) !== -1) {
      return KNOWN_BRANDS[i];
    }
  }
  // Try first word as brand (often the case)
  const firstWord = title.split(/\s+/)[0];
  return firstWord.length > 2 ? firstWord : 'Unknown';
}


// ============================================================
// HELPER: Check if product title is shoe-related
// ============================================================

function isShoeProduct(title) {
  const shoeKeywords = [
    'shoe', 'sneaker', 'trainer', 'runner', 'boot', 'sandal',
    'pump', 'loafer', 'slipper', 'moccasin', 'oxford', 'wedge',
    'heel', 'flat', 'slip-on', 'canvas', 'running', 'walking',
    'hiking', 'trail', 'cross-train', 'basketball', 'tennis',
    'golf', 'football', 'soccer', 'pegasus', 'ultraboost',
    'superstar', 'stan smith', 'air max', 'air force', 'vomero',
    'gel-', 'nimbus', 'kayano', 'peregrine', 'clifton', 'bondi',
    'fresh foam', '574', '990', '997', '1080', 'suede', 'chuck',
    'old skool', 'era', 'authentic', 'sk8'
  ];
  const titleLower = title.toLowerCase();
  return shoeKeywords.some(function(kw) { return titleLower.indexOf(kw) !== -1; });
}


// ============================================================
// HELPER: Prevent duplicate Stock Reports
// ============================================================

function isDuplicateReport(sheet, brand, title, retailerName) {
  const data = sheet.getDataRange().getValues();
  const titleLower    = title.toLowerCase();
  const brandLower    = brand.toLowerCase();
  const retailerLower = retailerName.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const rowBrand    = String(data[i][3]).toLowerCase();
    const rowModel    = String(data[i][4]).toLowerCase();
    const rowRetailer = String(data[i][7]).toLowerCase();
    const rowStatus   = String(data[i][14]).trim();

    if (rowStatus === 'Expired') continue; // Expired — allow new report

    if (rowBrand === brandLower &&
        rowModel.indexOf(titleLower.substring(0, 10)) !== -1 &&
        rowRetailer === retailerLower) {
      return true; // Already have an active report for this
    }
  }
  return false;
}


// ============================================================
// HELPER: Save scraped deal to Stock Reports tab
// ============================================================

function saveScrapedDeal(sheet, deal, retailerName, sourceUrl, now) {
  const isSpecial     = deal.originalPrice && deal.originalPrice > deal.price;
  const reportType    = isSpecial ? 'special' : 'stock';
  const discountPct   = isSpecial
    ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
    : 0;
  const notes = isSpecial
    ? discountPct + '% OFF — Auto-found by FindMySize scraper'
    : 'Auto-found by FindMySize scraper';

  sheet.appendRow([
    now,                    // A: Timestamp
    reportType,             // B: Report Type
    'Any',                  // C: Gender (scraper doesn't know gender)
    deal.brand || '',       // D: Brand
    deal.title || '',       // E: Model
    'Any',                  // F: Width (scraper doesn't know width)
    'All',                  // G: Sizes Available (unknown — user checks)
    retailerName,           // H: Retailer
    deal.price || '',       // I: Current Price
    deal.originalPrice || '',// J: Original Price
    '',                     // K: Sale End Date
    notes,                  // L: Notes
    'FindMySize Scraper',   // M: Reporter Name
    '',                     // N: Reporter Email
    'New',                  // O: Status
    sourceUrl               // P: Product URL
  ]);
}


// ============================================================
// SCRAPER LOG SHEET
// Tracks daily scraper performance
// ============================================================

function getOrCreateScraperLog(ss) {
  let sheet = ss.getSheetByName('Scraper Log');
  if (!sheet) {
    sheet = ss.insertSheet('Scraper Log');
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Date', 'New Deals Found', 'Duplicates Skipped', 'Errors', 'Retailers Checked'
    ]]);
    sheet.getRange(1, 1, 1, 5)
      .setBackground('#37474f')
      .setFontColor('white')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('✅ Scraper Log tab created');
  }
  return sheet;
}


// ============================================================
// SCRAPER STATISTICS
// ============================================================

function getScraperStats() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Scraper Log');

  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('No scraper runs logged yet.');
    return;
  }

  const data       = sheet.getDataRange().getValues();
  let totalDeals   = 0;
  let totalErrors  = 0;
  let totalRuns    = data.length - 1;

  for (let i = 1; i < data.length; i++) {
    totalDeals  += Number(data[i][1]) || 0;
    totalErrors += Number(data[i][3]) || 0;
  }

  Logger.log('=== SCRAPER STATISTICS ===');
  Logger.log('Total runs:        ' + totalRuns);
  Logger.log('Total deals found: ' + totalDeals);
  Logger.log('Total errors:      ' + totalErrors);
  Logger.log('Avg deals/run:     ' + (totalDeals / totalRuns).toFixed(1));
  Logger.log('Last run:          ' + data[data.length - 1][0]);
}


// ============================================================
// ENABLE / DISABLE INDIVIDUAL RETAILERS
// ============================================================

function disableRetailer(name) {
  RETAILERS.forEach(function(r) {
    if (r.name.toLowerCase() === name.toLowerCase()) {
      r.active = false;
      Logger.log('⏸️  Disabled: ' + r.name);
    }
  });
}

function enableRetailer(name) {
  RETAILERS.forEach(function(r) {
    if (r.name.toLowerCase() === name.toLowerCase()) {
      r.active = true;
      Logger.log('▶️  Enabled: ' + r.name);
    }
  });
}

function listRetailers() {
  Logger.log('=== RETAILER STATUS ===');
  RETAILERS.forEach(function(r) {
    Logger.log((r.active ? '✅' : '⏸️ ') + ' ' + r.name + ' (' + r.saleUrls.length + ' URLs)');
  });
}


// ============================================================
// SETUP TRIGGER
// Run ONCE to activate daily scraping at 8am
// ============================================================

function setupScraperTrigger() {
  // Remove existing scraper trigger
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'checkAllRetailers') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('checkAllRetailers')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log('✅ Scraper trigger set! checkAllRetailers() runs daily at 8am');
  Logger.log('');
  Logger.log('Full daily schedule:');
  Logger.log('  8:00am  → checkAllRetailers()       ← finds deals at 16 retailers');
  Logger.log('  9:00am  → sendStillLookingUpdates() ← keeps users informed');
  Logger.log('  10:00am → checkStockReportUrls()    ← validates all active URLs');
  Logger.log('  Sunday  → runArchive()              ← cleans up completed rows');
}


// ============================================================
// RETAILER DIAGNOSTIC TESTS
// ============================================================

/**
 * Tests ALL retailers one by one
 * Shows exactly what each URL returns and why
 * Run this to diagnose which retailers work
 */
function testAllRetailers() {
  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║   Retailer Diagnostic Test               ║');
  Logger.log('╚══════════════════════════════════════════╝');

  var results = { working: [], blocked: [], notFound: [], noDeals: [], errors: [] };

  RETAILERS.forEach(function(retailer) {
    Logger.log('\n══════════════════════════════════════════');
    Logger.log('🔍 ' + retailer.name + (retailer.active ? '' : ' [INACTIVE]'));
    Logger.log('══════════════════════════════════════════');

    testRetailerDetailed(retailer, results);
    Utilities.sleep(1500); // Be polite between retailers
  });

  // Summary
  Logger.log('\n╔══════════════════════════════════════════╗');
  Logger.log('║   SUMMARY                                ║');
  Logger.log('╠══════════════════════════════════════════╣');
  Logger.log('║ ✅ Working (deals found):   ' + results.working.join(', '));
  Logger.log('║ ⚠️  No deals (JS-rendered):  ' + results.noDeals.join(', '));
  Logger.log('║ 🚫 Blocked (403/429):       ' + results.blocked.join(', '));
  Logger.log('║ ❌ Not found (404):         ' + results.notFound.join(', '));
  Logger.log('║ 💥 Errors:                  ' + results.errors.join(', '));
  Logger.log('╚══════════════════════════════════════════╝');
}


/**
 * Test a single retailer by name
 * e.g. testRetailerByName('Superbalist')
 */
function testRetailerByName(name) {
  var retailer = RETAILERS.find(function(r) {
    return r.name.toLowerCase() === name.toLowerCase();
  });

  if (!retailer) {
    Logger.log('❌ Retailer not found: ' + name);
    Logger.log('Available: ' + RETAILERS.map(function(r) { return r.name; }).join(', '));
    return;
  }

  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║   Testing: ' + retailer.name);
  Logger.log('╚══════════════════════════════════════════╝');
  testRetailerDetailed(retailer, { working:[], blocked:[], notFound:[], noDeals:[], errors:[] });
}


/**
 * Core diagnostic function — shows everything
 */
function testRetailerDetailed(retailer, results) {
  retailer.saleUrls.forEach(function(url, urlIndex) {
    Logger.log('\n  URL ' + (urlIndex + 1) + ': ' + url);

    try {
      var response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects:    true,
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-ZA,en;q=0.9'
        }
      });

      var code        = response.getResponseCode();
      var html        = response.getContentText();
      var htmlLength  = html.length;
      var finalUrl    = url; // Apps Script doesn't expose final URL easily

      Logger.log('  HTTP Status:   ' + code);
      Logger.log('  HTML Size:     ' + (htmlLength / 1024).toFixed(1) + ' KB');

      if (code === 200) {
        // --- Diagnose what data formats are present ---
        var hasJsonLd    = html.indexOf('application/ld+json') !== -1;
        var hasShopify   = html.indexOf('Shopify') !== -1 || html.indexOf('shopify') !== -1;
        var hasPrice     = html.match(/R\s*[\d,]+/) !== null;
        var hasSchema    = html.indexOf('itemprop="price"') !== -1;
        var isJsHeavy    = html.indexOf('__NEXT_DATA__') !== -1 ||
                           html.indexOf('window.__reactContext') !== -1 ||
                           html.indexOf('ng-app') !== -1;

        Logger.log('  JSON-LD:       ' + (hasJsonLd  ? '✅ Present' : '❌ Not found'));
        Logger.log('  Shopify:       ' + (hasShopify ? '✅ Detected' : '❌ Not detected'));
        Logger.log('  Price in HTML: ' + (hasPrice   ? '✅ Found' : '❌ Not found'));
        Logger.log('  Schema.org:    ' + (hasSchema  ? '✅ Present' : '❌ Not found'));
        Logger.log('  JS-rendered:   ' + (isJsHeavy  ? '⚠️  Yes — prices loaded by JavaScript' : '✅ No — static HTML'));

        // --- Try to extract deals ---
        var deals = extractDealsFromHtml(html, retailer, url);
        Logger.log('  Deals found:   ' + deals.length);

        if (deals.length > 0) {
          Logger.log('  Sample deals:');
          deals.slice(0, 5).forEach(function(d, i) {
            var priceStr = d.price ? 'R' + Number(d.price).toFixed(2) : 'no price';
            var origStr  = d.originalPrice ? ' (was R' + Number(d.originalPrice).toFixed(2) + ')' : '';
            Logger.log('    ' + (i+1) + '. ' + (d.brand || '?') + ' | ' + (d.title || '?') + ' | ' + priceStr + origStr);
          });
          if (urlIndex === 0) results.working.push(retailer.name);
        } else {
          Logger.log('  ℹ️  No deals extracted');

          // Show a snippet of the HTML to help diagnose
          var snippet = html.substring(0, 500).replace(/\s+/g, ' ').trim();
          Logger.log('  HTML snippet:  ' + snippet.substring(0, 300) + '...');

          if (isJsHeavy) {
            Logger.log('  💡 Site uses JavaScript rendering — prices won\'t be in raw HTML');
            Logger.log('     Solution: Use the site\'s API or JSON feed instead');
          } else if (!hasPrice) {
            Logger.log('  💡 No price found in HTML at all — URL may be wrong or redirected');
          } else {
            Logger.log('  💡 Prices exist in HTML but patterns don\'t match — pattern needs updating');
          }
          if (urlIndex === 0) results.noDeals.push(retailer.name);
        }

      } else if (code === 403 || code === 429) {
        Logger.log('  🚫 BLOCKED — retailer is blocking automated requests');
        Logger.log('  💡 Solution: Try with a cookie or use their API/affiliate feed');
        if (urlIndex === 0) results.blocked.push(retailer.name);

      } else if (code === 404) {
        Logger.log('  ❌ PAGE NOT FOUND — URL needs updating');
        Logger.log('  💡 Visit ' + retailer.name + ' manually to find the correct sale URL');
        if (urlIndex === 0) results.notFound.push(retailer.name);

      } else if (code === 301 || code === 302) {
        Logger.log('  🔀 REDIRECTED (' + code + ') — URL has moved');
        Logger.log('  💡 Find the new URL and update the config');
        if (urlIndex === 0) results.errors.push(retailer.name);

      } else {
        Logger.log('  ⚠️  Unexpected response: ' + code);
        if (urlIndex === 0) results.errors.push(retailer.name);
      }

    } catch(e) {
      Logger.log('  💥 ERROR: ' + e.toString());
      if (urlIndex === 0) results.errors.push(retailer.name);
    }

    Utilities.sleep(500);
  });
}


/**
 * Quick status check — just checks if each URL is reachable
 * Faster than full test — use this first
 */
function pingAllRetailers() {
  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║   Quick Retailer Ping Test               ║');
  Logger.log('╚══════════════════════════════════════════╝');

  RETAILERS.forEach(function(retailer) {
    if (!retailer.active) {
      Logger.log('⏸️  ' + retailer.name + ' [inactive]');
      return;
    }

    var url = retailer.saleUrls[0]; // Just check first URL
    try {
      var response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects:    true,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      var code = response.getResponseCode();
      var icon = code === 200 ? '✅' : code === 403 || code === 429 ? '🚫' : code === 404 ? '❌' : '⚠️';
      Logger.log(icon + ' ' + retailer.name.padEnd(25) + ' → ' + code);

    } catch(e) {
      Logger.log('💥 ' + retailer.name.padEnd(25) + ' → ERROR: ' + e.message);
    }

    Utilities.sleep(800);
  });

  Logger.log('\n✅=OK  🚫=Blocked  ❌=NotFound  ⚠️=Other  💥=Error');
  Logger.log('Run testRetailerByName("name") for detailed diagnosis');
}
