# Lesson 3: Global Storage Operations

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Master all 5 global storage operations
- Understand the difference between `borrow_global` and `borrow_global_mut`
- Learn about the `acquires` annotation
- Handle resources safely in real scenarios

---

## 📖 The Global Storage Model

In Cedra/Move, each account has its own **storage space** where resources can be stored. Think of it like each user having their own safe deposit box.

```
Account 0x1: [Profile, Wallet, Settings]
Account 0x2: [Profile, Inventory]
Account 0x3: [Wallet]
```

### The 5 Storage Operations

| Operation | Description | Returns |
|-----------|-------------|---------|
| `move_to(signer, T)` | Store resource in account | nothing |
| `move_from<T>(address)` | Remove and return resource | `T` |
| `borrow_global<T>(address)` | Get read-only reference | `&T` |
| `borrow_global_mut<T>(address)` | Get mutable reference | `&mut T` |
| `exists<T>(address)` | Check if resource exists | `bool` |

---

## 📥 Storing Resources: `move_to`

Use `move_to` to store a resource in an account:

```move
module my_addr::profiles {
    struct UserProfile has key {
        username: vector<u8>,
        level: u64
    }
    
    /// Create a new profile for the caller
    public entry fun create_profile(account: &signer, username: vector<u8>) {
        let profile = UserProfile {
            username,
            level: 1
        };
        
        // Store in the signer's account
        move_to(account, profile);
    }
}
```

**Important**: 
- First argument must be `&signer` (proves ownership)
- Each account can only hold **one** resource of each type
- Trying to store twice causes a runtime error

---

## 📤 Removing Resources: `move_from`

Use `move_from` to remove a resource from an account:

```move
/// Delete a profile and return it
public fun delete_profile(account: &signer): UserProfile acquires UserProfile {
    let addr = signer::address_of(account);
    
    // Remove from storage and return
    move_from<UserProfile>(addr)
}

/// Delete and discard (if has drop ability)
public entry fun destroy_profile(account: &signer) acquires UserProfile {
    let addr = signer::address_of(account);
    let UserProfile { username: _, level: _ } = move_from<UserProfile>(addr);
}
```

---

## 👁️ Reading Resources: `borrow_global`

Use `borrow_global` to read a resource without removing it:

```move
/// Get user's level (read-only)
#[view]
public fun get_level(user: address): u64 acquires UserProfile {
    let profile = borrow_global<UserProfile>(user);
    profile.level
}

/// Check if username matches
#[view]
public fun check_username(user: address, name: vector<u8>): bool acquires UserProfile {
    let profile = borrow_global<UserProfile>(user);
    profile.username == name
}
```

**Key Point**: `borrow_global` returns an **immutable reference** (`&T`). You cannot modify the resource.

---

## ✏️ Modifying Resources: `borrow_global_mut`

Use `borrow_global_mut` to modify a resource in place:

```move
/// Level up the user
public entry fun level_up(account: &signer) acquires UserProfile {
    let addr = signer::address_of(account);
    
    // Get mutable reference
    let profile = borrow_global_mut<UserProfile>(addr);
    
    // Modify in place
    profile.level = profile.level + 1;
}

/// Update username
public entry fun set_username(
    account: &signer, 
    new_name: vector<u8>
) acquires UserProfile {
    let addr = signer::address_of(account);
    let profile = borrow_global_mut<UserProfile>(addr);
    profile.username = new_name;
}
```

---

## ❓ Checking Existence: `exists`

Always check if a resource exists before accessing it:

```move
/// Safe level lookup with default
#[view]
public fun get_level_safe(user: address): u64 acquires UserProfile {
    if (exists<UserProfile>(user)) {
        borrow_global<UserProfile>(user).level
    } else {
        0  // Default value
    }
}

/// Guard against creating duplicate profiles
public entry fun create_profile_safe(
    account: &signer, 
    username: vector<u8>
) {
    let addr = signer::address_of(account);
    
    // Check first!
    assert!(!exists<UserProfile>(addr), 1); // Error code 1 = already exists
    
    let profile = UserProfile { username, level: 1 };
    move_to(account, profile);
}
```

---

## 🏷️ The `acquires` Annotation

When a function accesses global storage for a type, you must declare it with `acquires`:

```move
/// ✅ Correct: declares acquires
public fun get_level(addr: address): u64 acquires UserProfile {
    borrow_global<UserProfile>(addr).level
}

/// ❌ Wrong: missing acquires (compile error!)
public fun get_level_broken(addr: address): u64 {
    borrow_global<UserProfile>(addr).level
}
```

