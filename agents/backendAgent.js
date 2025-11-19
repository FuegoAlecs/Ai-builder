/**
 * Backend Agent - Generates backend code (APIs, databases, authentication)
 * Supports: Node.js/Express, Next.js API routes, Supabase, Firebase
 */

import { callGroqStream } from '../utils/groqClient.js';

/**
 * Generate backend code based on requirements
 * @param {Object} backendSpec - Backend specification
 * @param {Object} architectureSpec - Architecture specification
 * @param {Array} conversationHistory - Previous messages
 * @param {Function} onChunk - Streaming callback
 * @returns {Promise<Array>} Array of backend files
 */
export async function backendAgent(backendSpec, architectureSpec, conversationHistory = [], onChunk) {
  try {
    console.log(`[${new Date().toISOString()}] [INFO] [Backend Agent] Starting backend generation...`);
    
    const backendType = backendSpec.type || 'express';
    const files = [];
    
    switch (backendType) {
      case 'express':
        return await generateExpressBackend(backendSpec, architectureSpec, conversationHistory, onChunk);
      
      case 'nextjs-api':
        return await generateNextJSAPI(backendSpec, architectureSpec, conversationHistory, onChunk);
      
      case 'supabase':
        return await generateSupabaseConfig(backendSpec, architectureSpec);
      
      case 'firebase':
        return await generateFirebaseConfig(backendSpec, architectureSpec);
      
      default:
        throw new Error(`Unsupported backend type: ${backendType}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Backend Agent] Failed:`, error.message);
    throw new Error(`Backend Agent failed: ${error.message}`);
  }
}

/**
 * Generate Express.js backend
 */
async function generateExpressBackend(backendSpec, architectureSpec, conversationHistory, onChunk) {
  const files = [];
  
  // 1. Package.json
  files.push({
    path: 'backend/package.json',
    content: generateBackendPackageJson(backendSpec)
  });
  
  // 2. Server.js
  files.push({
    path: 'backend/server.js',
    content: generateExpressServer(backendSpec)
  });
  
  // 3. Database config
  if (backendSpec.database) {
    files.push({
      path: 'backend/config/database.js',
      content: generateDatabaseConfig(backendSpec.database)
    });
  }
  
  // 4. API Routes
  if (backendSpec.routes && backendSpec.routes.length > 0) {
    for (const route of backendSpec.routes) {
      files.push({
        path: `backend/routes/${route.name}.js`,
        content: generateExpressRoute(route, backendSpec)
      });
    }
  }
  
  // 5. Models
  if (backendSpec.models && backendSpec.models.length > 0) {
    for (const model of backendSpec.models) {
      files.push({
        path: `backend/models/${model.name}.js`,
        content: generateModel(model, backendSpec.database)
      });
    }
  }
  
  // 6. Middleware
  files.push({
    path: 'backend/middleware/auth.js',
    content: generateAuthMiddleware(backendSpec)
  });
  
  files.push({
    path: 'backend/middleware/errorHandler.js',
    content: generateErrorHandler()
  });
  
  // 7. .env.example
  files.push({
    path: 'backend/.env.example',
    content: generateEnvExample(backendSpec)
  });
  
  // 8. README
  files.push({
    path: 'backend/README.md',
    content: generateBackendReadme(backendSpec)
  });
  
  return files;
}

/**
 * Generate backend package.json
 */
function generateBackendPackageJson(backendSpec) {
  const dependencies = {
    express: '^4.18.2',
    cors: '^2.8.5',
    dotenv: '^16.3.1',
    helmet: '^7.1.0',
    'express-rate-limit': '^7.1.5'
  };
  
  // Add database dependencies
  if (backendSpec.database === 'mongodb') {
    dependencies.mongoose = '^8.0.3';
  } else if (backendSpec.database === 'postgresql') {
    dependencies.pg = '^8.11.3';
    dependencies['pg-hstore'] = '^2.3.4';
  } else if (backendSpec.database === 'mysql') {
    dependencies.mysql2 = '^3.6.5';
  }
  
  // Add authentication dependencies
  if (backendSpec.authentication) {
    dependencies.jsonwebtoken = '^9.0.2';
    dependencies.bcryptjs = '^2.4.3';
  }
  
  // Add validation
  dependencies.joi = '^17.11.0';
  
  const pkg = {
    name: 'backend',
    version: '1.0.0',
    description: 'Backend API server',
    main: 'server.js',
    type: 'module',
    scripts: {
      start: 'node server.js',
      dev: 'node --watch server.js',
      test: 'echo "Error: no test specified" && exit 1'
    },
    dependencies,
    devDependencies: {
      nodemon: '^3.0.2'
    }
  };
  
  return JSON.stringify(pkg, null, 2);
}

/**
 * Generate Express server
 */
function generateExpressServer(backendSpec) {
  const hasAuth = backendSpec.authentication;
  const hasDatabase = backendSpec.database;
  const routes = backendSpec.routes || [];
  
  return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
${hasDatabase ? "import { connectDatabase } from './config/database.js';" : ''}
${routes.map(r => `import ${r.name}Routes from './routes/${r.name}.js';`).join('\n')}
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
${routes.map(r => `app.use('/api/${r.path}', ${r.name}Routes);`).join('\n')}

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
${hasDatabase ? `
// Connect to database then start server
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
` : `
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`}

export default app;
`;
}

/**
 * Generate database configuration
 */
function generateDatabaseConfig(databaseType) {
  if (databaseType === 'mongodb') {
    return `import mongoose from 'mongoose';

export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default mongoose;
`;
  } else if (databaseType === 'postgresql') {
    return `import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function connectDatabase() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Connected');
    client.release();
    return pool;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    throw error;
  }
}

