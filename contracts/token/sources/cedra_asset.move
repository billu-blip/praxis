/// Cedra Fungible Asset (Token) Module
/// 
/// This module demonstrates how to create a fungible token on Cedra using the 
/// Fungible Asset (FA) standard. This is the Cedra equivalent of ERC-20 tokens.
/// 
/// Key Concepts:
/// - Object-based balances (not mappings)
/// - Capability pattern (MintRef, BurnRef, TransferRef)
/// - Primary fungible stores for seamless transfers
module token_addr::cedra_asset {
    use cedra_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use cedra_framework::object::{Self, Object};
    use cedra_framework::primary_fungible_store;
    use std::option;
    use std::signer;
    use std::string::{String, utf8};

    // ============================================
    // CONSTANTS
    // ============================================
    
    /// Token name
    const ASSET_NAME: vector<u8> = b"Cedra Tutorial Token";
    
    /// Token symbol
    const ASSET_SYMBOL: vector<u8> = b"CTT";
    
    /// Number of decimal places (8 is standard for Cedra)
    const DECIMALS: u8 = 8;
    
    /// Icon URI for the token
    const ICON_URI: vector<u8> = b"https://cedra.network/icon.png";
    
    /// Project URI
    const PROJECT_URI: vector<u8> = b"https://cedra.network";

    // ============================================
    // ERROR CODES
    // ============================================
    
    /// Caller is not authorized to perform this action
    const E_NOT_AUTHORIZED: u64 = 1;
    
    /// Insufficient balance for the operation
    const E_INSUFFICIENT_BALANCE: u64 = 2;

    // ============================================
    // RESOURCES
    // ============================================

