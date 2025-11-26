# Lesson 2: View Functions - Gas-Free Queries

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand what view functions are
- Know how to create gas-free read operations
- Use the `#[view]` attribute correctly
- Query blockchain state efficiently

---

## 📖 What are View Functions?

**View functions** are read-only functions that don't modify state. They're:
- ✅ **Free** - No gas cost for users
- ✅ **Fast** - Executed locally, no consensus needed
- ✅ **Safe** - Can't modify any data

```move
#[view]
public fun get_balance(owner: address): u64 acquires Wallet {
    let wallet = borrow_global<Wallet>(owner);
    wallet.balance
}
```

---

## 🏷️ The `#[view]` Attribute

Add `#[view]` before a function to mark it as view-only:

```move
module my_addr::game {
    struct Player has key {
        name: vector<u8>,
        score: u64,
        level: u8
    }
    
    #[view]
    public fun get_score(player: address): u64 acquires Player {
        borrow_global<Player>(player).score
    }
    
    #[view]
    public fun get_level(player: address): u8 acquires Player {
        borrow_global<Player>(player).level
    }
    
    #[view]
    public fun get_player_info(player: address): (vector<u8>, u64, u8) acquires Player {
        let p = borrow_global<Player>(player);
        (p.name, p.score, p.level)
    }
}
```

---

## 📋 View Function Rules

### Rule 1: Read-Only Operations

View functions can only **read** data, never write:

```move
// ✅ Correct: Reading data
#[view]
public fun get_count(addr: address): u64 acquires Counter {
    borrow_global<Counter>(addr).value
}

// ❌ Wrong: Modifying data (won't compile as view)
#[view]
public fun broken_increment(addr: address): u64 acquires Counter {
    let counter = borrow_global_mut<Counter>(addr);  // Error!
    counter.value = counter.value + 1;
    counter.value
}
```

### Rule 2: Can Return Values

Unlike entry functions, view functions CAN return values:

```move
#[view]
public fun get_single(): u64 { 42 }

#[view]
public fun get_multiple(): (u64, bool, address) {
    (100, true, @0x1)
}

#[view]
public fun get_vector(): vector<u64> {
    vector[1, 2, 3, 4, 5]
}
```

### Rule 3: No Signer Required

View functions typically don't need `&signer` since they don't modify state:

```move
// ✅ No signer needed for reading
#[view]
public fun check_exists(addr: address): bool {
    exists<Data>(addr)
}

// ✅ Signer allowed if you need the caller's address
#[view]
public fun my_balance(account: &signer): u64 acquires Wallet {
    let addr = signer::address_of(account);
    borrow_global<Wallet>(addr).balance
}
```

---

## 🔧 Common View Function Patterns

### Pattern 1: Existence Check

```move
#[view]
public fun has_profile(user: address): bool {
    exists<UserProfile>(user)
}

#[view]
public fun is_registered(user: address): bool {
    exists<Registration>(user)
}
```

### Pattern 2: Safe Getters with Defaults

```move
#[view]
public fun get_balance_safe(owner: address): u64 acquires Wallet {
    if (exists<Wallet>(owner)) {
        borrow_global<Wallet>(owner).balance
    } else {
        0  // Default value
    }
}

#[view]
public fun get_level_or_default(player: address): u8 acquires Player {
    if (exists<Player>(player)) {
        borrow_global<Player>(player).level
    } else {
        1  // Default starting level
    }
}
```

### Pattern 3: Computed Values

```move
struct Inventory has key {
    items: vector<Item>,
    max_capacity: u64
}

#[view]
public fun get_remaining_capacity(owner: address): u64 acquires Inventory {
    let inv = borrow_global<Inventory>(owner);
    let used = vector::length(&inv.items);
    inv.max_capacity - (used as u64)
}

#[view]
public fun is_inventory_full(owner: address): bool acquires Inventory {
    get_remaining_capacity(owner) == 0
}
```

### Pattern 4: Aggregate Queries

```move
struct TokenInfo has key {
    total_supply: u128,
    holders_count: u64,
    decimals: u8
}

#[view]
public fun get_token_stats(): (u128, u64, u8) acquires TokenInfo {
    let info = borrow_global<TokenInfo>(@token_addr);
    (info.total_supply, info.holders_count, info.decimals)
}
```

---

## 🌐 Calling View Functions

### From CLI

```bash
# Call a view function
cedra move view \
  --function-id default::game::get_score \
  --args address:0x123...

# Returns JSON result
# { "Result": [42] }
```

### From TypeScript SDK

