# Lesson 4: NFT Burning & Composability

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement NFT burning
- Create composable NFTs (NFTs that own NFTs)
- Build upgrade/evolution systems
- Understand soulbound tokens

---

## 📖 Why Burn NFTs?

Burning permanently destroys NFTs. Use cases:

| Use Case | Example |
|----------|---------|
| Upgrade | Burn 3 Common → Get 1 Rare |
| Redemption | Burn NFT → Claim physical item |
| Game mechanics | Sacrifice card for power |
| Deflationary | Reduce supply over time |

---

## 🔥 Basic NFT Burning

```move
module nft_addr::burnable_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_token_objects::collection;
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Burnable NFT";
    
    const E_NOT_OWNER: u64 = 1;
    const E_NO_BURN_REF: u64 = 2;

    /// Store burn capability on the token
    struct TokenRefs has key {
        burn_ref: token::BurnRef
    }
    
    /// Mint with burn capability
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
            option::none(),
            uri
        );
        
        // Generate burn ref and store it
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        let token_signer = object::generate_signer(&constructor_ref);
        
        move_to(&token_signer, TokenRefs { burn_ref });
    }
    
    /// Owner can burn their NFT
    public entry fun burn(
        owner: &signer,
        token: Object<Token>
    ) acquires TokenRefs {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&token);
        
        // Verify ownership
        assert!(object::owner(token) == owner_addr, E_NOT_OWNER);
        
        // Get burn ref
        assert!(exists<TokenRefs>(token_addr), E_NO_BURN_REF);
        let TokenRefs { burn_ref } = move_from<TokenRefs>(token_addr);
        
        // Burn the token
        token::burn(burn_ref);
    }
}
```

---

## 🔄 Burn-to-Upgrade System

Burn multiple NFTs to get a better one:

```move
module nft_addr::upgrade_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use std::vector;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::event;
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Upgradeable NFT";
    
    const E_NOT_OWNER: u64 = 1;
    const E_WRONG_QUANTITY: u64 = 2;
    const E_WRONG_RARITY: u64 = 3;
    
    const RARITY_COMMON: u8 = 0;
    const RARITY_RARE: u8 = 1;
    const RARITY_EPIC: u8 = 2;
    const RARITY_LEGENDARY: u8 = 3;

    struct NFTMetadata has key {
        rarity: u8,
        burn_ref: token::BurnRef
    }
    
    struct UpgradeConfig has key {
        required_burns: u64,  // How many to burn
        total_upgrades: u64
    }
    
    #[event]
    struct UpgradeEvent has drop, store {
        owner: address,
        burned_count: u64,
        from_rarity: u8,
        to_rarity: u8,
        new_token: address
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, UpgradeConfig {
            required_burns: 3,
            total_upgrades: 0
        });
    }
    
    /// Burn 3 of same rarity → get 1 of next rarity
    public entry fun upgrade(
        owner: &signer,
        tokens_to_burn: vector<Object<Token>>
    ) acquires NFTMetadata, UpgradeConfig {
        let owner_addr = signer::address_of(owner);
        let config = borrow_global_mut<UpgradeConfig>(@nft_addr);
        
        // Verify count
        let count = vector::length(&tokens_to_burn);
        assert!(count == config.required_burns, E_WRONG_QUANTITY);
        
        // Verify ownership and same rarity
        let first_token = vector::borrow(&tokens_to_burn, 0);
        let first_addr = object::object_address(first_token);
        let expected_rarity = borrow_global<NFTMetadata>(first_addr).rarity;
        
        // Can't upgrade legendary
        assert!(expected_rarity < RARITY_LEGENDARY, E_WRONG_RARITY);
        
        let i = 0;
        while (i < count) {
            let token = vector::borrow(&tokens_to_burn, i);
            let token_addr = object::object_address(token);
            
            // Verify ownership
            assert!(object::owner(*token) == owner_addr, E_NOT_OWNER);
            
            // Verify same rarity
            let metadata = borrow_global<NFTMetadata>(token_addr);
            assert!(metadata.rarity == expected_rarity, E_WRONG_RARITY);
            
            i = i + 1;
        };
        
        // Burn all tokens
        let i = 0;
        while (i < count) {
            let token = vector::pop_back(&mut tokens_to_burn);
            let token_addr = object::object_address(&token);
            
            let NFTMetadata { rarity: _, burn_ref } = move_from<NFTMetadata>(token_addr);
            token::burn(burn_ref);
            
            i = i + 1;
        };
        vector::destroy_empty(tokens_to_burn);
        
        // Mint upgraded token
        let new_rarity = expected_rarity + 1;
        let rarity_name = if (new_rarity == RARITY_RARE) {
            b"Rare"
        } else if (new_rarity == RARITY_EPIC) {
            b"Epic"
        } else {
            b"Legendary"
        };
        
        let constructor_ref = token::create(
            owner,
            string::utf8(COLLECTION_NAME),
            string::utf8(rarity_name),
            string::utf8(rarity_name),
            option::none(),
            string::utf8(b"https://example.com/upgraded.json")
        );
        
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        let token_signer = object::generate_signer(&constructor_ref);
        let new_token_addr = signer::address_of(&token_signer);
        
        move_to(&token_signer, NFTMetadata {
            rarity: new_rarity,
            burn_ref
        });
        
        config.total_upgrades = config.total_upgrades + 1;
        
        event::emit(UpgradeEvent {
            owner: owner_addr,
            burned_count: count,
            from_rarity: expected_rarity,
            to_rarity: new_rarity,
            new_token: new_token_addr
        });
    }
}
```

