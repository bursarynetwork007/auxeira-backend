# Deploy Auxeira to AWS Without GitHub Codespaces

## 🎯 You Have 3 Options (All Free!)

---

## ✅ Option 1: Deploy from Your Local Computer (Recommended)

### **Step 1: Install Required Tools**

#### On Mac/Linux:
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install Node.js (if not installed)
brew install node

# Install Serverless Framework
npm install -g serverless
```

#### On Windows:
```powershell
# Install AWS CLI
# Download from: https://awscli.amazonaws.com/AWSCLIV2.msi
# Run the installer

# Install Node.js
# Download from: https://nodejs.org/

# Install Serverless Framework
npm install -g serverless
```

### **Step 2: Configure AWS Credentials**

```bash
# Run AWS configure
aws configure

# Enter your credentials:
AWS Access Key ID: [Your Access Key]
AWS Secret Access Key: [Your Secret Key]
Default region: us-east-1
Default output format: json
```

**Where to get AWS credentials:**
1. Log into AWS Console: https://console.aws.amazon.com/
2. Go to IAM → Users → Your User → Security Credentials
3. Create Access Key → Download credentials
4. Use these in `aws configure`

### **Step 3: Clone Your Repository**

```bash
# Clone from GitHub
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# Checkout main branch (after merging PR #4)
git checkout main
git pull
```

### **Step 4: Deploy!**

```bash
# Make scripts executable
chmod +x deploy-all.sh deploy-dashboards.sh deploy-marketing.sh

# Deploy everything
./deploy-all.sh

# Or deploy individually:
./deploy-dashboards.sh                    # Dashboards only
./deploy-marketing.sh                     # Marketing only
cd backend-optimized && serverless deploy # Backend only
```

**That's it! No Codespaces needed!**

---

## ✅ Option 2: Deploy from This Server (Right Now!)

I can deploy directly from this server where we've been working!

### **What I Need from You:**

1. **AWS Credentials**
   - AWS Access Key ID
   - AWS Secret Access Key

2. **Environment Variables**
   - JWT_SECRET (for authentication)
   - PAYSTACK_SECRET_KEY
   - PAYSTACK_PUBLIC_KEY

### **How to Provide Credentials Securely:**

**Option A: Upload credentials file**
```bash
# Create a file locally with your credentials
cat > aws-credentials.txt << 'EOF'
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
EOF

# I'll read it and deploy
```

**Option B: Use AWS IAM Role (More Secure)**
- Create an IAM role with deployment permissions
- I'll assume the role to deploy

### **Then I'll Run:**

```bash
# Configure AWS
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Deploy everything
cd /home/ubuntu/auxeira-backend
./deploy-all.sh
```

**Deployment will take 5-10 minutes, then your site is live!**

---

## ✅ Option 3: Deploy from AWS CloudShell (100% Free!)

AWS CloudShell is a free browser-based terminal with AWS CLI pre-installed!

### **Step 1: Open CloudShell**

1. Log into AWS Console: https://console.aws.amazon.com/
2. Click the CloudShell icon (terminal icon in top right)
3. Wait for terminal to load (~30 seconds)

### **Step 2: Clone Repository**

```bash
# Clone your repo
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# Checkout main branch
git checkout main
```

### **Step 3: Install Node.js & Serverless**

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install Serverless
npm install -g serverless
```

### **Step 4: Deploy**

```bash
# Make scripts executable
chmod +x deploy-all.sh

# Deploy everything
./deploy-all.sh
```

**Advantages:**
- ✅ Completely free
- ✅ AWS credentials already configured
- ✅ No local installation needed
- ✅ Works from any browser

---

## 🚀 Quick Deploy Commands (Copy-Paste Ready)

### **Deploy Dashboards Only**

```bash
cd auxeira-backend

# Sync to S3
aws s3 sync dashboard-optimized/ s3://dashboard.auxeira.com/dashboard/ \
  --exclude ".git/*" --exclude "*.backup" --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*"
```

### **Deploy Marketing Site Only**

```bash
# Create bucket (if doesn't exist)
aws s3 mb s3://auxeira.com --region us-east-1

# Enable website hosting
aws s3 website s3://auxeira.com \
  --index-document index.html

# Sync files
aws s3 sync frontend/ s3://auxeira.com/ \
  --exclude ".git/*" --delete
```

### **Deploy Backend API Only**

```bash
cd backend-optimized

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
JWT_SECRET=your-secret-here
PAYSTACK_SECRET_KEY=sk_live_your_key
PAYSTACK_PUBLIC_KEY=pk_live_your_key
EOF

# Deploy to Lambda
serverless deploy --stage prod --region us-east-1
```

