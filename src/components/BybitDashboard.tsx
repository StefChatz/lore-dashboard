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
    position_count: number;
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
      positionValue?: number;
      size?: string;
      avgPrice?: string;
      markPrice?: string;
      liqPrice?: string;
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
    account_type?: string;
  }>;
  history: Array<any>;
  address: string;
  accounts: {
    unified: {
      totalEquity: number;
      totalWalletBalance: number;
      totalAvailableBalance: number;
      totalInitialMargin?: number;
      totalMaintenanceMargin?: number;
      accountIMRate?: string;
      accountMMRate?: string;
      accountType: string;
      coins: Array<any>;
    };
    funding: {
      totalValue: number;
      balances: Array<any>;
      accountType: string;
    };
  };
  positions?: {
    total: number;
    totalUnrealisedPnl: number;
    list: Array<any>;
  };
}

const BybitDashboard = () => {
  const [data, setData] = useState<BybitData | null>(null);
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
      const response = await fetch('/api/bybit');
      const result = await response.json();
      
      // Check if there's an error or message in the response
      if (result._error) {
        setError(result._error);
      } else if (result._message) {
        setError(result._message);
      }
      
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
    // Bybit doesn't have history data
    return '0.00';
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

  if (error && (!data || data.summary?.total_usd_value === 0)) {
    return (
      <div className="space-y-4">
        <Alert variant={error.includes('not configured') ? 'default' : 'destructive'}>
          <AlertTitle>
            {error.includes('not configured') ? 'Bybit Not Configured' : 'Error loading data'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            {error.includes('not configured') && (
              <div className="mt-4 text-sm">
                <p className="font-semibold mb-2">To configure Bybit integration:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Get API keys from <a href="https://www.bybit.com/app/user/api-management" target="_blank" rel="noopener noreferrer" className="underline">Bybit API Management</a></li>
                  <li>Add to Vercel environment variables:
                    <ul className="list-disc ml-4 mt-1">
                      <li><code className="bg-muted px-1">BYBIT_API_KEY</code></li>
                      <li><code className="bg-muted px-1">BYBIT_API_SECRET</code></li>
                    </ul>
                  </li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
            )}
            {!error.includes('not configured') && (
              <Button onClick={fetchData} variant="outline" className="mt-4 w-full">
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const { summary, tokens, protocols, chains, address, accounts, positions } = data!;
  const change24h = calculate24hChange();

  // Bybit-specific account data
  const accountBreakdown = chains.map(chain => ({
    ...chain,
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
            title="Total Equity" 
            value={`$${summary.total_usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            subtitle="Unified + Funding"
          />
          <StatCard 
            title="Unified Account" 
            value={`$${formatNumber(accounts.unified.totalEquity)}`}
            icon={Wallet}
            subtitle={`Available: $${formatNumber(accounts.unified.totalAvailableBalance)}`}
          />
          <StatCard 
            title="Funding Account" 
            value={`$${formatNumber(accounts.funding.totalValue)}`}
            icon={Layers}
            subtitle="Spot wallet"
          />
          <StatCard 
            title="Open Positions" 
            value={positions?.total || 0}
            icon={Activity}
            subtitle={positions?.totalUnrealisedPnl ? `PnL: $${formatNumber(positions.totalUnrealisedPnl)}` : 'No positions'}
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
            {/* Account Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Unified Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Unified Account</CardTitle>
                  <CardDescription>Trading account with margin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Equity</span>
                      <span className="text-lg font-bold">${formatNumber(accounts.unified.totalEquity)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Wallet Balance</span>
                      <span className="font-semibold">${formatNumber(accounts.unified.totalWalletBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Available Balance</span>
                      <span className="font-semibold text-green-600">${formatNumber(accounts.unified.totalAvailableBalance)}</span>
                    </div>
                  </div>
                  {accounts.unified.totalInitialMargin !== undefined && (
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Initial Margin</span>
                        <span>${formatNumber(accounts.unified.totalInitialMargin || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Maintenance Margin</span>
                        <span>${formatNumber(accounts.unified.totalMaintenanceMargin || 0)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funding Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Funding Account</CardTitle>
                  <CardDescription>Spot wallet for deposits/withdrawals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-lg font-bold">${formatNumber(accounts.funding.totalValue)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {accounts.funding.balances.length} coins with balance
                  </div>
                </CardContent>
              </Card>
            </div>

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

            {/* Perpetual Positions */}
            {allProtocols.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Perpetual Positions</CardTitle>
                  <CardDescription>Active trading positions ({positions?.total || 0} open)</CardDescription>
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
                            <p className={`text-lg font-bold ${protocol.totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {protocol.totalValue >= 0 ? '+' : ''}${formatNumber(Math.abs(protocol.totalValue))}
                            </p>
                            <p className="text-xs text-muted-foreground">Unrealized PnL</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Positions</p>
                          {protocol.positions.map((position: any, pidx: number) => (
                            <div key={pidx} className="space-y-1 p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {position.name}
                                </Badge>
                                <span className={`text-sm font-semibold ${position.net_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {position.net_value >= 0 ? '+' : ''}${formatNumber(Math.abs(position.net_value))}
                                </span>
                              </div>
                              {position.avgPrice && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
                                  <span>Entry: ${formatNumber(parseFloat(position.avgPrice))}</span>
                                  {position.markPrice && (
                                    <span>Mark: ${formatNumber(parseFloat(position.markPrice))}</span>
                                  )}
                                  {position.size && (
                                    <span>Size: {position.size}</span>
                                  )}
                                </div>
                              )}
                              {position.liqPrice && parseFloat(position.liqPrice) > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  Liq: ${formatNumber(parseFloat(position.liqPrice))}
                                </div>
                              )}
                              {position.tokens && position.tokens.length > 0 && (
                                <div className="space-y-1 pt-2 mt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Position Tokens</p>
                                  {position.tokens.map((token: any, tidx: number) => (
                                    <div key={tidx} className="flex items-center justify-between text-xs bg-background/30 p-1.5 rounded">
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
                    </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {allProtocols.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No open positions</p>
                </CardContent>
              </Card>
            )}
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
                              <span className={`text-sm font-semibold ${position.net_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {position.net_value >= 0 ? '+' : ''}${formatNumber(Math.abs(position.net_value))}
                              </span>
                            </div>
                            {(position.avgPrice || position.markPrice || position.size) && (
                              <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap pt-1 border-t border-muted">
                                {position.avgPrice && <span>Entry: ${formatNumber(parseFloat(position.avgPrice))}</span>}
                                {position.markPrice && <span>Mark: ${formatNumber(parseFloat(position.markPrice))}</span>}
                                {position.size && <span>Size: {position.size}</span>}
                              </div>
                            )}
                            {position.tokens && position.tokens.length > 0 && (
                              <div className="space-y-1 pt-2 border-t border-muted">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Position Tokens</p>
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
                    {accountBreakdown.map((chain: any, idx: number) => (
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

export default BybitDashboard;
