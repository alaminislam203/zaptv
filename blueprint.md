# ToffeePro Streaming App Blueprint

## 1. Overview

This document outlines the architecture, features, and design of the ToffeePro Streaming application. It's a web-based platform for streaming live video content, built with Next.js and Firebase.

## 2. Core Features

*   **Live Streaming:** The application's primary function is to provide live video streaming to users.
*   **Multiple Video Players:** It supports various video player libraries like Plyr, Video.js, and native HTML5 video to ensure compatibility and performance across different devices and browsers. It also includes Shaka Player for DRM-protected content.
*   **Dynamic Channel and Match Loading:** The app dynamically fetches and displays a list of available channels and hot matches from a Firebase Firestore database.
*   **Firebase Integration:** The application is integrated with Firebase for backend services, including:
    *   **Firestore:** To store and manage channels, matches, ads, and application settings.
    *   **Real-time Updates:** The app uses real-time listeners to update the channel and match lists automatically.
*   **User Interaction:**
    *   **Channel Search:** Users can search for specific channels.
    *   **Favorites:** Users can mark channels as favorites, and this information is saved in their browser's local storage.
    *   **Reporting:** A reporting feature allows users to report issues with a stream.
*   **Admin Panel:** A dedicated admin page is available for managing the application.
*   **Security:** Basic security measures are implemented to prevent right-clicking and the use of developer tools in a production environment.
*   **Ad Integration:** The app includes a system for displaying ads, which can be managed from the Firebase backend.
*   **Maintenance Mode:** The application can be put into maintenance mode, displaying a user-friendly message to visitors.

## 3. Design and Styling

*   **Modern and Dark Theme:** The application features a modern, dark theme with a clean and intuitive layout.
*   **Responsive Design:** The UI is designed to be responsive and work well on both desktop and mobile devices.
*   **Visual Elements:**
    *   **Gradient Text:** The site logo uses a gradient for a visually appealing effect.
    *   **Animated "LIVE" indicator:** A pulsating "LIVE" indicator gives immediate visual feedback.
    *   **Icons and Placeholders:** The app uses icons for actions like "favorite" and "report," and placeholders for channel logos when they are not available.
    *   **Loading Skeletons:** Animated loading skeletons provide visual feedback while data is being fetched.
*   **Tailwind CSS:** The application is styled using Tailwind CSS, a utility-first CSS framework.

## 4. Recent Change: Video Player Enhancements

*   **Feature:** Enhanced the `VideoJSPlayer.tsx` component to improve user experience.
*   **Implementation:**
    *   **Loading and Buffering Indicators:** Added a loading spinner that appears when the player is initially loading or buffering.
    *   **User-Friendly Error Messages:** Implemented a system to display clear and helpful error messages if the stream fails to load.
    *   **Modern UI Theme:** Integrated the `fantasy` theme from Video.js to give the player controls a more modern look and feel.
    *   **Code Optimization:** Refactored the code to be more reliable and performant, preventing unnecessary re-renders.
