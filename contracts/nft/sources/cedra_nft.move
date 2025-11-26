/// Cedra NFT Collection Module
/// 
/// This module demonstrates how to create an NFT collection on Cedra using the 
/// standard token module (cedra_token::token at 0x3).
/// 
/// Key Concepts:
/// - Collections contain NFTs (similar to ERC-721 collections)
/// - TokenId uniquely identifies each token
/// - Uses property maps for custom metadata
module nft_addr::cedra_nft {
    use cedra_token::token;
    use std::signer;
    use std::string::{String, utf8};
    use std::bcs;

    // ============================================
    // CONSTANTS
    // ============================================
    
    /// Collection name
    const COLLECTION_NAME: vector<u8> = b"Cedra Tutorial NFTs";
    
    /// Collection description
    const COLLECTION_DESCRIPTION: vector<u8> = b"A collection of tutorial NFTs demonstrating Cedra development";
    
    /// Collection URI (metadata)
    const COLLECTION_URI: vector<u8> = b"https://cedra.network/nft/collection.json";

    // ============================================
    // ERROR CODES
    // ============================================
    
    /// Caller is not the collection owner
    const E_NOT_OWNER: u64 = 1;
    
    /// Maximum supply reached
    const E_MAX_SUPPLY_REACHED: u64 = 2;

    // ============================================
    // RESOURCES
    // ============================================

    /// Collection configuration stored under the creator
    struct CollectionConfig has key {
        /// Current token ID counter
        next_token_id: u64,
        /// Maximum supply (0 = unlimited)
        max_supply: u64,
        /// Royalty numerator (e.g., 5 for 5%)
        royalty_numerator: u64,
        /// Royalty denominator (e.g., 100)
        royalty_denominator: u64,
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /// Initialize the NFT collection when module is published
    fun init_module(creator: &signer) {
        // Create the collection with max 1000 NFTs
        token::create_collection(
            creator,
            utf8(COLLECTION_NAME),
            utf8(COLLECTION_DESCRIPTION),
            utf8(COLLECTION_URI),
            1000, // Maximum supply
            vector<bool>[false, false, false], // Collection mutability: [description, uri, maximum]
        );
        
        // Store collection configuration
        move_to(creator, CollectionConfig {
            next_token_id: 1,
            max_supply: 1000,
            royalty_numerator: 5,
            royalty_denominator: 100,
        });
    }

    // ============================================
    // ENTRY FUNCTIONS
    // ============================================

    /// Mint a new NFT
    public entry fun mint_nft(
        creator: &signer,
        name: String,
        description: String,
        uri: String,
        rarity: String,
        power: u64,
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        
        // Verify caller is the creator
        assert!(exists<CollectionConfig>(creator_addr), E_NOT_OWNER);
        
        let config = borrow_global_mut<CollectionConfig>(creator_addr);
        
        // Check max supply
        if (config.max_supply > 0) {
            assert!(config.next_token_id <= config.max_supply, E_MAX_SUPPLY_REACHED);
        };
        
        // Get current token ID and increment
        let token_id = config.next_token_id;
        config.next_token_id = token_id + 1;
        
        // Create property keys and values for custom metadata
        let property_keys = vector<String>[
            utf8(b"rarity"),
            utf8(b"power"),
            utf8(b"token_id"),
        ];
        
        let property_values = vector<vector<u8>>[
            bcs::to_bytes(&rarity),
            bcs::to_bytes(&power),
            bcs::to_bytes(&token_id),
        ];
        
        let property_types = vector<String>[
            utf8(b"0x1::string::String"),
            utf8(b"u64"),
            utf8(b"u64"),
        ];
        
        // Create the token data and mint
        token::create_token_script(
            creator,
            utf8(COLLECTION_NAME),
            name,
            description,
            1, // Supply: 1 (NFT is unique)
            1, // Maximum: 1 (can only mint 1)
            uri,
            creator_addr, // Royalty recipient
            config.royalty_denominator,
            config.royalty_numerator,
            vector<bool>[false, false, false, false, false], // Token mutability
            property_keys,
            property_values,
            property_types,
        );
    }

    // Note: For transferring after mint, recipients must opt-in to receive tokens
    // Use token::opt_in_direct_transfer(receiver, true) first

    /// Transfer an NFT to another address (both parties must have opted in)
    public entry fun transfer_nft(
        from: &signer,
        to: &signer,
        creator: address,
        name: String,
    ) {
        let token_data_id = token::create_token_data_id(
            creator,
            utf8(COLLECTION_NAME),
            name,
        );
        let token_id = token::create_token_id(token_data_id, 0);
        token::direct_transfer(from, to, token_id, 1);
    }

    /// Enable direct transfers for this account
    public entry fun opt_in_transfers(account: &signer) {
        token::opt_in_direct_transfer(account, true);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    #[view]
    public fun total_minted(creator: address): u64 acquires CollectionConfig {
        let config = borrow_global<CollectionConfig>(creator);
        config.next_token_id - 1
    }

    #[view]
    public fun max_supply(creator: address): u64 acquires CollectionConfig {
        let config = borrow_global<CollectionConfig>(creator);
        config.max_supply
    }

    #[view]
    public fun get_collection_name(): String {
        utf8(COLLECTION_NAME)
    }

    #[view]
    public fun balance_of(
        owner: address,
        creator: address,
        name: String,
    ): u64 {
        let token_data_id = token::create_token_data_id(
            creator,
            utf8(COLLECTION_NAME),
            name,
        );
        let token_id = token::create_token_id(token_data_id, 0);
        token::balance_of(owner, token_id)
    }

    // ============================================
    // TESTS
    // ============================================

    #[test_only]
    use cedra_framework::account;

    #[test(creator = @nft_addr)]
    fun test_init(creator: &signer) acquires CollectionConfig {
        account::create_account_for_test(signer::address_of(creator));
        init_module(creator);
        
        let minted = total_minted(signer::address_of(creator));
        assert!(minted == 0, 1);
        
        let max = max_supply(signer::address_of(creator));
        assert!(max == 1000, 2);
    }

    #[test(creator = @nft_addr)]
    fun test_mint_nft(creator: &signer) acquires CollectionConfig {
        account::create_account_for_test(signer::address_of(creator));
        init_module(creator);
        
        mint_nft(
            creator,
            utf8(b"Tutorial NFT #1"),
            utf8(b"First NFT in the tutorial collection"),
            utf8(b"https://cedra.network/nft/1.json"),
            utf8(b"Legendary"),
            100,
        );
        
        // Verify minted count
        assert!(total_minted(signer::address_of(creator)) == 1, 1);
    }
}
