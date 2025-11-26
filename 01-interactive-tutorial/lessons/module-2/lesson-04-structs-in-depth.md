# Lesson 4: Structs in Depth

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Master struct creation and destructuring
- Work with nested structs
- Understand generics in Move
- Use phantom types for advanced patterns

---

## 📖 Struct Basics Review

A struct is a custom data type that groups related fields:

```move
struct Player has key, store {
    name: vector<u8>,
    health: u64,
    mana: u64,
    level: u8
}
```

### Creating Structs

```move
// All fields must be specified
let player = Player {
    name: b"Hero",
    health: 100,
    mana: 50,
    level: 1
};

// Shorthand when variable name matches field name
let name = b"Hero";
let health = 100u64;
let mana = 50u64;
let level = 1u8;

let player = Player { name, health, mana, level };
```

---

## 🔓 Destructuring Structs

Destructuring extracts fields from a struct:

```move
struct Point has copy, drop {
    x: u64,
    y: u64
}

fun use_point() {
    let point = Point { x: 10, y: 20 };
    
    // Destructure to get individual values
    let Point { x, y } = point;
    
    // Now x = 10, y = 20
    let sum = x + y;  // 30
}
```

### Partial Destructuring

Use `_` to ignore fields:

```move
struct GameState has drop {
    score: u64,
    level: u64,
    time_remaining: u64,
    player_name: vector<u8>
}

fun get_score(state: GameState): u64 {
    let GameState { score, level: _, time_remaining: _, player_name: _ } = state;
    score
}

// Shorthand with .. (ignore rest)
fun get_score_short(state: GameState): u64 {
    let GameState { score, .. } = state;
    score
}
```

---

## 🪆 Nested Structs

Structs can contain other structs:

```move
struct Sword has store, drop {
    damage: u64,
    durability: u64
}

struct Shield has store, drop {
    defense: u64,
    durability: u64
}

struct Equipment has store, drop {
    weapon: Sword,
    armor: Shield
}

struct Character has key {
    name: vector<u8>,
    equipment: Equipment,
    gold: u64
}
```

### Working with Nested Structs

```move
/// Create a fully equipped character
public fun create_warrior(account: &signer) {
    let sword = Sword { damage: 50, durability: 100 };
    let shield = Shield { defense: 30, durability: 100 };
    let equipment = Equipment { weapon: sword, armor: shield };
    
    let character = Character {
        name: b"Warrior",
        equipment,
        gold: 100
    };
    
    move_to(account, character);
}

/// Upgrade weapon damage
public entry fun upgrade_weapon(account: &signer) acquires Character {
    let addr = signer::address_of(account);
    let character = borrow_global_mut<Character>(addr);
    
    // Access nested field
    character.equipment.weapon.damage = character.equipment.weapon.damage + 10;
}
```

---

## 🧬 Generics

Generics allow you to write code that works with multiple types:

```move
/// A box that can hold any type
struct Box<T> has store, drop {
    value: T
}

/// Create a box with any value
public fun create_box<T>(value: T): Box<T> {
    Box { value }
}

/// Get the value out
public fun unbox<T>(box: Box<T>): T {
    let Box { value } = box;
    value
}
```

### Using Generic Functions

```move
fun demo() {
    // Box of u64
    let num_box = create_box<u64>(42);
    let num = unbox(num_box);  // 42
    
    // Box of bool
    let bool_box = create_box<bool>(true);
    let flag = unbox(bool_box);  // true
    
    // Type inference works too
    let auto_box = create_box(100);  // Inferred as Box<u64>
}
```

### Generic Constraints

You can require certain abilities on generic types:

```move
/// Only types with 'copy' can be duplicated
struct CopyableBox<T: copy> has copy, drop {
    value: T
}

/// Only types with 'store' can be stored
struct StorageContainer<T: store> has key {
    items: vector<T>
}

/// Multiple constraints
struct SafeVault<T: store + drop> has key {
    contents: T
}
```

---

## 👻 Phantom Types

Phantom types are generic parameters that don't affect the struct's layout but add type safety:

