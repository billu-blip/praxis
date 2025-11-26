# Lesson 4: Functions and Entry Points

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand different function types in Move
- Work with parameters and return values
- Learn about entry functions for transactions
- Use view functions for gas-free queries
- Master error handling with assert

---

## 📖 Function Basics

### Function Declaration

```move
fun function_name(param1: Type1, param2: Type2): ReturnType {
    // function body
    return_value
}
```

### Simple Examples

```move
// No parameters, no return
fun do_nothing() {
    // Empty function
}

// With parameters
fun add(a: u64, b: u64): u64 {
    a + b  // Last expression is the return value
}

// Multiple returns (using tuple)
fun swap(a: u64, b: u64): (u64, u64) {
    (b, a)
}

// Using the results
let (x, y) = swap(10, 20);  // x = 20, y = 10
```

---

## 🌐 Function Visibility

Move has three visibility levels:

### Private (Default)
```move
fun internal_helper(): u64 {
    // Only callable within this module
    42
}
```

### Public
```move
public fun get_value(): u64 {
    // Callable from any module
    100
}
```

### Public Friend
```move
// First declare friend modules
friend other_module::name;

public(friend) fun friend_only(): u64 {
    // Only callable by friend modules
    200
}
```

---

## 🚀 Entry Functions

Entry functions are the **gateway** to your smart contract. They can be called directly from transactions.

```move
public entry fun transfer_tokens(
    sender: &signer,      // Transaction signer
    recipient: address,    // Where to send
    amount: u64           // How much
) {
    // Transfer logic here
}
```

### Key Rules for Entry Functions:
1. Must be declared with `entry` keyword
2. First parameter is usually `&signer` (the transaction sender)
3. Can only return types with `drop` ability (or nothing)
4. Called directly via CLI or SDK

### Calling Entry Functions

**Via CLI:**
```bash
cedra move run \
    --function-id default::mymodule::transfer_tokens \
    --args address:0x123... u64:1000
```

**Via TypeScript SDK:**
```typescript
const txn = await cedra.transaction.build.simple({
    function: `${MODULE}::transfer_tokens`,
    arguments: [recipientAddress, 1000],
});
await cedra.signAndSubmitTransaction({ signer, transaction: txn });
```

---

## 👁️ View Functions

View functions are **read-only** and **gas-free**. Perfect for queries!

```move
#[view]
public fun get_balance(addr: address): u64 acquires Balance {
    let balance = borrow_global<Balance>(addr);
    balance.amount
}

#[view]
public fun get_total_supply(): u64 {
    TOTAL_SUPPLY
}
```

### Calling View Functions

**Via CLI:**
```bash
cedra move view \
    --function-id default::mymodule::get_balance \
    --args address:0x123...
```

**Via TypeScript SDK:**
```typescript
const balance = await cedra.view({
    function: `${MODULE}::get_balance`,
    arguments: [userAddress],
});
```

---

## ⚡ The Signer Type

`&signer` is a special type representing the transaction sender. It proves authorization.

```move
use std::signer;

public entry fun protected_action(account: &signer) {
    // Get the address from the signer
    let addr = signer::address_of(account);
    
    // Now we know the caller is addr
    // Any resources moved from account need this signer
}
```

### Why Signer Matters

```move
// ❌ BAD: Anyone can call this for any address
public entry fun bad_withdraw(from: address, amount: u64) {
    // Dangerous! No proof that caller owns 'from'
}

// ✅ GOOD: Only the owner can call this
public entry fun good_withdraw(account: &signer, amount: u64) {
    let from = signer::address_of(account);
    // Safe! We know the caller owns this account
}
```

---

## ❌ Error Handling

Move uses `assert!` for error checking:

```move
// Error codes as constants
const E_NOT_OWNER: u64 = 1;
const E_INSUFFICIENT_BALANCE: u64 = 2;
const E_ALREADY_EXISTS: u64 = 3;

public entry fun withdraw(account: &signer, amount: u64) acquires Balance {
    let addr = signer::address_of(account);
    
    // Check balance exists
    assert!(exists<Balance>(addr), E_NOT_OWNER);
    
    let balance = borrow_global_mut<Balance>(addr);
    
    // Check sufficient funds
    assert!(balance.amount >= amount, E_INSUFFICIENT_BALANCE);
    
    balance.amount = balance.amount - amount;
}
```

