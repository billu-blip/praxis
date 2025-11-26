# Lesson 3: Events - Logging for DApps

## 🎯 Learning Objectives
By the end of this lesson, you will:
- Understand what events are and why they matter
- Create and emit custom events
- Use event handles for organized logging
- Query events from the blockchain

---

## 📖 What are Events?

**Events** are logs emitted by your smart contract that:
- 📝 Record important actions (transfers, mints, votes)
- 🔔 Enable real-time notifications for frontends
- 📊 Provide historical data for analytics
- 🔍 Are indexed for efficient querying

```move
// Event is emitted when someone levels up
#[event]
struct LevelUpEvent has drop, store {
    player: address,
    old_level: u64,
    new_level: u64,
    timestamp: u64
}
```

---

## 🎯 Creating Events

### Simple Event with `#[event]`

```move
module my_addr::game {
    use cedra_framework::event;
    use cedra_framework::timestamp;
    
    #[event]
    struct PlayerJoinedEvent has drop, store {
        player: address,
        name: vector<u8>,
        joined_at: u64
    }
    
    public entry fun join_game(account: &signer, name: vector<u8>) {
        let player = signer::address_of(account);
        
        // Emit the event
        event::emit(PlayerJoinedEvent {
            player,
            name,
            joined_at: timestamp::now_seconds()
        });
        
        // ... rest of game logic
    }
}
```

### Event Requirements

Events must have:
- `drop` ability (so they can be discarded after emission)
- `store` ability (so they can be stored in the event stream)

```move
// ✅ Correct
#[event]
struct TransferEvent has drop, store {
    from: address,
    to: address,
    amount: u64
}

// ❌ Wrong: Missing abilities
#[event]
struct BrokenEvent {  // Needs 'drop, store'
    value: u64
}
```

---

## 📤 Emitting Events

Use `event::emit()` to emit events:

```move
use cedra_framework::event;

public entry fun transfer(
    from: &signer,
    to: address,
    amount: u64
) {
    let from_addr = signer::address_of(from);
    
    // Do the transfer logic...
    
    // Emit event for tracking
    event::emit(TransferEvent {
        from: from_addr,
        to,
        amount
    });
}
```

### Multiple Events

You can emit multiple events in one transaction:

```move
public entry fun batch_transfer(
    from: &signer,
    recipients: vector<address>,
    amounts: vector<u64>
) {
    let from_addr = signer::address_of(from);
    let len = vector::length(&recipients);
    
    let i = 0;
    while (i < len) {
        let to = *vector::borrow(&recipients, i);
        let amount = *vector::borrow(&amounts, i);
        
        // Transfer logic...
        
        // Emit event for each transfer
        event::emit(TransferEvent {
            from: from_addr,
            to,
            amount
        });
        
        i = i + 1;
    };
    
    // Emit summary event
    event::emit(BatchTransferEvent {
        from: from_addr,
        total_recipients: len,
        total_amount: sum_amounts(&amounts)
    });
}
```

---

## 🗂️ Event Design Patterns

### Pattern 1: Action Events

Record what happened:

```move
#[event]
struct TokenMintedEvent has drop, store {
    token_id: u64,
    minter: address,
    recipient: address,
    amount: u64
}

#[event]
struct TokenBurnedEvent has drop, store {
    token_id: u64,
    burner: address,
    amount: u64
}
```

### Pattern 2: State Change Events

Record before and after:

```move
#[event]
struct BalanceChangedEvent has drop, store {
    account: address,
    old_balance: u64,
    new_balance: u64,
    reason: vector<u8>  // "transfer", "mint", "burn", etc.
}
```

### Pattern 3: Lifecycle Events

Record object lifecycle:

```move
#[event]
struct AuctionCreatedEvent has drop, store {
    auction_id: u64,
    creator: address,
    item_id: u64,
    starting_price: u64,
    end_time: u64
}

#[event]
struct BidPlacedEvent has drop, store {
    auction_id: u64,
    bidder: address,
    bid_amount: u64
}

#[event]
struct AuctionEndedEvent has drop, store {
    auction_id: u64,
    winner: address,
    final_price: u64
}
```

---

## 🔍 Querying Events

### From TypeScript SDK

```typescript
import { Cedra } from '@cedra-labs/ts-sdk';

const cedra = new Cedra();

// Get events by type
const events = await cedra.getEventsByEventType({
  eventType: "0x123::game::PlayerJoinedEvent"
});

for (const event of events) {
  console.log(`Player ${event.data.player} joined at ${event.data.joined_at}`);
}
```

### From REST API

```bash
# Get events for a specific event type
curl "https://testnet.cedra.dev/v1/accounts/0x123/events/0x123::game::PlayerJoinedEvent"
```

### From GraphQL (Indexer)

```graphql
query GetTransferEvents {
  events(
    where: {
      type: { _eq: "0x123::token::TransferEvent" }
    }
    order_by: { sequence_number: desc }
    limit: 100
  ) {
    data
    sequence_number
    transaction_version
  }
}
```

