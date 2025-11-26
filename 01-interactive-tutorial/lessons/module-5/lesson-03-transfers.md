# Lesson 3: NFT Transfers & Trading

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Implement NFT transfers
- Create marketplace listings
- Handle royalty payments
- Build escrow trading

---

## 📖 How NFT Transfers Work

NFTs use the object transfer system:

```move
use cedra_framework::object;

// Transfer ownership of an NFT
object::transfer(
    owner,      // &signer - current owner
    nft_object, // Object<Token> - the NFT
    to          // address - new owner
);
```

Only the owner can transfer their NFT!

---

## 🔄 Basic Transfer Implementation

```move
module nft_addr::transferable_nft {
    use std::string::{Self, String};
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_token_objects::collection;
    use cedra_token_objects::token::{Self, Token};

    const COLLECTION_NAME: vector<u8> = b"Transferable NFT";
    
    const E_NOT_OWNER: u64 = 1;
    const E_SELF_TRANSFER: u64 = 2;
    
    /// Transfer an NFT to another address
    public entry fun transfer(
        owner: &signer,
        token: Object<Token>,
        to: address
    ) {
        let owner_addr = signer::address_of(owner);
        
        // Verify ownership
        assert!(object::owner(token) == owner_addr, E_NOT_OWNER);
        
        // Can't transfer to self
        assert!(to != owner_addr, E_SELF_TRANSFER);
        
        // Execute transfer
        object::transfer(owner, token, to);
    }
    
    /// Check who owns an NFT
    #[view]
    public fun get_owner(token: Object<Token>): address {
        object::owner(token)
    }
    
    /// Check if address owns specific NFT
    #[view]
    public fun is_owner(addr: address, token: Object<Token>): bool {
        object::owner(token) == addr
    }
}
```

---

## 🏪 Simple Marketplace

Create listings and allow others to buy:

```move
module nft_addr::marketplace {
    use std::signer;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_framework::event;
    use cedra_framework::simple_map::{Self, SimpleMap};
    use cedra_token_objects::token::Token;
    use cedra_token_objects::royalty;

    const E_NOT_OWNER: u64 = 1;
    const E_NOT_LISTED: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_ALREADY_LISTED: u64 = 4;
    const E_CANNOT_BUY_OWN: u64 = 5;
    
    struct Listing has store, drop {
        seller: address,
        price: u64
    }
    
    struct Marketplace has key {
        listings: SimpleMap<address, Listing>,  // token_addr -> Listing
        fee_bps: u64,  // Platform fee in basis points
        fee_recipient: address
    }
    
    #[event]
    struct ListingCreated has drop, store {
        token: address,
        seller: address,
        price: u64
    }
    
    #[event]
    struct Sale has drop, store {
        token: address,
        seller: address,
        buyer: address,
        price: u64
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, Marketplace {
            listings: simple_map::new(),
            fee_bps: 250,  // 2.5% platform fee
            fee_recipient: signer::address_of(deployer)
        });
    }
    
    /// List an NFT for sale
    public entry fun list_for_sale(
        seller: &signer,
        token: Object<Token>,
        price: u64
    ) acquires Marketplace {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);
        
        // Verify ownership
        assert!(object::owner(token) == seller_addr, E_NOT_OWNER);
        
        let marketplace = borrow_global_mut<Marketplace>(@nft_addr);
        
        // Check not already listed
        assert!(!simple_map::contains_key(&marketplace.listings, &token_addr), E_ALREADY_LISTED);
        
        // Create listing
        simple_map::add(&mut marketplace.listings, token_addr, Listing {
            seller: seller_addr,
            price
        });
        
        event::emit(ListingCreated {
            token: token_addr,
            seller: seller_addr,
            price
        });
    }
    
    /// Cancel a listing
    public entry fun cancel_listing(
        seller: &signer,
        token: Object<Token>
    ) acquires Marketplace {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);
        
        let marketplace = borrow_global_mut<Marketplace>(@nft_addr);
        
        // Check listing exists
        assert!(simple_map::contains_key(&marketplace.listings, &token_addr), E_NOT_LISTED);
        
        // Verify seller
        let listing = simple_map::borrow(&marketplace.listings, &token_addr);
        assert!(listing.seller == seller_addr, E_NOT_OWNER);
        
        // Remove listing
        simple_map::remove(&mut marketplace.listings, &token_addr);
    }
    
    /// Buy a listed NFT
    public entry fun buy(
        buyer: &signer,
        token: Object<Token>
    ) acquires Marketplace {
        let buyer_addr = signer::address_of(buyer);
        let token_addr = object::object_address(&token);
        
        let marketplace = borrow_global_mut<Marketplace>(@nft_addr);
        
        // Check listing exists
        assert!(simple_map::contains_key(&marketplace.listings, &token_addr), E_NOT_LISTED);
        
        let listing = simple_map::borrow(&marketplace.listings, &token_addr);
        let price = listing.price;
        let seller_addr = listing.seller;
        
        // Can't buy your own
        assert!(buyer_addr != seller_addr, E_CANNOT_BUY_OWN);
        
        // Calculate fees
        let platform_fee = (price * marketplace.fee_bps) / 10000;
        let seller_proceeds = price - platform_fee;
        
        // Process payments
        coin::transfer<CedraCoin>(buyer, marketplace.fee_recipient, platform_fee);
        coin::transfer<CedraCoin>(buyer, seller_addr, seller_proceeds);
        
        // Transfer NFT - need seller to have signed or use escrow
        // In practice, you'd use object::transfer_to_object for escrow
        // or require seller signature
        
        // Remove listing
        simple_map::remove(&mut marketplace.listings, &token_addr);
        
        event::emit(Sale {
            token: token_addr,
            seller: seller_addr,
            buyer: buyer_addr,
            price
        });
    }
    
    /// Check if NFT is listed
    #[view]
    public fun is_listed(token: Object<Token>): bool acquires Marketplace {
        let token_addr = object::object_address(&token);
        let marketplace = borrow_global<Marketplace>(@nft_addr);
        simple_map::contains_key(&marketplace.listings, &token_addr)
    }
    
    /// Get listing price
    #[view]
    public fun get_listing_price(token: Object<Token>): u64 acquires Marketplace {
        let token_addr = object::object_address(&token);
        let marketplace = borrow_global<Marketplace>(@nft_addr);
        simple_map::borrow(&marketplace.listings, &token_addr).price
    }
}
```

