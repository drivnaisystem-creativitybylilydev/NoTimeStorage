# Authentication Setup - NoTime Storage

## ✅ What's Been Implemented

### 1. Authentication Pages
- **Sign Up** (`/auth/signup`) - User registration with email verification
- **Login** (`/auth/login`) - User authentication
- **Password Reset** (`/auth/reset-password`) - Forgot password flow
- **Auth Callback** (`/auth/callback`) - Email verification handler
- **Dashboard** (`/dashboard`) - Protected user dashboard
- **Sign Out** (`/auth/signout`) - Logout functionality

### 2. Features
- Email/password authentication via Supabase Auth
- User profile creation in custom `users` table
- Email verification flow
- Password reset functionality
- Protected routes (dashboard requires authentication)
- Fully styled auth pages matching brand design
- Form validation
- Error handling
- Loading states

### 3. Integration
- "Get Started" buttons now link to `/auth/signup`
- Dashboard is protected and requires authentication
- User data synced between Supabase Auth and custom users table

## 🔧 Setup Required

### 1. Get Resend API Key
1. Go to https://resend.com
2. Sign up or log in
3. Create an API key
4. Add it to `.env.local`:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```

### 2. Configure Supabase Auth with Resend

#### In Supabase Dashboard:

1. Go to **Authentication** → **Email Templates**
2. Configure templates for:
   - Confirm signup
   - Reset password
   - Magic link (optional)

3. Go to **Project Settings** → **Authentication**
4. Under "SMTP Settings":
   - **Enable Custom SMTP**: Toggle ON
   - **Sender email**: `noreply@yourdomain.com` (or your verified Resend domain)
   - **Sender name**: `NoTime Storage`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` or `587`
   - **Username**: `resend`
   - **Password**: Your Resend API key

5. Under "Auth Providers" → "Email":
   - **Enable email provider**: ON
   - **Confirm email**: ON (recommended)
   - **Secure email change**: ON

6. Under "URL Configuration":
   - **Site URL**: `http://localhost:3000` (dev) or your production URL (e.g. `https://notimestorage.co`)
   - **Redirect URLs**: Add:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/update-password`
     - `https://notimestorage.co/auth/callback` (production)
     - `https://notimestorage.co/auth/update-password` (production)

### 3. Test the Flow

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Get Started"
4. Create a test account
5. Check your email for verification link
6. Click verification link → redirects to dashboard
7. Test sign out and login

## 📧 Email Templates

Supabase will send emails for:
- **Email Confirmation** - When user signs up
- **Password Reset** - When user requests password reset
- **Email Change Confirmation** - When user changes email

You can customize these templates in Supabase Dashboard under Authentication → Email Templates.

## 🚀 Next Steps

Once auth is working:

1. **Build Booking Flow**
   - Create booking form
   - Connect to pricing logic
   - Save bookings to database

2. **Enhance Dashboard**
   - Display user's bookings
   - Schedule pickup/delivery
   - Payment management
   - Account settings

3. **Admin Features**
   - Admin dashboard
   - View all bookings
   - Manage schedules
   - Google Calendar/Airtable/Slack integration

## 📝 Environment Variables Needed

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend (for emails)
RESEND_API_KEY=your_resend_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔒 Security Notes

- RLS policies are enabled on all tables
- Users can only see/edit their own data
- Passwords are hashed by Supabase Auth
- Email verification is required
- Middleware refreshes auth sessions automatically

## 🎨 Styling

Auth pages use the same design system as the landing page:
- Brown/latte color scheme
- Frosted glass effects
- Responsive design
- Smooth animations
- Brand consistency
