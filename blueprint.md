# ToffeePro Streaming App Blueprint

## 1. Overview

This document outlines the architecture, features, and design of the ToffeePro Streaming application. It's a web-based platform for streaming live video content, built with Next.js and Firebase.

## 2. Core Features (Current & Roadmap)

*   **Live Streaming:** Primary function providing live video streaming to users.
*   **Multiple Video Players:** Supports Plyr, Video.js, Shaka Player (DRM), and Native HTML5.
*   **Dynamic Content:** Real-time fetching of channels and matches from Firestore.
*   **Admin Panel:** Multi-tab dashboard for management (Ads, Playlists, Settings, Notifications).
*   **User Personalization (Roadmap):**
    *   **Favorites & Watch History:** Saved to Firestore for registered users.
    *   **User Profiles:** Social/Email login via Firebase Auth.
    *   **Parental Control:** PIN-locked adult/sensitive channels.
*   **Advanced Player Features (Roadmap):**
    *   **Resolution Control:** Manual selection (144p to 4K).
    *   **Playback Speed:** Speed control for recorded/archive content.
    *   **Cinema Mode & PiP:** Enhanced viewing modes.
*   **Content & Metadata (Roadmap):**
    *   **EPG (Electronic Program Guide):** Real-time schedules.
    *   **Live Chat:** Real-time interaction during events.
    *   **Multi-language Support:** UI available in Bengali and English.
*   **Monetization & Analytics:**
    *   **Global Ad System:** Banner and Popunder ads.
    *   **Pre-roll Ads (Roadmap):** Video ads before the stream.
    *   **Insightful Analytics:** Tracking user engagement for admins.

## 3. Design and Styling

*   **Design System:** "ToffeePro" - A premium Emerald/Teal accented dark theme.
*   **Aesthetic:** Glassmorphism, blurred overlays, and high-quality shadows.
*   **Theming:** Support for Dark and Light modes (using `next-themes`).
*   **Typography:** Expressive headers with italic, black weights for a sporty look.

## 4. Implementation Plan: Feature Expansion

### Phase 1: UI/UX & Theming
- **Dashboard Shortcuts:** Recently Viewed (local/account sync) and Popular items.
- **Enhanced Categories:** Smart filtering with intuitive icons.
- **Theme Switcher:** Seamless Dark/Light mode transitions.

### Phase 2: Player & Streaming
- **Advanced Controls:** Expose quality, speed, and track selection in the UI.
- **Cinema Mode:** A distraction-free viewing layout.
- **Basic EPG:** Fetching and displaying program lists.

### Phase 3: Personalization
- **Auth Integration:** Google and Email login.
- **Data Sync:** Migrate local storage data to user-bound Firestore documents.
- **Security:** Parental PIN logic.

### Phase 4: Localization & Engagement
- **i18n:** Bengali/English translation layer.
- **Engagement:** Real-time chat using Firebase RTDB.
- **Efficiency:** Bandwidth saver mode for mobile data users.
