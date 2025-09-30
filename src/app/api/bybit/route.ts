import { NextResponse } from 'next/server';
import { RestClientV5 } from 'bybit-api';

export async function GET() {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Missing Bybit API credentials' },
      { status: 500 }
    );
  }

  try {
    const client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
    });

    // Fetch unified account wallet balance
    const unifiedResponse = await client.getWalletBalance({
      accountType: 'UNIFIED',
    });

    // Fetch funding account balance - use getAllCoinsBalance
    const fundingResponse = await client.getAllCoinsBalance({
      accountType: 'FUND',
    });

    // Fetch open positions for all categories
    const [linearPositions, inversePositions] = await Promise.all([
      client.getPositionInfo({ category: 'linear', settleCoin: 'USDT' }).catch(() => ({ result: { list: [] } })),
      client.getPositionInfo({ category: 'inverse' }).catch(() => ({ result: { list: [] } })),
    ]);

    if (unifiedResponse.retCode !== 0) {
      throw new Error(`Bybit API error: ${unifiedResponse.retMsg}`);
    }

    const unifiedAccount = unifiedResponse.result?.list?.[0];
    const fundingBalances = fundingResponse.result?.balance || [];
    
    // Calculate funding account total value
    let fundingTotalValue = 0;
    if (Array.isArray(fundingBalances)) {
      fundingBalances.forEach((coin: any) => {
        const balance = parseFloat(coin.walletBalance || '0');
        if (balance > 0) {
          // We'll need to get USD value from unified account prices or assume
          fundingTotalValue += balance;
        }
      });
    }

    // Combine all positions
    const allPositions = [
      ...(linearPositions.result?.list || []),
      ...(inversePositions.result?.list || []),
    ].filter((pos: any) => parseFloat(pos.size || '0') > 0);

    // Calculate total PnL from positions
    let totalUnrealisedPnl = 0;
    allPositions.forEach((pos: any) => {
      totalUnrealisedPnl += parseFloat(pos.unrealisedPnl || '0');
    });

    const unifiedEquity = parseFloat(unifiedAccount?.totalEquity || '0');
    const totalValue = unifiedEquity + fundingTotalValue;

    // Transform to match dashboard structure
    const transformedData = {
      summary: {
        total_usd_value: totalValue,
        chain_count: 1, // Bybit is centralized
        token_count: 0,
        protocol_count: allPositions.length > 0 ? 1 : 0, // Show positions as a protocol
      },
      tokens: [] as any[],
      protocols: [] as any[],
      chains: [
        {
          name: 'Bybit',
          usd_value: totalValue,
          logo_url: 'https://www.bybit.com/favicon.ico',
        }
      ],
      history: [],
      address: 'Bybit Account',
      accounts: {
        unified: {
          totalEquity: unifiedEquity,
          totalWalletBalance: parseFloat(unifiedAccount?.totalWalletBalance || '0'),
          totalAvailableBalance: parseFloat(unifiedAccount?.totalAvailableBalance || '0'),
          accountType: 'UNIFIED',
          coins: unifiedAccount?.coin || [],
        },
        funding: {
          totalValue: fundingTotalValue,
          balances: fundingBalances,
          accountType: 'FUND',
        }
      }
    };

    // Process unified account coins into tokens
    if (unifiedAccount?.coin) {
      unifiedAccount.coin.forEach((coinData: any) => {
        const walletBalance = parseFloat(coinData.walletBalance || '0');
        const usdValue = parseFloat(coinData.usdValue || '0');
        
        if (walletBalance > 0 || usdValue > 0) {
          transformedData.tokens.push({
            symbol: coinData.coin,
            name: coinData.coin,
            chain: 'Bybit Unified',
            amount: walletBalance,
            price: walletBalance > 0 ? usdValue / walletBalance : 0,
            value: usdValue,
            logo: `https://api.bybit.com/v2/public/images/coin/${coinData.coin.toLowerCase()}.png`,
            price_change_24h: 0,
          });
          transformedData.summary.token_count++;
        }
      });
    }

    // Process funding account coins into tokens
    if (Array.isArray(fundingBalances)) {
      fundingBalances.forEach((coinData: any) => {
        const walletBalance = parseFloat(coinData.walletBalance || '0');
        const transferBalance = parseFloat(coinData.transferBalance || '0');
        const totalBalance = walletBalance + transferBalance;
        
        if (totalBalance > 0) {
          transformedData.tokens.push({
            symbol: coinData.coin,
            name: coinData.coin,
            chain: 'Bybit Funding',
            amount: totalBalance,
            price: 0, // Funding account doesn't provide USD price
            value: 0,
            logo: `https://api.bybit.com/v2/public/images/coin/${coinData.coin.toLowerCase()}.png`,
            price_change_24h: 0,
          });
          transformedData.summary.token_count++;
        }
      });
    }

    // Process open positions as a "protocol"
    if (allPositions.length > 0) {
      const positionsList = allPositions.map((pos: any) => {
        const unrealisedPnl = parseFloat(pos.unrealisedPnl || '0');
        const positionValue = parseFloat(pos.positionValue || '0');
        const symbol = pos.symbol || 'Unknown';
        const side = pos.side || 'None';
        const leverage = pos.leverage || '1';
        
        return {
          name: `${symbol} ${side} ${leverage}x`,
          net_value: unrealisedPnl,
          positionValue: positionValue,
          size: pos.size,
          avgPrice: pos.avgPrice,
          markPrice: pos.markPrice,
          liqPrice: pos.liqPrice,
        };
      });

      transformedData.protocols.push({
        name: 'Perpetual Positions',
        chain: 'Bybit',
        logo: 'https://www.bybit.com/favicon.ico',
        positions: positionsList,
      });
    }

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error('Bybit API error:', error);

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch Bybit data' },
      { status: 500 }
    );
  }
}