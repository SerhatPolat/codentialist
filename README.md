# Codentialist: AI-Powered Task-Based Coding Playground

## Project Overview

Codentialist is an innovative, AI-powered coding playground designed to streamline the software development workflow through task-based management and intelligent code assistance. It integrates directly with GitHub, allowing users to select a repository, manage development tasks, and receive AI-generated code suggestions and modifications within an interactive code workspace. This project leverages modern web technologies to create a robust and intuitive development environment.

**Project Title:** Codentialist
**Project Description:** Task based AI-powered coding playground

## Technologies Used

This project is built using a stack of powerful and widely adopted technologies:

-   **Next.js 16.2.10 (App Router):** A React framework for building full-stack web applications, chosen for its server-side rendering (SSR), static site generation (SSG), and API routes capabilities.
-   **React 19.2.4:** A declarative, component-based JavaScript library for building user interfaces.
-   **NextAuth.js 4.24.14:** For secure and flexible authentication, specifically integrated with GitHub OAuth.
-   **MongoDB 9.7.3 & Mongoose:** A NoSQL database for storing application data (tasks) and an ODM (Object Data Modeling) library for MongoDB and Node.js.
-   **Google Gemini API (gemini-2.5-flash):** Integrated for various AI functionalities, including task analysis, idea generation, and code auto-completion.
-   **Monaco Editor:** The code editor that powers VS Code, embedded in the workspace for an rich coding experience.
-   **Tailwind CSS 4.x:** A utility-first CSS framework for rapidly styling the user interface.
-   **TypeScript 5.x:** Provides type safety and enhances developer experience across the codebase.

## Key Features

Codentialist offers a suite of features designed to enhance productivity and developer experience:

1.  **GitHub Authentication:** Secure sign-in using GitHub, granting necessary permissions for repository interaction.
2.  **Repository Selection/Sandbox:** Users can select a GitHub repository to act as their coding sandbox, enabling context-aware AI interactions.
3.  **Task Management:** A comprehensive board for creating, viewing, editing, and deleting development tasks.
4.  **AI-Powered Task Idea Generation:** AI analyzes the codebase of a selected branch to suggest innovative feature or improvement ideas.
5.  **AI-Powered Task Analysis & Initial Code Suggestions:** Upon starting a task, AI analyzes the task description and relevant source files to provide initial modifications or additions to the codebase, guiding the developer.
6.  **Interactive AI Code Assistant:** Within the code workspace, users can instruct the AI assistant to perform modifications, refactor code, or generate new code snippets based on natural language prompts. It also provides inline code auto-completion.
7.  **Real-time Code Editing:** An integrated Monaco Editor allows for efficient code modifications with syntax highlighting and intelligent features.
8.  **File Explorer:** A hierarchical file explorer for easy navigation and selection of files within the workspace.
9.  **GitHub Integration (Commit & PR):** Ability to commit changes from the workspace to a new branch and create a pull request directly on GitHub, including an AI-generated code review comment.
10. **Persistent Task State:** Task details and associated code snapshots are persisted in MongoDB.

## Project Structure

The project follows a standard Next.js App Router structure with logical separation of concerns:

-   `./`: Root directory containing configuration files (`package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `README.md`).
-   `app/`: Next.js App Router directory.
    -   `api/`: Backend API routes.
        -   `ai/`: AI-specific endpoints.
            -   `analyze-task/route.ts`: API for initial AI task analysis and code suggestions.
            -   `assistant/route.ts`: API for interactive AI code modifications and explanations.
            -   `auto-complete/route.ts`: API for AI-powered inline code auto-completion.
            -   `generate-tasks/route.ts`: API for AI-powered task idea generation.
        -   `auth/[...nextauth]/route.ts`: NextAuth.js API route for authentication (GitHub OAuth).
        -   `github/`: GitHub API proxy endpoints.
            -   `branches/route.ts`: Fetches repository branches.
            -   `commit-and-create-pr/route.ts`: Handles committing changes and creating a pull request.
            -   `fetch-code/route.ts`: Fetches content of files from a GitHub repository.
        -   `tasks/route.ts`: CRUD API for managing development tasks stored in MongoDB.
    -   `favicon.ico`: Application favicon.
    -   `globals.css`: Global Tailwind CSS imports and custom root styles.
    -   `layout.tsx`: Root layout component for the entire application.
    -   `page.tsx`: The main landing page for repository selection and task board display.
    -   `workspace/[taskId]/page.tsx`: Dynamic route for the AI-powered code workspace for a specific task.
-   `components/`: Reusable React components.
    -   `CodeWorkspace.tsx`: The core component for the interactive code editor, file explorer, and AI assistant interface.
    -   `FileExplorer.tsx`: Component for navigating and selecting files within the workspace.
    -   `GridBackground.tsx`: Background component with a grid pattern.
    -   `LoadingView.tsx`: Displays a loading spinner and message.
    -   `NextAuthProvider.tsx`: Wraps the application with `SessionProvider` for NextAuth.js.
    -   `OrbsBackground.tsx`: Background component with animated orbs.
    -   `TaskBoard.tsx`: Manages the display and interaction with development tasks.
-   `lib/db.ts`: Utility for connecting to the MongoDB database.
-   `models/Task.ts`: Mongoose schema definition for the `Task` model.
-   `projectInfo.ts`: Centralized file for project-wide metadata like title and description.
-   `proxy.ts`: Next.js middleware for authentication, redirecting unauthenticated users, and protecting API routes.
-   `types/workspace.ts`: TypeScript interface definitions for `IFileSnapshot` and `ITask`.

## Setup and Installation

### Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js (LTS version recommended)
-   npm, yarn, pnpm, or bun (your preferred package manager)
-   A GitHub account for authentication and repository integration.
-   A Google Cloud Project with the Gemini API enabled and an API key.
-   A MongoDB Atlas or local MongoDB instance, and its connection URI.

### Environment Variables

Create a `.env.local` file in the root of your project and populate it with the following environment variables:

```env
# GitHub OAuth Application Credentials
GITHUB_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_SECRET=YOUR_GITHUB_CLIENT_SECRET

# NextAuth.js Secret (generate with `openssl rand -base64 32`)
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET

# MongoDB Connection URI
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

# Google Gemini API Key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**GitHub OAuth App Setup:**

1.  Go to your GitHub profile settings -> Developer settings -> OAuth Apps.
2.  Click 