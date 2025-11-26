# Chapter 5: Creating Fungible Tokens

> **Build Your Own Token Using Cedra's Fungible Asset Standard**

---

## 🎯 What You'll Learn

- Understand the Fungible Asset (FA) standard
- Create a complete token with metadata
- Implement minting with supply caps
- Add transfer and burning functionality
- Manage admin capabilities safely

---

## 📖 What is the Fungible Asset Standard?

The **Fungible Asset (FA)** standard is Cedra's native token standard - similar to ERC-20 on Ethereum but more powerful:

| Feature | ERC-20 (Ethereum) | FA (Cedra) |
|---------|-------------------|------------|
| Storage | Contract mapping | Object per user |
| Decimals | Variable | Standardized |
| Freezing | Custom | Built-in |
| Metadata | Separate | Unified |
| Gas Cost | Higher | Lower |

### Key Concepts

```
Fungible Asset Structure:
┌────────────────────────────────────────┐
│           Metadata Object               │
│  ┌────────────────────────────────┐    │
│  │ name: "My Token"                │    │
│  │ symbol: "MTK"                   │    │
│  │ decimals: 8                     │    │
│  │ icon_uri: "https://..."         │    │
│  └────────────────────────────────┘    │
│                                         │
│  Capabilities (Stored with metadata):  │
│  - MintRef: Create new tokens          │
│  - TransferRef: Force transfers        │
│  - BurnRef: Destroy tokens             │
└────────────────────────────────────────┘

User's Primary Store:
┌──────────────────────┐
│  Balance: 1000.00    │
│  Frozen: false       │
└──────────────────────┘
```

---

## 🏗️ Project Setup

```powershell
# Create project
mkdir token_project
cd token_project
cedra move init --name token_project
```

### Configure Move.toml

```toml
[package]
name = "token_project"
version = "1.0.0"

[addresses]
token_addr = "_"

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-network.git", subdir = "cedra-framework", rev = "mainnet" }
```

---

## 📝 Complete Token Contract

Create `sources/my_token.move`:

```move
/// A complete fungible token implementation
module token_addr::my_token {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object, ExtendRef};
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::event;

    //==============================
    // CONSTANTS
    //==============================
    
    /// Token metadata
    const TOKEN_NAME: vector<u8> = b"Cedra Tutorial Token";
    const TOKEN_SYMBOL: vector<u8> = b"CTT";
    const TOKEN_DECIMALS: u8 = 8;
    const TOKEN_ICON: vector<u8> = b"https://cedra.dev/token-icon.png";
    const TOKEN_PROJECT: vector<u8> = b"https://cedra.dev";
    
    /// Maximum supply (100 million tokens with 8 decimals)
    const MAX_SUPPLY: u64 = 100_000_000_00000000;
    
    /// Seed for creating the metadata object
    const ASSET_SYMBOL: vector<u8> = b"CTT";

    //==============================
    // ERROR CODES
    //==============================
    
    const E_NOT_ADMIN: u64 = 1;
    const E_MAX_SUPPLY_EXCEEDED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_ZERO_AMOUNT: u64 = 4;
    const E_ACCOUNT_FROZEN: u64 = 5;

    //==============================
    // RESOURCES
    //==============================
    
    /// Stores the token capabilities
    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
        extend_ref: ExtendRef
    }
    
    /// Tracks total supply
    struct SupplyTracker has key {
        current_supply: u64,
        max_supply: u64,
        total_minted: u64,
        total_burned: u64
    }

    //==============================
    // EVENTS
    //==============================
    
    #[event]
    struct TokenMinted has drop, store {
        to: address,
        amount: u64,
        total_supply: u64
    }
    
    #[event]
    struct TokenBurned has drop, store {
        from: address,
        amount: u64,
        total_supply: u64
    }
    
    #[event]
    struct TokenTransferred has drop, store {
        from: address,
        to: address,
        amount: u64
    }

    //==============================
    // INITIALIZATION
    //==============================
    
    /// Initialize the token - runs automatically on deployment
    fun init_module(admin: &signer) {
        // Create the metadata object
        let constructor_ref = object::create_named_object(admin, ASSET_SYMBOL);
        
        // Generate the fungible asset
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::some((MAX_SUPPLY as u128)),  // Maximum supply
            string::utf8(TOKEN_NAME),
            string::utf8(TOKEN_SYMBOL),
            TOKEN_DECIMALS,
            string::utf8(TOKEN_ICON),
            string::utf8(TOKEN_PROJECT)
        );
        
        // Generate capability refs
        let mint_ref = fungible_asset::generate_mint_ref(&constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(&constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        
        // Store capabilities on the metadata object
        let metadata_signer = object::generate_signer(&constructor_ref);
        move_to(&metadata_signer, ManagedFungibleAsset {
            mint_ref,
            transfer_ref,
            burn_ref,
            extend_ref
        });
        
        // Initialize supply tracker
        move_to(admin, SupplyTracker {
            current_supply: 0,
            max_supply: MAX_SUPPLY,
            total_minted: 0,
            total_burned: 0
        });
    }

    //==============================
    // VIEW FUNCTIONS
    //==============================
    
    #[view]
    /// Get the metadata object for this token
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    #[view]
    /// Get the balance of an address
    public fun balance(owner: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(owner, metadata)
    }
    
    #[view]
    /// Check if an account is frozen
    public fun is_frozen(account: address): bool {
        let metadata = get_metadata();
        primary_fungible_store::is_frozen(account, metadata)
    }
    
    #[view]
    /// Get current total supply
    public fun total_supply(): u64 acquires SupplyTracker {
        borrow_global<SupplyTracker>(@token_addr).current_supply
    }
    
    #[view]
    /// Get maximum supply
    public fun max_supply(): u64 {
        MAX_SUPPLY
    }
    
    #[view]
    /// Get remaining mintable supply
    public fun remaining_supply(): u64 acquires SupplyTracker {
        let tracker = borrow_global<SupplyTracker>(@token_addr);
        tracker.max_supply - tracker.current_supply
    }
    
    #[view]
    /// Get token name
    public fun name(): String {
        fungible_asset::name(get_metadata())
    }
    
    #[view]
    /// Get token symbol
    public fun symbol(): String {
        fungible_asset::symbol(get_metadata())
    }
    
    #[view]
    /// Get token decimals
    public fun decimals(): u8 {
        fungible_asset::decimals(get_metadata())
    }

    //==============================
    // ADMIN FUNCTIONS
    //==============================
    
    /// Mint tokens to an address (admin only)
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires ManagedFungibleAsset, SupplyTracker {
        // Verify admin
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        assert!(amount > 0, E_ZERO_AMOUNT);
        
        // Check supply cap
        let tracker = borrow_global_mut<SupplyTracker>(@token_addr);
        assert!(tracker.current_supply + amount <= tracker.max_supply, E_MAX_SUPPLY_EXCEEDED);
        
        // Get mint capability
        let metadata = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&metadata));
        
        // Mint tokens
        let fa = fungible_asset::mint(&managed.mint_ref, amount);
        
        // Deposit to recipient
        primary_fungible_store::deposit(to, fa);
        
        // Update supply tracker
        tracker.current_supply = tracker.current_supply + amount;
        tracker.total_minted = tracker.total_minted + amount;
        
        // Emit event
        event::emit(TokenMinted {
            to,
            amount,
            total_supply: tracker.current_supply
        });
    }
    
    /// Burn tokens from caller's account
    public entry fun burn(
        account: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset, SupplyTracker {
        let from = signer::address_of(account);
        
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(balance(from) >= amount, E_INSUFFICIENT_BALANCE);
        
        let metadata = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&metadata));
        
        // Burn from primary store
        primary_fungible_store::burn(&managed.burn_ref, from, amount);
        
        // Update supply
        let tracker = borrow_global_mut<SupplyTracker>(@token_addr);
        tracker.current_supply = tracker.current_supply - amount;
        tracker.total_burned = tracker.total_burned + amount;
        
        event::emit(TokenBurned {
            from,
            amount,
            total_supply: tracker.current_supply
        });
    }
    
    /// Freeze an account (admin only)
    public entry fun freeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let metadata = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&metadata));
        
        let store = primary_fungible_store::ensure_primary_store_exists(account, metadata);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, store, true);
    }
    
    /// Unfreeze an account (admin only)
    public entry fun unfreeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let metadata = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&metadata));
        
        let store = primary_fungible_store::primary_store(account, metadata);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, store, false);
    }

    //==============================
    // USER FUNCTIONS
    //==============================
    
    /// Transfer tokens to another address
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let from_addr = signer::address_of(from);
        
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(balance(from_addr) >= amount, E_INSUFFICIENT_BALANCE);
        assert!(!is_frozen(from_addr), E_ACCOUNT_FROZEN);
        assert!(!is_frozen(to), E_ACCOUNT_FROZEN);
        
        let metadata = get_metadata();
        primary_fungible_store::transfer(from, metadata, to, amount);
        
        event::emit(TokenTransferred {
            from: from_addr,
            to,
            amount
        });
    }

    //==============================
    // TESTS
    //==============================
    
    #[test_only]
    use cedra_framework::account;
    
    #[test(admin = @token_addr)]
    fun test_init(admin: &signer) {
        account::create_account_for_test(@token_addr);
        init_module(admin);
        
        assert!(name() == string::utf8(b"Cedra Tutorial Token"), 0);
        assert!(symbol() == string::utf8(b"CTT"), 1);
        assert!(decimals() == 8, 2);
    }
    
    #[test(admin = @token_addr, user = @0x123)]
    fun test_mint(admin: &signer, user: &signer) acquires ManagedFungibleAsset, SupplyTracker {
        account::create_account_for_test(@token_addr);
        account::create_account_for_test(@0x123);
        init_module(admin);
        
        mint(admin, @0x123, 1000_00000000);
        assert!(balance(@0x123) == 1000_00000000, 0);
        assert!(total_supply() == 1000_00000000, 1);
    }
    
    #[test(admin = @token_addr, user = @0x123)]
    fun test_transfer(admin: &signer, user: &signer) acquires ManagedFungibleAsset, SupplyTracker {
        account::create_account_for_test(@token_addr);
        account::create_account_for_test(@0x123);
        account::create_account_for_test(@0x456);
        init_module(admin);
        
        mint(admin, @0x123, 1000_00000000);
        transfer(user, @0x456, 400_00000000);
        
        assert!(balance(@0x123) == 600_00000000, 0);
        assert!(balance(@0x456) == 400_00000000, 1);
    }
}
```