---

## 🎭 Composable NFTs

NFTs that can own other NFTs:

```move
module nft_addr::composable_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use std::vector;
    use cedra_framework::object::{Self, Object, ExtendRef};
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Composable NFT";
    
    const E_NOT_OWNER: u64 = 1;
    const E_EQUIPMENT_FULL: u64 = 2;
    const E_NOT_EQUIPPED: u64 = 3;
    
    const MAX_EQUIPMENT: u64 = 4;

    /// Parent NFT that can hold child NFTs
    struct CharacterNFT has key {
        equipped: vector<address>,  // Addresses of equipped NFTs
        extend_ref: ExtendRef       // To transfer children
    }
    
    /// Child NFT that can be equipped
    struct EquipmentNFT has key {
        equipped_to: option::Option<address>,  // Parent if equipped
        power_boost: u64
    }
    
    /// Create a character NFT (can hold equipment)
    public entry fun create_character(
        creator: &signer,
        name: String
    ) {
        let constructor_ref = token::create(
            creator,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"A composable character"),
            name,
            option::none(),
            string::utf8(b"https://example.com/character.json")
        );
        
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let token_signer = object::generate_signer(&constructor_ref);
        
        move_to(&token_signer, CharacterNFT {
            equipped: vector::empty(),
            extend_ref
        });
    }
    
    /// Create equipment NFT (can be equipped to character)
    public entry fun create_equipment(
        creator: &signer,
        name: String,
        power_boost: u64
    ) {
        let constructor_ref = token::create(
            creator,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Equipment item"),
            name,
            option::none(),
            string::utf8(b"https://example.com/equipment.json")
        );
        
        let token_signer = object::generate_signer(&constructor_ref);
        
        move_to(&token_signer, EquipmentNFT {
            equipped_to: option::none(),
            power_boost
        });
    }
    
    /// Equip an item to a character (transfers ownership)
    public entry fun equip(
        owner: &signer,
        character: Object<Token>,
        equipment: Object<Token>
    ) acquires CharacterNFT, EquipmentNFT {
        let owner_addr = signer::address_of(owner);
        let character_addr = object::object_address(&character);
        let equipment_addr = object::object_address(&equipment);
        
        // Verify ownership of both
        assert!(object::owner(character) == owner_addr, E_NOT_OWNER);
        assert!(object::owner(equipment) == owner_addr, E_NOT_OWNER);
        
        let char_data = borrow_global_mut<CharacterNFT>(character_addr);
        
        // Check capacity
        assert!(vector::length(&char_data.equipped) < MAX_EQUIPMENT, E_EQUIPMENT_FULL);
        
        // Transfer equipment to character (character now owns it)
        object::transfer(owner, equipment, character_addr);
        
        // Update tracking
        vector::push_back(&mut char_data.equipped, equipment_addr);
        
        let equip_data = borrow_global_mut<EquipmentNFT>(equipment_addr);
        equip_data.equipped_to = option::some(character_addr);
    }
    
    /// Unequip an item (returns to owner)
    public entry fun unequip(
        owner: &signer,
        character: Object<Token>,
        equipment: Object<Token>
    ) acquires CharacterNFT, EquipmentNFT {
        let owner_addr = signer::address_of(owner);
        let character_addr = object::object_address(&character);
        let equipment_addr = object::object_address(&equipment);
        
        // Verify character ownership
        assert!(object::owner(character) == owner_addr, E_NOT_OWNER);
        
        let char_data = borrow_global_mut<CharacterNFT>(character_addr);
        
        // Find and remove from equipped list
        let (found, index) = vector::index_of(&char_data.equipped, &equipment_addr);
        assert!(found, E_NOT_EQUIPPED);
        vector::remove(&mut char_data.equipped, index);
        
        // Transfer equipment back to owner
        let char_signer = object::generate_signer_for_extending(&char_data.extend_ref);
        object::transfer(&char_signer, equipment, owner_addr);
        
        // Update equipment state
        let equip_data = borrow_global_mut<EquipmentNFT>(equipment_addr);
        equip_data.equipped_to = option::none();
    }
    
    /// Get total power of character with equipment
    #[view]
    public fun get_total_power(character: Object<Token>): u64 acquires CharacterNFT, EquipmentNFT {
        let character_addr = object::object_address(&character);
        let char_data = borrow_global<CharacterNFT>(character_addr);
        
        let base_power: u64 = 100;
        let bonus: u64 = 0;
        
        let i = 0;
        let len = vector::length(&char_data.equipped);
        while (i < len) {
            let equip_addr = *vector::borrow(&char_data.equipped, i);
            let equip_data = borrow_global<EquipmentNFT>(equip_addr);
            bonus = bonus + equip_data.power_boost;
            i = i + 1;
        };
        
        base_power + bonus
    }
}
```

