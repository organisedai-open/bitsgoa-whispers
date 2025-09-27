# Deployment Guide - Cloak Anonymous Chat

## Pre-Deployment Security Checklist

### 1. Environment Configuration

#### Create Environment Files
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local with your actual Firebase credentials
# NEVER commit .env.local to version control
```

#### Required Environment Variables
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Security Configuration
VITE_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_CSP_REPORT_URI=https://yourdomain.com/csp-report
```

### 2. Firebase Security Rules Deployment

#### Deploy Firestore Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules

# Verify rules are deployed
firebase firestore:rules:test
```

#### Deploy Firebase Configuration
```bash
# Deploy hosting configuration with security headers
firebase deploy --only hosting

# Verify deployment
firebase hosting:channel:list
```

### 3. Security Headers Implementation

The security headers are automatically configured in `firebase.json`. Verify they are working:

```bash
# Test security headers
curl -I https://yourdomain.com

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...
```

### 4. Input Sanitization

DOMPurify is already integrated. Test it works:

```bash
# Test XSS prevention
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>","channel":"general"}'

# Should sanitize and remove script tags
```

### 5. Rate Limiting

Client-side rate limiting is implemented. For production, implement server-side rate limiting:

```javascript
// Example server-side rate limiting with Redis
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const limiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:',
  }),
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // limit each IP to 1 request per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

## Deployment Steps

### 1. Build the Application
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 2. Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

### 3. Verify Deployment
```bash
# Test the application
curl https://yourdomain.com

# Test security headers
curl -I https://yourdomain.com

# Test HTTPS redirect
curl -I http://yourdomain.com
```

## Post-Deployment Security Verification

### 1. Security Headers Test
```bash
#!/bin/bash
echo "Testing security headers..."

# Test HTTPS redirect
echo "Testing HTTPS redirect..."
curl -I http://yourdomain.com | grep -E "(301|302)"

# Test security headers
echo "Testing security headers..."
curl -I https://yourdomain.com | grep -E "(X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security|Content-Security-Policy)"

# Test CSP
echo "Testing Content Security Policy..."
curl -H "Content-Security-Policy: default-src 'self'" https://yourdomain.com
```

### 2. Firebase Rules Test
```bash
# Test Firestore rules
firebase firestore:rules:test

# Test with unauthorized access
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"test","channel":"test"}'
```

### 3. Input Sanitization Test
```bash
# Test XSS prevention
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>","channel":"general"}'

# Test HTML stripping
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"<b>bold</b> text","channel":"general"}'
```

### 4. Rate Limiting Test
```bash
# Test rate limiting
for i in {1..5}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://yourdomain.com/api/messages -H "Content-Type: application/json" -d '{"message":"test message","channel":"general"}')
  echo "Request $i: $response"
done
```

## Monitoring and Maintenance

### 1. Security Monitoring
- Set up Firebase monitoring
- Configure security alerts
- Monitor rate limiting effectiveness
- Track failed authentication attempts

### 2. Regular Security Tasks
- **Daily**: Review security logs
- **Weekly**: Check for new vulnerabilities
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### 3. Incident Response
- Follow the incident response playbook
- Test emergency procedures
- Keep contact information updated
- Review and update security procedures

## Troubleshooting

### Common Issues

#### 1. Firebase API Key Not Working
```bash
# Check environment variables
echo $VITE_FIREBASE_API_KEY

# Verify Firebase configuration
firebase projects:list
firebase use your-project-id
```

#### 2. Security Headers Not Applied
```bash
# Check firebase.json configuration
cat firebase.json

# Redeploy hosting
firebase deploy --only hosting
```

#### 3. Firestore Rules Not Working
```bash
# Test rules locally
firebase emulators:start --only firestore
firebase firestore:rules:test

# Deploy rules
firebase deploy --only firestore:rules
```

#### 4. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run lint
```

## Security Best Practices

### 1. Environment Security
- Never commit `.env.local` files
- Use different API keys for development/production
- Rotate API keys regularly
- Monitor API key usage

### 2. Code Security
- Run security scans before deployment
- Review all code changes
- Use automated security tools
- Keep dependencies updated

### 3. Infrastructure Security
- Enable HTTPS everywhere
- Use security headers
- Implement proper CORS
- Monitor for attacks

### 4. Data Security
- Implement proper access controls
- Use encryption for sensitive data
- Regular backups
- Data retention policies

## Support and Resources

### Documentation
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)

### Tools
- [Security Headers Test](https://securityheaders.com/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Emergency Contacts
- **Security Team**: security@yourdomain.com
- **Firebase Support**: [Firebase support]
- **Incident Response**: incident@yourdomain.com

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: January 2025