---

## 🎮 Interactive Exercise

### Challenge: Build an Auction with Events

Add events to this auction module:

```move
module my_addr::auction {
    use std::signer;
    use cedra_framework::event;
    use cedra_framework::timestamp;
    
    struct Auction has key {
        seller: address,
        item_name: vector<u8>,
        current_bid: u64,
        highest_bidder: address,
        end_time: u64
    }
    
    // TODO: Define these events
    // - AuctionCreatedEvent
    // - NewBidEvent
    // - AuctionWonEvent
    
    public entry fun create_auction(
        seller: &signer,
        item_name: vector<u8>,
        starting_price: u64,
        duration_seconds: u64
    ) {
        let seller_addr = signer::address_of(seller);
        let end_time = timestamp::now_seconds() + duration_seconds;
        
        let auction = Auction {
            seller: seller_addr,
            item_name,
            current_bid: starting_price,
            highest_bidder: @0x0,
            end_time
        };
        
        move_to(seller, auction);
        
        // TODO: Emit AuctionCreatedEvent
    }
    
    public entry fun place_bid(
        bidder: &signer,
        auction_owner: address,
        bid_amount: u64
    ) acquires Auction {
        let bidder_addr = signer::address_of(bidder);
        let auction = borrow_global_mut<Auction>(auction_owner);
        
        // Validate bid
        assert!(bid_amount > auction.current_bid, 1);
        assert!(timestamp::now_seconds() < auction.end_time, 2);
        
        // Update auction
        auction.current_bid = bid_amount;
        auction.highest_bidder = bidder_addr;
        
        // TODO: Emit NewBidEvent
    }
}
```

<details>
<summary>💡 Click for Solution</summary>

```move
module my_addr::auction {
    use std::signer;
    use cedra_framework::event;
    use cedra_framework::timestamp;
    
    struct Auction has key {
        seller: address,
        item_name: vector<u8>,
        current_bid: u64,
        highest_bidder: address,
        end_time: u64
    }
    
    #[event]
    struct AuctionCreatedEvent has drop, store {
        auction_id: address,
        seller: address,
        item_name: vector<u8>,
        starting_price: u64,
        end_time: u64
    }
    
    #[event]
    struct NewBidEvent has drop, store {
        auction_id: address,
        bidder: address,
        bid_amount: u64,
        previous_bid: u64
    }
    
    #[event]
    struct AuctionWonEvent has drop, store {
        auction_id: address,
        winner: address,
        final_price: u64
    }
    
    public entry fun create_auction(
        seller: &signer,
        item_name: vector<u8>,
        starting_price: u64,
        duration_seconds: u64
    ) {
        let seller_addr = signer::address_of(seller);
        let end_time = timestamp::now_seconds() + duration_seconds;
        
        let auction = Auction {
            seller: seller_addr,
            item_name: copy item_name,
            current_bid: starting_price,
            highest_bidder: @0x0,
            end_time
        };
        
        move_to(seller, auction);
        
        // Emit creation event
        event::emit(AuctionCreatedEvent {
            auction_id: seller_addr,
            seller: seller_addr,
            item_name,
            starting_price,
            end_time
        });
    }
    
    public entry fun place_bid(
        bidder: &signer,
        auction_owner: address,
        bid_amount: u64
    ) acquires Auction {
        let bidder_addr = signer::address_of(bidder);
        let auction = borrow_global_mut<Auction>(auction_owner);
        
        let previous_bid = auction.current_bid;
        
        assert!(bid_amount > previous_bid, 1);
        assert!(timestamp::now_seconds() < auction.end_time, 2);
        
        auction.current_bid = bid_amount;
        auction.highest_bidder = bidder_addr;
        
        // Emit bid event
        event::emit(NewBidEvent {
            auction_id: auction_owner,
            bidder: bidder_addr,
            bid_amount,
            previous_bid
        });
    }
}
```

</details>

---

## 🧪 Quiz

### Question 1
What abilities must an event struct have?

- A) `copy, drop`
- B) `drop, store`
- C) `key, store`
- D) `copy, store`

<details>
<summary>Answer</summary>
**B) `drop, store`** - Events need `drop` to be discarded after emission and `store` to be stored in the event stream.
</details>

### Question 2
When are events actually stored?

- A) Immediately when `event::emit` is called
- B) After the transaction commits successfully
- C) Only if the function returns without error
- D) At the end of the block

<details>
<summary>Answer</summary>
**B) After the transaction commits successfully** - If a transaction fails, no events are stored.
</details>

---

## 📝 Key Takeaways

1. **Events** = logs for tracking on-chain actions
2. Use **`#[event]`** attribute to define events
3. Events need **`drop, store`** abilities
4. **`event::emit()`** to emit
5. Events are **queryable** via SDK, API, or indexer
6. Design events for **frontend consumption**

---

## 🚀 What's Next?

In the next lesson, we'll learn about **Error Handling** - how to handle failures gracefully.

[Continue to Lesson 4: Error Handling →](./lesson-04-error-handling.md)
