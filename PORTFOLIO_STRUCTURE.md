# Portfolio Dashboard Structure

## Pages

### Home Page (`/`)
- **Component**: `src/components/HomePage.tsx`
- **Features**:
  - Combined view of Wallet + Bybit data
  - Total portfolio value across all sources
  - Top 6 holdings from both sources
  - Top 4 active positions/protocols
  - Quick overview statistics

### Wallet Page (`/wallet`)
- **Component**: `src/components/WalletDashboard.tsx`
- **Features**:
  - Multi-chain wallet balance
  - Balance per chain (wallet + protocol breakdown)
  - Top 3 tokens (expandable to show all)
  - All DeFi protocols and positions
  - Full tabs: Overview, Protocols, Tokens, Chains

### Bybit Page (`/bybit`)
- **Component**: `src/components/BybitDashboard.tsx`
- **Features**:
  - Unified & Funding account balances
  - Active perpetual positions (Linear & Inverse)
  - Detailed position metrics (PnL, entry, mark, liq prices)
  - Color-coded profit/loss indicators
  - Full tabs: Overview, Protocols, Tokens, Chains

## API Routes

### `/api/wallet`
- Fetches multi-chain wallet data
- Parameters: `days` (default: 1)
- Returns: wallet balance, tokens, protocols, chains, history

### `/api/bybit`
- Fetches Bybit account data
- Returns:
  - Unified account balance
  - Funding account balance
  - Open positions (linear + inverse)
  - Transformed into dashboard format

## Environment Variables

Create `.env.local` in the project root:

```env
# Wallet API
WALLET_API_URL=https://multi-chain-api.vercel.app/api/wallet
WALLET_ADDRESS=your_wallet_address

# Bybit API
BYBIT_API_KEY=your_bybit_api_key
BYBIT_API_SECRET=your_bybit_api_secret
BYBIT_BASE_URL=https://api.bybit.com
```

## Navigation

The dashboard includes a top navigation bar with:
- **Home**: Combined portfolio overview
- **Wallet**: On-chain wallet and DeFi positions
- **Bybit**: Centralized exchange balances and trading positions

## Key Features

1. **Multi-Source Aggregation**: Combines on-chain and CEX data
2. **Real-time Updates**: Refresh button on each page
3. **Detailed Breakdowns**: Separate pages for focused analysis
4. **Position Tracking**: View DeFi protocols and perpetual positions
5. **Visual Indicators**: Color-coded profits/losses, progress bars
