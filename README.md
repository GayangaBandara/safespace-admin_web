# SafeSpace Admin Web

A modern React-based admin dashboard for SafeSpace, built with TypeScript, Vite, and Supabase. This application provides a comprehensive interface for managing users, doctors, reports, analytics, and system settings.

## Features

- **User Management**: View and manage user accounts
- **Doctor Management**: Handle doctor profiles and information
- **Reports**: Access and manage system reports
- **Analytics**: View detailed analytics and charts
- **Settings**: Configure system preferences
- **Authentication**: Secure login/logout functionality
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Headless UI, Heroicons
- **State Management**: Zustand
- **Backend**: Supabase
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Tables**: TanStack Table

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd admin_web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code linting

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout component
│   ├── Navbar.tsx      # Top navigation bar
│   └── Sidebar.tsx     # Side navigation menu
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard page
│   └── Login.tsx       # Authentication page
├── lib/                # Utility libraries
│   └── supabase.ts     # Supabase client configuration
├── store/              # State management
│   └── adminStore.ts   # Admin state store
├── types/              # TypeScript type definitions
│   └── supabase.ts     # Supabase generated types
└── assets/             # Static assets
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Supabase Setup

1. Create a new Supabase project
2. Run the migration files in the `supabase/migrations/` directory
3. Update your environment variables with the project URL and anon key

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License.
