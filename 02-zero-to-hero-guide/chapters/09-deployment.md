# Chapter 9: Deployment & Best Practices

> **Take Your DApp from Testnet to Production**

---

## 🎯 What You'll Learn

- Prepare contracts for mainnet deployment
- Security best practices and auditing
- Gas optimization techniques
- Upgradeability patterns
- Monitoring and maintenance

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality

```markdown
□ All unit tests passing
□ 100% test coverage for critical functions
□ No compiler warnings
□ Code reviewed by peers
□ Documentation complete
□ Error messages are clear
□ Events emit for all state changes
```

### ✅ Security Review

```markdown
□ Access control verified
□ No reentrancy vulnerabilities
□ Integer overflow/underflow handled
□ Input validation complete
□ Resource ownership verified
□ Signer capabilities protected
□ No hardcoded secrets
```

### ✅ Testing Complete

```markdown
□ Unit tests
□ Integration tests
□ Testnet deployment tested
□ Frontend integration verified
□ Edge cases covered
□ Failure scenarios tested
```

---

## 🔐 Security Best Practices

### 1. Access Control

```move
module secure::access_control {
    use std::signer;
    use cedra_std::object::{Self, Object, ExtendRef};
    
    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_PAUSED: u64 = 3;
    
    struct AdminConfig has key {
        owner: address,
        admins: vector<address>,
        paused: bool
    }
    
    /// Only owner can call
    fun assert_owner(caller: &signer, config: &AdminConfig) {
        assert!(
            signer::address_of(caller) == config.owner,
            E_NOT_OWNER
        );
    }
    
    /// Owner or admin can call
    fun assert_admin(caller: &signer, config: &AdminConfig) {
        let addr = signer::address_of(caller);
        assert!(
            addr == config.owner || 
            vector::contains(&config.admins, &addr),
            E_NOT_ADMIN
        );
    }
    
    /// Contract must not be paused
    fun assert_not_paused(config: &AdminConfig) {
        assert!(!config.paused, E_PAUSED);
    }
    
    /// Emergency pause
    public entry fun pause(admin: &signer) acquires AdminConfig {
        let config = borrow_global_mut<AdminConfig>(@secure);
        assert_admin(admin, config);
        config.paused = true;
    }
    
    /// Resume operations
    public entry fun unpause(owner: &signer) acquires AdminConfig {
        let config = borrow_global_mut<AdminConfig>(@secure);
        assert_owner(owner, config);
        config.paused = false;
    }
}
```

### 2. Input Validation

```move
module secure::validation {
    const E_ZERO_AMOUNT: u64 = 100;
    const E_INVALID_ADDRESS: u64 = 101;
    const E_AMOUNT_TOO_LARGE: u64 = 102;
    const E_EMPTY_STRING: u64 = 103;
    
    const MAX_TRANSFER: u64 = 1_000_000_00000000; // 1M tokens
    
    /// Validate amount is reasonable
    fun validate_amount(amount: u64) {
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(amount <= MAX_TRANSFER, E_AMOUNT_TOO_LARGE);
    }
    
    /// Validate address is not zero
    fun validate_address(addr: address) {
        assert!(addr != @0x0, E_INVALID_ADDRESS);
    }
    
    /// Validate string is not empty
    fun validate_string(s: &String) {
        assert!(string::length(s) > 0, E_EMPTY_STRING);
    }
    
    /// Example: Secure transfer
    public entry fun secure_transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        // Validate inputs
        validate_address(to);
        validate_amount(amount);
        
        // Prevent self-transfer
        assert!(signer::address_of(from) != to, E_INVALID_ADDRESS);
        
        // Perform transfer
        // ...
    }
}
```

### 3. Safe Math Operations

```move
module secure::safe_math {
    const E_OVERFLOW: u64 = 200;
    const E_UNDERFLOW: u64 = 201;
    const E_DIVIDE_BY_ZERO: u64 = 202;
    
    /// Safe addition
    public fun safe_add(a: u64, b: u64): u64 {
        let result = a + b;
        assert!(result >= a, E_OVERFLOW);
        result
    }
    
    /// Safe subtraction
    public fun safe_sub(a: u64, b: u64): u64 {
        assert!(a >= b, E_UNDERFLOW);
        a - b
    }
    
    /// Safe multiplication
    public fun safe_mul(a: u64, b: u64): u64 {
        if (a == 0 || b == 0) return 0;
        let result = a * b;
        assert!(result / a == b, E_OVERFLOW);
        result
    }
    
    /// Safe division
    public fun safe_div(a: u64, b: u64): u64 {
        assert!(b > 0, E_DIVIDE_BY_ZERO);
        a / b
    }
}
```

