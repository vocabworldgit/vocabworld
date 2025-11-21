# 🛡️ Security Guide for Voco

## 🚨 CRITICAL: API Key Security

Your repository has been secured to protect API keys and sensitive data. Follow these guidelines:

### ✅ What's Already Secured:

1. **Environment Variables**: All API keys moved to `.env.local`
2. **Git Protection**: Enhanced `.gitignore` prevents accidental commits
3. **Code Updates**: Hardcoded API keys replaced with environment variables
4. **Security Warnings**: Added warnings when keys are missing

### 📋 Setup Instructions:

1. **Copy Environment Template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add Your Real API Keys to `.env.local`**:
   ```bash
   # Replace with your actual keys
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_key_here
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_actual_elevenlabs_key_here
   ```

3. **Verify Protection**:
   ```bash
   # Check that .env.local is ignored by Git
   git status
   # Should NOT show .env.local in the list
   ```

### 🔒 Security Checklist:

- [x] `.env.local` created with real API keys
- [x] `.env.example` committed (safe template)
- [x] `.gitignore` updated to protect sensitive files
- [x] Hardcoded API keys removed from source code
- [x] Environment variable validation added
- [ ] Repository set to **Private** on GitHub
- [ ] GitHub security features enabled

### 🚫 NEVER Commit These Files:

```
.env.local          # Your real API keys
.env.production     # Production secrets
*.key              # Key files
*secret*           # Secret files
api_keys.*         # API key backups
```

### ✅ Safe to Commit:

```
.env.example       # Template without real keys
.gitignore         # Protection rules
src/               # Your application code
README.md          # Documentation
```

### 🛠️ API Key Management:

The new `utils/secure-api-manager.js` provides:
- Centralized API key validation
- Security warnings for missing keys
- Fallback handling for optional services
- Environment status checking

### 📱 GitHub Repository Security:

1. **Set Repository to Private**
2. **Enable Security Features**:
   - Go to Settings → Security & analysis
   - Enable "Secret scanning"
   - Enable "Dependency scanning"
   - Enable "Code scanning"

### 🆘 If You Accidentally Commit API Keys:

1. **Immediately Rotate Keys**:
   - Generate new API keys in your service dashboards
   - Update `.env.local` with new keys

2. **Clean Git History**:
   ```bash
   # Remove sensitive files from Git history
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force Push**:
   ```bash
   git push origin --force --all
   ```

### 🔍 Regular Security Checks:

Run this command to check your security status:
```bash
node -e "require('./utils/secure-api-manager.js').logSecurityStatus()"
```

### 📞 Security Support:

If you suspect your API keys have been compromised:
1. Immediately revoke the compromised keys
2. Generate new keys
3. Update your `.env.local` file
4. Check your API usage dashboards for suspicious activity

## 🎯 Remember:

**Security is not optional!** Always protect your API keys and never commit sensitive data to version control.