### Multiple Acquires

If you access multiple resource types:

```move
struct Profile has key { level: u64 }
struct Wallet has key { balance: u64 }

/// Declare all acquired types
public fun get_stats(addr: address): (u64, u64) acquires Profile, Wallet {
    let level = borrow_global<Profile>(addr).level;
    let balance = borrow_global<Wallet>(addr).balance;
    (level, balance)
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Bank Module

Complete this bank module with proper storage operations:

```move
module my_addr::bank {
    use std::signer;
    
    struct BankAccount has key {
        balance: u64
    }
    
    const E_ALREADY_HAS_ACCOUNT: u64 = 1;
    const E_NO_ACCOUNT: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    
    /// Create a new bank account with initial deposit
    public entry fun open_account(account: &signer, initial_deposit: u64) {
        // TODO: Check if account already exists
        // TODO: Create and store BankAccount
    }
    
    /// Deposit funds
    public entry fun deposit(account: &signer, amount: u64) {
        // TODO: Add to balance
    }
    
    /// Withdraw funds
    public entry fun withdraw(account: &signer, amount: u64) {
        // TODO: Check sufficient funds and subtract
    }
    
    /// Check balance
    #[view]
    public fun balance(addr: address): u64 {
        // TODO: Return balance or 0
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::bank {
    use std::signer;
    
    struct BankAccount has key {
        balance: u64
    }
    
    const E_ALREADY_HAS_ACCOUNT: u64 = 1;
    const E_NO_ACCOUNT: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    
    public entry fun open_account(account: &signer, initial_deposit: u64) {
        let addr = signer::address_of(account);
        assert!(!exists<BankAccount>(addr), E_ALREADY_HAS_ACCOUNT);
        
        let bank_account = BankAccount { balance: initial_deposit };
        move_to(account, bank_account);
    }
    
    public entry fun deposit(account: &signer, amount: u64) acquires BankAccount {
        let addr = signer::address_of(account);
        assert!(exists<BankAccount>(addr), E_NO_ACCOUNT);
        
        let bank_account = borrow_global_mut<BankAccount>(addr);
        bank_account.balance = bank_account.balance + amount;
    }
    
    public entry fun withdraw(account: &signer, amount: u64) acquires BankAccount {
        let addr = signer::address_of(account);
        assert!(exists<BankAccount>(addr), E_NO_ACCOUNT);
        
        let bank_account = borrow_global_mut<BankAccount>(addr);
        assert!(bank_account.balance >= amount, E_INSUFFICIENT_FUNDS);
        
        bank_account.balance = bank_account.balance - amount;
    }
    
    #[view]
    public fun balance(addr: address): u64 acquires BankAccount {
        if (exists<BankAccount>(addr)) {
            borrow_global<BankAccount>(addr).balance
        } else {
            0
        }
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What does `borrow_global_mut` return?

- A) The resource itself (moved out)
- B) A copy of the resource
- C) A mutable reference (`&mut T`)
- D) An immutable reference (`&T`)

<details>
<summary>Answer</summary>
**C) A mutable reference (`&mut T`)** - You can modify the resource in place.
</details>

### Question 2
What happens if you call `move_to` for a resource that already exists?

- A) It overwrites the existing resource
- B) Compile error
- C) Runtime error (abort)
- D) It creates a second copy

<details>
<summary>Answer</summary>
**C) Runtime error (abort)** - Each account can only hold one resource of each type.
</details>

### Question 3
When must you use the `acquires` annotation?

- A) When creating a new resource
- B) When accessing global storage for a type
- C) When using `signer`
- D) Always

<details>
<summary>Answer</summary>
**B) When accessing global storage for a type** - Any function that uses `borrow_global`, `borrow_global_mut`, or `move_from` must declare `acquires`.
</details>

---

## 📝 Key Takeaways

1. **5 operations**: `move_to`, `move_from`, `borrow_global`, `borrow_global_mut`, `exists`
2. **One resource per type per account** - can't store duplicates
3. **Always check `exists`** before accessing resources
4. **Use `acquires`** annotation when accessing storage
5. **`borrow_global`** = read, **`borrow_global_mut`** = write

---

## 🚀 What's Next?

In the next lesson, we'll learn about **Structs in Depth** - including nested structs, generics, and advanced patterns.

[Continue to Lesson 4: Structs in Depth →](./lesson-04-structs-in-depth.md)
