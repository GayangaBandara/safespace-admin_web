# SafeSpace Admin Web

A secure, modern React-based admin dashboard for SafeSpace, built with TypeScript, Vite, and Supabase. This application provides comprehensive administrator management and authentication for the SafeSpace platform.

## Core Features

- **Admin Authentication**: Secure email-based authentication with approval workflow
- **Role-based Access Control**: Support for moderator and superadmin roles
- **Admin Profile Management**: View and manage admin profiles
- **Approval Workflow**: Superadmin approval required for new admin registrations
- **Email Notifications**: Automated notifications for registration and approval processes
- **Secure Sessions**: Session management with Supabase Auth
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 4
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand with persist middleware
- **Backend & Auth**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Email Service**: Resend API
- **Type Safety**: TypeScript with strict mode

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
admin_web/
├── dist/                    # Build output
├── public/                  # Static assets
├── src/
│   ├── assets/             # Project assets
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx     # Main layout wrapper
│   │   ├── Navbar.tsx     # Top navigation
│   │   └── Sidebar.tsx    # Side navigation
│   ├── lib/               # Core libraries
│   │   ├── adminService.ts   # Admin operations
│   │   ├── supabase.ts      # Supabase client
│   │   └── customStorage.ts  # Storage utilities
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx    # Admin dashboard
│   │   ├── Login.tsx       # Login page
│   │   └── SignUp.tsx      # Registration page
│   ├── providers/         # Context providers
│   │   └── AuthProvider.tsx # Auth context
│   ├── store/             # State management
│   │   └── adminStore.ts    # Admin state
│   ├── types/             # TypeScript types
│   │   └── supabase.ts     # Generated types
│   └── utils/             # Utility functions
│       └── checkEnv.ts     # Environment validation
├── supabase/              # Database configuration
│   └── migrations/        # SQL migrations
└── vite.config.ts         # Vite configuration
```

## Database Setup

1. Create a new Supabase project
2. Apply migrations in order:
   ```bash
   cd supabase/migrations
   ```
   Run the following SQL files in sequence:
   - 00001_initial_schema.sql
   - 00002_admin_approval.sql
   - 00003_email_templates.sql
   - 00004_admin_functions.sql
   - 00005_admin_policies.sql
   - 00006_create_superadmin.sql
   - 00007_admin_notifications.sql

3. Configure Resend API key in Supabase:
   ```sql
   alter database your_db_name set app.resend_api_key = 'your_resend_api_key';
   ```

## Authentication Flow

1. Admin signs up with email and password
2. Email verification is required
3. Once verified, the account status is set to 'pending'
4. Superadmin receives notification of new registration
5. Superadmin approves/rejects the registration
6. Admin receives email notification of approval status
7. If approved, admin can log in with moderator privileges

## Type Safety

The project uses TypeScript with strict mode enabled. Supabase types are auto-generated and can be updated using:

```bash
npm run update-types
```

## Development Standards

- Use absolute imports with `@/` prefix
- Follow component folder structure convention
- Write unit tests for new features
- Maintain strict TypeScript typing
- Follow ESLint and Prettier configurations

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_RESEND_API_KEY`: Resend API key for email notifications

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License.
