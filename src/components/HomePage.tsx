'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';

interface CombinedData {
  wallet: any;
  bybit: any;
  combined: {
    total_value: number;
    wallet_value: number;
    bybit_value: number;
    total_tokens: number;
    total_protocols: number;
  };
}

const HomePage = () => {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletResponse, bybitResponse] = await Promise.all([
        fetch('/api/wallet?days=1'),
        fetch('/api/bybit'),
      ]);

      if (!walletResponse.ok || !bybitResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const walletData = await walletResponse.json();
      const bybitData = await bybitResponse.json();

      const combined = {
        total_value: (walletData.summary?.total_usd_value || 0) + (bybitData.summary?.total_usd_value || 0),
        wallet_value: walletData.summary?.total_usd_value || 0,
        bybit_value: bybitData.summary?.total_usd_value || 0,
        total_tokens: (walletData.summary?.token_count || 0) + (bybitData.summary?.token_count || 0),
        total_protocols: (walletData.summary?.protocol_count || 0) + (bybitData.summary?.protocol_count || 0),
      };

      setData({
        wallet: walletData,
        bybit: bybitData,
        combined,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <Button onClick={fetchData} variant="outline" className="mt-4 w-full">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const { wallet, bybit, combined } = data;

  // Get top tokens from both sources
  const allTokens = [
    ...(wallet.tokens || []).map((t: any) => ({ ...t, source: 'Wallet' })),
    ...(bybit.tokens || []).filter((t: any) => t.value > 0).map((t: any) => ({ ...t, source: 'Bybit' })),
  ].sort((a, b) => b.value - a.value).slice(0, 6);

  // Get top protocols from both sources
  const walletProtocols = (wallet.protocols || []).map((p: any) => ({
    ...p,
    source: 'Wallet',
    totalValue: p.positions.reduce((sum: number, pos: any) => sum + pos.net_value, 0)
  }));

  const bybitProtocols = (bybit.protocols || []).map((p: any) => ({
    ...p,
    source: 'Bybit',
    totalValue: p.positions.reduce((sum: number, pos: any) => sum + pos.net_value, 0)
  }));

  const topProtocols = [...walletProtocols, ...bybitProtocols]
    .sort((a, b) => Math.abs(b.totalValue) - Math.abs(a.totalValue))
    .slice(0, 4);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    color = 'default'
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    subtitle?: string;
    color?: 'default' | 'green' | 'blue';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : ''}`}>
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Portfolio Overview</h2>
            <p className="text-sm text-muted-foreground">Combined view of all assets</p>
          </div>
          <Button onClick={fetchData} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Portfolio Value"
            value={`$${formatNumber(combined.total_value)}`}
            icon={DollarSign}
          />
          <StatCard
            title="Wallet Balance"
            value={`$${formatNumber(combined.wallet_value)}`}
            icon={TrendingUp}
            color="green"
            subtitle={`${((combined.wallet_value / combined.total_value) * 100).toFixed(1)}% of total`}
          />
          <StatCard
            title="Bybit Balance"
            value={`$${formatNumber(combined.bybit_value)}`}
            icon={TrendingUp}
            color="blue"
            subtitle={`${((combined.bybit_value / combined.total_value) * 100).toFixed(1)}% of total`}
          />
          <StatCard
            title="Total Assets"
            value={combined.total_tokens.toString()}
            icon={Activity}
            subtitle={`${combined.total_protocols} protocols`}
          />
        </div>
      </div>

      {/* Top Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
          <CardDescription>Highest value tokens across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allTokens.map((token: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={token.logo} alt={token.symbol} />
                  <AvatarFallback>{token.symbol?.slice(0, 2) || '??'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{token.symbol}</p>
                      <Badge variant="secondary" className="text-xs">{token.source}</Badge>
                    </div>
                    <p className="text-sm font-semibold">${formatNumber(token.value)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{token.chain}</p>
                    {token.price_change_24h !== 0 && (
                      <p className={`text-xs font-medium ${token.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {token.price_change_24h >= 0 ? '+' : ''}{formatNumber(token.price_change_24h * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Protocols */}
      {topProtocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
            <CardDescription>DeFi protocols and trading positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {topProtocols.map((protocol: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={protocol.logo} alt={protocol.name} />
                    <AvatarFallback>{protocol.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{protocol.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{protocol.chain}</p>
                          <Badge variant="outline" className="text-xs">{protocol.source}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${protocol.source === 'Bybit' ? (protocol.totalValue >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                          {protocol.source === 'Bybit' && protocol.totalValue >= 0 ? '+' : ''}
                          ${formatNumber(Math.abs(protocol.totalValue))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {protocol.source === 'Bybit' ? 'PnL' : 'TVL'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomePage;
