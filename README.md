# Zuckonit

A minimal personal blogging platform built with Next.js, Tailwind CSS, ShadCN UI, and Appwrite.

## Features

- User authentication (login/register)
- Create, read, update, and delete blog posts
- Markdown support for post content
- Image uploads for post featured images
- Responsive design for all devices
- Clean and minimal UI

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Appwrite (Authentication, Database, and Storage)
- **Deployment**: Vercel (frontend), Appwrite Cloud (backend)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Appwrite account

### Appwrite Setup

1. Create a new project in Appwrite
2. Set up the following services:
   - **Authentication**: Enable Email/Password
   - **Database**: Create a database called `zuckonit_db`
   - **Collection**: Create a collection called `posts` with the following attributes:
     - `title` (string, required)
     - `content` (string, required)
     - `image` (string, optional)
     - `created_at` (datetime, required)
   - **Storage**: Create a bucket called `post_images`
3. Set up permissions for collections and buckets

### Environment Variables

1. Copy the `.env.local.example` file to `.env.local` (or create a new `.env.local` file)
2. Fill in your Appwrite configuration:
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=zuckonit_db
   NEXT_PUBLIC_APPWRITE_COLLECTION_ID=posts
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=post_images
   ```
3. Replace `your-project-id` with your actual Appwrite project ID
4. If you used different names for your database, collection, or bucket, update those values as well

### Local Development

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up your environment variables as described above
4. Run the development server
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy

### Backend (Appwrite Cloud)

1. Your Appwrite backend is already deployed on Appwrite Cloud
2. Just update the environment variables in your production environment with your Appwrite project details

## Update Existing Posts

If you have existing posts in your database that were created before the addition of `status` and `post_type` fields, you can run the update script to set default values:

```bash
# Compile and run the script
npx ts-node scripts/update-post-defaults.ts
```

This will:
- Set `status = 'published'` for all posts where status is null
- Set `post_type = 'standard'` for all posts where post_type is null

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Appwrite](https://appwrite.io/) #   z u c k o n i t 
 
 