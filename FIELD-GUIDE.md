# FindMySize - Field Guide

## Why We Added These Fields

### ✅ Color (Required)
**Why it's critical:**
- Nike Pegasus 41 comes in 15+ colorways
- Users want specific color, not "any black shoe"
- Different colors = different prices sometimes
- Different colors sell out at different rates

**Example:**
- User wants: Nike Pegasus 41 **Black/White**
- Without color field: You might notify them about **Blue/Volt** version
- Result: Wasted notification, frustrated user

### ✅ Style Code / SKU (Optional but powerful)
**Why it's the secret weapon:**
- **100% accuracy** across retailers
- Same shoe, different names:
  - Takealot: "Nike Air Pegasus 41 Mens Running Shoe"
  - Superbalist: "Pegasus 41 Running Sneakers"
  - Sportscene: "Air Zoom Pegasus 41"
- Style code is ALWAYS the same: `FD2722-001`

**Where users find it:**
- Product page (usually in description)
- Shoe box label
- Under the tongue of the shoe
- Nike calls it "Style"
- Adidas calls it "Article number"

**Real example:**
- Style Code: `FD2722-001`
  - FD2722 = Model (Pegasus 41)
  - 001 = Colorway (Black/White)
- Different code: `FD2722-402` = Same model, Blue colorway

**Power move:** If user provides style code, you can:
1. Search exact code across ALL retailers
2. Match 100% accurately even if names differ
3. Track price history for that exact shoe
4. Never send wrong notification

### ✅ Product URL (Optional but helpful)
**Why it matters:**
- User saw shoe somewhere, pastes link
- You can extract:
  - Exact model
  - Exact color
  - Style code (from URL or page)
  - Retailer price
  - Product image

**Example URL:**
```
https://www.takealot.com/nike-pegasus-41-black-white/PLID89564321
```

From this you can:
- Scrape the product page
- Get style code automatically
- See current price
- Monitor when it comes back in stock
- Know which retailer they prefer

---

## Form Fields - Complete Reference

| Field | Required? | Purpose | Example |
|-------|-----------|---------|---------|
| **Brand** | ✅ Required | Filter by manufacturer | Nike, Adidas |
| **Model** | ❌ Optional | Specific shoe model | Pegasus 41, Ultraboost |
| **Color** | ✅ Required | Exact colorway | Black/White, Triple Black |
| **Style Code** | ❌ Optional | Universal identifier | FD2722-001 |
| **Product URL** | ❌ Optional | Where they saw it | https://takealot.com/... |
| **Size** | ✅ Required | Their shoe size | 10.5 |
| **Email** | ✅ Required | Contact info | user@example.com |

---

## Matching Logic Priority

When notifying users, match in this order:

### Level 1: Perfect Match (Best)
- Brand ✓
- Model ✓
- Color ✓
- Style Code ✓
- Size ✓

**Confidence: 100%** - Notify immediately

### Level 2: Strong Match
- Brand ✓
- Model ✓
- Color ✓
- Size ✓
- Style Code: Not provided

**Confidence: 95%** - Notify immediately

### Level 3: Good Match
- Brand ✓
- Model: "Any" (user flexible)
- Color ✓
- Size ✓

**Confidence: 80%** - Notify with disclaimer

### Level 4: Weak Match
- Brand ✓
- Model: "Any"
- Color: Different than requested
- Size ✓

**Confidence: 50%** - Ask user first before notifying

---

## Database Structure (Google Sheets)

### Column Layout:
```
A: Timestamp
B: Brand
C: Model
D: Color
E: Style Code
F: Product URL
G: Size
H: Email
I: Status
J: Notified Date (optional)
```

### Example Row:
```
2026-03-16 10:30 | Nike | Pegasus 41 | Black/White | FD2722-001 | https://takealot.com/... | 10.5 | user@email.com | pending
```

---

## How Style Codes Work by Brand

### Nike
- Format: `XXXXXX-YYY`
- Example: `FD2722-001`
- Where: Product page, box label
- Called: "Style" or "Style Code"

### Adidas
- Format: `XXXXXX` or `XX-XXXX-XX`
- Example: `HQ4199` or `GY-0001-20`
- Where: Product page
- Called: "Article number" or "Model number"

