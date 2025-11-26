# Lesson 2: Advanced Minting

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement allowlist/whitelist minting
- Create phased minting (presale/public)
- Build mint price logic
- Track minting statistics

---

## 📖 Minting Phases

Most NFT launches have multiple phases:

```
Phase 1: Allowlist (Early access, discounted)
    ↓
Phase 2: Public Sale (Everyone, full price)
    ↓
Phase 3: Sold Out! 🎉
```

---

## 📋 Allowlist Minting

Give early access to specific addresses:

```move
module nft_addr::allowlist_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use std::vector;
    use cedra_framework::object;
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_framework::timestamp;
    use cedra_token_objects::collection;
    use cedra_token_objects::token;

    const COLLECTION_NAME: vector<u8> = b"Allowlist NFT";
    
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_ON_ALLOWLIST: u64 = 2;
    const E_ALLOWLIST_CLOSED: u64 = 3;
    const E_ALREADY_MINTED: u64 = 4;
    const E_INSUFFICIENT_PAYMENT: u64 = 5;
    
    // Allowlist price: 0.5 CEDRA (with 8 decimals)
    const ALLOWLIST_PRICE: u64 = 50000000;
    // Public price: 1 CEDRA
    const PUBLIC_PRICE: u64 = 100000000;
    
    struct MintConfig has key {
        allowlist: vector<address>,
        minted: vector<address>,
        allowlist_end: u64,  // Timestamp
        treasury: address,
        total_minted: u64,
        max_supply: u64
    }
    
    /// Initialize mint config
    fun init_module(deployer: &signer) {
        move_to(deployer, MintConfig {
            allowlist: vector::empty(),
            minted: vector::empty(),
            allowlist_end: 0,
            treasury: signer::address_of(deployer),
            total_minted: 0,
            max_supply: 1000
        });
    }
    
    /// Add addresses to allowlist (admin only)
    public entry fun add_to_allowlist(
        admin: &signer,
        addresses: vector<address>
    ) acquires MintConfig {
        assert!(signer::address_of(admin) == @nft_addr, E_NOT_ADMIN);
        
        let config = borrow_global_mut<MintConfig>(@nft_addr);
        vector::append(&mut config.allowlist, addresses);
    }
    
    /// Set allowlist end time
    public entry fun set_allowlist_end(
        admin: &signer,
        end_timestamp: u64
    ) acquires MintConfig {
        assert!(signer::address_of(admin) == @nft_addr, E_NOT_ADMIN);
        
        let config = borrow_global_mut<MintConfig>(@nft_addr);
        config.allowlist_end = end_timestamp;
    }
    
    /// Check if address is on allowlist
    #[view]
    public fun is_allowlisted(addr: address): bool acquires MintConfig {
        let config = borrow_global<MintConfig>(@nft_addr);
        vector::contains(&config.allowlist, &addr)
    }
    
    /// Check if allowlist phase is active
    #[view]
    public fun is_allowlist_phase(): bool acquires MintConfig {
        let config = borrow_global<MintConfig>(@nft_addr);
        let now = timestamp::now_seconds();
        now < config.allowlist_end
    }
    
    /// Mint during allowlist phase
    public entry fun allowlist_mint(
        minter: &signer,
        name: String,
        uri: String
    ) acquires MintConfig {
        let minter_addr = signer::address_of(minter);
        let config = borrow_global_mut<MintConfig>(@nft_addr);
        
        // Check allowlist phase is active
        let now = timestamp::now_seconds();
        assert!(now < config.allowlist_end, E_ALLOWLIST_CLOSED);
        
        // Check on allowlist
        assert!(vector::contains(&config.allowlist, &minter_addr), E_NOT_ON_ALLOWLIST);
        
        // Check hasn't minted yet
        assert!(!vector::contains(&config.minted, &minter_addr), E_ALREADY_MINTED);
        
        // Take payment
        coin::transfer<CedraCoin>(minter, config.treasury, ALLOWLIST_PRICE);
        
        // Mint
        let _constructor_ref = token::create(
            minter,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Allowlist NFT"),
            name,
            option::none(),
            uri
        );
        
        // Track
        vector::push_back(&mut config.minted, minter_addr);
        config.total_minted = config.total_minted + 1;
    }
    
    /// Mint during public phase
    public entry fun public_mint(
        minter: &signer,
        name: String,
        uri: String
    ) acquires MintConfig {
        let minter_addr = signer::address_of(minter);
        let config = borrow_global_mut<MintConfig>(@nft_addr);
        
        // Check public phase (after allowlist ends)
        let now = timestamp::now_seconds();
        assert!(now >= config.allowlist_end, E_ALLOWLIST_CLOSED);
        
        // Take payment (higher price)
        coin::transfer<CedraCoin>(minter, config.treasury, PUBLIC_PRICE);
        
        // Mint
        let _constructor_ref = token::create(
            minter,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Public NFT"),
            name,
            option::none(),
            uri
        );
        
        config.total_minted = config.total_minted + 1;
    }
    
    #[view]
    public fun get_mint_price(addr: address): u64 acquires MintConfig {
        if (is_allowlist_phase() && is_allowlisted(addr)) {
            ALLOWLIST_PRICE
        } else {
            PUBLIC_PRICE
        }
    }
}
```

