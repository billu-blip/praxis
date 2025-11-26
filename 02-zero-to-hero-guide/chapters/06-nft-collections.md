# Chapter 6: Building NFT Collections

> **Create Unique Digital Assets with the Digital Asset Standard**

---

## 🎯 What You'll Learn

- Understand the Digital Asset (DA) standard
- Create NFT collections
- Mint unique tokens with metadata
- Implement royalties
- Handle transfers and ownership

---

## 📖 What is the Digital Asset Standard?

The **Digital Asset (DA)** standard is Cedra's NFT framework:

```
Digital Asset Structure:
┌─────────────────────────────────────────┐
│              COLLECTION                  │
│  ┌──────────────────────────────────┐   │
│  │ name: "My NFT Collection"         │   │
│  │ description: "Unique art..."      │   │
│  │ uri: "https://..."                │   │
│  │ max_supply: 10000                 │   │
│  │ royalty: 5%                       │   │
│  └──────────────────────────────────┘   │
│                                          │
│           TOKENS (NFTs)                  │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ #1  │  │ #2  │  │ #3  │  ...        │
│  │name │  │name │  │name │             │
│  │desc │  │desc │  │desc │             │
│  │uri  │  │uri  │  │uri  │             │
│  └─────┘  └─────┘  └─────┘             │
└─────────────────────────────────────────┘
```

---

## 🏗️ Project Setup

```powershell
mkdir nft_project
cd nft_project
cedra move init --name nft_project
```

### Move.toml

```toml
[package]
name = "nft_project"
version = "1.0.0"

[addresses]
nft_addr = "_"

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-network.git", subdir = "cedra-framework", rev = "mainnet" }
```

---

## 📝 Complete NFT Contract

Create `sources/my_nft.move`:

```move
/// A complete NFT collection implementation
module nft_addr::my_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option::{Self, Option};
    use std::vector;
    use cedra_framework::object::{Self, Object, ExtendRef, TransferRef};
    use cedra_framework::event;
    use cedra_token_objects::collection::{Self, Collection, MutatorRef as CollectionMutatorRef};
    use cedra_token_objects::token::{Self, Token, MutatorRef, BurnRef};
    use cedra_token_objects::royalty::{Self, Royalty};

    //==============================
    // CONSTANTS
    //==============================
    
    const COLLECTION_NAME: vector<u8> = b"Cedra Art Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A collection of unique digital artwork on Cedra";
    const COLLECTION_URI: vector<u8> = b"https://cedra.dev/nft/collection.json";
    const MAX_SUPPLY: u64 = 10000;
    const ROYALTY_NUMERATOR: u64 = 500;  // 5%
    const ROYALTY_DENOMINATOR: u64 = 10000;

    //==============================
    // ERROR CODES
    //==============================
    
    const E_NOT_CREATOR: u64 = 1;
    const E_COLLECTION_EXISTS: u64 = 2;
    const E_COLLECTION_NOT_FOUND: u64 = 3;
    const E_MAX_SUPPLY_REACHED: u64 = 4;
    const E_NOT_OWNER: u64 = 5;
    const E_TOKEN_NOT_FOUND: u64 = 6;

    //==============================
    // RESOURCES
    //==============================
    
    /// Collection management capabilities
    struct CollectionConfig has key {
        collection_address: address,
        mutator_ref: CollectionMutatorRef,
        extend_ref: ExtendRef,
        royalty_payee: address,
        total_minted: u64
    }
    
    /// Per-token capabilities (stored on each NFT)
    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct TokenRefs has key {
        mutator_ref: MutatorRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef
    }
    
    /// NFT attributes
    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    struct NFTAttributes has key, copy, drop {
        rarity: String,
        power: u64,
        edition: u64
    }

    //==============================
    // EVENTS
    //==============================
    
    #[event]
    struct CollectionCreated has drop, store {
        creator: address,
        collection: address,
        name: String,
        max_supply: u64
    }
    
    #[event]
    struct NFTMinted has drop, store {
        creator: address,
        collection: address,
        token: address,
        name: String,
        edition: u64
    }
    
    #[event]
    struct NFTBurned has drop, store {
        owner: address,
        token: address
    }
    
    #[event]
    struct NFTTransferred has drop, store {
        from: address,
        to: address,
        token: address
    }

    //==============================
    // INITIALIZATION
    //==============================
    
    /// Create the NFT collection - called automatically on deploy
    fun init_module(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        
        // Set up royalties (5% to creator)
        let royalty = royalty::create(
            ROYALTY_NUMERATOR,
            ROYALTY_DENOMINATOR,
            creator_addr
        );
        
        // Create the collection
        let constructor_ref = collection::create_fixed_collection(
            creator,
            string::utf8(COLLECTION_DESCRIPTION),
            MAX_SUPPLY,
            string::utf8(COLLECTION_NAME),
            option::some(royalty),
            string::utf8(COLLECTION_URI)
        );
        
        // Get the collection address
        let collection_address = object::address_from_constructor_ref(&constructor_ref);
        
        // Generate refs for future modifications
        let mutator_ref = collection::generate_mutator_ref(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        
        // Store collection config
        move_to(creator, CollectionConfig {
            collection_address,
            mutator_ref,
            extend_ref,
            royalty_payee: creator_addr,
            total_minted: 0
        });
        
        event::emit(CollectionCreated {
            creator: creator_addr,
            collection: collection_address,
            name: string::utf8(COLLECTION_NAME),
            max_supply: MAX_SUPPLY
        });
    }

    //==============================
    // VIEW FUNCTIONS
    //==============================
    
    #[view]
    /// Get the collection object
    public fun get_collection(): Object<Collection> {
        let collection_address = collection::create_collection_address(
            &@nft_addr,
            &string::utf8(COLLECTION_NAME)
        );
        object::address_to_object<Collection>(collection_address)
    }
    
    #[view]
    /// Get the collection address
    public fun collection_address(): address {
        object::object_address(&get_collection())
    }
    
    #[view]
    /// Get total minted count
    public fun total_minted(): u64 acquires CollectionConfig {
        borrow_global<CollectionConfig>(@nft_addr).total_minted
    }
    
    #[view]
    /// Get remaining mintable supply
    public fun remaining_supply(): u64 acquires CollectionConfig {
        MAX_SUPPLY - total_minted()
    }
    
    #[view]
    /// Check if collection exists
    public fun collection_exists(): bool {
        let addr = collection::create_collection_address(
            &@nft_addr,
            &string::utf8(COLLECTION_NAME)
        );
        object::object_exists<Collection>(addr)
    }
    
    #[view]
    /// Get token owner
    public fun token_owner(token: Object<Token>): address {
        object::owner(token)
    }
    
    #[view]
    /// Get token address from name
    public fun get_token_address(token_name: String): address {
        token::create_token_address(
            &@nft_addr,
            &string::utf8(COLLECTION_NAME),
            &token_name
        )
    }
    
    #[view]
    /// Get NFT attributes
    public fun get_attributes(token: Object<Token>): (String, u64, u64) acquires NFTAttributes {
        let token_addr = object::object_address(&token);
        let attrs = borrow_global<NFTAttributes>(token_addr);
        (attrs.rarity, attrs.power, attrs.edition)
    }

    //==============================
    // MINTING
    //==============================
    
    /// Mint a new NFT (creator only)
    public entry fun mint(
        creator: &signer,
        name: String,
        description: String,
        uri: String,
        rarity: String,
        power: u64
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        assert!(creator_addr == @nft_addr, E_NOT_CREATOR);
        
        let config = borrow_global_mut<CollectionConfig>(@nft_addr);
        assert!(config.total_minted < MAX_SUPPLY, E_MAX_SUPPLY_REACHED);
        
        // Create the token
        let constructor_ref = token::create(
            creator,
            string::utf8(COLLECTION_NAME),
            description,
            name,
            option::none(),  // Use collection's royalty
            uri
        );
        
        // Generate refs
        let mutator_ref = token::generate_mutator_ref(&constructor_ref);
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);
        
        let token_signer = object::generate_signer(&constructor_ref);
        let token_address = signer::address_of(&token_signer);
        
        // Store token refs
        move_to(&token_signer, TokenRefs {
            mutator_ref,
            burn_ref,
            transfer_ref
        });
        
        // Store custom attributes
        config.total_minted = config.total_minted + 1;
        move_to(&token_signer, NFTAttributes {
            rarity,
            power,
            edition: config.total_minted
        });
        
        event::emit(NFTMinted {
            creator: creator_addr,
            collection: config.collection_address,
            token: token_address,
            name,
            edition: config.total_minted
        });
    }
    
    /// Batch mint multiple NFTs
    public entry fun batch_mint(
        creator: &signer,
        names: vector<String>,
        descriptions: vector<String>,
        uris: vector<String>,
        rarities: vector<String>,
        powers: vector<u64>
    ) acquires CollectionConfig {
        let len = vector::length(&names);
        let i = 0;
        
        while (i < len) {
            mint(
                creator,
                *vector::borrow(&names, i),
                *vector::borrow(&descriptions, i),
                *vector::borrow(&uris, i),
                *vector::borrow(&rarities, i),
                *vector::borrow(&powers, i)
            );
            i = i + 1;
        };
    }

    //==============================
    // TRANSFER
    //==============================
    
    /// Transfer an NFT to another address
    public entry fun transfer(
        from: &signer,
        token: Object<Token>,
        to: address
    ) {
        let from_addr = signer::address_of(from);
        
        // Verify ownership
        assert!(object::owner(token) == from_addr, E_NOT_OWNER);
        
        // Transfer
        object::transfer(from, token, to);
        
        event::emit(NFTTransferred {
            from: from_addr,
            to,
            token: object::object_address(&token)
        });
    }

    //==============================
    // BURNING
    //==============================
    
    /// Burn an NFT (owner only)
    public entry fun burn(
        owner: &signer,
        token: Object<Token>
    ) acquires TokenRefs, NFTAttributes {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&token);
        
        // Verify ownership
        assert!(object::owner(token) == owner_addr, E_NOT_OWNER);
        
        // Clean up resources
        let TokenRefs { mutator_ref: _, burn_ref, transfer_ref: _ } = move_from<TokenRefs>(token_addr);
        let NFTAttributes { rarity: _, power: _, edition: _ } = move_from<NFTAttributes>(token_addr);
        
        // Burn the token
        token::burn(burn_ref);
        
        event::emit(NFTBurned {
            owner: owner_addr,
            token: token_addr
        });
    }

    //==============================
    // ADMIN FUNCTIONS
    //==============================
    
    /// Update collection description (creator only)
    public entry fun update_collection_description(
        creator: &signer,
        new_description: String
    ) acquires CollectionConfig {
        assert!(signer::address_of(creator) == @nft_addr, E_NOT_CREATOR);
        
        let config = borrow_global<CollectionConfig>(@nft_addr);
        collection::set_description(&config.mutator_ref, new_description);
    }
    
    /// Update collection URI (creator only)
    public entry fun update_collection_uri(
        creator: &signer,
        new_uri: String
    ) acquires CollectionConfig {
        assert!(signer::address_of(creator) == @nft_addr, E_NOT_CREATOR);
        
        let config = borrow_global<CollectionConfig>(@nft_addr);
        collection::set_uri(&config.mutator_ref, new_uri);
    }
    
    /// Update token description (creator only)
    public entry fun update_token_description(
        creator: &signer,
        token: Object<Token>,
        new_description: String
    ) acquires TokenRefs {
        assert!(signer::address_of(creator) == @nft_addr, E_NOT_CREATOR);
        
        let token_addr = object::object_address(&token);
        let refs = borrow_global<TokenRefs>(token_addr);
        token::set_description(&refs.mutator_ref, new_description);
    }
    
    /// Update token URI (creator only)
    public entry fun update_token_uri(
        creator: &signer,
        token: Object<Token>,
        new_uri: String
    ) acquires TokenRefs {
        assert!(signer::address_of(creator) == @nft_addr, E_NOT_CREATOR);
        
        let token_addr = object::object_address(&token);
        let refs = borrow_global<TokenRefs>(token_addr);
        token::set_uri(&refs.mutator_ref, new_uri);
    }

    //==============================
    // TESTS
    //==============================
    
    #[test(creator = @nft_addr)]
    fun test_collection_creation(creator: &signer) {
        cedra_framework::account::create_account_for_test(@nft_addr);
        init_module(creator);
        
        assert!(collection_exists(), 0);
    }
    
    #[test(creator = @nft_addr)]
    fun test_mint(creator: &signer) acquires CollectionConfig {
        cedra_framework::account::create_account_for_test(@nft_addr);
        init_module(creator);
        
        mint(
            creator,
            string::utf8(b"Cool NFT #1"),
            string::utf8(b"A very cool NFT"),
            string::utf8(b"https://example.com/nft1.json"),
            string::utf8(b"Legendary"),
            100
        );
        
        assert!(total_minted() == 1, 0);
    }
}
```

