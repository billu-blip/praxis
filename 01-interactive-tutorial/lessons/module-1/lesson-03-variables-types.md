# Lesson 3: Variables and Types

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand Move's primitive types
- Learn about variable declaration and mutability
- Work with vectors and strings
- Understand type annotations

---

## 📖 Primitive Types

Move has several built-in primitive types:

### Integer Types

```move
let a: u8   = 255;        // 8-bit unsigned (0 to 255)
let b: u16  = 65535;      // 16-bit unsigned
let c: u32  = 4294967295; // 32-bit unsigned
let d: u64  = 100;        // 64-bit unsigned (most common)
let e: u128 = 1000;       // 128-bit unsigned (for large numbers)
let f: u256 = 10000;      // 256-bit unsigned (for crypto operations)
```

**💡 Pro Tip:** `u64` is the most commonly used integer type in Cedra/Move for balances, counters, and general numbers.

### Boolean Type

```move
let is_active: bool = true;
let is_paused: bool = false;

// Boolean operations
let result = is_active && !is_paused;  // AND, NOT
let either = is_active || is_paused;   // OR
```

### Address Type

```move
let user: address = @0x1;
let my_addr: address = @hello_cedra;  // Named address

// Special address literals
let framework = @0x1;      // Cedra Framework
let zero = @0x0;           // Zero address
```

---

## 🔄 Variable Declaration

### Let Bindings

Variables are declared with `let`:

```move
let x = 10;           // Type inferred as u64
let y: u64 = 20;      // Explicit type annotation
let z = x + y;        // z = 30
```

### Mutability

By default, variables are **immutable**. Use `let mut` for mutable variables:

```move
// Immutable (default)
let count = 0;
// count = 1;  // ❌ Error! Cannot reassign

// Mutable
let mut counter = 0;
counter = counter + 1;  // ✅ OK
counter = counter + 1;  // counter = 2
```

### Shadowing

You can redeclare a variable with the same name:

```move
let x = 5;
let x = x + 1;    // x is now 6
let x = x * 2;    // x is now 12
```

This is useful for transforming values without mutability.

---

## 📦 Vectors

Vectors are dynamic arrays that can hold multiple values of the same type:

```move
use std::vector;

// Creating vectors
let empty: vector<u64> = vector[];
let numbers: vector<u64> = vector[1, 2, 3, 4, 5];

// Operations
let mut v = vector[10, 20, 30];

// Add element to the end
vector::push_back(&mut v, 40);  // [10, 20, 30, 40]

// Remove and return last element
let last = vector::pop_back(&mut v);  // last = 40, v = [10, 20, 30]

// Get length
let len = vector::length(&v);  // 3

// Access element (by reference)
let first = vector::borrow(&v, 0);  // &10

// Check if empty
let is_empty = vector::is_empty(&v);  // false
```

### Vector Iteration

```move
let values = vector[1, 2, 3, 4, 5];
let mut sum = 0;

let mut i = 0;
let len = vector::length(&values);
while (i < len) {
    sum = sum + *vector::borrow(&values, i);
    i = i + 1;
};
// sum = 15
```

---

## 📝 Strings

Move uses byte vectors for strings, with a `String` wrapper for UTF-8:

```move
use std::string::{Self, String};

// Creating strings
let hello: String = string::utf8(b"Hello, Cedra!");

// From byte vector
let bytes: vector<u8> = b"Hello";
let s = string::utf8(bytes);

// String operations
let len = string::length(&hello);  // 13

// Concatenation
let greeting = string::utf8(b"Hello, ");
let name = string::utf8(b"Alice");
string::append(&mut greeting, name);
// greeting = "Hello, Alice"

// Check if empty
let is_empty = string::is_empty(&greeting);
```

---

## 🎭 Type Casting

Move requires explicit type casting:

```move
let small: u8 = 10;
let big: u64 = (small as u64);  // Cast u8 to u64

let large: u64 = 1000;
let tiny: u8 = (large as u8);   // ⚠️ Will truncate if > 255
```

**⚠️ Warning:** Casting to smaller types can cause data loss!

---

## 🔍 Constants

Constants are compile-time values:

```move
module example::constants {
    // Constants must be uppercase by convention
    const MAX_SUPPLY: u64 = 1_000_000;
    const DECIMALS: u8 = 8;
    const TOKEN_NAME: vector<u8> = b"MyCoin";
    
    // Error codes are commonly constants
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    
    public fun get_max_supply(): u64 {
        MAX_SUPPLY
    }
}
```

---

## 🧪 Challenge Exercise

Write a module that manages a simple todo list using vectors:

```move
module todo::list {
    use std::string::String;
    use std::vector;
    use std::signer;
    
    struct TodoList has key {
        items: vector<String>
    }
    
    // TODO: Implement these functions
    // 1. create_list - Initialize empty todo list
    // 2. add_item - Add a todo item
    // 3. remove_item - Remove item by index
    // 4. get_count - Return number of items
}
```

<details>
<summary>✅ Solution</summary>

```move
module todo::list {
    use std::string::String;
    use std::vector;
    use std::signer;
    
    struct TodoList has key {
        items: vector<String>
    }
    
    /// Error codes
    const E_LIST_NOT_EXISTS: u64 = 1;
    const E_INVALID_INDEX: u64 = 2;
    
    /// Create a new empty todo list
    public entry fun create_list(account: &signer) {
        let list = TodoList { items: vector[] };
        move_to(account, list);
    }
    
    /// Add an item to the list
    public entry fun add_item(
        account: &signer, 
        item: String
    ) acquires TodoList {
        let addr = signer::address_of(account);
        assert!(exists<TodoList>(addr), E_LIST_NOT_EXISTS);
        
        let list = borrow_global_mut<TodoList>(addr);
        vector::push_back(&mut list.items, item);
    }
    
    /// Remove item by index
    public entry fun remove_item(
        account: &signer, 
        index: u64
    ) acquires TodoList {
        let addr = signer::address_of(account);
        assert!(exists<TodoList>(addr), E_LIST_NOT_EXISTS);
        
        let list = borrow_global_mut<TodoList>(addr);
        let len = vector::length(&list.items);
        assert!(index < len, E_INVALID_INDEX);
        
        vector::remove(&mut list.items, index);
    }
    
    /// Get the number of items
    #[view]
    public fun get_count(addr: address): u64 acquires TodoList {
        assert!(exists<TodoList>(addr), E_LIST_NOT_EXISTS);
        let list = borrow_global<TodoList>(addr);
        vector::length(&list.items)
    }
}
```
</details>

---

## ✅ Lesson Complete!

You now understand Move's type system! 🎉

### Key Takeaways:
- Use `u64` for most numbers, `u8` for small values
- Variables are immutable by default; use `let mut` for mutability
- Vectors are dynamic arrays with push/pop operations
- Strings are UTF-8 encoded byte vectors
- Constants are uppercase and compile-time values

### What's Next?
In **Lesson 4**, we'll explore functions in depth - parameters, return values, and entry points!

---

## 📚 Additional Resources

- [Move Primitive Types](https://move-book.com/reference/primitive-types/)
- [Move Vector Module](https://move-book.com/reference/vector.html)