---

## 🎫 Per-Wallet Limits

Limit how many each wallet can mint:

```move
module nft_addr::limited_mint {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::simple_map::{Self, SimpleMap};
    use cedra_token_objects::token;

    const COLLECTION_NAME: vector<u8> = b"Limited NFT";
    const MAX_PER_WALLET: u64 = 3;
    
    const E_MINT_LIMIT_REACHED: u64 = 1;
    const E_SOLD_OUT: u64 = 2;
    
    struct MintTracker has key {
        mints_per_address: SimpleMap<address, u64>,
        total_minted: u64,
        max_supply: u64
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, MintTracker {
            mints_per_address: simple_map::new(),
            total_minted: 0,
            max_supply: 5000
        });
    }
    
    /// Get how many an address has minted
    #[view]
    public fun mints_by_address(addr: address): u64 acquires MintTracker {
        let tracker = borrow_global<MintTracker>(@nft_addr);
        if (simple_map::contains_key(&tracker.mints_per_address, &addr)) {
            *simple_map::borrow(&tracker.mints_per_address, &addr)
        } else {
            0
        }
    }
    
    /// Get remaining mints for address
    #[view]
    public fun remaining_mints(addr: address): u64 acquires MintTracker {
        let minted = mints_by_address(addr);
        if (minted >= MAX_PER_WALLET) {
            0
        } else {
            MAX_PER_WALLET - minted
        }
    }
    
    /// Mint with per-wallet limit
    public entry fun mint(
        minter: &signer,
        quantity: u64,
        names: vector<String>,
        uris: vector<String>
    ) acquires MintTracker {
        let minter_addr = signer::address_of(minter);
        let tracker = borrow_global_mut<MintTracker>(@nft_addr);
        
        // Check supply
        assert!(tracker.total_minted + quantity <= tracker.max_supply, E_SOLD_OUT);
        
        // Check per-wallet limit
        let current_mints = if (simple_map::contains_key(&tracker.mints_per_address, &minter_addr)) {
            *simple_map::borrow(&tracker.mints_per_address, &minter_addr)
        } else {
            0
        };
        assert!(current_mints + quantity <= MAX_PER_WALLET, E_MINT_LIMIT_REACHED);
        
        // Mint all requested NFTs
        let i = 0;
        while (i < quantity) {
            let name = *std::vector::borrow(&names, i);
            let uri = *std::vector::borrow(&uris, i);
            
            let _constructor_ref = token::create(
                minter,
                string::utf8(COLLECTION_NAME),
                string::utf8(b"Limited Edition"),
                name,
                option::none(),
                uri
            );
            
            i = i + 1;
        };
        
        // Update tracking
        if (simple_map::contains_key(&tracker.mints_per_address, &minter_addr)) {
            let mints = simple_map::borrow_mut(&mut tracker.mints_per_address, &minter_addr);
            *mints = *mints + quantity;
        } else {
            simple_map::add(&mut tracker.mints_per_address, minter_addr, quantity);
        };
        tracker.total_minted = tracker.total_minted + quantity;
    }
}
```

---

## 🎲 Random Minting

Randomize which NFT is minted:

