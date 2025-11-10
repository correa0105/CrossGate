# CrossGate

**Advanced token spawning, mutations, and visual selection system for Foundry VTT v13+**

---

## 📖 About

CrossGate is a complete module for Foundry VTT that provides powerful features for:

- ✨ **Dynamic Token Spawning** - Summon creatures programmatically
- 🔄 **Mutation System** - Transform characters reversibly
- 🎯 **Visual Selection (Crosshairs)** - Intuitive interface for position selection
- 🔌 **Complete API** - Full control via macros and scripts

---

## 🚀 Quick Start

```javascript
// Simple spawn
await crossgate.spawn("Goblin");

// Spawn with position selection
const location = await crossgate.crosshairs.show();
await crossgate.spawn("Goblin", { x: location.x, y: location.y });

// Apply transformation
const token = canvas.tokens.controlled[0];
await crossgate.mutate(token.actor, {
  token: { scale: 2 },
  actor: { "system.attributes.hp.max": 150 }
}, {}, { name: "giant-form" });

// Revert transformation
await crossgate.revert(token.actor, "giant-form");
```

---

## 📚 Complete API Reference

### **1. crossgate.spawn()**

Spawns one or more tokens on the canvas.

#### **Syntax:**
```javascript
crossgate.spawn(actorNameOrId, updates, callbacks, options)
```

#### **Parameters:**
- `actorNameOrId` (string) - Actor name or ID
- `updates` (object) - Modifications to apply
  - `x`, `y` - Position (if omitted, uses crosshairs)
  - `token` - Token updates
  - `actor` - Actor updates
- `callbacks` (object) - Callback functions
  - `pre(location, data)` - Before spawning
  - `post(location, tokens)` - After spawning
- `options` (object) - Additional options
  - `duplicates` - Number of tokens to create (default: 1)
  - `collision` - Detect and avoid collisions (default: true)
  - `crosshairs` - Crosshairs configuration

#### **Returns:** `Promise<Array<Token>>`

#### **Examples:**

**Basic spawn:**
```javascript
await crossgate.spawn("Goblin");
```

**Spawn at specific position:**
```javascript
await crossgate.spawn("Goblin", {
  x: 500,
  y: 500
});
```

**Spawn with modifications:**
```javascript
await crossgate.spawn("Goblin", {
  token: {
    name: "Goblin Boss",
    scale: 1.5,
    "texture.tint": "#ff0000"
  },
  actor: {
    "system.attributes.hp.value": 50,
    "system.attributes.hp.max": 50
  }
});
```

**Spawn multiple (horde):**
```javascript
await crossgate.spawn("Goblin", {
  x: 500,
  y: 500
}, {}, {
  duplicates: 10,
  collision: true
});
```

**Spawn with callbacks:**
```javascript
await crossgate.spawn("Goblin", {}, {
  pre: async (location, data) => {
    console.log("Spawning at:", location);
    return true; // return false to cancel
  },
  post: async (location, tokens) => {
    console.log(`Spawned ${tokens.length} tokens`);
    ChatMessage.create({
      content: `${tokens.length} goblins appeared!`
    });
  }
});
```

**Spawn with crosshairs selection:**
```javascript
const location = await crossgate.crosshairs.show({
  size: 2,
  label: "Where to summon?"
});

if (!location.cancelled) {
  await crossgate.spawn("Elemental", {
    x: location.x,
    y: location.y
  });
}
```

---

### **2. crossgate.mutate()**

Applies mutations to a token or actor.

#### **Syntax:**
```javascript
crossgate.mutate(target, updates, callbacks, options)
```

#### **Parameters:**
- `target` (Token|Actor) - Mutation target
- `updates` (object) - Changes to apply
  - `token` - Token updates
  - `actor` - Actor updates
  - `embedded` - Embedded document updates (items)
- `callbacks` (object) - Callback functions
  - `pre(updates, actor)` - Before applying
  - `post(mutationInfo, actor)` - After applying
- `options` (object) - Additional options
  - `name` - Mutation name (required for revert)
  - `permanent` - If true, cannot be reverted (default: false)

#### **Returns:** `Promise<Object>` - Mutation info

#### **Examples:**

**Simple transformation:**
```javascript
const token = canvas.tokens.controlled[0];

await crossgate.mutate(token.actor, {
  token: { scale: 2 },
  actor: { "system.attributes.hp.max": 150 }
}, {}, { name: "giant-form" });
```

**Change token appearance:**
```javascript
await crossgate.mutate(token.actor, {
  token: {
    "texture.tint": "#00ff00",
    "texture.scaleX": 1.5,
    "texture.scaleY": 1.5
  }
}, {}, { name: "green-giant" });
```

