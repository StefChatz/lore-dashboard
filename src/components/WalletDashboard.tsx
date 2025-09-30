'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Layers, DollarSign, Activity, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Progress } from '@/registry/new-york-v4/ui/progress';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/new-york-v4/ui/table';

interface WalletData {
  summary: {
    total_usd_value: number;
    chain_count: number;
    token_count: number;
    protocol_count: number;
  };
  tokens: Array<{
    symbol: string;
    name: string;
    chain: string;
    amount: number;
    price: number;
    value: number;
    logo: string;
    price_change_24h: number;
  }>;
  protocols: Array<{
    name: string;
    chain: string;
    logo: string;
    positions: Array<{
      name: string;
      net_value: number;
      asset_value?: number;
      debt_value?: number;
      tokens?: Array<{
        symbol: string;
        amount: number;
        value: number;
      }>;
    }>;
  }>;
  chains: Array<{
    name: string;
    usd_value: number;
    logo_url: string;
  }>;
  history: Array<{
    usd_value: number;
    timestamp: number;
  }>;
  address: string;
}

interface BybitData {
  summary: {
    total_usd_value: number;
    chain_count: number;
    token_count: number;
    protocol_count: number;
  };
  tokens: Array<{
    symbol: string;
    name: string;
    chain: string;
    amount: number;
    price: number;
    value: number;
    logo: string;
    price_change_24h: number;
  }>;
  protocols: Array<any>;
  chains: Array<{
    name: string;
    usd_value: number;
    logo_url: string;
  }>;
  history: Array<any>;
  address: string;
  accounts: {
    unified: {
      totalEquity: number;
      totalWalletBalance: number;
      totalAvailableBalance: number;
      accountType: string;
      coins: Array<any>;
    };
    funding: {
      totalEquity: number;
      totalWalletBalance: number;
      totalAvailableBalance: number;
      accountType: string;
      coins: Array<any>;
    };
  };
}