---

## 🔍 Key Components Explained

### 1. Collection Creation

```move
collection::create_fixed_collection(
    creator,           // Creator signer
    description,       // Collection description
    MAX_SUPPLY,        // Maximum NFTs (fixed)
    name,              // Collection name
    option::some(royalty),  // Royalty config
    uri                // Collection metadata URI
);
```

### 2. Token Minting

```move
token::create(
    creator,
    collection_name,
    description,
    token_name,       // Must be unique within collection
    option::none(),   // Royalty override (none = use collection's)
    uri
);
```

### 3. Custom Attributes

```move
struct NFTAttributes has key, copy, drop {
    rarity: String,
    power: u64,
    edition: u64
}
```

### 4. Royalties

```move
let royalty = royalty::create(
    500,    // 5% (numerator)
    10000,  // 100% (denominator)
    creator_addr  // Royalty recipient
);
```

---

## 🚀 Deploying Your NFT Collection

```powershell
# Compile
cedra move compile --named-addresses nft_addr=default

# Deploy
cedra move publish --named-addresses nft_addr=default --assume-yes

# Mint an NFT
cedra move run \
  --function-id 'default::my_nft::mint' \
  --args \
    'string:Cool NFT #1' \
    'string:A legendary artwork' \
    'string:https://example.com/nft1.json' \
    'string:Legendary' \
    'u64:100' \
  --assume-yes

# Check total minted
cedra move view \
  --function-id 'default::my_nft::total_minted'
```

