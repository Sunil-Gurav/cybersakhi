# Vercel Environment Variables Setup

## Required Environment Variables for Backend

You need to set these environment variables in your Vercel dashboard for the backend deployment:

**⚠️ SECURITY NOTE**: Replace the placeholder values below with your actual credentials. The actual values are available in your local `.env` file but should never be committed to Git.

### 1. Database Configuration
```
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/cybersakhi
```

### 2. JWT Secret
```
JWT_SECRET=your_secure_jwt_secret_here_make_it_long_and_random
```

### 3. Email Configuration (Gmail)
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```

### 4. AI Services Configuration
```
AI_SERVICE_URL=https://cybersakhi.onrender.com
BACKEND_URL=https://cybersakhi-backend.vercel.app
```

### 5. OpenAI API Key
```
OPENAI_API_KEY=sk-proj-your_openai_api_key_here_replace_with_actual_key
```

### 5. OpenAI API Key
```
OPENAI_API_KEY=sk-proj-your_openai_api_key_here_replace_with_actual_key
```

### 6. Optional: Twilio (if using SMS features)
```
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM=+1234567890
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your backend project (`cybersakhi-backend`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `MONGO_URI`)
   - **Value**: Variable value (e.g., your MongoDB connection string)
   - **Environment**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

## After Setting Variables

1. **Redeploy**: Go to **Deployments** and redeploy the latest deployment
2. **Test**: Use the connection test component in your frontend to verify the connection
3. **Check Logs**: Monitor the function logs in Vercel for any connection issues

## Testing the Connection

After setting the environment variables and redeploying:

1. Visit your frontend: `https://cybersakhi-121w.vercel.app`
2. Look for the connection test widget in the top-right corner
3. Click **"🔄 Test API"** to test basic connectivity
4. Click **"🗄️ Test DB"** to test database connection
5. Check the browser console for detailed logs

## Troubleshooting

If you still see connection issues:

1. **Check Environment Variables**: Ensure all variables are set correctly in Vercel
2. **MongoDB Whitelist**: Make sure `0.0.0.0/0` is whitelisted in MongoDB Atlas
3. **Redeploy**: Always redeploy after changing environment variables
4. **Check Logs**: Look at Vercel function logs for specific error messages

## Actual Values for Reference

The actual values for your environment variables are:
- **MongoDB URI**: Check your local `backend/.env` file
- **Email credentials**: Check your local `backend/.env` file  
- **OpenAI API Key**: Check your local `backend/.env` file
- **JWT Secret**: Use a long, random string (minimum 32 characters)

**Never commit these actual values to Git!**

## Security Note

The credentials in this file are from your original .env file. In production:
- Use strong, unique passwords
- Rotate API keys regularly
- Monitor access logs
- Consider using Vercel's secret management features