const WalletDashboard = () => {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [showAllChains, setShowAllChains] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallet?days=1');
      if (!response.ok) throw new Error('Failed to fetch wallet data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const calculate24hChange = () => {
    if (!data?.history || data.history.length < 2) return 0;
    const latest = data.history[data.history.length - 1].usd_value;
    const oldest = data.history[0].usd_value;

    return ((latest - oldest) / oldest * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-[300px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button onClick={fetchData} variant="outline" className="mt-4 w-full">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const { summary, tokens, protocols, chains, address } = data!;
  const change24h = calculate24hChange();

  // Calculate wallet balance per chain
  const walletBalanceByChain = tokens.reduce((acc, token) => {
    if (!acc[token.chain]) {
      acc[token.chain] = 0;
    }
    acc[token.chain] += token.value;

    return acc;
  }, {} as Record<string, number>);

  // Calculate protocol balance per chain
  const protocolBalanceByChain = protocols.reduce((acc, protocol) => {
    if (!acc[protocol.chain]) {
      acc[protocol.chain] = 0;
    }
    const totalValue = protocol.positions.reduce((sum: number, pos: any) => sum + pos.net_value, 0);
    acc[protocol.chain] += totalValue;

    return acc;
  }, {} as Record<string, number>);

  // Combine chain data with wallet and protocol balances
  const chainWithBalances = chains
    .filter(chain => chain.usd_value > 0)
    .sort((a, b) => b.usd_value - a.usd_value)
    .map(chain => ({
      ...chain,
      walletBalance: walletBalanceByChain[chain.name] || 0,
      protocolBalance: protocolBalanceByChain[chain.name] || 0,
      percentage: ((chain.usd_value / summary.total_usd_value) * 100).toFixed(1)
    }));

  // Get all tokens sorted by value
  const allTokensSorted = [...tokens]
    .sort((a, b) => b.value - a.value);

  // Get tokens to display (top 3 or all)
  const displayTokens = showAllTokens ? allTokensSorted : allTokensSorted.slice(0, 3);

  // Get all protocols by value
  const allProtocols = protocols
    .map(protocol => ({
      ...protocol,
      totalValue: protocol.positions.reduce((sum: number, pos: any) => sum + pos.net_value, 0)
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    change?: string; 
    subtitle?: string 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && parseFloat(change) !== 0 && (
          <div className={`flex items-center text-xs mt-2 ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(change) >= 0 ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {formatNumber(Math.abs(parseFloat(change)))}%
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Value" 
            value={`$${summary.total_usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            change={change24h.toString()}
          />
          <StatCard 
            title="Chains" 
            value={summary.chain_count}
            icon={Layers}
            subtitle={`${chainWithBalances.length} active`}
          />
          <StatCard 
            title="Tokens" 
            value={summary.token_count}
            icon={Wallet}
          />
          <StatCard 
            title="Protocols" 
            value={summary.protocol_count}
            icon={Activity}
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="protocols">Protocols</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="chains">Chains</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Chain Balances - Horizontal Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Balance per Chain</CardTitle>
                <CardDescription>Asset distribution across networks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  {chainWithBalances.slice(0, showAllChains ? chainWithBalances.length : 6).map((chain, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 min-w-fit px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chain.logo_url} alt={chain.name} />
                        <AvatarFallback>{chain.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium mb-0.5">{chain.name}</p>
                        <p className="text-base font-bold">${formatNumber(chain.usd_value)}</p>
                        <p className="text-xs text-muted-foreground">{chain.percentage}%</p>
                      </div>
                    </div>
                  ))}
                  {chainWithBalances.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllChains(!showAllChains)}
                      className="min-w-fit text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showAllChains ? 'Show less' : `Unfold ${chainWithBalances.length - 6} chains`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Token Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Token Balances</CardTitle>
                <CardDescription>
                  {showAllTokens ? `All ${allTokensSorted.length} tokens` : `Top 3 tokens`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayTokens.map((token, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={token.logo} alt={token.symbol} />
                        <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{token.symbol}</p>
                          <p className="text-sm font-semibold">${formatNumber(token.value)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{token.chain}</p>
                          <p className={`text-xs font-medium ${token.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {token.price_change_24h >= 0 ? '+' : ''}{formatNumber(token.price_change_24h * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {allTokensSorted.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => setShowAllTokens(!showAllTokens)}
                  >
                    {showAllTokens ? 'Show Less' : `Show All ${allTokensSorted.length} Tokens`}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* All Protocols */}
            <Card>
              <CardHeader>
                <CardTitle>Protocols</CardTitle>
                <CardDescription>All DeFi protocol positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {allProtocols.map((protocol, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={protocol.logo} alt={protocol.name} />
                        <AvatarFallback>{protocol.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{protocol.name}</p>
                            <p className="text-xs text-muted-foreground">{protocol.chain}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${formatNumber(protocol.totalValue)}</p>
                            <p className="text-xs text-muted-foreground">Total Value</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Positions</p>
                          {protocol.positions.map((position: any, pidx: number) => (
                            <div key={pidx} className="space-y-2 p-3 rounded-md bg-muted/50 border">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {position.name}
                                </Badge>
                                <div className="text-right">
                                  <span className="text-sm font-semibold">${formatNumber(position.net_value)}</span>
                                  {position.asset_value !== undefined && (
                                    <div className="text-xs text-muted-foreground">
                                      Assets: ${formatNumber(position.asset_value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {position.tokens && position.tokens.length > 0 && (
                                <div className="space-y-1 pt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Tokens</p>
                                  {position.tokens.map((token: any, tidx: number) => (
                                    <div key={tidx} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">{token.symbol}</span>
                                        <span className="text-muted-foreground">
                                          {formatNumber(token.amount, 4)}
                                        </span>
                                      </div>
                                      <span className="font-medium">${formatNumber(token.value)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allProtocols.map((protocol, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={protocol.logo} alt={protocol.name} />
                        <AvatarFallback>{protocol.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{protocol.name}</CardTitle>
                        <CardDescription>{protocol.chain}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-2xl font-bold">
                          ${formatNumber(protocol.totalValue)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Value Locked</p>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Positions</p>
                        {protocol.positions.map((position: any, pidx: number) => (
                          <div key={pidx} className="space-y-2 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors border">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs font-normal">
                                {position.name}
                              </Badge>
                              <div className="text-right">
                                <span className="text-sm font-semibold">${formatNumber(position.net_value)}</span>
                                {position.debt_value > 0 && (
                                  <div className="text-xs text-red-600">
                                    Debt: ${formatNumber(position.debt_value)}
                                  </div>
                                )}
                              </div>
                            </div>
                            {position.tokens && position.tokens.length > 0 && (
                              <div className="space-y-1 pt-2 border-t border-muted">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Tokens in Position</p>
                                {position.tokens.map((token: any, tidx: number) => (
                                  <div key={tidx} className="flex items-center justify-between text-xs bg-background/50 p-1.5 rounded">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{token.symbol}</span>
                                      <span className="text-muted-foreground">
                                        {formatNumber(token.amount, 4)}
                                      </span>
                                    </div>
                                    <span className="font-medium">${formatNumber(token.value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tokens</CardTitle>
                <CardDescription>Complete list of your token holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Chain</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">24h Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTokensSorted.map((token, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={token.logo} alt={token.symbol} />
                              <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-xs text-muted-foreground">{token.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{token.chain}</TableCell>
                        <TableCell className="text-right">{formatNumber(token.amount, 6)}</TableCell>
                        <TableCell className="text-right">${formatNumber(token.price)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${formatNumber(token.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={token.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatNumber(token.price_change_24h * 100)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chains Tab */}
          <TabsContent value="chains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chain Breakdown</CardTitle>
                <CardDescription>Assets across different blockchains</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chain</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chainWithBalances.map((chain, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={chain.logo_url} alt={chain.name} />
                              <AvatarFallback>{chain.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{chain.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${formatNumber(chain.usd_value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Progress value={parseFloat(chain.percentage) as any} className="w-24 h-2" />
                            <Badge variant="secondary">{chain.percentage}%</Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default WalletDashboard;
