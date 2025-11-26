/**
 * Cedra DApp - Counter Contract Interaction
 * 
 * This example demonstrates how to interact with a deployed
 * Counter smart contract on Cedra using the TypeScript SDK.
 */

import { Cedra, CedraConfig, Account, Network, Ed25519PrivateKey } from "@cedra-labs/ts-sdk";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Network configuration
const config = new CedraConfig({ network: Network.TESTNET });
const cedra = new Cedra(config);

// Deployed module address on testnet
const MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4";
const MODULE_NAME = "simple_counter";

// =============================================================================
// ACCOUNT MANAGEMENT
// =============================================================================

/**
 * Create a new random account
 */
export function createAccount(): Account {
    return Account.generate();
}

/**
 * Import account from private key
 */
export function importAccount(privateKeyHex: string): Account {
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    return Account.fromPrivateKey({ privateKey });
}

/**
 * Fund account with test tokens from faucet
 */
export async function fundAccount(address: string, amount: number = 100_000_000): Promise<void> {
    await cedra.faucet.fundAccount({
        accountAddress: address,
        amount,
    });
    console.log(`Funded ${address} with ${amount} octas`);
}

// =============================================================================
// COUNTER CONTRACT INTERACTIONS
// =============================================================================

/**
 * Initialize a counter for the account
 */
export async function initializeCounter(account: Account): Promise<string> {
    const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
            functionArguments: [],
        },
    });

    const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
    });

    await cedra.waitForTransaction({
        transactionHash: pendingTxn.hash,
    });

    console.log(`Counter initialized. Tx: ${pendingTxn.hash}`);
    return pendingTxn.hash;
}

/**
 * Increment the counter by 1
 */
export async function increment(account: Account): Promise<string> {
    const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::increment`,
            functionArguments: [],
        },
    });

    const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
    });

    await cedra.waitForTransaction({
        transactionHash: pendingTxn.hash,
    });

    console.log(`Counter incremented. Tx: ${pendingTxn.hash}`);
    return pendingTxn.hash;
}

/**
 * Increment the counter by a specified amount
 */
export async function incrementBy(account: Account, amount: number): Promise<string> {
    const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::increment_by`,
            functionArguments: [amount],
        },
    });

    const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
    });

    await cedra.waitForTransaction({
        transactionHash: pendingTxn.hash,
    });

    console.log(`Counter incremented by ${amount}. Tx: ${pendingTxn.hash}`);
    return pendingTxn.hash;
}

/**
 * Decrement the counter by 1
 */
export async function decrement(account: Account): Promise<string> {
    const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::decrement`,
            functionArguments: [],
        },
    });

    const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
    });

    await cedra.waitForTransaction({
        transactionHash: pendingTxn.hash,
    });

    console.log(`Counter decremented. Tx: ${pendingTxn.hash}`);
    return pendingTxn.hash;
}

/**
 * Reset the counter to 0
 */
export async function resetCounter(account: Account): Promise<string> {
    const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::reset`,
            functionArguments: [],
        },
    });

    const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
    });

    await cedra.waitForTransaction({
        transactionHash: pendingTxn.hash,
    });

    console.log(`Counter reset. Tx: ${pendingTxn.hash}`);
    return pendingTxn.hash;
}

// =============================================================================
// VIEW FUNCTIONS (No gas cost)
// =============================================================================

/**
 * Get the current counter value
 */
export async function getCount(accountAddress: string): Promise<number> {
    const result = await cedra.view({
        payload: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_count`,
            functionArguments: [accountAddress],
        },
    });

    const count = Number(result[0]);
    console.log(`Current count: ${count}`);
    return count;
}

/**
 * Check if an account has a counter
 */
export async function hasCounter(accountAddress: string): Promise<boolean> {
    const result = await cedra.view({
        payload: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::has_counter`,
            functionArguments: [accountAddress],
        },
    });

    const exists = Boolean(result[0]);
    console.log(`Has counter: ${exists}`);
    return exists;
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function main() {
    console.log("=== Cedra Counter DApp Demo ===\n");

    // 1. Create a new account
    const account = createAccount();
    console.log(`Created account: ${account.accountAddress}`);

    // 2. Fund the account
    await fundAccount(account.accountAddress.toString());

    // 3. Check if counter exists
    const exists = await hasCounter(account.accountAddress.toString());
    console.log(`Counter exists: ${exists}`);

    // 4. Initialize counter if it doesn't exist
    if (!exists) {
        await initializeCounter(account);
    }

    // 5. Increment a few times
    await increment(account);
    await increment(account);
    await incrementBy(account, 5);

    // 6. Check current value
    const count = await getCount(account.accountAddress.toString());
    console.log(`Final count: ${count}`);

    // 7. Decrement once
    await decrement(account);

    // 8. Check again
    const newCount = await getCount(account.accountAddress.toString());
    console.log(`After decrement: ${newCount}`);

    console.log("\n=== Demo Complete ===");
}

// Run the demo
main().catch(console.error);
