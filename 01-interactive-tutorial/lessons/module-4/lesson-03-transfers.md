# Lesson 3: Token Transfers

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement standard token transfers
- Handle frozen accounts
- Create transfer hooks
- Build batch transfers

---

## 📖 How Transfers Work

Token transfers move value from one primary store to another:

```move
use cedra_framework::primary_fungible_store;

// Simple transfer between primary stores
primary_fungible_store::transfer(
    from_signer,  // &signer - the sender
    asset,        // Object<Metadata> - which token
    to,           // address - recipient
    amount        // u64 - how much
);
```

This is the most common way to transfer tokens. The recipient's store is auto-created if needed!

---

## 💸 Standard Transfer Implementation

```move
module token_addr::my_token {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"MTK";
    
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_ZERO_AMOUNT: u64 = 2;
    const E_SELF_TRANSFER: u64 = 3;

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
    
    /// Transfer tokens to another address
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let from_addr = signer::address_of(from);
        
        // Validation
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(from_addr != to, E_SELF_TRANSFER);
        
        let asset = get_metadata();
        
        // Check balance
        let balance = primary_fungible_store::balance(from_addr, asset);
        assert!(balance >= amount, E_INSUFFICIENT_BALANCE);
        
        // Execute transfer
        primary_fungible_store::transfer(from, asset, to, amount);
    }
    
    #[view]
    public fun balance(owner: address): u64 {
        let asset = get_metadata();
        primary_fungible_store::balance(owner, asset)
    }
}
```

---

## 🧊 Frozen Account Handling

Admins can freeze accounts to prevent transfers:

```move
module token_addr::freezable_token {
    use cedra_framework::fungible_asset::{Self, TransferRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"FRZ";
    
    const E_NOT_ADMIN: u64 = 1;
    const E_ACCOUNT_FROZEN: u64 = 2;

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        transfer_ref: TransferRef,
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Freeze an account (admin only)
    public entry fun freeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        let store = primary_fungible_store::ensure_primary_store_exists(account, asset);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, store, true);
    }
    
    /// Unfreeze an account (admin only)
    public entry fun unfreeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        assert!(signer::address_of(admin) == @token_addr, E_NOT_ADMIN);
        
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        
        let store = primary_fungible_store::primary_store(account, asset);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, store, false);
    }
    
    /// Check if account is frozen
    #[view]
    public fun is_frozen(account: address): bool {
        let asset = get_metadata();
        if (!primary_fungible_store::primary_store_exists(account, asset)) {
            return false
        };
        let store = primary_fungible_store::primary_store(account, asset);
        fungible_asset::is_frozen(store)
    }
    
    /// Transfer with frozen check
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let from_addr = signer::address_of(from);
        
        // Check frozen status
        assert!(!is_frozen(from_addr), E_ACCOUNT_FROZEN);
        assert!(!is_frozen(to), E_ACCOUNT_FROZEN);
        
        let asset = get_metadata();
        primary_fungible_store::transfer(from, asset, to, amount);
    }
}
```

---

## 📦 Batch Transfers

Send to multiple recipients at once:

