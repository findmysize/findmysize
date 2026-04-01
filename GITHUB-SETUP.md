# GitHub Setup Guide for FindMySize

## ✅ What to Push to GitHub

### Required Files (MUST PUSH):
```
✅ index.html                    # Main form
✅ about.html                    # About page
✅ contact.html                  # Contact page
✅ faq.html                      # FAQ page
✅ privacy-policy.html           # Privacy policy
✅ terms-of-service.html         # Terms of service
✅ google-apps-script.js         # Backend code
✅ email-template.html           # Email template
✅ README.md                     # This gets updated!
✅ .gitignore                    # Tells Git what NOT to push
```

### Documentation (SHOULD PUSH):
```
✅ NOTIFICATION-GUIDE.md         # User guide for notifications
✅ SCALING-GUIDE.md              # When to migrate databases
✅ AFFILIATE-READINESS-CHECKLIST.md
✅ CONTACT-FAQ-SETUP.md
✅ database-structure.md         # Database schema
✅ GITHUB-SETUP.md               # This file
```

### Optional (NICE TO HAVE):
```
✅ QUICK-START.md                # Setup instructions
✅ SETUP-INSTRUCTIONS.md         # Detailed setup
✅ FIELD-GUIDE.md                # Field documentation
✅ VALIDATION-GUIDE.md           # Validation logic
✅ Other guide files...
```

---

## ❌ What NOT to Push to GitHub

### NEVER PUSH THESE:

```
❌ sample-data.csv               # Contains user emails - PRIVACY!
❌ Any .csv files                # May contain user data
❌ Google Sheets exports         # Contains personal data
❌ .env files                    # API keys/secrets
❌ config.local.js               # Local configuration
❌ Personal notes                # Your private notes
```

**Why?**
- User emails are private (POPIA violation if leaked!)
- API keys can be stolen
- Personal notes may contain sensitive info

The `.gitignore` file I created will automatically prevent these from being pushed.

---

## 🚀 Step-by-Step GitHub Setup

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New Repository"
3. Name it: `FindMySize` or `findmysize`
4. Description: "Free shoe size notification service for South Africa"
5. Choose **Public** or **Private**:
   - **Public** = Anyone can see code (good for portfolio)
   - **Private** = Only you can see (more secure)
6. ✅ Check "Add a README" - NO (you already have one)
7. Click "Create Repository"

---

### Step 2: Initialize Git in Your Project

Open your terminal in the FindMySize folder:

```bash
# Navigate to your project
cd C:/Users/CP350784/Projects/FindMySize

# Initialize git (if not already done)
git init

# Check what will be committed
git status
```

---

### Step 3: Review What Will Be Pushed

```bash
# See what files are staged
git status

# Make sure NO .csv files show up!
# Make sure NO .env files show up!
```

**If you see any .csv or sensitive files:**
```bash
# Remove them from git tracking
git rm --cached sample-data.csv
git rm --cached *.csv
```

---

### Step 4: Add Files to Git

```bash
# Add all files (gitignore will exclude sensitive ones)
git add .

# Or add specific files one by one (safer):
git add index.html
git add about.html
git add contact.html
git add faq.html
git add privacy-policy.html
git add terms-of-service.html
git add google-apps-script.js
git add email-template.html
git add README.md
git add .gitignore
git add *.md  # All documentation files
```

---

### Step 5: Commit Your Changes

```bash
# Create your first commit
git commit -m "Initial commit - Complete FindMySize website with all pages"
```

---

### Step 6: Connect to GitHub

Copy the commands from your new GitHub repository page. They'll look like:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR-USERNAME/FindMySize.git

# OR if you use SSH:
git remote add origin git@github.com:YOUR-USERNAME/FindMySize.git
```

---

### Step 7: Push to GitHub

```bash
# Push your code
git push -u origin main

# OR if it's called master:
git push -u origin master
```

---

### Step 8: Verify on GitHub

1. Go to your repository on GitHub
2. Check that you see all the HTML files
3. Check that README.md displays nicely
4. **VERIFY:** No `.csv` files visible
5. **VERIFY:** No `.env` files visible

---

## 📋 Quick Push Checklist

Before every push, verify:

```
[ ] No .csv files (user data)
[ ] No .env files (API keys)
[ ] No personal notes
[ ] README.md is updated
[ ] All HTML files included
[ ] .gitignore is present
```

---

## 🔄 Updating Your Repository

After making changes:

```bash
# Check what changed
git status

# Add your changes
git add index.html  # Or whatever files you changed
# Or add everything:
git add .

# Commit with a message
git commit -m "Add width field to form"

