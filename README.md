# MAaD Makes

MAaD Makes is a modern web application for showcasing and selling unique 3D printed products, custom designs, and collectible figures. Built with React, Vite, Tailwind CSS, and Firebase, it features a full admin dashboard, product management, waitlist, and more.

## Features

- Product catalog with categories and search
- Admin dashboard for managing products, images, categories, orders, and waitlist
- Customer waitlist for upcoming character designs
- User authentication and profile management
- Responsive, modern UI with Tailwind CSS
- Image upload and management (Cloudinary + Firebase)
- Order management and status tracking
- Contact form with email integration

## Tech Stack

- React 19
- Next.js 16
- TypeScript 6
- Tailwind CSS 4
- Firebase (Firestore, Auth, Functions)
- Cloudinary (for images)
- FontAwesome

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Firebase project (see `.env.example` for required keys)

## Firebase Setup

- Firestore is used for products, categories, images, orders, and waitlist collections.
- Auth is used for user login and admin access.
- Functions are used for email notifications and backend logic.
- See `firebase.json` and `firestore.rules` for configuration.

## Credits

- Portions of the project, as well as the automatic email response setup and some backend logic was made by AI Claude Sonnet 4.5.
- Icons by FontAwesome.
