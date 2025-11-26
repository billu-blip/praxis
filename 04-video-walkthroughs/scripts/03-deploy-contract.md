# Episode 3: Deploying Your First Smart Contract

> **Video Script - 5 Minutes**

---

## 🎬 VIDEO INFO

- **Title**: "Deploy Your First Cedra Smart Contract in 5 Minutes"
- **Duration**: 5:00
- **Thumbnail Text**: "DEPLOY 🚀"
- **Tags**: cedra, move, deploy, smart contracts, tutorial, blockchain

---

## 📝 SCRIPT

### [0:00-0:15] HOOK

**[SCREEN: Terminal with deployment animation]**

**NARRATOR:**
"Ready to deploy your first smart contract to a real blockchain? In the next 5 minutes, we'll write, compile, deploy, and interact with a counter contract on Cedra testnet. Let's go!"

---

### [0:15-0:45] CONTEXT

**[SCREEN: Split - Code editor and terminal]**

**NARRATOR:**
"We'll build a simple counter that each user can increment. It's the 'Hello World' of smart contracts, but it teaches you everything you need to know about the deployment workflow."

**[SHOW WORKFLOW DIAGRAM]:**
```
Write Code → Compile → Test → Deploy → Interact
```

---

### [0:45-1:30] CREATE PROJECT

**[SCREEN: Terminal]**

**NARRATOR:**
"First, let's create a new Move project."

**[TYPE ON SCREEN]:**
```powershell
mkdir counter
cd counter
cedra move init --name counter
```

**NARRATOR:**
"This creates a Move package with the standard structure. Now let's write our counter module."

**[SCREEN: VS Code - Create new file]**
**[TYPE ON SCREEN]:** `sources/simple_counter.move`

```move
module counter::simple_counter {
    use std::signer;
    
    struct Counter has key {
        value: u64
    }
    
    public entry fun initialize(account: &signer) {
        move_to(account, Counter { value: 0 });
    }
    
    public entry fun increment(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }
    
    #[view]
    public fun get_count(addr: address): u64 acquires Counter {
        borrow_global<Counter>(addr).value
    }
}
```

**NARRATOR:**
"30 lines of code - that's it! This creates a counter resource stored in each user's account."

---

### [1:30-2:15] COMPILE

**[SCREEN: Terminal]**

**NARRATOR:**
"Let's compile our contract."

**[TYPE ON SCREEN]:**
```powershell
cedra move compile --named-addresses counter=default
```

**[SHOW OUTPUT]:**
```
Compiling...
Including dependency...
Built package 'counter'
```

**NARRATOR:**
"No errors! The `--named-addresses` flag maps our module name to our account address. Now let's run tests."

**[TYPE ON SCREEN]:**
```powershell
cedra move test --named-addresses counter=default
```

**[SHOW OUTPUT]:**
```
Running tests...
All tests passed!
```

---

### [2:15-3:00] DEPLOY

**[SCREEN: Terminal]**

**NARRATOR:**
"Now the exciting part - deployment!"

**[TYPE ON SCREEN]:**
```powershell
cedra move publish --named-addresses counter=default --assume-yes
```

**[SHOW OUTPUT - Animated]:**
```
Building...
Package size: 1.2KB
Transaction submitted!
Transaction hash: 0x7a8f...
Waiting for confirmation...
✓ Transaction executed successfully!
```

**NARRATOR:**
"Boom! Our contract is now live on Cedra testnet. Anyone in the world can interact with it. Let's try it out."

---

### [3:00-3:45] INTERACT

**[SCREEN: Terminal]**

**NARRATOR:**
"First, let's initialize our counter."

**[TYPE ON SCREEN]:**
```powershell
cedra move run --function-id default::simple_counter::initialize
```

**[SHOW OUTPUT]:**
```
✓ Transaction executed successfully
Gas used: 0.00043 CEDRA
```

**NARRATOR:**
"Now increment it a few times."

**[TYPE ON SCREEN]:**
```powershell
cedra move run --function-id default::simple_counter::increment
cedra move run --function-id default::simple_counter::increment
cedra move run --function-id default::simple_counter::increment
```

**NARRATOR:**
"And check the value using a view function - this is free!"

**[TYPE ON SCREEN]:**
```powershell
cedra move view --function-id default::simple_counter::get_count --args address:YOUR_ADDRESS
```

**[SHOW OUTPUT]:**
```
[3]
```

**NARRATOR:**
"Three! It works perfectly."

---

### [3:45-4:30] EXPLORER

**[SCREEN: Browser - Cedrascan]**

**NARRATOR:**
"Let's verify on the block explorer. Head to cedrascan.com and paste your transaction hash."

**[SHOW: Explorer with transaction details]**

**NARRATOR:**
"You can see:
- The function called
- Gas used
- State changes
- And the sender address

This is your proof that you've deployed a real smart contract to a real blockchain!"

---

### [4:30-4:50] SUMMARY

**[SCREEN: Recap with checkmarks]**

**NARRATOR:**
"To recap, we:
✅ Created a Move project
✅ Wrote a counter module
✅ Compiled and tested
✅ Deployed to testnet
✅ Interacted via CLI

That's the complete workflow. You're now a Cedra developer!"

---

### [4:50-5:00] CTA

**[SCREEN: Subscribe animation]**

**NARRATOR:**
"Next video, we'll cover the most common errors you'll encounter and how to fix them. Subscribe so you don't miss it!"

**[END SCREEN: Subscribe button, next video thumbnail]**

---

## 📋 SCREEN RECORDINGS NEEDED

1. Terminal: Creating project structure
2. VS Code: Writing counter module
3. Terminal: Compile with success output
4. Terminal: Test with passing results
5. Terminal: Publish with transaction hash
6. Terminal: Run and view functions
7. Browser: Cedrascan transaction view

## 🖼️ THUMBNAIL DESIGN

- Rocket emoji launching from terminal
- Text: "DEPLOY 🚀"
- Code snippet in background
- Green "SUCCESS" badge
