# Lesson 4: Token Burning

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement token burning functionality
- Create burn authorization patterns
- Build deflationary mechanisms
- Handle supply tracking after burns

---

## 📖 What is Token Burning?

Burning permanently destroys tokens, removing them from circulation:

```move
use cedra_framework::fungible_asset;

// Burn from a store
fungible_asset::burn(&burn_ref, store, amount);

// Burn from primary store
use cedra_framework::primary_fungible_store;
primary_fungible_store::burn(&burn_ref, owner, amount);
```

Burns reduce total supply and can never be reversed!

---

## 🔥 Basic Burn Implementation

```move
module token_addr::burnable_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"BURN";
    
    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ZERO_AMOUNT: u64 = 3;

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
    
    /// Burn tokens from your own account
    public entry fun burn(
        owner: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset {
        assert!(amount > 0, E_ZERO_AMOUNT);
        
        let owner_addr = signer::address_of(owner);
        let asset = get_metadata();
        
        // Check balance
        let balance = primary_fungible_store::balance(owner_addr, asset);
        assert!(balance >= amount, E_INSUFFICIENT_BALANCE);
        
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        primary_fungible_store::burn(&managed.burn_ref, owner_addr, amount);
    }
    
    /// Admin burn from any account (emergency)
    public entry fun admin_burn(
        admin: &signer,
        from: address,
        amount: u64
    ) acquires ManagedFungibleAsset {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        primary_fungible_store::burn(&managed.burn_ref, from, amount);
    }
}
```

---

## 💰 Supply Tracking

Track burned tokens for analytics:

```move
module token_addr::tracked_burn {
    use cedra_framework::fungible_asset::{Self, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::event;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"TRACK";

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        burn_ref: BurnRef,
    }
    
    /// Track burn statistics
    struct BurnStats has key {
        total_burned: u64,
        burn_count: u64
    }
    
    #[event]
    struct BurnEvent has drop, store {
        from: address,
        amount: u64,
        total_burned: u64
    }
    
    /// Initialize burn tracking
    fun init_module(deployer: &signer) {
        move_to(deployer, BurnStats {
            total_burned: 0,
            burn_count: 0
        });
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Burn with tracking
    public entry fun burn(
        owner: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset, BurnStats {
        let owner_addr = signer::address_of(owner);
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        // Execute burn
        primary_fungible_store::burn(&managed.burn_ref, owner_addr, amount);
        
        // Update stats
        let stats = borrow_global_mut<BurnStats>(@token_addr);
        stats.total_burned = stats.total_burned + amount;
        stats.burn_count = stats.burn_count + 1;
        
        // Emit event
        event::emit(BurnEvent {
            from: owner_addr,
            amount,
            total_burned: stats.total_burned
        });
    }
    
    #[view]
    public fun total_burned(): u64 acquires BurnStats {
        borrow_global<BurnStats>(@token_addr).total_burned
    }
    
    #[view]
    public fun burn_count(): u64 acquires BurnStats {
        borrow_global<BurnStats>(@token_addr).burn_count
    }
    
    #[view]
    public fun circulating_supply(): u64 acquires BurnStats {
        let asset = get_metadata();
        let total_minted = fungible_asset::supply(asset);
        // Note: In practice, supply already accounts for burns
        // This is for illustration
        let total = if (std::option::is_some(&total_minted)) {
            (std::option::extract(&mut total_minted) as u64)
        } else {
            0
        };
        total
    }
}
```

---

## 📉 Deflationary Token

Auto-burn on every transfer:

```move
module token_addr::deflationary_token {
    use cedra_framework::fungible_asset::{Self, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"DEFL";
    
    // 0.5% burn rate (50 basis points)
    const BURN_BPS: u64 = 50;
    const BPS_DENOMINATOR: u64 = 10000;
    
    const E_INSUFFICIENT: u64 = 1;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        burn_ref: BurnRef,
    }
    
    struct BurnConfig has key {
        total_auto_burned: u64,
        burn_rate_bps: u64
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Calculate how much will be burned
    #[view]
    public fun calculate_burn(amount: u64): u64 acquires BurnConfig {
        let config = borrow_global<BurnConfig>(@token_addr);
        (amount * config.burn_rate_bps) / BPS_DENOMINATOR
    }
    
    /// Deflationary transfer - burns a % on each transfer
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires ManagedFungibleAsset, BurnConfig {
        let from_addr = signer::address_of(from);
        let asset = get_metadata();
        
        // Calculate burn amount
        let burn_amount = calculate_burn(amount);
        let transfer_amount = amount - burn_amount;
        let total_required = amount;
        
        // Verify balance
        let balance = primary_fungible_store::balance(from_addr, asset);
        assert!(balance >= total_required, E_INSUFFICIENT);
        
        // Transfer net amount
        primary_fungible_store::transfer(from, asset, to, transfer_amount);
        
        // Burn from sender
        if (burn_amount > 0) {
            let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
            primary_fungible_store::burn(&managed.burn_ref, from_addr, burn_amount);
            
            // Track
            let config = borrow_global_mut<BurnConfig>(@token_addr);
            config.total_auto_burned = config.total_auto_burned + burn_amount;
        };
    }
    
    #[view]
    public fun total_auto_burned(): u64 acquires BurnConfig {
        borrow_global<BurnConfig>(@token_addr).total_auto_burned
    }
}
```

---

## 🎁 Buyback and Burn

A common DeFi pattern - collect fees and burn:

```move
module token_addr::buyback_burn {
    use cedra_framework::fungible_asset::{Self, MintRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::event;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"BBB";
    
    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_TREASURY: u64 = 2;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
    }
    
    struct Treasury has key {
        balance: u64,  // Tracks collected fees
        total_buyback_burned: u64
    }
    
    #[event]
    struct BuybackBurnEvent has drop, store {
        amount: u64,
        total_burned: u64
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Admin executes buyback and burn
    public entry fun execute_buyback_burn(
        admin: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset, Treasury {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let treasury = borrow_global_mut<Treasury>(@token_addr);
        assert!(treasury.balance >= amount, E_INSUFFICIENT_TREASURY);
        
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        // In real scenario: swap collected fees to tokens, then burn
        // Here we simulate by burning from treasury address
        let treasury_balance = primary_fungible_store::balance(@token_addr, asset);
        if (treasury_balance >= amount) {
            primary_fungible_store::burn(&managed.burn_ref, @token_addr, amount);
            
            treasury.balance = treasury.balance - amount;
            treasury.total_buyback_burned = treasury.total_buyback_burned + amount;
            
            event::emit(BuybackBurnEvent {
                amount,
                total_burned: treasury.total_buyback_burned
            });
        };
    }
    
    #[view]
    public fun treasury_balance(): u64 acquires Treasury {
        borrow_global<Treasury>(@token_addr).balance
    }
    
    #[view]
    public fun total_buyback_burned(): u64 acquires Treasury {
        borrow_global<Treasury>(@token_addr).total_buyback_burned
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Burn-to-Redeem System

Create a token where burning gives users rewards:

```move
module token_addr::burn_redeem {
    use std::signer;
    
    const ASSET_SYMBOL: vector<u8> = b"REDEEM";
    
    // 10 tokens = 1 reward point
    const TOKENS_PER_POINT: u64 = 10;
    
    struct UserRewards has key {
        points: u64,
        total_burned: u64
    }
    
    // TODO: Implement
    
    /// Burn tokens to earn reward points
    public entry fun burn_for_points(
        user: &signer,
        amount: u64
    ) {
        // Your code: burn tokens, award points
    }
    
