# Split Soup

Minimalist event sharing with friends.

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy your credentials

### 3. Configure app

Edit `src/config/supabase.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 4. Run locally

```bash
npx expo start
```

---

## Deployment Guide

### Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Link your Expo project:**
   ```bash
   eas init
   ```
   This will create a project ID - update `app.json` with your `projectId`.

3. **Update app.json:**
   - Set your `owner` (Expo username)
   - Update the `projectId` in `extra.eas`
   - Update `updates.url` with your project ID

---

### Apple App Store

#### First-time Setup

1. **Apple Developer Account:** Enroll at [developer.apple.com](https://developer.apple.com) ($99/year)

2. **Configure eas.json:**
   Edit `eas.json` and update:
   ```json
   "ios": {
     "appleId": "your-apple-id@email.com",
     "ascAppId": "your-app-store-connect-app-id",
     "appleTeamId": "YOUR_TEAM_ID"
   }
   ```

3. **Create App Store Connect entry:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app with bundle ID `com.splitsoup.app`

#### Build & Submit

```bash
# Build for production
npm run build:ios

# Submit to App Store
npm run submit:ios
```

---

### Google Play Store

#### First-time Setup

1. **Google Play Console:** Register at [play.google.com/console](https://play.google.com/console) ($25 one-time)

2. **Create Service Account:**
   - Go to Play Console → Setup → API access
   - Create a service account with "Release manager" permissions
   - Download the JSON key file
   - Save as `google-service-account.json` in project root
   - Add to `.gitignore`!

3. **Create app listing:**
   - Create a new app in Play Console
   - Set package name to `com.splitsoup.app`

#### Build & Submit

```bash
# Build for production (AAB format)
npm run build:android

# Submit to Play Store
npm run submit:android
```

---

### F-Droid

F-Droid requires reproducible builds and open-source code.

#### Setup

1. **Repository:** Your code must be in a public Git repository

2. **Build APK:**
   ```bash
   npm run build:fdroid
   ```

3. **Metadata:** Already created in `fastlane/metadata/android/`

4. **Submit to F-Droid:**
   - Fork [fdroiddata](https://gitlab.com/fdroid/fdroiddata)
   - Create `metadata/com.splitsoup.app.yml`:
   ```yaml
   Categories:
     - System
   License: MIT
   AuthorName: Your Name
   SourceCode: https://github.com/yourusername/split-soup
   IssueTracker: https://github.com/yourusername/split-soup/issues

   AutoName: Split Soup
   Description: |
     Minimalist event sharing with friends.
     Features include event creation, invitations, and friend alerts.

   RepoType: git
   Repo: https://github.com/yourusername/split-soup

   Builds:
     - versionName: 1.0.0
       versionCode: 1
       commit: v1.0.0
       subdir: android/app
       gradle:
         - release
   ```
   - Submit merge request

---

## Over-the-Air Updates

After initial store release, push updates instantly without re-submitting:

```bash
# Push update to all users
npm run update

# Or with a specific message
eas update --message "Fixed bug in event creation"
```

**Note:** OTA updates only work for JavaScript/asset changes. Native code changes require a new store build.

---

## Version Management

### Automatic Version Bumping

EAS handles version increments automatically:
- `eas.json` has `"autoIncrement": true` for production builds
- Each build increments `buildNumber` (iOS) and `versionCode` (Android)

### Manual Version Updates

For major/minor version changes, update `app.json`:
```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

---

## Notifications

The app uses `expo-notifications` for:
- **Event reminders:** 2 hours and 30 minutes before events
- **New invitations:** Real-time alerts when invited to events
- **Friend alerts:** Messages from friends
- **Event changes:** When event times are updated

### Notification Channels (Android)

- `default` - General notifications
- `reminders` - Event reminders
- `invitations` - New event invites
- `alerts` - Friend alerts

---

## Project Structure

```
src/
├── components/
│   ├── AddButton.js        # Floating action button
│   ├── AddEventModal.js    # Create event form
│   ├── AlertButton.js      # Send alerts
│   ├── AlertPopup.js       # View alerts
│   ├── EventCard.js        # Event row
│   ├── EventList.js        # Scrollable list
│   └── ...
├── config/
│   └── supabase.js         # Supabase client
├── contexts/
│   ├── AuthContext.js      # Auth state
│   └── NotificationContext.js  # Push notifications
├── hooks/
│   ├── useAlerts.js        # Friend alerts
│   ├── useEvents.js        # Events CRUD
│   └── useInvitations.js   # Invitations
└── screens/
    ├── AuthScreen.js       # Login/signup
    ├── HomeScreen.js       # Main view
    └── InvitationsScreen.js # Pending invites
```

---

## Database Schema

See `supabase-schema.sql` for complete schema.

- **profiles** - User accounts
- **events** - User events
- **event_invitations** - Event shares
- **friendships** - Friend connections
- **alerts** - Friend broadcasts
- **alert_recipients** - Alert delivery

---

## Security Notes

- Never commit `google-service-account.json`
- Keep your Supabase anon key in version control (it's public by design)
- Row Level Security (RLS) protects your data in Supabase

---

## License

MIT
