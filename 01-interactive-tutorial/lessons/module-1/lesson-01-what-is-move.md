# Lesson 1: What is Move?

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand what the Move programming language is
- Know why Move was designed for blockchain development
- Understand the key differences between Move and other smart contract languages
- Be ready to write your first Move code

---

## 📖 Introduction

Welcome to the Cedra Move Tutorial! 🎉

**Move** is a programming language specifically designed for secure blockchain development. Originally created for the Diem (formerly Libra) blockchain, Move has evolved and is now the foundation for several high-performance blockchains, including **Cedra**.

### Why "Move"?

The name "Move" comes from its core concept: **moving digital assets** safely between accounts. Unlike traditional programming where data can be copied freely, Move treats digital assets as **resources** that can only exist in one place at a time.

---

## 🔐 The Resource Model

Imagine you have a physical $100 bill. You can:
- ✅ Give it to someone (transfer)
- ✅ Store it in your wallet (hold)
- ❌ Copy it (counterfeiting is illegal!)
- ❌ Accidentally destroy it (well, you could, but it would be intentional)

Move brings this **physical asset model** to digital assets. In Move:

```move
struct Coin has store {
    value: u64
}
```

This `Coin` is a **resource**. The Move compiler and runtime guarantee that:
- It cannot be duplicated
- It cannot be accidentally destroyed
- It can only exist in one location at a time

---

## 🆚 Move vs. Solidity

If you're coming from Ethereum/Solidity, here's what makes Move different:

| Aspect | Solidity | Move |
|--------|----------|------|
| **Asset Model** | Mappings (bookkeeper) | Resources (physical objects) |
| **Reentrancy** | Must guard against | Impossible by design |
| **Type Safety** | Runtime checks | Compile-time guarantees |
| **Storage** | Global state | Account-based resources |
| **Upgrades** | Proxy patterns | Native upgrade support |

### Example: Token Transfer

**Solidity** (updating ledger entries):
```solidity
mapping(address => uint256) public balances;

function transfer(address to, uint256 amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

**Move** (moving physical resources):
```move
public fun transfer(from: &signer, to: address, amount: u64) {
    // Physically withdraw coin from sender
    let coin = coin::withdraw(from, amount);
    
    // Physically deposit to receiver
    // The coin can only exist in ONE place
    coin::deposit(to, coin);
}
```

---

## 🏗️ Cedra: Move Evolved

Cedra takes the Move language and enhances it with:

1. **Block-STM Parallel Execution**: 10k+ transactions per second
2. **CedraBFT Consensus**: Less than 1 second finality
3. **Native Token Standards**: Safe, upgrade-friendly primitives
4. **Built-in Indexer**: Easy data querying

### Cedra Network Endpoints

```
🚀 Testnet API: https://testnet.cedra.dev/v1
🔧 Devnet API:  https://devnet.cedra.dev/v1
🔎 Explorer:    https://cedrascan.com/
```

---

## 🧪 Quick Quiz

Test your understanding before moving on:

1. **What does the name "Move" refer to?**
   - [ ] Moving fast in development
   - [x] Moving digital assets safely between accounts
   - [ ] A dance move

2. **What is a "resource" in Move?**
   - [ ] A file on your computer
   - [x] A digital asset that cannot be copied or accidentally destroyed
   - [ ] A web API

3. **Why can't reentrancy attacks happen in Move?**
   - [ ] Move is too slow
   - [ ] Move has special guards
   - [x] Resources can only exist in one place at a time

---

## ✅ Lesson Complete!

You now understand the fundamentals of Move and why it's designed for secure blockchain development.

### What's Next?
In **Lesson 2**, we'll write your first Move module and understand the basic structure of Move code.

---

## 📚 Additional Resources

- [Cedra Documentation](https://docs.cedra.network/)
- [The Move Book](https://move-book.com/)
- [What if Assets Were Physical Objects?](https://docs.cedra.network/for-solidity-developers)
