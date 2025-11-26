# Lesson 2: Abilities - Controlling Resource Behavior

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand all 4 abilities in Move
- Know when to use each ability
- Create structs with different ability combinations
- Avoid common ability-related mistakes

---

## 📖 What are Abilities?

**Abilities** are Move's way of controlling what operations are allowed on a struct. Think of them as **permissions** for your data types.

```move
struct MyStruct has copy, drop, store, key {
    value: u64
}
```

There are exactly **4 abilities**:

| Ability | What It Allows |
|---------|----------------|
| `copy` | Create duplicates of the value |
| `drop` | Discard the value (let it go out of scope) |
| `store` | Save inside other structs or global storage |
| `key` | Use as a top-level resource in an account |

---

## 🔑 The `key` Ability

The `key` ability allows a struct to be stored directly in an account's global storage.

```move
/// This can be stored at the top level of an account
struct UserProfile has key {
    name: vector<u8>,
    score: u64
}

/// Store a profile in the signer's account
public fun create_profile(account: &signer, name: vector<u8>) {
    let profile = UserProfile { name, score: 0 };
    move_to(account, profile);  // Requires 'key' ability!
}
```

**Rule**: Only `key` resources can use:
- `move_to(signer, resource)` - Store in account
- `move_from<T>(address)` - Remove from account
- `borrow_global<T>(address)` - Read from account
- `borrow_global_mut<T>(address)` - Modify in account
- `exists<T>(address)` - Check if exists

---

## 📦 The `store` Ability

The `store` ability allows a struct to be stored **inside** other structs.

```move
/// Can be stored inside other structs
struct Item has store {
    id: u64,
    name: vector<u8>
}

/// A container that holds Items
struct Inventory has key {
    items: vector<Item>  // Item needs 'store' to be here!
}
```

**Key Insight**: If a struct has `key`, all its fields must have `store`.

---

## 📋 The `copy` Ability

The `copy` ability allows creating duplicates.

```move
/// Can be copied freely
struct Point has copy, drop {
    x: u64,
    y: u64
}

fun demo() {
    let p1 = Point { x: 10, y: 20 };
    let p2 = p1;   // Creates a COPY (p1 still usable)
    let p3 = p1;   // Another copy
    
    // All three are independent copies
}
```

**Without copy**:

```move
struct UniqueToken has drop {
    id: u64
}

fun demo() {
    let t1 = UniqueToken { id: 1 };
    let t2 = t1;   // MOVES t1 into t2
    
    // t1 no longer exists! Using it would be a compile error
}
```

---

## 🗑️ The `drop` Ability

The `drop` ability allows a value to be discarded (go out of scope without explicit handling).

```move
/// Can be safely discarded
struct TempData has drop {
    value: u64
}

fun demo() {
    let temp = TempData { value: 100 };
    // temp goes out of scope here - OK because it has 'drop'
}
```

**Without drop** - You MUST handle the resource:

```move
struct ImportantAsset has store {
    value: u64
}

fun broken() {
    let asset = ImportantAsset { value: 100 };
    // ❌ COMPILE ERROR: ImportantAsset doesn't have 'drop'
    // You MUST do something with it!
}

fun fixed(recipient: &signer) {
    let asset = ImportantAsset { value: 100 };
    move_to(recipient, asset);  // ✅ Asset is handled
}
```

---

## 🎨 Common Ability Combinations

### Pure Data (POD - Plain Old Data)
```move
struct Config has copy, drop, store {
    max_value: u64,
    min_value: u64
}
```
Use case: Configuration, settings, metadata

### Top-Level Resource
```move
struct UserAccount has key {
    balance: u64,
    created_at: u64
}
```
Use case: User data stored in accounts

### Transferable Asset
```move
struct Token has store {
    amount: u64
}

struct Wallet has key {
    tokens: Token  // Token needs 'store' to be inside Wallet
}
```
Use case: Tokens that can be held in wallets

### Valuable NFT (No copy, no drop!)
```move
struct RareNFT has store, key {
    id: u64,
    uri: vector<u8>
}
```
Use case: Unique assets that can't be duplicated or destroyed

---

## 🎮 Interactive Exercise

### Challenge: Fix the Abilities

This code has ability errors. Can you fix it?

```move
module my_addr::game {
    struct Player has key {
        name: vector<u8>,
        inventory: Inventory  // Error 1: ?
    }
    
    struct Inventory {  // Error 2: Missing abilities
        items: vector<Item>
    }
    
    struct Item {  // Error 3: Missing abilities
        id: u64
    }
    
    public fun create_player(account: &signer, name: vector<u8>) {
        let player = Player {
            name,
            inventory: Inventory { items: vector::empty() }
        };
        move_to(account, player);
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::game {
    struct Player has key {
        name: vector<u8>,
        inventory: Inventory  // ✅ Inventory now has 'store'
    }
    
    struct Inventory has store {  // ✅ Added 'store'
        items: vector<Item>
    }
    
    struct Item has store, drop {  // ✅ Added 'store' and 'drop'
        id: u64
    }
    
    public fun create_player(account: &signer, name: vector<u8>) {
        let player = Player {
            name,
            inventory: Inventory { items: vector::empty() }
        };
        move_to(account, player);
    }
}
```

**Why these abilities?**
- `Player` needs `key` to be stored in accounts
- `Inventory` needs `store` to be inside `Player`
- `Item` needs `store` to be inside the vector, and `drop` because vectors can be emptied

</details>

---

## 🧪 Quiz

### Question 1
Which ability is required to use `move_to(signer, resource)`?

- A) `copy`
- B) `drop`
- C) `store`
- D) `key`

<details>
<summary>Answer</summary>
**D) key** - Only `key` resources can be stored at the top level of an account.
</details>

### Question 2
A struct inside another struct needs which ability?

- A) `copy`
- B) `drop`
- C) `store`
- D) `key`

<details>
<summary>Answer</summary>
**C) store** - Nested structs must have the `store` ability.
</details>

### Question 3
What happens if a struct without `drop` goes out of scope?

- A) It's automatically deleted
- B) Compile error
- C) Runtime error
- D) Memory leak

<details>
<summary>Answer</summary>
**B) Compile error** - Move catches this at compile time!
</details>

---

## 📝 Key Takeaways

1. **4 abilities**: `copy`, `drop`, `store`, `key`
2. **`key`** = can be a top-level account resource
3. **`store`** = can be nested inside other structs
4. **`copy`** = can be duplicated
5. **`drop`** = can be discarded
6. **No abilities** = true scarce resource (like valuable NFTs)

---

## 🚀 What's Next?

In the next lesson, we'll learn about **Global Storage** - how to read, write, and manage resources in accounts.

[Continue to Lesson 3: Global Storage →](./lesson-03-global-storage.md)
