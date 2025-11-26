# Chapter 3: Understanding Move Basics

> **Master the Fundamentals of the Move Programming Language**

---

## 🎯 What You'll Learn

- Move's syntax and structure
- Data types and variables
- Functions and visibility
- Control flow statements
- Modules and packages

---

## 📦 Move Project Structure

Every Move project follows a standard structure:

```
my_project/
├── Move.toml          # Package manifest
├── sources/           # Move source files
│   └── my_module.move
└── tests/            # Test files (optional)
    └── my_module_tests.move
```

### The Move.toml File

```toml
[package]
name = "my_project"
version = "1.0.0"
authors = ["Your Name"]

[addresses]
my_addr = "_"  # Placeholder, set during deploy

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-network.git", subdir = "cedra-framework", rev = "mainnet" }
```

---

## 🧱 Modules: The Building Blocks

A **module** is the basic unit of code organization in Move:

```move
module my_addr::my_module {
    // All code goes here
    
    // Constants
    const VERSION: u64 = 1;
    
    // Structs (data types)
    struct MyData has key, store {
        value: u64
    }
    
    // Functions
    public fun do_something(): u64 {
        42
    }
}
```

### Module Naming

```move
module <address>::<name> {
    // ...
}
```

- `<address>`: The account that will own this module (e.g., `0x1`, `my_addr`)
- `<name>`: A unique identifier (snake_case convention)

---

## 📊 Data Types

### Primitive Types

| Type | Description | Example |
|------|-------------|---------|
| `bool` | Boolean | `true`, `false` |
| `u8` | 8-bit unsigned integer | `255` |
| `u16` | 16-bit unsigned integer | `65535` |
| `u32` | 32-bit unsigned integer | `4294967295` |
| `u64` | 64-bit unsigned integer | `18446744073709551615` |
| `u128` | 128-bit unsigned integer | Large numbers |
| `u256` | 256-bit unsigned integer | Very large numbers |
| `address` | 32-byte account address | `@0x1` |

### Type Annotations

```move
// Explicit type annotation
let x: u64 = 100;

// Type inference (compiler figures it out)
let y = 100u64;  // Suffix specifies type

// Address literals
let addr: address = @0x1;
let my_addr = @my_addr;  // Named address
```

### Vectors (Dynamic Arrays)

```move
use std::vector;

// Create empty vector
let empty: vector<u64> = vector::empty();

// Create with initial values
let nums = vector[1, 2, 3, 4, 5];

// Vector operations
let first = vector::borrow(&nums, 0);      // Get reference: &1
vector::push_back(&mut nums, 6);            // Add element
let last = vector::pop_back(&mut nums);     // Remove last: 6
let len = vector::length(&nums);            // Length: 5
let is_empty = vector::is_empty(&empty);    // true
```

### Strings

Move uses byte vectors for strings:

```move
use std::string::{Self, String};

// Create a string
let hello: String = string::utf8(b"Hello, Cedra!");

// String operations
let len = string::length(&hello);           // 13
let is_empty = string::is_empty(&hello);    // false

// Append strings
let mut greeting = string::utf8(b"Hello");
string::append(&mut greeting, string::utf8(b" World"));
```

---

## 🏗️ Structs

Structs are custom data types:

```move
module my_addr::structs_example {
    
    // Simple struct
    struct Point has copy, drop {
        x: u64,
        y: u64
    }
    
    // Nested struct
    struct Rectangle has copy, drop {
        top_left: Point,
        bottom_right: Point
    }
    
    // Struct with generics
    struct Container<T> has copy, drop {
        value: T
    }
    
    // Create instances
    public fun create_point(x: u64, y: u64): Point {
        Point { x, y }  // Field shorthand when variable name matches
    }
    
    // Access fields
    public fun get_x(p: &Point): u64 {
        p.x
    }
    
    // Destructure
    public fun destructure_point(p: Point): (u64, u64) {
        let Point { x, y } = p;
        (x, y)
    }
}
```

### Abilities

Structs can have **abilities** that define what operations are allowed:

| Ability | Description | Use Case |
|---------|-------------|----------|
| `copy` | Can be copied | Values, data |
| `drop` | Can be discarded | Temporary data |
| `store` | Can be stored in global storage | Persistent data |
| `key` | Can be used as storage key | Top-level resources |

```move
// Can copy and drop (like a regular value)
struct Copyable has copy, drop {
    value: u64
}

// Can be stored in global state
struct Storable has key, store {
    value: u64
}

// "Empty" struct - must be explicitly destroyed
struct MustHandle {
    value: u64
}
```

---

## ⚡ Functions

### Function Types

```move
module my_addr::functions_example {
    
    // Private function (only callable within module)
    fun private_helper(): u64 {
        42
    }
    
    // Public function (callable from other modules)
    public fun public_helper(): u64 {
        private_helper()
    }
    
    // Entry function (callable via transactions)
    public entry fun do_action(account: &signer) {
        // Transaction logic
    }
    
    // View function (read-only, no gas cost)
    #[view]
    public fun get_value(): u64 {
        42
    }
    
    // Friend function (callable by friend modules)
    public(friend) fun friend_only(): u64 {
        42
    }
}
```

### Parameters and Return Values

