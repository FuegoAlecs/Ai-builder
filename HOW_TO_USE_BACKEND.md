# How to Use Backend Generation

## 🚀 Quick Start

Your AI Builder Backend can now generate **complete full-stack applications** with both frontend and backend code!

## 📝 Usage Methods

### Method 1: Simple - Include Backend Flag (Recommended)

Just add `"includeBackend": true` to your request:

```bash
POST /generate-website
{
  "prompt": "Create a task management app with user authentication",
  "template": "vite-react",
  "includeBackend": true,
  "enableQA": true
}
```

**What you get:**
- ✅ Complete React frontend
- ✅ Express backend with MongoDB
- ✅ JWT authentication
- ✅ RESTful API routes
- ✅ Database models
- ✅ Security middleware

### Method 2: Detailed - Specify Backend Options

Customize your backend with specific options:

```bash
POST /generate-website
{
  "prompt": "Create an e-commerce store",
  "template": "vite-react",
  "includeBackend": true,
  "backendType": "express",
  "database": "postgresql",
  "authentication": true,
  "fileUpload": true,
  "emailService": true,
  "paymentIntegration": true,
  "enableQA": true
}
```

**Backend Options:**
- `backendType`: "express" | "nextjs-api" | "supabase" | "firebase"
- `database`: "mongodb" | "postgresql" | "mysql" | "supabase" | "firebase"
- `authentication`: true | false
- `fileUpload`: true | false
- `emailService`: true | false
- `paymentIntegration`: true | false
- `realtime`: true | false
- `caching`: true | false

## 🎯 Real-World Examples

### Example 1: SaaS Application

```bash
POST /generate-website
{
  "prompt": "Create a SaaS project management tool with teams, projects, and tasks",
  "template": "vite-react",
  "includeBackend": true,
  "backendType": "express",
  "database": "mongodb",
  "authentication": true,
  "emailService": true,
  "fileUpload": true,
  "enableQA": true
}
```

**Generates:**
```
my-saas-app/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Projects.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── lib/
│   │       └── api.js
│   └── package.json
│
└── backend/
    ├── server.js
    ├── config/
    │   └── database.js
    ├── models/
    │   ├── User.js
    │   ├── Project.js
    │   └── Task.js
    ├── routes/
    │   ├── users.js
    │   ├── projects.js
    │   └── tasks.js
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    └── package.json
```

### Example 2: E-commerce Store

```bash
POST /generate-website
{
  "prompt": "Create an e-commerce store with products, cart, and checkout",
  "template": "nextjs",
  "includeBackend": true,
  "backendType": "nextjs-api",
  "database": "postgresql",
  "authentication": true,
  "fileUpload": true,
  "paymentIntegration": true,
  "enableQA": true
}
```

**Generates:**
```
my-ecommerce/
├── app/
│   ├── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   └── api/
│       ├── products/
│       │   └── route.ts
│       ├── orders/
│       │   └── route.ts
│       └── auth/
│           └── route.ts
├── components/
│   ├── Navbar.tsx
│   └── ProductCard.tsx
└── lib/
    ├── db.ts
    └── stripe.ts
```

### Example 3: Blog Platform

```bash
POST /generate-website
{
  "prompt": "Create a blog platform with posts, comments, and authors",
  "template": "vite-react",
  "includeBackend": true,
  "backendType": "express",
  "database": "mongodb",
  "authentication": true,
  "fileUpload": true,
  "emailService": true,
  "enableQA": true
}
```

**Generates:**
```
my-blog/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Post.jsx
│   │   │   ├── Author.jsx
│   │   │   └── Write.jsx
│   │   └── components/
│   │       ├── PostCard.jsx
│   │       └── CommentList.jsx
│   └── package.json
│
└── backend/
    ├── server.js
    ├── models/
    │   ├── User.js
    │   ├── Post.js
    │   └── Comment.js
    ├── routes/
    │   ├── posts.js
    │   ├── comments.js
    │   └── authors.js
    └── package.json
```

### Example 4: Social Media App

```bash
POST /generate-website
{
  "prompt": "Create a social media app with posts, likes, comments, and profiles",
  "template": "vite-react",
  "includeBackend": true,
  "backendType": "express",
  "database": "mongodb",
  "authentication": true,
  "fileUpload": true,
  "realtime": true,
  "enableQA": true
}
```