**Buff with multiple effects:**
```javascript
await crossgate.mutate(token.actor, {
  token: {
    "texture.tint": "#ffaa00"
  },
  actor: {
    "system.attributes.hp.value": token.actor.system.attributes.hp.max,
    "system.attributes.ac.value": token.actor.system.attributes.ac.value + 5,
    "system.attributes.movement.walk": 60
  }
}, {}, { name: "haste-buff" });
```

**Add item to actor:**
```javascript
await crossgate.mutate(token.actor, {
  embedded: {
    Item: [{
      name: "Flaming Sword +2",
      type: "weapon",
      img: "icons/weapons/swords/sword-flame-blue.webp",
      system: {
        equipped: true,
        bonus: 2
      }
    }]
  }
}, {}, { name: "magic-weapon" });
```

**With callbacks:**
```javascript
await crossgate.mutate(token.actor, {
  token: { scale: 2 }
}, {
  pre: async (updates, actor) => {
    console.log("Applying mutation to:", actor.name);
    return true; // false cancels
  },
  post: async (mutationInfo, actor) => {
    ChatMessage.create({
      content: `${actor.name} transformed!`
    });
  }
}, { name: "transform" });
```

**Permanent mutation:**
```javascript
await crossgate.mutate(token.actor, {
  actor: {
    name: "Ancient Dragon",
    "system.attributes.hp.max": 500
  }
}, {}, {
  permanent: true
});
```

---

### **3. crossgate.revert()**

Reverts applied mutations.

#### **Syntax:**
```javascript
crossgate.revert(target, mutationName, callbacks)
```

#### **Parameters:**
- `target` (Token|Actor) - Target
- `mutationName` (string|null) - Mutation name (null = revert all)
- `callbacks` (object) - Optional callbacks

#### **Returns:** `Promise<boolean>`

#### **Examples:**

**Revert specific mutation:**
```javascript
const token = canvas.tokens.controlled[0];
await crossgate.revert(token.actor, "giant-form");
```

**Revert all mutations:**
```javascript
await crossgate.revert(token.actor);
```

**Revert with callback:**
```javascript
await crossgate.revert(token.actor, "buff", {
  post: async (mutation, actor) => {
    ui.notifications.info(`${actor.name} returned to normal`);
  }
});
```

**Toggle transformation:**
```javascript
const token = canvas.tokens.controlled[0];
const mutationName = "dragon-form";

if (crossgate.hasMutation(token.actor, mutationName)) {
  await crossgate.revert(token.actor, mutationName);
  ui.notifications.info("Reverted to normal form");
} else {
  await crossgate.mutate(token.actor, {
    token: { scale: 2.5 },
    actor: { "system.attributes.hp.max": 200 }
  }, {}, { name: mutationName });
  ui.notifications.info("Transformed into dragon!");
}
```

---

### **4. crossgate.crosshairs.show()**

Displays visual selection interface with cursor effect.

#### **Syntax:**
```javascript
crossgate.crosshairs.show(config)
```

#### **Parameters:**
- `config` (object) - Configuration (optional)
  - `rememberControlled` - Restore token selection after (default: false)

#### **Returns:** `Promise<{x, y, cancelled}>`

#### **Examples:**

**Basic crosshairs:**
```javascript
const location = await crossgate.crosshairs.show();

if (!location.cancelled) {
  console.log("Selected:", location.x, location.y);
}
```

**Spawn with crosshairs:**
```javascript
const location = await crossgate.crosshairs.show();

if (!location.cancelled) {
  await crossgate.spawn("Wolf", {
    x: location.x,
    y: location.y
  });
}
```

---

### **5. crossgate.dismiss()**

Removes tokens from the canvas.

#### **Syntax:**
```javascript
crossgate.dismiss(tokens, options)
```

#### **Parameters:**
- `tokens` (Token|Array<Token>) - Token(s) to remove
- `options` (object) - Additional options

#### **Returns:** `Promise<void>`

#### **Examples:**

**Remove single token:**
```javascript
const token = canvas.tokens.controlled[0];
await crossgate.dismiss(token);
```

**Remove multiple tokens:**
```javascript
const tokens = canvas.tokens.controlled;
await crossgate.dismiss(tokens);
```

**Remove spawned tokens:**
```javascript
const spawnedTokens = await crossgate.spawn("Goblin", {}, {}, { duplicates: 5 });

// Remove after 30 seconds
setTimeout(async () => {
  await crossgate.dismiss(spawnedTokens);
  ui.notifications.info("Summons disappeared!");
}, 30000);
```

---

### **6. crossgate.hasMutation()**

