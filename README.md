# 🌊 Blue Ledger: Decentralized Blue Carbon Registry & AI Verification Platform

**Blue Ledger** is an enterprise-grade, full-stack decentralized Web3 application designed to bring end-to-end transparency, cryptographic trust, and efficiency to the blue carbon credit market. By combining **Polygon Smart Contracts (ERC-1155)**, **Gemini Multi-modal AI Telemetry**, and **Decentralized Storage (IPFS)**, Blue Ledger streamlines coastal mangrove restoration verification and carbon trading.

---

## 🌟 Key Features & Enterprise Capabilities

### 1. 📜 On-Chain Carbon Credit Retirement & ESG Certificates
- Token holders can burn ERC-1155 credits directly on-chain (`retireCredits`) to permanently record carbon offset compliance.
- Automatically generates verifiable, downloadable **Certificates of Carbon Sequestration** with transaction hashes, QR code validation, and beneficiary details for corporate ESG reporting.

### 2. 🤖 Gemini AI Satellite Telemetry (dMRV)
- Multi-modal AI analysis of aerial & satellite mangrove imagery calculating **sapling density**, **NDVI canopy health**, **environmental anomaly detection**, and **CO₂ sequestration estimation**.
- Includes automatic fallback simulation mode for seamless offline or local development.

### 3. 🏪 DeFi Blue Carbon Marketplace with Secondary Royalties
- ERC-1155 carbon credit marketplace with automated 5% secondary sales royalty split direct to coastal project owner NGO wallets.
- Supports fractional trading and multi-currency token settlement.

### 4. 🗺️ Interactive GIS Geospatial Map
- Leaflet map integration with ESRI World Imagery satellite layers, mangrove delta location tags, and real-time project status popups.

### 5. 🛡️ Foundry Smart Contract Test Suite
- Comprehensive smart contract unit and integration test coverage (`BlueLedger.t.sol`) validating project registration, MRV submissions, verification, token minting, marketplace sales, and credit retirement.

---

## 🏗️ Architecture Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │                   Blue Ledger Frontend                  │
 │      React • Vite • Wagmi • RainbowKit • Tailwind CSS    │
 └────────────────────────────┬────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
 ┌───────────────────────────┐ ┌───────────────────────────┐
 │   Polygon Smart Contracts │ │   AI Verifier Backend     │
 │  BlueLedger (ERC-1155)    │ │   Express • Gemini API    │
 │  BlueLedgerMarketplace    │ │   IPFS Gateway Ingestion  │
 └───────────────────────────┘ └───────────────────────────┘
```

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [Foundry (forge, anvil)](https://getfoundry.sh/)

### 1. Environment Setup

Create `.env` file inside `blue-ledger-ai-verifier/backend/.env`:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. One-Click Launch Script
Make scripts executable and start local dev environment:
```bash
chmod +x start-dev.sh deploy-all.sh
./start-dev.sh
```

This launches:
- **Frontend dApp:** [http://localhost:5173](http://localhost:5173)
- **AI Verifier Backend:** [http://localhost:3001](http://localhost:3001)

---

## 🧪 Smart Contract Testing (Foundry)

Run the Foundry test suite:
```bash
cd contracts
forge test -vv
```

To deploy contracts to Polygon Amoy Testnet:
```bash
PRIVATE_KEY=your_private_key RPC_URL=https://rpc-amoy.polygon.technology ../deploy-all.sh
```

---

## 📄 License
SPDX-License-Identifier: MIT
