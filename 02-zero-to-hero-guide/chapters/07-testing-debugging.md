# Chapter 7: Testing & Debugging

> **Write Robust Tests and Debug Move Contracts Effectively**

---

## 🎯 What You'll Learn

- Write unit tests for Move contracts
- Use test annotations and attributes
- Debug common Move errors
- Test error conditions
- Best practices for test coverage

---

## 📖 Why Testing Matters

Smart contracts handle real value. Bugs can mean:
- Lost funds (irreversible!)
- Exploits and hacks
- Broken business logic

Testing is your safety net!

---

## 🧪 Move Test Framework

### Basic Test Structure

```move
#[test_only]
module my_addr::my_tests {
    use my_addr::my_module;
    
    #[test]
    fun test_basic_functionality() {
        // Arrange
        let value = 10;
        
        // Act
        let result = my_module::double(value);
        
        // Assert
        assert!(result == 20, 0);
    }
}
```

### Test Attributes

| Attribute | Description |
|-----------|-------------|
| `#[test]` | Marks function as a test |
| `#[test_only]` | Code only included in test builds |
| `#[expected_failure]` | Test should abort |
| `#[test(account = @0x1)]` | Inject signer parameter |

---

## 📝 Writing Your First Tests

### Example: Counter Contract Tests

```move
#[test_only]
module counter_addr::counter_tests {
    use std::signer;
    use counter_addr::simple_counter;
    use cedra_framework::account;

    // ========================================
    // SETUP HELPERS
    // ========================================
    
    fun setup_test_account(addr: address) {
        if (!account::exists_at(addr)) {
            account::create_account_for_test(addr);
        }
    }

    // ========================================
    // HAPPY PATH TESTS
    // ========================================
    
    #[test(user = @0x123)]
    fun test_initialize_creates_counter(user: &signer) {
        setup_test_account(@0x123);
        
        // Initialize counter
        simple_counter::initialize(user);
        
        // Verify counter exists
        let user_addr = signer::address_of(user);
        assert!(simple_counter::has_counter(user_addr), 0);
        
        // Verify initial value
        assert!(simple_counter::get_count(user_addr) == 0, 1);
    }
    
    #[test(user = @0x123)]
    fun test_increment_adds_one(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize(user);
        
        // Increment
        simple_counter::increment(user);
        
        // Verify
        let count = simple_counter::get_count(signer::address_of(user));
        assert!(count == 1, 0);
    }
    
    #[test(user = @0x123)]
    fun test_increment_multiple_times(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize(user);
        
        // Increment 5 times
        let i = 0;
        while (i < 5) {
            simple_counter::increment(user);
            i = i + 1;
        };
        
        // Verify
        let count = simple_counter::get_count(signer::address_of(user));
        assert!(count == 5, 0);
    }
    
    #[test(user = @0x123)]
    fun test_increment_by_custom_amount(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize(user);
        
        simple_counter::increment_by(user, 100);
        
        let count = simple_counter::get_count(signer::address_of(user));
        assert!(count == 100, 0);
    }
    
    #[test(user = @0x123)]
    fun test_decrement_subtracts_one(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize_with_value(user, 10);
        
        simple_counter::decrement(user);
        
        let count = simple_counter::get_count(signer::address_of(user));
        assert!(count == 9, 0);
    }
    
    #[test(user = @0x123)]
    fun test_reset_sets_to_zero(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize_with_value(user, 999);
        
        simple_counter::reset(user);
        
        let count = simple_counter::get_count(signer::address_of(user));
        assert!(count == 0, 0);
    }
    
    #[test(user = @0x123)]
    fun test_destroy_removes_counter(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize(user);
        
        simple_counter::destroy(user);
        
        assert!(!simple_counter::has_counter(signer::address_of(user)), 0);
    }

    // ========================================
    // ERROR CASE TESTS
    // ========================================
    
    #[test(user = @0x123)]
    #[expected_failure(abort_code = 1)]  // E_COUNTER_NOT_FOUND
    fun test_increment_without_counter_fails(user: &signer) {
        setup_test_account(@0x123);
        
        // Should fail - no counter initialized
        simple_counter::increment(user);
    }
    
    #[test(user = @0x123)]
    #[expected_failure(abort_code = 2)]  // E_COUNTER_EXISTS
    fun test_double_initialize_fails(user: &signer) {
        setup_test_account(@0x123);
        
        simple_counter::initialize(user);
        simple_counter::initialize(user);  // Should fail
    }
    
    #[test(user = @0x123)]
    #[expected_failure(abort_code = 3)]  // E_COUNTER_UNDERFLOW
    fun test_decrement_below_zero_fails(user: &signer) {
        setup_test_account(@0x123);
        simple_counter::initialize(user);  // value = 0
        
        simple_counter::decrement(user);  // Should fail
    }
    
    #[test(user = @0x123)]
    #[expected_failure(abort_code = 1)]  // E_COUNTER_NOT_FOUND
    fun test_get_count_without_counter_fails(user: &signer) {
        setup_test_account(@0x123);
        
        // Should fail - no counter
        let _ = simple_counter::get_count(signer::address_of(user));
    }

    // ========================================
    // MULTI-USER TESTS
    // ========================================
    
    #[test(alice = @0xA, bob = @0xB)]
    fun test_multiple_users_independent(alice: &signer, bob: &signer) {
        setup_test_account(@0xA);
        setup_test_account(@0xB);
        
        // Both initialize
        simple_counter::initialize(alice);
        simple_counter::initialize(bob);
        
        // Alice increments to 10
        simple_counter::increment_by(alice, 10);
        
        // Bob increments to 5
        simple_counter::increment_by(bob, 5);
        
        // Verify independence
        assert!(simple_counter::get_count(@0xA) == 10, 0);
        assert!(simple_counter::get_count(@0xB) == 5, 1);
    }
}
```

