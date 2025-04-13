# Cigar Accessories E-commerce Store

This is a Next.js 14+ e-commerce store project scaffolded with TypeScript, Tailwind CSS, ShadCN UI, Prisma, NextAuth.js, Zustand, React Query, Cloudinary, Resend, Recharts, ESLint, and Prettier.

## Project Structure

- `app/` - Main application (Next.js App Router)
  - `api/` - API routes
  - `(routes)/` - Frontend routes
    - `admin/` - Admin dashboard
  - `components/` - Reusable UI components
- `prisma/` - Prisma schema and migrations
- `lib/` - Utility functions and helpers
- `public/` - Static assets
- `styles/` - Global styles, Tailwind config
- `hooks/` - Custom React hooks
- `providers/` - Context providers

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file (see below).
3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file in the project root with the following keys (use placeholder values):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
TAPPAY_APP_ID=your-tappay-app-id
TAPPAY_APP_KEY=your-tappay-app-key
TAPPAY_PARTNER_KEY=your-tappay-partner-key
RESEND_API_KEY=your-resend-api-key
```

## TapPay SDK

> **Note:** The TapPay SDK could not be installed via npm (no public package found). Integration instructions or a manual SDK import will be required at the implementation stage.

## License

MIT