```move
// Multiple parameters
fun add(a: u64, b: u64): u64 {
    a + b
}

// Multiple return values (tuple)
fun divide_with_remainder(a: u64, b: u64): (u64, u64) {
    let quotient = a / b;
    let remainder = a % b;
    (quotient, remainder)
}

// Using multiple returns
fun use_multiple_returns() {
    let (q, r) = divide_with_remainder(10, 3);
    // q = 3, r = 1
}
```

### References

```move
// Immutable reference (read-only)
fun read_value(data: &MyStruct): u64 {
    data.value  // Can read
}

// Mutable reference (read-write)
fun modify_value(data: &mut MyStruct) {
    data.value = data.value + 1;  // Can modify
}

// Ownership vs borrowing
fun ownership_example() {
    let data = MyStruct { value: 10 };
    
    let ref = &data;           // Borrow immutable
    let val = ref.value;       // Read through reference
    
    let mut_ref = &mut data;   // Borrow mutable
    mut_ref.value = 20;        // Modify through reference
    
    // data is still valid here
}
```

---

## 🔀 Control Flow

### Conditionals

```move
fun check_value(x: u64): u64 {
    if (x > 100) {
        1
    } else if (x > 50) {
        2
    } else {
        3
    }
}

// If as expression
let result = if (condition) { value_a } else { value_b };
```

### Loops

```move
// While loop
fun count_up(n: u64): u64 {
    let i = 0;
    let sum = 0;
    while (i < n) {
        sum = sum + i;
        i = i + 1;
    };
    sum
}

// Loop with break
fun find_first_even(nums: &vector<u64>): u64 {
    let i = 0;
    let result = 0;
    loop {
        if (i >= vector::length(nums)) {
            break
        };
        let num = *vector::borrow(nums, i);
        if (num % 2 == 0) {
            result = num;
            break
        };
        i = i + 1;
    };
    result
}

// Loop with continue
fun sum_evens(nums: &vector<u64>): u64 {
    let i = 0;
    let sum = 0;
    while (i < vector::length(nums)) {
        let num = *vector::borrow(nums, i);
        i = i + 1;
        if (num % 2 != 0) {
            continue  // Skip odd numbers
        };
        sum = sum + num;
    };
    sum
}
```

---

## ❌ Error Handling

Move uses **abort codes** for errors:

```move
module my_addr::errors_example {
    
    // Error codes (constants)
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    
    // Using assert!
    public fun transfer(from: &signer, amount: u64) {
        assert!(amount > 0, E_INVALID_AMOUNT);
        // ... rest of transfer logic
    }
    
    // Using abort
    public fun checked_divide(a: u64, b: u64): u64 {
        if (b == 0) {
            abort E_INVALID_AMOUNT
        };
        a / b
    }
    
    // Conditional abort
    public fun withdraw(balance: u64, amount: u64): u64 {
        assert!(balance >= amount, E_INSUFFICIENT_BALANCE);
        balance - amount
    }
}
```

---

## 📚 Using Standard Library

### Common Imports

```move
module my_addr::stdlib_example {
    use std::vector;           // Dynamic arrays
    use std::string::{Self, String};  // String type
    use std::option::{Self, Option};  // Optional values
    use std::signer;           // Account signer utilities
    
    // Option example
    fun find_value(id: u64): Option<u64> {
        if (id == 1) {
            option::some(100)
        } else {
            option::none()
        }
    }
    
    // Signer example
    public entry fun action(account: &signer) {
        let addr = signer::address_of(account);
        // Use addr...
    }
}
```

---

## 🎮 Practice Exercise

### Challenge: Build a Simple Calculator

Create a module with basic math operations:

```move
module my_addr::calculator {
    // Error codes
    const E_DIVIDE_BY_ZERO: u64 = 1;
    const E_OVERFLOW: u64 = 2;
    
    // TODO: Implement these functions
    
    public fun add(a: u64, b: u64): u64 {
        // Your code here
    }
    
    public fun subtract(a: u64, b: u64): u64 {
        // Your code here (handle underflow!)
    }
    
    public fun multiply(a: u64, b: u64): u64 {
        // Your code here
    }
    
    public fun divide(a: u64, b: u64): u64 {
        // Your code here (handle divide by zero!)
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::calculator {
    const E_DIVIDE_BY_ZERO: u64 = 1;
    const E_UNDERFLOW: u64 = 2;
    
    public fun add(a: u64, b: u64): u64 {
        a + b  // Will abort on overflow automatically
    }
    
    public fun subtract(a: u64, b: u64): u64 {
        assert!(a >= b, E_UNDERFLOW);
        a - b
    }
    
    public fun multiply(a: u64, b: u64): u64 {
        a * b  // Will abort on overflow automatically
    }
    
    public fun divide(a: u64, b: u64): u64 {
        assert!(b != 0, E_DIVIDE_BY_ZERO);
        a / b
    }
    
    // Bonus: Safe operations with Option
    use std::option::{Self, Option};
    
    public fun safe_divide(a: u64, b: u64): Option<u64> {
        if (b == 0) {
            option::none()
        } else {
            option::some(a / b)
        }
    }
}
```

</details>

---

## 📝 Key Takeaways

1. **Modules** are the basic organizational unit
2. **Structs** with abilities define data behavior
3. **Functions** can be private, public, or entry
4. **References** enable safe borrowing (`&` and `&mut`)
5. **Error handling** uses abort codes and assert!

---

## ➡️ Next Steps

In Chapter 4, we'll use everything we've learned to build a complete Counter smart contract!

[Continue to Chapter 4: Your First Smart Contract →](./04-first-contract.md)