---

## 📋 Metadata JSON Format

Your NFT URI should point to a JSON file:

```json
{
    "name": "Cool NFT #1",
    "description": "A legendary digital artwork",
    "image": "https://example.com/images/nft1.png",
    "animation_url": "https://example.com/videos/nft1.mp4",
    "external_url": "https://example.com/nft/1",
    "attributes": [
        {
            "trait_type": "Rarity",
            "value": "Legendary"
        },
        {
            "trait_type": "Power",
            "value": 100
        },
        {
            "trait_type": "Background",
            "value": "Cosmic"
        },
        {
            "trait_type": "Edition",
            "value": 1
        }
    ]
}
```

---

## 🎮 Common NFT Patterns

### Lazy Minting

Let users mint and pay:

```move
public entry fun public_mint(
    minter: &signer,
    name: String,
    uri: String
) acquires CollectionConfig {
    // Charge mint fee
    coin::transfer<CedraCoin>(minter, @nft_addr, MINT_PRICE);
    
    // Mint NFT to user
    let constructor_ref = token::create(...);
    
    // Transfer to minter
    let token = object::object_from_constructor_ref<Token>(&constructor_ref);
    object::transfer_raw(object::generate_signer(&constructor_ref), object::object_address(&token), signer::address_of(minter));
}
```

### Reveal Pattern

Start with hidden metadata, reveal later:

```move
struct RevealConfig has key {
    revealed: bool,
    hidden_uri: String,
    base_uri: String
}

public entry fun reveal(admin: &signer) acquires RevealConfig {
    let config = borrow_global_mut<RevealConfig>(@nft_addr);
    config.revealed = true;
}
```

---

## 📝 Key Takeaways

1. **Collections** are containers for NFTs with shared royalties
2. **Tokens** are unique objects with individual metadata
3. **Capability refs** enable mutations and burning
4. **Custom attributes** can store on-chain game data
5. **Royalties** are enforced at the protocol level

---

## ➡️ Next Steps

In Chapter 7, we'll dive into testing and debugging Move contracts!

[Continue to Chapter 7: Testing & Debugging →](./07-testing-debugging.md)