    /// View user's reward points
    public fun get_points(user: address): u64 {
        // Your code
        0
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module token_addr::burn_redeem {
    use cedra_framework::fungible_asset::{Self, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::event;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"REDEEM";
    
    const TOKENS_PER_POINT: u64 = 10_00000000;  // 10 tokens with 8 decimals
    
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_MINIMUM_NOT_MET: u64 = 2;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        burn_ref: BurnRef,
    }
    
    struct UserRewards has key {
        points: u64,
        total_burned: u64
    }
    
    #[event]
    struct RewardEarnedEvent has drop, store {
        user: address,
        tokens_burned: u64,
        points_earned: u64,
        total_points: u64
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    public entry fun burn_for_points(
        user: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset, UserRewards {
        let user_addr = signer::address_of(user);
        
        // Must burn at least enough for 1 point
        assert!(amount >= TOKENS_PER_POINT, E_MINIMUM_NOT_MET);
        
        let asset = get_metadata();
        
        // Check balance
        let balance = primary_fungible_store::balance(user_addr, asset);
        assert!(balance >= amount, E_INSUFFICIENT_BALANCE);
        
        // Burn tokens
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        primary_fungible_store::burn(&managed.burn_ref, user_addr, amount);
        
        // Calculate points (round down)
        let points = amount / TOKENS_PER_POINT;
        
        // Initialize rewards if needed
        if (!exists<UserRewards>(user_addr)) {
            move_to(user, UserRewards {
                points: 0,
                total_burned: 0
            });
        };
        
        // Update rewards
        let rewards = borrow_global_mut<UserRewards>(user_addr);
        rewards.points = rewards.points + points;
        rewards.total_burned = rewards.total_burned + amount;
        
        event::emit(RewardEarnedEvent {
            user: user_addr,
            tokens_burned: amount,
            points_earned: points,
            total_points: rewards.points
        });
    }
    
    #[view]
    public fun get_points(user: address): u64 acquires UserRewards {
        if (!exists<UserRewards>(user)) {
            return 0
        };
        borrow_global<UserRewards>(user).points
    }
    
    #[view]
    public fun get_total_burned_by_user(user: address): u64 acquires UserRewards {
        if (!exists<UserRewards>(user)) {
            return 0
        };
        borrow_global<UserRewards>(user).total_burned
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
After burning tokens, what happens to the total supply?

- A) Stays the same
- B) Decreases permanently
- C) Goes to a burn address
- D) Becomes locked

<details>
<summary>Answer</summary>
**B) Decreases permanently** - Burns reduce the total supply tracked by the fungible asset module.
</details>

### Question 2
Which reference is required for burning tokens?

- A) MintRef
- B) TransferRef
- C) BurnRef
- D) Any ref

<details>
<summary>Answer</summary>
**C) BurnRef** - Only the BurnRef capability allows burning tokens.
</details>

### Question 3
In a deflationary token, when is burning typically triggered?

- A) At creation
- B) On every transfer
- C) Once per day
- D) Only by admin

<details>
<summary>Answer</summary>
**B) On every transfer** - Deflationary tokens burn a percentage on each transfer automatically.
</details>

---

## 📝 Key Takeaways

1. **Burning = permanent destruction** - tokens can never be recovered
2. **BurnRef required** - only holders can burn
3. **Track burns** - for transparency and analytics
4. **Deflationary pattern** - auto-burn on transfers
5. **Burn-to-earn** - gamify with rewards for burning

---

## 🎓 Module 4 Complete!

Congratulations! You've mastered token creation on Cedra:

| Lesson | Topic | Key Skill |
|--------|-------|-----------|
| 1 | Fungible Assets | FA standard understanding |
| 2 | Minting | Token creation & supply control |
| 3 | Transfers | Moving tokens safely |
| 4 | Burning | Supply reduction |

### Your Token Knowledge:
- ✅ Create fungible assets with metadata
- ✅ Mint with supply caps
- ✅ Transfer with fees/freezing
- ✅ Burn with tracking

---

## 🚀 What's Next?

In **Module 5**, we'll explore **NFT Collections** - unique digital assets!

[Continue to Module 5: NFT Collections →](../module-5/lesson-01-nft-basics.md)
