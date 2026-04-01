# FindMySize Notification Functions - Quick Reference Guide

## 📋 Table of Contents
1. [Notify Multiple Users (Recommended)](#notify-multiple-users)
2. [Notify Single User](#notify-single-user)
3. [Get Statistics](#get-statistics)
4. [Common Scenarios](#common-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Notify Multiple Users (Recommended)

**Use this when:** You find a shoe in stock and want to notify ALL users who requested it.

### Function Signature:
```javascript
notifyUsersForShoe(gender, brand, model, color, size, width, retailerLink, price, retailerName)
```

### Parameters:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `gender` | String | male, female, or unisex | `'female'` |
| `brand` | String | Exact brand name from sheet | `'Nike'` |
| `model` | String | Model name or `'Any'` to match all | `'Pegasus 41'` |
| `color` | String | Color or `'Any'` to match all | `'Black/White'` |
| `size` | String | Shoe size | `'8'` or `'10.5'` |
| `width` | String | Regular, Wide, Extra Wide, Narrow | `'Regular'` |
| `retailerLink` | String | Full URL to product page | `'https://...'` |
| `price` | Number | Price in Rands | `1999` |
| `retailerName` | String | Store name | `'Takealot'` |

### Example Usage:

#### Basic Example:
```javascript
notifyUsersForShoe(
  'female',              // Women's shoes
  'Nike',                // Brand
  'Pegasus 41',          // Model
  'Black/White',         // Color
  '8',                   // Size
  'Regular',             // Width
  'https://takealot.com/nike-pegasus-41-womens/PLID12345',
  1999,                  // Price
  'Takealot'            // Retailer
);
```

#### Match Any Model:
```javascript
notifyUsersForShoe(
  'male',
  'Adidas',
  'Any',                 // Matches ANY Adidas model
  'Black',
  '10',
  'Regular',
  'https://sportscene.co.za/adidas-black',
  1599,
  'Sportscene'
);
```

#### Match Any Color:
```javascript
notifyUsersForShoe(
  'female',
  'Saucony',
  'Peregrine 16',
  'Any',                 // Matches ANY color
  '5.5',
  'Regular',
  'https://theathletesfoot.co.za/saucony-peregrine-16',
  2599,
  'The Athletes Foot'
);
```

#### Wide Width Shoe:
```javascript
notifyUsersForShoe(
  'male',
  'New Balance',
  '1080v13',
  'Grey/Blue',
  '11',
  'Wide',                // Only notify users who requested Wide
  'https://totalstports.co.za/new-balance-1080-wide',
  2399,
  'Totalsports'
);
```

### What Happens:
1. ✅ Searches entire sheet for matching requests
2. ✅ Only notifies users with `Status = 'pending'`
3. ✅ Sends personalized email to each matched user
4. ✅ Automatically updates:
   - Status → `'notified'`
   - Notified At → Current timestamp
   - Retailer Found → Retailer name you provided
   - Price When Notified → Price you provided
5. ✅ Logs how many users were notified

---

## 📧 Notify Single User

**Use this when:** You want to manually notify one specific user (by row number).

### Function Signature:
```javascript
sendNotificationEmail(rowNumber)
```

### Parameters:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `rowNumber` | Number | Row number in sheet (not including header) | `5` |

### Example:
```javascript
// Notify the user in row 5
sendNotificationEmail(5);
```

### ⚠️ Important Notes:
- Row 1 is the header, so row 2 is the first data row
- You need to manually add the retailer link and price to the email template
- Only sends if Status is `'pending'`

---

## 📊 Get Statistics

**Use this when:** You want analytics about your alert requests.

### Function:
```javascript
getAlertStatistics()
```

### What It Shows:
- Total number of requests
- Breakdown by gender
- Breakdown by brand
- Breakdown by size
- Breakdown by width
- Breakdown by color
- Number of pending vs notified
- How many provided style codes
- How many provided product URLs

### Example Output:
```json
{
  "total": 47,
  "byGender": {
    "male": 23,
    "female": 19,
    "unisex": 5
  },
  "byBrand": {
    "Nike": 18,
    "Adidas": 12,
    "New Balance": 8,
    "Saucony": 5,
    "ASICS": 4
  },
  "bySize": {
    "8": 7,
    "9": 10,
    "10": 15,
    "10.5": 8,
    "11": 7
  },
  "byWidth": {
    "Regular": 42,
    "Wide": 4,
    "Extra Wide": 1
  },
  "pending": 38,
  "notified": 9,
  "withStyleCode": 12,
  "withProductUrl": 15
}
```

---

## 💡 Common Scenarios

### Scenario 1: Found exact shoe with style code
```javascript
// User requested: Nike Pegasus 41, Style Code FD2722-001, Size 9.5
notifyUsersForShoe(
  'male',
  'Nike',
  'Pegasus 41',
  'Black/White',
  '9.5',
  'Regular',
  'https://superbalist.com/nike-pegasus-41-fd2722-001',
  2199,
  'Superbalist'
);
```

### Scenario 2: Found brand on sale, any model
```javascript
// Notify anyone who wants Adidas in size 10, regardless of model
notifyUsersForShoe(
  'male',
  'Adidas',
  'Any',              // Matches all models
  'Any',              // Matches all colors
  '10',
  'Regular',
  'https://sportscene.co.za/sale/adidas',
  999,
  'Sportscene'
);
```

### Scenario 3: Wide width shoe found
```javascript
// Someone requested New Balance wide width
notifyUsersForShoe(
  'male',
  'New Balance',
  'Fresh Foam 1080',
  'Navy/White',
  '10',
  'Wide',             // ONLY notifies Wide width requests
  'https://totalstports.co.za/new-balance-1080-wide',
  2499,
  'Totalsports'
);
```

### Scenario 4: Multiple retailers have same shoe
```javascript
// Run the function multiple times with different retailers
// This way users get notified about ALL available options

// First retailer
notifyUsersForShoe('female', 'Nike', 'Pegasus 41', 'Pink/White', '8', 'Regular',
  'https://takealot.com/nike-pegasus-41', 2199, 'Takealot');

// Second retailer (won't notify again - status already 'notified')
// You'd need to manually update status back to 'pending' first
```

### Scenario 5: Unisex sizing
```javascript
notifyUsersForShoe(
  'unisex',           // Unisex category
  'Converse',
  'Chuck Taylor All Star',
  'White',
  '9',
  'Regular',
  'https://edgars.co.za/converse-chuck-taylor',
  899,
  'Edgars'
);
```

---

## 🔧 How to Run These Functions

### Step 1: Open Apps Script
1. Open your Google Sheet
2. Go to **Extensions > Apps Script**

### Step 2: Paste Function Call
1. Copy one of the examples above
2. Paste it at the bottom of the script (or replace the test function)
3. Or use the existing `testNotification()` function and modify it

### Step 3: Run It
1. Click the **Run** button (▶️)
2. First time: You'll need to authorize the script
3. Check the **Execution log** to see results
4. Check your sheet to see updated statuses

### Step 4: Check Results
- Look at the **Execution log** for confirmation
- Check your **Google Sheet** - statuses should be updated
- Check the notified users' **emails**

---

## 🐛 Troubleshooting

### Problem: No users were notified
**Possible causes:**
1. ✅ Check exact spelling of brand/model/color in sheet
2. ✅ Make sure size matches exactly (including decimal points)
3. ✅ Check if status is `'pending'` (not `'notified'`)
4. ✅ Verify gender matches
5. ✅ Check width matches (defaults to `'Regular'` if empty)

**Solution:** Run `getAlertStatistics()` to see what data you have, then match your parameters exactly.

### Problem: Function doesn't run
**Possible causes:**
1. Script hasn't been authorized
2. Syntax error in parameters

**Solution:**
- Click **Run** and authorize when prompted
- Check for typos, missing quotes, or missing commas

### Problem: Email not received
**Possible causes:**
1. Email in spam folder
2. Gmail daily sending limit reached (100 emails/day for free accounts)
3. Status was already `'notified'`

**Solution:**
- Check spam folder
- Wait 24 hours if limit reached
- Manually change status back to `'pending'` in sheet

### Problem: Wrong timestamp format
**Possible causes:**
1. Google Sheets timezone settings

**Solution:**
- Go to **File > Settings** in Google Sheets
- Check **Locale** and **Time zone**
- Should be set to South Africa (GMT+2)

---

## 📝 Quick Checklist Before Notifying

- [ ] Found the shoe in stock at retailer
- [ ] Have the full product URL
- [ ] Know the exact price
- [ ] Checked spelling of brand/model in your sheet
- [ ] Confirmed the size exists in your requests
- [ ] Checked width matches (especially for wide shoes)
- [ ] Ready to copy/paste retailer name

---

## 💡 Tips to Make Your Life Easier

### 1. Don't know the exact color? Use 'Any'
If you find a Nike Pegasus 41 on sale but it's in a different color than what someone requested, use `'Any'` for the color parameter. This will notify everyone who wants that shoe, regardless of color.

**Example:** You find the shoe in "Navy/Orange" but someone requested "Black/White"
```javascript
notifyUsersForShoe('male', 'Nike', 'Pegasus 41', 'Any', '10', 'Regular', 'https://...', 1999, 'Takealot');
```

### 2. See what people are asking for
Before you spend time searching, run `getAlertStatistics()` to see which brands and sizes are most requested. Focus your search efforts there.

**Example:** If 15 people want Nike size 10, that's where you should search first!

### 3. Save yourself typing
Copy one of the example notification calls from this guide and keep it in a text file. When you find a shoe, just change the brand, size, link, and price. No need to type it from scratch every time.

### 4. Check multiple stores at once
Open Takealot, Superbalist, and Sportscene all in separate browser tabs. Search for the same shoe across all of them. When you find it, notify users right away.

### 5. Learn when stores restock
You'll start noticing patterns - like Takealot restocks Nike on Wednesdays, or Sportscene has sales on Fridays. Jot these down so you know when to check.

### 6. Most people wear regular width
Don't stress about width unless you see a specific request for Wide or Narrow shoes. Most people (95%+) wear regular width, so focus your searches there.

### 7. Get alerts from Google
Go to google.com/alerts and create alerts for "Nike Pegasus 41 sale" or "Adidas restock South Africa". Google will email you when new results appear online, so you don't have to manually check every day.

---

## 📞 Need Help?

If you encounter issues:
1. Check the **Execution log** in Apps Script
2. Review your Google Sheet for exact field values
3. Make sure your Apps Script deployment is set to "Anyone" access
4. Verify column order matches the guide

---

**Last Updated:** March 2026
**Version:** 2.0 (with Width support)
