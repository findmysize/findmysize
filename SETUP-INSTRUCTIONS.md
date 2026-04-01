# FindMySize - Setup Instructions

## What You Have

Your MVP is ready! Here's what's included:

1. **index.html** - Beautiful landing page with alert form (NO sign-in required)
2. **google-apps-script.js** - Backend script (connects to Google Sheets)
3. **database-structure.md** - Database design for future scaling

## Quick Start (15 Minutes Setup)

### Step 1: Create Google Sheet Database

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet called "FindMySize Alerts"
3. Add these column headers in Row 1:
   ```
   Timestamp | Brand | Model | Size | Email | Status
   ```

### Step 2: Connect Google Apps Script

1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete any default code
3. Copy everything from `google-apps-script.js` and paste it
4. Click the **Save** icon (💾)
5. Name it "FindMySize Handler"

### Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon ⚙️ and select **Web app**
3. Settings:
   - Description: "FindMySize Form Handler"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Authorize the app (Google will ask for permissions)
6. **COPY THE WEB APP URL** - you'll need it next

### Step 4: Connect Form to Google Script

1. Open `index.html` in a text editor
2. Find this section (around line 187):

```javascript
// TODO: Replace this with your actual backend endpoint
```

3. Replace the commented code with:

```javascript
// Send to Google Sheets
fetch('YOUR_WEB_APP_URL_HERE', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
})
.then(() => {
    document.getElementById('successMessage').classList.add('show');
    document.getElementById('alertForm').reset();
})
.catch(error => {
    alert('Error submitting request. Please try again.');
    console.error('Error:', error);
});
```

4. Replace `YOUR_WEB_APP_URL_HERE` with the URL you copied
5. Save the file

### Step 5: Test Your Form

1. Open `index.html` in a web browser (just double-click it)
2. Fill out the form with test data
3. Click "Notify Me When Available"
4. Check your Google Sheet - you should see a new row!

---

## How to Launch It Online

### Option A: Free Hosting (Recommended for MVP)

