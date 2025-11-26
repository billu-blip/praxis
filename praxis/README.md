# PRAXIS - Cedra DApp Frontend

> **Neobrutalist Web3 Interface for Cedra Smart Contracts**

## 🚀 Overview

PRAXIS is a fully-integrated frontend application that connects to 3 deployed Cedra smart contracts on testnet:

1. **Counter Contract** (`simple_counter`) - Per-user counters
2. **Token Contract** (`cedra_asset`) - CTT Fungible Asset
3. **NFT Contract** (`cedra_nft`) - Digital Asset collection

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | Landing page with neobrutalist design |
| `app.html` | **Full DApp** - Wallet connection, contract interactions |

## 🔗 Contract Integration

**Module Address**: `0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4`

### Counter Functions
- `initialize()` - Create counter for user
- `increment()` - Add 1 to counter
- `decrement()` - Subtract 1 from counter
- `reset()` - Reset counter to 0
- `get_count(addr)` - View current count
- `has_counter(addr)` - Check if counter exists

### Token Functions
- `mint(to, amount)` - Mint CTT tokens (admin)
- `transfer(to, amount)` - Send CTT tokens
- `burn(amount)` - Burn CTT tokens
- `get_balance(addr)` - View token balance

### NFT Functions
- `mint(name, description, uri)` - Create new NFT
- `transfer(token, to)` - Send NFT
- `burn(token)` - Destroy NFT

## 🛠️ Requirements

- **Petra Wallet** - [Install from petra.app](https://petra.app/)
- **Cedra Testnet** - Network must be set to testnet
- **Test Tokens** - Get from [faucet.cedra.dev](https://faucet.cedra.dev/)

## 🚀 Quick Start

1. Open `index.html` or `app.html` in browser
2. Click "Connect Wallet"
3. Approve connection in Petra
4. Start interacting with contracts!

## ✨ Features

### Design
- Neobrutalist aesthetic
- Custom cursor effects
- Smooth scroll animations
- Responsive layout
- Bold color palette

### Functionality
- Real-time wallet connection
- Transaction notifications (toasts)
- View function calls (free)
- Entry function transactions
- Transaction history tracking
- NFT image preview

## 📡 API Endpoints Used

```
Base URL: https://api.testnet.cedra.dev/v1

POST /view - Call view functions
POST /transactions - Submit transactions
```

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Yellow | `#FFE500` | Primary accent |
| Pink | `#FF6B9D` | Counter section |
| Blue | `#00D4FF` | Token section |
| Green | `#39FF14` | NFT section |
| Black | `#0D0D0D` | Borders, text |
| Cream | `#FFF8E7` | Background |

## 🔐 Security Notes

- Private keys never leave Petra wallet
- All transactions require user approval
- View functions are free (no gas)
- Entry functions require CEDRA for gas

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly buttons
- Mobile navigation menu

## 🧪 Testing

1. **Counter**: Initialize → Increment → Check value updated
2. **Token**: Check balance → Transfer → Verify recipient
3. **NFT**: Mint with name/uri → View in gallery

## 📄 License

MIT - Part of Cedra Builders Forge Hackathon