---

## 👑 Royalty Handling

Pay creators on secondary sales:

```move
module nft_addr::royalty_marketplace {
    use std::signer;
    use std::option;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_token_objects::token::Token;
    use cedra_token_objects::royalty;

    const E_NOT_LISTED: u64 = 1;
    
    /// Calculate royalty for a sale
    #[view]
    public fun calculate_royalty(token: Object<Token>, sale_price: u64): (address, u64) {
        let royalty_opt = royalty::get(token);
        
        if (option::is_none(&royalty_opt)) {
            // No royalty set
            return (@0x0, 0)
        };
        
        let royalty_info = option::extract(&mut royalty_opt);
        let numerator = royalty::numerator(&royalty_info);
        let denominator = royalty::denominator(&royalty_info);
        let payee = royalty::payee(&royalty_info);
        
        let royalty_amount = (sale_price * numerator) / denominator;
        
        (payee, royalty_amount)
    }
    
    /// Execute sale with royalty payment
    public entry fun execute_sale(
        buyer: &signer,
        token: Object<Token>,
        seller: address,
        price: u64,
        platform_fee_recipient: address,
        platform_fee_bps: u64
    ) {
        // Calculate platform fee
        let platform_fee = (price * platform_fee_bps) / 10000;
        
        // Calculate royalty
        let (royalty_payee, royalty_amount) = calculate_royalty(token, price);
        
        // Seller gets: price - platform_fee - royalty
        let seller_proceeds = price - platform_fee - royalty_amount;
        
        // Pay platform
        if (platform_fee > 0) {
            coin::transfer<CedraCoin>(buyer, platform_fee_recipient, platform_fee);
        };
        
        // Pay royalty
        if (royalty_amount > 0 && royalty_payee != @0x0) {
            coin::transfer<CedraCoin>(buyer, royalty_payee, royalty_amount);
        };
        
        // Pay seller
        coin::transfer<CedraCoin>(buyer, seller, seller_proceeds);
        
        // Transfer would happen here with proper escrow
    }
}
```

---

## 🔐 Escrow-Based Trading

Secure trading with locked NFTs:

