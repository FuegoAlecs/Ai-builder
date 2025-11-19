# AI Builder Backend

A production-grade Node.js service that leverages the Groq API to generate high-quality React components through a multi-agent architecture. The system employs specialized AI agents for planning, design, code generation, quality assurance, and code fixing, delivering production-ready React components with Tailwind CSS through a real-time streaming API.

## Features

- **Multi-Agent Architecture**: Specialized AI agents for planning, design, code generation, quality review, and fixing
- **Real-Time Streaming**: Server-Sent Events (SSE) for live progress updates and code streaming
- **Two Generation Modes**:
  - **Simple Mode**: Fast, single-call generation for quick prototyping
  - **Advanced Mode**: Full multi-agent pipeline with quality assurance
- **Production-Ready**: Comprehensive error handling, retry logic, and graceful shutdown
- **Flexible Configuration**: Environment-based configuration for different deployment scenarios

## Architecture

```
┌─────────────────┐
│  Frontend Client │
└────────┬────────┘
         │ HTTP/SSE
         ▼
┌─────────────────────────────────────────┐
│         Express Server                   │
│  ┌────────────────────────────────────┐ │
│  │  Multi-Agent Pipeline              │ │
│  │  1. Planning Agent                 │ │
│  │  2. Design Agent                   │ │
│  │  3. Code Agent                     │ │
│  │  4. Quality Agent (optional)       │ │
│  │  5. Fix Agent (if needed)          │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Groq API      │
         │ (gpt-oss-120b)  │
         └─────────────────┘
```

## Prerequisites