---

## 🔧 Running Tests

### Basic Test Run

```powershell
cedra move test --named-addresses counter_addr=0x123
```

### With Options

```powershell
# Show test output
cedra move test --named-addresses counter_addr=0x123 -v

# Filter specific tests
cedra move test --named-addresses counter_addr=0x123 --filter test_increment

# Coverage report
cedra move test --named-addresses counter_addr=0x123 --coverage
```

### Expected Output

```
Running Move unit tests
[ PASS    ] 0x123::counter_tests::test_decrement_below_zero_fails
[ PASS    ] 0x123::counter_tests::test_decrement_subtracts_one
[ PASS    ] 0x123::counter_tests::test_destroy_removes_counter
[ PASS    ] 0x123::counter_tests::test_double_initialize_fails
[ PASS    ] 0x123::counter_tests::test_get_count_without_counter_fails
[ PASS    ] 0x123::counter_tests::test_increment_adds_one
[ PASS    ] 0x123::counter_tests::test_increment_by_custom_amount
[ PASS    ] 0x123::counter_tests::test_increment_multiple_times
[ PASS    ] 0x123::counter_tests::test_increment_without_counter_fails
[ PASS    ] 0x123::counter_tests::test_initialize_creates_counter
[ PASS    ] 0x123::counter_tests::test_multiple_users_independent
[ PASS    ] 0x123::counter_tests::test_reset_sets_to_zero
Test result: OK. Total tests: 12; passed: 12; failed: 0
```

---

## 🐛 Common Errors and Solutions

### 1. RESOURCE_ALREADY_EXISTS

```
Error: RESOURCE_ALREADY_EXISTS
Location: 0x123::my_module
```

**Cause**: Trying to `move_to` a resource that already exists.

**Solution**:
```move
// Check before creating
assert!(!exists<MyResource>(addr), E_ALREADY_EXISTS);
move_to(account, MyResource { ... });
```

### 2. RESOURCE_NOT_FOUND

```
Error: RESOURCE_NOT_FOUND  
Location: 0x123::my_module
```

**Cause**: Trying to access a resource that doesn't exist.

**Solution**:
```move
// Check before accessing
assert!(exists<MyResource>(addr), E_NOT_FOUND);
let resource = borrow_global<MyResource>(addr);
```

### 3. ABORTED with code

```
Error: Move abort in 0x123::my_module: ABORTED with code 1
```

**Cause**: An `assert!` failed or explicit `abort` was called.

**Solution**: Check your error codes and trace back to the failed assertion.

### 4. TYPE_MISMATCH

```
Error: TYPE_MISMATCH
Expected: u64
Actual: u128
```

**Cause**: Wrong type used.

**Solution**: Cast explicitly:
```move
let big: u128 = 1000;
let small = (big as u64);
```