```move
module token_addr::batch_token {
    use cedra_framework::fungible_asset::Metadata;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use cedra_framework::event;
    use std::signer;
    use std::vector;

    const ASSET_SYMBOL: vector<u8> = b"BATCH";
    
    const E_LENGTH_MISMATCH: u64 = 1;
    const E_EMPTY_BATCH: u64 = 2;
    const E_INSUFFICIENT_TOTAL: u64 = 3;
    
    #[event]
    struct BatchTransferEvent has drop, store {
        from: address,
        recipient_count: u64,
        total_amount: u64
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Send to multiple recipients in one transaction
    public entry fun batch_transfer(
        from: &signer,
        recipients: vector<address>,
        amounts: vector<u64>
    ) {
        let from_addr = signer::address_of(from);
        let len = vector::length(&recipients);
        
        // Validate
        assert!(len > 0, E_EMPTY_BATCH);
        assert!(len == vector::length(&amounts), E_LENGTH_MISMATCH);
        
        let asset = get_metadata();
        
        // Calculate total needed
        let total: u64 = 0;
        let i = 0;
        while (i < len) {
            total = total + *vector::borrow(&amounts, i);
            i = i + 1;
        };
        
        // Check total balance
        let balance = primary_fungible_store::balance(from_addr, asset);
        assert!(balance >= total, E_INSUFFICIENT_TOTAL);
        
        // Execute all transfers
        let i = 0;
        while (i < len) {
            let to = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            
            if (amount > 0) {
                primary_fungible_store::transfer(from, asset, to, amount);
            };
            
            i = i + 1;
        };
        
        // Emit summary event
        event::emit(BatchTransferEvent {
            from: from_addr,
            recipient_count: len,
            total_amount: total
        });
    }
    
    /// Airdrop same amount to all recipients
    public entry fun airdrop(
        from: &signer,
        recipients: vector<address>,
        amount_each: u64
    ) {
        let from_addr = signer::address_of(from);
        let len = vector::length(&recipients);
        
        assert!(len > 0, E_EMPTY_BATCH);
        
        let asset = get_metadata();
        let total = amount_each * len;
        
        let balance = primary_fungible_store::balance(from_addr, asset);
        assert!(balance >= total, E_INSUFFICIENT_TOTAL);
        
        let i = 0;
        while (i < len) {
            let to = *vector::borrow(&recipients, i);
            primary_fungible_store::transfer(from, asset, to, amount_each);
            i = i + 1;
        };
    }
}
```

---

## 🔄 Transfer with Fees

Implement transfer fees:

```move
module token_addr::fee_token {
    use cedra_framework::fungible_asset::Metadata;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;

    const ASSET_SYMBOL: vector<u8> = b"FEE";
    
    // 1% fee (100 basis points)
    const FEE_BPS: u64 = 100;
    const BPS_DENOMINATOR: u64 = 10000;
    
    const E_INSUFFICIENT_FOR_FEE: u64 = 1;
    
    // Treasury receives fees
    struct TokenConfig has key {
        treasury: address
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    /// Calculate fee for amount
    #[view]
    public fun calculate_fee(amount: u64): u64 {
        (amount * FEE_BPS) / BPS_DENOMINATOR
    }
    
    /// Transfer with automatic fee deduction
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires TokenConfig {
        let from_addr = signer::address_of(from);
        
        // Calculate fee
        let fee = calculate_fee(amount);
        let total_required = amount + fee;
        
        let asset = get_metadata();
        let balance = primary_fungible_store::balance(from_addr, asset);
        assert!(balance >= total_required, E_INSUFFICIENT_FOR_FEE);
        
        // Get treasury
        let config = borrow_global<TokenConfig>(@token_addr);
        
        // Transfer to recipient
        primary_fungible_store::transfer(from, asset, to, amount);
        
        // Transfer fee to treasury
        if (fee > 0) {
            primary_fungible_store::transfer(from, asset, config.treasury, fee);
        };
    }
    
    /// Fee-free transfer (for special cases)
    public entry fun transfer_no_fee(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let asset = get_metadata();
        primary_fungible_store::transfer(from, asset, to, amount);
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Multi-Sig Transfer

Create a token that requires multiple approvals:

```move
module token_addr::multisig_token {
    use std::signer;
    use std::vector;
    
    const ASSET_SYMBOL: vector<u8> = b"MULTI";
    const REQUIRED_APPROVALS: u64 = 2;
    
    struct PendingTransfer has store {
        from: address,
        to: address,
        amount: u64,
        approvers: vector<address>
    }
    
    struct TransferQueue has key {
        pending: vector<PendingTransfer>,
        signers: vector<address>
    }
    
    // TODO: Implement these functions
    
