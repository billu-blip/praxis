# Solidity → Move Translation Cheatsheet

> **Side-by-Side Code Comparisons for Quick Reference**

---

## 📦 Contract / Module Structure

### Solidity
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // State variables
    uint256 public value;
    address public owner;
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // Functions
    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

### Move
```move
module my_addr::my_contract {
    use std::signer;
    
    // State as resources
    struct State has key {
        value: u64,
        owner: address,
    }
    
    // Init function (called once on publish)
    fun init_module(account: &signer) {
        move_to(account, State {
            value: 0,
            owner: signer::address_of(account),
        });
    }
    
    // Functions
    public entry fun set_value(account: &signer, value: u64) acquires State {
        let state = borrow_global_mut<State>(@my_addr);
        state.value = value;
    }
}
```

---

## 🔢 Data Types

| Solidity | Move | Example |
|----------|------|---------|
| `uint8` | `u8` | `let x: u8 = 255;` |
| `uint16` | `u16` | `let x: u16 = 1000;` |
| `uint32` | `u32` | `let x: u32 = 100000;` |
| `uint64` | `u64` | `let x: u64 = 1000000;` |
| `uint128` | `u128` | `let x: u128 = 10;` |
| `uint256` | `u256` | `let x: u256 = 10;` |
| `int*` | ❌ N/A | No signed integers |
| `bool` | `bool` | `let x: bool = true;` |
| `address` | `address` | `let x: address = @0x1;` |
| `string` | `String` | `string::utf8(b"hello")` |
| `bytes` | `vector<u8>` | `vector[1u8, 2u8, 3u8]` |
| `bytes32` | `vector<u8>` | Check length manually |

---

## 💾 Storage Operations

### Solidity
```solidity
// State variable
mapping(address => uint256) public balances;

// Read
uint256 bal = balances[user];

// Write
balances[user] = 100;

// Delete
delete balances[user];
```

### Move
```move
// Resource
struct Balances has key {
    value: u64
}

// Read (immutable)
let bal = borrow_global<Balances>(user).value;

// Read (mutable)
let balance = borrow_global_mut<Balances>(user);
balance.value = 100;

// Check exists
if (exists<Balances>(user)) { ... }

// Create
move_to(account, Balances { value: 0 });

// Delete
let Balances { value: _ } = move_from<Balances>(user);
```

---

## 🔧 Functions

### Entry Point (External)

**Solidity:**
```solidity
function transfer(address to, uint256 amount) external {
    // ...
}
```

**Move:**
```move
public entry fun transfer(from: &signer, to: address, amount: u64) {
    // ...
}
```

### View Function

**Solidity:**
```solidity
function balanceOf(address account) public view returns (uint256) {
    return balances[account];
}
```

**Move:**
```move
#[view]
public fun balance_of(account: address): u64 acquires Balances {
    borrow_global<Balances>(account).value
}
```

### Internal/Private

**Solidity:**
```solidity
function _internal() internal { }
function _private() private { }
```

**Move:**
```move
fun internal_function() { }  // Module-only, no public keyword
```

---

## 🛡️ Access Control

### msg.sender

**Solidity:**
```solidity
require(msg.sender == owner, "Not owner");
```

**Move:**
```move
assert!(signer::address_of(account) == owner, E_NOT_OWNER);
```

### Modifiers

**Solidity:**
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function withdraw() public onlyOwner {
    // ...
}
```

**Move:**
```move
const E_NOT_OWNER: u64 = 1;

fun only_owner(account: &signer) acquires Config {
    let config = borrow_global<Config>(@my_addr);
    assert!(signer::address_of(account) == config.owner, E_NOT_OWNER);
}

public entry fun withdraw(account: &signer) acquires Config {
    only_owner(account);
    // ...
}
```

---

## ⚠️ Error Handling

### Solidity
```solidity
require(amount > 0, "Amount must be positive");
require(balance >= amount, "Insufficient balance");
revert("Custom error");
```

### Move
```move
const E_ZERO_AMOUNT: u64 = 1;
const E_INSUFFICIENT_BALANCE: u64 = 2;

assert!(amount > 0, E_ZERO_AMOUNT);
assert!(balance >= amount, E_INSUFFICIENT_BALANCE);
abort E_CUSTOM_ERROR
```

---

## 🎭 Events

### Solidity
```solidity
event Transfer(address indexed from, address indexed to, uint256 value);

function transfer(address to, uint256 amount) external {
    // ...
    emit Transfer(msg.sender, to, amount);
}
```

### Move
```move
#[event]
struct TransferEvent has drop, store {
    from: address,
    to: address,
    value: u64,
}

