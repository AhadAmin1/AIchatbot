# React + Vite

## Google Sign-In

Create a Google OAuth 2.0 Client ID for a Web application in Google Cloud Console. Add your local frontend origin (`http://localhost:5173`) and any deployed frontend origin to its authorized JavaScript origins.

Use the same Client ID in both environment files:

- `client/.env`: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
- `server/.env`: `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

Restart the client and server after changing environment variables. Keep the server value private to the backend; the `VITE_` value is public and is used only to render Google's sign-in button. If the OAuth consent screen is in testing mode, add the Google accounts that should be allowed to sign in as test users.

## Payments

Credit purchases are disabled by default. With `PAYMENTS_ENABLED=false`, chats and image generation are unlimited, saved credit balances are not decremented, the credits page shows “Payments coming soon,” and the API rejects checkout requests. Set `PAYMENTS_ENABLED=true` only when the matching Safepay environment and credentials are configured; normal credit checks and deductions then resume.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