---

## 🔒 Soulbound Tokens

NFTs that cannot be transferred:

```move
module nft_addr::soulbound_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_token_objects::collection;
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Soulbound NFT";
    
    const E_NOT_ISSUER: u64 = 1;
    const E_SOULBOUND: u64 = 2;

    /// Soulbound tokens cannot be transferred
    struct SoulboundData has key {
        original_owner: address,
        issued_at: u64
    }
    
    /// Issue soulbound token to address (admin only)
    public entry fun issue(
        issuer: &signer,
        to: address,
        name: String,
        description: String
    ) {
        assert!(signer::address_of(issuer) == @nft_addr, E_NOT_ISSUER);
        
        // Create token directly owned by recipient
        let constructor_ref = token::create_named_token(
            issuer,
            string::utf8(COLLECTION_NAME),
            description,
            name,
            option::none(),
            string::utf8(b"https://example.com/soulbound.json")
        );
        
        // Make it non-transferable by not storing TransferRef
        // and by using ungated_transfer_disabled
        object::disable_ungated_transfer(
            &object::generate_transfer_ref(&constructor_ref)
        );
        
        let token_signer = object::generate_signer(&constructor_ref);
        
        move_to(&token_signer, SoulboundData {
            original_owner: to,
            issued_at: cedra_framework::timestamp::now_seconds()
        });
        
        // Transfer to the intended owner
        object::transfer(issuer, object::object_from_constructor_ref<Token>(&constructor_ref), to);
    }
    
    /// Check if token is soulbound
    #[view]
    public fun is_soulbound(token: Object<Token>): bool {
        exists<SoulboundData>(object::object_address(&token))
    }
    
    /// Verify someone has a soulbound credential
    #[view]
    public fun has_credential(owner: address, token: Object<Token>): bool {
        object::owner(token) == owner && is_soulbound(token)
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build a Fusion System

Combine two NFTs into one:

```move
module nft_addr::fusion_nft {
    // Fuse NFT A + NFT B = New NFT with combined traits
    
    struct FusionResult has store {
        parent_a: address,
        parent_b: address,
        combined_power: u64
    }
    
    // TODO: Implement
    
