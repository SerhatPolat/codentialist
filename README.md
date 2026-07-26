# Codentialist

AI-powered "task management and code generation" playground.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Learn More](#learn-more)

## Features

*   **GitHub Integration**: Seamlessly authenticate with GitHub to access your repositories.
*   **AI-powered Task Analysis**: Utilize AI to analyze task descriptions and suggest initial code modifications.
*   **Interactive Code Workspace**: An integrated Monaco Editor for real-time code editing with AI autocomplete and assistance.
*   **Task Management**: Create, view, edit, and delete tasks associated with specific GitHub repositories.
*   **Dynamic File Explorer**: Navigate and manage files within your repository sandbox, with visual indicators for added, modified, or deleted files.

## Technologies Used

*   [Next.js 14](https://nextjs.org/) (App Router)
*   [React 19](https://react.dev/)
*   [NextAuth.js](https://next-auth.js.org/) (for GitHub OAuth)
*   [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/))
*   [Google GenAI](https://ai.google.dev/) (for AI capabilities)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Monaco Editor](https://microsoft.github.io/monaco-editor/) (code workspace)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the repository

```bash
git clone [your-repo-url]
cd codentialist
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set up Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```
# NextAuth.js (for GitHub OAuth)
GITHUB_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_SECRET="YOUR_GITHUB_CLIENT_SECRET"
NEXTAUTH_SECRET="A_SUPER_SECRET_STRING_FOR_NEXTAUTH"

# MongoDB Connection
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"

# Google GenAI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

**How to get these keys:**
*   **GitHub OAuth**: Register a new OAuth App in your GitHub Developer Settings. Set the callback URL to `http://localhost:3000/api/auth/callback/github` for local development.
*   **MongoDB URI**: Obtain this from a MongoDB Atlas cluster or a local MongoDB instance.
*   **Google GenAI API Key**: Get this from the [Google AI Studio](https://aistudio.google.com/).

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

*   `/app`: Contains Next.js App Router pages and API routes.
    *   `/app/api`: Backend API routes for AI, GitHub interaction, authentication, and task management.
    *   `/app/workspace/[taskId]`: Dynamic route for the AI-powered code workspace.
*   `/components`: React components, such as `CodeWorkspace`, `FileExplorer`, and `TaskBoard`.
*   `/lib`: Utility functions, including `db.ts` for MongoDB connection.
*   `/models`: Mongoose schemas defining the data models (e.g., `Task.ts`).
*   `/types`: TypeScript type definitions used across the application.
*   `projectInfo.ts`: Centralized project metadata like title and description.

## API Endpoints

The application exposes several API endpoints:

*   `/api/ai/analyze-task`: Analyzes a task description and current files to suggest initial modifications.
*   `/api/ai/assistant`: Provides AI-powered code modifications based on user instructions.
*   `/api/ai/autocomplete`: Offers inline code autocompletion suggestions.
*   `/api/github/branches`: Fetches available branches for a given GitHub repository.
*   `/api/github/fetch-code`: Fetches the content of all files in a specified repository and branch.
*   `/api/tasks`: Provides CRUD operations for managing user tasks (GET, POST, PUT, DELETE).
*   `/api/auth/[...nextauth]`: Handles authentication flows powered by NextAuth.js.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!