```move
module nft_addr::escrow_trade {
    use std::signer;
    use cedra_framework::object::{Self, Object, ExtendRef};
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_token_objects::token::Token;

    const E_NOT_SELLER: u64 = 1;
    const E_NOT_ACTIVE: u64 = 2;
    const E_WRONG_PRICE: u64 = 3;
    
    /// Escrow holds the NFT while listed
    struct Escrow has key {
        seller: address,
        price: u64,
        token_extend_ref: ExtendRef,
        active: bool
    }
    
    /// Create escrow and lock NFT
    public entry fun create_escrow(
        seller: &signer,
        token: Object<Token>,
        price: u64
    ) {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);
        
        // Transfer NFT to escrow object
        // The escrow object can hold the NFT
        let constructor_ref = object::create_object(seller_addr);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let escrow_signer = object::generate_signer(&constructor_ref);
        
        // Transfer NFT to escrow
        object::transfer(seller, token, signer::address_of(&escrow_signer));
        
        // Store escrow data
        move_to(&escrow_signer, Escrow {
            seller: seller_addr,
            price,
            token_extend_ref: extend_ref,
            active: true
        });
    }
    
    /// Buy from escrow
    public entry fun buy_from_escrow(
        buyer: &signer,
        escrow: Object<Escrow>,
        token: Object<Token>
    ) acquires Escrow {
        let buyer_addr = signer::address_of(buyer);
        let escrow_addr = object::object_address(&escrow);
        
        let escrow_data = borrow_global_mut<Escrow>(escrow_addr);
        
        assert!(escrow_data.active, E_NOT_ACTIVE);
        
        // Pay seller
        coin::transfer<CedraCoin>(buyer, escrow_data.seller, escrow_data.price);
        
        // Get escrow signer to transfer NFT
        let escrow_signer = object::generate_signer_for_extending(&escrow_data.token_extend_ref);
        
        // Transfer NFT to buyer
        object::transfer(&escrow_signer, token, buyer_addr);
        
        // Mark escrow inactive
        escrow_data.active = false;
    }
    
    /// Cancel escrow and return NFT
    public entry fun cancel_escrow(
        seller: &signer,
        escrow: Object<Escrow>,
        token: Object<Token>
    ) acquires Escrow {
        let seller_addr = signer::address_of(seller);
        let escrow_addr = object::object_address(&escrow);
        
        let escrow_data = borrow_global_mut<Escrow>(escrow_addr);
        
        assert!(escrow_data.seller == seller_addr, E_NOT_SELLER);
        assert!(escrow_data.active, E_NOT_ACTIVE);
        
        // Get escrow signer
        let escrow_signer = object::generate_signer_for_extending(&escrow_data.token_extend_ref);
        
        // Return NFT to seller
        object::transfer(&escrow_signer, token, seller_addr);
        
        escrow_data.active = false;
    }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build an Offer System

Allow buyers to make offers on NFTs:

```move
module nft_addr::offer_system {
    use std::signer;
    
    struct Offer has store {
        buyer: address,
        amount: u64,
        expiration: u64
    }
    
    // TODO: Implement
    
    /// Make an offer on an NFT
    public entry fun make_offer(
        buyer: &signer,
        token_addr: address,
        amount: u64,
        duration_seconds: u64
    ) {
        // Your code: escrow payment, create offer
    }
    
    /// Accept an offer (seller)
    public entry fun accept_offer(
        seller: &signer,
        token_addr: address,
        buyer: address
    ) {
        // Your code: transfer NFT, release payment
    }
    