# Push to GitHub
git push
```

---

## 💡 Common Git Commands

```bash
# See what files changed
git status

# See what changed in files
git diff

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest from GitHub
git pull

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard
```

---

## 🌐 Hosting on GitHub Pages (Optional)

If you want to host your site for FREE on GitHub Pages:

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll to "Pages" section
4. Under "Source", select "main" branch
5. Click "Save"
6. Wait 1-2 minutes
7. Your site will be live at: `https://YOUR-USERNAME.github.io/FindMySize/`

**Note:** GitHub Pages only works with Public repositories on free accounts.

---

## 🔒 Security Best Practices

### DO:
✅ Use `.gitignore` to exclude sensitive files
✅ Review `git status` before committing
✅ Keep API keys in `.env` files (not in code)
✅ Use environment variables for secrets
✅ Make repository private if you're cautious

### DON'T:
❌ Commit `.csv` files with user emails
❌ Commit API keys or passwords
❌ Commit Google Sheets data exports
❌ Commit personal notes with sensitive info
❌ Share your Apps Script deployment URL publicly

---

## 📊 Recommended Repository Structure

```
FindMySize/
├── .git/                       # Git folder (automatic)
├── .gitignore                  # What to ignore
├── README.md                   # Main documentation
│
├── Website Files/
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── faq.html
│   ├── privacy-policy.html
│   └── terms-of-service.html
│
├── Backend/
│   ├── google-apps-script.js
│   ├── email-template.html
│   └── database-structure.md
│
└── Documentation/
    ├── NOTIFICATION-GUIDE.md
    ├── SCALING-GUIDE.md
    ├── AFFILIATE-READINESS-CHECKLIST.md
    ├── GITHUB-SETUP.md
    └── [Other guides...]
```

---

## 🤔 Should You Make It Public or Private?

### Public Repository (Recommended for Portfolio):
**Pros:**
- Good for your portfolio/resume
- Shows your work to potential employers
- Open source contribution
- Can use GitHub Pages for free hosting

**Cons:**
- Anyone can see your code
- Competitors can copy your idea

**Recommendation:** Public is fine! The code itself isn't the competitive advantage - your execution, marketing, and user base is.

### Private Repository:
**Pros:**
- Code stays private
- More security
- Control who sees it

**Cons:**
- Not usable for portfolio
- GitHub Pages costs money
- Harder to collaborate

---

## 🎯 What to Update in README.md

Before pushing, update these in README.md:
```
[ ] Change "YOUR_USERNAME" to your actual GitHub username
[ ] Add your website URL (if deployed)
[ ] Update any placeholder text
[ ] Add a screenshot (optional but nice)
```

---

## 📸 Adding Screenshots (Optional)

Make your README look professional:

1. Take screenshot of your form
2. Save as `screenshot.png` in project folder
3. Add to README.md:
```markdown
## 📸 Screenshot
![FindMySize Screenshot](screenshot.png)
```

4. Commit and push:
```bash
git add screenshot.png
git add README.md
git commit -m "Add screenshot"
git push
```

---

## 🆘 Troubleshooting

### "Fatal: not a git repository"
```bash
git init
```

### "Nothing to commit"
```bash
# Check if files are staged
git status

# Add files
git add .
```

### "Permission denied (publickey)"
Use HTTPS instead:
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/FindMySize.git
```

### "Failed to push"
```bash
# Pull first, then push
git pull origin main --rebase
git push
```

### "Accidentally pushed sensitive file!"
1. Remove from repository:
```bash
git rm --cached sensitive-file.csv
git commit -m "Remove sensitive file"
git push
```

2. Delete from GitHub history (advanced):
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch sensitive-file.csv" \
  --prune-empty --tag-name-filter cat -- --all
git push --force
```

---

## ✅ Final Checklist

Before your first push:
```
[ ] Created .gitignore file
[ ] Reviewed git status (no .csv files!)
[ ] Updated README.md with your info
[ ] Removed any sample-data.csv
[ ] Removed any personal notes
[ ] Committed all website files
[ ] Committed all documentation
[ ] Ready to push!
```

After push:
```
[ ] Verified on GitHub - all files present
[ ] Verified NO sensitive data visible
[ ] README.md displays correctly
[ ] Consider enabling GitHub Pages
```

---

## 🎉 You're Done!

Your code is now safely backed up on GitHub and ready to share with the world (if public) or keep private (if private).

**Next steps:**
1. Deploy to Netlify/Vercel for actual hosting
2. Apply to affiliate programs
3. Start marketing
4. Build your user base!

---

**Need help?** Check out [GitHub's documentation](https://docs.github.com) or ask in the Contact page!
