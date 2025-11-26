# Common Smart Contract Patterns

> **Reusable Patterns for Move on Cedra**

---

## 📚 Table of Contents

1. [Ownable](#-ownable-pattern)
2. [Pausable](#-pausable-pattern)
3. [Access Control (Roles)](#-access-control-roles)
4. [Upgradeable](#-upgradeable-pattern)
5. [Reentrancy Guard](#-reentrancy-guard)
6. [Pull Payment](#-pull-payment)
7. [Factory Pattern](#-factory-pattern)
8. [Singleton](#-singleton-pattern)
9. [Hot Potato (Flash Loan Safe)](#-hot-potato-pattern)
10. [Capability Pattern](#-capability-pattern)

---

## 👑 Ownable Pattern

Single owner with transfer capability.

```move
module patterns::ownable {
    use std::signer;
    
    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_ZERO_ADDRESS: u64 = 2;
    
    /// Ownership resource
    struct Ownership has key {
        owner: address
    }
    
    /// Initialize ownership
    fun init_module(deployer: &signer) {
        move_to(deployer, Ownership {
            owner: signer::address_of(deployer)
        });
    }
    
    /// Get current owner
    #[view]
    public fun owner(): address acquires Ownership {
        borrow_global<Ownership>(@patterns).owner
    }
    
    /// Check if caller is owner
    public fun only_owner(account: &signer) acquires Ownership {
        let caller = signer::address_of(account);
        let ownership = borrow_global<Ownership>(@patterns);
        assert!(caller == ownership.owner, E_NOT_OWNER);
    }
    
    /// Transfer ownership
    public entry fun transfer_ownership(
        account: &signer,
        new_owner: address
    ) acquires Ownership {
        only_owner(account);
        assert!(new_owner != @0x0, E_ZERO_ADDRESS);
        
        let ownership = borrow_global_mut<Ownership>(@patterns);
        ownership.owner = new_owner;
    }
    
    /// Renounce ownership (dangerous!)
    public entry fun renounce_ownership(account: &signer) acquires Ownership {
        only_owner(account);
        let ownership = borrow_global_mut<Ownership>(@patterns);
        ownership.owner = @0x0;
    }
}
```

### Usage
```move
public entry fun admin_function(account: &signer) acquires Ownership, Data {
    ownable::only_owner(account);
    // Admin-only logic here
}
```

---

## ⏸️ Pausable Pattern

Emergency stop mechanism.

```move
module patterns::pausable {
    use std::signer;
    
    /// Error codes
    const E_PAUSED: u64 = 1;
    const E_NOT_PAUSED: u64 = 2;
    const E_NOT_PAUSER: u64 = 3;
    
    /// Pause state
    struct PauseState has key {
        paused: bool,
        pauser: address
    }
    
    /// Initialize
    fun init_module(deployer: &signer) {
        move_to(deployer, PauseState {
            paused: false,
            pauser: signer::address_of(deployer)
        });
    }
    
    /// Check if paused
    #[view]
    public fun is_paused(): bool acquires PauseState {
        borrow_global<PauseState>(@patterns).paused
    }
    
    /// Require not paused (use in functions)
    public fun when_not_paused() acquires PauseState {
        assert!(!is_paused(), E_PAUSED);
    }
    
    /// Require paused (for unpause-only functions)
    public fun when_paused() acquires PauseState {
        assert!(is_paused(), E_NOT_PAUSED);
    }
    
    /// Pause the contract
    public entry fun pause(account: &signer) acquires PauseState {
        let state = borrow_global_mut<PauseState>(@patterns);
        assert!(signer::address_of(account) == state.pauser, E_NOT_PAUSER);
        assert!(!state.paused, E_PAUSED);
        state.paused = true;
    }
    
    /// Unpause the contract
    public entry fun unpause(account: &signer) acquires PauseState {
        let state = borrow_global_mut<PauseState>(@patterns);
        assert!(signer::address_of(account) == state.pauser, E_NOT_PAUSER);
        assert!(state.paused, E_NOT_PAUSED);
        state.paused = false;
    }
}
```

### Usage
```move
public entry fun transfer(from: &signer, to: address, amount: u64) {
    pausable::when_not_paused();
    // Transfer logic...
}
```

---

## 🔐 Access Control (Roles)

Multiple roles with granular permissions.

```move
module patterns::access_control {
    use std::signer;
    use std::vector;
    
    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_ROLE_EXISTS: u64 = 3;
    
    /// Role identifiers
    const ADMIN_ROLE: vector<u8> = b"ADMIN";
    const MINTER_ROLE: vector<u8> = b"MINTER";
    const PAUSER_ROLE: vector<u8> = b"PAUSER";
    
    /// Role membership
    struct RoleData has store {
        members: vector<address>
    }
    
    /// All roles
    struct Roles has key {
        admin: RoleData,
        minter: RoleData,
        pauser: RoleData
    }
    
    /// Initialize with deployer as admin
    fun init_module(deployer: &signer) {
        let admin_addr = signer::address_of(deployer);
        move_to(deployer, Roles {
            admin: RoleData { members: vector[admin_addr] },
            minter: RoleData { members: vector[] },
            pauser: RoleData { members: vector[] },
        });
    }
    
    /// Check if address has role
    #[view]
    public fun has_role(role: vector<u8>, account: address): bool acquires Roles {
        let roles = borrow_global<Roles>(@patterns);
        let role_data = if (role == ADMIN_ROLE) {
            &roles.admin
        } else if (role == MINTER_ROLE) {
            &roles.minter
        } else if (role == PAUSER_ROLE) {
            &roles.pauser
        } else {
            return false
        };
        vector::contains(&role_data.members, &account)
    }
    
    /// Require role
    public fun only_role(account: &signer, role: vector<u8>) acquires Roles {
        let addr = signer::address_of(account);
        assert!(has_role(role, addr), E_NOT_AUTHORIZED);
    }
    
    /// Grant role (admin only)
    public entry fun grant_role(
        admin: &signer,
        role: vector<u8>,
        account: address
    ) acquires Roles {
        only_role(admin, ADMIN_ROLE);
        
        let roles = borrow_global_mut<Roles>(@patterns);
        let role_data = if (role == ADMIN_ROLE) {
            &mut roles.admin
        } else if (role == MINTER_ROLE) {
            &mut roles.minter
        } else {
            &mut roles.pauser
        };
        
        if (!vector::contains(&role_data.members, &account)) {
            vector::push_back(&mut role_data.members, account);
        };
    }
    
    /// Revoke role (admin only)
    public entry fun revoke_role(
        admin: &signer,
        role: vector<u8>,
        account: address
    ) acquires Roles {
        only_role(admin, ADMIN_ROLE);
        
        let roles = borrow_global_mut<Roles>(@patterns);
        let role_data = if (role == ADMIN_ROLE) {
            &mut roles.admin
        } else if (role == MINTER_ROLE) {
            &mut roles.minter
        } else {
            &mut roles.pauser
        };
        
        let (found, idx) = vector::index_of(&role_data.members, &account);
        if (found) {
            vector::remove(&mut role_data.members, idx);
        };
    }
}
```

### Usage
```move
public entry fun mint(minter: &signer, to: address, amount: u64) {
    access_control::only_role(minter, b"MINTER");
    // Minting logic...
}
```

---

## 🔄 Upgradeable Pattern

Proxy-based upgradeability.

```move
module patterns::upgradeable {
    use std::signer;
    
    const E_NOT_ADMIN: u64 = 1;
    
    /// Upgrade capability
    struct UpgradeCapability has key, store {
        admin: address
    }
    
    /// Data that persists across upgrades
    struct PersistentData has key {
        version: u64,
        value: u64
    }
    
    /// Initialize (first deployment)
    fun init_module(deployer: &signer) {
        let addr = signer::address_of(deployer);
        move_to(deployer, UpgradeCapability { admin: addr });
        move_to(deployer, PersistentData { version: 1, value: 0 });
    }
    
    /// Called after module upgrade to migrate state
    public entry fun migrate(admin: &signer) acquires UpgradeCapability, PersistentData {
        let cap = borrow_global<UpgradeCapability>(@patterns);
        assert!(signer::address_of(admin) == cap.admin, E_NOT_ADMIN);
        
        let data = borrow_global_mut<PersistentData>(@patterns);
        data.version = data.version + 1;
        // Add migration logic here
    }
    
    /// Current version
    #[view]
    public fun version(): u64 acquires PersistentData {
        borrow_global<PersistentData>(@patterns).version
    }
}
```

---

## 🔒 Reentrancy Guard

**Note: Move's resource model makes reentrancy impossible in most cases. This pattern is rarely needed but shown for reference.**

```move
module patterns::reentrancy_guard {
    const E_REENTRANCY: u64 = 1;
    
    /// Lock state
    struct Lock has key {
        locked: bool
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, Lock { locked: false });
    }
    
    /// Acquire lock
    public fun enter() acquires Lock {
        let lock = borrow_global_mut<Lock>(@patterns);
        assert!(!lock.locked, E_REENTRANCY);
        lock.locked = true;
    }
    
    /// Release lock
    public fun exit() acquires Lock {
        let lock = borrow_global_mut<Lock>(@patterns);
        lock.locked = false;
    }
}
```

**Better approach: The Hot Potato pattern (see below) is more idiomatic for Move.**

---

## 💸 Pull Payment

Let recipients withdraw instead of pushing payments.

```move
module patterns::pull_payment {
    use std::signer;
    use cedra_std::smart_table::{Self, SmartTable};
    use cedra_framework::cedra_coin;
    use cedra_framework::coin::{Self, Coin};
    
    const E_NO_PAYMENT: u64 = 1;
    
    /// Pending payments
    struct Escrow has key {
        payments: SmartTable<address, Coin<CedraToken>>
    }
    
    /// Deposit payment for recipient
    public fun deposit_payment(
        from: &signer,
        to: address,
        amount: u64
    ) acquires Escrow {
        let coin = coin::withdraw<CedraToken>(from, amount);
        let escrow = borrow_global_mut<Escrow>(@patterns);
        
        if (smart_table::contains(&escrow.payments, to)) {
            let existing = smart_table::borrow_mut(&mut escrow.payments, to);
            coin::merge(existing, coin);
        } else {
            smart_table::add(&mut escrow.payments, to, coin);
        };
    }
    
    /// Recipient withdraws their payment
    public entry fun withdraw_payment(recipient: &signer) acquires Escrow {
        let addr = signer::address_of(recipient);
        let escrow = borrow_global_mut<Escrow>(@patterns);
        
        assert!(smart_table::contains(&escrow.payments, addr), E_NO_PAYMENT);
        let coin = smart_table::remove(&mut escrow.payments, addr);
        coin::deposit(addr, coin);
    }
    
    /// Check pending payment
    #[view]
    public fun pending_payment(addr: address): u64 acquires Escrow {
        let escrow = borrow_global<Escrow>(@patterns);
        if (smart_table::contains(&escrow.payments, addr)) {
            coin::value(smart_table::borrow(&escrow.payments, addr))
        } else {
            0
        }
    }
}
```

---

## 🏭 Factory Pattern

Create multiple instances of a resource.

```move
module patterns::factory {
    use std::signer;
    use cedra_framework::object::{Self, Object, ConstructorRef};
    use cedra_framework::event;
    
    /// Product created by factory
    struct Product has key {
        id: u64,
        name: vector<u8>,
        creator: address
    }
    
    /// Factory state
    struct Factory has key {
        next_id: u64,
        products: vector<address>
    }
    
    #[event]
    struct ProductCreated has drop, store {
        id: u64,
        address: address,
        creator: address
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, Factory {
            next_id: 1,
            products: vector[]
        });
    }
    
    /// Create new product as an object
    public entry fun create_product(
        creator: &signer,
        name: vector<u8>
    ) acquires Factory {
        let factory = borrow_global_mut<Factory>(@patterns);
        let id = factory.next_id;
        factory.next_id = id + 1;
        
        // Create object for the product
        let constructor_ref = object::create_object(signer::address_of(creator));
        let product_signer = object::generate_signer(&constructor_ref);
        let product_addr = signer::address_of(&product_signer);
        
        move_to(&product_signer, Product {
            id,
            name,
            creator: signer::address_of(creator)
        });
        
        vector::push_back(&mut factory.products, product_addr);
        
        event::emit(ProductCreated {
            id,
            address: product_addr,
            creator: signer::address_of(creator)
        });
    }
    
    /// Get all products
    #[view]
    public fun get_products(): vector<address> acquires Factory {
        borrow_global<Factory>(@patterns).products
    }
}
```

---

## 🎯 Singleton Pattern

Ensure only one instance exists.

```move
module patterns::singleton {
    use std::signer;
    
    const E_ALREADY_EXISTS: u64 = 1;
    const E_NOT_EXISTS: u64 = 2;
    
    /// Singleton resource
    struct Singleton has key {
        value: u64,
        initialized: bool
    }
    
    /// Initialize singleton (can only be called once)
    public entry fun initialize(admin: &signer, initial_value: u64) {
        let addr = signer::address_of(admin);
        assert!(!exists<Singleton>(addr), E_ALREADY_EXISTS);
        
        move_to(admin, Singleton {
            value: initial_value,
            initialized: true
        });
    }
    
    /// Get the singleton (fails if not initialized)
    public fun get(): u64 acquires Singleton {
        assert!(exists<Singleton>(@patterns), E_NOT_EXISTS);
        borrow_global<Singleton>(@patterns).value
    }
}
```

---

## 🥔 Hot Potato Pattern

Force callers to complete a sequence of operations (flash loan safe).

```move
module patterns::hot_potato {
    use std::signer;
    
    const E_AMOUNT_MISMATCH: u64 = 1;
    
    /// Hot potato - CANNOT be dropped, copied, or stored!
    struct Receipt {
        amount: u64,
        fee: u64
    }
    
    /// Pool of assets
    struct Pool has key {
        balance: u64
    }
    
    /// Borrow from pool - returns hot potato receipt
    public fun flash_borrow(amount: u64): (u64, Receipt) acquires Pool {
        let pool = borrow_global_mut<Pool>(@patterns);
        assert!(pool.balance >= amount, E_AMOUNT_MISMATCH);
        
        pool.balance = pool.balance - amount;
        
        // Caller MUST handle this Receipt - can't drop it
        let receipt = Receipt {
            amount,
            fee: amount / 100 // 1% fee
        };
        
        (amount, receipt)
    }
    
    /// Repay to pool - consumes the receipt
    public fun flash_repay(
        repay_amount: u64,
        receipt: Receipt
    ) acquires Pool {
        let Receipt { amount, fee } = receipt; // Consume receipt
        let required = amount + fee;
        assert!(repay_amount >= required, E_AMOUNT_MISMATCH);
        
        let pool = borrow_global_mut<Pool>(@patterns);
        pool.balance = pool.balance + repay_amount;
    }
    
    // If flash_repay is never called, the transaction FAILS
    // because Receipt cannot be dropped!
}
```

### Usage
```move
public entry fun arbitrage(trader: &signer) {
    // Borrow 1000
    let (amount, receipt) = hot_potato::flash_borrow(1000);
    
    // Do arbitrage...
    let profit = do_arbitrage(amount);
    
    // MUST repay (with fee) or transaction fails
    hot_potato::flash_repay(amount + profit, receipt);
}
```

---

## 🔑 Capability Pattern

Fine-grained permission tokens.

```move
module patterns::capability {
    use std::signer;
    
    const E_NOT_AUTHORIZED: u64 = 1;
    
    /// Mint capability - whoever holds this can mint
    struct MintCapability has store {}
    
    /// Burn capability
    struct BurnCapability has store {}
    
    /// Store capabilities
    struct Capabilities has key {
        mint_cap: MintCapability,
        burn_cap: BurnCapability
    }
    
    /// Initialize and get capabilities
    fun init_module(deployer: &signer) {
        move_to(deployer, Capabilities {
            mint_cap: MintCapability {},
            burn_cap: BurnCapability {}
        });
    }
    
    /// Mint with capability proof
    public fun mint_with_cap(_cap: &MintCapability, amount: u64): u64 {
        // Mint logic - only callable if you have the cap reference
        amount
    }
    
    /// Burn with capability proof
    public fun burn_with_cap(_cap: &BurnCapability, amount: u64) {
        // Burn logic
        let _ = amount;
    }
    
    /// Admin function that uses mint capability
    public entry fun admin_mint(admin: &signer, amount: u64) acquires Capabilities {
        assert!(signer::address_of(admin) == @patterns, E_NOT_AUTHORIZED);
        
        let caps = borrow_global<Capabilities>(@patterns);
        let _minted = mint_with_cap(&caps.mint_cap, amount);
    }
    
    /// Transfer capability to another module (advanced)
    public fun extract_mint_cap(admin: &signer): MintCapability acquires Capabilities {
        assert!(signer::address_of(admin) == @patterns, E_NOT_AUTHORIZED);
        let Capabilities { mint_cap, burn_cap } = move_from<Capabilities>(@patterns);
        
        // Store burn cap somewhere or destroy
        move_to(admin, Capabilities { 
            mint_cap: MintCapability {}, // Create new one
            burn_cap 
        });
        
        mint_cap // Return to caller
    }
}
```

---

## 📋 Pattern Selection Guide

| Need | Pattern |
|------|---------|
| Single admin control | Ownable |
| Emergency stop | Pausable |
| Multiple roles | Access Control |
| Contract upgrades | Upgradeable |
| Flash loan safety | Hot Potato |
| Lazy payments | Pull Payment |
| Create many instances | Factory |
| One-time initialization | Singleton |
| Fine-grained permissions | Capability |

---

## 🔗 Resources

- [Move Syntax Cheatsheet](./move-syntax.md)
- [Solidity → Move Translation](./solidity-move-translation.md)
- [Full Migration Guides](../README.md)