Checks if an actor has a mutation.

#### **Syntax:**
```javascript
crossgate.hasMutation(target, mutationName)
```

#### **Parameters:**
- `target` (Token|Actor) - Target
- `mutationName` (string) - Mutation name

#### **Returns:** `boolean`

#### **Examples:**

**Check for specific mutation:**
```javascript
const token = canvas.tokens.controlled[0];

if (crossgate.hasMutation(token.actor, "giant-form")) {
  console.log("Token is in giant form");
}
```

**Toggle based on mutation state:**
```javascript
const mutationName = "invisible";

if (crossgate.hasMutation(token.actor, mutationName)) {
  await crossgate.revert(token.actor, mutationName);
  ui.notifications.info("Visible again");
} else {
  await crossgate.mutate(token.actor, {
    token: { alpha: 0.3 }
  }, {}, { name: mutationName });
  ui.notifications.info("Now invisible");
}
```

---

### **7. crossgate.getMutations()**

Lists all active mutations.

#### **Syntax:**
```javascript
crossgate.getMutations(target)
```

#### **Parameters:**
- `target` (Token|Actor) - Target

#### **Returns:** `Object` - Dictionary of mutations

#### **Examples:**

**List all mutations:**
```javascript
const token = canvas.tokens.controlled[0];
const mutations = crossgate.getMutations(token.actor);

console.log("Active mutations:", Object.keys(mutations));
```

**Display mutations in chat:**
```javascript
const mutations = crossgate.getMutations(token.actor);
const mutationNames = Object.keys(mutations);

if (mutationNames.length === 0) {
  ui.notifications.info("No active mutations");
} else {
  ChatMessage.create({
    content: `<h3>Active Mutations:</h3><ul>${mutationNames.map(n => `<li>${n}</li>`).join('')}</ul>`
  });
}
```

**Revert specific mutation from list:**
```javascript
const mutations = crossgate.getMutations(token.actor);

// Show dialog to select which mutation to revert
const choice = await Dialog.wait({
  title: "Select Mutation to Revert",
  content: `<select id="mutation-select">${Object.keys(mutations).map(name => `<option value="${name}">${name}</option>`).join('')}</select>`,
  buttons: {
    ok: {
      label: "Revert",
      callback: (html) => html.find("#mutation-select").val()
    },
    cancel: { label: "Cancel" }
  }
});

if (choice) {
  await crossgate.revert(token.actor, choice);
}
```

---

## 🎮 Complete Examples

### **Example 1: Interactive Summon Dialog**

```javascript
async function interactiveSummon() {
  // Choose creature
  const creature = await Dialog.prompt({
    title: "Choose Creature",
    content: `
      <select id="creature-type">
        <option value="Wolf">Wolf</option>
        <option value="Bear">Bear</option>
        <option value="Goblin">Goblin</option>
        <option value="Orc">Orc</option>
      </select>
    `,
    callback: (html) => html.find("#creature-type").val()
  });

  // Select position
  const location = await crossgate.crosshairs.show({
    size: 1,
    label: `Summon ${creature}`
  });

  if (!location.cancelled) {
    await crossgate.spawn(creature, {
      x: location.x,
      y: location.y
    }, {
      post: async (loc, tokens) => {
        ChatMessage.create({
          content: `${tokens[0].name} has been summoned!`
        });
      }
    });
  }
}

interactiveSummon();
```

### **Example 2: Horde Spawner**

```javascript
async function spawnHorde() {
  const config = await Dialog.wait({
    title: "Spawn Horde",
    content: `
      <form>
        <div class="form-group">
          <label>Creature:</label>
          <input type="text" id="creature-name" value="Goblin"/>
        </div>
        <div class="form-group">
          <label>Quantity:</label>
          <input type="number" id="quantity" value="5" min="1" max="20"/>
        </div>
      </form>
    `,
    buttons: {
      ok: {
        label: "Spawn",
        callback: (html) => ({
          creature: html.find("#creature-name").val(),
          qty: parseInt(html.find("#quantity").val())
        })
      },
      cancel: { label: "Cancel" }
    }
  });

  if (!config) return;

  const location = await crossgate.crosshairs.show({
    size: 5,
    label: `Spawn ${config.qty}x ${config.creature}`
  });

  if (!location.cancelled) {
    await crossgate.spawn(config.creature, {
      x: location.x,
      y: location.y
    }, {
      post: async (loc, tokens) => {
        ChatMessage.create({
          content: `A horde of ${tokens.length} ${config.creature}(s) appeared!`
        });
      }
    }, {
      duplicates: config.qty,
      collision: true
    });
  }
}

spawnHorde();
```

### **Example 3: Transformation Manager**