```move
module nft_addr::random_mint {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use std::vector;
    use cedra_framework::timestamp;
    use cedra_framework::transaction_context;
    use cedra_token_objects::token;

    const COLLECTION_NAME: vector<u8> = b"Mystery NFT";
    
    const E_NO_REMAINING: u64 = 1;
    
    struct MintPool has key {
        remaining_uris: vector<String>,
        remaining_names: vector<String>
    }
    
    /// Initialize with all possible NFT metadata
    fun init_module(deployer: &signer) {
        // Pre-populate with all possible NFTs
        let names = vector[
            string::utf8(b"Common Cat"),
            string::utf8(b"Rare Dog"),
            string::utf8(b"Epic Dragon"),
            string::utf8(b"Legendary Phoenix")
        ];
        
        let uris = vector[
            string::utf8(b"https://example.com/cat.json"),
            string::utf8(b"https://example.com/dog.json"),
            string::utf8(b"https://example.com/dragon.json"),
            string::utf8(b"https://example.com/phoenix.json")
        ];
        
        move_to(deployer, MintPool {
            remaining_names: names,
            remaining_uris: uris
        });
    }
    
    /// Get pseudo-random index
    fun get_random_index(max: u64): u64 {
        // Simple pseudo-random using timestamp and transaction hash
        let time = timestamp::now_microseconds();
        let hash = transaction_context::get_script_hash();
        let hash_val = if (vector::length(&hash) > 0) {
            (*vector::borrow(&hash, 0) as u64)
        } else {
            0
        };
        
        (time + hash_val) % max
    }
    
    /// Mint a random NFT from the pool
    public entry fun random_mint(minter: &signer) acquires MintPool {
        let pool = borrow_global_mut<MintPool>(@nft_addr);
        let remaining = vector::length(&pool.remaining_uris);
        
        assert!(remaining > 0, E_NO_REMAINING);
        
        // Pick random index
        let index = get_random_index(remaining);
        
        // Remove from pool (swap-remove for efficiency)
        let name = vector::swap_remove(&mut pool.remaining_names, index);
        let uri = vector::swap_remove(&mut pool.remaining_uris, index);
        
        // Mint the NFT
        let _constructor_ref = token::create(
            minter,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Mystery revealed!"),
            name,
            option::none(),
            uri
        );
    }
    
    #[view]
    public fun remaining_count(): u64 acquires MintPool {
        let pool = borrow_global<MintPool>(@nft_addr);
        vector::length(&pool.remaining_uris)
    }
}
```

---

## 💰 Dynamic Pricing

Price increases as supply decreases:

```move
module nft_addr::bonding_curve_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_token_objects::token;

    const COLLECTION_NAME: vector<u8> = b"Bonding Curve NFT";
    
    // Base price: 0.1 CEDRA
    const BASE_PRICE: u64 = 10000000;
    // Price increase per mint: 0.01 CEDRA
    const PRICE_INCREMENT: u64 = 1000000;
    
    struct PriceState has key {
        total_minted: u64,
        treasury: address
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, PriceState {
            total_minted: 0,
            treasury: signer::address_of(deployer)
        });
    }
    
    /// Calculate current price based on mints
    #[view]
    public fun current_price(): u64 acquires PriceState {
        let state = borrow_global<PriceState>(@nft_addr);
        BASE_PRICE + (state.total_minted * PRICE_INCREMENT)
    }
    
    /// Price for next N mints
    #[view]
    public fun price_for_quantity(quantity: u64): u64 acquires PriceState {
        let state = borrow_global<PriceState>(@nft_addr);
        let total: u64 = 0;
        let i = 0;
        
        while (i < quantity) {
            let price_at_mint = BASE_PRICE + ((state.total_minted + i) * PRICE_INCREMENT);
            total = total + price_at_mint;
            i = i + 1;
        };
        
        total
    }
    
    /// Mint with bonding curve pricing
    public entry fun mint(
        minter: &signer,
        name: String,
        uri: String
    ) acquires PriceState {
        let state = borrow_global_mut<PriceState>(@nft_addr);
        
        // Calculate price BEFORE mint
        let price = BASE_PRICE + (state.total_minted * PRICE_INCREMENT);
        
        // Take payment
        coin::transfer<CedraCoin>(minter, state.treasury, price);
        
        // Mint
        let _constructor_ref = token::create(
            minter,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Bonding Curve Edition"),
            name,
            option::none(),
            uri
        );
        
        state.total_minted = state.total_minted + 1;
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Tiered Minting System

```move
module nft_addr::tiered_mint {
    // Tiers: Bronze (0.5), Silver (1.0), Gold (2.0) CEDRA
    // Each tier has limited supply
    
