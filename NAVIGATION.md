# Portfolio Dashboard Navigation

## 📍 Available Pages

### 1. **Overview** (`/`)
- Combined portfolio view
- Total value from Wallet + Bybit
- Top 6 holdings across all sources
- Top 4 active positions/protocols
- Quick statistics dashboard

### 2. **Wallet** (`/wallet`)
- Multi-chain wallet dashboard
- On-chain DeFi protocols
- Token balances by chain
- Protocol positions breakdown
- Full overview, protocols, tokens, and chains tabs

### 3. **Bybit** (`/bybit`)
- CEX account balances (Unified + Funding)
- Active perpetual positions
- Position PnL tracking
- Entry, mark, and liquidation prices
- Full overview, protocols, tokens, and chains tabs

## 🧭 Navigation

The navigation bar appears at the top of every page with three buttons:

```
┌─────────────────────────────────────────────────────┐
│  Portfolio Dashboard    [Overview] [Wallet] [Bybit] │
└─────────────────────────────────────────────────────┘
```

- **Overview Button** (🏠): Shows combined portfolio
- **Wallet Button** (💰): Shows on-chain assets
- **Bybit Button** (📊): Shows exchange positions

The active page is highlighted with a filled button, while inactive pages show outlined buttons.

## 🔄 Navigation Flow

```
Overview (/)
    ↓
    ├─→ Wallet (/wallet)
    │   ├─ Balance per Chain
    │   ├─ Token Balances (top 3, expandable)
    │   └─ DeFi Protocols
    │
    └─→ Bybit (/bybit)
        ├─ Unified Account
        ├─ Funding Account
        └─ Perpetual Positions
```

## 🎯 Quick Actions

Each page has a **Refresh** button to reload data:
- Overview: Refreshes both Wallet and Bybit data
- Wallet: Refreshes on-chain data only
- Bybit: Refreshes exchange data only

## 📱 Responsive Design

- Navigation adapts to screen size
- Sticky header stays at top when scrolling
- Mobile-friendly button layout