```javascript
async function transformationManager() {
  const token = canvas.tokens.controlled[0];
  if (!token) {
    ui.notifications.warn("Select a token first!");
    return;
  }

  const mutations = crossgate.getMutations(token.actor);
  const hasMutations = Object.keys(mutations).length > 0;

  let content = "<h3>Available Transformations:</h3>";
  if (hasMutations) {
    content += "<p>Active mutations:</p><ul>";
    for (const name of Object.keys(mutations)) {
      content += `<li>${name}</li>`;
    }
    content += "</ul>";
  }

  const choice = await Dialog.wait({
    title: "Manage Transformations",
    content: content,
    buttons: {
      giant: {
        label: "Giant Form",
        callback: () => "giant"
      },
      fast: {
        label: "Speed Boost",
        callback: () => "fast"
      },
      invisible: {
        label: "Invisibility",
        callback: () => "invisible"
      },
      revert: {
        label: "Revert All",
        callback: () => "revert",
        condition: hasMutations
      },
      cancel: { label: "Cancel" }
    }
  });

  switch(choice) {
    case "giant":
      await crossgate.mutate(token.actor, {
        token: { scale: 2 },
        actor: { "system.attributes.hp.max": 200 }
      }, {}, { name: "giant-form" });
      ui.notifications.info("Transformed into giant!");
      break;

    case "fast":
      await crossgate.mutate(token.actor, {
        actor: { "system.attributes.movement.walk": 60 }
      }, {}, { name: "speed-boost" });
      ui.notifications.info("Speed increased!");
      break;

    case "invisible":
      await crossgate.mutate(token.actor, {
        token: { alpha: 0.3 }
      }, {}, { name: "invisibility" });
      ui.notifications.info("Now invisible!");
      break;

    case "revert":
      await crossgate.revert(token.actor);
      ui.notifications.info("All mutations reverted");
      break;
  }
}

transformationManager();
```

### **Example 4: Temporary Summon**

```javascript
async function temporarySummon() {
  const location = await crossgate.crosshairs.show({
    size: 1,
    label: "Summon Elemental (30 seconds)"
  });

  if (location.cancelled) return;

  const tokens = await crossgate.spawn("Fire Elemental", {
    x: location.x,
    y: location.y,
    token: { name: "Temporary Elemental" }
  });

  if (tokens && tokens.length > 0) {
    ChatMessage.create({
      content: "An elemental has been summoned! It will disappear in 30 seconds..."
    });

    // Remove after 30 seconds
    setTimeout(async () => {
      await crossgate.dismiss(tokens);
      ChatMessage.create({
        content: "The elemental disappeared!"
      });
    }, 30000);
  }
}

temporarySummon();
```

### **Example 5: Group Teleport**

```javascript
async function groupTeleport() {
  const tokens = canvas.tokens.controlled;
  if (tokens.length === 0) {
    ui.notifications.warn("Select at least one token!");
    return;
  }

  const location = await crossgate.crosshairs.show({
    size: tokens.length,
    label: `Teleport ${tokens.length} token(s)`
  });

  if (location.cancelled) return;

  // Calculate circular positions
  const radius = canvas.grid.size * 2;
  const angleStep = (Math.PI * 2) / tokens.length;

  for (let i = 0; i < tokens.length; i++) {
    const angle = angleStep * i;
    const x = location.x + Math.cos(angle) * radius;
    const y = location.y + Math.sin(angle) * radius;

    await tokens[i].document.update({ x, y });
  }

  ChatMessage.create({
    content: `${tokens.length} creature(s) were teleported!`
  });
}

groupTeleport();
```

---

## 💻 Compatibility

- **Foundry VTT:** v13+ (tested on v13)
- **Game Systems:** All (D&D 5e, Pathfinder, Call of Cthulhu, etc)
- **Modules:** Compatible with JB2A, Sequencer, and others

---

## 📦 Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

---

## 🔧 Development

### **Project Structure**
```
crossgate/
├── module.json           # Module manifest
├── scripts/
│   ├── crossgate.js      # Main API
│   ├── spawner.js        # Spawning system
│   ├── mutator.js        # Mutation system
│   └── crosshairs.js     # Visual selection
├── styles/
│   └── crossgate.css     # Styles
└── lang/
    ├── en.json           # English
    └── pt-BR.json        # Portuguese (Brazil)
```

### **Global API**
The module exposes the API globally as `window.crossgate`.

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Credits

CrossGate is inspired by the original Warp Gate module, adapted for Foundry VTT v13+.

---

## 📞 Support

To report bugs or request features, open an issue in the repository.

---

**Enjoy CrossGate! 🎭✨**
