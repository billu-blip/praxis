# Module 5: NFT Collections

# Lesson 1: NFT Basics

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand what NFTs are on Cedra
- Learn the Digital Asset Standard
- Create your first NFT collection
- Understand tokens vs NFTs

---

## 📖 What are NFTs?

NFTs (Non-Fungible Tokens) are unique digital assets:

| Fungible (Tokens) | Non-Fungible (NFTs) |
|-------------------|---------------------|
| All identical | Each unique |
| Divisible | Indivisible |
| Interchangeable | One-of-a-kind |
| Like currency | Like collectibles |

Example: 1 USDC = 1 USDC (fungible), but CryptoPunk #1 ≠ CryptoPunk #2 (non-fungible)

---

## 🏗️ Cedra Digital Asset Standard

Cedra uses the **Digital Asset (DA) Standard** for NFTs:

```move
use cedra_token_objects::collection;  // For collections
use cedra_token_objects::token;       // For individual NFTs
use cedra_token_objects::aptos_token; // High-level helper
```

Structure:
```
Collection (parent)
├── Token 1 (unique NFT)
├── Token 2 (unique NFT)
├── Token 3 (unique NFT)
└── ... up to max_supply
```

---

## 📦 Creating a Collection

Collections are containers for NFTs:

```move
module nft_addr::my_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object;
    use cedra_token_objects::collection;
    use cedra_token_objects::royalty;

    const COLLECTION_NAME: vector<u8> = b"My First NFT Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A collection of unique digital art";
    const COLLECTION_URI: vector<u8> = b"https://example.com/collection.json";
    const MAX_SUPPLY: u64 = 1000;
    const ROYALTY_BPS: u64 = 500;  // 5%

    /// Create the collection (run once)
    public entry fun create_collection(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        
        // Set up royalty (5% to creator)
        let royalty = royalty::create(
            ROYALTY_BPS,   // numerator (500)
            10000,         // denominator (10000 = 100%)
            creator_addr   // payee
        );
        
        // Create collection
        collection::create_fixed_collection(
            creator,
            string::utf8(COLLECTION_DESCRIPTION),
            MAX_SUPPLY,                           // Maximum NFTs allowed
            string::utf8(COLLECTION_NAME),
            option::some(royalty),
            string::utf8(COLLECTION_URI)
        );
    }
    
    #[view]
    public fun collection_exists(creator: address): bool {
        let collection_addr = collection::create_collection_address(
            &creator,
            &string::utf8(COLLECTION_NAME)
        );
        object::object_exists<collection::Collection>(collection_addr)
    }
}
```

---

## 🎨 Collection Types

Cedra supports different collection types:

### 1. Fixed Collection
```move
// Fixed supply - no more than max_supply can ever be minted
collection::create_fixed_collection(
    creator,
    description,
    max_supply,    // Hard cap
    name,
    royalty,
    uri
);
```

### 2. Unlimited Collection
```move
// No supply cap
collection::create_unlimited_collection(
    creator,
    description,
    name,
    royalty,
    uri
);
```

### 3. Collection with Refs (Most Flexible)
```move
// Returns refs for later mutation
let constructor_ref = collection::create_collection(
    creator,
    description,
    name,
    royalty,
    uri
);

// Get mutation capability
let mutator_ref = collection::generate_mutator_ref(&constructor_ref);
```

---

## 🖼️ Minting NFTs

Create individual tokens in your collection:

```move
module nft_addr::mintable_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_token_objects::collection::{Self, Collection};
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"My NFT Collection";

    struct TokenRefs has key {
        // Store refs for later mutations
        mutator_ref: token::MutatorRef,
        burn_ref: token::BurnRef,
    }
    
    /// Mint a new NFT
    public entry fun mint(
        creator: &signer,
        name: String,
        description: String,
        uri: String
    ) {
        let constructor_ref = token::create(
            creator,
            string::utf8(COLLECTION_NAME),
            description,
            name,
            option::none(),  // No royalty override (uses collection's)
            uri
        );
        
        // Generate refs for future modifications
        let mutator_ref = token::generate_mutator_ref(&constructor_ref);
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        
        // Store refs on the token object
        let token_signer = object::generate_signer(&constructor_ref);
        move_to(&token_signer, TokenRefs {
            mutator_ref,
            burn_ref
        });
    }
    
    /// Get token address from name
    #[view]
    public fun get_token_address(creator: address, name: String): address {
        token::create_token_address(
            &creator,
            &string::utf8(COLLECTION_NAME),
            &name
        )
    }
}
```