---

## 📱 Deploy from Mobile Device

Yes, you can even deploy from your phone!

### **Using Termux (Android)**

```bash
# Install Termux from F-Droid or Google Play
# Then in Termux:

pkg install git nodejs
npm install -g serverless
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# Configure AWS
pkg install awscli
aws configure

# Deploy
./deploy-all.sh
```

### **Using iSH (iOS)**

```bash
# Install iSH from App Store
# Then in iSH:

apk add git nodejs npm
npm install -g serverless
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# Deploy
./deploy-all.sh
```

---

## 🔐 Security Best Practices

### **Never Commit Credentials to Git**

```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore
echo "aws-credentials.txt" >> .gitignore

# Check what will be committed
git status

# If you accidentally committed secrets:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### **Use Environment Variables**

```bash
# Set temporarily (current session only)
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Or use AWS CLI profiles
aws configure --profile auxeira
aws s3 ls --profile auxeira
```

### **Use IAM Roles (Most Secure)**

If deploying from EC2 or CloudShell, attach an IAM role instead of using access keys.

---

## 🎯 Which Option Should You Choose?

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| **Local Computer** | Regular deployments | Full control, fast | Need to install tools |
| **This Server** | One-time deployment | No setup needed | Need to share credentials |
| **AWS CloudShell** | Occasional deployments | Free, pre-configured | Limited storage |
| **Mobile** | Emergency fixes | Deploy anywhere | Limited functionality |

**Recommendation:** Use **Local Computer** for regular work, **AWS CloudShell** as backup.

---

## 📋 Deployment Checklist

### **Before First Deployment**

- [ ] AWS account created
- [ ] AWS CLI installed (or using CloudShell)
- [ ] AWS credentials configured
- [ ] Node.js installed
- [ ] Serverless Framework installed
- [ ] Repository cloned locally
- [ ] PR #4 merged to main branch

### **For Each Deployment**

- [ ] Pull latest changes: `git pull`
- [ ] Update environment variables if needed
- [ ] Test locally (optional): `cd backend-optimized && npm start`
- [ ] Run deployment script: `./deploy-all.sh`
- [ ] Verify deployment: Test URLs
- [ ] Check CloudWatch logs for errors

---

## 🆘 Troubleshooting

### **Error: AWS credentials not found**

```bash
# Solution: Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### **Error: Serverless command not found**

```bash
# Solution: Install Serverless
npm install -g serverless

# Or use npx
npx serverless deploy --stage prod
```

### **Error: Permission denied on scripts**

```bash
# Solution: Make scripts executable
chmod +x deploy-all.sh deploy-dashboards.sh deploy-marketing.sh
```

### **Error: S3 bucket already exists**

```bash
# Solution: Bucket names are global, use a different name
# Or if you own it, just sync to it:
aws s3 sync frontend/ s3://auxeira.com/
```

---

## 💡 Pro Tips

### **Faster Deployments**

```bash
# Deploy only changed files
aws s3 sync dashboard-optimized/ s3://dashboard.auxeira.com/dashboard/ \
  --size-only  # Only upload if size changed

# Deploy specific function only
cd backend-optimized
serverless deploy function -f api --stage prod
```

### **Test Before Deploying**

```bash
# Test backend locally
cd backend-optimized
npm install
npm start  # Runs on localhost:3000

# Test in browser
curl http://localhost:3000/health
```

### **Rollback if Something Breaks**

```bash
# Rollback Lambda deployment
cd backend-optimized
serverless rollback --timestamp TIMESTAMP

# Restore previous S3 version
aws s3 sync s3://auxeira-backup/ s3://dashboard.auxeira.com/
```

---

## 🎉 Summary

**You DON'T need GitHub Codespaces!**

**Easiest options:**
1. **Deploy from your computer** - Install AWS CLI + Serverless, run `./deploy-all.sh`
2. **Deploy from AWS CloudShell** - Free, browser-based, AWS CLI pre-installed
3. **Let me deploy from this server** - Just provide AWS credentials

**All options are free and work perfectly!**

**Choose one and let's get your platform live! 🚀**

---

## 📞 Need Help?

If you want me to deploy from this server right now:

1. Provide AWS credentials (securely)
2. Provide environment variables (JWT_SECRET, Paystack keys)
3. I'll run the deployment
4. Your site will be live in 10 minutes!

Just let me know which option you prefer!

