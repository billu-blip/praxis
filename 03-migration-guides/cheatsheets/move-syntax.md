# Move Syntax Cheatsheet

> **Quick Reference for Move on Cedra**

---

## 📦 Module Structure

```move
module address::module_name {
    // Imports
    use std::signer;
    use std::string::String;
    
    // Constants
    const ERROR_CODE: u64 = 1;
    
    // Structs (Resources)
    struct MyResource has key, store {
        field: u64,
    }
    
    // Initialization
    fun init_module(account: &signer) { }
    
    // Functions
    public entry fun my_function(account: &signer) { }
}
```

---

## 🔢 Types

| Type | Description | Example |
|------|-------------|---------|
| `u8` | 8-bit unsigned | `let x: u8 = 255;` |
| `u16` | 16-bit unsigned | `let x: u16 = 1000;` |
| `u32` | 32-bit unsigned | `let x: u32 = 100000;` |
| `u64` | 64-bit unsigned | `let x: u64 = 1000000;` |
| `u128` | 128-bit unsigned | `let x: u128 = 10;` |
| `u256` | 256-bit unsigned | `let x: u256 = 10;` |
| `bool` | Boolean | `let x: bool = true;` |
| `address` | 32-byte address | `let x: address = @0x1;` |
| `vector<T>` | Dynamic array | `let x: vector<u64> = vector[];` |
| `String` | UTF-8 string | `let x: String = utf8(b"hi");` |

---

## 🎭 Abilities

| Ability | Meaning | Required For |
|---------|---------|--------------|
| `copy` | Can be duplicated | Passing by value |
| `drop` | Can be discarded | End of scope |
| `store` | Can be stored | Nested in resources |
| `key` | Top-level storage | `move_to`, `borrow_global` |

```move
struct Token has key, store { value: u64 }  // Storable resource
struct Config has copy, drop { max: u64 }   // Copyable value
```

---

## 🔧 Functions

### Entry Function (Transaction)
```move
public entry fun transfer(from: &signer, to: address, amount: u64) {
    // Can be called from transactions
}
```

### View Function (Read-only)
```move
#[view]
public fun get_balance(addr: address): u64 acquires Balance {
    borrow_global<Balance>(addr).value
}
```

### Private Function
```move
fun internal_helper(): u64 {
    42
}
```

---

## 💾 Global Storage

### Store Resource
```move
move_to(account, MyResource { field: 100 });
```

### Read Resource (Immutable)
```move
let resource = borrow_global<MyResource>(addr);
```

### Read Resource (Mutable)
```move
let resource = borrow_global_mut<MyResource>(addr);
resource.field = 200;
```

### Remove Resource
```move
let MyResource { field: _ } = move_from<MyResource>(addr);
```

### Check Existence
```move
if (exists<MyResource>(addr)) { ... }
```

---

## ⚠️ Error Handling

### Assert
```move
const E_NOT_OWNER: u64 = 1;

assert!(condition, E_NOT_OWNER);
```

### Abort
```move
if (!condition) {
    abort E_NOT_OWNER
};
```

---

## 📚 Common Imports

```move
use std::signer;                    // address_of()
use std::string::{Self, String};    // utf8(), String type
use std::vector;                    // push_back(), pop_back()
use std::option::{Self, Option};    // none(), some()
```

---

## 🧪 Testing

```move
#[test(account = @0x1)]
fun test_example(account: &signer) {
    // Test code
    assert!(1 == 1, 0);
}

#[test]
#[expected_failure(abort_code = E_NOT_OWNER)]
fun test_should_fail() {
    abort E_NOT_OWNER
}
```

---

## 🔗 CLI Commands

```bash
cedra move init --name NAME     # Create project
cedra move compile              # Compile
cedra move test                 # Run tests
cedra move publish              # Deploy
cedra move run --function-id ADDR::MOD::FN  # Execute
cedra move view --function-id ADDR::MOD::FN # Query
```

---

## 📝 Quick Examples

### Counter
```move
struct Counter has key { value: u64 }

public entry fun increment(account: &signer) acquires Counter {
    let counter = borrow_global_mut<Counter>(signer::address_of(account));
    counter.value = counter.value + 1;
}
```

### Token Transfer
```move
public entry fun transfer(from: &signer, to: address, amount: u64) {
    primary_fungible_store::transfer(from, get_metadata(), to, amount);
}
```