```typescript
import { Cedra } from '@cedra-labs/ts-sdk';

const cedra = new Cedra();

// Call view function
const result = await cedra.view({
  payload: {
    function: "0x123::game::get_score",
    functionArguments: ["0x456..."]
  }
});

console.log(result[0]);  // Score value
```

### From Python

```python
from cedra_sdk import CedraClient

client = CedraClient("https://testnet.cedra.dev/v1")

result = client.view(
    "0x123::game::get_score",
    ["0x456..."]
)

print(result[0])  # Score value
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Leaderboard

Create view functions for a game leaderboard:

```move
module my_addr::leaderboard {
    use std::vector;
    
    struct Score has store, drop, copy {
        player: address,
        points: u64
    }
    
    struct Leaderboard has key {
        scores: vector<Score>,
        max_entries: u64
    }
    
    // TODO: Implement these view functions
    
    /// Get total number of entries
    #[view]
    public fun get_entry_count(board_addr: address): u64 {
        // Your code here
    }
    
    /// Get top score
    #[view]
    public fun get_top_score(board_addr: address): u64 {
        // Your code here
    }
    
    /// Check if player is on leaderboard
    #[view]
    public fun is_on_leaderboard(board_addr: address, player: address): bool {
        // Your code here
    }
    
    /// Get player's rank (1-indexed, 0 if not found)
    #[view]
    public fun get_player_rank(board_addr: address, player: address): u64 {
        // Your code here
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::leaderboard {
    use std::vector;
    
    struct Score has store, drop, copy {
        player: address,
        points: u64
    }
    
    struct Leaderboard has key {
        scores: vector<Score>,
        max_entries: u64
    }
    
    #[view]
    public fun get_entry_count(board_addr: address): u64 acquires Leaderboard {
        if (!exists<Leaderboard>(board_addr)) {
            return 0
        };
        let board = borrow_global<Leaderboard>(board_addr);
        vector::length(&board.scores)
    }
    
    #[view]
    public fun get_top_score(board_addr: address): u64 acquires Leaderboard {
        if (!exists<Leaderboard>(board_addr)) {
            return 0
        };
        let board = borrow_global<Leaderboard>(board_addr);
        if (vector::is_empty(&board.scores)) {
            return 0
        };
        // Assuming scores are sorted descending
        vector::borrow(&board.scores, 0).points
    }
    
    #[view]
    public fun is_on_leaderboard(board_addr: address, player: address): bool acquires Leaderboard {
        if (!exists<Leaderboard>(board_addr)) {
            return false
        };
        let board = borrow_global<Leaderboard>(board_addr);
        let len = vector::length(&board.scores);
        let i = 0;
        while (i < len) {
            if (vector::borrow(&board.scores, i).player == player) {
                return true
            };
            i = i + 1;
        };
        false
    }
    
    #[view]
    public fun get_player_rank(board_addr: address, player: address): u64 acquires Leaderboard {
        if (!exists<Leaderboard>(board_addr)) {
            return 0
        };
        let board = borrow_global<Leaderboard>(board_addr);
        let len = vector::length(&board.scores);
        let i = 0;
        while (i < len) {
            if (vector::borrow(&board.scores, i).player == player) {
                return i + 1  // 1-indexed rank
            };
            i = i + 1;
        };
        0  // Not found
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What makes view functions "free" to call?

- A) They're faster
- B) They don't modify state, so no consensus is needed
- C) They use less memory
- D) They're cached

<details>
<summary>Answer</summary>
**B)** - View functions don't change state, so they can be executed locally without going through consensus.
</details>

### Question 2
Which operation is NOT allowed in a view function?

- A) `borrow_global<T>(addr)`
- B) `exists<T>(addr)`
- C) `borrow_global_mut<T>(addr)`
- D) Returning multiple values

<details>
<summary>Answer</summary>
**C) `borrow_global_mut`** - View functions can only read, not write. Mutable borrows are not allowed.
</details>

### Question 3
Can view functions return complex types?

- A) No, only primitives
- B) Yes, any type
- C) Only vectors
- D) Only types with `copy`

<details>
<summary>Answer</summary>
**B) Yes, any type** - View functions can return tuples, vectors, structs, and complex types.
</details>

---

## 📝 Key Takeaways

1. **`#[view]`** marks read-only functions
2. **Gas-free** for users (executed locally)
3. **Can return values** (unlike entry functions)
4. **No writes allowed** (no `borrow_global_mut`, no `move_to`)
5. Use for **queries** and **state inspection**

---

## 🚀 What's Next?

In the next lesson, we'll learn about **Events** - how to emit logs for frontend apps to track.

[Continue to Lesson 3: Events →](./lesson-03-events.md)