    struct TierConfig has store {
        name: vector<u8>,
        price: u64,
        max_supply: u64,
        minted: u64
    }
    
    // TODO: Implement
    
    /// Mint from a specific tier
    public entry fun mint_tier(
        minter: &signer,
        tier: u64  // 0 = Bronze, 1 = Silver, 2 = Gold
    ) {
        // Your code here
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module nft_addr::tiered_mint {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use std::vector;
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_token_objects::token;

    const COLLECTION_NAME: vector<u8> = b"Tiered NFT";
    
    const E_INVALID_TIER: u64 = 1;
    const E_TIER_SOLD_OUT: u64 = 2;
    
    struct TierConfig has store, drop, copy {
        name: vector<u8>,
        price: u64,
        max_supply: u64,
        minted: u64
    }
    
    struct MintState has key {
        tiers: vector<TierConfig>,
        treasury: address
    }
    
    fun init_module(deployer: &signer) {
        let tiers = vector[
            TierConfig { 
                name: b"Bronze", 
                price: 50000000,  // 0.5 CEDRA
                max_supply: 500,
                minted: 0 
            },
            TierConfig { 
                name: b"Silver", 
                price: 100000000,  // 1.0 CEDRA
                max_supply: 300,
                minted: 0 
            },
            TierConfig { 
                name: b"Gold", 
                price: 200000000,  // 2.0 CEDRA
                max_supply: 100,
                minted: 0 
            }
        ];
        
        move_to(deployer, MintState {
            tiers,
            treasury: signer::address_of(deployer)
        });
    }
    
    #[view]
    public fun get_tier_info(tier: u64): (vector<u8>, u64, u64, u64) acquires MintState {
        let state = borrow_global<MintState>(@nft_addr);
        assert!(tier < vector::length(&state.tiers), E_INVALID_TIER);
        
        let config = vector::borrow(&state.tiers, tier);
        (config.name, config.price, config.max_supply, config.minted)
    }
    
    public entry fun mint_tier(
        minter: &signer,
        tier: u64
    ) acquires MintState {
        let state = borrow_global_mut<MintState>(@nft_addr);
        assert!(tier < vector::length(&state.tiers), E_INVALID_TIER);
        
        let config = vector::borrow_mut(&mut state.tiers, tier);
        assert!(config.minted < config.max_supply, E_TIER_SOLD_OUT);
        
        // Take payment
        coin::transfer<CedraCoin>(minter, state.treasury, config.price);
        
        // Build name with tier and number
        let name = string::utf8(config.name);
        string::append(&mut name, string::utf8(b" #"));
        // Would append number here
        
        // Mint
        let _constructor_ref = token::create(
            minter,
            string::utf8(COLLECTION_NAME),
            string::utf8(config.name),
            name,
            option::none(),
            string::utf8(b"https://example.com/tier.json")
        );
        
        config.minted = config.minted + 1;
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
Why use allowlist minting?

- A) To save gas
- B) Reward early supporters with discounts/priority
- C) Prevent bots
- D) B and C

<details>
<summary>Answer</summary>
**D) B and C** - Allowlists reward supporters AND help prevent bot attacks by limiting who can mint.
</details>

### Question 2
What's a bonding curve in NFT minting?

- A) Fixed price for all
- B) Price increases with each mint
- C) Random pricing
- D) Free minting

<details>
<summary>Answer</summary>
**B) Price increases with each mint** - Early minters get lower prices, creating FOMO and rewarding early adopters.
</details>

---

## 📝 Key Takeaways

1. **Allowlists** = early access for VIPs
2. **Per-wallet limits** = fair distribution
3. **Phased minting** = presale → public
4. **Dynamic pricing** = bonding curves
5. **Random mints** = mystery/gacha style

---

## 🚀 What's Next?

In the next lesson, we'll explore **NFT Transfers & Trading**!

[Continue to Lesson 3: Transfers & Trading →](./lesson-03-transfers.md)
