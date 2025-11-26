# Lesson 2: Minting Tokens

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement token minting functionality
- Control who can mint (admin vs public)
- Handle minting to different addresses
- Implement supply caps

---

## 📖 How Minting Works

Minting creates new tokens out of thin air. It requires the **MintRef** capability.

```move
// The magic line that creates tokens
let fa = fungible_asset::mint(&mint_ref, amount);
```

This creates a `FungibleAsset` with the specified amount. Then you deposit it to a store.

---

## 🔐 Admin-Only Minting

Most tokens restrict minting to an admin:

```move
module token_addr::admin_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;
    use std::string::utf8;
    use std::option;

    const ASSET_SYMBOL: vector<u8> = b"ADMIN";
    
    // Error codes
    const E_NOT_ADMIN: u64 = 1;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }
    
    /// Get the token metadata object
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Mint tokens - ADMIN ONLY
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires ManagedFungibleAsset {
        // Verify admin
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @token_addr, E_NOT_ADMIN);
        
        // Get capabilities
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        // Ensure recipient has a store
        let to_store = primary_fungible_store::ensure_primary_store_exists(to, asset);
        
        // Mint tokens
        let fa = fungible_asset::mint(&managed.mint_ref, amount);
        
        // Deposit to recipient
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_store, fa);
    }
}
```

---

## 🌐 Public Minting (Faucet Style)

For testnets or faucets, you might allow anyone to mint:

```move
module token_addr::faucet_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;
    
    const ASSET_SYMBOL: vector<u8> = b"FAUCET";
    
    // Limit per claim
    const CLAIM_AMOUNT: u64 = 1000_00000000; // 1000 tokens with 8 decimals
    
    // Cooldown tracking
    struct ClaimRecord has key {
        last_claim: u64
    }
    
    const E_COOLDOWN_NOT_EXPIRED: u64 = 1;
    const COOLDOWN_SECONDS: u64 = 3600; // 1 hour

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Anyone can claim once per hour
    public entry fun claim(
        claimer: &signer
    ) acquires ManagedFungibleAsset, ClaimRecord {
        let claimer_addr = signer::address_of(claimer);
        let current_time = cedra_framework::timestamp::now_seconds();
        
        // Check cooldown
        if (exists<ClaimRecord>(claimer_addr)) {
            let record = borrow_global_mut<ClaimRecord>(claimer_addr);
            assert!(
                current_time >= record.last_claim + COOLDOWN_SECONDS,
                E_COOLDOWN_NOT_EXPIRED
            );
            record.last_claim = current_time;
        } else {
            move_to(claimer, ClaimRecord { last_claim: current_time });
        };
        
        // Mint tokens
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        let to_store = primary_fungible_store::ensure_primary_store_exists(claimer_addr, asset);
        let fa = fungible_asset::mint(&managed.mint_ref, CLAIM_AMOUNT);
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_store, fa);
    }
}
```

---

## 📊 Supply-Capped Minting

Enforce a maximum supply:

```move
module token_addr::capped_token {
    use cedra_framework::fungible_asset::{Self, MintRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;
    
    const ASSET_SYMBOL: vector<u8> = b"CAP";
    
    // Max supply: 1 million tokens (with 8 decimals)
    const MAX_SUPPLY: u128 = 1_000_000_00000000;
    
    const E_MAX_SUPPLY_EXCEEDED: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        total_minted: u128,  // Track total minted
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    #[view]
    public fun remaining_supply(): u128 acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        MAX_SUPPLY - managed.total_minted
    }
    
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires ManagedFungibleAsset {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @token_addr, E_NOT_ADMIN);
        
        let asset = get_metadata();
        let managed = borrow_global_mut<ManagedFungibleAsset>(object::object_address(&asset));
        
        // Check supply cap
        let amount_u128 = (amount as u128);
        assert!(
            managed.total_minted + amount_u128 <= MAX_SUPPLY,
            E_MAX_SUPPLY_EXCEEDED
        );
        
        // Update total minted
        managed.total_minted = managed.total_minted + amount_u128;
        
        // Mint and deposit
        let to_store = primary_fungible_store::ensure_primary_store_exists(to, asset);
        let fa = fungible_asset::mint(&managed.mint_ref, amount);
        fungible_asset::deposit(to_store, fa);
    }
}
```

---

## 💰 Mint with Payment

Charge for minting (like an ICO):

