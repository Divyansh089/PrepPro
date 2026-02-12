# PrepPro - Placement Preparation Platform

**Master the skills that matter and unlock your true potential.**

A modern, dark-first placement preparation web application that helps students prepare for technical interviews, coding assessments, and group discussions through an intuitive, performance-optimized platform.

---

## 📋 Overview

PrepPro is a comprehensive placement preparation platform designed for students and job seekers to practice coding challenges, technical assessments, and interview scenarios. The application provides a Netflix-style dark interface with neon accents, featuring intelligent search, performance tracking, AI-powered recommendations, and real-time leaderboards.

Built with React 18 and TypeScript, the platform emphasizes accessibility, performance, and modern development practices. It currently runs with mock API data (via MSW) to enable full-featured development without a backend dependency.

---

## ✨ Features

### 🎯 Core Functionality

- **Test Discovery & Search**: Smart search with category filters (Company, Role, Aptitude, Programming)
- **Multi-Format Testing**: Support for MCQ, coding challenges, SQL queries, and descriptive questions
- **Progress Analytics**: Visual dashboards showing performance trends, strengths, and weaknesses
- **AI Recommendations**: Personalized study suggestions based on performance patterns
- **Interview Simulator**: Mock interview sessions with webcam support and peer-to-peer connections
- **Group Discussions**: Virtual GD rooms with real-time collaboration features
- **Leaderboards**: Global and college-wise rankings with filtering options
- **User Profiles**: Personal dashboards with skills, ratings, streaks, and achievements

### 🎨 Design & User Experience

- **Dark-First Theme**: Eye-friendly interface with custom Chakra UI theme
- **Neon Accents**: High-contrast green (#39FF14), cyan (#00E5FF), and purple (#9D4EDD) highlights
- **Responsive Layout**: Collapsible sidebar, top navigation, and command palette (Cmd/Ctrl+K)
- **Accessibility**: Keyboard navigation, screen reader support, and WCAG considerations
- **Performance Optimized**: Route-level code splitting with lazy loading
- **Progressive Web App**: Offline support with service worker and app manifest

### 🔒 Additional Features

- **Content Moderation**: Flagging and reporting system for user-generated content
- **Admin Panel**: Management interface for platform administrators
- **Error Boundaries**: Graceful error handling throughout the application
- **Toast Notifications**: User feedback for actions and events

---

## 🛠️ Technology Stack

### Core Technologies

- **React 18.2** - UI library with modern hooks and concurrent features
- **TypeScript 5.2** - Type-safe development
- **Vite 5.0** - Fast build tool and dev server

### UI & Styling

- **Chakra UI 2.8** - Component library with custom dark theme
- **Emotion 11** - CSS-in-JS styling solution
- **Framer Motion 10** - Animation library

### State Management & Data Fetching

- **TanStack Query 5.17** (React Query) - Server state management with caching
- **Zustand 4.4** - Lightweight client state management
- **React Hook Form 7.48** - Form state and validation
- **Zod 3.22** - Schema validation

### Routing & Navigation

- **React Router DOM 6.20** - Client-side routing with v6 features

### Development Tools

- **Monaco Editor 0.45** - VS Code-powered code editor for coding challenges
- **TanStack Table 8.11** - Headless table library for data grids
- **Recharts 2.8** - Charting library for analytics visualization
- **cmdk 0.2** - Command palette component
- **date-fns 3.0** - Date manipulation utilities

### Media & Communication

- **react-webcam 7.2** - Webcam access for interview features
- **simple-peer 9.11** - WebRTC peer-to-peer connections

### Testing & Quality Assurance

- **Vitest 1.1** - Fast unit testing framework
- **@testing-library/react 14.1** - Component testing utilities
- **@testing-library/user-event 14.5** - User interaction simulation
- **MSW 2.0** - Mock Service Worker for API mocking
- **@axe-core/react 4.8** - Accessibility testing

### Build & Deployment

- **Vite Plugin PWA 0.17** - Progressive Web App configuration
- **ESLint 8.55** - Code linting with TypeScript support
- **Prettier 3.1** - Code formatting

### Analytics (Integration Ready)

- **PostHog 1.96** - Product analytics platform

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/PrepPro.git
cd PrepPro

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Start Vite development server with hot reload       |
| `npm run build`         | Build production bundle with TypeScript compilation |
| `npm run preview`       | Preview production build locally                    |
| `npm run lint`          | Run ESLint on TypeScript/TSX files                  |
| `npm test`              | Run Vitest tests in watch mode                      |
| `npm run test:ui`       | Open Vitest UI for interactive testing              |
| `npm run test:coverage` | Generate test coverage report                       |

---

## 🎯 Main Purpose

PrepPro serves as a **one-stop platform for placement preparation**, addressing the needs of students preparing for:

1. **Campus Placements**: Company-specific tests (TCS, Infosys, Wipro, etc.)
2. **Technical Interviews**: Coding challenges, DSA practice, and system design
3. **Role-Based Preparation**: Frontend, backend, data science, and other specializations
4. **Soft Skills**: Group discussion practice and interview simulation
5. **Continuous Learning**: Progress tracking and AI-powered personalized recommendations

### Key Use Cases

- Students preparing for upcoming placement seasons
- Job seekers practicing technical interview questions
- Colleges providing structured preparation resources
- Career counselors tracking student progress
- Peer groups conducting mock interviews and GDs

---

## 🏗️ Application Architecture

### Feature-Based Organization

The application follows a feature-based architecture where each major feature (prep, test, analytics, interview, etc.) is self-contained with its own components and logic.

### State Management Strategy

- **Server State**: Managed by TanStack Query with automatic caching, refetching, and background updates
- **Client State**: Zustand stores for UI state (sidebar, theme), search state, and test execution state
- **Form State**: React Hook Form for complex forms with Zod schema validation

### Routing & Code Splitting

All feature pages are lazy-loaded using React's `lazy()` and `Suspense` for optimal performance and reduced initial bundle size.

### Mock API Layer

Development uses Mock Service Worker (MSW) to intercept API requests and return realistic mock data, enabling full-featured development without a backend.

---

## 🎨 Theme Configuration

The application uses a custom Chakra UI theme with:

- **Background**: `#0B0F1A` (Dark space blue)
- **Surface**: `#111827` (Elevated cards/panels)
- **Text Primary**: `#E5E7EB` (High contrast)
- **Text Secondary**: `#94A3B8` (Muted)
- **Neon Green**: `#39FF14` (Primary actions)
- **Neon Cyan**: `#00E5FF` (Secondary highlights)
- **Neon Purple**: `#9D4EDD` (Tertiary accents)

Custom scrollbar styling and smooth transitions (150ms ease-in-out) are applied globally.

---

## 🧪 Testing Approach

The project is configured with Vitest and React Testing Library for comprehensive testing:

- **Mock Service Worker** provides API mocking in both tests and development
- **jsdom** environment for DOM testing
- **Coverage reporting** with V8 provider
- **Accessibility testing** with axe-core integration

---

## 🔧 Environment Configuration

Create a `.env.local` file for local configuration:

```env
# API Base URL (defaults to /api)
VITE_API_URL=http://localhost:3000/api

# Analytics (optional)
VITE_POSTHOG_KEY=your_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Follow TypeScript strict mode, write tests for new features, and ensure accessibility compliance.

---

**Built with ❤️ for students preparing to ace their placements**