---

## 📋 NFT Metadata

NFTs have essential metadata:

```move
#[view]
public fun get_nft_info(token_obj: Object<Token>): (String, String, String, address) {
    let name = token::name(token_obj);
    let description = token::description(token_obj);
    let uri = token::uri(token_obj);
    let creator = token::creator(token_obj);
    
    (name, description, uri, creator)
}
```

The URI typically points to a JSON file:
```json
{
    "name": "Cool NFT #1",
    "description": "A very cool NFT",
    "image": "https://example.com/nft1.png",
    "attributes": [
        {"trait_type": "Rarity", "value": "Legendary"},
        {"trait_type": "Color", "value": "Gold"}
    ]
}
```

---

## 🎮 Interactive Exercise

### Challenge: Create Your First Collection

```move
module nft_addr::my_collection {
    use std::string::{Self, String};
    use std::option;
    use cedra_token_objects::collection;
    use cedra_token_objects::royalty;

    // TODO: Define your collection constants
    const COLLECTION_NAME: vector<u8> = b"";        // Your collection name
    const COLLECTION_DESC: vector<u8> = b"";        // Description
    const MAX_SUPPLY: u64 = 0;                      // How many NFTs?
    const ROYALTY_PERCENT: u64 = 0;                 // Royalty percentage
    
    /// Create your collection
    public entry fun create(creator: &signer) {
        // TODO: Set up royalty
        
        // TODO: Create the collection
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module nft_addr::my_collection {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_token_objects::collection;
    use cedra_token_objects::royalty;

    const COLLECTION_NAME: vector<u8> = b"Cedra Learners";
    const COLLECTION_DESC: vector<u8> = b"NFTs for completing Cedra tutorials";
    const COLLECTION_URI: vector<u8> = b"https://cedra.dev/nft/collection.json";
    const MAX_SUPPLY: u64 = 10000;
    const ROYALTY_BPS: u64 = 250;  // 2.5%
    
    public entry fun create(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        
        // Set up 2.5% royalty
        let royalty = royalty::create(
            ROYALTY_BPS,
            10000,
            creator_addr
        );
        
        // Create fixed collection
        collection::create_fixed_collection(
            creator,
            string::utf8(COLLECTION_DESC),
            MAX_SUPPLY,
            string::utf8(COLLECTION_NAME),
            option::some(royalty),
            string::utf8(COLLECTION_URI)
        );
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What makes an NFT "non-fungible"?

- A) It can be divided
- B) Each one is unique
- C) It has no value
- D) It can be copied

<details>
<summary>Answer</summary>
**B) Each one is unique** - Non-fungible means each token is distinct and not interchangeable.
</details>

### Question 2
In Cedra's Digital Asset Standard, what is the relationship between collections and tokens?

- A) Tokens contain collections
- B) They are independent
- C) Collections contain tokens
- D) They are the same thing

<details>
<summary>Answer</summary>
**C) Collections contain tokens** - A collection is a parent container for individual NFT tokens.
</details>

### Question 3
What does a 500 BPS royalty mean?

- A) 500%
- B) 50%
- C) 5%
- D) 0.5%

<details>
<summary>Answer</summary>
**C) 5%** - BPS (basis points): 500/10000 = 0.05 = 5%
</details>

---

## 📝 Key Takeaways

1. **NFTs are unique** - each token is one-of-a-kind
2. **Collections organize NFTs** - like folders for files
3. **Fixed vs Unlimited** - choose supply model
4. **Royalties built-in** - earn on secondary sales
5. **Metadata is external** - URI points to JSON

---

## 🚀 What's Next?

In the next lesson, we'll dive into **Advanced Minting** - conditional mints, allowlists, and more!

[Continue to Lesson 2: Advanced Minting →](./lesson-02-advanced-minting.md)
