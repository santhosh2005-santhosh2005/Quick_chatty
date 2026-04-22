# Login Troubleshooting Guide

This guide will help you identify and resolve common login issues in the chat application.

## Common Login Errors and Solutions

### 1. "Invalid credentials" Error

**Symptoms**: 
- Login fails with message "Invalid credentials"
- User exists in database but can't login

**Possible Causes**:
1. Incorrect email or password
2. User not found in database
3. Password hash mismatch

**Solutions**:
1. Double-check email and password
2. Verify user exists in MongoDB database
3. If you suspect password issues, try creating a new account

### 2. Network Error / Connection Refused

**Symptoms**:
- "Network Error" or "Connection refused" messages
- Browser console shows connection errors
- No response from backend

**Possible Causes**:
1. Backend server not running
2. Port conflicts
3. CORS issues
4. Firewall blocking connections

**Solutions**:
1. Ensure backend server is running (`npm run dev` in backend directory)
2. Check if the configured port is available
3. Verify CORS configuration in backend
4. Check firewall settings

### 3. CORS Errors

**Symptoms**:
- Browser console shows CORS errors
- Requests blocked by CORS policy
- "No 'Access-Control-Allow-Origin' header" error

**Possible Causes**:
1. Frontend URL not in CORS origin list
2. Incorrect CORS configuration

**Solutions**:
1. Check CORS configuration in `backend/src/index.js`
2. Ensure `http://localhost:5173` is in the origin list
3. Add any other frontend URLs to the origin list

### 4. Database Connection Errors

**Symptoms**:
- "MongoDB connection error" in backend terminal
- "Internal Server Error" responses
- Application hangs during login

**Possible Causes**:
1. Incorrect MONGODB_URI in .env file
2. MongoDB Atlas connection issues
3. Network connectivity issues

**Solutions**:
1. Verify MONGODB_URI in `backend/.env` file
2. Check MongoDB Atlas dashboard for connection status
3. Ensure your IP is whitelisted in MongoDB Atlas
4. Test MongoDB connection with a MongoDB client

### 5. JWT Token Issues

**Symptoms**:
- Authentication fails after successful login
- "Unauthorized" errors
- Cookies not being set

**Possible Causes**:
1. JWT_SECRET not set in .env file
2. Cookie configuration issues
3. Browser blocking cookies

**Solutions**:
1. Verify JWT_SECRET is set in `backend/.env` file
2. Check cookie configuration in `backend/src/lib/utils.js`
3. Ensure browser is not blocking cookies

## Step-by-Step Debugging Process

### Step 1: Check Backend Server Status

1. Open terminal and navigate to backend directory
2. Run `npm run dev`
3. Look for output:
   ```
   Server is running on PORT:XXXX
   MongoDB connected: cluster0.vczbqy0.mongodb.net
   ```
4. If you see port conflicts, change PORT in `.env` file

### Step 2: Check Frontend Status

1. Open another terminal and navigate to frontend directory
2. Run `npm run dev`
3. Look for output:
   ```
   ➜  Local:   http://localhost:5173/
   ```
4. Open browser to http://localhost:5173

### Step 3: Monitor Network Requests

1. Open browser developer tools (F12)
2. Go to Network tab
3. Try to login
4. Look for:
   - POST request to `/api/auth/login`
   - Request headers and body
   - Response status and data

### Step 4: Check Console for Errors

1. In browser developer tools, go to Console tab
2. Look for any error messages
3. Pay attention to:
   - Network errors
   - CORS errors
   - JavaScript errors

### Step 5: Check Backend Terminal

1. Look at the terminal where backend is running
2. Watch for:
   - Login request logs
   - Error messages
   - Database connection status

## Environment Variables Check

Ensure your `backend/.env` file has correct values:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Server Port
PORT=5001

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Secret - Replace with a strong secret key
JWT_SECRET=your_strong_secret_key_here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Environment
NODE_ENV=development
```

## Port Troubleshooting

If you're getting port conflicts:

1. Try changing the PORT in `backend/.env`:
   ```
   PORT=5002
   ```
   
2. Or kill processes using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5001
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -i :5001
   kill -9 <PID>
   ```

## Database Troubleshooting

To verify database connection:

1. Check MongoDB Atlas dashboard
2. Ensure your IP is in the whitelist
3. Verify username/password are correct
4. Test connection with MongoDB Compass or similar tool

## Testing with Scripts

You can use the provided test scripts to debug:

1. Run `node detailed-login-debug.js` for detailed debugging information
2. Run `node test-login-endpoint.js` to test API endpoints directly

## Common Fixes

### Fix 1: Clear Browser Data
1. Open browser settings
2. Clear cookies and cache for localhost
3. Try logging in again

### Fix 2: Restart Both Servers
1. Stop both frontend and backend servers (Ctrl+C)
2. Start backend first: `npm run dev` in backend directory
3. Start frontend: `npm run dev` in frontend directory

### Fix 3: Check User Exists
1. Connect to MongoDB database
2. Check if user with your email exists
3. If not, create a new account

## Still Having Issues?

If you're still experiencing problems:

1. Share the exact error message you're seeing
2. Include screenshots of:
   - Browser console errors
   - Network request/response details
   - Backend terminal output
3. Check if you can access other API endpoints

## Contact Support

If none of these solutions work, please provide:
1. Exact error messages
2. Screenshots of console/network tabs
3. Backend terminal output
4. Your environment configuration