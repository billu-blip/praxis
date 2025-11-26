# 📚 Cedra Smart Contract API Documentation

> **Module Address**: `0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4`  
> **Network**: Cedra Testnet  
> **Last Updated**: November 26, 2025

---

## 📋 Table of Contents

1. [Counter Contract](#counter-contract)
2. [Token Contract (Fungible Asset)](#token-contract)
3. [NFT Contract](#nft-contract)
4. [CLI Examples](#cli-examples)
5. [SDK Integration](#sdk-integration)

---

## Counter Contract

**Module**: `simple_counter`  
**Purpose**: Demo counter for tutorials - stores per-user counters

### Entry Functions

#### `initialize()`
Creates a new counter resource for the calling account.

```move
public entry fun initialize(account: &signer)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| account | &signer | The account to initialize counter for |

**Errors**:
- `E_ALREADY_INITIALIZED (1)`: Counter already exists for this account

---

#### `increment()`
Increases the counter value by 1.

```move
public entry fun increment(account: &signer)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| account | &signer | The account whose counter to increment |

**Errors**:
- `E_NOT_INITIALIZED (2)`: Counter not initialized for this account

---

#### `decrement()`
Decreases the counter value by 1 (stops at 0).

```move
public entry fun decrement(account: &signer)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| account | &signer | The account whose counter to decrement |

**Errors**:
- `E_NOT_INITIALIZED (2)`: Counter not initialized for this account

---

#### `reset()`
Resets the counter value to 0.

```move
public entry fun reset(account: &signer)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| account | &signer | The account whose counter to reset |

**Errors**:
- `E_NOT_INITIALIZED (2)`: Counter not initialized for this account

---

### View Functions

#### `get_count(addr)`
Returns the current counter value for an address.

```move
#[view]
public fun get_count(addr: address): u64
```

| Parameter | Type | Description |
|-----------|------|-------------|
| addr | address | The address to query |

**Returns**: `u64` - Current counter value

**Errors**:
- `E_NOT_INITIALIZED (2)`: Counter not initialized

---

#### `has_counter(addr)`
Checks if an address has a counter initialized.

```move
#[view]
public fun has_counter(addr: address): bool
```

| Parameter | Type | Description |
|-----------|------|-------------|
| addr | address | The address to check |

**Returns**: `bool` - True if counter exists

---

## Token Contract

**Module**: `cedra_asset`  
**Purpose**: Fungible Asset (FA) token - ERC-20 equivalent

### Token Metadata

| Property | Value |
|----------|-------|
| Name | Cedra Tutorial Token |
| Symbol | CTT |
| Decimals | 8 |
| Initial Supply | 100,000,000 (1 CTT = 100,000,000 units) |

### Entry Functions

#### `mint(to, amount)`
Mints new tokens to an address (admin only).

```move
public entry fun mint(admin: &signer, to: address, amount: u64)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| admin | &signer | Admin account (module deployer) |
| to | address | Recipient address |
| amount | u64 | Amount to mint (in smallest units) |

**Errors**:
- `E_NOT_OWNER (1)`: Caller is not the admin

---

#### `transfer(from, to, amount)`
Transfers tokens between accounts.

```move
public entry fun transfer(from: &signer, to: address, amount: u64)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| from | &signer | Sender account |
| to | address | Recipient address |
| amount | u64 | Amount to transfer |

---

#### `burn(from, amount)`
Burns tokens from the caller's account.

```move
public entry fun burn(from: &signer, amount: u64)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| from | &signer | Account to burn from |
| amount | u64 | Amount to burn |

---

### View Functions

#### `balance(owner)`
Returns the token balance for an address.

```move
#[view]
public fun balance(owner: address): u64
```

| Parameter | Type | Description |
|-----------|------|-------------|
| owner | address | Address to query |

**Returns**: `u64` - Token balance

---

#### `total_supply()`
Returns the total token supply.

```move
#[view]
public fun total_supply(): u64
```

**Returns**: `u64` - Total supply

---

#### `name()`
Returns the token name.

```move
#[view]
public fun name(): String
```

**Returns**: `String` - "Cedra Tutorial Token"

---

#### `symbol()`
Returns the token symbol.

```move
#[view]
public fun symbol(): String
```

**Returns**: `String` - "CTT"

---

#### `decimals()`
Returns the token decimals.

```move
#[view]
public fun decimals(): u8
```

**Returns**: `u8` - 8

---

## NFT Contract

**Module**: `cedra_nft`  
**Purpose**: NFT collection for tutorials

### Collection Metadata

| Property | Value |
|----------|-------|
| Name | Cedra Tutorial NFTs |
| Description | NFT collection for Cedra Builders Forge tutorial |
| Max Supply | 1,000 |
| Royalty | 5% |

### Entry Functions

#### `mint_nft(name, description, uri, rarity, power)`
Mints a new NFT to the caller.

```move
public entry fun mint_nft(
    account: &signer,
    name: String,
    description: String,
    uri: String,
    rarity: String,
    power: u64
)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| account | &signer | Minter account |
| name | String | NFT name (e.g., "Dragon #1") |
| description | String | NFT description |
| uri | String | Metadata URI |
| rarity | String | Rarity level (Common/Rare/Epic/Legendary) |
| power | u64 | Power attribute (1-100) |

**Errors**:
- `E_MAX_SUPPLY_REACHED (1)`: 1000 NFTs already minted

---

### View Functions

#### `total_minted(creator)`
Returns the number of NFTs minted.

```move
#[view]
public fun total_minted(creator: address): u64
```

| Parameter | Type | Description |
|-----------|------|-------------|
| creator | address | Collection creator address |

**Returns**: `u64` - Number of NFTs minted

---

## CLI Examples

### Counter Operations

```bash
# Initialize counter
cedra move run --function-id default::simple_counter::initialize

# Increment counter
cedra move run --function-id default::simple_counter::increment

# Get count
cedra move view --function-id default::simple_counter::get_count \
  --args address:0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4

# Check if has counter
cedra move view --function-id default::simple_counter::has_counter \
  --args address:0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4
```

### Token Operations

```bash
# Check balance
cedra move view --function-id default::cedra_asset::balance \
  --args address:0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4

# Check total supply
cedra move view --function-id default::cedra_asset::total_supply

# Mint tokens (admin only)
cedra move run --function-id default::cedra_asset::mint \
  --args address:0x... u64:1000000

# Transfer tokens
cedra move run --function-id default::cedra_asset::transfer \
  --args address:0x... u64:500000
```

### NFT Operations

```bash
# Check total minted
cedra move view --function-id default::cedra_nft::total_minted \
  --args address:0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4

# Mint NFT
cedra move run --function-id default::cedra_nft::mint_nft \
  --args string:"My NFT" string:"A cool NFT" string:"https://example.com/nft.json" string:"Rare" u64:75
```

---

## SDK Integration

### TypeScript/JavaScript

```typescript
import { Cedra, CedraConfig, Network } from '@cedra-labs/ts-sdk';

const config = new CedraConfig({ network: Network.TESTNET });
const cedra = new Cedra(config);

const MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4";

// View function call
const result = await cedra.view({
  payload: {
    function: `${MODULE_ADDRESS}::simple_counter::get_count`,
    functionArguments: [accountAddress],
  },
});
console.log("Count:", result[0]);

// Entry function call (transaction)
const transaction = await cedra.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${MODULE_ADDRESS}::simple_counter::increment`,
    functionArguments: [],
  },
});

const pendingTxn = await cedra.signAndSubmitTransaction({
  signer: account,
  transaction,
});

await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
```

### Python

```python
from cedra_sdk import CedraClient

client = CedraClient("https://testnet.cedra.dev/v1")
MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4"

# View function
result = client.view(
    f"{MODULE_ADDRESS}::simple_counter::get_count",
    [account_address]
)
print(f"Count: {result[0]}")

# Entry function
txn = client.submit_transaction(
    account,
    f"{MODULE_ADDRESS}::simple_counter::increment",
    []
)
client.wait_for_transaction(txn.hash)
```

---

## Error Codes

### Counter Contract
| Code | Name | Description |
|------|------|-------------|
| 1 | E_ALREADY_INITIALIZED | Counter already exists |
| 2 | E_NOT_INITIALIZED | Counter not initialized |

### Token Contract
| Code | Name | Description |
|------|------|-------------|
| 1 | E_NOT_OWNER | Caller is not admin |

### NFT Contract
| Code | Name | Description |
|------|------|-------------|
| 1 | E_MAX_SUPPLY_REACHED | 1000 NFTs already minted |

---

## Contract Addresses (Testnet)

| Contract | Module ID |
|----------|-----------|
| Counter | `0x756e...07f4::simple_counter` |
| Token | `0x756e...07f4::cedra_asset` |
| NFT | `0x756e...07f4::cedra_nft` |

**Full Address**: `0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4`

---

## Transaction Hashes (Deployment)

| Contract | Transaction Hash |
|----------|------------------|
| Counter | `0xd99e95e7499195ac6f706467bcf0b8efcdf91c7eb08f3dcaf8c1077247d311b9` |
| Token | `0xe7e9f9262dbfee3a41cda842ae1984c406ad777e1e1e31477df4084f04760f4e` |
| NFT | `0x0fbd4e7f9fa0e18fd2073a38a77fd313ac64566f890886aae988646678e09075` |

**Explorer**: [https://cedrascan.com?network=testnet](https://cedrascan.com?network=testnet)
