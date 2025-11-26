# Episode 5: Building a Simple DApp

> **Video Script - 5 Minutes**

---

## 🎬 VIDEO INFO

- **Title**: "Build a Web3 DApp on Cedra - Complete Frontend Guide"
- **Duration**: 5:00
- **Thumbnail Text**: "BUILD DAPP 🌐"
- **Tags**: cedra, move, dapp, react, web3, frontend, tutorial

---

## 📝 SCRIPT

### [0:00-0:15] HOOK

**[SCREEN: Split - Contract code on left, DApp UI on right]**

**NARRATOR:**
"You've written smart contracts. Now let's build a frontend that anyone can use. In 5 minutes, we'll create a Web3 DApp that connects wallets, reads data, and sends transactions."

---

### [0:15-0:45] OVERVIEW

**[SCREEN: Architecture diagram]**

**NARRATOR:**
"Our DApp has three layers:"

**[SHOW DIAGRAM]:**
```
┌─────────────────────────┐
│     React Frontend      │
├─────────────────────────┤
│     Cedra SDK           │
├─────────────────────────┤
│   Smart Contracts       │
│   (Counter, Token, NFT) │
└─────────────────────────┘
```

**NARRATOR:**
"React for the UI, Cedra SDK for blockchain calls, and our deployed contracts. Let's build it."

---

### [0:45-1:30] PROJECT SETUP

**[SCREEN: Terminal]**

**NARRATOR:**
"Create a new React project with Vite."

**[TYPE ON SCREEN]:**
```powershell
npm create vite@latest my-cedra-dapp -- --template react-ts
cd my-cedra-dapp
npm install @cedra-labs/ts-sdk
npm install
```

**NARRATOR:**
"We're using TypeScript for type safety. The Cedra SDK gives us everything we need to talk to the blockchain."

**[SCREEN: VS Code - Show package.json]**

**NARRATOR:**
"Dependencies installed. Now let's set up our Cedra client."

---

### [1:30-2:15] CEDRA CLIENT

**[SCREEN: VS Code - Create cedra-client.ts]**

**NARRATOR:**
"Create a client file to configure the SDK."

**[TYPE ON SCREEN]:**
```typescript
// src/cedra-client.ts
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

const config = new CedraConfig({ network: Network.TESTNET });
export const cedra = new Cedra(config);

// Our deployed module
export const MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4";
export const COUNTER_MODULE = `${MODULE_ADDRESS}::simple_counter`;
```

**NARRATOR:**
"We configure for testnet and export our module address. This is the contract we deployed earlier."

---

### [2:15-3:00] WALLET CONNECTION

**[SCREEN: VS Code - Create WalletConnect.tsx]**

**NARRATOR:**
"Now let's connect Petra wallet."

**[TYPE ON SCREEN]:**
```typescript
// src/components/WalletConnect.tsx
import { useState } from 'react';

export function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);

  const connect = async () => {
    if (window.petra) {
      const response = await window.petra.connect();
      setAccount(response.address);
    } else {
      window.open("https://petra.app/", "_blank");
    }
  };

  return (
    <div>
      {account ? (
        <span>{account.slice(0,6)}...{account.slice(-4)}</span>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

**NARRATOR:**
"We check if Petra is installed, request connection, and display the address. Simple!"

---

### [3:00-3:45] READ DATA

**[SCREEN: VS Code - Counter component]**

**NARRATOR:**
"Now let's read the counter value. View functions are FREE - no transaction needed."

**[TYPE ON SCREEN]:**
```typescript
// Reading counter value
const getCount = async (address: string) => {
  const [count] = await cedra.view({
    payload: {
      function: `${COUNTER_MODULE}::get_count`,
      functionArguments: [address]
    }
  });
  return Number(count);
};
```

**NARRATOR:**
"The view function returns the current count. Now let's write data."

---

### [3:45-4:30] WRITE DATA

**[SCREEN: VS Code - Transaction code]**

**NARRATOR:**
"Entry functions change state and require a transaction."

**[TYPE ON SCREEN]:**
```typescript
// Incrementing counter
const increment = async () => {
  const payload = {
    type: "entry_function_payload",
    function: `${COUNTER_MODULE}::increment`,
    type_arguments: [],
    arguments: []
  };

  const response = await window.petra.signAndSubmitTransaction(payload);
  
  // Wait for confirmation
  await cedra.waitForTransaction({ transactionHash: response.hash });
  
  // Refresh the count
  await refreshCount();
};
```

**NARRATOR:**
"Petra signs and submits the transaction. We wait for confirmation, then refresh the UI. The user sees their new count instantly."

**[SCREEN: Show DApp in browser with counter working]**

---

### [4:30-4:50] DEMO

**[SCREEN: Browser - Full DApp demo]**

**NARRATOR:**
"Let's see it in action!"

**[SHOW: Click Connect, Initialize counter, Increment 3 times, View count = 3]**

**NARRATOR:**
"Connect wallet... Initialize counter... Increment... And our count updates in real-time. That's a fully functional Web3 DApp!"

---

### [4:50-5:00] CTA

**[SCREEN: Resources + Subscribe]**

**NARRATOR:**
"Full source code is in the description. You now have everything you need to build on Cedra. What will you create? Subscribe and share your projects in the comments!"

**[END SCREEN: Subscribe button, GitHub link, Discord link]**

---

## 📋 CODE EXAMPLES TO SHOW

1. Project setup with Vite + TypeScript
2. Cedra SDK configuration
3. Wallet connection with Petra
4. View function call (read)
5. Entry function call (write)
6. Transaction confirmation handling

## 🖼️ THUMBNAIL DESIGN

- Browser window with DApp UI
- React logo + Cedra logo
- Text: "BUILD DAPP 🌐"
- Counter showing "42"

## 📦 GITHUB LINK

Include link to complete source code in video description.
