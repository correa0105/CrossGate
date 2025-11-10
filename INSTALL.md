# CrossGate - Installation Guide

## 📦 Method 1: Manual Installation (Recommended)

### **Step 1: Locate your Foundry VTT modules folder**

- **Windows:** `%localappdata%/FoundryVTT/Data/modules`
- **macOS:** `~/Library/Application Support/FoundryVTT/Data/modules`
- **Linux:** `~/.local/share/FoundryVTT/Data/modules`

### **Step 2: Copy the module**

1. Copy the entire `warp-gate-clone` folder to the `modules` directory
2. **Rename** the folder to `crossgate` (optional but recommended)
3. Verify the final path is: `modules/crossgate/module.json`

### **Step 3: Restart Foundry VTT**

- If Foundry is running, close it completely and reopen
- This ensures the module is detected

### **Step 4: Activate the module in your world**

1. Open your world in Foundry VTT
2. Go to **"Configure Settings"** → **"Manage Modules"**
3. Find **"CrossGate"** in the list
4. Check the box next to the module name
5. Click **"Save Module Settings"**

### **Step 5: Verify the installation**

1. Reload the page (F5)
2. Open the browser console (F12)
3. Type `crossgate` and press Enter
4. You should see the CrossGate object with all functions:

```javascript
crossgate.spawn()
crossgate.mutate()
crossgate.revert()
crossgate.crosshairs.show()
crossgate.dismiss()
```

✅ **If the object appears, installation was successful!**

---

## 🌐 Method 2: Installation via Manifest URL

*Available when the module is officially published*

1. In Foundry VTT, go to "Configure Settings" → "Manage Modules"
2. Click "Install Module"
3. Paste the manifest URL in the field
4. Click "Install"

---

## 🎮 Getting Started

### **Basic Test**

Run this macro to test the module:

```javascript
async function basicTest() {
  const location = await crossgate.crosshairs.show({
    size: 1,
    label: "CrossGate Test"
  });

  if (!location.cancelled) {
    ui.notifications.info("CrossGate working! ✅");
    console.log("Position:", location);
  }
}

basicTest();
```

**What should happen:**
1. A blue circle appears on the map
2. Click to confirm the position
3. "CrossGate working!" message appears

---

## ⚙️ System Requirements

- **Foundry VTT:** version 13 or higher
- **Browser:** Chrome, Firefox, Edge (updated)
- **Game System:** Any (D&D 5e, Pathfinder, etc)

---

## 🐛 Troubleshooting

### **Error: "crossgate is not defined"**

**Cause:** Module is not active or didn't load

**Solution:**
1. Verify the module is checked in "Manage Modules"
2. Reload the page (F5)
3. Check the console (F12) for loading errors

---

### **Error: "No actor found"**

**Cause:** Actor name doesn't exist in the world

**Solution:**
1. Verify the actor exists in the "Actors" tab
2. Use the **exact** name (case-sensitive)
3. Or use the actor's ID instead of name

---

### **Crosshairs don't appear**

**Cause:** Not in a scene with a map

**Solution:**
1. Open a scene with a configured map
2. Make sure you're viewing the canvas

---

### **Module doesn't appear in the list**

**Cause:** Folder in wrong location or invalid module.json

**Solution:**
1. Verify the path: `modules/crossgate/module.json`
2. Open `module.json` and confirm it's valid (JSON format)
3. Restart Foundry VTT completely

---

## 💡 Tips

1. **Use the console (F12)** to see detailed errors
2. **Read the README.md** for usage examples
3. **Test first** with simple macros before complex ones
4. **Keep backups** of your world before using mutations

---

## 📚 Next Steps

After installing:

1. ✅ Read the [README.md](README.md) for complete documentation
2. ✅ Try the macro examples in the README
3. ✅ Integrate with JB2A/Sequencer for visual effects

---

**Good luck and have fun with CrossGate! 🎭✨**
