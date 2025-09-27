# Incident Response Playbook - Cloak Anonymous Chat

## Overview
This playbook provides step-by-step procedures for responding to security incidents in the Cloak anonymous chat application.

## Contact Information
- **Security Team**: security@yourdomain.com
- **Incident Response Lead**: incident@yourdomain.com
- **Legal Team**: legal@yourdomain.com
- **Campus Helpline**: [Your campus helpline number]

## Incident Classification

### Severity Levels
- **P0 - Critical**: Active exploitation, data breach, service compromise
- **P1 - High**: Potential data exposure, service disruption
- **P2 - Medium**: Security vulnerability, abuse
- **P3 - Low**: Minor issues, false positives

## Response Procedures

### 1. Secrets Leak Response (P0)

**Immediate Actions (0-15 minutes):**
1. **Rotate all exposed secrets immediately**
   ```bash
   # Firebase API key rotation
   firebase projects:list
   firebase use [project-id]
   # Generate new API key in Firebase Console
   ```

2. **Update environment variables**
   ```bash
   # Update .env files
   FIREBASE_API_KEY=new_key_here
   # Deploy immediately
   ```

3. **Revoke old credentials**
   - Firebase Console → Project Settings → General
   - Generate new API key
   - Update all deployment environments

4. **Remove from git history**
   ```bash
   # Using git filter-repo (recommended)
   git filter-repo --invert-paths --path src/integrations/firebase/client.ts
   
   # Alternative: BFG Repo-Cleaner
   java -jar bfg.jar --replace-text secrets.txt your-repo.git
   ```

5. **Force push to all branches**
   ```bash
   git push origin --force --all
   ```

**Communication (15-30 minutes):**
- Notify security team
- Notify development team
- Document incident in security log

**Follow-up (1-24 hours):**
- Review access logs
- Check for unauthorized usage
- Update security procedures
- Conduct post-incident review

### 2. Data Breach Response (P0)

**Immediate Actions (0-30 minutes):**
1. **Take service offline**
   ```bash
   # Firebase hosting
   firebase hosting:disable
   
   # Or update DNS to maintenance page
   ```

2. **Preserve evidence**
   ```bash
   # Export Firestore data
   gcloud firestore export gs://your-backup-bucket/incident-$(date +%Y%m%d)
   
   # Export logs
   gcloud logging read "resource.type=firestore" --limit=10000 > incident-logs.json
   ```

3. **Secure the environment**
   - Change all passwords
   - Rotate API keys
   - Review access permissions

**Communication (30-60 minutes):**
- Notify legal team
- Prepare user notification
- Contact campus authorities if needed
- Document everything

**Investigation (1-24 hours):**
- Analyze logs for breach scope
- Identify affected users
- Determine attack vector
- Document findings

**Recovery (24-48 hours):**
- Implement additional security measures
- Restore service with enhanced security
- Monitor for continued attacks

### 3. Abuse/Spam Response (P1)

**Immediate Actions (0-15 minutes):**
1. **Block offending IPs**
   ```bash
   # Add to Firebase security rules
   # Or implement IP blocking in hosting
   ```

2. **Enable enhanced rate limiting**
   ```javascript
   // Update rate limiting configuration
   const rateLimit = {
     maxRequests: 1,
     windowMs: 60000, // 1 minute
     burstLimit: 2,
     burstWindowMs: 300000 // 5 minutes
   };
   ```

3. **Review recent messages**
   ```bash
   # Query Firestore for recent spam
   gcloud firestore query --collection messages --where "created_at > 2024-01-01"
   ```

**Communication (15-30 minutes):**
- Notify moderation team
- Update users if necessary
- Document abuse patterns

**Follow-up (1-24 hours):**
- Analyze abuse patterns
- Update spam filters
- Implement additional protections
- Review and update moderation policies

### 4. Self-Harm Content Response (P0)

**Immediate Actions (0-15 minutes):**
1. **Remove content immediately**
   ```bash
   # Delete from Firestore
   firebase firestore:delete /messages/[message-id]
   ```

2. **Preserve for authorities if needed**
   - Screenshot content
   - Export message data
   - Document timestamp and user info

3. **Activate helpline response**
   - Display campus helpline information
   - Provide crisis resources
   - Contact campus counseling services

**Communication (15-30 minutes):**
- Notify campus counseling services
- Contact campus security if needed
- Prepare helpline information for users

