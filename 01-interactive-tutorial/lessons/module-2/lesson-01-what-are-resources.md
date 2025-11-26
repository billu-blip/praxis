# Lesson 1: What are Resources?

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand the concept of resources in Move
- Know why resources are Move's killer feature
- Learn how resources prevent common blockchain bugs
- See real examples of resources in action

---

## 📖 The Problem with Traditional Smart Contracts

In Solidity and most other smart contract languages, tokens and assets are just **numbers in a database**:

```solidity
// Solidity: Assets are just numbers
mapping(address => uint256) public balances;

function transfer(address to, uint256 amount) public {
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

### What Could Go Wrong?

1. **Reentrancy Attacks** - External calls can re-enter your function
2. **Integer Overflow/Underflow** - Numbers wrap around
3. **Double Spending** - Complex logic bugs
4. **Lost Assets** - Sent to wrong addresses forever

---

## 💎 Move's Solution: Resources

In Move, digital assets are treated like **physical objects**:

```move
/// A Coin that can only exist in ONE place at a time
struct Coin has store {
    value: u64
}
```

### The Key Insight

Just like a physical dollar bill:
- ✅ You can **hold** it in your wallet
- ✅ You can **give** it to someone else
- ❌ You **cannot copy** it (no counterfeiting!)
- ❌ You **cannot destroy** it accidentally

Move's compiler and runtime **enforce** these rules automatically!

---

## 🔒 How Resources Work

### Creating a Resource

```move
module my_addr::bank {
    /// Our valuable token
    struct GoldCoin has store, drop {
        value: u64
    }
    
    /// Create a new coin
    public fun mint(value: u64): GoldCoin {
        GoldCoin { value }
    }
}
```

### The "Move" in Move

When you transfer a resource, it **moves**:

```move
public fun transfer(coin: GoldCoin, recipient: &signer) {
    // After this line, 'coin' no longer exists in this scope
    // It has been MOVED to the recipient
    move_to(recipient, coin);
}
```

If you try to use `coin` after moving it:

```move
public fun broken_transfer(coin: GoldCoin, recipient: &signer) {
    move_to(recipient, coin);
    
    // ❌ COMPILE ERROR: 'coin' has already been moved!
    let value = coin.value;
}
```

---

## 🎮 Interactive Exercise

### Your Task: Understand Resource Movement

Look at this code and predict what happens:

```move
struct Treasure has store {
    gems: u64
}

fun process(t: Treasure): u64 {
    let gems = t.gems;
    // What happens to 't' here?
    gems
}
```

<details>
<summary>💡 Click to reveal answer</summary>

The code will **fail to compile** because:
1. We read `t.gems` 
2. But we never properly disposed of `t`
3. `Treasure` doesn't have the `drop` ability, so it can't be implicitly destroyed

**Fix 1**: Add `drop` ability:
```move
struct Treasure has store, drop { gems: u64 }
```

**Fix 2**: Explicitly unpack and discard:
```move
fun process(t: Treasure): u64 {
    let Treasure { gems } = t;  // Destructure the resource
    gems
}
```

</details>

---

## 🧪 Quiz: Check Your Understanding

### Question 1
What happens if you try to copy a resource without the `copy` ability?

- A) It creates a shallow copy
- B) It creates a deep copy
- C) Compilation error
- D) Runtime error

<details>
<summary>Answer</summary>
**C) Compilation error** - Move catches this at compile time, not runtime!
</details>

### Question 2
Why is the "resource model" safer than Solidity's "ledger model"?

- A) It's faster
- B) Resources can only exist in one place, preventing double-spending by design
- C) It uses less gas
- D) It's easier to read

<details>
<summary>Answer</summary>
**B)** - The resource model makes entire classes of bugs impossible at the language level.
</details>

---

## 📝 Key Takeaways

1. **Resources are Move's killer feature** - They represent digital assets as "physical" objects
2. **Move semantics** - Resources move between locations, they don't copy
3. **Compile-time safety** - Bugs are caught before deployment, not after
4. **No reentrancy by design** - Resources can't be in two places at once

---

## 🚀 What's Next?

In the next lesson, we'll learn about **Abilities** - the system that controls what you can do with structs and resources.

[Continue to Lesson 2: Abilities →](./lesson-02-abilities.md)
