# Backend Support - Full-Stack Generation

## 🚀 YES! Your System Now Supports Backend Code Generation!

Your AI Builder Backend can now generate **complete full-stack applications** with both frontend and backend code!

## ✨ What's Included

### Backend Types Supported

#### 1. Express.js (Standalone Backend) ✅
**Best for:** Vite React, separate frontend/backend architecture

**Generates:**
- Express server with security middleware
- RESTful API routes
- Database models
- Authentication middleware
- Error handling
- Environment configuration
- Complete package.json

**Example:**
```javascript
// backend/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(5000);
```

#### 2. Next.js API Routes ✅
**Best for:** Next.js projects, serverless functions

**Generates:**
- API route handlers
- Server-side logic
- Database connections
- Authentication helpers
- Middleware functions

**Example:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await db.users.findMany();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return NextResponse.json({ user }, { status: 201 });
}
```

#### 3. Supabase Integration ✅
**Best for:** Rapid development, built-in auth and database

**Generates:**
- Supabase client configuration
- Authentication helpers
- Database queries
- Real-time subscriptions
- Storage helpers

**Example:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### 4. Firebase Integration ✅
**Best for:** Real-time features, Google ecosystem

**Generates:**
- Firebase configuration
- Authentication setup
- Firestore database helpers
- Storage helpers
- Cloud Functions

**Example:**
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Database Support

#### 1. MongoDB ✅
- Mongoose ODM
- Schema definitions
- Validation
- Relationships
- Indexes

#### 2. PostgreSQL ✅
- pg library
- Connection pooling
- Parameterized queries
- Transactions
- Migrations

#### 3. MySQL ✅
- mysql2 library
- Connection pooling
- Prepared statements
- Transactions

#### 4. Supabase (PostgreSQL) ✅
- Built-in PostgreSQL
- Row-level security
- Real-time subscriptions
- Auto-generated APIs

#### 5. Firebase (NoSQL) ✅
- Firestore database
- Real-time updates
- Offline support
- Security rules

### Features Supported

#### Authentication ✅
- JWT token generation
- Password hashing (bcrypt)
- Login/Register endpoints
- Protected routes
- Token verification middleware
- Refresh tokens

#### CRUD Operations ✅
- Create (POST)
- Read (GET)
- Update (PUT/PATCH)
- Delete (DELETE)
- List with pagination
- Filtering and sorting

#### Security ✅
- Helmet (security headers)
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

#### File Upload ✅
- Multer middleware
- File validation
- Storage configuration
- Image processing
- Cloud storage integration

#### Email Service ✅
- Nodemailer setup
- Email templates
- Verification emails
- Password reset
- Notifications

#### Payment Integration ✅
- Stripe integration
- PayPal integration
- Webhook handling
- Payment verification
- Subscription management

#### Real-time Features ✅
- WebSocket setup
- Socket.io integration
- Real-time notifications
- Live updates
- Chat functionality

#### Caching ✅
- Redis integration
- Cache middleware
- Cache invalidation
- Session storage

## 📦 Generated File Structure

### Express.js Backend
```
backend/
├── package.json
├── server.js
├── .env.example
├── README.md
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   └── Post.js
├── routes/
│   ├── users.js
│   └── posts.js
└── middleware/
    ├── auth.js
    └── errorHandler.js
```

### Next.js API Routes
```
app/
├── api/
│   ├── users/
│   │   └── route.ts
│   ├── posts/
│   │   └── route.ts
│   └── auth/
│       ├── login/
│       │   └── route.ts
│       └── register/
│           └── route.ts
└── lib/
    ├── db.ts
    └── auth.ts
```

## 🎯 How to Generate Full-Stack Apps

### Example 1: SaaS with Authentication
```bash
POST /generate-fullstack
{
  "prompt": "Create a SaaS application with user authentication, dashboard, and subscription management",
  "frontend": {
    "template": "vite-react",
    "pages": ["landing", "login", "register", "dashboard", "pricing"]
  },
  "backend": {
    "type": "express",
    "database": "mongodb",
    "authentication": true,
    "routes": [
      { "name": "users", "path": "users", "protected": true },
      { "name": "subscriptions", "path": "subscriptions", "protected": true }
    ],
    "features": {
      "paymentIntegration": true,
      "emailService": true
    }
  }
}
```

### Example 2: E-commerce Store
```bash
POST /generate-fullstack
{
  "prompt": "Create an e-commerce store with products, cart, and checkout",
  "frontend": {
    "template": "nextjs",
    "pages": ["home", "products", "product-detail", "cart", "checkout"]
  },
  "backend": {
    "type": "nextjs-api",
    "database": "postgresql",
    "authentication": true,
    "routes": [
      { "name": "products", "path": "products", "protected": false },
      { "name": "orders", "path": "orders", "protected": true },
      { "name": "cart", "path": "cart", "protected": true }
    ],
    "features": {
      "paymentIntegration": true,
      "fileUpload": true
    }
  }
}
```

### Example 3: Blog Platform
```bash
POST /generate-fullstack
{
  "prompt": "Create a blog platform with posts, comments, and user profiles",
  "frontend": {
    "template": "vite-react",
    "pages": ["home", "post", "author", "write"]
  },
  "backend": {
    "type": "express",
    "database": "mongodb",
    "authentication": true,
    "routes": [
      { "name": "posts", "path": "posts", "protected": false },
      { "name": "comments", "path": "comments", "protected": true },
      { "name": "authors", "path": "authors", "protected": false }
    ],
    "features": {
      "fileUpload": true,
      "emailService": true
    }
  }
}
```

### Example 4: Real-time Chat App
```bash
POST /generate-fullstack
{
  "prompt": "Create a real-time chat application with rooms and direct messages",
  "frontend": {
    "template": "nextjs",
    "pages": ["login", "chat", "rooms", "profile"]
  },
  "backend": {
    "type": "express",
    "database": "mongodb",
    "authentication": true,
    "routes": [
      { "name": "messages", "path": "messages", "protected": true },
      { "name": "rooms", "path": "rooms", "protected": true }
    ],
    "features": {
      "realtime": true,
      "fileUpload": true
    }
  }
}
```

## 🔧 Backend Code Examples

### Express Route with Authentication
```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (protected)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Create user
router.post('/', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
    const user = await User.create({ email, password, name });
    
    // Generate token
    const token = generateToken({ id: user._id });
    
    res.status(201).json({ user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Mongoose Model
```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', UserSchema);

export default User;
```

### Authentication Middleware
```javascript
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}
```

## 🎉 Summary

Your AI Builder Backend now supports:

✅ **4 Backend Types** - Express, Next.js API, Supabase, Firebase
✅ **5 Databases** - MongoDB, PostgreSQL, MySQL, Supabase, Firebase
✅ **Authentication** - JWT, bcrypt, protected routes
✅ **CRUD Operations** - Full RESTful API
✅ **Security** - Helmet, CORS, rate limiting, validation
✅ **File Upload** - Multer, cloud storage
✅ **Email Service** - Nodemailer, templates
✅ **Payments** - Stripe, PayPal integration
✅ **Real-time** - WebSockets, Socket.io
✅ **Caching** - Redis integration

**You can now generate complete full-stack applications! 🚀✨**