```move
module token_addr::paid_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_framework::coin;
    use std::signer;
    
    const ASSET_SYMBOL: vector<u8> = b"PAID";
    
    // Price: 0.1 CEDRA per token (in octas, 1 CEDRA = 10^8 octas)
    const PRICE_PER_TOKEN: u64 = 10_000_000; // 0.1 CEDRA

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        treasury: address,
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Buy tokens with CEDRA
    public entry fun buy(
        buyer: &signer,
        amount: u64  // Number of tokens to buy
    ) acquires ManagedFungibleAsset {
        let buyer_addr = signer::address_of(buyer);
        
        // Calculate cost
        let cost = amount * PRICE_PER_TOKEN;
        
        // Get asset info
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        // Take payment (CEDRA coins)
        coin::transfer<CedraCoin>(buyer, managed.treasury, cost);
        
        // Mint tokens to buyer
        let to_store = primary_fungible_store::ensure_primary_store_exists(buyer_addr, asset);
        let fa = fungible_asset::mint(&managed.mint_ref, amount);
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_store, fa);
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Mining Token

Create a token that can be "mined" with a difficulty mechanic:

```move
module token_addr::mining_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef};
    use cedra_framework::object;
    use cedra_framework::primary_fungible_store;
    use cedra_framework::timestamp;
    use std::signer;
    use std::hash;
    
    const ASSET_SYMBOL: vector<u8> = b"MINE";
    
    // Mining reward: 10 tokens
    const MINING_REWARD: u64 = 10_00000000;
    
    // Difficulty: hash must start with this many zeros
    const DIFFICULTY: u64 = 2;
    
    const E_INVALID_NONCE: u64 = 1;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        last_block: u64,
    }
    
    // TODO: Implement the mine function
    // 1. Get the current timestamp as the "block"
    // 2. Create a hash from (miner_address, block, nonce)
    // 3. Check if hash meets difficulty (simplified: hash % 100 < difficulty)
    // 4. If valid, mint reward to miner
    // 5. Update last_block
    
    public entry fun mine(
        miner: &signer,
        nonce: u64
    ) acquires ManagedFungibleAsset {
        // Your implementation here
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module token_addr::mining_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::timestamp;
    use std::signer;
    use std::bcs;
    use std::hash;
    use std::vector;
    
    const ASSET_SYMBOL: vector<u8> = b"MINE";
    const MINING_REWARD: u64 = 10_00000000;
    const DIFFICULTY: u64 = 10; // hash % 100 must be < 10 (10% chance)
    
    const E_INVALID_NONCE: u64 = 1;
    const E_BLOCK_ALREADY_MINED: u64 = 2;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        last_block: u64,
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    public entry fun mine(
        miner: &signer,
        nonce: u64
    ) acquires ManagedFungibleAsset {
        let miner_addr = signer::address_of(miner);
        let current_block = timestamp::now_seconds();
        
        let asset = get_metadata();
        let managed = borrow_global_mut<ManagedFungibleAsset>(object::object_address(&asset));
        
        // Check new block
        assert!(current_block > managed.last_block, E_BLOCK_ALREADY_MINED);
        
        // Create hash input
        let hash_input = vector::empty<u8>();
        vector::append(&mut hash_input, bcs::to_bytes(&miner_addr));
        vector::append(&mut hash_input, bcs::to_bytes(&current_block));
        vector::append(&mut hash_input, bcs::to_bytes(&nonce));
        
        // Hash it
        let hash_result = hash::sha3_256(hash_input);
        let first_byte = *vector::borrow(&hash_result, 0);
        
        // Check difficulty (simplified)
        let hash_value = (first_byte as u64) % 100;
        assert!(hash_value < DIFFICULTY, E_INVALID_NONCE);
        
        // Valid! Mint reward
        managed.last_block = current_block;
        
        let to_store = primary_fungible_store::ensure_primary_store_exists(miner_addr, asset);
        let fa = fungible_asset::mint(&managed.mint_ref, MINING_REWARD);
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_store, fa);
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What capability is required to mint new tokens?

- A) TransferRef
- B) BurnRef
- C) MintRef
- D) MetadataRef

<details>
<summary>Answer</summary>
**C) MintRef** - The MintRef capability is required to create new tokens.
</details>

### Question 2
After minting, what must you do with the FungibleAsset?

- A) Return it
- B) Deposit it to a store
- C) Nothing, it's automatic
- D) Burn it

<details>
<summary>Answer</summary>
**B) Deposit it to a store** - Minted tokens must be deposited to a FungibleStore (usually a primary store).
</details>

---

## 📝 Key Takeaways

1. **MintRef** = permission to create tokens
2. **Mint flow**: `mint()` → `FungibleAsset` → `deposit()`
3. **Admin mint** = restrict with address check
4. **Public mint** = add rate limits/cooldowns
5. **Supply cap** = track total_minted

---

## 🚀 What's Next?

In the next lesson, we'll implement **Transfers** - moving tokens between accounts.

[Continue to Lesson 3: Transfers →](./lesson-03-transfers.md)
