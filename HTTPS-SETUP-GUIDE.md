# Complete Guide: Enable HTTPS for Backend on Digital Ocean

## Problem
Your frontend (https://lab11-front-end.vercel.app) cannot access your backend (http://143.110.184.27) because:
- Frontend uses HTTPS (secure)
- Backend uses HTTP (insecure)
- Browsers block "Mixed Content" - HTTPS pages cannot fetch HTTP resources

## Solution Overview
Add free HTTPS to your Digital Ocean droplet using:
1. **Nginx** - Reverse proxy
2. **Free Domain** - From DuckDNS (required for SSL)
3. **Let's Encrypt** - Free SSL certificate

---

## Step-by-Step Guide

### PART 1: Get a Free Domain (5 minutes)

#### Why needed?
Let's Encrypt (free SSL provider) requires a domain name, not just an IP address.

#### Instructions:

1. **Go to DuckDNS**: https://www.duckdns.org/

2. **Sign in** with your Google/GitHub account

3. **Create a subdomain**:
   - Enter a name (e.g., `mybmi` or `bmi-calculator`)
   - Click "add domain"
   - You'll get: `mybmi.duckdns.org`

4. **Point to your Digital Ocean IP**:
   - In the "current ip" field, enter: `143.110.184.27`
   - Click "update ip"

5. **Test the domain** (wait 1-2 minutes):
   ```bash
   ping mybmi.duckdns.org
   ```
   Should show your IP: `143.110.184.27`

---

### PART 2: SSH into Your Digital Ocean Droplet

#### Option A: Using PowerShell (Windows)

Open PowerShell and run:
```powershell
ssh root@143.110.184.27
```

Enter your password when prompted.

#### Option B: Using PuTTY (if SSH command doesn't work)

1. Download PuTTY: https://www.putty.org/
2. Open PuTTY
3. Enter Host: `143.110.184.27`
4. Port: `22`
5. Click "Open"
6. Login as: `root`
7. Enter your password

---

### PART 3: Install Nginx and Certbot

Once connected to your droplet, run these commands:

```bash
# Update package list
apt update

# Install Nginx (reverse proxy) and Certbot (SSL manager)
apt install nginx certbot python3-certbot-nginx -y

# Check Nginx status
systemctl status nginx
```

Press `q` to exit the status view.

---

### PART 4: Configure Nginx as Reverse Proxy

#### 4.1 Create Nginx Configuration File

```bash
nano /etc/nginx/sites-available/bmi-api
```

#### 4.2 Paste this configuration:

**⚠️ IMPORTANT: Replace `mybmi.duckdns.org` with YOUR domain from Step 1**

```nginx
server {
    listen 80;
    server_name mybmi.duckdns.org;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.3 Save and exit nano:
- Press `Ctrl + X`
- Press `Y` (yes to save)
- Press `Enter` (confirm filename)

#### 4.4 Enable the site:

```bash
# Create symbolic link to enable site
ln -s /etc/nginx/sites-available/bmi-api /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Should see: "syntax is ok" and "test is successful"

# Restart Nginx
systemctl restart nginx
```

#### 4.5 Test HTTP access:

Open browser and go to: `http://mybmi.duckdns.org`

You should see: "BMI Calculator API is running"

---

### PART 5: Get Free SSL Certificate (Let's Encrypt)

#### 5.1 Run Certbot:

```bash
certbot --nginx -d mybmi.duckdns.org
```

**⚠️ Replace `mybmi.duckdns.org` with YOUR domain**

#### 5.2 Follow the prompts:

1. **Enter email address**: (for renewal notifications)
   ```
   Enter email: your-email@example.com
   ```

2. **Agree to Terms of Service**:
   ```
   (A)gree/(C)ancel: A
   ```

3. **Share email with EFF** (optional):
   ```
   (Y)es/(N)o: N
   ```

4. **Redirect HTTP to HTTPS**:
   ```
   Please choose whether or not to redirect HTTP traffic to HTTPS
   1: No redirect
   2: Redirect - Make all requests redirect to secure HTTPS
   
   Select: 2
   ```

#### 5.3 Success message:

You should see:
```
Congratulations! Your certificate and chain have been saved at:
/etc/letsencrypt/live/mybmi.duckdns.org/fullchain.pem
```

---

### PART 6: Verify HTTPS is Working

#### 6.1 Test HTTPS access:

Open browser and go to: `https://mybmi.duckdns.org`

You should see:
- 🔒 Padlock icon in address bar
- "BMI Calculator API is running"

#### 6.2 Test API endpoint:

```bash
https://mybmi.duckdns.org/api/bmi
```

Should show error about missing height/weight (this is correct!)

---

### PART 7: Verify Docker Container is Running

```bash
# Check running containers
docker ps

# You should see your backend container
# If not running, check:
docker ps -a

# Start container if stopped:
docker start <container-name>

# Or run new container:
docker run -d -p 5000:5000 --name bmi-backend <your-image-name>
```

---

### PART 8: Update Frontend Configuration

Now update your frontend code to use the HTTPS backend URL.

**Old URL (won't work):**
```javascript
http://143.110.184.27/api/bmi
```

**New URL (will work):**
```javascript
https://mybmi.duckdns.org/api/bmi
```

#### Example frontend code:

```javascript
const response = await fetch('https://mybmi.duckdns.org/api/bmi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ height, weight })
});
```

---

### PART 9: Setup Auto-Renewal for SSL

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test renewal process
certbot renew --dry-run

# If successful, renewal is already configured automatically
# Certbot creates a cron job to auto-renew before expiration
```

---

## Troubleshooting

### Issue 1: "Connection refused" when accessing domain

**Check if Nginx is running:**
```bash
systemctl status nginx
systemctl restart nginx
```

### Issue 2: "502 Bad Gateway"

**Check if Docker container is running:**
```bash
docker ps
docker logs <container-name>
```

**Restart container:**
```bash
docker restart <container-name>
```

### Issue 3: Certbot fails with "DNS problem"

**Wait a few minutes** - DNS propagation can take time

**Verify domain points to correct IP:**
```bash
nslookup mybmi.duckdns.org
```

### Issue 4: Still getting "Mixed Content" errors

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. **Verify frontend uses HTTPS URL** (not HTTP)
3. **Check browser console** for actual URL being called

### Issue 5: Port 80 or 443 already in use

**Check what's using the ports:**
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

**Stop conflicting service:**
```bash
systemctl stop apache2  # if Apache is running
```

---

## Final Checklist

- [ ] Created free domain on DuckDNS
- [ ] Domain points to `143.110.184.27`
- [ ] SSH'd into Digital Ocean droplet
- [ ] Installed Nginx and Certbot
- [ ] Created Nginx configuration
- [ ] Tested HTTP access works
- [ ] Ran Certbot and got SSL certificate
- [ ] Tested HTTPS access works (with padlock 🔒)
- [ ] Docker container is running on port 5000
- [ ] Updated frontend to use HTTPS URL
- [ ] Frontend can successfully call backend API
- [ ] No more "Mixed Content" errors

---

## Quick Reference Commands

### Check Services Status
```bash
systemctl status nginx         # Check Nginx
docker ps                       # Check Docker containers
docker logs <container-name>    # View container logs
```

### Restart Services
```bash
systemctl restart nginx         # Restart Nginx
docker restart <container-name> # Restart Docker container
```

### View Nginx Logs
```bash
tail -f /var/log/nginx/access.log   # Access logs
tail -f /var/log/nginx/error.log    # Error logs
```

### SSL Certificate Info
```bash
certbot certificates               # List certificates
certbot renew --dry-run           # Test renewal
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│  Browser (HTTPS)                            │
│  https://lab11-front-end.vercel.app         │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS Request
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Domain: https://mybmi.duckdns.org          │
│  (Points to: 143.110.184.27)                │
└──────────────────┬──────────────────────────┘
                   │
                   │ Port 443 (HTTPS)
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Digital Ocean Droplet (143.110.184.27)     │
│  ┌─────────────────────────────────────┐    │
│  │ Nginx (Reverse Proxy)               │    │
│  │ - Handles SSL/TLS                   │    │
│  │ - Terminates HTTPS                  │    │
│  │ - Forwards to Docker container      │    │
│  └────────────┬────────────────────────┘    │
│               │ Port 5000 (HTTP)             │
│               ▼                              │
│  ┌─────────────────────────────────────┐    │
│  │ Docker Container                    │    │
│  │ - Node.js + Express Backend         │    │
│  │ - BMI Calculator API                │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## Alternative: Deploy Backend to Vercel (Simpler Option)

If the above seems complex, you can deploy your backend to Vercel instead:

### Advantages:
- ✅ Automatic HTTPS
- ✅ No server management
- ✅ Same platform as frontend
- ✅ Free tier available

### Steps:

1. Add `vercel.json` to your backend folder (already created)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   cd backend-folder
   vercel --prod
   ```
4. Use the Vercel URL in your frontend

---

## Support

If you encounter issues:
1. Check the Troubleshooting section
2. Review Nginx error logs: `tail -f /var/log/nginx/error.log`
3. Check Docker logs: `docker logs <container-name>`
4. Verify domain DNS: `nslookup your-domain.duckdns.org`

---

## Cost Summary

| Service | Cost |
|---------|------|
| DuckDNS Domain | FREE |
| Let's Encrypt SSL | FREE |
| Nginx | FREE |
| Total | **$0.00** |

---

**Last Updated**: December 8, 2025
