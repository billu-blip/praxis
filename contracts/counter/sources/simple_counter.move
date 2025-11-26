/// Counter Module - A Simple Smart Contract Example
/// 
/// This module demonstrates the fundamental concepts of Move programming on Cedra:
/// - Resource definition with abilities
/// - Entry functions for transactions
/// - View functions for gas-free queries
/// - Error handling with assert
/// - Global storage operations
module counter::simple_counter {
    use std::signer;

    // ============================================
    // RESOURCES
    // ============================================
    
    /// The Counter resource that will be stored in each account
    /// - `has key` allows it to be stored at the top level of an account
    struct Counter has key {
        value: u64,
    }

    // ============================================
    // ERROR CODES
    // ============================================
    
    /// Error when trying to access a counter that doesn't exist
    const E_COUNTER_NOT_EXISTS: u64 = 1;
    
    /// Error when trying to create a counter that already exists
    const E_COUNTER_ALREADY_EXISTS: u64 = 2;

    // ============================================
    // ENTRY FUNCTIONS (Transaction Entry Points)
    // ============================================

    /// Initialize a counter for the calling account with value 0
    /// 
    /// # Arguments
    /// * `account` - The signer creating the counter
    /// 
    /// # Errors
    /// * `E_COUNTER_ALREADY_EXISTS` - If the account already has a counter
    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<Counter>(addr), E_COUNTER_ALREADY_EXISTS);
        
        let counter = Counter { value: 0 };
        move_to(account, counter);
    }

    /// Increment the counter by 1
    /// 
    /// # Arguments
    /// * `account` - The signer owning the counter
    /// 
    /// # Errors
    /// * `E_COUNTER_NOT_EXISTS` - If the account doesn't have a counter
    public entry fun increment(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = counter.value + 1;
    }

    /// Increment the counter by a specified amount
    /// 
    /// # Arguments
    /// * `account` - The signer owning the counter
    /// * `amount` - The amount to increment by
    /// 
    /// # Errors
    /// * `E_COUNTER_NOT_EXISTS` - If the account doesn't have a counter
    public entry fun increment_by(account: &signer, amount: u64) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = counter.value + amount;
    }

    /// Decrement the counter by 1 (with underflow protection)
    /// 
    /// # Arguments
    /// * `account` - The signer owning the counter
    /// 
    /// # Errors
    /// * `E_COUNTER_NOT_EXISTS` - If the account doesn't have a counter
    public entry fun decrement(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        if (counter.value > 0) {
            counter.value = counter.value - 1;
        };
    }

    /// Reset the counter to 0
    /// 
    /// # Arguments
    /// * `account` - The signer owning the counter
    /// 
    /// # Errors
    /// * `E_COUNTER_NOT_EXISTS` - If the account doesn't have a counter
    public entry fun reset(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = 0;
    }

    /// Delete the counter resource
    /// 
    /// # Arguments
    /// * `account` - The signer owning the counter
    /// 
    /// # Errors
    /// * `E_COUNTER_NOT_EXISTS` - If the account doesn't have a counter
    public entry fun destroy(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        assert!(exists<Counter>(addr), E_COUNTER_NOT_EXISTS);
        
        let Counter { value: _ } = move_from<Counter>(addr);
    }

    // ============================================
    // VIEW FUNCTIONS (Gas-Free Queries)
    // ============================================

    #[view]
    /// Get the current counter value
    public fun get_count(account_addr: address): u64 acquires Counter {
        assert!(exists<Counter>(account_addr), E_COUNTER_NOT_EXISTS);
        borrow_global<Counter>(account_addr).value
    }

    #[view]
    /// Check if an account has a counter
    public fun has_counter(account_addr: address): bool {
        exists<Counter>(account_addr)
    }

    // ============================================
    // UNIT TESTS
    // ============================================

    #[test(account = @0xcafe)]
    public fun test_initialize_and_get_count(account: &signer) acquires Counter {
        initialize(account);
        let count = get_count(signer::address_of(account));
        assert!(count == 0, 1);
    }

    #[test(account = @0xcafe)]
    public fun test_increment(account: &signer) acquires Counter {
        initialize(account);
        increment(account);
        increment(account);
        
        let count = get_count(signer::address_of(account));
        assert!(count == 2, 2);
    }

    #[test(account = @0xcafe)]
    public fun test_decrement(account: &signer) acquires Counter {
        initialize(account);
        increment(account);
        increment(account);
        decrement(account);
        
        let count = get_count(signer::address_of(account));
        assert!(count == 1, 3);
    }

    #[test(account = @0xcafe)]
    public fun test_decrement_underflow_protection(account: &signer) acquires Counter {
        initialize(account);
        decrement(account); // Should not panic, just stay at 0
        
        let count = get_count(signer::address_of(account));
        assert!(count == 0, 4);
    }

    #[test(account = @0xcafe)]
    public fun test_reset(account: &signer) acquires Counter {
        initialize(account);
        increment(account);
        increment(account);
        reset(account);
        
        let count = get_count(signer::address_of(account));
        assert!(count == 0, 5);
    }

    #[test(account = @0xcafe)]
    public fun test_has_counter(account: &signer) {
        assert!(!has_counter(signer::address_of(account)), 6);
        initialize(account);
        assert!(has_counter(signer::address_of(account)), 7);
    }

    #[test(account = @0xcafe)]
    #[expected_failure(abort_code = E_COUNTER_ALREADY_EXISTS)]
    public fun test_double_initialize_fails(account: &signer) {
        initialize(account);
        initialize(account); // Should fail
    }

    #[test(account = @0xcafe)]
    #[expected_failure(abort_code = E_COUNTER_NOT_EXISTS)]
    public fun test_increment_without_init_fails(account: &signer) acquires Counter {
        increment(account); // Should fail
    }
}