**Using Netlify (Easiest):**
1. Go to [Netlify](https://www.netlify.com)
2. Sign up (free)
3. Drag and drop your `index.html` file
4. Done! You get a URL like `findmysize.netlify.app`

**Using GitHub Pages:**
1. Create GitHub account
2. Create a repository called "findmysize"
3. Upload `index.html`
4. Enable GitHub Pages in Settings
5. Your site: `yourusername.github.io/findmysize`

**Using Vercel:**
1. Go to [Vercel](https://vercel.com)
2. Sign up (free)
3. Import your project folder
4. Deploy automatically

### Option B: Custom Domain (Later)

1. Buy domain: `findmysize.co.za` (R150/year from [Domains.co.za](https://domains.co.za))
2. Point it to your Netlify/Vercel site
3. Done!

---

## How to Process Alert Requests

### Manual Process (First 100 Users)

Every day:

1. Open your Google Sheet
2. Look at pending requests
3. Check retailers for those shoes:
   - [Takealot](https://www.takealot.com)
   - [Superbalist](https://www.superbalist.com)
   - [Sportscene](https://www.sportscene.co.za)
   - [Zando](https://www.zando.co.za)

4. When you find a match:
   - Use the `notifyUsersForShoe()` function in Google Apps Script
   - Or manually send an email

### Example: Sending Notification

In Google Apps Script, run:

```javascript
notifyUsersForShoe(
  'Nike',                           // brand
  'Pegasus 41',                     // model
  '10.5',                           // size
  'https://takealot.com/...',       // link
  1999                              // price
);
```

This emails ALL users who requested Nike size 10.5.

---

## Understanding Your Data

### View Statistics

In Google Apps Script, run the `getAlertStatistics()` function:

```javascript
getAlertStatistics()
```

This shows:
- Total requests
- Most popular brands
- Most requested sizes
- Pending vs notified

### Example Output:
```json
{
  "total": 247,
  "byBrand": {
    "Nike": 142,
    "Adidas": 68,
    "New Balance": 37
  },
  "bySize": {
    "10.5": 89,
    "10": 67,
    "11": 58
  },
  "pending": 201,
  "notified": 46
}
```

This tells you what to focus on!

---

## Cost Breakdown

### MVP (First 3 Months)
- Domain: R150/year (optional)
- Hosting: **FREE** (Netlify/Vercel)
- Database: **FREE** (Google Sheets)
- Email: **FREE** (Google Apps Script)
- **Total: R0-R150**

### Growing (1,000+ users)
- Hosting: Still FREE
- Email service (SendGrid): R0-R300/month
- Better database (optional): R200/month
- **Total: R200-R500/month**

---

## Marketing Your MVP

### Week 1: Get First 100 Users

**Facebook Groups:**
- Search "sneakers South Africa"
- Search "running shoes South Africa"
- Post: "I built a free tool that alerts you when your shoe size is back in stock. Looking for testers."

**Reddit:**
- r/southafrica
- r/Sneakers
- Post genuinely asking for feedback

**WhatsApp/Friends:**
- Share with friends
- Ask for honest feedback

### Week 2-4: Scale to 1,000 Users

**Create Content:**
- "Why Size 10.5 Always Sells Out (And What To Do About It)"
- Post on Medium, LinkedIn

**Partner with Communities:**
- Contact Parkrun South Africa
- Contact running clubs
- Offer free alerts to members

**Collect Testimonials:**
- When you successfully notify someone, ask:
  - "Can I share your success story?"
  - Use it for credibility

---

## Next Steps (After 1,000 Users)

### Automate Retail Checking

Instead of manual checking, use:
1. **Web scraping** (Python + BeautifulSoup)
2. **Retailer APIs** (apply for partnerships)
3. **Price tracking tools** (integrate with existing services)

### Add Features

1. **Price drop alerts** - notify when price falls below target
2. **Multiple sizes** - users can track 2-3 sizes
3. **Sale alerts** - notify of any deals
4. **SMS notifications** - premium feature (R29/month)

### Monetization

1. **Affiliate commissions** (8-12% per sale)
2. **Premium tier** (R39/month for priority alerts)
3. **Retailer partnerships** (pay for placement)
4. **Data licensing** (sell demand data to brands)

---

## Troubleshooting

### Form submits but nothing appears in Google Sheet

1. Check Apps Script permissions (might need to re-authorize)
2. Check deployment settings (must be "Anyone" can access)
3. Check browser console for errors (F12)
4. Try re-deploying the script

### Email notifications not sending

1. Gmail has daily sending limits (100/day free)
2. Check spam folder
3. Verify email addresses are valid
4. Consider using SendGrid for higher volume

### Too many requests to handle manually

Time to automate! Options:
1. Hire a developer (R500-R2000 for basic automation)
2. Use no-code tools (Zapier + web scrapers)
3. Build it yourself with Python (see scaling guide)

---

## Support

If you get stuck:
1. Check Google Apps Script logs (View > Logs)
2. Test with simple console.log() statements
3. Verify URLs are correct (HTTP vs HTTPS)

---

## Success Metrics to Track

### Month 1:
- [ ] 100 alert requests
- [ ] 5 successful notifications sent
- [ ] 2 confirmed purchases

### Month 3:
- [ ] 1,000 alert requests
- [ ] 100+ notifications sent
- [ ] First affiliate commission

### Month 6:
- [ ] 5,000 users
- [ ] Automate retail checking
- [ ] R5,000+ monthly revenue

---

## Legal Stuff (Don't Skip!)

### Add to Your Site:

1. **Privacy Policy** (required for collecting emails)
   - Explain what data you collect
   - How you use it
   - How to unsubscribe

2. **Terms of Service**
   - No guarantee of availability
   - User responsible for purchases
   - You're just a notification service

3. **Unsubscribe Option**
   - Every email must have an unsubscribe link
   - Respond within 48 hours

Templates available at [TermsFeed](https://www.termsfeed.com/)

---

## You're Ready to Launch!

**Final Checklist:**
- [ ] Google Sheet created with correct columns
- [ ] Apps Script deployed as Web App
- [ ] index.html connected to Web App URL
- [ ] Form tested (check Google Sheet)
- [ ] Site hosted online (Netlify/Vercel)
- [ ] Posted in 1-2 communities for feedback

**Launch it and see what happens!**

You can iterate and improve based on real user feedback. Don't wait for perfection - get it in front of people and learn what they actually need.

Good luck! 🚀
