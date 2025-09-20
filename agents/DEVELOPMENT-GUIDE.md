# Development Guide - Live Reload Setup

## 🚀 **Live Reload Configuration**

Your Electron app now has proper live reload setup for efficient development!

## 📋 **Available Development Scripts**

### **Option 1: Standard Development (Recommended)**

```bash
npm run dev
```

- ✅ **React hot reload**: Changes to React components reload instantly
- ⚠️ **Main process**: Requires manual restart for `src/main.ts` changes

### **Option 2: Full Live Reload (Best for Main Process Development)**

```bash
npm run dev:watch
```

- ✅ **React hot reload**: Changes to React components reload instantly
- ✅ **Main process live reload**: Changes to `src/main.ts` and `src/lib/*` restart Electron automatically
- 🔄 **Auto-restart**: Electron restarts when you change backend code

### **Option 3: Individual Components**

```bash
# Just React dev server
npm run dev:react

# Just Electron (after React is running)
npm run dev:electron
```

## 🔄 **What Gets Live Reloaded**

### **Automatic Reload (No Restart Needed)**

- ✅ React components (`src/components/**`)
- ✅ Zustand store (`src/stores/**`)
- ✅ TypeScript types (`src/types/**`)
- ✅ CSS/Tailwind styles
- ✅ Frontend utilities (`src/lib/utils.ts`)

### **Automatic Restart (Electron Restarts)**

- 🔄 Main process (`src/main.ts`)
- 🔄 Database layer (`src/lib/database.ts`)
- 🔄 Authentication (`src/lib/auth.ts`)
- 🔄 Export functionality (`src/lib/export.ts`)
- 🔄 Preload script (`src/preload.js`)

## 🛠️ **Development Workflow**

### **For Frontend Changes (React/Zustand)**

1. Start with: `npm run dev`
2. Edit React components
3. Changes appear instantly in Electron window
4. **No restart needed**

### **For Backend Changes (Main Process)**

1. Start with: `npm run dev:watch`
2. Edit `src/main.ts` or `src/lib/*`
3. Electron automatically restarts
4. **Maintains your authentication state**

### **For Full-Stack Features**

1. Use: `npm run dev:watch`
2. Edit both frontend and backend
3. Frontend changes are instant
4. Backend changes restart Electron
5. **Best of both worlds**

## 🔧 **Technical Details**

### **React Hot Reload (Vite)**

- Uses Vite's built-in HMR (Hot Module Replacement)
- Changes appear in ~100ms
- Preserves component state when possible
- Automatic browser refresh on errors

### **Electron Live Reload**

- Uses `electron-reload` package
- Watches `dist-electron/` folder for changes
- Uses `nodemon` to watch source files
- Automatically rebuilds and restarts

### **Environment Variables**

- `NODE_ENV=development` enables dev features
- Opens DevTools automatically in development
- Enables detailed logging
- Connects to `http://localhost:3000` instead of built files

## 🐛 **Troubleshooting**

### **"Port 3000 already in use"**

```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9
npm run dev
```

### **Electron won't start**

```bash
# Clean build and restart
rm -rf dist-electron
npm run build:electron-main
npm run dev
```

### **Changes not reflecting**

1. Check if both React dev server and Electron are running
2. Verify you're editing the right files (not in `dist/` or `dist-electron/`)
3. Try hard refresh: `Cmd/Ctrl + Shift + R`

### **Authentication issues after restart**

- Electron restarts clear authentication state
- You'll need to re-authenticate after main process changes
- This is expected behavior for security

## 🎯 **Recommended Development Flow**

1. **Start development**: `npm run dev:watch`
2. **Make frontend changes**: Instant feedback
3. **Make backend changes**: Auto-restart with feedback
4. **Test authentication flow**: After backend changes
5. **Test data persistence**: Verify SQLite saves work
6. **Debug with console**: DevTools open automatically

## 📊 **Performance Tips**

- **Use `npm run dev`** for pure frontend work (faster)
- **Use `npm run dev:watch`** when touching backend code
- **Keep DevTools open** for real-time debugging
- **Monitor console logs** for authentication and database issues

## 🔍 **Debug Information**

When you start development, you'll see:

```
🔄 [Main] Electron live reload enabled
🔐 [App] Checking authentication status...
🔧 [App] Debug function available: call debugDataFlow() in console
```

This confirms live reload is working and debug tools are available!

---

**Your development environment is now optimized for maximum productivity with instant feedback and automatic reloading!** 🚀