---

## ⛽ Gas Optimization

### 1. Minimize Storage Operations

```move
module optimized::storage {
    // ❌ Bad: Multiple storage reads
    public fun bad_example(addr: address): u64 acquires Data {
        let data = borrow_global<Data>(addr);
        let a = data.field_a;
        let b = data.field_b;
        let data2 = borrow_global<Data>(addr); // Redundant read
        a + b + data2.field_c
    }
    
    // ✅ Good: Single storage read
    public fun good_example(addr: address): u64 acquires Data {
        let data = borrow_global<Data>(addr);
        data.field_a + data.field_b + data.field_c
    }
}
```

### 2. Batch Operations

```move
module optimized::batch {
    /// ❌ Bad: Multiple transactions
    public entry fun transfer_one(from: &signer, to: address, amount: u64) {
        // One transfer per transaction
    }
    
    /// ✅ Good: Batch transfers
    public entry fun transfer_batch(
        from: &signer,
        recipients: vector<address>,
        amounts: vector<u64>
    ) {
        let len = vector::length(&recipients);
        assert!(len == vector::length(&amounts), E_LENGTH_MISMATCH);
        
        let i = 0;
        while (i < len) {
            let to = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            // Transfer logic
            i = i + 1;
        };
    }
}
```

### 3. Use Appropriate Data Structures

```move
module optimized::data_structures {
    use cedra_std::smart_table::{Self, SmartTable};
    use cedra_std::smart_vector::{Self, SmartVector};
    
    struct OptimizedStorage has key {
        // Use SmartTable for large key-value mappings
        balances: SmartTable<address, u64>,
        
        // Use SmartVector for large lists
        holders: SmartVector<address>,
    }
}
```

---

## 🔄 Upgradeability Pattern

### Proxy Pattern

```move
module upgradeable::v1 {
    use std::signer;
    
    friend upgradeable::proxy;
    
    struct Data has key, store {
        value: u64,
        version: u64
    }
    
    /// Initialize - called by proxy
    public(friend) fun init_internal(account: &signer, value: u64) {
        move_to(account, Data { value, version: 1 });
    }
    
    /// Logic function
    public(friend) fun increment_internal(account: address) acquires Data {
        let data = borrow_global_mut<Data>(account);
        data.value = data.value + 1;
    }
    
    /// Read function
    public fun get_value(account: address): u64 acquires Data {
        borrow_global<Data>(account).value
    }
}

module upgradeable::proxy {
    use std::signer;
    use upgradeable::v1;
    
    struct ProxyConfig has key {
        admin: address,
        implementation_version: u64
    }
    
    /// Entry points delegate to implementation
    public entry fun initialize(account: &signer, value: u64) {
        v1::init_internal(account, value);
    }
    
    public entry fun increment(account: &signer) {
        v1::increment_internal(signer::address_of(account));
    }
}
```

---

## 🚀 Deployment Steps

### 1. Testnet Final Testing

```powershell
# Run all tests
cedra move test

# Deploy to testnet
cedra move publish --profile testnet

# Verify deployment
cedra move view --function-id "MODULE::get_version"
```

### 2. Mainnet Deployment

```powershell
# Create mainnet profile
cedra init --profile mainnet --network mainnet

# Fund mainnet account
# Transfer CEDRA from exchange to your mainnet address

# Check balance
cedra account balance --profile mainnet

# Deploy with caution
cedra move publish --profile mainnet --gas-unit-price 100
```

### 3. Verify Deployment

```powershell
# Check module exists
cedra move view --function-id "YOUR_ADDRESS::module::view_function" --profile mainnet

# Test basic functionality
cedra move run --function-id "YOUR_ADDRESS::module::init" --profile mainnet
```

---

## 📊 Post-Deployment Monitoring

### 1. Set Up Alerts

