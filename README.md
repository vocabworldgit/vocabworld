# Vocab World - Multilingual Language Learning Platform

A modern, AI-powered language learning Progressive Web App (PWA) that teaches vocabulary across 112+ languages using advanced Text-to-Speech technology and gamification.

## 🌟 Features

- **112+ Languages**: Support for comprehensive language learning across the world's most spoken languages
- **Multiple TTS Services**: Integrated with Alnilam, Algenib, Azure, and Google Cloud TTS for high-quality pronunciation
- **Mobile-First**: Built with Capacitor for native iOS and Android deployment
- **Freemium Model**: Free tier with premium subscription via Stripe
- **Offline Support**: PWA capabilities with offline vocabulary caching
- **Real-time Sync**: Supabase-powered database with real-time updates
- **OAuth Authentication**: Google and Apple Sign-In support

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 with TypeScript
- **Styling**: TailwindCSS + Radix UI components
- **PWA**: Next-PWA for Progressive Web App features

### Mobile
- **Platform**: Capacitor 7 for iOS/Android
- **Native Features**: Audio playback, offline storage, push notifications

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **Payments**: Stripe with webhook-driven subscriptions
- **API**: Next.js API routes with RESTful design

### Audio Services
- Alnilam TTS (Custom service)
- Algenib TTS (Fallback)
- Azure Cognitive Services TTS
- Google Cloud Text-to-Speech

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voco-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with the required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
   ```
   
   See `SUPABASE_SETUP.md` and `STRIPE_SETUP.md` for detailed configuration guides.

4. **Database Setup**
   ```bash
   # Run the SQL scripts in your Supabase SQL Editor:
   # 1. supabase-schema.sql (vocabulary tables)
   # 2. database-schema-subscription.sql (subscription system)
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Mobile Development

#### Android
```bash
npm run build
npx cap sync android
npx cap run android
```

#### iOS
```bash
npm run build
npx cap sync ios
npx cap run ios
```

See `ANDROID_SETUP_GUIDE.md` for detailed mobile setup instructions.

## 🚀 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup-auth` - Initialize authentication configuration
- `npm run check-env` - Validate environment variables
- `npx cap sync` - Sync web build to mobile platforms

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── subscription/      # Payment & subscription pages
│   └── components/        # Page-specific components
├── components/            # Reusable UI components
│   ├── auth/             # Auth-related components
│   ├── language/         # Language selection UI
│   ├── vocabulary/       # Vocabulary learning components
│   └── ui/               # Radix UI components
├── lib/                  # Business logic & services
│   ├── *-audio-service.ts # Audio generation services
│   ├── subscription/     # Subscription logic
│   └── database.ts       # Database utilities
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── config/               # Configuration files
├── android/              # Android native project
└── ios/                  # iOS native project
```

## 🔐 Security

- **Never commit** `.env` files or API keys
- All sensitive credentials are in `.gitignore`
- Stripe webhooks validate signatures
- Supabase Row Level Security (RLS) enforced
- OAuth tokens handled securely via Supabase Auth

See `SECURITY.md` for complete security guidelines.

## 💳 Subscription System

The app uses a freemium model:
- **Free Tier**: Access to Topic 1 (Greetings) across all languages
- **Premium**: Full access to all vocabulary topics via Stripe subscription

Premium features are gated via database-driven access control. See `SUBSCRIPTION_SYSTEM_COMPLETE.md` for implementation details.

## 🧪 Testing

Run the comprehensive test suite:
```bash
# Manual testing checklist
npm run dev
# Visit /test-components for UI testing
# Visit /debug-subscription for payment flow testing
```

See `TESTING_GUIDE.md` and `SUBSCRIPTION_TESTING_GUIDE.md` for detailed testing procedures.

## 📚 Documentation

- `SUPABASE_SETUP.md` - Database and authentication setup
- `STRIPE_SETUP.md` - Payment integration guide
- `ANDROID_SETUP_GUIDE.md` - Mobile app deployment
- `GOOGLE_OAUTH_SETUP.md` - OAuth configuration
- `PRODUCTION_READINESS.md` - Production deployment checklist
- `SECURITY.md` - Security best practices

## 🌐 Language Support

The app supports 112+ languages including:
- European: English, Spanish, French, German, Italian, Portuguese, Russian, Polish, etc.
- Asian: Chinese, Japanese, Korean, Hindi, Arabic, Thai, Vietnamese, etc.
- African: Swahili, Amharic, Zulu, Yoruba, etc.
- And many more...

See `config/languages.js` for the complete list.

## 🤝 Contributing

This is a proprietary project. For development guidelines:
1. Follow the architectural patterns in `.github/copilot-instructions.md`
2. Test audio services thoroughly before committing
3. Validate subscription flows in Stripe test mode
4. Ensure mobile builds work on both iOS and Android

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- **Production**: [Your production URL]
- **Supabase Dashboard**: [Your Supabase project URL]
- **Stripe Dashboard**: [Your Stripe dashboard URL]

## 💬 Support

For issues or questions, please refer to the documentation in the `/docs` folder or contact the development team.

---

Built with ❤️ using Next.js, Supabase, and Capacitor