    /// Cancel offer (buyer)
    public entry fun cancel_offer(
        buyer: &signer,
        token_addr: address
    ) {
        // Your code: refund escrowed payment
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module nft_addr::offer_system {
    use std::signer;
    use cedra_framework::object::{Self, Object};
    use cedra_framework::coin::{Self, Coin};
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_framework::timestamp;
    use cedra_framework::simple_map::{Self, SimpleMap};
    use cedra_token_objects::token::Token;

    const E_OFFER_EXPIRED: u64 = 1;
    const E_NOT_BUYER: u64 = 2;
    const E_NOT_OWNER: u64 = 3;
    const E_NO_OFFER: u64 = 4;
    
    struct Offer has store {
        buyer: address,
        amount: u64,
        expiration: u64
    }
    
    struct OfferStore has key {
        // token_addr -> buyer -> Offer
        offers: SimpleMap<address, SimpleMap<address, Offer>>,
        escrowed_funds: SimpleMap<address, Coin<CedraCoin>>  // buyer -> coins
    }
    
    fun init_module(deployer: &signer) {
        move_to(deployer, OfferStore {
            offers: simple_map::new(),
            escrowed_funds: simple_map::new()
        });
    }
    
    public entry fun make_offer(
        buyer: &signer,
        token_addr: address,
        amount: u64,
        duration_seconds: u64
    ) acquires OfferStore {
        let buyer_addr = signer::address_of(buyer);
        let now = timestamp::now_seconds();
        
        let store = borrow_global_mut<OfferStore>(@nft_addr);
        
        // Escrow the payment
        let payment = coin::withdraw<CedraCoin>(buyer, amount);
        
        if (simple_map::contains_key(&store.escrowed_funds, &buyer_addr)) {
            let existing = simple_map::borrow_mut(&mut store.escrowed_funds, &buyer_addr);
            coin::merge(existing, payment);
        } else {
            simple_map::add(&mut store.escrowed_funds, buyer_addr, payment);
        };
        
        // Create offer
        let offer = Offer {
            buyer: buyer_addr,
            amount,
            expiration: now + duration_seconds
        };
        
        if (!simple_map::contains_key(&store.offers, &token_addr)) {
            simple_map::add(&mut store.offers, token_addr, simple_map::new());
        };
        
        let token_offers = simple_map::borrow_mut(&mut store.offers, &token_addr);
        simple_map::add(token_offers, buyer_addr, offer);
    }
    
    public entry fun accept_offer(
        seller: &signer,
        token: Object<Token>,
        buyer: address
    ) acquires OfferStore {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);
        
        // Verify ownership
        assert!(object::owner(token) == seller_addr, E_NOT_OWNER);
        
        let store = borrow_global_mut<OfferStore>(@nft_addr);
        
        // Get offer
        assert!(simple_map::contains_key(&store.offers, &token_addr), E_NO_OFFER);
        let token_offers = simple_map::borrow_mut(&mut store.offers, &token_addr);
        assert!(simple_map::contains_key(token_offers, &buyer), E_NO_OFFER);
        
        let offer = simple_map::remove(token_offers, &buyer);
        
        // Check not expired
        assert!(timestamp::now_seconds() <= offer.expiration, E_OFFER_EXPIRED);
        
        // Release escrowed funds to seller
        let escrowed = simple_map::borrow_mut(&mut store.escrowed_funds, &buyer);
        let payment = coin::extract(escrowed, offer.amount);
        coin::deposit(seller_addr, payment);
        
        // Transfer NFT to buyer
        object::transfer(seller, token, buyer);
    }
    
    public entry fun cancel_offer(
        buyer: &signer,
        token_addr: address
    ) acquires OfferStore {
        let buyer_addr = signer::address_of(buyer);
        let store = borrow_global_mut<OfferStore>(@nft_addr);
        
        // Get and remove offer
        let token_offers = simple_map::borrow_mut(&mut store.offers, &token_addr);
        assert!(simple_map::contains_key(token_offers, &buyer_addr), E_NO_OFFER);
        
        let offer = simple_map::remove(token_offers, &buyer_addr);
        
        // Refund escrowed funds
        let escrowed = simple_map::borrow_mut(&mut store.escrowed_funds, &buyer_addr);
        let refund = coin::extract(escrowed, offer.amount);
        coin::deposit(buyer_addr, refund);
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
Who can transfer an NFT?

- A) Anyone
- B) Only the creator
- C) Only the current owner
- D) Only the marketplace

<details>
<summary>Answer</summary>
**C) Only the current owner** - NFT transfers require the owner's signature.
</details>

### Question 2
What is escrow used for in NFT trading?

- A) To set prices
- B) To securely hold assets during a trade
- C) To create new NFTs
- D) To burn NFTs

<details>
<summary>Answer</summary>
**B) To securely hold assets during a trade** - Escrow locks assets until trade conditions are met.
</details>

---

## 📝 Key Takeaways

1. **object::transfer** = core transfer function
2. **Only owner can transfer** = security by default
3. **Escrow enables trustless trading** = lock then swap
4. **Royalties are optional** = check before paying
5. **Platform fees** = marketplace revenue model

---

## 🚀 What's Next?

In the final lesson, we'll explore **NFT Burning & Composability**!

[Continue to Lesson 4: Burning & Composability →](./lesson-04-burning-composability.md)
