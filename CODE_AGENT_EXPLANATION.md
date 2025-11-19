# Code Agent Explanation - Why There Are 2 Functions

## ✅ This is CORRECT! You Have 2 Different Functions

Your `agents/codeAgent.js` file contains **2 different functions** that serve different purposes:

### 1. `codeAgent()` - Single Component Generation
**Purpose**: Generate a single React component

**Used by:**
- `/generate-simple` endpoint
- `/generate-advanced` endpoint

**What it does:**
- Takes a prompt and generates ONE component
- Streams the code as it's generated
- Returns a single string of code

**Example:**
```javascript
const code = await codeAgent(
  "Create a pricing section",
  technicalSpec,
  designSystem,
  conversationHistory,
  onChunk
);
// Returns: Single component code as string
```

### 2. `codeAgentMultiFile()` - Multi-File Website Generation
**Purpose**: Generate a complete website with multiple files

**Used by:**
- `/generate-website` endpoint

**What it does:**
- Takes a prompt and generates MULTIPLE files
- Generates pages, components, layouts, config files
- Streams progress for each file
- Returns an array of file objects

**Example:**
```javascript
const files = await codeAgentMultiFile(
  "Create a portfolio website",
  architectureSpec,
  planningSpec,
  designSystem,
  conversationHistory,
  onFileStart,
  onChunk,
  onFileComplete
);
// Returns: Array of { path, content } objects
```

## 🎯 Why 2 Functions?

### Different Use Cases

**Single Component (`codeAgent`):**
- Quick component generation
- Simple use cases
- One file output
- Fast generation (2-5 seconds)

**Multi-File Website (`codeAgentMultiFile`):**
- Complete website generation
- Complex use cases
- Multiple files output (10-20+ files)
- Longer generation (30-60 seconds)

### Different Outputs

**Single Component:**
```javascript
// Output: String
const code = `
import React from 'react';

function PricingSection() {
  return <div>...</div>;
}

export default PricingSection;
`;
```

**Multi-File Website:**
```javascript
// Output: Array of objects
const files = [
  { path: 'package.json', content: '{ "name": "my-website", ... }' },
  { path: 'src/App.jsx', content: 'import React from "react"; ...' },
  { path: 'src/pages/Home.jsx', content: '...' },
  { path: 'src/components/Navbar.jsx', content: '...' },
  // ... more files
];
```

## 📊 Comparison

| Feature | `codeAgent` | `codeAgentMultiFile` |
|---------|-------------|----------------------|
| **Purpose** | Single component | Complete website |
| **Output** | String | Array of objects |
| **Files Generated** | 1 | 10-20+ |
| **Generation Time** | 2-5 seconds | 30-60 seconds |
| **Used By** | Simple/Advanced endpoints | Website endpoint |
| **Streaming** | Code chunks | File progress |
| **Callbacks** | `onChunk` | `onFileStart`, `onChunk`, `onFileComplete` |

## 🚀 How They Work Together

### Endpoint Flow

```
┌─────────────────────────────────────────────────┐
│         User Makes Request                      │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│ /generate-    │   │ /generate-       │
│  simple       │   │  website         │
│               │   │                  │
│ /generate-    │   │                  │
│  advanced     │   │                  │
└───────┬───────┘   └────────┬─────────┘
        │                    │
        ▼                    ▼
┌───────────────┐   ┌──────────────────┐
│  codeAgent()  │   │ codeAgentMulti   │
│               │   │  File()          │
│ Returns:      │   │                  │
│ Single string │   │ Returns:         │
│               │   │ Array of files   │
└───────────────┘   └──────────────────┘
```

### Example Usage

**Simple Generation:**
```javascript
// server.js - /generate-simple endpoint
const code = await codeAgent(
  prompt,
  technicalSpec,
  designSystem,
  conversationHistory,
  (chunk) => sendSSE(res, { chunk })
);
// Send single component code
sendSSE(res, { stage: 'complete', code });
```

**Website Generation:**
```javascript
// server.js - /generate-website endpoint
const files = await codeAgentMultiFile(
  prompt,
  architectureSpec,
  planningSpec,
  designSystem,
  conversationHistory,
  (filePath) => sendSSE(res, { currentFile: filePath }),
  (chunk) => sendSSE(res, { chunk }),
  (file) => sendSSE(res, { fileComplete: file })
);
// Send array of files
sendSSE(res, { stage: 'complete', files });
```

## ✅ This is the CORRECT Design

Having 2 functions is:
- ✅ **Intentional** - Different use cases require different approaches
- ✅ **Efficient** - Each function is optimized for its purpose
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Flexible** - Easy to extend and modify
- ✅ **Standard** - Common pattern in software design

## 🎯 Summary

You have **2 functions, not 2 agents**:

1. **`codeAgent()`** - Single component generation
2. **`codeAgentMultiFile()`** - Multi-file website generation

Both are **necessary** and work together to provide:
- Fast single component generation
- Complete website generation
- Flexible API endpoints
- Optimal user experience

**This is the correct and optimal design! ✅**
