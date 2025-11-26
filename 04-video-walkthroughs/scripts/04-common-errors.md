# Episode 4: Common Errors and How to Fix Them

> **Video Script - 5 Minutes**

---

## 🎬 VIDEO INFO

- **Title**: "Cedra/Move Errors SOLVED - Top 5 Beginner Mistakes"
- **Duration**: 5:00
- **Thumbnail Text**: "FIX MOVE ERRORS 🔧"
- **Tags**: cedra, move, debugging, errors, smart contracts, tutorial

---

## 📝 SCRIPT

### [0:00-0:15] HOOK

**[SCREEN: Error messages flashing]**

**NARRATOR:**
"Getting cryptic error messages in Move? Don't worry - everyone does. In the next 5 minutes, I'll show you the 5 most common errors and exactly how to fix them."

---

### [0:15-0:30] CONTEXT

**[SCREEN: Code with error highlights]**

**NARRATOR:**
"Move's compiler is strict for a reason - it catches bugs before they become exploits. But those error messages can be confusing at first. Let's decode them."

---

### [0:30-1:15] ERROR 1: RESOURCE NOT EXISTS

**[SCREEN: Code editor with error]**

**NARRATOR:**
"Error number one: 'Resource does not exist at address'. This happens when you try to access a resource that hasn't been created."

**[SHOW ERROR CODE]:**
```move
public entry fun increment(account: &signer) acquires Counter {
    let addr = signer::address_of(account);
    let counter = borrow_global_mut<Counter>(addr);  // ERROR!
    counter.value = counter.value + 1;
}
```

**[SHOW ERROR MESSAGE]:**
```
ABORTED: RESOURCE_NOT_EXISTS (code: 0x1)
```

**NARRATOR:**
"The fix? Always check if the resource exists first, or provide an initialization function."

**[SHOW FIX]:**
```move
public entry fun increment(account: &signer) acquires Counter {
    let addr = signer::address_of(account);
    // Add existence check
    assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
    
    let counter = borrow_global_mut<Counter>(addr);
    counter.value = counter.value + 1;
}
```

**NARRATOR:**
"Better yet, call an initialize function first that creates the resource."

---

### [1:15-2:00] ERROR 2: MISSING ACQUIRES

**[SCREEN: Compile error]**

**NARRATOR:**
"Error two: 'Missing acquires annotation'. This is a compile-time error that's easy to fix."

**[SHOW ERROR CODE]:**
```move
public fun get_count(addr: address): u64 {
    borrow_global<Counter>(addr).value  // COMPILE ERROR!
}
```

**[SHOW ERROR MESSAGE]:**
```
error: missing acquires clause
```

**NARRATOR:**
"Move requires you to declare which global resources a function reads or writes. Just add acquires with the struct name:"

**[SHOW FIX]:**
```move
public fun get_count(addr: address): u64 acquires Counter {
    borrow_global<Counter>(addr).value  // Works!
}
```

**NARRATOR:**
"Think of it as documentation for the compiler - and for other developers reading your code."

---

### [2:00-2:45] ERROR 3: ABILITY CONSTRAINTS

**[SCREEN: Compile error about abilities]**

**NARRATOR:**
"Error three: 'The type does not have the required ability'. This relates to Move's ability system."

**[SHOW ERROR CODE]:**
```move
struct MyToken {  // Missing abilities!
    value: u64
}

public fun store_token(account: &signer, token: MyToken) {
    move_to(account, token);  // ERROR!
}
```

**[SHOW ERROR MESSAGE]:**
```
error: type MyToken does not have the 'key' ability
```

**NARRATOR:**
"The move_to function requires the struct to have the 'key' ability. Here's the fix:"

**[SHOW FIX]:**
```move
struct MyToken has key {  // Add 'key' ability
    value: u64
}
```

**NARRATOR:**
"Common ability requirements:
- 'key' for storing at top level
- 'store' for nested storage
- 'copy' for duplicating
- 'drop' for discarding"

---

### [2:45-3:30] ERROR 4: INSUFFICIENT BALANCE

**[SCREEN: Runtime error]**

**NARRATOR:**
"Error four: 'Insufficient balance for transaction fee'. This isn't a code error - it's an account issue."

**[SHOW ERROR MESSAGE]:**
```
INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE
```

**NARRATOR:**
"You don't have enough CEDRA to pay for gas. The fix is simple - get more test tokens."

**[SHOW FIX - Terminal]:**
```powershell
cedra account fund-with-faucet
```

**NARRATOR:**
"Or use the web faucet. Each testnet faucet request gives you plenty of tokens for development."

**[SHOW: Faucet website briefly]**

---

### [3:30-4:15] ERROR 5: NOT AUTHORIZED

**[SCREEN: Runtime abort]**

**NARRATOR:**
"Error five: 'Not authorized' or similar custom errors. These usually mean you're calling a function you shouldn't."

**[SHOW ERROR]:**
```
ABORTED with code: E_NOT_AUTHORIZED (1)
```

**NARRATOR:**
"This happens when you try to do something restricted - like minting tokens when you're not the admin."

**[SHOW PROBLEM CODE]:**
```move
// This checks if caller is owner
assert!(signer::address_of(account) == @admin, E_NOT_AUTHORIZED);
```

**NARRATOR:**
"The fix depends on the contract. Either:
1. Use the correct account
2. Call from the admin address
3. Or the contract needs to grant you permission first"

**[SHOW: Using correct account in CLI]:**
```powershell
cedra move run \
    --function-id default::token::mint \
    --profile admin  # Use admin profile
```

---

### [4:15-4:45] BONUS: DEBUGGING TIPS

**[SCREEN: Tips list]**

**NARRATOR:**
"Quick debugging tips:
- Read the full error message
- Check Cedrascan for transaction details
- Use the CLI with --verbose flag
- Add more assert statements during development
- Test locally before deploying"

---

### [4:45-5:00] SUMMARY & CTA

**[SCREEN: Recap with checkmarks]**

**NARRATOR:**
"Now you know how to fix:
1. Resource not exists - check with exists()
2. Missing acquires - add the annotation  
3. Ability errors - add required abilities
4. Insufficient balance - use the faucet
5. Not authorized - use correct account

These cover 90% of beginner issues. If you hit something else, drop a comment!"

**[SCREEN: Subscribe animation]**

**NARRATOR:**
"Subscribe for more Move tips, and check out episode 5 where we build a complete DApp. See you there!"

---

## 📋 B-ROLL CHECKLIST

- [ ] Error messages appearing
- [ ] Code being fixed
- [ ] Terminal commands
- [ ] Faucet website
- [ ] Cedrascan explorer

## 🔗 DESCRIPTION LINKS

```
🔗 Resources:
- Cedra Documentation: https://docs.cedra.network/
- Block Explorer: https://cedrascan.com/
- Testnet Faucet: https://faucet.cedra.dev/

🐛 Common Error Codes:
- E_RESOURCE_NOT_EXISTS
- E_NOT_AUTHORIZED
- E_INSUFFICIENT_BALANCE
- INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE

📺 More Videos:
- Ep 3: Deploy Your First Contract
- Ep 5: Build a DApp
```