---

## 🔍 Understanding Key Components

### 1. Metadata Object

```move
primary_fungible_store::create_primary_store_enabled_fungible_asset(
    &constructor_ref,
    option::some((MAX_SUPPLY as u128)),  // Max supply (optional)
    string::utf8(TOKEN_NAME),             // Name
    string::utf8(TOKEN_SYMBOL),           // Symbol
    TOKEN_DECIMALS,                       // Decimals
    string::utf8(TOKEN_ICON),             // Icon URI
    string::utf8(TOKEN_PROJECT)           // Project URI
);
```

### 2. Capability Pattern

```move
// Store capabilities securely
struct ManagedFungibleAsset has key {
    mint_ref: MintRef,      // Permission to create tokens
    transfer_ref: TransferRef, // Permission to force transfers
    burn_ref: BurnRef       // Permission to destroy tokens
}

// Use capabilities
let fa = fungible_asset::mint(&managed.mint_ref, amount);
primary_fungible_store::burn(&managed.burn_ref, from, amount);
```

### 3. Primary Fungible Store

Every user automatically gets a "primary store" for each token type:

```move
// Check balance
primary_fungible_store::balance(owner, metadata)

// Transfer
primary_fungible_store::transfer(from, metadata, to, amount)

// Deposit
primary_fungible_store::deposit(to, fa)
```

---

## 🚀 Deploying Your Token

```powershell
# Compile
cedra move compile --named-addresses token_addr=default

# Deploy
cedra move publish --named-addresses token_addr=default --assume-yes

# Mint tokens
cedra move run \
  --function-id 'default::my_token::mint' \
  --args 'address:YOUR_ADDRESS' 'u64:1000000000000' \
  --assume-yes

# Check balance
cedra move view \
  --function-id 'default::my_token::balance' \
  --args 'address:YOUR_ADDRESS'
```

---

## 🎮 Common Token Patterns

### Faucet Pattern

```move
/// Anyone can claim tokens once
public entry fun claim_from_faucet(
    claimer: &signer
) acquires ManagedFungibleAsset, SupplyTracker {
    let claimer_addr = signer::address_of(claimer);
    
    // Check hasn't claimed before
    assert!(!has_claimed(claimer_addr), E_ALREADY_CLAIMED);
    
    // Mint fixed amount
    let amount = 100_00000000; // 100 tokens
    
    // ... mint logic
    
    // Record claim
    mark_claimed(claimer);
}
```

### Vesting Pattern

```move
struct VestingSchedule has key {
    total_amount: u64,
    released: u64,
    start_time: u64,
    duration: u64
}

public entry fun release_vested(
    beneficiary: &signer
) acquires VestingSchedule, ManagedFungibleAsset {
    // Calculate vested amount based on time
    // Release tokens
}
```

---

## 📝 Key Takeaways

1. **FA Standard** is the native token standard on Cedra
2. **Capability refs** control minting, burning, and transfers
3. **Primary stores** auto-manage user balances
4. **Metadata** is stored as an object with the asset
5. **Events** track all token movements

---

## ➡️ Next Steps

In Chapter 6, we'll create NFT collections using the Digital Asset standard!

[Continue to Chapter 6: Building NFT Collections →](./06-nft-collections.md)
