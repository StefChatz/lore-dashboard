import { NextResponse } from 'next/server';
import { RestClientV5 } from 'bybit-api';

export async function GET() {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret || apiKey === 'your_bybit_api_key_here' || apiSecret === 'your_bybit_api_secret_here') {
    // Return empty data structure when credentials not configured
    return NextResponse.json({
      summary: {
        total_usd_value: 0,
        chain_count: 0,
        token_count: 0,
        protocol_count: 0,
        position_count: 0,
      },
      tokens: [],
      protocols: [],
      chains: [],
      history: [],
      address: 'Bybit Account (Not Configured)',
      accounts: {
        unified: {
          totalEquity: 0,
          totalWalletBalance: 0,
          totalAvailableBalance: 0,
          totalInitialMargin: 0,
          totalMaintenanceMargin: 0,
          accountIMRate: '0',
          accountMMRate: '0',
          accountType: 'UNIFIED',
          coins: [],
        },
        funding: {
          totalValue: 0,
          balances: [],
          accountType: 'FUND',
        }
      },
      positions: {
        total: 0,
        totalUnrealisedPnl: 0,
        list: [],
      },
      _message: 'Bybit API credentials not configured. Add BYBIT_API_KEY and BYBIT_API_SECRET to environment variables.'
    });
  }

  try {
    const client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
      testnet: false,
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

    // Transform to match dashboard structure with Bybit-specific data
    const transformedData = {
      summary: {
        total_usd_value: totalValue,
        chain_count: 2, // Unified and Funding
        token_count: 0,
        protocol_count: allPositions.length > 0 ? 1 : 0,
        position_count: allPositions.length,
      },
      tokens: [] as any[],
      protocols: [] as any[],
      chains: [
        {
          name: 'Unified Account',
          usd_value: unifiedEquity,
          logo_url: 'https://www.bybit.com/favicon.ico',
          account_type: 'UNIFIED',
        },
        {
          name: 'Funding Account',
          usd_value: fundingTotalValue,
          logo_url: 'https://www.bybit.com/favicon.ico',
          account_type: 'FUND',
        }
      ],
      history: [],
      address: 'Bybit Account',
      accounts: {
        unified: {
          totalEquity: unifiedEquity,
          totalWalletBalance: parseFloat(unifiedAccount?.totalWalletBalance || '0'),
          totalAvailableBalance: parseFloat(unifiedAccount?.totalAvailableBalance || '0'),
          totalInitialMargin: parseFloat(unifiedAccount?.totalInitialMargin || '0'),
          totalMaintenanceMargin: parseFloat(unifiedAccount?.totalMaintenanceMargin || '0'),
          accountIMRate: unifiedAccount?.accountIMRate || '0',
          accountMMRate: unifiedAccount?.accountMMRate || '0',
          accountType: 'UNIFIED',
          coins: unifiedAccount?.coin || [],
        },
        funding: {
          totalValue: fundingTotalValue,
          balances: fundingBalances,
          accountType: 'FUND',
        }
      },
      positions: {
        total: allPositions.length,
        totalUnrealisedPnl: totalUnrealisedPnl,
        list: allPositions,
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
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      body: error?.body,
      retCode: error?.retCode,
      retMsg: error?.retMsg,
    });

    // Determine error type and provide helpful message
    let errorMessage = error?.message || 'Failed to fetch Bybit data';
    let troubleshootingTips = '';

    // Check for common error patterns
    if (errorMessage.toLowerCase().includes('forbidden') || error?.retCode === 10003 || error?.retCode === 33004) {
      errorMessage = 'Forbidden - API Key Restrictions';
      troubleshootingTips = 'Your Bybit API key has IP restrictions. To fix: 1) Go to Bybit API Management, 2) Edit your API key, 3) Either disable IP restrictions OR add Vercel\'s IP ranges (not recommended for security), 4) OR create a new API key without IP restrictions.';
    } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('authentication')) {
      errorMessage = 'Invalid API credentials';
      troubleshootingTips = 'Check that BYBIT_API_KEY and BYBIT_API_SECRET are correctly set in Vercel environment variables.';
    } else if (errorMessage.toLowerCase().includes('permission')) {
      errorMessage = 'Insufficient API permissions';
      troubleshootingTips = 'Your API key needs these permissions: Read-only for Account and Wallet.';
    }

    // Return empty data structure on error instead of failing
    return NextResponse.json({
      summary: {
        total_usd_value: 0,
        chain_count: 0,
        token_count: 0,
        protocol_count: 0,
        position_count: 0,
      },
      tokens: [],
      protocols: [],
      chains: [],
      history: [],
      address: 'Bybit Account (Error)',
      accounts: {
        unified: {
          totalEquity: 0,
          totalWalletBalance: 0,
          totalAvailableBalance: 0,
          totalInitialMargin: 0,
          totalMaintenanceMargin: 0,
          accountIMRate: '0',
          accountMMRate: '0',
          accountType: 'UNIFIED',
          coins: [],
        },
        funding: {
          totalValue: 0,
          balances: [],
          accountType: 'FUND',
        }
      },
      positions: {
        total: 0,
        totalUnrealisedPnl: 0,
        list: [],
      },
      _error: errorMessage,
      _troubleshooting: troubleshootingTips,
      _errorDetails: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code,
        retCode: error?.retCode,
        retMsg: error?.retMsg,
      } : undefined
    });
  }
}