**Follow-up (1-24 hours):**
- Review content for patterns
- Update content moderation
- Provide additional resources
- Conduct safety review

### 5. Service Compromise Response (P0)

**Immediate Actions (0-30 minutes):**
1. **Isolate affected systems**
   ```bash
   # Disable Firebase hosting
   firebase hosting:disable
   
   # Or redirect to maintenance page
   ```

2. **Preserve logs and evidence**
   ```bash
   # Export all logs
   gcloud logging read --limit=50000 > compromise-logs.json
   
   # Export database
   gcloud firestore export gs://backup-bucket/compromise-$(date +%Y%m%d)
   ```

3. **Assess scope of compromise**
   - Review access logs
   - Check for unauthorized changes
   - Identify attack vector

**Communication (30-60 minutes):**
- Notify security team
- Notify legal team
- Prepare public communication
- Contact authorities if needed

**Recovery (24-72 hours):**
- Implement enhanced security
- Restore from clean backups
- Deploy with additional monitoring
- Conduct security review

## Communication Templates

### User Notification (Data Breach)
```
Subject: Important Security Update - Cloak Chat

Dear Users,

We are writing to inform you of a security incident that may have affected your data. On [DATE], we discovered [INCIDENT_DETAILS].

What we're doing:
- We have taken immediate action to secure the system
- We are conducting a thorough investigation
- We are implementing additional security measures

What you should do:
- Change any passwords you may have used
- Monitor your accounts for suspicious activity
- Contact us if you have concerns

We apologize for any inconvenience and are committed to protecting your privacy.

Contact: security@yourdomain.com
```

### Internal Notification
```
Subject: SECURITY INCIDENT - [SEVERITY] - [INCIDENT_TYPE]

Incident Details:
- Severity: [P0/P1/P2/P3]
- Type: [Secrets leak/Data breach/Abuse/etc.]
- Time: [TIMESTAMP]
- Affected: [SCOPE]

Actions Taken:
- [ACTION_1]
- [ACTION_2]
- [ACTION_3]

Next Steps:
- [STEP_1]
- [STEP_2]
- [STEP_3]

Contact: [RESPONSE_LEAD]
```

## Recovery Procedures

### 1. Service Restoration
```bash
# 1. Verify security measures are in place
firebase deploy --only firestore:rules
firebase deploy --only hosting

# 2. Test security headers
curl -I https://yourdomain.com

# 3. Verify Firestore rules
firebase firestore:rules:test

# 4. Monitor for issues
firebase functions:log
```

### 2. Data Recovery
```bash
# Restore from backup
gcloud firestore import gs://backup-bucket/backup-YYYYMMDD

# Verify data integrity
firebase firestore:query messages --limit 10
```

### 3. Security Verification
```bash
# Test security headers
curl -H "User-Agent: Test" https://yourdomain.com

# Test rate limiting
for i in {1..10}; do curl https://yourdomain.com; done

# Test input sanitization
curl -X POST -d '{"message":"<script>alert(1)</script>"}' https://yourdomain.com
```

## Post-Incident Review

### 1. Documentation
- Document timeline of events
- Record actions taken
- Note lessons learned
- Update procedures

### 2. Analysis
- Root cause analysis
- Impact assessment
- Security gap identification
- Improvement recommendations

### 3. Improvements
- Update security procedures
- Enhance monitoring
- Improve response capabilities
- Conduct training

## Prevention Measures

### 1. Regular Security Reviews
- Monthly security audits
- Quarterly penetration testing
- Annual security assessments

### 2. Monitoring and Alerting
- Real-time security monitoring
- Automated alerting
- Regular log reviews

### 3. Training and Awareness
- Security training for developers
- Incident response drills
- Regular security updates

## Emergency Contacts

### Internal Contacts
- **Security Team**: security@yourdomain.com
- **Incident Response**: incident@yourdomain.com
- **Legal Team**: legal@yourdomain.com
- **Management**: management@yourdomain.com

### External Contacts
- **Campus Security**: [Campus security number]
- **Campus Counseling**: [Counseling services number]
- **Local Law Enforcement**: [Emergency number]
- **Firebase Support**: [Firebase support contact]

### Escalation Matrix
- **P0**: Immediate notification to all contacts
- **P1**: Notify security team and management
- **P2**: Notify security team
- **P3**: Document and review

---

**Last Updated**: December 2024  
**Next Review**: January 2025  
**Version**: 1.0
