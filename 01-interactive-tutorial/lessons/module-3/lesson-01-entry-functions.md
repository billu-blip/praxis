# Lesson 1: Entry Functions - Transaction Entry Points

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand what entry functions are
- Know when to use `entry` vs regular functions
- Work with the `signer` type for authentication
- Build transaction-ready functions

---

## 📖 What are Entry Functions?

**Entry functions** are the doorways into your smart contract. They can be called directly from transactions (like API endpoints).

```move
/// This function CAN be called from a transaction
public entry fun do_something(account: &signer) {
    // Transaction logic
}

/// This function CANNOT be called directly from a transaction
public fun helper_function(): u64 {
    42
}
```

### The `entry` Keyword

| Function Type | Can Call from TX | Can Call from Move | Returns Values |
|---------------|------------------|-------------------|----------------|
| `public entry fun` | ✅ Yes | ✅ Yes | ❌ No (void only) |
| `public fun` | ❌ No | ✅ Yes | ✅ Yes |
| `fun` (private) | ❌ No | ✅ Same module only | ✅ Yes |

---

## 🔐 The Signer Type

The `signer` is how you know who is calling your function. It proves authentication.

```move
module my_addr::auth_example {
    use std::signer;
    
    struct UserData has key {
        value: u64
    }
    
    /// Only the caller can create their own data
    public entry fun create_data(account: &signer, value: u64) {
        let addr = signer::address_of(account);
        
        let data = UserData { value };
        move_to(account, data);
    }
    
    /// Only the owner can update their data
    public entry fun update_data(account: &signer, new_value: u64) acquires UserData {
        let addr = signer::address_of(account);
        
        let data = borrow_global_mut<UserData>(addr);
        data.value = new_value;
    }
}
```

### Key `signer` Functions

```move
use std::signer;

// Get the address from a signer
let addr: address = signer::address_of(account);

// In Cedra Framework, also available:
// use cedra_framework::account;
// let addr = account::get_signer_address(account);
```

---

## 📋 Entry Function Rules

### Rule 1: No Return Values

Entry functions cannot return values (except for errors):

```move
// ❌ Wrong: entry functions can't return
public entry fun get_value(): u64 {
    42
}

// ✅ Correct: use view functions for queries
#[view]
public fun get_value(): u64 {
    42
}

// ✅ Correct: entry function with no return
public entry fun set_value(account: &signer, value: u64) acquires Data {
    let data = borrow_global_mut<Data>(signer::address_of(account));
    data.value = value;
}
```

### Rule 2: Allowed Parameter Types

Entry functions can only accept certain types:

| Type | Allowed? | Example |
|------|----------|---------|
| `&signer` | ✅ Yes | `account: &signer` |
| Primitives | ✅ Yes | `amount: u64` |
| `vector<u8>` | ✅ Yes | `name: vector<u8>` |
| `String` | ✅ Yes | `title: String` |
| `address` | ✅ Yes | `recipient: address` |
| `Object<T>` | ✅ Yes | `token: Object<Token>` |
| Custom structs | ❌ No | Can't pass directly |

### Rule 3: Multiple Signers

You can have multiple signers for multi-party transactions:

```move
/// Two-party agreement
public entry fun create_agreement(
    party_a: &signer,
    party_b: &signer,
    terms: vector<u8>
) {
    let addr_a = signer::address_of(party_a);
    let addr_b = signer::address_of(party_b);
    
    // Both parties must sign the transaction
    // Store agreement under party_a
    move_to(party_a, Agreement { 
        party_a: addr_a, 
        party_b: addr_b, 
        terms 
    });
}
```

---

## 🏗️ Building a Complete Entry Point

Let's build a voting system with proper entry functions:

```move
module my_addr::voting {
    use std::signer;
    use std::vector;
    
    /// A poll with options
    struct Poll has key {
        question: vector<u8>,
        options: vector<vector<u8>>,
        votes: vector<u64>,
        voters: vector<address>
    }
    
    const E_ALREADY_VOTED: u64 = 1;
    const E_INVALID_OPTION: u64 = 2;
    const E_POLL_NOT_FOUND: u64 = 3;
    
    /// Create a new poll (entry point)
    public entry fun create_poll(
        creator: &signer,
        question: vector<u8>,
        options: vector<vector<u8>>
    ) {
        let num_options = vector::length(&options);
        let votes = vector::empty<u64>();
        
        // Initialize vote counts to 0
        let i = 0;
        while (i < num_options) {
            vector::push_back(&mut votes, 0);
            i = i + 1;
        };
        
        let poll = Poll {
            question,
            options,
            votes,
            voters: vector::empty<address>()
        };
        
        move_to(creator, poll);
    }
    
    /// Cast a vote (entry point)
    public entry fun vote(
        voter: &signer,
        poll_creator: address,
        option_index: u64
    ) acquires Poll {
        let voter_addr = signer::address_of(voter);
        
        assert!(exists<Poll>(poll_creator), E_POLL_NOT_FOUND);
        
        let poll = borrow_global_mut<Poll>(poll_creator);
        
        // Check valid option
        assert!(option_index < vector::length(&poll.options), E_INVALID_OPTION);
        
        // Check not already voted
        let already_voted = vector::contains(&poll.voters, &voter_addr);
        assert!(!already_voted, E_ALREADY_VOTED);
        
        // Record vote
        vector::push_back(&mut poll.voters, voter_addr);
        let current_votes = vector::borrow_mut(&mut poll.votes, option_index);
        *current_votes = *current_votes + 1;
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Tip Jar

Create a tip jar contract with entry functions:

```move
module my_addr::tip_jar {
    use std::signer;
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    
    struct TipJar has key {
        total_tips: u64,
        owner: address
    }
    
    // TODO: Implement these entry functions
    
    /// Create a tip jar for the caller
    public entry fun create_tip_jar(account: &signer) {
        // Your code here
    }
    
    /// Send a tip (transfer coins)
    public entry fun send_tip(
        tipper: &signer,
        jar_owner: address,
        amount: u64
    ) {
        // Your code here
    }
    
    /// Withdraw all tips (only owner)
    public entry fun withdraw_tips(owner: &signer) {
        // Your code here
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::tip_jar {
    use std::signer;
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    
    struct TipJar has key {
        total_tips: u64,
        owner: address
    }
    
    const E_NOT_OWNER: u64 = 1;
    const E_JAR_EXISTS: u64 = 2;
    const E_NO_JAR: u64 = 3;
    
    public entry fun create_tip_jar(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<TipJar>(addr), E_JAR_EXISTS);
        
        let jar = TipJar {
            total_tips: 0,
            owner: addr
        };
        move_to(account, jar);
    }
    
    public entry fun send_tip(
        tipper: &signer,
        jar_owner: address,
        amount: u64
    ) acquires TipJar {
        assert!(exists<TipJar>(jar_owner), E_NO_JAR);
        
        // Transfer coins
        coin::transfer<CedraCoin>(tipper, jar_owner, amount);
        
        // Update tip counter
        let jar = borrow_global_mut<TipJar>(jar_owner);
        jar.total_tips = jar.total_tips + amount;
    }
    
    public entry fun withdraw_tips(owner: &signer) acquires TipJar {
        let addr = signer::address_of(owner);
        assert!(exists<TipJar>(addr), E_NO_JAR);
        
        // Reset counter (coins already in owner's account)
        let jar = borrow_global_mut<TipJar>(addr);
        jar.total_tips = 0;
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
Can entry functions return values?

- A) Yes, any type
- B) Yes, only primitives
- C) No, they must be void
- D) Only if marked with `#[view]`

<details>
<summary>Answer</summary>
**C) No, they must be void** - Entry functions cannot return values. Use view functions for queries.
</details>

### Question 2
Which parameter type is NOT allowed in entry functions?

- A) `&signer`
- B) `u64`
- C) `vector<u8>`
- D) Custom struct `MyData`

<details>
<summary>Answer</summary>
**D) Custom struct `MyData`** - Entry functions can only accept primitives, signers, strings, addresses, and objects.
</details>

---

## 📝 Key Takeaways

1. **`entry`** = callable from transactions
2. **`&signer`** = proves who's calling
3. **No returns** from entry functions
4. **Limited param types** (primitives, vector, address, Object)
5. Use **view functions** for queries

---

## 🚀 What's Next?

In the next lesson, we'll learn about **View Functions** - gas-free queries for reading blockchain state.

[Continue to Lesson 2: View Functions →](./lesson-02-view-functions.md)
