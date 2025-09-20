# Debug Window Issue

## 🔍 **Current Problem**

- Electron app starts and appears in tray
- No main window appears on screen
- App seems to be running (authentication checks are working)

## 🛠️ **Debugging Steps**

### **Step 1: Check if Vite dev server is running**

The issue might be that Electron starts before Vite is ready.

**Try this approach:**

```bash
# Terminal 1: Start React dev server first
npm run dev:react

# Wait for "Local: http://localhost:3000" message
# Then in Terminal 2: Start Electron
npm run dev:electron
```

### **Step 2: Check the logs**

With the enhanced logging, you should see:

```
🚀 [Main] ForgetFunds starting...
🔧 [Main] Environment: development
🔧 [Main] Creating system tray...
🪟 [Main] About to create main window...
🪟 [Main] Creating main window...
🪟 [Main] Window created, loading content...
🔗 [Main] Loading development URL: http://localhost:3000
✅ [Main] Development URL loaded successfully
🎉 [Main] Window ready to show - displaying window
```

**If you see an error like:**

```
❌ [Main] Failed to load window content: Error: net::ERR_CONNECTION_REFUSED
```

This means Vite isn't running yet.

### **Step 3: Force show window (Emergency fix)**

If the window still doesn't appear, try clicking on the tray icon or add this temporary fix:

**Temporary fix - Add to main.ts after window creation:**

```typescript
// TEMPORARY: Force show window immediately (remove after debugging)
setTimeout(() => {
  if (mainWindow) {
    console.log('🚨 [Debug] Force showing window');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    setTimeout(() => mainWindow.setAlwaysOnTop(false), 1000);
  }
}, 2000);
```

### **Step 4: Check window state**

The window might be created but positioned off-screen. Try:

1. **Right-click tray icon** → Should show "Show ForgetFunds"
2. **Double-click tray icon** → Should show window
3. **Check if window is minimized** → Cmd+Tab (macOS) or Alt+Tab (Windows)

## 🎯 **Most Likely Solutions**

### **Solution 1: Timing Issue**

```bash
# Use the watch command which handles timing better
npm run dev:watch
```

### **Solution 2: Manual Startup**

```bash
# Terminal 1
npm run dev:react

# Wait for "Local: http://localhost:3000"
# Terminal 2
npm run dev:electron
```

### **Solution 3: Check Window Position**

The window might be positioned off-screen. Delete the window config:

```bash
# Delete saved window position
rm ~/Library/Application\ Support/forgetfunds/window-config.json  # macOS
# or
rm ~/.config/forgetfunds/window-config.json  # Linux
```

### **Solution 4: Force Show (Debug)**

Add this temporary code after line 105 in `src/main.ts`:

```typescript
// DEBUG: Force show after 3 seconds
setTimeout(() => {
  console.log('🚨 [Debug] Force showing window');
  mainWindow?.show();
  mainWindow?.focus();
}, 3000);
```

## 📋 **Next Steps**

1. **Try Solution 1 first**: `npm run dev:watch`
2. **Check the console logs** for the window creation messages
3. **If still no window**: Try the manual startup (Solution 2)
4. **If desperate**: Add the debug force show code

Let me know what logs you see and we can pinpoint the exact issue!
