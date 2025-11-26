# Chapter 2: Setting Up Your Development Environment

> **Prepare Your Machine for Cedra Development**

---

## 🎯 What You'll Learn

- Install required prerequisites (Rust, Node.js)
- Install the Cedra CLI
- Configure your IDE for Move development
- Create your first Cedra account
- Get test tokens from the faucet

---

## 📋 Prerequisites

Before installing the Cedra CLI, ensure you have:

### 1. Rust (for building from source)

```powershell
# Windows: Download and run rustup-init.exe from https://rustup.rs/
# Or via PowerShell:
winget install Rustlang.Rust.MSVC

# Verify installation
rustc --version
cargo --version
```

### 2. Node.js (for TypeScript SDK)

```powershell
# Windows (via Chocolatey)
choco install nodejs-lts

# Or download from https://nodejs.org/

# Verify installation
node --version
npm --version
```

### 3. Git

```powershell
# Windows
choco install git

# Verify
git --version
```

---

## 🔧 Installing Cedra CLI

### Option 1: Chocolatey (Windows - Recommended)

```powershell
# Install via Chocolatey
choco install cedra

# Verify installation
cedra --version
```

### Option 2: Pre-built Binary (Any Platform)

1. Visit the [Cedra CLI Releases](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.4)
2. Download the binary for your platform
3. Extract and add to your PATH

**Windows:**
```powershell
# Move to a directory in your PATH
Move-Item cedra.exe C:\Windows\System32\

# Or add to PATH
$env:PATH += ";C:\path\to\cedra"
```

### Option 3: Build from Source

```powershell
# Clone the repository
git clone https://github.com/cedra-labs/cedra-network
cd cedra-network

# Build
cargo build --release -p cedra

# The binary is at target/release/cedra.exe
```

### Verify Installation

```powershell
cedra --version
# Should output: cedra 1.0.4 or similar
```

---

## 💻 IDE Setup

### VS Code (Recommended)

1. **Install Move Language Extension**
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "Move Language"
   - Install [Move Language Extension](https://marketplace.visualstudio.com/items?itemName=MoveBit.aptos-move-analyzer)

2. **Configure Settings**
   ```json
   {
     "move.server.path": "cedra",
     "editor.formatOnSave": true
   }
   ```

### JetBrains IDEs (IntelliJ, CLion)

1. Go to Settings → Plugins
2. Search for "Move on Aptos"
3. Install and restart IDE

---

## 🔑 Creating Your Cedra Account

### Initialize Account

```powershell
# Create a new account
cedra init
```

You'll see prompts like:
```
Configuring for profile default
Choose network from [devnet, testnet, local, custom]:
> testnet
Enter your private key as a hex literal (0x...) or press Enter to generate a new one:
> [Press Enter for new key]

Account 0x1234...abcd has been initialized locally!
```

### View Account Info

```powershell
# Show your account address
cedra account show

# Output:
# {
#   "account_address": "0x1234...abcd",
#   "private_key": "0xabcd...1234",
#   "public_key": "0x5678...efgh"
# }
```

### Important Files

After `cedra init`, these files are created:
```
~/.cedra/
├── config.yaml    # Account configuration
└── profiles/
    └── default/   # Default profile keys
```

⚠️ **Never share your private key!** Keep it safe and backed up.

---

## 💰 Getting Test Tokens

### Method 1: Web Faucet (Easiest)

1. **Testnet**: Visit [https://faucet.cedra.dev/](https://faucet.cedra.dev/)
2. **Devnet**: Visit [https://devnet-faucet.cedra.dev/](https://devnet-faucet.cedra.dev/)
3. Enter your account address
4. Click "Fund Account"

### Method 2: CLI Faucet

```powershell
# Fund your account
cedra account fund-with-faucet

# Fund with specific amount
cedra account fund-with-faucet --amount 100000000
```

### Method 3: API

```powershell
# Using cURL
curl --location --request POST `
  "https://faucet-api.cedra.dev/mint?amount=100&auth_key=YOUR_AUTH_KEY" `
  --data ''
```

### Verify Balance

```powershell
# Check your balance
cedra account balance

# Or via API
curl "https://testnet.cedra.dev/v1/accounts/YOUR_ADDRESS/balance/0x1::cedra_coin::CedraCoin"
```

---

## 🚀 Your First Move Project

### Create Project

```powershell
# Create project directory
mkdir my_first_project
cd my_first_project

# Initialize Move project
cedra move init --name my_first_project
```

This creates:
```
my_first_project/
├── Move.toml          # Package configuration
├── sources/           # Move source files
└── tests/             # Test files
```

### Configure Move.toml

Edit `Move.toml`:
```toml
[package]
name = "my_first_project"
version = "1.0.0"
authors = ["Your Name"]

[addresses]
my_first_project = "_"  # Will use account address

[dependencies.CedraFramework]
git = "https://github.com/cedra-labs/cedra-framework.git"
rev = "main"
subdir = "cedra-framework"
```

### Create a Simple Module

Create `sources/hello.move`:
```move
module my_first_project::hello {
    use std::string::{Self, String};
    
    #[view]
    public fun say_hello(): String {
        string::utf8(b"Hello, Cedra!")
    }
}
```

### Compile

```powershell
# Compile the project
cedra move compile --named-addresses my_first_project=default

# Expected output:
# BUILDING my_first_project
# {
#   "Result": [...]
# }
```

### Test

```powershell
# Run tests (if any)
cedra move test
```

---

## 🔍 Useful CLI Commands

### Account Commands
```powershell
cedra init                      # Initialize account
cedra account show              # Show account info
cedra account balance           # Check balance
cedra account fund-with-faucet  # Get test tokens
```

### Move Commands
```powershell
cedra move init --name NAME     # Create new project
cedra move compile              # Compile project
cedra move test                 # Run tests
cedra move publish              # Deploy to network
cedra move run                  # Execute function
cedra move view                 # Call view function
```

### Network Commands
```powershell
cedra config show               # Show current config
cedra config set --network testnet  # Switch network
```

---

## ✅ Environment Checklist

Before continuing, verify:

- [ ] Rust installed (`rustc --version`)
- [ ] Node.js installed (`node --version`)
- [ ] Cedra CLI installed (`cedra --version`)
- [ ] IDE extension installed
- [ ] Account created (`cedra account show`)
- [ ] Test tokens received (`cedra account balance`)
- [ ] First project compiles (`cedra move compile`)

---

## 🐛 Troubleshooting

### "cedra: command not found"
- Ensure the binary is in your PATH
- Restart your terminal after installation

### "Failed to download dependencies"
- Check internet connection
- Try `git config --global url."https://".insteadOf git://`

### "Insufficient balance for transaction"
- Get more test tokens from faucet
- Wait a few seconds for faucet cooldown

### Windows Defender Blocks Cedra
- Add exception for cedra.exe
- Or temporarily disable real-time protection

---

## 📚 Further Reading

- [Cedra CLI Documentation](https://docs.cedra.network/cli/usage)
- [Move Language Extension](https://marketplace.visualstudio.com/items?itemName=MoveBit.aptos-move-analyzer)

---

## ➡️ Next Chapter

[Chapter 3: Understanding Move Basics →](./03-move-basics.md)