```move
/// A coin with a phantom type for the currency
struct Coin<phantom CurrencyType> has store {
    value: u64
}

/// Different currency types (empty structs as markers)
struct USD {}
struct EUR {}
struct BTC {}

/// Type-safe currency operations
public fun create_usd(value: u64): Coin<USD> {
    Coin { value }
}

public fun create_eur(value: u64): Coin<EUR> {
    Coin { value }
}

/// This function only accepts USD
public fun spend_usd(coin: Coin<USD>): u64 {
    let Coin { value } = coin;
    value
}
```

### Why Phantom Types?

```move
fun demo() {
    let dollars = create_usd(100);
    let euros = create_eur(100);
    
    // ✅ This works
    let spent = spend_usd(dollars);
    
    // ❌ Compile error! Can't mix currencies
    // let wrong = spend_usd(euros);
}
```

The compiler prevents mixing different currency types even though they have the same internal structure!

---

## 🎮 Interactive Exercise

### Challenge: Build an Inventory System

Create a flexible inventory system using generics:

```move
module my_addr::inventory {
    use std::vector;
    
    /// Generic item wrapper
    struct Item<T: store> has store {
        data: T,
        quantity: u64
    }
    
    /// Player inventory that can hold any item type
    struct Inventory<T: store> has key {
        items: vector<Item<T>>
    }
    
    // TODO: Implement these functions
    
    /// Create empty inventory
    public fun create_inventory<T: store>(account: &signer) {
        // Your code here
    }
    
    /// Add item to inventory
    public fun add_item<T: store>(
        account: &signer, 
        data: T, 
        quantity: u64
    ) {
        // Your code here
    }
    
    /// Get total item count
    #[view]
    public fun item_count<T: store>(owner: address): u64 {
        // Your code here
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::inventory {
    use std::vector;
    use std::signer;
    
    struct Item<T: store> has store {
        data: T,
        quantity: u64
    }
    
    struct Inventory<T: store> has key {
        items: vector<Item<T>>
    }
    
    public fun create_inventory<T: store>(account: &signer) {
        let inventory = Inventory<T> {
            items: vector::empty<Item<T>>()
        };
        move_to(account, inventory);
    }
    
    public fun add_item<T: store>(
        account: &signer, 
        data: T, 
        quantity: u64
    ) acquires Inventory {
        let addr = signer::address_of(account);
        let inventory = borrow_global_mut<Inventory<T>>(addr);
        
        let item = Item { data, quantity };
        vector::push_back(&mut inventory.items, item);
    }
    
    #[view]
    public fun item_count<T: store>(owner: address): u64 acquires Inventory {
        if (!exists<Inventory<T>>(owner)) {
            return 0
        };
        let inventory = borrow_global<Inventory<T>>(owner);
        vector::length(&inventory.items)
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What does `phantom` mean in a generic type parameter?

- A) The type is invisible
- B) The type doesn't affect struct layout but adds type safety
- C) The type can be null
- D) The type is optional

<details>
<summary>Answer</summary>
**B)** - Phantom types add compile-time type safety without affecting runtime representation.
</details>

### Question 2
Which ability constraint allows storing a generic type?

- A) `<T: copy>`
- B) `<T: drop>`
- C) `<T: store>`
- D) `<T: key>`

<details>
<summary>Answer</summary>
**C) `<T: store>`** - The `store` ability is required for types that will be stored inside other structs.
</details>

### Question 3
How do you ignore fields when destructuring?

- A) Use `null`
- B) Use `_`
- C) Leave them out
- D) Use `ignore`

<details>
<summary>Answer</summary>
**B) Use `_`** - The underscore ignores a field's value during destructuring.
</details>

---

## 📝 Key Takeaways

1. **Destructuring** extracts fields: `let Point { x, y } = point`
2. **Nested structs** require inner types to have `store`
3. **Generics** enable reusable code: `struct Box<T> { value: T }`
4. **Constraints** ensure abilities: `<T: store + drop>`
5. **Phantom types** add type safety without runtime cost

---

## 🎉 Module 2 Complete!

Congratulations! You've mastered:
- ✅ Resources and the Move model
- ✅ All 4 abilities
- ✅ Global storage operations
- ✅ Advanced struct patterns

[Continue to Module 3: Building a DApp →](../module-3/lesson-01-entry-functions.md)
