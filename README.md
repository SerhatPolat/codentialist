# Codentialist: Your AI-Powered Coding Playground

Codentialist is an innovative, task-based AI-powered coding playground designed to streamline development workflows. It integrates with GitHub, allowing users to manage tasks, get AI-generated code suggestions and modifications, and directly create pull requests, all within a unified interface. This project aims to enhance developer productivity by leveraging large language models for various coding tasks, from generating task ideas to real-time code auto-completion and intelligent code reviews.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Technology Stack](#technology-stack)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Running the Development Server](#running-the-development-server)
    *   [Building for Production](#building-for-production)
4.  [Core Features](#core-features)
    *   [GitHub Integration](#github-integration)
    *   [Task Management](#task-management)
    *   [AI-Powered Task Analysis](#ai-powered-task-analysis)
    *   [AI Code Assistant](#ai-code-assistant)
    *   [AI Task Idea Generation](#ai-task-idea-generation)
    *   [Interactive Code Workspace](#interactive-code-workspace)
    *   [Git Operations (Commit & Pull Request)](#git-operations-commit--pull-request)
5.  [API Endpoints](#api-endpoints)
    *   [Authentication API (`/api/auth`)](#authentication-api-apiauth)
    *   [GitHub API (`/api/github`)](#github-api-apigithub)
    *   [AI API (`/api/ai`)](#ai-api-api-ai)
    *   [Tasks API (`/api/tasks`)](#tasks-api-apitasks)
6.  [Data Models](#data-models)
7.  [Project Structure](#project-structure)
8.  [Disclaimer](#disclaimer)

## 1. Project Overview

Codentialist is a web application built with Next.js that acts as an intelligent coding assistant. It allows users to connect their GitHub accounts, manage development tasks associated with specific repositories, and receive AI-driven support throughout the coding process. From suggesting new features based on codebase analysis to providing inline code completions and even drafting pull request descriptions with an AI-powered code review, Codentialist aims to simplify and accelerate software development.

## 2. Technology Stack

*   **Framework**: Next.js (React)
*   **Authentication**: NextAuth.js (GitHub Provider)
*   **Database**: MongoDB (via Mongoose ODM)
*   **AI Integration**: Google Gemini API (`@google/genai`)
*   **Code Editor**: Monaco Editor (`@monaco-editor/react`)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Version Control**: GitHub API interaction

## 3. Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm, yarn, pnpm, or bun
*   MongoDB Atlas account (or local MongoDB instance)
*   GitHub OAuth App credentials (Client ID and Client Secret)
*   Google Gemini API Key

### Installation

1.  **Clone the repository**:

    ```bash
    git clone [repository-url]
    cd codentialist
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

### Environment Variables

Create a `.env.local` file in the project root and add the following variables:

```env
GITHUB_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_SECRET="YOUR_GITHUB_CLIENT_SECRET"
NEXTAUTH_SECRET="A_STRONG_SECRET_FOR_NEXTAUTH_SESSION_ENCRYPTION"
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

*   **`GITHUB_ID` / `GITHUB_SECRET`**: Obtain these from your GitHub OAuth App settings. Ensure the callback URL for your GitHub OAuth App is set to `http://localhost:3000/api/auth/callback/github` for local development.
*   **`NEXTAUTH_SECRET`**: A long, random string. You can generate one using `openssl rand -base64 32` or by visiting [https://generate-secret.vercel.app/](https://generate-secret.vercel.app/).
*   **`MONGODB_URI`**: Your MongoDB connection string. For MongoDB Atlas, it typically looks like `mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority`.
*   **`GEMINI_API_KEY`**: Your API key for Google Gemini. You can get one from the [Google AI Studio](https://aistudio.google.com/).

### Running the Development Server

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

### Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

Then, run the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
# or
bun start
```

## 4. Core Features

### GitHub Integration

Users can securely sign in using their GitHub account via NextAuth.js. This grants the application necessary permissions (scopes: `repo read:user`) to fetch repository information, code, and perform Git operations like committing and creating pull requests.

### Task Management

Codentialist provides a simple task board where users can:

*   **Create New Tasks**: Define a title and detailed description for a coding task associated with a specific GitHub repository.
*   **Edit Existing Tasks**: Modify the title or description of any task.
*   **Delete Tasks**: Remove tasks from the board.
*   **Track Status**: Tasks have statuses like "Pending", "In Progress", and "Done".

### AI-Powered Task Analysis

When a task workspace is initiated, the AI analyzes the task's title and description along with a snapshot of the repository's codebase. It then suggests initial modifications or provides an explanation on how to approach the task within the code workspace.

### AI Code Assistant

Within the code workspace, a dedicated AI assistant can:

*   **Generate Inline Completions**: Provides real-time code suggestions as the user types, based on the current code context.
*   **Workspace Adjustments**: Users can provide natural language instructions to the AI assistant to make specific modifications across multiple files in the workspace (e.g., "refactor this component to use hooks", "add error handling to all API calls"). The AI then generates and applies these changes.

### AI Task Idea Generation

Codentialist can analyze an entire GitHub repository's codebase and suggest valuable task ideas, focusing on innovation and technical improvements. This feature helps developers identify potential enhancements and new features for their projects.

### Interactive Code Workspace

The workspace features a fully interactive code editor powered by Monaco Editor. Key functionalities include:

*   **File Explorer**: A tree-like file explorer to navigate and select files. It visually indicates the status of each file (modified, added, deleted, original).
*   **Syntax Highlighting & Language Support**: Automatic language detection and syntax highlighting for various file types.
*   **File Status Tracking**: Changes made in the editor are tracked, marking files as `modified` or `added`.

### Git Operations (Commit & Pull Request)

Once a task is marked as "Done" and the code changes are finalized in the workspace, users can:

*   **Commit Changes**: Create a new commit with a custom title and description.
*   **Create Pull Request**: Automatically create a new branch, push the commit, and open a pull request on GitHub. The PR description includes a disclaimer about AI-generated content and an AI-powered code review comment analyzing the changes for potential issues, security vulnerabilities, and adherence to best practices.

## 5. API Endpoints

The application exposes several API routes under `/api` to handle authentication, GitHub interactions, AI processing, and task management.

### Authentication API (`/api/auth`)

Hangles user authentication via NextAuth.js with GitHub.

*   `GET /api/auth/signin/github`: Initiates GitHub OAuth login flow.
*   `GET /api/auth/signout`: Logs out the user.
*   `GET /api/auth/session`: Retrieves current session information.
*   `GET /api/auth/csrf`: Retrieves CSRF token.
*   `GET /api/auth/providers`: Retrieves available authentication providers.

### GitHub API (`/api/github`)

Proxies requests to the GitHub API, handling authentication with the user's access token.

*   `GET /api/github/branches?repo=<owner>/<repo-name>`
    *   **Description**: Fetches all branches for a specified repository.
    *   **Authentication**: Required.
    *   **Query Params**: `repo` (e.g., `SerhatPolat/codentialist`)
    *   **Response**: `{ branches: string[] }`

*   `POST /api/github/fetch-code`
    *   **Description**: Retrieves the content of all files for a given repository and branch.
    *   **Authentication**: Required.
    *   **Request Body**: `{ repository: string, branch: string }`
    *   **Response**: `{ files: IFileSnapshot[] }`

*   `POST /api/github/commit-and-create-pr`
    *   **Description**: Commits workspace changes to a new branch and creates a pull request on GitHub, including an AI-generated code review.
    *   **Authentication**: Required.
    *   **Request Body**: `{ taskId: string, repository: string, baseBranch: string, title: string, description: string, files: IFileSnapshot[] }`
    *   **Response**: `{ success: boolean, prUrl: string }`

### AI API (`/api/ai`)

Integrates with the Google Gemini API to provide AI functionalities.

*   `POST /api/ai/analyze-task`
    *   **Description**: Analyzes a task's context and current codebase to suggest initial modifications for the workspace.
    *   **Authentication**: Required.
    *   **Request Body**: `{ taskTitle: string, taskDescription: string, files: Array<{ path: string, content: string }> }`
    *   **Response**: `{ explanation: string, files: IFileSnapshot[] }`

*   `POST /api/ai/assistant`
    *   **Description**: Processes user instructions to modify files in the workspace based on the current file snapshot.
    *   **Authentication**: Required.
    *   **Request Body**: `{ instruction: string, files: IFileSnapshot[] }`
    *   **Response**: `{ explanation: string, files: IFileSnapshot[] }` (only modified/added/deleted files)

*   `POST /api/ai/auto-complete`
    *   **Description**: Provides inline code completion suggestions based on code before and after the cursor.
    *   **Authentication**: Required.
    *   **Request Body**: `{ prefix: string, suffix: string }`
    *   **Response**: `{ suggestion: string }`

*   `POST /api/ai/generate-tasks`
    *   **Description**: Analyzes repository source files to suggest new feature or improvement task ideas.
    *   **Authentication**: Required.
    *   **Request Body**: `{ files: Array<{ path: string, content: string }> }`
    *   **Response**: `Array<{ title: string, description: string }>`

### Tasks API (`/api/tasks`)

Manages CRUD operations for tasks stored in MongoDB.

*   `GET /api/tasks?id=<taskId>` or `GET /api/tasks?repository=<owner>/<repo-name>`
    *   **Description**: Retrieves a single task by ID or all tasks for a specific repository.
    *   **Authentication**: Required.
    *   **Query Params**: `id` or `repository`
    *   **Response**: `ITask` object or `ITask[]`

*   `POST /api/tasks`
    *   **Description**: Creates a new task.
    *   **Authentication**: Required.
    *   **Request Body**: `{ title: string, description: string, repository: string }`
    *   **Response**: Newly created `ITask` object.

*   `PUT /api/tasks`
    *   **Description**: Updates an existing task.
    *   **Authentication**: Required.
    *   **Request Body**: `{ id: string, ...updates }` (e.g., `status`, `branch`, `filesSnapshot`, `aiExplanation`)
    *   **Response**: Updated `ITask` object.

*   `DELETE /api/tasks?id=<taskId>`
    *   **Description**: Deletes a task by ID.
    *   **Authentication**: Required.
    *   **Query Params**: `id`
    *   **Response**: `{ message: string }`

## 6. Data Models

### `ITask`

Represents a task in the system, stored in MongoDB.

```typescript
export interface ITask {
  _id: string; // MongoDB ObjectId
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Done";
  repository: string; // e.g., "owner/repo-name"
  branch?: string; // The base branch for the task
  filesSnapshot: IFileSnapshot[]; // Array of file states in the workspace
  aiExplanation?: string; // AI's initial analysis or last explanation
  createdAt: string; // Date string
  updatedAt: string; // Date string
}

export interface IFileSnapshot {
  path: string;
  content: string;
  status: "original" | "added" | "modified" | "deleted";
}
```

## 7. Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/                  # AI-related API routes
│   │   │   ├── analyze-task/route.ts
│   │   │   ├── assistant/route.ts
│   │   │   ├── auto-complete/route.ts
│   │   │   └── generate-tasks/route.ts
│   │   ├── auth/                # NextAuth.js authentication routes
│   │   │   └── [...nextauth]/route.ts
│   │   ├── github/              # GitHub API proxy routes
│   │   │   ├── branches/route.ts
│   │   │   ├── commit-and-create-pr/route.ts
│   │   │   └── fetch-code/route.ts
│   │   └── tasks/route.ts       # MongoDB task management API
│   ├── workspace/               # Task-specific workspace page
│   │   └── [taskId]/page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Main application landing page
├── components/                  # Reusable React components
│   ├── CodeWorkspace.tsx
│   ├── FileExplorer.tsx
│   ├── GridBackground.tsx
│   ├── LoadingView.tsx
│   ├── NextAuthProvider.tsx
│   ├── OrbsBackground.tsx
│   └── TaskBoard.tsx
├── lib/
│   └── db.ts                    # Database connection utility
├── models/
│   └── Task.ts                  # Mongoose Task schema and model
├── types/
│   └── workspace.ts             # TypeScript interfaces for data models
├── projectInfo.ts               # Project metadata
├── proxy.ts                     # Next.js middleware for authentication
├── .env.local.example           # Example environment variables file
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

**IMPORTANT**: This application heavily relies on AI models for code generation, analysis, and modification. While powerful, AI outputs can sometimes be problematic, contain errors, or introduce vulnerabilities. Always review AI-generated code carefully before integrating it into your production codebase.