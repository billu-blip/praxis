# Lesson 4: Error Handling - Failing Gracefully

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand how errors work in Move
- Use `assert!` for validation
- Create custom error codes
- Handle edge cases properly

---

## 📖 How Errors Work in Move

In Move, when something goes wrong, the transaction **aborts**. This means:
- ❌ All state changes are reverted
- ❌ Events are not emitted
- ✅ Gas is still consumed
- ✅ An error code is returned

```move
/// This transaction will abort with error code 42
public entry fun will_fail() {
    abort 42
}
```

---

## 🛑 The `abort` Statement

The most basic way to fail:

```move
public entry fun withdraw(account: &signer, amount: u64) acquires Balance {
    let addr = signer::address_of(account);
    let balance = borrow_global<Balance>(addr);
    
    if (balance.value < amount) {
        abort 1  // Error code 1 = insufficient funds
    };
    
    // Continue with withdrawal...
}
```

---

## ✅ The `assert!` Macro

`assert!` is a cleaner way to abort if a condition is false:

```move
// Syntax: assert!(condition, error_code)

public entry fun withdraw(account: &signer, amount: u64) acquires Balance {
    let addr = signer::address_of(account);
    let balance = borrow_global<Balance>(addr);
    
    // If balance < amount, abort with error 1
    assert!(balance.value >= amount, 1);
    
    // Continue with withdrawal...
}
```

### Multiple Assertions

```move
public entry fun transfer(
    from: &signer,
    to: address,
    amount: u64
) acquires Wallet {
    let from_addr = signer::address_of(from);
    
    // Validation chain
    assert!(exists<Wallet>(from_addr), 1);    // Error 1: No wallet
    assert!(exists<Wallet>(to), 2);           // Error 2: Recipient has no wallet
    assert!(from_addr != to, 3);              // Error 3: Can't transfer to self
    
    let wallet = borrow_global_mut<Wallet>(from_addr);
    assert!(wallet.balance >= amount, 4);     // Error 4: Insufficient funds
    assert!(!wallet.is_frozen, 5);            // Error 5: Wallet is frozen
    
    // Transfer logic...
}
```

---

## 🏷️ Named Error Codes

Always use named constants for error codes:

```move
module my_addr::token {
    // ============================================
    // ERROR CODES
    // ============================================
    
    /// Caller is not authorized
    const E_NOT_AUTHORIZED: u64 = 1;
    
    /// Insufficient balance for operation
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    
    /// Account does not exist
    const E_ACCOUNT_NOT_FOUND: u64 = 3;
    
    /// Amount must be greater than zero
    const E_ZERO_AMOUNT: u64 = 4;
    
    /// Account is frozen
    const E_ACCOUNT_FROZEN: u64 = 5;
    
    /// Transfer to self not allowed
    const E_SELF_TRANSFER: u64 = 6;
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires Account {
        let from_addr = signer::address_of(from);
        
        // Clear, self-documenting assertions
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(from_addr != to, E_SELF_TRANSFER);
        assert!(exists<Account>(from_addr), E_ACCOUNT_NOT_FOUND);
        
        let account = borrow_global_mut<Account>(from_addr);
        assert!(!account.frozen, E_ACCOUNT_FROZEN);
        assert!(account.balance >= amount, E_INSUFFICIENT_BALANCE);
        
        // Transfer...
    }
}
```

---

## 📋 Error Code Conventions

### Numbering Strategy

```move
// Option 1: Sequential
const E_NOT_AUTHORIZED: u64 = 1;
const E_NOT_FOUND: u64 = 2;
const E_INVALID_AMOUNT: u64 = 3;

// Option 2: Categorized (recommended for large modules)
// 1-99: Authorization errors
const E_NOT_OWNER: u64 = 1;
const E_NOT_ADMIN: u64 = 2;

// 100-199: Resource errors
const E_NOT_FOUND: u64 = 100;
const E_ALREADY_EXISTS: u64 = 101;

// 200-299: Validation errors
const E_INVALID_AMOUNT: u64 = 200;
const E_ZERO_VALUE: u64 = 201;

// 300-399: State errors
const E_PAUSED: u64 = 300;
const E_FROZEN: u64 = 301;
```