### New Balance
- Format: `MXXXX` or `WXXXX`
- Example: `M1080B13` (M = Men's, W = Women's)
- Where: Model code + version
- Called: "Model"

### ASICS
- Format: `XXXXXXX-XXX`
- Example: `1011B440-020`
- Where: Product page
- Called: "Style number"

### Puma
- Format: `XXXXXX-XX`
- Example: `376847-01`
- Where: Product page
- Called: "Style" or "Item number"

---

## Practical Examples

### Scenario 1: User Provides Everything
```
Brand: Nike
Model: Pegasus 41
Color: Black/White
Style Code: FD2722-001
Size: 10.5
```

**Your job:**
- Search for style code `FD2722-001` across retailers
- Match size 10.5
- 100% confidence match

### Scenario 2: User Knows Color, Not Code
```
Brand: Nike
Model: Pegasus 41
Color: Black/White
Style Code: Not provided
Size: 10.5
```

**Your job:**
- Search "Nike Pegasus 41 Black White"
- Verify colorway manually
- 95% confidence match

### Scenario 3: User Just Wants "Any Black Nike"
```
Brand: Nike
Model: Any
Color: Black
Style Code: Not provided
Size: 10.5
```

**Your job:**
- Find any black Nike in size 10.5 on sale
- Cast wide net
- Send multiple options

### Scenario 4: User Pastes Product Link
```
Brand: Nike
Product URL: https://www.takealot.com/nike-pegasus-41-black/PLID12345
Size: 10.5
```

**Your job:**
- Visit that URL
- Extract: Model, Color, Style Code
- Monitor that exact product page
- 100% confidence they want THIS shoe

---

## Benefits of This Approach

### For You (The Business):
1. **Fewer mistakes** = happier customers
2. **Higher conversion** = more affiliate commissions
3. **Better data** = know exactly what sells
4. **Scalability** = easier to automate later

### For Users:
1. **Right shoe first time** = no disappointment
2. **Faster notifications** = style codes are faster to search
3. **Better matches** = get what they actually want

### For Automation (Later):
1. **Style codes = API-friendly** (easy to search)
2. **Product URLs = scrapable** (extract all data)
3. **Color matching = visual AI** (match by image)

---

## Tips for Manual Processing

### When Checking Retailers:

1. **User provided style code?**
   - Search CTRL+F for that exact code on retailer pages
   - Fastest method

2. **No style code?**
   - Search: "Brand Model Color"
   - Verify manually it's the right colorway

3. **Product URL provided?**
   - Visit that specific page
   - Check if size is back in stock
   - Notify immediately if yes

4. **Multiple users want same shoe?**
   - Group them together
   - One search → notify all matching users
   - Use `notifyUsersForShoe()` function

---

## Common Questions

**Q: What if user doesn't know the style code?**
A: That's fine! It's optional. You'll just need to verify the match manually.

**Q: Should I make style code required?**
A: No. Most casual buyers don't know it. Keep it optional but encourage it with helper text.

**Q: What if someone enters wrong color?**
A: Better to get "Black" than nothing. You can verify during notification.

**Q: Can I auto-extract style code from product URL?**
A: Yes! Phase 2 feature. Use web scraping to extract it automatically.

**Q: Do all brands use style codes?**
A: Yes, all major brands do. Small/local brands might not.

---

## Next Steps

### Phase 1 (Now):
- Collect data with new fields
- Process manually
- Learn what people actually request

### Phase 2 (Month 2-3):
- Build scraper to check retailers automatically
- Use style codes for exact matching
- Extract style codes from product URLs

### Phase 3 (Month 4+):
- Visual matching (upload shoe image)
- AI-powered colorway matching
- Automatic style code lookup

---

## Summary

**The new fields solve THE CORE PROBLEM:**

❌ **Before:**
- "I notified them about Nike Pegasus... but it was the wrong color"
- "They wanted Black/White, I sent Blue/Volt"
- "Same shoe name, but different retailers = confusion"

✅ **After:**
- Style code = 100% accuracy
- Color = no confusion
- Product URL = see exactly what they want
- Perfect notifications = happy customers = more sales

**You nailed it with this question.** These fields are the difference between "pretty good idea" and "professional service."
