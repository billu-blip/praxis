# Chapter 4: Your First Smart Contract

> **Build, Test, and Deploy a Complete Counter DApp**

---

## 🎯 What You'll Learn

- Create a complete Move module from scratch
- Use global storage with resources
- Write entry functions for transactions
- Write view functions for queries
- Test your contract locally
- Deploy to Cedra testnet

---

## 🏗️ Project Setup

Let's create a new Move project:

```powershell
# Create project directory
mkdir counter_project
cd counter_project

# Initialize Cedra Move project
cedra move init --name counter_project
```

This creates:
```
counter_project/
├── Move.toml
├── scripts/
├── sources/
└── tests/
```

### Configure Move.toml

Edit `Move.toml`:

```toml
[package]
name = "counter_project"
version = "1.0.0"
authors = ["Your Name"]

[addresses]
counter_addr = "_"

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-network.git", subdir = "cedra-framework", rev = "mainnet" }
```

---

## 📝 The Counter Contract

Create `sources/simple_counter.move`:

```move
/// A simple counter module demonstrating Move basics
module counter_addr::simple_counter {
    use std::signer;
    use cedra_framework::event;

    //==============================
    // ERROR CODES
    //==============================
    
    /// Error when trying to access a counter that doesn't exist
    const E_COUNTER_NOT_FOUND: u64 = 1;
    
    /// Error when counter already exists for this account
    const E_COUNTER_EXISTS: u64 = 2;
    
    /// Error when trying to decrement below zero
    const E_COUNTER_UNDERFLOW: u64 = 3;

    //==============================
    // RESOURCES
    //==============================
    
    /// The Counter resource stored in user accounts
    struct Counter has key {
        value: u64
    }

    //==============================
    // EVENTS
    //==============================
    
    #[event]
    struct CounterCreated has drop, store {
        owner: address,
        initial_value: u64
    }
    
    #[event]
    struct CounterUpdated has drop, store {
        owner: address,
        old_value: u64,
        new_value: u64
    }

    //==============================
    // ENTRY FUNCTIONS
    //==============================
    
    /// Initialize a new counter for the calling account
    public entry fun initialize(account: &signer) {
        let owner = signer::address_of(account);
        
        // Check counter doesn't already exist
        assert!(!exists<Counter>(owner), E_COUNTER_EXISTS);
        
        // Create and store the counter
        move_to(account, Counter { value: 0 });
        
        // Emit creation event
        event::emit(CounterCreated {
            owner,
            initial_value: 0
        });
    }
    
    /// Initialize a counter with a specific starting value
    public entry fun initialize_with_value(account: &signer, initial_value: u64) {
        let owner = signer::address_of(account);
        
        assert!(!exists<Counter>(owner), E_COUNTER_EXISTS);
        
        move_to(account, Counter { value: initial_value });
        
        event::emit(CounterCreated {
            owner,
            initial_value
        });
    }
    
    /// Increment the counter by 1
    public entry fun increment(account: &signer) acquires Counter {
        let owner = signer::address_of(account);
        
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        
        let counter = borrow_global_mut<Counter>(owner);
        let old_value = counter.value;
        counter.value = counter.value + 1;
        
        event::emit(CounterUpdated {
            owner,
            old_value,
            new_value: counter.value
        });
    }
    
    /// Increment the counter by a specific amount
    public entry fun increment_by(account: &signer, amount: u64) acquires Counter {
        let owner = signer::address_of(account);
        
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        
        let counter = borrow_global_mut<Counter>(owner);
        let old_value = counter.value;
        counter.value = counter.value + amount;
        
        event::emit(CounterUpdated {
            owner,
            old_value,
            new_value: counter.value
        });
    }
    
    /// Decrement the counter by 1
    public entry fun decrement(account: &signer) acquires Counter {
        let owner = signer::address_of(account);
        
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        
        let counter = borrow_global_mut<Counter>(owner);
        let old_value = counter.value;
        
        // Check for underflow
        assert!(counter.value > 0, E_COUNTER_UNDERFLOW);
        
        counter.value = counter.value - 1;
        
        event::emit(CounterUpdated {
            owner,
            old_value,
            new_value: counter.value
        });
    }
    
    /// Reset the counter to zero
    public entry fun reset(account: &signer) acquires Counter {
        let owner = signer::address_of(account);
        
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        
        let counter = borrow_global_mut<Counter>(owner);
        let old_value = counter.value;
        counter.value = 0;
        
        event::emit(CounterUpdated {
            owner,
            old_value,
            new_value: 0
        });
    }
    
    /// Delete the counter resource
    public entry fun destroy(account: &signer) acquires Counter {
        let owner = signer::address_of(account);
        
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        
        // Move resource out of storage and destructure
        let Counter { value: _ } = move_from<Counter>(owner);
    }

    //==============================
    // VIEW FUNCTIONS
    //==============================
    
    #[view]
    /// Get the current counter value for an address
    public fun get_count(owner: address): u64 acquires Counter {
        assert!(exists<Counter>(owner), E_COUNTER_NOT_FOUND);
        borrow_global<Counter>(owner).value
    }
    
    #[view]
    /// Check if an address has a counter
    public fun has_counter(owner: address): bool {
        exists<Counter>(owner)
    }
}
```

