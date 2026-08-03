#!/usr/bin/env bash
# ==============================================================================
# Blue Ledger - One-Click Deployment & ABI Sync Script
# ==============================================================================
set -e

echo "🌊 Blue Ledger: Preparing deployment..."

# 1. Check RPC URL & Private Key
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}
PRIVATE_KEY=${PRIVATE_KEY:-"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"} # Default Anvil Account #0

echo "⚙️  Target RPC: $RPC_URL"

# 2. Change to contracts directory & build
cd "$(dirname "$0")/contracts"

echo "🔨 Compiling smart contracts with Forge..."
forge build

echo "🚀 Deploying BlueLedger Core Contract..."
DEPLOY_OUTPUT=$(PRIVATE_KEY=$PRIVATE_KEY forge script script/DeployBlueLedger.s.sol:DeployBlueLedger --rpc-url $RPC_URL --broadcast 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract deployed address
BLUE_LEDGER_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "BlueLedger contract deployed to:" | awk '{print $NF}')

if [ -z "$BLUE_LEDGER_ADDR" ]; then
    echo "⚠️  Could not parse deployed BlueLedger address automatically. Check forge broadcast logs."
else
    echo "✅ Deployed BlueLedger Address: $BLUE_LEDGER_ADDR"
    
    # Update frontend contractAddress.ts
    ADDR_FILE="../blue-ledger-ai-verifier/src/contracts/contractAddress.ts"
    echo "export const blueLedgerAddress = \"$BLUE_LEDGER_ADDR\";" > "$ADDR_FILE"
    echo "✅ Updated $ADDR_FILE with new contract address."
fi

echo "🎉 Deployment completed successfully!"
