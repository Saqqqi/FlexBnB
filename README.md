# FlexBnB — Smart Room Booking System

A full-stack short-term rental platform built with **Next.js 15**, inspired by Airbnb. FlexBnB goes beyond standard property listing with AI-powered recommendations, roommate matching, room pooling, a travel chatbot, and a host analytics dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Booking
- Browse property listings with category-based filtering
- Interactive property detail pages with photo galleries
- Date range calendar for checking availability
- Reservation sidebar with real-time pricing breakdown
- Favorites system to save preferred properties

### AI-Powered Intelligence
- **Recommended Properties** — personalized property suggestions based on user behavior
- **Guest Match Card** — matches guests to properties based on stated preferences
- **Pricing Insights** — AI-driven pricing analysis for listed properties
- **Travel Chatbot** — floating AI assistant available on every page to answer travel questions

### Room Pooling
- Create and join shared booking pools for a property
- Roommate compatibility matching (gender, sleep schedule, cleanliness, noise, smoking, pets, interests)
- Multiple cost-split modes: equal, custom percentage, by nights, or by beds
- Real-time pool chat with system messages for join/leave/payment events
- Pool invitations via email
- Booking deadline tracking with live spot availability counter

### Host Dashboard
- Dedicated host portal at `/Host/Dashboard`
- Stats cards for earnings, reservations, and occupancy
- Donut chart for visual revenue breakdown
- Data table for managing reservations
- Dedicated pages for Earnings, Messages, and Reservations

### Authentication
- Clerk-powered sign up, login, and logout
- Protected routes for hosts and authenticated users
- User profile management via Clerk's `<UserButton />`

### Additional
- Add Property modal with multi-step form and image upload
- Google Maps integration for property location display
- Country selector powered by `world-countries`
- Itinerary planner page
- My Properties management page
- My Reservations history page
- Toast notifications for all user actions
- Zustand for lightweight global state management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Authentication | Clerk |
| State Management | Zustand |
| Maps | Google Maps API (`@react-google-maps/api`) |
| Date Picker | `react-date-range` |
| Notifications | `react-hot-toast` |
| Data | `world-countries` |
| Backend API | Django REST Framework (external, via `NEXT_PUBLIC_API_HOST`) |
| Font | Geist (Google Fonts) |

---

## Project Structure

```
FlexBnB/
├── app/
│   ├── api/                        # Next.js API routes (reservations)
│   ├── components/
│   │   ├── addproperty/            # Add property form steps
│   │   ├── Calendar/               # Date range calendar
│   │   ├── Forms/                  # Reusable form inputs
│   │   ├── Host/                   # Host dashboard components
│   │   ├── Maps/                   # Google Maps property view
│   │   ├── Modals/                 # Login, Signup, AddProperty, ViewDetails
│   │   ├── navbar/                 # Navbar, search filters, user nav
│   │   ├── Properties/             # Property list, list item, reservation sidebar
│   │   ├── Recommendation/         # AI recommendations, chatbot, pricing insights
│   │   ├── Reviews/                # Review forms and review list
│   │   ├── RoomPooling/            # Full room pooling feature set
│   │   └── services/               # Centralized API service (GET/POST)
│   ├── Hooks/                      # Zustand stores (modals, countries, search)
│   ├── Host/                       # Host portal pages (Dashboard, Earnings, etc.)
│   ├── itinerary-planner/          # Trip itinerary planner page
│   ├── lib/                        # Shared utilities
│   ├── MyProperties/               # Host's listed properties
│   ├── MyReservations/             # Guest reservation history
│   ├── pages/                      # Additional pages
│   ├── preferences/                # User preference settings
│   ├── Properties/                 # Property detail page
│   ├── room-pooling/               # Room pooling browse & manage page
│   ├── layout.tsx                  # Root layout with Clerk, Navbar, Chatbot
│   └── page.tsx                    # Home page
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A running Django backend (see `NEXT_PUBLIC_API_HOST`)
- Clerk account for authentication keys
- Google Maps API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/FlexBnB.git
cd FlexBnB

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

```env
# Backend API base URL
NEXT_PUBLIC_API_HOST=http://localhost:8000

# Clerk Authentication — get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

> Never commit `.env.local` to version control. It is already included in `.gitignore`.

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Home — categories, AI recommendations, all properties |
| `/Properties/[id]` | Property detail with map, reviews, and reservation sidebar |
| `/MyProperties` | Host's own listed properties |
| `/MyReservations` | Guest's reservation history |
| `/room-pooling` | Browse and manage room pools |
| `/itinerary-planner` | Trip itinerary planner |
| `/preferences` | User preference settings for matching |
| `/Host/Dashboard` | Host analytics dashboard |
| `/Host/Earnings` | Host earnings breakdown |
| `/Host/Reservations` | Host reservation management |
| `/Host/Messages` | Host messaging center |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with Next.js 15 · Tailwind CSS · Clerk · Zustand</p>