### Naming Convention

```move
// Always prefix with E_
// Use SCREAMING_SNAKE_CASE
// Be descriptive

// ✅ Good
const E_INSUFFICIENT_BALANCE: u64 = 1;
const E_AUCTION_ALREADY_ENDED: u64 = 2;
const E_BID_TOO_LOW: u64 = 3;

// ❌ Bad
const ERR1: u64 = 1;           // Not descriptive
const notEnough: u64 = 2;      // Wrong case
const INSUFFICIENT: u64 = 3;    // Missing E_ prefix
```

---

## 🔄 Error Handling Patterns

### Pattern 1: Guard Clauses

Check all preconditions first:

```move
public entry fun process_order(
    user: &signer,
    order_id: u64,
    quantity: u64
) acquires Order, Inventory {
    let user_addr = signer::address_of(user);
    
    // Guard clauses at the top
    assert!(exists<Order>(user_addr), E_ORDER_NOT_FOUND);
    assert!(quantity > 0, E_INVALID_QUANTITY);
    assert!(quantity <= MAX_QUANTITY, E_QUANTITY_TOO_LARGE);
    
    let order = borrow_global<Order>(user_addr);
    assert!(order.id == order_id, E_ORDER_MISMATCH);
    assert!(order.status == STATUS_PENDING, E_ORDER_NOT_PENDING);
    
    // Main logic (all preconditions passed)
    // ...
}
```

### Pattern 2: Existence Checks

Always check before accessing:

```move
#[view]
public fun get_balance_safe(owner: address): u64 acquires Wallet {
    if (!exists<Wallet>(owner)) {
        return 0
    };
    borrow_global<Wallet>(owner).balance
}

public entry fun must_have_wallet(owner: address) acquires Wallet {
    assert!(exists<Wallet>(owner), E_WALLET_NOT_FOUND);
    // Now safe to borrow
    let wallet = borrow_global<Wallet>(owner);
    // ...
}
```

### Pattern 3: Validation Functions

Extract validation into reusable functions:

```move
/// Validate transfer parameters
fun validate_transfer(from: address, to: address, amount: u64) acquires Wallet {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert!(from != to, E_SELF_TRANSFER);
    assert!(exists<Wallet>(from), E_SENDER_NOT_FOUND);
    assert!(exists<Wallet>(to), E_RECIPIENT_NOT_FOUND);
    
    let wallet = borrow_global<Wallet>(from);
    assert!(wallet.balance >= amount, E_INSUFFICIENT_BALANCE);
    assert!(!wallet.frozen, E_WALLET_FROZEN);
}

public entry fun transfer(from: &signer, to: address, amount: u64) acquires Wallet {
    let from_addr = signer::address_of(from);
    
    // All validation in one place
    validate_transfer(from_addr, to, amount);
    
    // Clean transfer logic
    let from_wallet = borrow_global_mut<Wallet>(from_addr);
    from_wallet.balance = from_wallet.balance - amount;
    
    let to_wallet = borrow_global_mut<Wallet>(to);
    to_wallet.balance = to_wallet.balance + amount;
}
```

---

## 🎮 Interactive Exercise

### Challenge: Add Error Handling to a Voting System

Fix this voting module with proper error handling:

```move
module my_addr::voting {
    use std::signer;
    use std::vector;
    
    struct Proposal has key {
        creator: address,
        title: vector<u8>,
        yes_votes: u64,
        no_votes: u64,
        voters: vector<address>,
        is_active: bool
    }
    
    // TODO: Add error constants
    
    public entry fun create_proposal(creator: &signer, title: vector<u8>) {
        // TODO: Check title is not empty
        // TODO: Check creator doesn't already have a proposal
        
        let proposal = Proposal {
            creator: signer::address_of(creator),
            title,
            yes_votes: 0,
            no_votes: 0,
            voters: vector::empty(),
            is_active: true
        };
        move_to(creator, proposal);
    }
    
    public entry fun vote(
        voter: &signer,
        proposal_creator: address,
        vote_yes: bool
    ) acquires Proposal {
        // TODO: Check proposal exists
        // TODO: Check proposal is active
        // TODO: Check voter hasn't already voted
        
        let voter_addr = signer::address_of(voter);
        let proposal = borrow_global_mut<Proposal>(proposal_creator);
        
        if (vote_yes) {
            proposal.yes_votes = proposal.yes_votes + 1;
        } else {
            proposal.no_votes = proposal.no_votes + 1;
        };
        
        vector::push_back(&mut proposal.voters, voter_addr);
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::voting {
    use std::signer;
    use std::vector;
    
    struct Proposal has key {
        creator: address,
        title: vector<u8>,
        yes_votes: u64,
        no_votes: u64,
        voters: vector<address>,
        is_active: bool
    }
    
    // Error constants
    const E_PROPOSAL_NOT_FOUND: u64 = 1;
    const E_PROPOSAL_EXISTS: u64 = 2;
    const E_PROPOSAL_NOT_ACTIVE: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_EMPTY_TITLE: u64 = 5;
    
    public entry fun create_proposal(creator: &signer, title: vector<u8>) {
        let creator_addr = signer::address_of(creator);
        
        // Validate title
        assert!(!vector::is_empty(&title), E_EMPTY_TITLE);
        
        // Check no existing proposal
        assert!(!exists<Proposal>(creator_addr), E_PROPOSAL_EXISTS);
        
        let proposal = Proposal {
            creator: creator_addr,
            title,
            yes_votes: 0,
            no_votes: 0,
            voters: vector::empty(),
            is_active: true
        };
        move_to(creator, proposal);
    }
    
    public entry fun vote(
        voter: &signer,
        proposal_creator: address,
        vote_yes: bool
    ) acquires Proposal {
        let voter_addr = signer::address_of(voter);
        
        // Check proposal exists
        assert!(exists<Proposal>(proposal_creator), E_PROPOSAL_NOT_FOUND);
        
        let proposal = borrow_global_mut<Proposal>(proposal_creator);
        
        // Check proposal is active
        assert!(proposal.is_active, E_PROPOSAL_NOT_ACTIVE);
        
        // Check not already voted
        let already_voted = vector::contains(&proposal.voters, &voter_addr);
        assert!(!already_voted, E_ALREADY_VOTED);
        
        // Record vote
        if (vote_yes) {
            proposal.yes_votes = proposal.yes_votes + 1;
        } else {
            proposal.no_votes = proposal.no_votes + 1;
        };
        
        vector::push_back(&mut proposal.voters, voter_addr);
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What happens to state changes when a transaction aborts?

- A) They are saved anyway
- B) They are partially saved
- C) They are completely reverted
- D) Only writes are reverted

<details>
<summary>Answer</summary>
**C) They are completely reverted** - Move transactions are atomic; if they abort, everything is rolled back.
</details>

### Question 2
What is the syntax for `assert!`?

- A) `assert!(error_code, condition)`
- B) `assert!(condition, error_code)`
- C) `assert condition or error_code`
- D) `assert(condition)`

<details>
<summary>Answer</summary>
**B) `assert!(condition, error_code)`** - Condition first, then error code if condition is false.
</details>

---

## 📝 Key Takeaways

1. **`abort N`** = stop transaction with error code N
2. **`assert!(cond, N)`** = abort if condition is false
3. **Named constants** = self-documenting error codes
4. **Guard clauses** = validate early, fail fast
5. **All changes revert** on abort

---

## 🎉 Module 3 Complete!

Congratulations! You've learned:
- ✅ Entry functions for transactions
- ✅ View functions for queries
- ✅ Events for logging
- ✅ Error handling for safety

[Continue to Module 4: Token Creation →](../module-4/lesson-01-fungible-assets.md)
