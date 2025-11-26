# Episode 1: Setting Up Cedra Development Environment

> **Video Script - 5 Minutes**

---

## 🎬 VIDEO INFO

- **Title**: "Set Up Cedra in 5 Minutes - Complete Dev Environment Guide"
- **Duration**: 5:00
- **Thumbnail Text**: "CEDRA SETUP 🔥"
- **Tags**: cedra, move, blockchain, smart contracts, tutorial, setup

---

## 📝 SCRIPT

### [0:00-0:15] HOOK

**[SCREEN: Cedra logo animation]**

**NARRATOR:**
"Want to build on one of the fastest blockchains using the safest smart contract language? In the next 5 minutes, I'll show you exactly how to set up your complete Cedra development environment from scratch."

---

### [0:15-0:45] CONTEXT

**[SCREEN: Split screen - Cedra stats on left, Move code on right]**

**NARRATOR:**
"Cedra is a high-performance blockchain built on Move - a language designed from the ground up for security. With 10,000+ transactions per second and sub-second finality, it's built for real applications.

But the best part? Getting started is surprisingly easy. Let's dive in."

---

### [0:45-1:30] INSTALL CLI

**[SCREEN: Terminal - Windows PowerShell]**

**NARRATOR:**
"First, we need the Cedra CLI. If you're on Windows, the easiest way is using Chocolatey."

**[TYPE ON SCREEN]:**
```powershell
choco install cedra
```

**NARRATOR:**
"This installs the latest Cedra CLI. Let's verify it worked."

**[TYPE ON SCREEN]:**
```powershell
cedra --version
```

**[SHOW OUTPUT]:**
```
cedra 1.0.4
```

**NARRATOR:**
"Perfect! If you're on Linux, you can use apt, and Mac users can download the binary directly from GitHub. Links in the description."

---

### [1:30-2:15] CREATE ACCOUNT

**[SCREEN: Terminal continues]**

**NARRATOR:**
"Now let's create your Cedra account. This generates a new keypair for signing transactions."

**[TYPE ON SCREEN]:**
```powershell
cedra init
```

**[SHOW PROMPTS AND RESPONSES]:**
```
Choose network: testnet
Enter private key or press Enter to generate: [Enter]
Account 0x1234...abcd has been initialized!
```

**NARRATOR:**
"We're using testnet for development. The CLI generated a new account and saved it locally. Never share your private key!"

**[TYPE ON SCREEN]:**
```powershell
cedra account show
```

**NARRATOR:**
"You can see your account address anytime with this command. Copy this address - we'll need it next."

---

### [2:15-2:45] GET TEST TOKENS

**[SCREEN: Browser + Terminal split]**

**NARRATOR:**
"Before deploying contracts, we need test tokens. The easiest way is the web faucet."

**[BROWSER: Navigate to faucet.cedra.dev]**

**NARRATOR:**
"Just paste your address, click fund, and you'll have test tokens in seconds."

**[SHOW: Paste address, click button, success message]**

**NARRATOR:**
"Alternatively, use the CLI:"

**[TYPE ON SCREEN]:**
```powershell
cedra account fund-with-faucet
```

**[SHOW: Balance confirmation]**

---

### [2:45-3:45] FIRST PROJECT

**[SCREEN: Terminal + VS Code]**

**NARRATOR:**
"Now the fun part - your first Move project!"

**[TYPE ON SCREEN]:**
```powershell
mkdir my_first_project
cd my_first_project
cedra move init --name my_first_project
```

**NARRATOR:**
"This creates a Move package with the standard structure."

**[SCREEN: Show VS Code with project structure]**
```
my_first_project/
├── Move.toml
└── sources/
```

**NARRATOR:**
"Move.toml is your package config, and sources is where your smart contracts live."

**[SCREEN: Open VS Code, create file]**

**NARRATOR:**
"Let's create a simple hello world module."

**[TYPE IN VS CODE]:**
```move
module my_first_project::hello {
    use std::string;
    
    #[view]
    public fun say_hello(): string::String {
        string::utf8(b"Hello, Cedra!")
    }
}
```

**NARRATOR:**
"This is a simple view function that returns a greeting. Now let's compile:"

**[TYPE IN TERMINAL]:**
```powershell
cedra move compile --named-addresses my_first_project=default
```

**[SHOW: Success output]**

**NARRATOR:**
"No errors! Your first Move module compiles successfully."

---

### [3:45-4:30] IDE SETUP

**[SCREEN: VS Code Extensions]**

**NARRATOR:**
"One more thing - IDE support makes development much easier. In VS Code, search for 'Move' in extensions and install the Move Language extension."

**[SHOW: Search and install extension]**

**NARRATOR:**
"Now you get syntax highlighting, error detection, and code completion. Much better!"

**[SHOW: Extension features in action]**

---

### [4:30-5:00] SUMMARY & CTA

**[SCREEN: Recap slide]**

**NARRATOR:**
"That's it! In just 5 minutes you've:
- Installed the Cedra CLI
- Created your account
- Got test tokens
- Built your first Move module
- Set up IDE support

You're ready to start building on Cedra."

**[SCREEN: Subscribe animation + next video thumbnail]**

**NARRATOR:**
"In the next video, I'll explain how Move's resource model makes your code inherently safer than Solidity. Subscribe and hit the bell so you don't miss it.

Happy building!"

---

## 📋 B-ROLL CHECKLIST

- [ ] Cedra logo animation
- [ ] Terminal commands being typed
- [ ] VS Code with Move syntax highlighting
- [ ] Faucet website interaction
- [ ] Extension installation

## 🔗 DESCRIPTION LINKS

```
🔗 Resources:
- Cedra Documentation: https://docs.cedra.network/
- Cedra CLI Releases: https://github.com/cedra-labs/cedra-network/releases
- Testnet Faucet: https://faucet.cedra.dev/
- Move Extension: https://marketplace.visualstudio.com/items?itemName=MoveBit.aptos-move-analyzer

📺 In This Series:
- Ep 1: Setup (this video)
- Ep 2: Resources vs Mappings
- Ep 3: Deploy Your First Contract
- Ep 4: Common Errors
- Ep 5: Build a DApp

💬 Join the Community:
- Telegram: https://t.me/+Ba3QXd0VG9U0Mzky
```