---

## 🔍 Understanding the Code

### 1. Module Declaration

```move
module counter_addr::simple_counter {
```
- `counter_addr` - Named address (set during deployment)
- `simple_counter` - Module name

### 2. Error Codes

```move
const E_COUNTER_NOT_FOUND: u64 = 1;
```
- Convention: prefix with `E_`
- Used with `assert!` for error handling

### 3. Resource Definition

```move
struct Counter has key {
    value: u64
}
```
- `has key` - Can be stored in global storage
- Stored at an address (the owner's account)

### 4. Entry Functions

```move
public entry fun increment(account: &signer) acquires Counter {
```
- `public entry` - Callable from transactions
- `&signer` - Represents the transaction sender
- `acquires Counter` - Declares we'll access Counter storage

### 5. View Functions

```move
#[view]
public fun get_count(owner: address): u64 acquires Counter {
```
- `#[view]` - Read-only, no gas cost
- Returns data without modifying state

### 6. Storage Operations

```move
// Store a resource
move_to(account, Counter { value: 0 });

// Read a resource (immutable)
let counter = borrow_global<Counter>(owner);

// Modify a resource (mutable)
let counter = borrow_global_mut<Counter>(owner);
counter.value = counter.value + 1;

// Check if resource exists
exists<Counter>(owner)

// Remove a resource
let Counter { value } = move_from<Counter>(owner);
```

---

## 🧪 Writing Tests

Create `tests/simple_counter_tests.move`:

```move
#[test_only]
module counter_addr::simple_counter_tests {
    use counter_addr::simple_counter;
    use std::signer;

    // Test helper to create a test account
    #[test(account = @0x123)]
    fun test_initialize(account: &signer) {
        // Initialize counter
        simple_counter::initialize(account);
        
        // Verify counter exists
        let addr = signer::address_of(account);
        assert!(simple_counter::has_counter(addr), 0);
        
        // Verify initial value is 0
        assert!(simple_counter::get_count(addr) == 0, 1);
    }
    
    #[test(account = @0x123)]
    fun test_initialize_with_value(account: &signer) {
        simple_counter::initialize_with_value(account, 100);
        
        let addr = signer::address_of(account);
        assert!(simple_counter::get_count(addr) == 100, 0);
    }
    
    #[test(account = @0x123)]
    fun test_increment(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::increment(account);
        
        let addr = signer::address_of(account);
        assert!(simple_counter::get_count(addr) == 1, 0);
    }
    
    #[test(account = @0x123)]
    fun test_increment_by(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::increment_by(account, 10);
        
        let addr = signer::address_of(account);
        assert!(simple_counter::get_count(addr) == 10, 0);
    }
    
    #[test(account = @0x123)]
    fun test_decrement(account: &signer) {
        simple_counter::initialize_with_value(account, 5);
        simple_counter::decrement(account);
        
        let addr = signer::address_of(account);
        assert!(simple_counter::get_count(addr) == 4, 0);
    }
    
    #[test(account = @0x123)]
    fun test_reset(account: &signer) {
        simple_counter::initialize_with_value(account, 100);
        simple_counter::reset(account);
        
        let addr = signer::address_of(account);
        assert!(simple_counter::get_count(addr) == 0, 0);
    }
    
    #[test(account = @0x123)]
    fun test_destroy(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::destroy(account);
        
        let addr = signer::address_of(account);
        assert!(!simple_counter::has_counter(addr), 0);
    }
    
    // Test error cases
    #[test(account = @0x123)]
    #[expected_failure(abort_code = 1)] // E_COUNTER_NOT_FOUND
    fun test_increment_no_counter(account: &signer) {
        // Should fail - no counter initialized
        simple_counter::increment(account);
    }
    
    #[test(account = @0x123)]
    #[expected_failure(abort_code = 2)] // E_COUNTER_EXISTS
    fun test_double_initialize(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::initialize(account);  // Should fail
    }
    
    #[test(account = @0x123)]
    #[expected_failure(abort_code = 3)] // E_COUNTER_UNDERFLOW
    fun test_decrement_underflow(account: &signer) {
        simple_counter::initialize(account);  // value = 0
        simple_counter::decrement(account);   // Should fail
    }
}
```

### Run Tests

```powershell
cedra move test --named-addresses counter_addr=0x123
```

Expected output:
```
Running Move unit tests
[ PASS    ] 0x123::simple_counter_tests::test_decrement
[ PASS    ] 0x123::simple_counter_tests::test_decrement_underflow
[ PASS    ] 0x123::simple_counter_tests::test_destroy
[ PASS    ] 0x123::simple_counter_tests::test_double_initialize
[ PASS    ] 0x123::simple_counter_tests::test_increment
[ PASS    ] 0x123::simple_counter_tests::test_increment_by
[ PASS    ] 0x123::simple_counter_tests::test_increment_no_counter
[ PASS    ] 0x123::simple_counter_tests::test_initialize
[ PASS    ] 0x123::simple_counter_tests::test_initialize_with_value
[ PASS    ] 0x123::simple_counter_tests::test_reset
Test result: OK. Total tests: 10; passed: 10; failed: 0
```

---

## 🚀 Deploying to Testnet

### Step 1: Compile the Contract

```powershell
cedra move compile --named-addresses counter_addr=default
```

### Step 2: Get Testnet Tokens

```powershell
# Fund your account
cedra account fund-with-faucet --amount 100000000
```

### Step 3: Deploy

```powershell
cedra move publish --named-addresses counter_addr=default --assume-yes
```

Expected output:
```
Compiling, may take a little while to download git dependencies...
INCLUDING DEPENDENCY CedraFramework
INCLUDING DEPENDENCY CedraStdlib
INCLUDING DEPENDENCY MoveStdlib
BUILDING counter_project
package size 1234 bytes
Transaction submitted: https://cedrascan.com/txn/0x...
{
  "Result": {
    "transaction_hash": "0x...",
    "gas_used": 1234,
    "success": true
  }
}
```

---

## 🎮 Interacting with Your Contract

### Initialize Counter

```powershell
cedra move run \
  --function-id 'default::simple_counter::initialize' \
  --assume-yes
```

### Increment

```powershell
cedra move run \
  --function-id 'default::simple_counter::increment' \
  --assume-yes
```

### Check Value

```powershell
cedra move view \
  --function-id 'default::simple_counter::get_count' \
  --args 'address:YOUR_ADDRESS_HERE'
```

### Increment by Amount

```powershell
cedra move run \
  --function-id 'default::simple_counter::increment_by' \
  --args 'u64:10' \
  --assume-yes
```

---

## 📊 View on Block Explorer

After deployment, you can:

1. View your contract at `https://cedrascan.com/account/YOUR_ADDRESS`
2. See all transactions
3. Explore the module code
4. Call view functions directly

---

## 🎯 Exercises

### Exercise 1: Add Set Value Function

Add a function to set the counter to any value:

```move
public entry fun set_value(account: &signer, new_value: u64) acquires Counter {
    // Your implementation
}
```

### Exercise 2: Add Max Value Check

Modify `increment` to have a maximum value (e.g., 1000):

```move
const MAX_VALUE: u64 = 1000;
const E_MAX_REACHED: u64 = 4;
```

### Exercise 3: Add Timestamps

Track when the counter was created and last modified:

```move
struct Counter has key {
    value: u64,
    created_at: u64,
    updated_at: u64
}
```

---

## 📝 Key Takeaways

1. **Resources** persist in user accounts
2. **Entry functions** handle transactions
3. **View functions** provide free reads
4. **Events** enable off-chain tracking
5. **Tests** verify correctness before deployment

---

## ➡️ Next Steps

In Chapter 5, we'll build a fungible token using Cedra's FA standard!

[Continue to Chapter 5: Creating Fungible Tokens →](./05-fungible-tokens.md)
