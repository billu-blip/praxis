# Lesson 2: Your First Move Module

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand the structure of a Move module
- Write your first "Hello World" module
- Learn about module declarations and addresses
- Understand the `use` statement for imports

---

## 📖 What is a Module?

A **module** in Move is like a container for your code. It groups together:
- **Structs** (data structures)
- **Functions** (logic)
- **Constants** (fixed values)

Think of a module as a smart contract, but with superpowers! 🦸

### Basic Module Structure

```move
module <address>::<module_name> {
    // Imports
    use std::string;
    
    // Constants
    const MY_CONSTANT: u64 = 100;
    
    // Structs
    struct MyData has key {
        value: u64
    }
    
    // Functions
    public fun my_function() {
        // Your logic here
    }
}
```

---

## 🔑 Understanding Addresses

Every module in Move is published under an **address**. This address is like a unique identifier that says "this module belongs here."

```move
module 0x1::example {
    // This module is published at address 0x1
}
```

In Cedra, you can also use **named addresses** defined in your `Move.toml`:

```toml
[addresses]
my_address = "0x1234..."
```

Then reference it:
```move
module my_address::example {
    // Much cleaner!
}
```

---

## ✍️ Challenge: Your First Module

Let's write your first Move module! This is a simple "Hello" module that stores a greeting.

### Step 1: Create the Module

```move
module hello_cedra::greeting {
    use std::string::{Self, String};
    use std::signer;
    
    /// A resource that stores a greeting message
    struct Greeting has key {
        message: String
    }
    
    /// Initialize a greeting for the caller
    public entry fun create_greeting(account: &signer, message: String) {
        let greeting = Greeting { message };
        move_to(account, greeting);
    }
    
    /// Read the greeting (view function - no gas cost)
    #[view]
    public fun get_greeting(addr: address): String acquires Greeting {
        let greeting = borrow_global<Greeting>(addr);
        greeting.message
    }
}
```

### Step 2: Understand Each Part

Let's break down what we wrote:

#### 1. Module Declaration
```move
module hello_cedra::greeting {
```
- `hello_cedra` is the address (defined in Move.toml)
- `greeting` is the module name

#### 2. Imports
```move
use std::string::{Self, String};
use std::signer;
```
- `use` imports types and functions from other modules
- `Self` lets us use `string::` prefix for functions
- `String` imports the type directly

#### 3. Struct with Ability
```move
struct Greeting has key {
    message: String
}
```
- `has key` means this struct can be stored at the top level of an account
- This makes it a **resource**

#### 4. Entry Function
```move
public entry fun create_greeting(account: &signer, message: String) {
```
- `public` means callable from outside the module
- `entry` means callable directly from a transaction
- `&signer` is a reference to the transaction signer

#### 5. View Function
```move
#[view]
public fun get_greeting(addr: address): String acquires Greeting {
```
- `#[view]` marks it as a read-only function (no gas cost to call)
- `acquires Greeting` declares that this function reads `Greeting` from storage

---

## 🔧 Setting Up Your Project

### 1. Create Project Directory

```bash
mkdir hello_cedra
cd hello_cedra
cedra move init --name hello_cedra
```

### 2. Configure Move.toml

Edit the `Move.toml` file:

```toml
[package]
name = "hello_cedra"
version = "1.0.0"
authors = []

[addresses]
hello_cedra = "_"  # Will be replaced with your account address

[dependencies.CedraFramework]
git = "https://github.com/cedra-labs/cedra-framework.git"
rev = "main"
subdir = "cedra-framework"
```

### 3. Create the Source File

Save the module code to `sources/greeting.move`

### 4. Compile

```bash
cedra move compile --named-addresses hello_cedra=default
```

If successful, you'll see:
```
Compiling, may take a little while to download git dependencies...
INCLUDING DEPENDENCY CedraFramework
BUILDING hello_cedra
```

---

## 🧪 Challenge Exercise

Modify the `Greeting` module to add:

1. A function to **update** the greeting message
2. A function to **delete** the greeting

<details>
<summary>💡 Hint</summary>

To update a resource, use `borrow_global_mut`:
```move
let greeting = borrow_global_mut<Greeting>(addr);
greeting.message = new_message;
```

To delete a resource, use `move_from`:
```move
let Greeting { message: _ } = move_from<Greeting>(addr);
```
</details>

<details>
<summary>✅ Solution</summary>

```move
/// Update the greeting message
public entry fun update_greeting(
    account: &signer, 
    new_message: String
) acquires Greeting {
    let addr = signer::address_of(account);
    let greeting = borrow_global_mut<Greeting>(addr);
    greeting.message = new_message;
}

/// Delete the greeting
public entry fun delete_greeting(account: &signer) acquires Greeting {
    let addr = signer::address_of(account);
    let Greeting { message: _ } = move_from<Greeting>(addr);
}
```
</details>

---

## ✅ Lesson Complete!

You've written your first Move module! 🎉

### Key Takeaways:
- Modules contain structs, functions, and constants
- Every module has an address
- `entry` functions can be called from transactions
- `#[view]` functions are read-only and gas-free
- `acquires` declares which resources a function accesses

### What's Next?
In **Lesson 3**, we'll dive deeper into Move's type system - variables, primitive types, and more!

---

## 📚 Additional Resources

- [Cedra Counter Tutorial](https://docs.cedra.network/getting-started/counter)
- [Move Modules Documentation](https://move-book.com/reference/modules.html)