    #[resource_group_member(group = cedra_framework::object::ObjectGroup)]
    /// Stores the capability references for the token. Only admin can access.
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /// Initialize the token when the module is published
    fun init_module(admin: &signer) {
        // Create a named object for the token metadata
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        
        // Create the fungible asset with primary store enabled
        // Primary stores allow seamless receiving without explicit registration
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),                    // No maximum supply
            utf8(ASSET_NAME),                  // Token name
            utf8(ASSET_SYMBOL),                // Token symbol
            DECIMALS,                          // Decimal places
            utf8(ICON_URI),                    // Icon URL
            utf8(PROJECT_URI),                 // Project URL
        );
        
        // Generate capability references
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        
        // Get the metadata object signer
        let metadata_signer = object::generate_signer(constructor_ref);
        
        // Store capabilities under the metadata object
        move_to(
            &metadata_signer,
            ManagedFungibleAsset { mint_ref, transfer_ref, burn_ref }
        );
    }

    // ============================================
    // ENTRY FUNCTIONS
    // ============================================

    /// Mint new tokens to a recipient
    /// Only callable by the admin (module publisher)
    /// 
    /// # Arguments
    /// * `admin` - The admin signer (must be module publisher)
    /// * `to` - The recipient address
    /// * `amount` - Amount to mint (in smallest units)
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = authorized_borrow_refs(admin, asset);
        let to_wallet = primary_fungible_store::ensure_primary_store_exists(to, asset);
        let fa = fungible_asset::mint(&managed.mint_ref, amount);
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_wallet, fa);
    }

    /// Transfer tokens from sender to recipient
    /// 
    /// # Arguments
    /// * `from` - The sender signer
    /// * `to` - The recipient address
    /// * `amount` - Amount to transfer
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let asset = get_metadata();
        primary_fungible_store::transfer(from, asset, to, amount);
    }

    /// Burn tokens from the caller's account
    /// 
    /// # Arguments
    /// * `from` - The signer whose tokens to burn
    /// * `amount` - Amount to burn
    public entry fun burn(
        from: &signer,
        amount: u64
    ) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
        let from_store = primary_fungible_store::primary_store(signer::address_of(from), asset);
        fungible_asset::burn_from(&managed.burn_ref, from_store, amount);
    }

    /// Freeze an account (admin only)
    /// Frozen accounts cannot send tokens
    /// 
    /// # Arguments
    /// * `admin` - The admin signer
    /// * `account` - The account to freeze
    public entry fun freeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = authorized_borrow_refs(admin, asset);
        let wallet = primary_fungible_store::ensure_primary_store_exists(account, asset);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, wallet, true);
    }

    /// Unfreeze an account (admin only)
    /// 
    /// # Arguments
    /// * `admin` - The admin signer
    /// * `account` - The account to unfreeze
    public entry fun unfreeze_account(
        admin: &signer,
        account: address
    ) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = authorized_borrow_refs(admin, asset);
        let wallet = primary_fungible_store::ensure_primary_store_exists(account, asset);
        fungible_asset::set_frozen_flag(&managed.transfer_ref, wallet, false);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    #[view]
    /// Get the balance of an account
    public fun balance(account: address): u64 {
        let asset = get_metadata();
        primary_fungible_store::balance(account, asset)
    }

    #[view]
    /// Check if an account is frozen
    public fun is_frozen(account: address): bool {
        let asset = get_metadata();
        let store = primary_fungible_store::primary_store(account, asset);
        fungible_asset::is_frozen(store)
    }

    #[view]
    /// Get the total supply
    public fun total_supply(): u128 {
        let asset = get_metadata();
        let supply = fungible_asset::supply(asset);
        option::get_with_default(&supply, 0)
    }

    #[view]
    /// Get the token name
    public fun name(): String {
        let asset = get_metadata();
        fungible_asset::name(asset)
    }

    #[view]
    /// Get the token symbol
    public fun symbol(): String {
        let asset = get_metadata();
        fungible_asset::symbol(asset)
    }

    #[view]
    /// Get the decimals
    public fun decimals(): u8 {
        let asset = get_metadata();
        fungible_asset::decimals(asset)
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /// Get the metadata object for this token
    inline fun get_metadata(): Object<Metadata> {
        let asset_address = object::create_object_address(&@token_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(asset_address)
    }

    /// Borrow the capability references (admin only)
    inline fun authorized_borrow_refs(
        owner: &signer,
        asset: Object<Metadata>
    ): &ManagedFungibleAsset acquires ManagedFungibleAsset {
        assert!(object::is_owner(asset, signer::address_of(owner)), E_NOT_AUTHORIZED);
        borrow_global<ManagedFungibleAsset>(object::object_address(&asset))
    }

    // ============================================
    // TESTS
    // ============================================

    #[test_only]
    use cedra_framework::account;

    #[test(admin = @token_addr)]
    fun test_init_and_mint(admin: &signer) acquires ManagedFungibleAsset {
        // Setup
        account::create_account_for_test(signer::address_of(admin));
        init_module(admin);
        
        // Mint tokens
        let recipient = @0x123;
        mint(admin, recipient, 1000);
        
        // Verify balance
        assert!(balance(recipient) == 1000, 1);
    }

    #[test(admin = @token_addr, user = @0x123)]
    fun test_transfer(admin: &signer, user: &signer) acquires ManagedFungibleAsset {
        // Setup
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(user));
        init_module(admin);
        
        // Mint to user
        mint(admin, signer::address_of(user), 1000);
        
        // Transfer
        let recipient = @0x456;
        transfer(user, recipient, 300);
        
        // Verify balances
        assert!(balance(signer::address_of(user)) == 700, 1);
        assert!(balance(recipient) == 300, 2);
    }

    #[test(admin = @token_addr)]
    fun test_metadata(admin: &signer) {
        account::create_account_for_test(signer::address_of(admin));
        init_module(admin);
        
        assert!(name() == utf8(ASSET_NAME), 1);
        assert!(symbol() == utf8(ASSET_SYMBOL), 2);
        assert!(decimals() == DECIMALS, 3);
    }
}