### 5. MISSING_ACQUIRES_ANNOTATION

```
Error: missing acquires annotation
```

**Cause**: Function accesses global storage without declaring it.

**Solution**:
```move
// Add acquires
fun my_function() acquires MyResource {
    let r = borrow_global<MyResource>(@0x1);
}
```

---

## 📊 Test Coverage

### Generate Coverage Report

```powershell
cedra move test --coverage --named-addresses counter_addr=0x123
```

### View Coverage Summary

```powershell
cedra move coverage summary --named-addresses counter_addr=0x123
```

Output:
```
+-------------------------+
| Move Coverage Summary   |
+-------------------------+
| Module                 | % |
+-------------------------+
| simple_counter         | 95|
+-------------------------+
```

### View Source Coverage

```powershell
cedra move coverage source --module simple_counter --named-addresses counter_addr=0x123
```

Shows which lines are covered:
```
  1: module counter_addr::simple_counter {
  2:     [COVERED] const E_NOT_FOUND: u64 = 1;
  3:     [COVERED] struct Counter has key { value: u64 }
  4:     
  5:     [COVERED] public entry fun initialize(account: &signer) {
  6:     [COVERED]     move_to(account, Counter { value: 0 });
  7:     [COVERED] }
  8:     
  9:     [NOT COVERED] public entry fun admin_reset(...) {
 10:     [NOT COVERED]     // This function is not tested!
 11:     [NOT COVERED] }
```

---

## 🎯 Testing Best Practices

### 1. Test Structure

```move
#[test(user = @0x123)]
fun test_descriptive_name(user: &signer) {
    // ARRANGE - Set up test state
    setup_test_account(@0x123);
    my_module::initialize(user);
    
    // ACT - Perform the action being tested
    my_module::do_something(user, 100);
    
    // ASSERT - Verify the results
    assert!(my_module::get_value(@0x123) == 100, 0);
}
```

### 2. Test Error Codes

Always test that errors fire correctly:

```move
#[test(user = @0x123)]
#[expected_failure(abort_code = 3)]
fun test_specific_error_code(user: &signer) {
    // Trigger the specific error condition
    my_module::will_fail(user);
}
```

### 3. Test Edge Cases

```move
// Test zero
#[test(user = @0x123)]
fun test_with_zero_amount(user: &signer) { ... }

// Test max value
#[test(user = @0x123)]
fun test_with_max_u64(user: &signer) { ... }

// Test empty vector
#[test(user = @0x123)]
fun test_with_empty_list(user: &signer) { ... }
```

### 4. Test Multiple Users

```move
#[test(admin = @0xADMIN, user1 = @0x1, user2 = @0x2)]
fun test_multi_user_scenario(
    admin: &signer, 
    user1: &signer, 
    user2: &signer
) {
    // Test interactions between multiple users
}
```

### 5. Use Helper Functions

```move
#[test_only]
fun create_test_token(creator: &signer): Object<Token> {
    // Common setup code
}

#[test_only]
fun setup_marketplace(admin: &signer) {
    // Complex initialization
}
```

---

## 🔍 Debugging Tips

### 1. Use Debug Print

```move
use std::debug;

fun my_function(value: u64) {
    debug::print(&value);  // Prints during test
    debug::print(&b"checkpoint reached");
}
```

### 2. Narrow Down the Problem

```move
#[test]
fun test_debug() {
    let step1 = do_step_1();
    debug::print(&b"Step 1 complete");
    debug::print(&step1);
    
    let step2 = do_step_2(step1);
    debug::print(&b"Step 2 complete");
    // ...
}
```

### 3. Check Resource State

```move
#[test(user = @0x123)]
fun test_debug_resource(user: &signer) {
    my_module::initialize(user);
    
    // Check state after each operation
    let state = my_module::get_state(@0x123);
    debug::print(&state);
}
```

---

## 📝 Key Takeaways

1. **Test everything** - happy paths, errors, edge cases
2. **Use `#[expected_failure]`** for error testing
3. **Check coverage** to find untested code
4. **Use debug::print** for troubleshooting
5. **Write descriptive test names** that explain intent

---

## ➡️ Next Steps

In Chapter 8, we'll integrate our contracts with a React frontend!

[Continue to Chapter 8: Frontend Integration →](./08-frontend-integration.md)
