# 🔥 Cedra Builders Forge - Complete Developer Ecosystem

> **"Forge fast, Move Smart."**

[![Cedra Network](https://img.shields.io/badge/Cedra-Network-blue)](https://cedra.network)
[![Move Language](https://img.shields.io/badge/Move-Language-orange)](https://docs.cedra.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📖 Overview

This comprehensive project delivers the **"Strengthen" Track** for the Cedra Builders Forge hackathon, empowering developers to strengthen documentation and create new technical content for the Cedra ecosystem.

### 🎯 What We're Building

| Track | Description | Status |
|-------|-------------|--------|
| 🎮 **Cedra Move Interactive Tutorial** | Gamified learning experience (like CryptoZombies) | ✅ Complete |
| 📚 **Zero to Hero Guide** | Step-by-step blog series/GitBook guide | ✅ Complete |
| 🔄 **Migration Guides** | Guides for Solidity/Rust developers | ✅ Complete |
| 🎥 **Video Walkthrough Series** | 5-minute YouTube video resources | ✅ Complete |

---

## 🗂️ Project Structure

```
Cedra_Builders/
├── 📁 01-interactive-tutorial/     # Gamified learning platform
│   ├── lessons/                    # Move tutorial lessons
│   ├── challenges/                 # Code challenges
│   ├── contracts/                  # Tutorial smart contracts
│   └── webapp/                     # Interactive web interface
│
├── 📁 02-zero-to-hero-guide/       # Comprehensive GitBook-style guide
│   ├── chapters/                   # Documentation chapters
│   ├── examples/                   # Code examples
│   └── projects/                   # Complete project tutorials
│
├── 📁 03-migration-guides/         # Language migration guides
│   ├── solidity-to-move/          # For EVM developers
│   ├── rust-to-move/              # For Solana developers
│   └── cheatsheets/               # Quick reference sheets
│
├── 📁 04-video-walkthroughs/       # Video tutorial resources
│   ├── scripts/                   # Video scripts
│   ├── code-examples/             # Demo code
│   └── slides/                    # Presentation materials
│
├── 📁 contracts/                   # Shared Move smart contracts
│   ├── counter/                   # Simple counter example
│   ├── token/                     # Fungible asset example
│   ├── nft/                       # NFT collection example
│   └── advanced/                  # Advanced patterns
│
└── 📁 frontend/                    # Demo frontend application
    └── cedra-dapp/                # React + TypeScript dApp
```

---

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Cedra CLI](https://docs.cedra.network/getting-started/cli)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cedra-builders-forge.git
cd cedra-builders-forge

# Install Cedra CLI (Windows - Chocolatey)
choco install cedra

# Verify installation
cedra --version

# Initialize Cedra account
cedra init
```

### Get Test Tokens

```bash
# Fund your account via CLI
cedra account fund-with-faucet

# Or use the web faucet
# Testnet: https://faucet.cedra.dev/
# Devnet: https://devnet-faucet.cedra.dev/
```

---

## 🎮 Track 1: Interactive Tutorial

A gamified learning experience teaching Move smart contract development on Cedra.

### Features
- 🎯 Progressive difficulty lessons
- 🏆 Achievement system
- 💻 In-browser code editor
- ✅ Instant feedback on code

[Start the Tutorial →](./01-interactive-tutorial/README.md)

---

## 📚 Track 2: Zero to Hero Guide

Comprehensive documentation covering everything from setup to production deployment.

### Chapters
1. Introduction to Cedra & Move
2. Setting Up Your Development Environment
3. Your First Smart Contract
4. Creating Fungible Tokens
5. Building NFT Collections
6. Frontend Integration
7. Testing & Debugging
8. Deployment & Best Practices

[Read the Guide →](./02-zero-to-hero-guide/README.md)

---

## 🔄 Track 3: Migration Guides

Technical guides for developers transitioning from other blockchain platforms.

### Available Guides
- **Solidity → Move**: For Ethereum/EVM developers
- **Rust → Move**: For Solana developers

[View Migration Guides →](./03-migration-guides/README.md)

---

## 🎥 Track 4: Video Walkthroughs

Scripts and resources for 5-minute YouTube tutorial videos.

### Video Topics
1. Setting Up Cedra Development Environment
2. Understanding Move Resources vs Solidity Mappings
3. Deploying Your First Contract
4. Common Errors and How to Fix Them
5. Building a Simple DApp

[View Video Resources →](./04-video-walkthroughs/README.md)

---

## 🔗 Useful Links

### Cedra Network
- 📖 [Cedra Documentation](https://docs.cedra.network/)
- 🔎 [Block Explorer (Cedrascan)](https://cedrascan.com/)
- 🚀 [Testnet API](https://testnet.cedra.dev/v1)
- 🔧 [Devnet API](https://devnet.cedra.dev/v1)
- 💬 [Builders Telegram](https://t.me/+Ba3QXd0VG9U0Mzky)

### Move Language
- 📘 [The Move Book](https://move-book.com/)
- 📗 [Move Reference](https://move-book.com/reference)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>🔥 Forge fast, Move Smart. 🔥</strong>
  <br>
  Built with ❤️ for the Cedra Builders Forge Hackathon
</p>