**Generates:**
```
my-social-app/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Feed.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Post.jsx
│   │   └── components/
│   │       ├── PostCard.jsx
│   │       └── CommentSection.jsx
│   └── package.json
│
└── backend/
    ├── server.js
    ├── models/
    │   ├── User.js
    │   ├── Post.js
    │   ├── Comment.js
    │   └── Like.js
    ├── routes/
    │   ├── posts.js
    │   ├── comments.js
    │   └── likes.js
    └── package.json
```

## 📊 Response Format

### SSE Events During Generation

```javascript
// 1. Architecture planning
{ stage: 'architecture', progress: 5, message: 'Planning project structure...' }

// 2. Planning
{ stage: 'planning', progress: 15, message: 'Creating technical specifications...' }

// 3. Design
{ stage: 'designing', progress: 25, message: 'Creating design system...' }

// 4. Frontend generation
{ stage: 'generating', progress: 40, message: 'Generating website files...' }
{ stage: 'generating', progress: 50, currentFile: 'src/pages/Home.jsx' }
{ stage: 'generating', progress: 60, currentFile: 'src/components/Navbar.jsx' }

// 5. Backend generation (if includeBackend: true)
{ stage: 'backend', progress: 85, message: 'Generating backend code...' }

// 6. Completion
{
  stage: 'complete',
  progress: 100,
  files: [...],
  backendIncluded: true,
  backendFilesCount: 8,
  message: 'Full-stack application generation complete!'
}
```

### Final Response

```javascript
{
  stage: 'complete',
  progress: 100,
  files: [
    // Frontend files
    { path: 'frontend/src/pages/Home.jsx', content: '...' },
    { path: 'frontend/src/components/Navbar.jsx', content: '...' },
    { path: 'frontend/package.json', content: '...' },
    
    // Backend files (if includeBackend: true)
    { path: 'backend/server.js', content: '...' },
    { path: 'backend/models/User.js', content: '...' },
    { path: 'backend/routes/users.js', content: '...' },
    { path: 'backend/package.json', content: '...' },
    { path: 'backend/.env.example', content: '...' }
  ],
  backendIncluded: true,
  backendFilesCount: 8,
  message: 'Full-stack application generation complete!'
}
```

## 🔧 Setup Instructions

### After Generation

1. **Extract the files** from the response
2. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Backend** (if included):
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Start Database** (if needed):
   - MongoDB: `mongod`
   - PostgreSQL: `pg_ctl start`
   - MySQL: `mysql.server start`

## 🎯 Backend Types Explained

### Express (Standalone)
**Best for:** Separate frontend/backend, microservices
- Standalone Node.js server
- RESTful API
- Runs on separate port (5000)
- Full control over backend

### Next.js API Routes
**Best for:** Next.js projects, serverless
- API routes in Next.js app
- Serverless functions
- Same codebase as frontend
- Easy deployment

### Supabase
**Best for:** Rapid development, built-in features
- Backend-as-a-Service
- Built-in auth and database
- Real-time subscriptions
- No backend code to maintain

### Firebase
**Best for:** Real-time apps, Google ecosystem
- Backend-as-a-Service
- Real-time database
- Built-in auth
- Cloud functions

## 📚 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your-supabase-url
VITE_FIREBASE_API_KEY=your-firebase-key
```

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/myapp
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Authentication
JWT_SECRET=your-secret-key-here

# Services
STRIPE_SECRET_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key
```

## 🎉 Summary

### To Generate Full-Stack App:

1. **Add `includeBackend: true`** to your request
2. **Optionally specify** backend options
3. **Receive** complete frontend + backend code
4. **Setup** both frontend and backend
5. **Run** your full-stack application!

### What You Get:

✅ **Frontend** - React/Next.js with all pages and components
✅ **Backend** - Express/Next API with routes and models
✅ **Database** - MongoDB/PostgreSQL/MySQL setup
✅ **Authentication** - JWT with login/register
✅ **Security** - Helmet, CORS, rate limiting
✅ **APIs** - RESTful CRUD operations
✅ **Documentation** - README with setup instructions

**Start building full-stack apps today! 🚀✨**
