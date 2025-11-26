# 🎮 Cedra Interactive Tutorial

## CryptoZombies-Style Learn-to-Code Platform

A gamified, interactive tutorial for learning Move smart contract development on the Cedra blockchain. Complete 5 modules with 20 lessons to become a Cedra developer!

---

## 📚 Course Overview

| Module | Topic | Lessons | Status |
|--------|-------|---------|--------|
| [Module 1](#module-1-move-fundamentals) | Move Fundamentals | 4 | ✅ Ready |
| [Module 2](#module-2-resources--storage) | Resources & Storage | 4 | ✅ Ready |
| [Module 3](#module-3-building-a-dapp) | Building a DApp | 4 | ✅ Ready |
| [Module 4](#module-4-token-creation) | Token Creation | 4 | ✅ Ready |
| [Module 5](#module-5-nft-collections) | NFT Collections | 4 | ✅ Ready |

**Total: 20 Lessons | Estimated Time: 4-6 hours**

---

## 🚀 Getting Started

### Prerequisites
- Cedra CLI installed (`cedra --version` should show v1.0.4+)
- Basic programming knowledge
- Text editor (VS Code recommended)

### Quick Start
```bash
# Install Cedra CLI
curl -fsSL https://cedra.dev/install.sh | sh

# Initialize a new project
cedra move init --name my_first_project

# Start with Module 1, Lesson 1!
```

---

## 📖 Curriculum

### Module 1: Move Fundamentals

Learn the basics of the Move programming language.

| Lesson | Title | Topics |
|--------|-------|--------|
| [1.1](lessons/module-1/lesson-01-what-is-move.md) | What is Move? | Introduction, safety features, setup |
| [1.2](lessons/module-1/lesson-02-first-module.md) | First Module | Module structure, entry points |
| [1.3](lessons/module-1/lesson-03-variables-types.md) | Variables & Types | u8-u256, bool, address, vectors |
| [1.4](lessons/module-1/lesson-04-functions.md) | Functions | public, entry, friend, return values |

### Module 2: Resources & Storage

Master Move's unique resource model.

| Lesson | Title | Topics |
|--------|-------|--------|
| [2.1](lessons/module-2/lesson-01-what-are-resources.md) | What are Resources? | Structs, abilities (copy, drop, store, key) |
| [2.2](lessons/module-2/lesson-02-abilities.md) | Abilities Deep Dive | When to use each ability |
| [2.3](lessons/module-2/lesson-03-global-storage.md) | Global Storage | move_to, borrow_global, exists |
| [2.4](lessons/module-2/lesson-04-structs-in-depth.md) | Structs In-Depth | Nested structs, generics |

### Module 3: Building a DApp

Create your first decentralized application.

| Lesson | Title | Topics |
|--------|-------|--------|
| [3.1](lessons/module-3/lesson-01-entry-functions.md) | Entry Functions | Transaction entry points |
| [3.2](lessons/module-3/lesson-02-view-functions.md) | View Functions | Read-only queries, #[view] |
| [3.3](lessons/module-3/lesson-03-events.md) | Events | Emit events, event indexing |
| [3.4](lessons/module-3/lesson-04-error-handling.md) | Error Handling | Assert, abort, error codes |

### Module 4: Token Creation

Build your own fungible token.

| Lesson | Title | Topics |
|--------|-------|--------|
| [4.1](lessons/module-4/lesson-01-fungible-assets.md) | Fungible Assets | FA standard, metadata |
| [4.2](lessons/module-4/lesson-02-minting.md) | Minting | Create tokens, supply caps |
| [4.3](lessons/module-4/lesson-03-transfers.md) | Transfers | Send tokens, batch transfers |
| [4.4](lessons/module-4/lesson-04-burning.md) | Burning | Destroy tokens, deflationary |

### Module 5: NFT Collections

Create and manage NFT collections.

| Lesson | Title | Topics |
|--------|-------|--------|
| [5.1](lessons/module-5/lesson-01-nft-basics.md) | NFT Basics | Collections, Digital Asset standard |
| [5.2](lessons/module-5/lesson-02-advanced-minting.md) | Advanced Minting | Allowlists, dynamic pricing |
| [5.3](lessons/module-5/lesson-03-transfers.md) | Transfers & Trading | Marketplaces, royalties |
| [5.4](lessons/module-5/lesson-04-burning-composability.md) | Burning & Composability | Upgrades, soulbound tokens |

---

## 🎯 Learning Path

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LEARNING JOURNEY                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Module 1          Module 2          Module 3                │
│  ┌──────┐         ┌──────┐          ┌──────┐                │
│  │ Move │ ──────► │ Res- │ ───────► │ DApp │                │
│  │Basics│         │ources│          │Build │                │
│  └──────┘         └──────┘          └──────┘                │
│                                         │                    │
│                    ┌────────────────────┘                    │
│                    ▼                                         │
│               ┌──────┐          ┌──────┐                     │
│               │Token │ ───────► │ NFT  │ ───► 🎓 Graduate!  │
│               │Create│          │Create│                     │
│               └──────┘          └──────┘                     │
│               Module 4          Module 5                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏆 Skills You'll Gain

| Module | Skills Unlocked |
|--------|----------------|
| 1 | ✅ Write Move code, use basic types, create functions |
| 2 | ✅ Create resources, manage global storage |
| 3 | ✅ Build complete DApps with events and error handling |
| 4 | ✅ Create fungible tokens with mint/transfer/burn |
| 5 | ✅ Build NFT collections with marketplaces |

---

## 📝 Each Lesson Includes

- 📖 **Concept Explanation** - Clear, beginner-friendly explanations
- 💻 **Code Examples** - Working Move code you can deploy
- 🎮 **Interactive Exercise** - Practice challenge with solution
- 🧪 **Quiz** - Test your understanding
- 📋 **Key Takeaways** - Summary of main points

---

## 📁 Directory Structure

```
01-interactive-tutorial/
├── README.md                    # This file
├── lessons/
│   ├── module-1/               # Move Fundamentals
│   │   ├── lesson-01-introduction.md
│   │   ├── lesson-02-basic-types.md
│   │   ├── lesson-03-functions.md
│   │   └── lesson-04-control-flow.md
│   │
│   ├── module-2/               # Resources & Storage
│   │   ├── lesson-01-resources.md
│   │   ├── lesson-02-abilities.md
│   │   ├── lesson-03-global-storage.md
│   │   └── lesson-04-structs.md
│   │
│   ├── module-3/               # Building a DApp
│   │   ├── lesson-01-entry-functions.md
│   │   ├── lesson-02-view-functions.md
│   │   ├── lesson-03-events.md
│   │   └── lesson-04-error-handling.md
│   │
│   ├── module-4/               # Token Creation
│   │   ├── lesson-01-fungible-assets.md
│   │   ├── lesson-02-minting.md
│   │   ├── lesson-03-transfers.md
│   │   └── lesson-04-burning.md
│   │
│   └── module-5/               # NFT Collections
│       ├── lesson-01-nft-basics.md
│       ├── lesson-02-advanced-minting.md
│       ├── lesson-03-transfers.md
│       └── lesson-04-burning-composability.md
│
└── contracts/                  # Deployed example contracts
    ├── counter/
    ├── token/
    └── nft/
```

---

## 🤝 Contributing

Found a bug or want to improve a lesson? Contributions welcome!

---

## 📜 License

MIT License - Use freely for learning and projects!

---

<div align="center">

**Start your journey: [Module 1, Lesson 1 →](lessons/module-1/lesson-01-introduction.md)**

🚀 Happy Coding! 🚀

</div>
