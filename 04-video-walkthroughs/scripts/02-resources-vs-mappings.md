# Episode 2: Understanding Move Resources vs Solidity Mappings

> **Video Script - 5 Minutes**

---

## 🎬 VIDEO INFO

- **Title**: "Move Resources vs Solidity Mappings - The Mental Shift That Changes Everything"
- **Duration**: 5:00
- **Thumbnail Text**: "RESOURCES 🔄 MAPPINGS"
- **Tags**: cedra, move, solidity, resources, mappings, blockchain, tutorial

---

## 📝 SCRIPT

### [0:00-0:15] HOOK

**[SCREEN: Side-by-side Solidity and Move code]**

**NARRATOR:**
"Coming from Ethereum? The biggest mental shift in Move isn't the syntax - it's understanding why resources replace mappings. In 5 minutes, I'll show you why this changes everything about smart contract security."

---

### [0:15-0:45] THE PROBLEM WITH MAPPINGS

**[SCREEN: Solidity code with animation]**

**NARRATOR:**
"In Solidity, you think in terms of ledgers. Here's a typical token contract:"

**[SHOW CODE]:**
```solidity
contract Token {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**NARRATOR:**
"Looks simple, right? But there's a fundamental issue. The balance isn't connected to the user - it's just a number in the contract's storage. If you make a mistake in your logic, tokens can be created from nothing or destroyed accidentally."

**[ANIMATION: Show ledger being edited arbitrarily]**

---

### [0:45-1:30] ENTER RESOURCES

**[SCREEN: Move code with physical object animation]**

**NARRATOR:**
"Move flips this completely. Instead of a ledger, think of resources as physical objects that users actually OWN."

**[SHOW CODE]:**
```move
module token::coin {
    struct Coin has store {
        value: u64
    }
    
    struct CoinStore has key {
        coin: Coin
    }
}
```

**NARRATOR:**
"See the difference? Each user literally HAS a Coin in their account. It's not a number in someone else's contract - it's THEIR object, in THEIR storage."

**[ANIMATION: Show coins physically existing in user accounts]**

**NARRATOR:**
"And here's the magic - Move won't let you accidentally create or destroy resources. The compiler enforces this."

---

### [1:30-2:15] LINEAR TYPES IN ACTION

**[SCREEN: Side-by-side comparison]**

**NARRATOR:**
"Let's see this in action. Watch what happens when we try to cheat:"

**[SHOW SOLIDITY - BAD]:**
```solidity
function exploit() public {
    balances[msg.sender] = 1000000; // Works! 😱
}
```

**[SHOW MOVE - PROTECTED]:**
```move
fun exploit(account: &signer) {
    let fake_coin = Coin { value: 1000000 }; 
    // ERROR: Coin cannot be created without 'copy' ability!
}
```

**NARRATOR:**
"In Solidity, anyone with write access can modify the ledger. In Move, you literally cannot create a Coin unless the module gives you permission. The type system enforces economics."

---

### [2:15-3:00] THE TRANSFER PATTERN

**[SCREEN: Code comparison animation]**

**NARRATOR:**
"Now let's look at transfers. Solidity style:"

**[SHOW SOLIDITY]:**
```solidity
function transfer(address to, uint256 amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;  // Edit sender's entry
    balances[to] += amount;          // Edit receiver's entry
}
```

**NARRATOR:**
"Two separate operations - subtract here, add there. Move style:"

**[SHOW MOVE]:**
```move
public fun transfer(from: &signer, to: address, amount: u64) {
    // Physically WITHDRAW coin from sender
    let coin = withdraw(from, amount);
    
    // Physically DEPOSIT coin to receiver  
    deposit(to, coin);
}
```

**NARRATOR:**
"The coin is extracted, then deposited. It physically moves! You can't just edit numbers - you have to actually handle the resource. If you withdraw but forget to deposit, the compiler yells at you."

---

### [3:00-3:45] THE ABILITIES SYSTEM

**[SCREEN: Abilities chart]**

**NARRATOR:**
"How does Move enforce this? Through abilities. Every struct declares what operations are allowed:"

**[SHOW TABLE]:**
```
┌──────────┬─────────────────────────────────────┐
│ Ability  │ Meaning                             │
├──────────┼─────────────────────────────────────┤
│ copy     │ Can be duplicated                   │
│ drop     │ Can be discarded (ignored)          │
│ store    │ Can be saved inside other structs   │
│ key      │ Can be stored at top level          │
└──────────┴─────────────────────────────────────┘
```

**[SHOW CODE]:**
```move
// A token that CANNOT be copied or dropped
struct Coin has store {
    value: u64
}

// The compiler enforces these rules at compile time!
```

**NARRATOR:**
"Because Coin doesn't have 'copy', you can't duplicate it. Because it doesn't have 'drop', you can't throw it away. Money that can't be counterfeited or lost - enforced by the type system."

---

### [3:45-4:30] REAL-WORLD IMPACT

**[SCREEN: Security comparison]**

**NARRATOR:**
"What does this mean for security? Let's compare vulnerabilities:"

**[SHOW TABLE]:**
```
┌─────────────────────┬──────────────┬─────────────┐
│ Vulnerability       │ Solidity     │ Move        │
├─────────────────────┼──────────────┼─────────────┤
│ Integer Overflow    │ Fixed in 0.8 │ Always Safe │
│ Reentrancy          │ Major Risk   │ Impossible  │
│ Double Spending     │ Possible     │ Impossible  │
│ Asset Creation      │ Logic Bug    │ Impossible  │
│ Asset Destruction   │ Logic Bug    │ Impossible  │
└─────────────────────┴──────────────┴─────────────┘
```

**NARRATOR:**
"The resource model eliminates entire categories of bugs. Not by being careful - by making them literally impossible to write."

---

### [4:30-4:50] SUMMARY

**[SCREEN: Key takeaways]**

**NARRATOR:**
"To summarize:
- Solidity: Balances are entries in a ledger
- Move: Resources are objects users physically own
- The type system enforces economic rules at compile time
- Entire categories of exploits become impossible"

---

### [4:50-5:00] CTA

**[SCREEN: Channel subscribe animation]**

**NARRATOR:**
"In the next episode, we'll deploy our first Move smart contract. Hit subscribe so you don't miss it. And if this helped, smash that like button. See you in the next one!"

**[END SCREEN: Subscribe button, next video thumbnail]**

---

## 📋 B-ROLL SUGGESTIONS

- Animation: Ledger entries being edited vs coins moving between wallets
- Diagram: User accounts containing resource "boxes"
- Terminal: Compiler error when trying to copy/drop a resource
- Side-by-side: Solidity exploit vs Move compiler rejection

## 🖼️ THUMBNAIL DESIGN

- Split screen: Mapping ledger on left (red X), Resource coins on right (green check)
- Text: "RESOURCES 🔄 MAPPINGS"
- Cedra logo in corner
