# Solidity to Move Migration Guide

> **A Complete Guide for EVM Developers Transitioning to Cedra**

---

## 📖 Table of Contents

1. [Mindset Shift](#-mindset-shift)
2. [Account Model](#-account-model)
3. [Type System](#-type-system)
4. [Storage Patterns](#-storage-patterns)
5. [Function Types](#-function-types)
6. [Common Patterns Translated](#-common-patterns-translated)
7. [Security Improvements](#-security-improvements)
8. [Development Workflow](#-development-workflow)

---

## 🧠 Mindset Shift

### The Fundamental Difference

**Solidity**: You're a **bookkeeper** managing ledgers
**Move**: You're handling **physical objects** that move between locations

```
Solidity Mental Model:           Move Mental Model:
┌─────────────────────┐         ┌─────────────────────┐
│  balances mapping   │         │   Alice's Account   │
│  ─────────────────  │         │   ┌───────────┐     │
│  Alice  →  100      │         │   │ Coin(100) │     │
│  Bob    →   50      │         │   └───────────┘     │
│  Carol  →   75      │         └─────────────────────┘
└─────────────────────┘         ┌─────────────────────┐
     (Ledger entries)           │   Bob's Account     │
                                │   ┌───────────┐     │
                                │   │ Coin(50)  │     │
                                │   └───────────┘     │
                                └─────────────────────┘
                                     (Physical assets)
```

---

## 👤 Account Model

### Solidity Account Model

```solidity
// Accounts are just addresses
// All state lives in contract storage
contract Token {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

### Move Account Model

```move
module token::coin {
    // Each account stores its own resources
    struct Coin has store {
        value: u64
    }
    
    // Resources live IN the account, not in a central mapping
    struct CoinStore has key {
        coin: Coin
    }
    
    public fun transfer(from: &signer, to: address, amount: u64) 
    acquires CoinStore {
        // Physically withdraw from sender
        let coin = withdraw(from, amount);
        // Physically deposit to receiver
        deposit(to, coin);
    }
}
```

### Key Differences

| Aspect | Solidity | Move |
|--------|----------|------|
| State Location | Contract storage | Account resources |
| Access | Mapping lookup | Resource ownership |
| Authorization | `msg.sender` check | Signer required |
| Existence | Implicit (0 default) | Explicit (exists check) |

---

## 📊 Type System

### Solidity Types → Move Types

| Solidity | Move | Notes |
|----------|------|-------|
| `uint8` | `u8` | Same |
| `uint16` | `u16` | Same |
| `uint32` | `u32` | Same |
| `uint64` | `u64` | **Most common in Move** |
| `uint128` | `u128` | Same |
| `uint256` | `u256` | Same |
| `int*` | N/A | Move has no signed integers |
| `bool` | `bool` | Same |
| `address` | `address` | 32 bytes in Move (vs 20 in EVM) |
| `string` | `String` | From `std::string` |
| `bytes` | `vector<u8>` | Dynamic byte array |
| `bytes32` | `vector<u8>` | Use fixed-size checks |

### Structs

**Solidity:**
```solidity
struct User {
    address wallet;
    uint256 balance;
    bool isActive;
}
```

**Move:**
```move
struct User has key, store {
    wallet: address,
    balance: u64,
    is_active: bool,
}
```

### The Ability System

Move structs have **abilities** that control what you can do with them:

| Ability | Meaning | Solidity Equivalent |
|---------|---------|---------------------|
| `copy` | Can be duplicated | Default for value types |
| `drop` | Can be discarded | Default for all types |
| `store` | Can be saved in storage | N/A |
| `key` | Can be a top-level storage key | N/A |

```move
// A token that cannot be copied or accidentally dropped
struct Coin has store {
    value: u64
}
// This is what makes it "resource-safe"!
```

---

## 💾 Storage Patterns

### Solidity: Global Mappings

```solidity
contract Token {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}
```

### Move: Account Resources

```move
module token::token {
    use std::signer;
    
    struct Balance has key {
        value: u64
    }
    
    // Store in account
    public fun initialize(account: &signer) {
        move_to(account, Balance { value: 0 });
    }
    
    // Read from account
    public fun balance_of(addr: address): u64 acquires Balance {
        if (exists<Balance>(addr)) {
            borrow_global<Balance>(addr).value
        } else {
            0
        }
    }
}
```

### Storage Operations Comparison

| Solidity | Move | Description |
|----------|------|-------------|
| `mapping[key] = value` | `move_to(signer, resource)` | Store data |
| `mapping[key]` | `borrow_global<T>(addr)` | Read data |
| `mapping[key] = new_val` | `borrow_global_mut<T>(addr)` | Modify data |
| `delete mapping[key]` | `move_from<T>(addr)` | Remove data |
| N/A | `exists<T>(addr)` | Check existence |

---

## 🔧 Function Types

### Visibility

| Solidity | Move | Description |
|----------|------|-------------|
| `public` | `public` | Callable by anyone |
| `external` | `public entry` | Transaction entry point |
| `internal` | (no modifier) | Module-internal only |
| `private` | (no modifier) | Module-internal only |

### Function Modifiers

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

**Move (using assert):**
```move
const E_NOT_OWNER: u64 = 1;

public entry fun withdraw(account: &signer) acquires Treasury {
    let addr = signer::address_of(account);
    let treasury = borrow_global<Treasury>(@treasury);
    assert!(addr == treasury.owner, E_NOT_OWNER);
    // ...
}
```

### View Functions

**Solidity:**
```solidity
function getBalance() public view returns (uint256) {
    return balances[msg.sender];
}
```

**Move:**
```move
#[view]
public fun get_balance(addr: address): u64 acquires Balance {
    borrow_global<Balance>(addr).value
}
```

---

## 🔄 Common Patterns Translated

### ERC-20 Token

**Solidity:**
```solidity
contract ERC20 {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
```

**Move (Fungible Asset):**
```move
module my_token::token {
    use cedra_framework::fungible_asset;
    use cedra_framework::primary_fungible_store;
    
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let asset = get_metadata();
        primary_fungible_store::transfer(from, asset, to, amount);
    }
}
```

### Ownable Pattern

**Solidity:**
```solidity
contract Ownable {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }
}
```

**Move:**
```move
module my_module::ownable {
    use std::signer;
    
    struct Ownership has key {
        owner: address
    }
    
    const E_NOT_OWNER: u64 = 1;
    
    fun only_owner(account: &signer) acquires Ownership {
        let addr = signer::address_of(account);
        let ownership = borrow_global<Ownership>(@my_module);
        assert!(addr == ownership.owner, E_NOT_OWNER);
    }
    
    public entry fun transfer_ownership(
        account: &signer,
        new_owner: address
    ) acquires Ownership {
        only_owner(account);
        let ownership = borrow_global_mut<Ownership>(@my_module);
        ownership.owner = new_owner;
    }
}
```

### Reentrancy Guard

**Solidity:**
```solidity
contract ReentrancyGuard {
    bool private _locked;
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }
}
```

**Move:**
```move
// NOT NEEDED IN MOVE!
// The resource model makes reentrancy impossible.
// You can't "call back" while a resource is borrowed.
```

---

## 🛡️ Security Improvements

### Automatic Protections in Move

| Vulnerability | Solidity Risk | Move Protection |
|---------------|---------------|-----------------|
| **Reentrancy** | High - must guard | Impossible - resource model |
| **Integer Overflow** | Medium - since 0.8 | Built-in - always checked |
| **Double Spend** | Possible with bugs | Impossible - linear types |
| **Access Control** | Manual checks | Signer-based proof |
| **Uninitialized Storage** | Can cause issues | Explicit existence checks |

### Example: Flash Loan Safety

**Solidity (Requires careful implementation):**
```solidity
function flashLoan(uint256 amount) external {
    uint256 balanceBefore = token.balanceOf(address(this));
    
    token.transfer(msg.sender, amount);
    
    // Callback - REENTRANCY RISK!
    IFlashBorrower(msg.sender).executeOperation(amount);
    
    require(
        token.balanceOf(address(this)) >= balanceBefore,
        "Flash loan not repaid"
    );
}
```

**Move (Hot Potato Pattern - Inherently Safe):**
```move
module flash::loan {
    // Receipt cannot be dropped - MUST be returned
    struct Receipt { amount: u64 }
    
    public fun borrow(amount: u64): (Coin, Receipt) {
        let coin = withdraw_from_pool(amount);
        let receipt = Receipt { amount };
        (coin, receipt)  // Both must be handled
    }
    
    public fun repay(coin: Coin, receipt: Receipt) {
        let Receipt { amount } = receipt;  // Consume receipt
        assert!(coin::value(&coin) >= amount, E_INSUFFICIENT);
        deposit_to_pool(coin);
    }
    // If Receipt isn't consumed, transaction fails!
}
```

---

## 🔨 Development Workflow

### Solidity Workflow
```
1. Write .sol files
2. Compile with solc/hardhat
3. Deploy with scripts
4. Interact via ethers.js
5. Verify on Etherscan
```

### Move Workflow
```
1. Write .move files
2. Compile: cedra move compile
3. Test: cedra move test
4. Deploy: cedra move publish
5. Interact: cedra move run / SDK
6. View on Cedrascan
```

### CLI Comparison

| Action | Hardhat | Cedra CLI |
|--------|---------|-----------|
| Init project | `npx hardhat init` | `cedra move init --name myproject` |
| Compile | `npx hardhat compile` | `cedra move compile` |
| Test | `npx hardhat test` | `cedra move test` |
| Deploy | `npx hardhat run deploy.js` | `cedra move publish` |
| Call function | ethers.js script | `cedra move run --function-id ...` |

---

## 📝 Migration Checklist

When migrating a Solidity contract to Move:

- [ ] Identify all storage variables → Convert to resources
- [ ] Map data types → Use Move equivalents
- [ ] Convert mappings → Use account resources or tables
- [ ] Remove reentrancy guards → Not needed
- [ ] Update access control → Use signer pattern
- [ ] Convert events → Use Move events
- [ ] Write unit tests → Use `#[test]` attributes
- [ ] Test on devnet → Deploy and verify

---

## 🔗 Resources

- [Cedra for Solidity Developers](https://docs.cedra.network/for-solidity-developers)
- [Move Book](https://move-book.com/)
- [Cedra SDK](https://github.com/cedra-labs/ts-sdk)

---

## ➡️ Next Steps

1. Complete the [Interactive Tutorial](../../01-interactive-tutorial/)
2. Build your first [Counter Contract](../../contracts/counter/)
3. Create a [Fungible Token](../../contracts/token/)
