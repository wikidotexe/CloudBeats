# CloudBeats

A sleek, modern music player designed specifically for your Nextcloud Music collection. Built with focus on aesthetics and smooth user experience, CloudBeats connects to any Subsonic-compatible server to bring your music library to life.

## ✨ Features

- **Beautiful UI**: Modern glassmorphism design with a dark-themed, premium aesthetic.
- **Nextcloud Integration**: seamless connection via the Subsonic API.
- **Global Search**: Find your favorite tracks and albums instantly with a fast, intuitive global search.
- **Smart Browsing**: Easily browse your collection by Albums, Artists, or individual Tracks.
- **Now Playing View**: A stunning full-screen experience for the current track.
- **Responsive Design**: optimized for both desktop and mobile devices.
- **Premium Animations**: smooth transitions powered by Framer Motion.
- **Repeat Modes**: toggle between Repeat All, Repeat One, and Repeat Off.

## 🚀 Getting Started

Follow these steps to run CloudBeats locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd nextmusic

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## 🛠️ Built With

CloudBeats is built using modern web technologies:

- **Frontend Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [React Query](https://tanstack.com/query/latest) & Context API
- **Icons**: [Lucide React](https://lucide.dev/)

## 📝 Configuration

When you first open the app, you'll be prompted to connect your server. You will need:
1. Your Nextcloud (or Subsonic-compatible) server URL.
2. Your username.
3. Your API token/password.

Once connected, your library will be cached locally for quick access.