    /// Fuse two NFTs into one
    public entry fun fuse(
        owner: &signer,
        nft_a: Object<Token>,
        nft_b: Object<Token>
    ) {
        // Your code:
        // 1. Verify ownership of both
        // 2. Extract properties from each
        // 3. Burn both NFTs
        // 4. Create new fused NFT
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module nft_addr::fusion_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::event;
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Fusion NFT";
    
    const E_NOT_OWNER: u64 = 1;
    const E_SAME_NFT: u64 = 2;

    struct NFTStats has key {
        power: u64,
        generation: u64,
        burn_ref: token::BurnRef
    }
    
    struct FusionResult has key {
        parent_a: address,
        parent_b: address,
        combined_power: u64
    }
    
    #[event]
    struct FusionEvent has drop, store {
        owner: address,
        parent_a: address,
        parent_b: address,
        child: address,
        combined_power: u64
    }
    
    public entry fun fuse(
        owner: &signer,
        nft_a: Object<Token>,
        nft_b: Object<Token>
    ) acquires NFTStats {
        let owner_addr = signer::address_of(owner);
        let addr_a = object::object_address(&nft_a);
        let addr_b = object::object_address(&nft_b);
        
        // Can't fuse same NFT
        assert!(addr_a != addr_b, E_SAME_NFT);
        
        // Verify ownership
        assert!(object::owner(nft_a) == owner_addr, E_NOT_OWNER);
        assert!(object::owner(nft_b) == owner_addr, E_NOT_OWNER);
        
        // Get stats before burning
        let stats_a = borrow_global<NFTStats>(addr_a);
        let stats_b = borrow_global<NFTStats>(addr_b);
        
        let power_a = stats_a.power;
        let power_b = stats_b.power;
        let max_gen = if (stats_a.generation > stats_b.generation) {
            stats_a.generation
        } else {
            stats_b.generation
        };
        
        // Calculate fused power (sum + 10% bonus)
        let combined = power_a + power_b;
        let bonus = combined / 10;
        let fused_power = combined + bonus;
        
        // Burn both NFTs
        let NFTStats { power: _, generation: _, burn_ref: burn_a } = move_from<NFTStats>(addr_a);
        let NFTStats { power: _, generation: _, burn_ref: burn_b } = move_from<NFTStats>(addr_b);
        
        token::burn(burn_a);
        token::burn(burn_b);
        
        // Create fused NFT
        let constructor_ref = token::create(
            owner,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Fused Creation"),
            string::utf8(b"Fused NFT"),
            option::none(),
            string::utf8(b"https://example.com/fused.json")
        );
        
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        let token_signer = object::generate_signer(&constructor_ref);
        let child_addr = signer::address_of(&token_signer);
        
        // Store fused stats
        move_to(&token_signer, NFTStats {
            power: fused_power,
            generation: max_gen + 1,
            burn_ref
        });
        
        move_to(&token_signer, FusionResult {
            parent_a: addr_a,
            parent_b: addr_b,
            combined_power: fused_power
        });
        
        event::emit(FusionEvent {
            owner: owner_addr,
            parent_a: addr_a,
            parent_b: addr_b,
            child: child_addr,
            combined_power: fused_power
        });
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What does burning an NFT do?

- A) Transfers it to a null address
- B) Permanently destroys it
- C) Hides it from view
- D) Locks it forever

<details>
<summary>Answer</summary>
**B) Permanently destroys it** - Burning removes the NFT from existence entirely.
</details>

### Question 2
How do composable NFTs work?

- A) NFTs can own other NFTs
- B) NFTs can only exist alone
- C) NFTs merge automatically
- D) NFTs share owners

<details>
<summary>Answer</summary>
**A) NFTs can own other NFTs** - Parent NFTs can hold child NFTs as their owner.
</details>

### Question 3
What makes a token "soulbound"?

- A) It's expensive
- B) It cannot be transferred
- C) It's rare
- D) It has special powers

<details>
<summary>Answer</summary>
**B) It cannot be transferred** - Soulbound tokens are permanently bound to their original recipient.
</details>

---

## 📝 Key Takeaways

1. **Burn = permanent destruction** - needs BurnRef
2. **Upgrade systems** - burn multiple → get better
3. **Composable NFTs** - NFTs own NFTs
4. **Soulbound** - disable transfers for credentials
5. **Fusion** - combine traits from multiple NFTs

---

## 🎓 Module 5 Complete!

Congratulations! You've mastered NFT development on Cedra:

| Lesson | Topic | Key Skill |
|--------|-------|-----------|
| 1 | NFT Basics | Collections & minting |
| 2 | Advanced Minting | Allowlists, pricing |
| 3 | Transfers & Trading | Marketplaces, royalties |
| 4 | Burning & Composability | Upgrades, equipment |

### Your NFT Skills:
- ✅ Create collections and mint NFTs
- ✅ Implement allowlists and dynamic pricing
- ✅ Build marketplaces with royalties
- ✅ Create upgradeable and composable NFTs
- ✅ Issue soulbound credentials

---

## 🎉 Tutorial Complete!

You've completed all 5 modules of the Cedra Move tutorial:

| Module | Topic | Status |
|--------|-------|--------|
| 1 | Move Fundamentals | ✅ Complete |
| 2 | Resources & Storage | ✅ Complete |
| 3 | Building a DApp | ✅ Complete |
| 4 | Token Creation | ✅ Complete |
| 5 | NFT Collections | ✅ Complete |

### What's Next?

1. **Build your own project** - Use what you learned!
2. **Deploy to testnet** - Practice real deployments
3. **Join the community** - Get help and share your work
4. **Explore advanced topics** - DeFi, gaming, DAOs

**Congratulations, Cedra Developer! 🚀**
