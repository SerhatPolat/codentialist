# 🚀 Codentialist: Your AI-Powered Coding Playground

![Codentialist Logo/Banner](https://img.shields.io/badge/Codentialist-AI_Powered_IDE-blueviolet?style=for-the-badge&logo=react&logoColor=white)

Welcome to **Codentialist**, a sophisticated, task-based AI-powered coding playground designed to streamline your development workflow directly within a GitHub repository context. This application empowers developers with intelligent assistance for task generation, code analysis, real-time code modifications, and seamless integration with Git operations.

## ✨ Features

-   **GitHub Authentication**: Secure sign-in using GitHub OAuth for seamless integration with your repositories.
-   **Repository Sandbox**: Select and load any GitHub repository to act as your coding sandbox.
-   **Task Management**: Create, edit, and manage development tasks associated with a specific repository.
-   **AI Task Generation**: Leverage Google Gemini AI to analyze your codebase and suggest innovative feature ideas or technical improvements.
-   **AI-Powered Code Workspace**: An interactive Monaco Editor environment where AI assists with:
    -   **Task Analysis**: Initial code modifications and an explanation from AI based on task requirements.
    -   **Interactive Assistant**: Refine code and apply changes based on natural language instructions.
    -   **Auto-Complete**: Real-time, inline code suggestions to boost productivity.
-   **Integrated File Explorer**: Navigate and manage files within the sandbox, with visual indicators for `added`, `modified`, and `deleted` files.
-   **Git Workflow Integration**: Commit AI-generated or manually adjusted code changes and create Pull Requests directly to your GitHub repository.
-   **AI Code Review**: Automatically generate a concise code review comment for new Pull Requests, highlighting potential issues or best practice suggestions.
-   **Responsive UI**: Built with Next.js and Tailwind CSS for a modern, intuitive, and responsive user experience.

## 🛠️ Technology Stack

-   **Frontend**: Next.js (React 19), TypeScript, Tailwind CSS
-   **Backend**: Next.js API Routes (Serverless Functions)
-   **Database**: MongoDB (via Mongoose ODM)
-   **Authentication**: NextAuth.js (GitHub Provider)
-   **AI**: Google Gemini Pro (via `@google/genai` SDK)
-   **Code Editor**: Monaco Editor (via `@monaco-editor/react`)
-   **Version Control Integration**: GitHub API
-   **Icons**: Lucide React

## 🚀 Getting Started

Follow these steps to get your Codentialist environment up and running.

### Prerequisites

-   **Node.js**: Version 20.x or higher.
-   **npm / yarn / pnpm / bun**: A package manager.
-   **MongoDB Atlas**: A MongoDB database instance. You'll need the connection URI.
-   **GitHub OAuth App**: Create a new OAuth App in your GitHub settings (Settings > Developer settings > OAuth Apps). You'll need the `Client ID` and `Client Secret`.
    -   **Homepage URL**: `http://localhost:3000` (for local development)
    -   **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github` (for local development)
-   **Google Gemini API Key**: Obtain an API key from Google AI Studio or Google Cloud for Gemini (`GEMINI_API_KEY`).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/codentialist.git
    cd codentialist
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Configure environment variables:**

    Create a `.env.local` file in the root of your project and add the following:

    ```env
    GITHUB_ID=YOUR_GITHUB_OAUTH_CLIENT_ID
    GITHUB_SECRET=YOUR_GITHUB_OAUTH_CLIENT_SECRET
    NEXTAUTH_SECRET=A_VERY_LONG_RANDOM_STRING_FOR_NEXTAUTH_SESSION_ENCRYPTION
    MONGODB_URI=YOUR_MONGODB_CONNECTION_URI
    GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
    ```

    *   `NEXTAUTH_SECRET`: You can generate a strong secret using `openssl rand -base64 32` or similar tools.

### Running the Application

Start the development server:

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

## 📚 Core Concepts

### Authentication
Codentialist uses `NextAuth.js` with `GitHubProvider` for user authentication. This allows the application to securely interact with the GitHub API on behalf of the user, fetching repository information, and performing Git operations like creating branches, commits, and pull requests. The `repo read:user` scope is requested for necessary repository access.

### Task Management
Tasks are managed via a MongoDB database, utilizing Mongoose for schema definition and interaction. Each `ITask` document (`models/Task.ts`) stores details such as title, description, status (`Pending`, `In Progress`, `Done`), associated GitHub repository, the base branch for changes, a snapshot of affected files (`IFileSnapshot[]`), and an `aiExplanation` for initial AI-generated modifications.

### AI Integration
The core of Codentialist's intelligence comes from Google Gemini Pro. Various API routes (`/api/ai/*`) are dedicated to different AI functionalities:
-   `/api/ai/analyze-task`: Analyzes a given task and codebase snapshot to suggest initial code modifications.
-   `/api/ai/assistant`: Provides an interactive assistant in the code workspace to refine changes based on user instructions.
-   `/api/ai/auto-complete`: Offers real-time inline code completion suggestions within the Monaco Editor.
-   `/api/ai/generate-tasks`: Examines a repository's codebase to brainstorm and suggest new, valuable development tasks.

### Code Workspace
The `CodeWorkspace` component (`components/CodeWorkspace.tsx`) is the central hub for development. It features:
-   **Monaco Editor**: A powerful code editor providing syntax highlighting, error checking, and the AI auto-complete feature.
-   **File Explorer**: A tree-view component (`components/FileExplorer.tsx`) that visualizes the repository structure and highlights file statuses (modified, added, deleted).
-   **Interactive Assistant**: A dedicated panel for direct AI interaction and reviewing AI-generated explanations.

### GitHub Integration
The application directly interfaces with the GitHub API (`/api/github/*`) to perform critical version control actions:
-   `/api/github/branches`: Fetches available branches for a given repository.
-   `/api/github/fetch-code`: Pulls the content of all files from a specified branch of a repository, creating the initial `filesSnapshot` for a task.
-   `/api/github/commit-and-create-pr`: Orchestrates the entire Git workflow: fetching base branch/tree SHAs, creating a new Git tree with changes, creating a new commit, creating a new branch for the task, and finally opening a Pull Request. This route also triggers an AI code review to comment on the newly created PR.

## 📂 Project Structure

```
.gitignore
README.md
app/
├── api/
│   ├── ai/
│   │   ├── analyze-task/route.ts
│   │   ├── assistant/route.ts
│   │   ├── auto-complete/route.ts
│   │   └── generate-tasks/route.ts
│   ├── auth/
│   │   └── [...nextauth]/route.ts
│   ├── github/
│   │   ├── branches/route.ts
│   │   ├── commit-and-create-pr/route.ts
│   │   └── fetch-code/route.ts
│   └── tasks/route.ts
├── favicon.ico
├── globals.css
├── layout.tsx
├── page.tsx
└── workspace/
    └── [taskId]/page.tsx
components/
├── CodeWorkspace.tsx
├── FileExplorer.tsx
├── GridBackground.tsx
├── LoadingView.tsx
├── NextAuthProvider.tsx
├── OrbsBackground.tsx
└── TaskBoard.tsx
eslint.config.mjs
lib/
└── db.ts
models/
└── Task.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
projectInfo.ts
proxy.ts
tsconfig.json
types/
└── workspace.ts
```

## ⚠️ Disclaimer

**Please Note**: This application heavily utilizes AI for code generation and modification suggestions. While the AI is powerful, its outputs can occasionally be problematic, contain bugs, or suggest less-than-optimal solutions. **Always review AI-generated code and explanations carefully** before integrating them into your production codebase.
