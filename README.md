<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/907ddd6e-8abb-408f-81ce-b089a46d093c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mobile Admin Features

- Admin dashboard now includes an **Admin Settings Hub** to:
  - change/reset the admin PIN
  - enable lock-screen style notifications
  - send test notifications
  - install the app as a PWA
- For full background push delivery when the app is closed, set `VITE_VAPID_PUBLIC_KEY` and send push messages to subscribed endpoints from your backend.