public entry fun transfer(from: &signer, to: address, amount: u64) {
    // ...
    event::emit(TransferEvent {
        from: signer::address_of(from),
        to,
        value: amount,
    });
}
```

---

## 🔄 Loops

### For Loop

**Solidity:**
```solidity
for (uint i = 0; i < array.length; i++) {
    // process array[i]
}
```

**Move:**
```move
let i = 0;
let len = vector::length(&array);
while (i < len) {
    let item = vector::borrow(&array, i);
    // process item
    i = i + 1;
};
```

### ForEach (Move only)

```move
vector::for_each(items, |item| {
    // process item
});
```

---

## 📦 Arrays / Vectors

### Solidity
```solidity
uint256[] public numbers;

numbers.push(42);
uint256 value = numbers[0];
numbers.pop();
uint256 len = numbers.length;
```

### Move
```move
let numbers: vector<u64> = vector[];

vector::push_back(&mut numbers, 42);
let value = *vector::borrow(&numbers, 0);
vector::pop_back(&mut numbers);
let len = vector::length(&numbers);
```

---

## 🗺️ Mappings / Tables

### Solidity
```solidity
mapping(address => uint256) public balances;
mapping(address => mapping(address => uint256)) public allowances;

balances[user] = 100;
uint256 bal = balances[user];
```

### Move
```move
use cedra_std::smart_table::{Self, SmartTable};

struct Storage has key {
    balances: SmartTable<address, u64>,
    allowances: SmartTable<address, SmartTable<address, u64>>,
}

// Write
smart_table::upsert(&mut storage.balances, user, 100);

// Read
let bal = *smart_table::borrow(&storage.balances, user);

// Check exists
if (smart_table::contains(&storage.balances, user)) { ... }
```

---

## 💰 Token Transfers

### ERC-20 (Solidity)
```solidity
function transfer(address to, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount, "Insufficient");
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
}
```

### Fungible Asset (Move)
```move
use cedra_framework::fungible_asset;
use cedra_framework::primary_fungible_store;

public entry fun transfer(
    from: &signer,
    to: address,
    amount: u64
) {
    let metadata = get_metadata();
    primary_fungible_store::transfer(from, metadata, to, amount);
    // Events emitted automatically
}
```

---

## 🖼️ NFT Operations

### ERC-721 (Solidity)
```solidity
function mint(address to, uint256 tokenId) public {
    _safeMint(to, tokenId);
}

function transferFrom(address from, address to, uint256 tokenId) public {
    require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
    _transfer(from, to, tokenId);
}
```

### Digital Asset (Move)
```move
use cedra_token::token;
use cedra_framework::object;

public entry fun mint(creator: &signer, name: String, uri: String) {
    token::create_named_token(
        creator,
        get_collection_name(),
        string::utf8(b"Description"),
        name,
        option::none(),
        uri
    );
}

public entry fun transfer(from: &signer, token_addr: address, to: address) {
    let token_obj = object::address_to_object<Token>(token_addr);
    object::transfer(from, token_obj, to);
}
```

---

## 🔐 Constructor / Initialization

### Solidity
```solidity
constructor(uint256 initialValue) {
    value = initialValue;
    owner = msg.sender;
}
```

### Move (Two Options)

**Option 1: init_module (called once on publish)**
```move
fun init_module(deployer: &signer) {
    move_to(deployer, Config {
        value: 0,
        owner: signer::address_of(deployer),
    });
}
```

**Option 2: Explicit initialize function**
```move
public entry fun initialize(account: &signer, initial_value: u64) {
    assert!(!exists<Config>(@my_addr), E_ALREADY_INITIALIZED);
    move_to(account, Config {
        value: initial_value,
        owner: signer::address_of(account),
    });
}
```

---

## 📊 Quick Reference Table

| Solidity | Move |
|----------|------|
| `contract X` | `module addr::X` |
| `msg.sender` | `signer::address_of(account)` |
| `require(cond, "msg")` | `assert!(cond, ERROR_CODE)` |
| `revert("msg")` | `abort ERROR_CODE` |
| `mapping(K => V)` | `SmartTable<K, V>` |
| `K[] array` | `vector<K>` |
| `public view` | `#[view] public fun` |
| `external` | `public entry fun` |
| `emit Event(...)` | `event::emit(Event { ... })` |
| `modifier` | Inline function call |
| `constructor` | `init_module` or `initialize` |
| `this` | `@module_address` |
| `block.timestamp` | `timestamp::now_seconds()` |

---

## 🔗 Resources

- [Full Solidity → Move Guide](../solidity-to-move/README.md)
- [Move Syntax Cheatsheet](./move-syntax.md)
- [Common Patterns](./common-patterns.md)
