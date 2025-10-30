# VERA Executive Intelligence - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- Vercel account (free tier supports this project)
- Anthropic API key (for Claude 3.5)
- OpenAI API key (for GPT-4)

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub repository
2. Connect repository to Vercel
3. Vercel will auto-deploy on each push

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: vera-executive-intelligence
# - Directory: ./
# - Override settings? N
```

### 3. Configure Environment Variables

In your Vercel dashboard, add these environment variables:

**Required:**
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY
OPENAI_API_KEY=sk-YOUR-ACTUAL-OPENAI-KEY
NODE_ENV=production
```

**Optional (for future features):**
```
GOOGLE_CALENDAR_API_KEY=your_calendar_key
OUTLOOK_CLIENT_ID=your_outlook_id
OUTLOOK_CLIENT_SECRET=your_outlook_secret
```

### 4. Verify Deployment

1. **Test the interface**: Ensure animations and UI work correctly
2. **Test AI responses**: Send messages in different modes
3. **Test voice recognition**: Use microphone button
4. **Check console**: No errors in browser developer tools

## 🔧 Configuration Details

### Performance Optimizations
- **API timeout**: 30 seconds for AI responses
- **Framework**: Next.js 14 with automatic optimizations
- **Font loading**: Inter font via Google Fonts
- **Image optimization**: Automatic via Next.js

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### API Route Features
- **Smart AI routing**: Complex queries → Claude, Simple → GPT-4
- **Context awareness**: User state detection and energy levels
- **Error handling**: Graceful fallbacks and proper error responses
- **Calendar integration**: Ready for Google/Outlook APIs

## 🎯 Post-Deployment Checklist

- [ ] UI loads with luxury animations
- [ ] Mode buttons work (Executive, Creative, Personal, Crisis)
- [ ] Voice recognition functions
- [ ] AI responses work with your API keys
- [ ] Real-time clock displays
- [ ] Energy indicator shows
- [ ] Glass morphism effects render correctly
- [ ] Mobile responsiveness works
- [ ] No console errors

## 🚨 Troubleshooting

### Common Issues:

**1. API Keys Not Working:**
- Verify keys are correctly set in Vercel dashboard
- Check for extra spaces or quotes
- Ensure production deployment uses new environment variables

**2. Animations Not Smooth:**
- Check if Framer Motion loaded correctly
- Verify Inter font is loading
- Test on different devices/browsers

**3. Voice Recognition Issues:**
- Only works on HTTPS (Vercel provides this automatically)
- Chrome/Edge browsers work best
- Requires microphone permissions

### Performance Monitoring:
- Monitor function execution times in Vercel dashboard
- Check API usage in OpenAI/Anthropic dashboards
- Use Vercel Analytics for user metrics

## 🌟 Production Features

Your deployed VERA system includes:
- **Ultra-luxury UI** with $50M home aesthetics
- **Dual AI intelligence** (Claude + GPT-4)
- **Context-aware responses** based on mode and user state
- **Voice recognition** for hands-free interaction
- **Real-time features** (clock, energy indicators)
- **Mobile-optimized** responsive design
- **Production-ready** error handling and security

---

**Deployment URL**: Will be provided after deployment
**Admin Dashboard**: Available in Vercel dashboard
**API Monitoring**: Check function logs for debugging