```typescript
// monitoring/alerts.ts
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

const cedra = new Cedra(new CedraConfig({ network: Network.MAINNET }));

async function monitorContract() {
  const MODULE = "YOUR_ADDRESS::your_module";
  
  // Check key metrics
  const [totalSupply] = await cedra.view({
    payload: {
      function: `${MODULE}::get_total_supply`,
      functionArguments: []
    }
  });
  
  console.log(`Total Supply: ${totalSupply}`);
  
  // Alert if unusual
  if (Number(totalSupply) > THRESHOLD) {
    await sendAlert("Supply exceeded threshold!");
  }
}

// Run every 5 minutes
setInterval(monitorContract, 5 * 60 * 1000);
```

### 2. Transaction Logging

```typescript
// monitoring/logger.ts
async function watchEvents() {
  const events = await cedra.getAccountEventsByEventType({
    accountAddress: MODULE_ADDRESS,
    eventType: `${MODULE_ADDRESS}::events::TransferEvent`
  });
  
  for (const event of events) {
    console.log(JSON.stringify(event, null, 2));
    // Log to database or monitoring service
  }
}
```

---

## 📝 Documentation Checklist

### For Users

```markdown
□ README with project overview
□ Installation instructions
□ Usage examples
□ API reference
□ FAQ section
□ Troubleshooting guide
```

### For Developers

```markdown
□ Architecture overview
□ Contract interaction guide
□ Deployment instructions
□ Testing guide
□ Contributing guidelines
□ Security policy
```

### Example README Structure

```markdown
# Project Name

## Overview
Brief description of what your project does.

## Quick Start
\```bash
npm install your-package
\```

## Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| Token | 0x... | ERC20-like token |
| NFT | 0x... | NFT collection |

## Usage

### Connecting
\```typescript
import { YourSDK } from 'your-package';
const sdk = new YourSDK({ network: 'mainnet' });
\```

### Basic Operations
\```typescript
// Example code
\```

## Security
Report vulnerabilities to security@yourproject.com

## License
MIT
```

---

## 🛡️ Security Audit Preparation

### What Auditors Look For

1. **Access Control** - Who can call what?
2. **State Management** - Is state consistent?
3. **Math Operations** - Overflow/underflow?
4. **External Calls** - Are they safe?
5. **Resource Handling** - Proper creation/destruction?

### Prepare Documentation

```markdown
# Security Audit Package

## 1. Project Overview
- Purpose and goals
- Key features
- Architecture diagram

## 2. Contract Inventory
- List of all modules
- Dependencies
- Permissions matrix

## 3. Key Flows
- User flows with diagrams
- Admin flows
- Emergency procedures

## 4. Known Issues
- Accepted risks
- Mitigations in place

## 5. Test Results
- Coverage report
- Test output
```

---

## ✨ Launch Checklist

### One Week Before

```markdown
□ Final code freeze
□ Complete audit fixes
□ Update all documentation
□ Prepare announcement
□ Set up monitoring
□ Test emergency procedures
```

### Day of Launch

```markdown
□ Double-check mainnet config
□ Verify sufficient gas
□ Deploy contracts
□ Verify all functions
□ Monitor for issues
□ Announce launch
```

### After Launch

```markdown
□ Monitor metrics
□ Respond to issues
□ Gather user feedback
□ Plan improvements
□ Keep dependencies updated
```

---

## 🎉 Congratulations!

You've completed the Zero-to-Hero Guide! You now know how to:

- ✅ Write Move smart contracts
- ✅ Test and debug effectively
- ✅ Build frontend integrations
- ✅ Deploy to mainnet safely
- ✅ Monitor and maintain your DApp

---

## 📚 Additional Resources

- [Cedra Documentation](https://docs.cedra.dev)
- [Move Language Book](https://move-language.github.io/move/)
- [Cedra Discord](https://discord.gg/cedra)
- [GitHub Examples](https://github.com/cedra-labs)

---

## 🏆 What's Next?

1. **Build your own project** - Apply what you've learned
2. **Join the community** - Share and learn
3. **Contribute** - Help improve the ecosystem
4. **Stay updated** - Follow Cedra announcements

**Happy Building! 🚀**

[← Back to Table of Contents](../README.md)
