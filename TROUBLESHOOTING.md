# Backend Connection Troubleshooting Guide

## Current Error: `timeout of 10000ms exceeded`

This error means the frontend cannot reach the backend within the timeout period.

## Quick Fixes to Try:

### 1. **Check if Backend is Running Locally**
```bash
# In backend folder
cd backend
npm start
```

**Expected output:**
```
✅ MongoDB Connected: cluster0-shard-00-00.3nbnlgf.mongodb.net
📊 Database connected successfully
✅ Server running on port 5000
```

### 2. **Test Backend Directly**
Open browser and go to: `http://localhost:5000`

**Expected response:**
```json
{
  "message": "🛡️ CyberSakhi Backend API is running!",
  "status": "healthy",
  "timestamp": "2024-12-25T...",
  "version": "1.0.0"
}
```

### 3. **Check Network/CORS Issues**
- Make sure no firewall is blocking port 5000
- Check if antivirus is blocking the connection
- Try disabling browser extensions temporarily

### 4. **Test Production Backend**
Go to: `https://cybersakhi-backend.vercel.app`

If this doesn't work, the Vercel deployment has issues.

## Detailed Troubleshooting:

### Local Development Issues:

1. **Port Already in Use:**
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   # Then restart
   npm start
   ```

2. **MongoDB Connection Issues:**
   ```bash
   # Test MongoDB connection
   node backend/quick-test.js
   ```

3. **Environment Variables Missing:**
   - Check `backend/.env` file exists
   - Verify MongoDB URI is correct
   - Check all required variables are set

### Production Issues:

1. **Vercel Environment Variables:**
   - Go to Vercel dashboard
   - Check all environment variables are set
   - Redeploy after setting variables

2. **Cold Start Issues:**
   - Vercel functions can take time to start
   - Try refreshing the page after 30 seconds

3. **MongoDB Atlas Issues:**
   - Check MongoDB Atlas is accessible
   - Verify IP whitelist includes `0.0.0.0/0`
   - Check connection string is correct

## Testing Steps:

1. **Test Local Backend:**
   ```bash
   curl http://localhost:5000/ping
   ```

2. **Test Production Backend:**
   ```bash
   curl https://cybersakhi-backend.vercel.app/ping
   ```

3. **Check Frontend Configuration:**
   - Open browser developer tools
   - Check console for API base URL
   - Verify it's pointing to correct backend

## Common Solutions:

### If Local Backend Won't Start:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Check Node.js version (should be 18+):
   ```bash
   node --version
   ```

### If Production Backend is Down:
1. Check Vercel deployment logs
2. Verify environment variables in Vercel
3. Redeploy the backend

### If Frontend Can't Connect:
1. Clear browser cache
2. Check network connection
3. Try different browser
4. Disable browser extensions

## Contact Information:
If none of these solutions work, the issue might be:
- Network/ISP blocking
- System firewall issues
- Antivirus interference
- Regional connectivity problems