- Node.js 18+ (ES6 modules support)
- Groq API key ([Get one here](https://console.groq.com))
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-builder-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration (see [Environment Variables](#environment-variables) section below)

4. **Start the server**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | **Yes** | - | Your Groq API key for accessing the gpt-oss-120b model |
| `PORT` | No | `3000` | Port number for the server to listen on |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `FRONTEND_URL` | No | `*` (dev) | Allowed CORS origin URL (e.g., `http://localhost:5173`) |

### Example Configuration

```bash
# Required
GROQ_API_KEY=gsk_your_api_key_here

# Optional
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Health Check

Check if the service is running and get model information.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "model": "gpt-oss-120b"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

#### 2. Simple Generation

Fast, single-call code generation without the multi-agent pipeline. Ideal for quick prototyping.

**Endpoint:** `POST /generate-simple`

**Request Body:**
```json
{
  "prompt": "Create a login form with email and password fields",
  "model": "llama-3.3-70b-versatile",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Parameters:**
- `prompt` (string, required): Description of the component to generate
- `model` (string, optional): Groq model to use (default: `llama-3.3-70b-versatile`)
- `conversationHistory` (array, optional): Previous conversation messages for context

**Response:** Server-Sent Events (SSE) stream

**SSE Events:**
```javascript
// Code chunk event (multiple)
data: {"chunk": "import React from 'react';\n"}

// Completion event
data: {"stage": "complete", "code": "...full code..."}

// Error event (if error occurs)
data: {"error": "Error message"}
```

**Example:**
```bash
curl -X POST http://localhost:3000/generate-simple \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a responsive navbar with logo and menu items"
  }'
```

**JavaScript Example:**
```javascript
const eventSource = new EventSource('http://localhost:3000/generate-simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a card component with image, title, and description'
  })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.chunk) {
    console.log('Code chunk:', data.chunk);
  } else if (data.stage === 'complete') {
    console.log('Complete code:', data.code);
    eventSource.close();
  } else if (data.error) {
    console.error('Error:', data.error);
    eventSource.close();
  }
};
```

---

#### 3. Advanced Generation

Full multi-agent pipeline with planning, design, code generation, quality review, and optional fixing.

**Endpoint:** `POST /generate-advanced`

**Request Body:**
```json
{
  "prompt": "Create a dashboard with charts and statistics",
  "enableQA": true,
  "conversationHistory": []
}
```

**Parameters:**
- `prompt` (string, required): Description of the component to generate
- `enableQA` (boolean, optional): Enable quality assurance and fixing (default: `true`)
- `conversationHistory` (array, optional): Previous conversation messages for context

**Response:** Server-Sent Events (SSE) stream

**SSE Events:**
```javascript
// Progress events
data: {"stage": "planning", "progress": 10}
data: {"stage": "designing", "progress": 30}
data: {"stage": "generating", "progress": 50}

// Code chunk events (multiple during generation)
data: {"chunk": "import React from 'react';\n"}

// Quality review event (if enableQA is true)
data: {
  "review": {
    "issues": [
      {
        "type": "a11y",
        "severity": "medium",
        "description": "Missing alt text on image",
        "fix": "Add descriptive alt attribute"
      }
    ],
    "needsRevision": true,
    "overallQuality": "good"
  }
}

// Fix stage (if issues found)
data: {"stage": "fixing", "progress": 85}
data: {"chunk": "...fixed code chunk..."}

// Completion event
data: {
  "stage": "complete",
  "progress": 100,
  "code": "...final code..."
}

// Error event (if error occurs)
data: {"error": "Error message", "stage": "planning"}
```

**Example:**
```bash
curl -X POST http://localhost:3000/generate-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user profile page with avatar, bio, and social links",
    "enableQA": true
  }'
```

**JavaScript Example:**
```javascript
fetch('http://localhost:3000/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a pricing table with three tiers',
    enableQA: true
  })
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  function readStream() {
    reader.read().then(({ done, value }) => {
      if (done) return;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.stage) {
            console.log(`Stage: ${data.stage}, Progress: ${data.progress}%`);
          }
          if (data.chunk) {
            console.log('Code chunk:', data.chunk);
          }
          if (data.review) {
            console.log('Quality review:', data.review);
          }
          if (data.error) {
            console.error('Error:', data.error);
          }
        }
      });
      
      readStream();
    });
  }
  
  readStream();
});
```

---

#### 4. Website Generation

Generate complete, multi-page websites with routing, components, and configuration files. This endpoint uses an enhanced multi-agent pipeline that includes architecture planning and multi-file generation.

**Endpoint:** `POST /generate-website`

**Request Body:**
```json
{
  "prompt": "Create a portfolio website with home, about, projects, and contact pages",
  "template": "vite-react",
  "enableQA": true,
  "conversationHistory": []
}
```

**Parameters:**
- `prompt` (string, required): Description of the website to generate
- `template` (string, optional): Project template to use (default: `vite-react`)
  - `vite-react`: Vite + React with JavaScript
  - `vite-react-ts`: Vite + React with TypeScript
  - `nextjs`: Next.js with App Router
- `enableQA` (boolean, optional): Enable quality assurance and fixing (default: `true`)
- `conversationHistory` (array, optional): Previous conversation messages for context

**Response:** Server-Sent Events (SSE) stream

**SSE Event Types:**

1. **Progress Events** - Sent at each pipeline stage:
```javascript
data: {"stage": "architecture", "progress": 5, "message": "Planning project structure..."}
data: {"stage": "planning", "progress": 15, "message": "Creating technical specifications..."}
data: {"stage": "designing", "progress": 25, "message": "Designing component system..."}
data: {"stage": "generating", "progress": 40, "message": "Generating files..."}
data: {"stage": "reviewing", "progress": 85, "message": "Reviewing code quality..."}
data: {"stage": "fixing", "progress": 90, "message": "Applying fixes..."}
```

2. **File Generation Events** - Sent during code generation:
```javascript
data: {
  "stage": "generating",
  "progress": 45,
  "currentFile": "src/pages/Home.jsx",
  "filesCompleted": 5,
  "totalFiles": 15,
  "message": "Generating src/pages/Home.jsx..."
}
```

3. **File Complete Events** - Sent when each file is generated:
```javascript
data: {
  "fileComplete": {
    "path": "src/pages/Home.jsx",
    "size": 2048
  }
}
```

4. **Quality Review Event** - Sent after quality review (if enableQA is true):
```javascript
data: {
  "review": {
    "filesWithIssues": ["src/App.jsx", "src/components/Navbar.jsx"],
    "totalIssues": 3,
    "needsRevision": true,
    "overallQuality": "good"
  }
}
```

5. **Completion Event** - Final event with all generated files:
```javascript
data: {
  "stage": "complete",
  "progress": 100,
  "files": [
    {
      "path": "package.json",
      "content": "{\n  \"name\": \"my-website\",\n  \"version\": \"1.0.0\",\n  ..."
    },
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>\n<html lang=\"en\">..."
    },
    {
      "path": "src/main.jsx",
      "content": "import React from 'react';\nimport ReactDOM from 'react-dom/client';\n..."
    },
    {
      "path": "src/App.jsx",
      "content": "import { RouterProvider } from 'react-router-dom';\n..."
    }
    // ... more files
  ]
}
```

6. **Error Event** - Sent if an error occurs:
```javascript
data: {
  "error": "Error message",
  "stage": "architecture",
  "fileName": "src/pages/Home.jsx"  // Optional, included if error is file-specific
}
```

**Files Array Schema:**

Each file object in the completion event contains:
- `path` (string): Relative file path (e.g., `src/pages/Home.jsx`, `package.json`)
- `content` (string): Complete file content

**Example:**
```bash
curl -X POST http://localhost:3000/generate-website \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a portfolio website with home, about, projects, and contact pages. Include a responsive navbar and footer.",
    "template": "vite-react",
    "enableQA": true
  }'
```

**JavaScript Example with SSE Handling:**
```javascript
fetch('http://localhost:3000/generate-website', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a blog website with home, blog list, blog post, and about pages',
    template: 'vite-react',
    enableQA: true
  })
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  function readStream() {
    reader.read().then(({ done, value }) => {
      if (done) {
        console.log('Stream complete');
        return;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          // Handle progress updates
          if (data.stage && data.progress) {
            console.log(`[${data.progress}%] ${data.stage}: ${data.message || ''}`);
          }
          
          // Handle file generation progress
          if (data.currentFile) {
            console.log(`Generating: ${data.currentFile} (${data.filesCompleted}/${data.totalFiles})`);
          }
          
          // Handle file completion
          if (data.fileComplete) {
            console.log(`✓ Completed: ${data.fileComplete.path}`);
          }
          
          // Handle quality review
          if (data.review) {
            console.log('Quality Review:', data.review);
          }
          
          // Handle completion
          if (data.stage === 'complete' && data.files) {
            console.log(`Website generated successfully! ${data.files.length} files created.`);
            
            // Save files to disk or display in UI
            data.files.forEach(file => {
              console.log(`- ${file.path} (${file.content.length} bytes)`);
              // saveFile(file.path, file.content);
            });
          }
          
          // Handle errors
          if (data.error) {
            console.error(`Error in ${data.stage}:`, data.error);
            if (data.fileName) {
              console.error(`Failed file: ${data.fileName}`);
            }
          }
        }
      });
      
      readStream();
    });
  }
  
  readStream();
})
.catch(error => {
  console.error('Request failed:', error);
});
```

**Example Multi-File Response Structure:**

When the generation completes, you'll receive a files array with the complete project structure:

```javascript
{
  "stage": "complete",
  "progress": 100,
  "files": [
    // Configuration files
    { "path": "package.json", "content": "..." },
    { "path": "vite.config.js", "content": "..." },
    { "path": "tailwind.config.js", "content": "..." },
    { "path": "postcss.config.js", "content": "..." },
    
    // Entry files
    { "path": "index.html", "content": "..." },
    { "path": "src/main.jsx", "content": "..." },
    { "path": "src/App.jsx", "content": "..." },
    
    // Routing
    { "path": "src/router.jsx", "content": "..." },
    
    // Layouts
    { "path": "src/layouts/MainLayout.jsx", "content": "..." },
    
    // Shared components
    { "path": "src/components/Navbar.jsx", "content": "..." },
    { "path": "src/components/Footer.jsx", "content": "..." },
    
    // Pages
    { "path": "src/pages/Home.jsx", "content": "..." },
    { "path": "src/pages/About.jsx", "content": "..." },
    { "path": "src/pages/Projects.jsx", "content": "..." },
    { "path": "src/pages/Contact.jsx", "content": "..." },
    { "path": "src/pages/NotFound.jsx", "content": "..." }
  ]
}
```

**Troubleshooting Website Generation:**

1. **Generation takes too long (>120 seconds)**
   - Simplify your prompt or reduce the number of pages
   - Disable QA for faster generation: `"enableQA": false`
   - Break complex websites into smaller iterations

2. **Missing files in the output**
   - Check the error events in the SSE stream
   - Review server logs for file generation failures
   - Ensure the prompt clearly describes all required pages

3. **Import path errors in generated code**
   - Enable QA to automatically detect and fix import issues
   - The quality agent checks cross-file dependencies

4. **Generated project won't build**
   - Verify all files were saved correctly
   - Check that `package.json` includes all dependencies
   - Run `npm install` in the generated project directory
   - Check for syntax errors in configuration files

5. **Routing doesn't work**
   - Ensure `react-router-dom` is installed
   - Verify `router.jsx` is properly configured
   - Check that all page components are imported correctly

---

### Template Options

The `/generate-website` endpoint supports multiple project templates to match your preferred tech stack:

#### 1. Vite + React (JavaScript)

**Template:** `vite-react` (default)

**Description:** Modern, fast development setup using Vite as the build tool with React and JavaScript.

**Generated Files:**
- `.jsx` file extensions
- JavaScript configuration files
- Vite-specific setup and imports
- React Router for client-side routing
- Tailwind CSS for styling

**Use Case:** Best for most projects, offers fast development and simple setup.

**Example:**
```json
{
  "prompt": "Create a landing page website",
  "template": "vite-react"
}
```

**Project Structure:**
```
my-website/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── router.jsx
    ├── layouts/
    │   └── MainLayout.jsx
    ├── components/
    │   ├── Navbar.jsx
    │   └── Footer.jsx
    └── pages/
        ├── Home.jsx
        ├── About.jsx
        └── NotFound.jsx
```

**Routing Setup:**
- Uses React Router v6 with `createBrowserRouter`
- Client-side routing with `<RouterProvider>`
- Nested routes with layouts
- 404 error page handling

---

#### 2. Vite + React + TypeScript

**Template:** `vite-react-ts`

**Description:** Type-safe development with TypeScript, Vite, and React.

**Generated Files:**
- `.tsx` file extensions for components
- `.ts` file extensions for utilities
- `tsconfig.json` for TypeScript configuration
- Type definitions and interfaces
- TypeScript-specific dependencies

**Use Case:** Projects requiring type safety and better IDE support.

**Example:**
```json
{
  "prompt": "Create a dashboard with analytics",
  "template": "vite-react-ts"
}
```

**Project Structure:**
```
my-website/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router.tsx
    ├── types/
    │   └── index.ts
    ├── layouts/
    │   └── MainLayout.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   └── Footer.tsx
    └── pages/
        ├── Home.tsx
        ├── Dashboard.tsx
        └── NotFound.tsx
```

**Routing Setup:**
- Same as Vite React but with TypeScript types
- Type-safe route definitions
- Typed component props

---

#### 3. Next.js (App Router)

**Template:** `nextjs`

**Description:** Full-stack React framework with server-side rendering, file-based routing, and App Router.

**Generated Files:**
- `app/` directory structure
- `layout.tsx` and `page.tsx` files
- `next.config.js` configuration
- Server and client components
- Next.js-specific imports and conventions

**Use Case:** SEO-critical sites, server-side rendering needs, or full-stack applications.

**Example:**
```json
{
  "prompt": "Create a blog website with SEO optimization",
  "template": "nextjs"
}
```

**Project Structure:**
```
my-website/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── app/
    ├── layout.tsx
    ├── page.tsx
    ├── about/
    │   └── page.tsx
    ├── blog/
    │   ├── page.tsx
    │   └── [slug]/
    │       └── page.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   └── Footer.tsx
    └── not-found.tsx
```

**Routing Setup:**
- File-based routing (no router configuration needed)
- Automatic route generation from folder structure
- Server and client components
- Built-in 404 handling with `not-found.tsx`

---

### Template Comparison

| Feature | vite-react | vite-react-ts | nextjs |
|---------|------------|---------------|--------|
| **Language** | JavaScript | TypeScript | TypeScript |
| **Build Tool** | Vite | Vite | Next.js |
| **Routing** | React Router | React Router | File-based |
| **SSR** | No | No | Yes |
| **File Extensions** | .jsx | .tsx | .tsx |
| **Dev Speed** | ⚡ Very Fast | ⚡ Very Fast | ⚡ Fast |
| **Type Safety** | ❌ No | ✅ Yes | ✅ Yes |
| **SEO** | Client-side | Client-side | Server-side |
| **Complexity** | Simple | Simple | Moderate |
| **Best For** | SPAs, Prototypes | Type-safe SPAs | SEO, Full-stack |

---

### Pipeline Stages

The advanced generation endpoint progresses through the following stages:

1. **Planning (10%)**: Analyzes requirements and creates technical specification
2. **Designing (30%)**: Creates design system with colors, fonts, and spacing
3. **Generating (50%)**: Generates React component code with Tailwind CSS
4. **Reviewing (75%)**: Reviews code for bugs, performance, and accessibility issues
5. **Fixing (85%)**: Applies corrections if issues are found
6. **Complete (100%)**: Returns final code

## Project Structure

### AI Builder Backend Structure

```
ai-builder-backend/
├── agents/                    # AI agent modules
│   ├── architectureAgent.js  # Project structure planning (NEW)
│   ├── planningAgent.js      # Technical specification generation
│   ├── designAgent.js        # Design system creation
│   ├── codeAgent.js          # React component generation
│   ├── qualityAgent.js       # Code quality review
│   └── fixAgent.js           # Code fixing and corrections
├── prompts/                  # System prompts for agents
│   └── systemPrompts.js      # All agent prompts
├── utils/                    # Utility modules
│   └── groqClient.js         # Groq API client with retry logic
├── .env.example              # Example environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
├── server.js                # Main Express server
└── README.md                # This file
```

### Generated Website Structure

When you use the `/generate-website` endpoint, the system generates a complete project with the following structure:

#### Vite + React (JavaScript) Structure

```
my-website/
├── index.html                 # HTML entry point
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── src/
    ├── main.jsx              # Application entry point
    ├── App.jsx               # Root component with router provider
    ├── router.jsx            # React Router configuration
    ├── layouts/              # Layout components
    │   └── MainLayout.jsx    # Main layout with Navbar and Footer
    ├── components/           # Shared/reusable components
    │   ├── Navbar.jsx        # Navigation bar with responsive menu
    │   ├── Footer.jsx        # Site footer
    │   └── [Other].jsx       # Additional shared components
    └── pages/                # Page components (routes)
        ├── Home.jsx          # Home page (/)
        ├── About.jsx         # About page (/about)
        ├── Contact.jsx       # Contact page (/contact)
        ├── [Other].jsx       # Additional pages
        └── NotFound.jsx      # 404 error page
```

**File Organization Conventions:**
- **Configuration files** at root: Build and styling configuration
- **src/main.jsx**: Initializes React and renders the App component
- **src/App.jsx**: Sets up the RouterProvider with the router configuration
- **src/router.jsx**: Defines all routes using React Router's `createBrowserRouter`
- **src/layouts/**: Wrapper components that provide consistent structure (header, footer, navigation)
- **src/components/**: Reusable components used across multiple pages
- **src/pages/**: One component per route/page

**Routing Setup (Vite React):**
```javascript
// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> }
    ]
  }
]);

// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

#### Vite + React + TypeScript Structure

```
my-website/
├── index.html
├── package.json
├── vite.config.ts            # TypeScript Vite config
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx              # .tsx extension for TypeScript
    ├── App.tsx
    ├── router.tsx
    ├── types/                # TypeScript type definitions
    │   └── index.ts
    ├── layouts/
    │   └── MainLayout.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   └── Footer.tsx
    └── pages/
        ├── Home.tsx
        ├── About.tsx
        └── NotFound.tsx
```

**Key Differences from JavaScript version:**
- `.tsx` extensions for components
- `.ts` extensions for utilities and types
- `tsconfig.json` for TypeScript compiler options
- Type definitions and interfaces in `src/types/`
- Type-safe props and component definitions

**Routing Setup (Vite React TypeScript):**
```typescript
// src/router.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> }
    ]
  }
] as RouteObject[]);
```

---

#### Next.js (App Router) Structure

```
my-website/
├── package.json
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js
├── postcss.config.js
└── app/                      # App Router directory
    ├── layout.tsx            # Root layout (wraps all pages)
    ├── page.tsx              # Home page (/)
    ├── about/                # About page route
    │   └── page.tsx          # /about
    ├── contact/              # Contact page route
    │   └── page.tsx          # /contact
    ├── blog/                 # Blog section
    │   ├── page.tsx          # /blog (list)
    │   └── [slug]/           # Dynamic route
    │       └── page.tsx      # /blog/[slug]
    ├── components/           # Shared components
    │   ├── Navbar.tsx
    │   └── Footer.tsx
    └── not-found.tsx         # 404 page
```

**File Organization Conventions:**
- **app/**: All routes and pages (file-based routing)
- **app/layout.tsx**: Root layout applied to all pages
- **app/page.tsx**: Home page at root route
- **app/[folder]/page.tsx**: Creates route at /[folder]
- **app/[folder]/[param]/page.tsx**: Dynamic route with parameter
- **app/components/**: Shared components (not routes)
- **app/not-found.tsx**: Custom 404 page

**Routing Setup (Next.js):**

Next.js uses file-based routing - no router configuration needed!

```typescript
// app/layout.tsx - Root layout for all pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// app/page.tsx - Home page (/)
export default function Home() {
  return <div>Home Page</div>;
}

// app/about/page.tsx - About page (/about)
export default function About() {
  return <div>About Page</div>;
}

// app/blog/[slug]/page.tsx - Dynamic blog post (/blog/my-post)
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <div>Blog Post: {params.slug}</div>;
}
```

**Key Features:**
- Automatic route generation from folder structure
- Server Components by default (add `'use client'` for client components)
- Built-in data fetching with async components
- Nested layouts support
- Automatic code splitting per route

---

### Running Generated Websites

After receiving the generated files from `/generate-website`, follow these steps:

1. **Save all files** to a new directory with the correct paths
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   
   For Vite projects:
   ```bash
   npm run dev
   ```
   
   For Next.js projects:
   ```bash
   npm run dev
   ```

4. **Build for production:**
   
   For Vite projects:
   ```bash
   npm run build
   npm run preview  # Preview production build
   ```
   
   For Next.js projects:
   ```bash
   npm run build
   npm start  # Run production server
   ```

## Development

### Running in Development Mode

The development mode uses Node.js watch mode for automatic reloading:

```bash
npm run dev
```

### Testing Endpoints

Use the provided curl commands or tools like Postman, Insomnia, or HTTPie to test the endpoints.

**Test health check:**
```bash
curl http://localhost:3000/health
```

**Test simple generation:**
```bash
curl -X POST http://localhost:3000/generate-simple \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a button component"}'
```

**Test advanced generation:**
```bash
curl -X POST http://localhost:3000/generate-advanced \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a contact form", "enableQA": true}'
```

## Deployment

### Railway Deployment

1. **Create a new project on Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure environment variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add all required environment variables:
     - `GROQ_API_KEY`
     - `NODE_ENV=production`
     - `FRONTEND_URL` (your frontend URL)
     - `PORT` (Railway will auto-assign if not set)

3. **Deploy**
   - Railway will automatically detect `package.json`
   - Build command: `npm install`
   - Start command: `npm start`
   - Railway will provide a public URL

4. **Monitor**
   - Use the `/health` endpoint for health checks
   - View logs in Railway dashboard

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

Build and run:

```bash
# Build image
docker build -t ai-builder-backend .

# Run container
docker run -p 3000:3000 \
  -e GROQ_API_KEY=your_key_here \
  -e NODE_ENV=production \
  ai-builder-backend
```

### Environment-Specific Configuration

**Development:**
```bash
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Production:**
```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
```

## Troubleshooting

### Common Issues

#### 1. Server fails to start with "Missing required environment variables"

**Problem:** The `GROQ_API_KEY` environment variable is not set.

**Solution:**
- Ensure you have created a `.env` file in the root directory
- Verify that `GROQ_API_KEY` is set in the `.env` file
- Check that the API key is valid (get one from [Groq Console](https://console.groq.com))

```bash
# Check if .env file exists
cat .env

# Should contain:
GROQ_API_KEY=gsk_your_actual_key_here
```

---

#### 2. CORS errors when calling from frontend

**Problem:** Browser blocks requests due to CORS policy.

**Solution:**
- Set the `FRONTEND_URL` environment variable to your frontend's URL
- In development, you can use `FRONTEND_URL=*` to allow all origins
- In production, always specify the exact frontend URL

```bash
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://your-frontend.com
```

---

#### 3. "Request timeout" errors

**Problem:** Generation takes longer than 60 seconds.

**Solution:**
- This is expected for very complex prompts
- Try simplifying your prompt
- Use simple generation mode for faster results
- Consider breaking complex components into smaller pieces

---

#### 4. Rate limit errors from Groq API

**Problem:** Too many requests to Groq API in a short time.

**Solution:**
- The system automatically retries with exponential backoff (1s, 2s, 4s)
- Wait a few seconds between requests
- Check your Groq API rate limits in the console
- Consider upgrading your Groq API plan for higher limits

---

#### 5. SSE connection closes unexpectedly

**Problem:** Server-Sent Events stream closes before completion.

**Solution:**
- Check server logs for errors
- Ensure your network/proxy supports SSE
- Verify the client properly handles SSE events
- Check if firewall or reverse proxy is timing out long connections

---

#### 6. Generated code quality is poor

**Problem:** Code doesn't meet expectations or has bugs.

**Solution:**
- Enable quality assurance: `"enableQA": true` in advanced mode
- Provide more detailed prompts with specific requirements
- Use conversation history to provide context
- Try the advanced generation mode instead of simple mode

---

#### 7. Port already in use

**Problem:** Error: `EADDRINUSE: address already in use :::3000`

**Solution:**
- Change the port in `.env` file: `PORT=3001`
- Or kill the process using port 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

#### 8. Module import errors

**Problem:** `SyntaxError: Cannot use import statement outside a module`

**Solution:**
- Ensure `package.json` has `"type": "module"`
- Verify you're using Node.js 18 or higher
- Check that all imports use `.js` extensions

```bash
# Check Node.js version
node --version

# Should be v18.0.0 or higher
```

---

#### 9. Groq API authentication errors

**Problem:** `401 Unauthorized` or `Invalid API key`

**Solution:**
- Verify your API key is correct and active
- Check for extra spaces or newlines in the `.env` file
- Regenerate API key in Groq Console if needed
- Ensure the key starts with `gsk_`

---

#### 10. Server crashes or becomes unresponsive

**Problem:** Server stops responding or crashes under load.

**Solution:**
- Check server logs for error messages
- Ensure adequate memory is available (minimum 512MB)
- Verify all dependencies are installed correctly
- Restart the server: `npm start`
- Check for unhandled promise rejections in logs

---

### Debug Mode

Enable detailed logging by checking the console output. All logs include timestamps and context:

```
[2024-01-15T10:30:45.123Z] [INFO] [Server] AI Builder Backend started successfully
[2024-01-15T10:30:50.456Z] [INFO] [Request] POST /generate-advanced from ::1
[2024-01-15T10:30:51.789Z] [INFO] [Advanced Generation] Starting Planning Agent...
```

### Getting Help

If you encounter issues not covered here:

1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure you're using compatible Node.js version (18+)
4. Review the [Groq API documentation](https://console.groq.com/docs)
5. Check network connectivity and firewall settings

## Performance

### Expected Response Times

- **Health Check**: < 100ms
- **Simple Generation**: 5-15 seconds
- **Advanced Generation**: 20-45 seconds (with QA)

### Optimization Tips

- Use simple generation mode when quality assurance isn't critical
- Disable QA for faster results: `"enableQA": false`
- Provide clear, concise prompts to reduce processing time
- Use conversation history to avoid re-explaining context

### Scalability

The service is stateless and can be horizontally scaled:
- Deploy multiple instances behind a load balancer
- Each instance handles independent requests
- No shared state or session management required

## Security

### Best Practices

- **Never commit `.env` file** to version control
- **Rotate API keys** regularly
- **Use HTTPS** in production
- **Restrict CORS** to specific origins in production
- **Monitor API usage** to detect anomalies
- **Implement rate limiting** at the infrastructure level

### API Key Protection

- Store `GROQ_API_KEY` in environment variables only
- Never log or expose the API key in responses
- Use secret management services in production (e.g., Railway secrets, AWS Secrets Manager)

## License

ISC

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review server logs for error details
- Consult [Groq API documentation](https://console.groq.com/docs)

---

**Built with ❤️ using Node.js, Express, and Groq AI**
