# 🌊 Blue Ledger: Enterprise Decentralized Blue Carbon Registry & AI Telemetry Platform

> **A Next-Generation Decentralized Application (dApp) for Transparent Mangrove Blue Carbon Sequestration, Gemini AI-Powered Monitoring, Reporting & Verification (dMRV), Tokenized Carbon Credits (ERC-1155), and On-Chain ESG Offset Retirement.**

---

## 📌 Executive Summary

Coastal mangrove ecosystems—often termed **"Blue Carbon" sinks**—sequester carbon dioxide up to **4 to 10 times faster per hectare than mature tropical rainforests**. Despite their immense ecological value, global blue carbon credit markets suffer from three critical bottlenecks:

1. **Lack of Transparency & Double Counting:** Opaque verification processes and manual spreadsheets lead to fraud, double-selling, and over-crediting.
2. **High Verification Costs & Delays:** Traditional MRV (Monitoring, Reporting, Verification) takes months and costs tens of thousands of dollars in manual auditor site visits.
3. **Inaccessible Climate Finance for Local Communities:** Coastal NGOs and indigenous communities doing actual restoration receive less than 15-20% of final credit resale value due to centralized intermediaries.

**Blue Ledger** solves this by establishing an end-to-end, cryptographically verifiable, AI-assisted blockchain ecosystem.

---

## ⚙️ What Does Blue Ledger Do & How Does It Work?

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  1. NGO Project │       │ 2. Drone/Aerial │       │  3. Gemini AI   │       │  4. Polygon     │
│   Registration  │ ────► │  MRV Submission │ ────► │  Multi-spectral │ ────► │   Smart Contract│
│  (On-Chain Geo) │       │   (IPFS Hash)   │       │   Verification  │       │   Token Minting │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                                                       │
                                                                                       ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 8. Printable    │       │ 7. Proof of     │       │ 6. On-Chain     │       │ 5. Secondary    │
│  ESG Offset     │ ◄──── │  Sequestration  │ ◄──── │  Credit Burn    │ ◄──── │   DeFi Market   │
│  Certificate    │       │  Certificate    │       │  (Retire tCO2e) │       │   (5% Royalty)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### End-to-End Operational Lifecycle:
1. **NGO Registration:** Authorized NGOs register coastal mangrove restoration sites on Polygon, attaching GeoJSON boundaries and baseline documentation stored immutably on IPFS.
2. **Telemetry Submission:** Field teams submit drone footage, satellite links, and soil core telemetry.
3. **AI Automated MRV (dMRV):** Gemini 1.5 Multi-modal AI processes satellite imagery, detecting sapling count density, canopy coverage status, and calculating estimated tonnes of CO₂ sequestered.
4. **On-Chain Credit Minting:** The smart contract mints unique **ERC-1155 BLC (Blue Ledger Carbon) Tokens** directly to the NGO's wallet.
5. **Marketplace & Royalties:** Verified credits are listed on the decentralized marketplace. Secondary trades automatically route a **5% secondary royalty back to coastal NGO community funds**.
6. **Burn-to-Offset Retirement:** Corporate buyers burn carbon credits permanently on-chain to offset emissions, generating an official, downloadable **ESG Certificate of Carbon Sequestration** with blockchain QR verification.

---

## 🛠️ Technology Stack & Architectural Decisions (Why Each Tech Was Chosen)

