# Database Structure for FindMySize MVP

## Simple Storage Options (Choose One)

### Option 1: Google Sheets (Recommended for MVP)
**Easiest, no coding required**

Columns:
- Timestamp (Request Received)
- Gender (Male/Female/Unisex)
- Brand
- Model
- Color
- Style Code
- Product URL
- Size
- Width (Regular/Wide/Extra Wide/Narrow)
- Email
- Status (Pending/Notified/Fulfilled/Cancelled/Expired)
- Notified At (Date/Time when customer was notified)
- Retailer Found (Which store had stock)
- Price When Notified
- Notes (Manual tracking/comments)

**Setup:**
1. Create a Google Sheet with these columns
2. Go to Extensions > Apps Script
3. Paste the script from `google-script.js` (see Setup Instructions)
4. Deploy as Web App
5. Copy the URL to your HTML form

---

### Option 2: Airtable (Good for MVP)
**Easy, has API, nice interface**

Base Structure:
- Table: "Alert Requests"
- Fields:
  - Brand (Single select)
  - Model (Single line text)
  - Size (Single line text)
  - Email (Email)
  - Status (Single select: Pending, Notified)
  - Created (Date)

**Pros:**
- Free tier: 1,200 records
- Built-in forms
- Easy to filter and search
- Can trigger automations

---

### Option 3: Simple JSON File (For Testing)
**Start here if you want to test locally**

```json
{
  "alerts": [
    {
      "id": 1,
      "brand": "Nike",
      "model": "Pegasus 41",
      "size": "10.5",
      "email": "user@example.com",
      "status": "pending",
      "created": "2026-03-16T10:30:00Z"
    }
  ]
}
```

---

### Option 4: CSV File (Simple)
**Good for manual processing**

```csv
timestamp,brand,model,size,email,status
2026-03-16 10:30:00,Nike,Pegasus 41,10.5,user@example.com,pending
2026-03-16 11:15:00,Adidas,Any,10,john@example.com,pending
```

---

## Full Database Schema (For Later - When You Scale)

When you're ready to build a proper backend, use this structure:

### Tables:

#### 1. brands
```sql
CREATE TABLE brands (
    brand_id INT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. shoe_models
```sql
CREATE TABLE shoe_models (
    model_id INT PRIMARY KEY AUTO_INCREMENT,
    brand_id INT,
    model_name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
);
```

#### 3. alert_requests
```sql
CREATE TABLE alert_requests (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female', 'unisex') NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200),
    color VARCHAR(200),
    style_code VARCHAR(100),
    product_url TEXT,
    size VARCHAR(10) NOT NULL,
    width ENUM('Regular', 'Wide', 'Extra Wide', 'Narrow') DEFAULT 'Regular',
    status ENUM('pending', 'notified', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    retailer_found VARCHAR(100),
    price_when_notified DECIMAL(10,2),
    notification_count INT DEFAULT 0,
    unsubscribe_token VARCHAR(64) UNIQUE,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 90 DAY),
    notes TEXT,
    INDEX idx_status (status),
    INDEX idx_brand_size (brand, size),
    INDEX idx_gender_brand (gender, brand),
    INDEX idx_email (email),
    INDEX idx_style_code (style_code)
);
```

#### 4. shoe_inventory (tracks actual availability)
```sql
CREATE TABLE shoe_inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    brand VARCHAR(100),
    model VARCHAR(200),
    size VARCHAR(10),
    retailer VARCHAR(100),
    price DECIMAL(10,2),
    in_stock BOOLEAN DEFAULT TRUE,
    product_url TEXT,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brand_model_size (brand, model, size)
);
```

---

## Data You Need to Collect

### Currently Collecting (MVP):
- Email (required)
- Gender (required)
- Brand (required)
- Size (required)
- Model (optional)
- Color (optional if style code/URL provided)
- Style Code (optional)
- Product URL (optional)
- Width (optional, defaults to Regular)

### Tracking Fields:
- Request received timestamp (auto)
- Status (Pending/Notified/etc)
- Notified at timestamp
- Retailer found (where you found the stock)
- Price when notified
- Notes (for manual tracking)

### Later (v2):
- Target price alerts
- Preferred retailers
- Email notification preferences
- Multiple size alerts per user
- SMS notifications

---

## Privacy & GDPR Compliance Notes

Since you're collecting emails:
1. Add a checkbox: "I agree to receive stock alerts"
2. Provide unsubscribe option in every email
3. Store consent timestamp
4. Add privacy policy link
5. Allow users to request data deletion

---

## Initial Data Processing Flow

```
User submits form
    ↓
Store in spreadsheet/database
    ↓
You manually check retailers (for now)
    ↓
When found → Send email
    ↓
Mark as "notified"
```

Later automate with web scraping or retailer APIs.

---

## Quick Setup: Google Sheets Column Headers

Copy these exact column headers into Row 1 of your Google Sheet:

```
Timestamp | Gender | Brand | Model | Color | Style Code | Product URL | Size | Width | Email | Status | Notified At | Retailer Found | Price When Notified | Notes
```

**Column Descriptions:**

1. **Timestamp** - Auto-filled when form submitted
2. **Gender** - Male/Female/Unisex
3. **Brand** - Nike, Adidas, etc.
4. **Model** - Pegasus 41, Ultraboost, etc.
5. **Color** - Black/White, Red, etc.
6. **Style Code** - FD2722-001, etc.
7. **Product URL** - Full URL from retailer
8. **Size** - 10.5, 9, etc.
9. **Width** - Regular/Wide/Extra Wide/Narrow
10. **Email** - Customer email
11. **Status** - Pending/Notified/Fulfilled/Cancelled/Expired (manually update)
12. **Notified At** - Date/time you sent notification (manually update)
13. **Retailer Found** - Takealot, Superbalist, etc. (manually update)
14. **Price When Notified** - Price at notification time (manually update)
15. **Notes** - Any additional comments (manually update)