export { pool };
export default pool;
`;
  }
  
  return '// Database configuration';
}

/**
 * Generate Express route
 */
function generateExpressRoute(route, backendSpec) {
  const hasAuth = backendSpec.authentication;
  
  return `import express from 'express';
${hasAuth ? "import { authenticate } from '../middleware/auth.js';" : ''}

const router = express.Router();

// GET ${route.path}
router.get('/', ${hasAuth ? 'authenticate, ' : ''}async (req, res, next) => {
  try {
    // TODO: Implement GET logic
    res.json({ message: 'GET ${route.path}', data: [] });
  } catch (error) {
    next(error);
  }
});

// GET ${route.path}/:id
router.get('/:id', ${hasAuth ? 'authenticate, ' : ''}async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement GET by ID logic
    res.json({ message: \`GET ${route.path}/\${id}\`, data: {} });
  } catch (error) {
    next(error);
  }
});

// POST ${route.path}
router.post('/', ${hasAuth ? 'authenticate, ' : ''}async (req, res, next) => {
  try {
    const data = req.body;
    // TODO: Implement POST logic
    res.status(201).json({ message: 'Created', data });
  } catch (error) {
    next(error);
  }
});

// PUT ${route.path}/:id
router.put('/:id', ${hasAuth ? 'authenticate, ' : ''}async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: Implement PUT logic
    res.json({ message: \`Updated \${id}\`, data });
  } catch (error) {
    next(error);
  }
});

// DELETE ${route.path}/:id
router.delete('/:id', ${hasAuth ? 'authenticate, ' : ''}async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement DELETE logic
    res.json({ message: \`Deleted \${id}\` });
  } catch (error) {
    next(error);
  }
});

export default router;
`;
}

/**
 * Generate Mongoose model
 */
function generateModel(model, databaseType) {
  if (databaseType === 'mongodb') {
    return `import mongoose from 'mongoose';

const ${model.name}Schema = new mongoose.Schema({
${model.fields.map(field => `  ${field.name}: {
    type: ${field.type === 'string' ? 'String' : field.type === 'number' ? 'Number' : field.type === 'boolean' ? 'Boolean' : 'String'},
    required: ${field.required || false},
    ${field.unique ? 'unique: true,' : ''}
  }`).join(',\n')}
}, {
  timestamps: true
});

const ${model.name} = mongoose.model('${model.name}', ${model.name}Schema);

export default ${model.name};
`;
  }
  
  return `// ${model.name} model`;
}

/**
 * Generate authentication middleware
 */
function generateAuthMiddleware(backendSpec) {
  return `import jwt from 'jsonwebtoken';

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
`;
}

/**
 * Generate error handler middleware
 */
function generateErrorHandler() {
  return `export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
`;
}

/**
 * Generate .env.example
 */
function generateEnvExample(backendSpec) {
  let env = `# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

`;
  
  if (backendSpec.database === 'mongodb') {
    env += `# MongoDB
MONGODB_URI=mongodb://localhost:27017/myapp

`;
  } else if (backendSpec.database === 'postgresql') {
    env += `# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

`;
  }
  
  if (backendSpec.authentication) {
    env += `# Authentication
JWT_SECRET=your-secret-key-here

`;
  }
  
  return env;
}

/**
 * Generate backend README
 */
function generateBackendReadme(backendSpec) {
  return `# Backend API

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create \`.env\` file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Update environment variables in \`.env\`

${backendSpec.database ? `4. Start database server (${backendSpec.database})

` : ''}5. Start the server:
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

${backendSpec.routes ? backendSpec.routes.map(route => `
### ${route.name}
- \`GET /api/${route.path}\` - Get all ${route.name}
- \`GET /api/${route.path}/:id\` - Get ${route.name} by ID
- \`POST /api/${route.path}\` - Create new ${route.name}
- \`PUT /api/${route.path}/:id\` - Update ${route.name}
- \`DELETE /api/${route.path}/:id\` - Delete ${route.name}
`).join('\n') : ''}

## Environment Variables

See \`.env.example\` for required environment variables.

## Tech Stack

- Express.js
- ${backendSpec.database || 'No database'}
${backendSpec.authentication ? '- JWT Authentication' : ''}
- Helmet (Security)
- CORS
- Rate Limiting
`;
}

/**
 * Generate Next.js API routes
 */
async function generateNextJSAPI(backendSpec, architectureSpec, conversationHistory, onChunk) {
  const files = [];
  
  // Generate API routes for Next.js
  if (backendSpec.routes && backendSpec.routes.length > 0) {
    for (const route of backendSpec.routes) {
      files.push({
        path: `app/api/${route.path}/route.ts`,
        content: generateNextJSRoute(route, backendSpec)
      });
    }
  }
  
  return files;
}

/**
 * Generate Next.js API route
 */
function generateNextJSRoute(route, backendSpec) {
  return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement GET logic
    return NextResponse.json({ message: 'GET ${route.path}', data: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement POST logic
    return NextResponse.json({ message: 'Created', data: body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement PUT logic
    return NextResponse.json({ message: 'Updated', data: body });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement DELETE logic
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;
}

/**
 * Generate Supabase configuration
 */
async function generateSupabaseConfig(backendSpec, architectureSpec) {
  const files = [];
  
  files.push({
    path: 'lib/supabase.ts',
    content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
  });
  
  files.push({
    path: '.env.local.example',
    content: `NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
`
  });
  
  return files;
}

/**
 * Generate Firebase configuration
 */
async function generateFirebaseConfig(backendSpec, architectureSpec) {
  const files = [];
  
  files.push({
    path: 'lib/firebase.ts',
    content: `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
`
  });
  
  return files;
}