### The `abort` Keyword

You can also abort with a message:

```move
if (amount > balance.amount) {
    abort E_INSUFFICIENT_BALANCE
};
```

---

## 🔄 Acquires Annotation

When a function accesses global storage, it must declare what it accesses:

```move
struct Counter has key {
    value: u64
}

// Must declare acquires Counter
public fun increment(addr: address) acquires Counter {
    let counter = borrow_global_mut<Counter>(addr);
    counter.value = counter.value + 1;
}

// Reading also requires acquires
#[view]
public fun get_count(addr: address): u64 acquires Counter {
    borrow_global<Counter>(addr).value
}
```

---

## 🧪 Complete Example: Counter Module

```move
module counter::simple_counter {
    use std::signer;
    
    /// The counter resource
    struct Counter has key {
        value: u64
    }
    
    /// Error codes
    const E_COUNTER_NOT_EXISTS: u64 = 1;
    const E_COUNTER_ALREADY_EXISTS: u64 = 2;
    
    /// Initialize a counter with value 0
    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<Counter>(addr), E_COUNTER_ALREADY_EXISTS);
        
        move_to(account, Counter { value: 0 });
    }
    
    /// Increment by 1
    public entry fun increment(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = counter.value + 1;
    }
    
    /// Increment by a custom amount
    public entry fun increment_by(
        account: &signer, 
        amount: u64
    ) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = counter.value + amount;
    }
    
    /// Get current value (gas-free)
    #[view]
    public fun get_count(addr: address): u64 acquires Counter {
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        borrow_global<Counter>(addr).value
    }
    
    /// Check if counter exists
    #[view]
    public fun has_counter(addr: address): bool {
        exists<Counter>(addr)
    }
    
    /// Reset to zero
    public entry fun reset(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = 0;
    }
}
```

---

## 🧪 Challenge Exercise

Create a module with a shared pool that anyone can deposit to, but only the owner can withdraw:

```move
module pool::shared_pool {
    // TODO: Implement
    // 1. Pool resource with owner address and balance
    // 2. create_pool - Owner creates the pool
    // 3. deposit - Anyone can deposit
    // 4. withdraw - Only owner can withdraw
    // 5. get_balance - View function
}
```

<details>
<summary>✅ Solution</summary>

```move
module pool::shared_pool {
    use std::signer;
    
    struct Pool has key {
        owner: address,
        balance: u64
    }
    
    const E_NOT_OWNER: u64 = 1;
    const E_POOL_NOT_EXISTS: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    
    public entry fun create_pool(account: &signer) {
        let owner = signer::address_of(account);
        move_to(account, Pool { owner, balance: 0 });
    }
    
    public entry fun deposit(
        _depositor: &signer, 
        pool_owner: address,
        amount: u64
    ) acquires Pool {
        assert!(exists<Pool>(pool_owner), E_POOL_NOT_EXISTS);
        let pool = borrow_global_mut<Pool>(pool_owner);
        pool.balance = pool.balance + amount;
    }
    
    public entry fun withdraw(
        account: &signer, 
        amount: u64
    ) acquires Pool {
        let addr = signer::address_of(account);
        assert!(exists<Pool>(addr), E_POOL_NOT_EXISTS);
        
        let pool = borrow_global_mut<Pool>(addr);
        assert!(addr == pool.owner, E_NOT_OWNER);
        assert!(pool.balance >= amount, E_INSUFFICIENT_BALANCE);
        
        pool.balance = pool.balance - amount;
    }
    
    #[view]
    public fun get_balance(pool_owner: address): u64 acquires Pool {
        assert!(exists<Pool>(pool_owner), E_POOL_NOT_EXISTS);
        borrow_global<Pool>(pool_owner).balance
    }
}
```
</details>

---

## ✅ Lesson Complete!

You've mastered Move functions! 🎉

### Key Takeaways:
- `entry` functions are transaction entry points
- `#[view]` functions are gas-free read operations
- `&signer` proves transaction authorization
- `assert!` and `abort` handle errors
- `acquires` declares storage access

### What's Next?
In **Module 2**, we'll dive deep into **Resources and Abilities** - the heart of Move's safety guarantees!

---

## 📚 Additional Resources

- [Move Functions Reference](https://move-book.com/reference/functions.html)
- [Cedra CLI Usage](https://docs.cedra.network/cli/usage)