| Technology | Role | Why This Specific Tech Was Chosen |
| :--- | :--- | :--- |
| **Solidity (^0.8.20)** | Smart Contracts | Industry-standard statically typed programming language for Ethereum Virtual Machine (EVM) contracts. Features modern arithmetic overflow checks by default. |
| **OpenZeppelin Contracts** | Security Libraries | Standardized implementation of ERC-1155, ReentrancyGuard, Ownable, and Pausable to prevent reentrancy attacks, double-mints, and unauthorized state changes. |
| **Foundry (Forge)** | Smart Contract Toolchain | Blazing-fast Rust-based framework for compiling, fuzzing, testing, and deploying contracts directly in Solidity without slow JavaScript test runners. |
| **ERC-1155 Token Standard** | Multi-Token Protocol | Chosen over ERC-721 (NFT) and ERC-20 (Fungible) because each mangrove project represents a distinct vintage class (Token ID = Project ID), yet credits within that project are fungible 1:1 (1 Token = 1 Tonne CO₂e). Allows single-contract management of unlimited projects with ~60% lower gas costs. |
| **Polygon Amoy Testnet** | Layer-2 Blockchain | Ethereum L2 providing sub-second finality and near-zero gas costs (~$0.001/tx) while remaining 100% EVM-compatible and environmentally sustainable (Proof-of-Stake). |
| **Gemini 1.5 Multimodal AI** | Computer Vision & Telemetry | Industry-leading multi-modal model capable of processing high-resolution aerial satellite imagery alongside spatial text prompts to count saplings and analyze NDVI canopy health. |
| **IPFS & Pinata** | Decentralized Storage | Ensures baseline drone footage, satellite TIFs, and GeoJSON project metadata cannot be single-point censored, modified, or deleted by any centralized server. |
| **React 18 + Vite** | Frontend UI Framework | Lightning-fast build tool and SPA framework providing sub-second hot module reloading, modular TypeScript component architecture, and crisp UX rendering. |
| **Wagmi + Viem + RainbowKit** | Web3 Integration | Modern TypeScript Web3 hooks replacing legacy web3.js. Provides smooth wallet connect modals (MetaMask, Coinbase, WalletConnect) and type-safe contract read/writes. |
| **Tailwind CSS + Shadcn UI** | Styling & UI Design | Premium dark-mode glassmorphic aesthetics, fluid responsive layouts, micro-animations with Framer Motion, and accessible component design. |

---

## 🏛️ System Architecture & Data Flow

```
                      +------------------------------------------+
                      |         Web3 Frontend UI (Vite)          |
                      |  Dashboard • Map • Marketplace • Retire  |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
     +──────────────────────────────+             +──────────────────────────────+
     |   Polygon Smart Contracts    |             |   AI Verifier Express Server |
     |                              |             |                              |
     | - BlueLedger.sol (ERC-1155)  |             | - Gemini 1.5 Vision API      |
     |   * registerProject()        |             | - /api/analyze-image         |
     |   * submitMRVData()          |             | - /api/health                |
     |   * verifyAndMintCredits()   |             | - Simulated Fallback Engine  |
     |   * retireCredits()          |             +──────────────┬───────────────+
     | - BlueLedgerMarketplace.sol  |                            │
     |   * buyCredits() + Royalty   |                            v
     +──────────────┬───────────────+             +──────────────────────────────+
                    │                             |   Decentralized IPFS Storage |
                    v                             | - GeoJSON Polygon Metadata   |
     +──────────────────────────────+             | - Drone Imagery & Reports    |
     | Polygon Amoy Blockchain L2   |             +──────────────────────────────+
     +──────────────────────────────+
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js `v18+`
- Foundry (`forge`)

### 1. Clone Repository & Setup Backend Environment
```bash
git clone https://github.com/tejasghoti/blue-Ledger-DaPP_vF.git
cd blue-Ledger-DaPP_vF/blue-ledger-dapp/blue-ledger-ai-verifier/backend
npm install
```

Create `.env` file inside `backend/.env`:
```env
PORT=3001
GEMINI_API_KEY=AIzaSyCUbPh9D7Kt8G15FAutSIxGpCVdR7m1uJk
```

### 2. Run Local Development Stack
```bash
cd ../../
chmod +x start-dev.sh deploy-all.sh
./start-dev.sh
```

- **Frontend dApp:** `http://localhost:5173`
- **AI Verifier Backend API:** `http://localhost:3001`

---

## 🧪 Smart Contract Testing (Foundry)

Run the automated test suite covering all core contracts:
```bash
cd contracts
forge test -vv
```

---

## 📦 Vercel One-Click Deployment Guide

1. Push repo to GitHub.
2. Open [Vercel Dashboard](https://vercel.com/new) -> **Import Project**.
3. Set **Root Directory** to: `blue-ledger-ai-verifier`.
4. Framework Preset: `Vite`.
5. Environment Variable:
   - `GEMINI_API_KEY`: `AIzaSyCUbPh9D7Kt8G15FAutSIxGpCVdR7m1uJk`
6. Click **Deploy**!

---

## 📚 Further Study & Deep-Dive Knowledge Base

For a complete breakdown of how this project was engineered from scratch, along with **30 Deep Technical Interview Questions & Answers**, inspect [PROJECT_KNOWLEDGE_BASE.md](file:///Users/tejas/projects:Hackathons/*blueLedger/blue-ledger-dapp/PROJECT_KNOWLEDGE_BASE.md).
