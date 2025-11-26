# Rust to Move Migration Guide

> **A Complete Guide for Solana Developers Transitioning to Cedra**

---

## 📖 Table of Contents

1. [Mindset Shift](#-mindset-shift)
2. [Ownership vs Resources](#-ownership-vs-resources)
3. [Account Model Comparison](#-account-model-comparison)
4. [Type System](#-type-system)
5. [Program Structure](#-program-structure)
6. [Common Patterns](#-common-patterns)
7. [Development Workflow](#-development-workflow)

---

## 🧠 Mindset Shift

### Familiar Territory

Good news! Move and Rust share many concepts:
- Strong type systems
- Ownership semantics
- No garbage collection
- Compile-time safety

### Key Differences

| Aspect | Solana (Rust) | Cedra (Move) |
|--------|---------------|--------------|
| **Account Model** | Separate data accounts | Resources in accounts |
| **Program Calls** | CPI with account validation | Direct module calls |
| **Parallelism** | Manual account locking | Automatic (Block-STM) |
| **Upgrades** | BPF upgradeable | Native module upgrades |
| **Serialization** | Borsh/Anchor | Built-in |

---

## 🔄 Ownership vs Resources

### Rust Ownership

```rust
// Rust: Ownership transferred, value dropped at end of scope
fn transfer_ownership() {
    let data = String::from("hello");
    let moved = data;  // data is now invalid
    // data cannot be used here
    // moved is dropped at end of scope
}
```

### Move Resources

```move
// Move: Resources must be explicitly handled
fun transfer_resource() {
    let coin = Coin { value: 100 };
    let moved = coin;  // coin is now invalid
    // coin cannot be used here
    // moved MUST be stored, returned, or explicitly destroyed
    // Cannot just "drop" at end of scope!
}
```

### The Key Difference

In Rust, when a value goes out of scope, it's **automatically dropped**.
In Move, resources **cannot be dropped** unless explicitly allowed.

```move
// This WON'T compile - Coin lacks 'drop' ability
struct Coin has store {
    value: u64
}

fun bad_function() {
    let coin = Coin { value: 100 };
    // ERROR: coin would be dropped but lacks 'drop' ability
}

// This WILL compile - explicitly handling the resource
fun good_function(recipient: address) {
    let coin = Coin { value: 100 };
    deposit(recipient, coin);  // Resource properly handled
}
```

---

## 👥 Account Model Comparison

### Solana Account Model

```rust
// Solana: Data lives in separate accounts
#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

// Program receives account references
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}
```

### Move Account Model

```move
// Move: Resources stored directly in user accounts
module counter::counter {
    struct Counter has key {
        count: u64,
    }
    
    // No account list needed - resources are in the signer's account
    public entry fun increment(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        let counter = borrow_global_mut<Counter>(addr);
        counter.count = counter.count + 1;
    }
}
```

### Comparison

| Aspect | Solana | Cedra |
|--------|--------|-------|
| Data Location | Separate PDA accounts | Inside user accounts |
| Account Setup | Create PDAs with seeds | `move_to` resource |
| Account Passing | Explicit in instruction | Implicit from address |
| Rent | Required for data accounts | No rent needed |
| Reallocation | Manual space management | Automatic |

---

## 📊 Type System

### Rust → Move Type Mapping

| Rust | Move | Notes |
|------|------|-------|
| `u8` | `u8` | Same |
| `u16` | `u16` | Same |
| `u32` | `u32` | Same |
| `u64` | `u64` | Most common |
| `u128` | `u128` | Same |
| `i8, i16, i32, i64` | N/A | No signed integers in Move |
| `bool` | `bool` | Same |
| `String` | `String` | From `std::string` |
| `Vec<T>` | `vector<T>` | Similar functionality |
| `Pubkey` | `address` | 32 bytes both |
| `Option<T>` | `Option<T>` | From `std::option` |
| `Result<T, E>` | N/A | Use `assert!` for errors |

### Structs Comparison

**Rust:**
```rust
#[derive(BorshSerialize, BorshDeserialize)]
pub struct TokenAccount {
    pub owner: Pubkey,
    pub balance: u64,
    pub is_frozen: bool,
}
```

**Move:**
```move
struct TokenAccount has key, store {
    owner: address,
    balance: u64,
    is_frozen: bool,
}
```

### Error Handling

**Rust:**
```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(
        ctx.accounts.from.balance >= amount,
        ErrorCode::InsufficientBalance
    );
    // ...
}
```

**Move:**
```move
const E_INSUFFICIENT_BALANCE: u64 = 1;
const E_UNAUTHORIZED: u64 = 2;

public entry fun withdraw(account: &signer, amount: u64) acquires Balance {
    let balance = borrow_global<Balance>(signer::address_of(account));
    assert!(balance.value >= amount, E_INSUFFICIENT_BALANCE);
    // ...
}
```

---

## 🏗️ Program Structure

### Solana Program Structure

```rust
// lib.rs
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }
    
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 32)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}
```

### Move Module Structure

```move
// counter.move
module counter::counter {
    use std::signer;
    
    struct Counter has key {
        count: u64,
    }
    
    const E_NOT_INITIALIZED: u64 = 1;
    
    public entry fun initialize(account: &signer) {
        move_to(account, Counter { count: 0 });
    }
    
    public entry fun increment(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_NOT_INITIALIZED);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.count = counter.count + 1;
    }
    
    #[view]
    public fun get_count(addr: address): u64 acquires Counter {
        borrow_global<Counter>(addr).count
    }
}
```

### Key Structural Differences

| Aspect | Solana (Anchor) | Cedra (Move) |
|--------|-----------------|--------------|
| Entry Point | `#[program]` module | `public entry fun` |
| Account Validation | `#[derive(Accounts)]` | `exists<T>()`, `assert!` |
| Space Management | Manual `space = ...` | Automatic |
| PDA Derivation | `seeds = [...]` | `object::create_named_object` |
| CPI | `invoke_signed!` | Direct module calls |

---

## 🔄 Common Patterns

### Token Transfer

**Solana (SPL Token):**
```rust
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    let cpi_accounts = SplTransfer {
        from: ctx.accounts.from_ata.to_account_info(),
        to: ctx.accounts.to_ata.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
```

**Move (Fungible Asset):**
```move
public entry fun transfer(
    from: &signer,
    to: address,
    amount: u64
) {
    let asset = get_metadata();
    primary_fungible_store::transfer(from, asset, to, amount);
}
```

### PDA / Named Objects

**Solana (PDA):**
```rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"vault", user.key().as_ref()],
    &program_id,
);
```

**Move (Named Object):**
```move
let constructor_ref = object::create_named_object(
    account,
    b"vault"
);
let vault_address = object::address_from_constructor_ref(&constructor_ref);
```

### Cross-Program Invocation vs Module Calls

**Solana (CPI):**
```rust
// Complex - need to pass all accounts
invoke_signed(
    &instruction,
    &[account1, account2, account3],
    &[&[seed, &[bump]]],
)?;
```

**Move (Direct Call):**
```move
// Simple - just call the function
other_module::do_something(param1, param2);
```

---

## 🛠️ Development Workflow

### Solana Workflow
```bash
# Setup
anchor init my_project
cd my_project

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy

# Interact
anchor run script
```

### Cedra Workflow
```bash
# Setup
mkdir my_project && cd my_project
cedra move init --name my_project

# Build
cedra move compile

# Test
cedra move test

# Deploy
cedra move publish

# Interact
cedra move run --function-id ...
```

### Testing Comparison

**Solana (TypeScript tests):**
```typescript
describe("counter", () => {
  it("increments", async () => {
    await program.methods
      .increment()
      .accounts({ counter: counterPda, authority: wallet.publicKey })
      .rpc();
    
    const counter = await program.account.counter.fetch(counterPda);
    expect(counter.count.toNumber()).to.equal(1);
  });
});
```

**Move (inline tests):**
```move
#[test(account = @0x1)]
fun test_increment(account: &signer) acquires Counter {
    initialize(account);
    increment(account);
    
    let count = get_count(signer::address_of(account));
    assert!(count == 1, 1);
}
```

---

## 🚀 Migration Checklist

When migrating from Solana to Cedra:

- [ ] Map Rust types to Move types
- [ ] Convert accounts to resources
- [ ] Replace PDAs with named objects
- [ ] Simplify CPI to direct module calls
- [ ] Remove rent calculations
- [ ] Convert Anchor validation to Move assertions
- [ ] Rewrite tests in Move's test framework
- [ ] Update frontend to use Cedra SDK

---

## 💡 Tips for Rust Developers

1. **Embrace Simplicity**: Move removes many complexities (rent, PDAs, CPI)
2. **Resources ≠ Ownership**: Resources must be explicitly handled
3. **No Signed Integers**: Use `u64` and handle negative cases differently
4. **Direct Calls**: No need for complex CPI patterns
5. **Built-in Serialization**: No Borsh needed

---

## 🔗 Resources

- [Cedra Documentation](https://docs.cedra.network/)
- [Move Book](https://move-book.com/)
- [Cedra SDK](https://github.com/cedra-labs/ts-sdk)

---

## ➡️ Next Steps

1. Complete the [Interactive Tutorial](../../01-interactive-tutorial/)
2. Build your first [Counter Contract](../../contracts/counter/)
3. Explore [Fungible Assets](../../contracts/token/)