    /// Create a pending transfer request
    public entry fun request_transfer(
        requester: &signer,
        to: address,
        amount: u64
    ) {
        // Your code: add to pending queue
    }
    
    /// Approve a pending transfer
    public entry fun approve_transfer(
        approver: &signer,
        transfer_index: u64
    ) {
        // Your code: add approval, execute if threshold met
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module token_addr::multisig_token {
    use cedra_framework::fungible_asset::Metadata;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::signer;
    use std::vector;

    const ASSET_SYMBOL: vector<u8> = b"MULTI";
    const REQUIRED_APPROVALS: u64 = 2;
    
    const E_NOT_SIGNER: u64 = 1;
    const E_ALREADY_APPROVED: u64 = 2;
    const E_INVALID_INDEX: u64 = 3;
    
    struct PendingTransfer has store, drop {
        from: address,
        to: address,
        amount: u64,
        approvers: vector<address>
    }
    
    struct TransferQueue has key {
        pending: vector<PendingTransfer>,
        signers: vector<address>
    }
    
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }
    
    public entry fun request_transfer(
        requester: &signer,
        to: address,
        amount: u64
    ) acquires TransferQueue {
        let requester_addr = signer::address_of(requester);
        let queue = borrow_global_mut<TransferQueue>(@token_addr);
        
        // Must be authorized signer
        assert!(vector::contains(&queue.signers, &requester_addr), E_NOT_SIGNER);
        
        let transfer = PendingTransfer {
            from: @token_addr,  // Transfers from shared treasury
            to,
            amount,
            approvers: vector[requester_addr]  // Requester auto-approves
        };
        
        vector::push_back(&mut queue.pending, transfer);
    }
    
    public entry fun approve_transfer(
        approver: &signer,
        transfer_index: u64
    ) acquires TransferQueue {
        let approver_addr = signer::address_of(approver);
        let queue = borrow_global_mut<TransferQueue>(@token_addr);
        
        // Must be authorized signer
        assert!(vector::contains(&queue.signers, &approver_addr), E_NOT_SIGNER);
        
        // Valid index
        assert!(transfer_index < vector::length(&queue.pending), E_INVALID_INDEX);
        
        let transfer = vector::borrow_mut(&mut queue.pending, transfer_index);
        
        // Not already approved by this signer
        assert!(!vector::contains(&transfer.approvers, &approver_addr), E_ALREADY_APPROVED);
        
        // Add approval
        vector::push_back(&mut transfer.approvers, approver_addr);
        
        // Check if threshold met
        if (vector::length(&transfer.approvers) >= REQUIRED_APPROVALS) {
            // Execute transfer
            let asset = get_metadata();
            let to = transfer.to;
            let amount = transfer.amount;
            
            // Need treasury signer - in real impl, use object signer
            // primary_fungible_store::transfer(treasury_signer, asset, to, amount);
            
            // Remove from pending
            vector::remove(&mut queue.pending, transfer_index);
        };
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What happens if you transfer to an address without a store?

- A) Transaction fails
- B) Store is auto-created
- C) Tokens are lost
- D) Tokens go to a default address

<details>
<summary>Answer</summary>
**B) Store is auto-created** - With primary fungible stores, recipient stores are automatically created.
</details>

### Question 2
Which reference is needed to force a transfer from a frozen account?

- A) MintRef
- B) BurnRef
- C) TransferRef
- D) FreezeRef

<details>
<summary>Answer</summary>
**C) TransferRef** - The TransferRef can bypass frozen status with `transfer_with_ref`.
</details>

---

## 📝 Key Takeaways

1. **`primary_fungible_store::transfer`** = main transfer function
2. **Auto-create stores** = recipients don't need to register
3. **Frozen accounts** = can block with TransferRef
4. **Batch transfers** = more gas efficient
5. **Transfer fees** = calculate and send separately

---

## 🚀 What's Next?

In the next lesson, we'll implement **Burning** - destroying tokens.

[Continue to Lesson 4: Burning →](./lesson-04-burning.md)
