# Lesson 1: Fungible Assets - The Cedra Token Standard

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand the Fungible Asset (FA) standard
- Know the difference between FA and coins
- Learn about primary fungible stores
- Set up your first token project

---

## 📖 What are Fungible Assets?

**Fungible Assets (FA)** are Cedra's modern token standard - equivalent to ERC-20 on Ethereum, but better!

### Fungible = Interchangeable

Like dollar bills - one $10 is the same as any other $10:
- ✅ 100 USDC = 100 USDC (interchangeable)
- ❌ NFT #1 ≠ NFT #2 (not interchangeable)

### FA vs Legacy Coins

| Feature | Fungible Asset (FA) | Legacy Coin |
|---------|---------------------|-------------|
| Standard | Modern (recommended) | Legacy |
| Receiving | Automatic via stores | Requires registration |
| Transfers | No recipient action | Recipient must opt-in |
| Metadata | Built-in (name, symbol, uri) | Requires custom code |
| Extensions | Freezing, burning, etc. | Manual implementation |

**Always use Fungible Assets for new tokens!**

---

## 🏗️ FA Architecture

```
Token (Object with Metadata)
    └── FungibleAsset (The value)
            └── FungibleStore (Holds balance for a user)
                    └── Primary Store (Auto-created per user)
```

### Key Components

1. **Metadata Object**: Stores token info (name, symbol, decimals)
2. **Fungible Asset**: The actual value being transferred
3. **Fungible Store**: Account's balance container
4. **Primary Store**: Default store (auto-created for each user)

---

## 📦 Setting Up a Token Project

### Project Structure

```
my-token/
├── Move.toml
└── sources/
    └── my_token.move
```

### Move.toml

```toml
[package]
name = "MyToken"
version = "1.0.0"
authors = ["Your Name"]

[addresses]
token_addr = "_"

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-framework.git", subdir = "cedra-framework", rev = "main" }
```

---

## 📝 Basic Token Template

```move
module token_addr::my_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::option;
    use std::signer;
    use std::string::utf8;

    // ============================================
    // TOKEN CONFIGURATION
    // ============================================
    
    const ASSET_NAME: vector<u8> = b"My Awesome Token";
    const ASSET_SYMBOL: vector<u8> = b"MAT";
    const DECIMALS: u8 = 8;
    const ICON_URI: vector<u8> = b"https://example.com/icon.png";
    const PROJECT_URI: vector<u8> = b"https://example.com";

    // ============================================
    // CAPABILITIES (Admin Powers)
    // ============================================
    
    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,      // Power to create tokens
        transfer_ref: TransferRef,  // Power to force transfers
        burn_ref: BurnRef,      // Power to destroy tokens
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /// Called automatically when module is published
    fun init_module(admin: &signer) {
        // Create the token metadata object
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        
        // Initialize fungible asset with primary store enabled
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),           // No max supply
            utf8(ASSET_NAME),
            utf8(ASSET_SYMBOL),
            DECIMALS,
            utf8(ICON_URI),
            utf8(PROJECT_URI),
        );
        
        // Generate capability refs (admin powers)
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        
        // Store capabilities
        let metadata_signer = object::generate_signer(constructor_ref);
        move_to(&metadata_signer, ManagedFungibleAsset { 
            mint_ref, 
            transfer_ref, 
            burn_ref 
        });
    }
}
```

---

## 🔑 Understanding Capabilities

Capabilities are like **admin keys** that grant special powers:

### MintRef - Create Tokens
```move
// Only the holder of MintRef can create new tokens
let fa = fungible_asset::mint(&managed.mint_ref, amount);
```

### BurnRef - Destroy Tokens
```move
// Only the holder of BurnRef can destroy tokens
fungible_asset::burn_from(&managed.burn_ref, store, amount);
```

### TransferRef - Force Transfers
```move
// Can move tokens even from frozen accounts
fungible_asset::transfer_with_ref(&managed.transfer_ref, from, to, amount);

// Can freeze/unfreeze accounts
fungible_asset::set_frozen_flag(&managed.transfer_ref, store, true);
```

---

## 🏪 Primary Fungible Stores

Primary stores are **automatic wallets** for each user:

```move
use cedra_framework::primary_fungible_store;

// Get user's balance
let balance = primary_fungible_store::balance(user_addr, asset);

// Ensure store exists (creates if needed)
let store = primary_fungible_store::ensure_primary_store_exists(user_addr, asset);

// Transfer between primary stores
primary_fungible_store::transfer(from_signer, asset, to_addr, amount);
```

### Why Primary Stores?

Without primary stores:
```move
// ❌ Old way: Recipient must register first
register<CoinType>(recipient);  // Extra step required!
transfer<CoinType>(from, to, amount);
```

With primary stores:
```move
// ✅ New way: Just send!
primary_fungible_store::transfer(from, asset, to, amount);
// Store is auto-created for recipient
```

---

## 🎮 Interactive Exercise

### Challenge: Define Your Token

Fill in the configuration for your own meme token:

```move
module token_addr::doge_coin {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef};
    use cedra_framework::object;
    use cedra_framework::primary_fungible_store;
    use std::option;
    use std::string::utf8;

    // TODO: Configure your token
    const ASSET_NAME: vector<u8> = b"???";      // e.g., "Doge Coin"
    const ASSET_SYMBOL: vector<u8> = b"???";    // e.g., "DOGE"
    const DECIMALS: u8 = ???;                    // Usually 8
    const ICON_URI: vector<u8> = b"???";
    const PROJECT_URI: vector<u8> = b"???";
    
    // What should max supply be?
    // option::none() = unlimited
    // option::some(1000000000) = 1 billion max

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }
    
    fun init_module(admin: &signer) {
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            // TODO: Set max supply
            option::???(),
            utf8(ASSET_NAME),
            utf8(ASSET_SYMBOL),
            DECIMALS,
            utf8(ICON_URI),
            utf8(PROJECT_URI),
        );
        
        // Store capabilities
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        
        let metadata_signer = object::generate_signer(constructor_ref);
        move_to(&metadata_signer, ManagedFungibleAsset { 
            mint_ref, transfer_ref, burn_ref 
        });
    }
}
```

<details>
<summary>💡 Click for Example Solution</summary>

```move
module token_addr::doge_coin {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef};
    use cedra_framework::object;
    use cedra_framework::primary_fungible_store;
    use std::option;
    use std::string::utf8;

    const ASSET_NAME: vector<u8> = b"Doge Coin";
    const ASSET_SYMBOL: vector<u8> = b"DOGE";
    const DECIMALS: u8 = 8;
    const ICON_URI: vector<u8> = b"https://doge.example.com/icon.png";
    const PROJECT_URI: vector<u8> = b"https://doge.example.com";
    
    // 100 billion max supply with 8 decimals
    const MAX_SUPPLY: u128 = 100_000_000_000_00000000;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }
    
    fun init_module(admin: &signer) {
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::some(MAX_SUPPLY),  // Capped supply!
            utf8(ASSET_NAME),
            utf8(ASSET_SYMBOL),
            DECIMALS,
            utf8(ICON_URI),
            utf8(PROJECT_URI),
        );
        
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        
        let metadata_signer = object::generate_signer(constructor_ref);
        move_to(&metadata_signer, ManagedFungibleAsset { 
            mint_ref, transfer_ref, burn_ref 
        });
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What does "Fungible" mean in Fungible Asset?

- A) Non-divisible
- B) Interchangeable (1 token = 1 token)
- C) Unique
- D) Immutable

<details>
<summary>Answer</summary>
**B) Interchangeable** - Each unit of a fungible asset is identical and can be exchanged 1:1.
</details>

### Question 2
What do Primary Fungible Stores enable?

- A) Faster transfers
- B) Automatic recipient wallet creation
- C) Lower gas fees
- D) Token burning

<details>
<summary>Answer</summary>
**B) Automatic recipient wallet creation** - Recipients don't need to register; stores are created automatically.
</details>

---

## 📝 Key Takeaways

1. **Fungible Assets** = Modern Cedra token standard
2. **Primary Stores** = Automatic wallet for each user
3. **Capabilities** = Admin powers (mint, burn, transfer)
4. **`init_module`** = Runs once when module is published
5. Use **FA over Coin** for all new tokens

---

## 🚀 What's Next?

In the next lesson, we'll implement **Minting** - creating new tokens.

[Continue to Lesson 2: Minting Tokens →](./lesson-02-minting.md)
