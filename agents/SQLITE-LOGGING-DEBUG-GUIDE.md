# SQLite Logging & Debug Guide

## Overview

We've added comprehensive logging throughout the data flow to track when and how data is saved to SQLite. This will help identify why the database appears empty on app relaunch.

## 🔍 **What We've Added**

### 1. **Zustand Store Logging** (`src/stores/budgetStore.ts`)

- ✅ Logs every update operation with emoji icons
- ✅ Shows data counts before saving to SQLite
- ✅ Tracks optimistic updates and rollbacks
- ✅ Logs SQLite save success/failure

### 2. **App Component Logging** (`src/App.tsx`)

- ✅ Logs authentication bypass for testing
- ✅ Shows data loading from SQLite on startup
- ✅ Tracks Zustand store initialization

### 3. **Main Process Logging** (`src/main.ts`)

- ✅ Logs all IPC handler calls
- ✅ Shows authentication status checks
- ✅ Tracks data being saved/retrieved from database
- ✅ Displays data counts for verification

### 4. **Debug Scripts**

- ✅ `src/debug-data-flow.ts` - Comprehensive data flow testing
- ✅ `src/test-zustand-store.ts` - Store functionality testing

## 📊 **How to Use the Logging**

### Step 1: Start the App

```bash
npm run dev
```

### Step 2: Open Browser DevTools

- **Windows/Linux**: `Ctrl + Shift + I`
- **macOS**: `Cmd + Option + I`

### Step 3: Watch the Console

You'll see logs like:

```
🔐 [App] Checking authentication status...
⚠️ [App] Bypassing authentication for testing - loading data directly
📂 [App] Loading budget data from SQLite...
🔍 [App] Fetching data via Electron API...
📂 [Main] get-budget-data handler called
🔐 [Main] Auth status: { isAppLocked: false, isUserAuthenticated: false, isDatabaseUnlocked: true }
📊 [Main] Data retrieved from database: { income: 2, debts: 1, ... }
📥 [Zustand] Setting budget data: { income: 2, debts: 1, ... }
```

## 🐛 **Common Issues & Solutions**

### Issue 1: "Authentication check failed"

```
❌ [Main] Authentication check failed
```

**Solution**: This is expected during testing. We're bypassing auth in the frontend but the backend still checks. This is intentional for security.

### Issue 2: "Database is locked"

```
❌ [Main] Database is locked
```

**Solution**: The database needs to be unlocked first. Check if the authentication system is properly initialized.

### Issue 3: Empty data on relaunch

```
📊 [Main] Data retrieved from database: { income: 0, debts: 0, ... }
```

**Solution**: This indicates data isn't being saved to SQLite. Check the save operation logs.

### Issue 4: Zustand updates not saving

```
💰 [Zustand] Updating income: 2 items
❌ [Zustand] SQLite save failed: App is locked
```

**Solution**: The save operation is failing due to authentication. This is the root cause of the empty database issue.

## 🔧 **Debug Workflow**

### For Empty Database Issues:

1. **Check Initial Data Load**:
   - Look for `📂 [App] Loading budget data from SQLite...`
   - Verify `📊 [Main] Data retrieved from database` shows counts

2. **Test Data Updates**:
   - Make changes in the UI (add income, expenses, etc.)
   - Look for `💰 [Zustand] Updating income:` messages
   - Check if `✅ [Zustand] SQLite save successful` appears

3. **Verify Authentication**:
   - Check `🔐 [Main] Auth status` in console
   - If `isUserAuthenticated: false`, that's the issue

4. **Run Debug Scripts**:
   - The debug script runs automatically after 3 seconds
   - Look for `🔍 [Debug] Starting data flow debugging...`

## 🎯 **Expected Log Flow for Working System**

```
# App Startup
🔐 [App] Checking authentication status...
📂 [App] Loading budget data from SQLite...
📂 [Main] get-budget-data handler called
✅ [Main] Authentication passed, fetching data from database...
📊 [Main] Data retrieved from database: { income: 2, ... }
📥 [Zustand] Setting budget data: { income: 2, ... }

# User Makes Edit
💰 [Zustand] Updating income: 3 items
⚡ [Zustand] Applying optimistic income update
🔄 [Zustand] Attempting to save data to SQLite...
💾 [Main] save-budget-data handler called
✅ [Main] Authentication passed, saving data to database...
💾 [Main] Save result: { success: true }
✅ [Zustand] SQLite save successful
✅ [Zustand] Income update completed successfully
```

## 🚨 **Authentication Issue Fix**

The root cause is likely authentication. For testing, you can temporarily disable auth checks in `src/main.ts`:

```typescript
// TEMPORARY: Disable auth for testing
// if (isAppLocked || !authManager.isUserAuthenticated()) {
//   throw new Error('App is locked - please authenticate first');
// }
```

## 📝 **Next Steps**

1. **Run the app** and check console logs
2. **Make some edits** (add income, expenses) and watch for save logs
3. **Restart the app** and see if data persists
4. **If data is empty**, look for authentication failures in logs
5. **Report findings** - share the console logs to identify the exact issue

The logging will show us exactly where the data flow is breaking down!
