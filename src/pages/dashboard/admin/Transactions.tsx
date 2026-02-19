import { useState, useEffect } from 'react';
import { supabase } from '@/packages/supabase/supabase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/packages/shadcn/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/packages/shadcn/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/shadcn/ui/select';
import { Badge } from '@/packages/shadcn/ui/badge';
import { Button } from '@/packages/shadcn/ui/button';
import { Input } from '@/packages/shadcn/ui/input';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface StripePayment {
    id: string;
    user_id: string;
    stripe_session_id: string;
    product_id: string;
    amount: number;
    currency: string;
    coins: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_method?: string;
    created_at: string;
    completed_at?: string;
    user?: {
        name: string;
        email: string;
    };
    product?: {
        name: string;
        description?: string;
    };
}

interface CoinTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'purchase' | 'spend' | 'refund' | 'bonus';
    description: string;
    reference_id?: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
}

interface PremiumSubscription {
    id: string;
    user_id: string;
    premium_plan_id: string;
    stripe_subscription_id: string;
    status: 'active' | 'canceled' | 'past_due' | 'expired';
    current_period_start: string;
    current_period_end: string;
    created_at: string;
    canceled_at?: string;
    user?: {
        name: string;
        email: string;
    };
    premium_plan?: {
        name: string;
        price: number;
        billing_period: string;
    };
}

export default function AdminTransactions() {
    const [activeTab, setActiveTab] = useState<'stripe' | 'coins' | 'subscriptions'>('stripe');
    const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
    const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
    const [premiumSubscriptions, setPremiumSubscriptions] = useState<PremiumSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTransactions();
    }, [activeTab]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            if (activeTab === 'stripe') {
                await fetchStripePayments();
            } else if (activeTab === 'coins') {
                await fetchCoinTransactions();
            } else {
                await fetchPremiumSubscriptions();
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStripePayments = async () => {
        const { data, error } = await supabase
            .from('stripe_payments')
            .select(
                `
        id,
        user_id,
        stripe_session_id,
        product_id,
        amount,
        currency,
        coins,
        status,
        payment_method,
        created_at,
        completed_at,
        users (name, email),
        stripe_products (name, description)
      `
            )
            .order('created_at', { ascending: false });

        if (error) throw error;
        setStripePayments(
            data?.map((payment: any) => ({
                ...payment,
                user: payment.users,
                product: payment.stripe_products,
            })) || []
        );
    };

    const fetchCoinTransactions = async () => {
        const { data, error } = await supabase
            .from('coin_transactions')
            .select(
                `
        id,
        user_id,
        amount,
        type,
        description,
        reference_id,
        created_at,
        users (name, email)
      `
            )
            .order('created_at', { ascending: false });

        if (error) throw error;
        setCoinTransactions(
            data?.map((transaction: any) => ({
                ...transaction,
                user: transaction.users,
            })) || []
        );
    };

    const fetchPremiumSubscriptions = async () => {
        const { data, error } = await supabase
            .from('user_premium_subscriptions')
            .select(
                `
        id,
        user_id,
        premium_plan_id,
        stripe_subscription_id,
        status,
        current_period_start,
        current_period_end,
        created_at,
        canceled_at,
        users (name, email),
        premium_plans (name, price, billing_period)
      `
            )
            .order('created_at', { ascending: false });

        if (error) throw error;
        setPremiumSubscriptions(
            data?.map((subscription: any) => ({
                ...subscription,
                user: subscription.users,
                premium_plan: subscription.premium_plans,
            })) || []
        );
    };

    const getFilteredStripePayments = () => {
        return stripePayments.filter((payment) => {
            const matchesSearch =
                payment.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.stripe_session_id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    };

    const getFilteredCoinTransactions = () => {
        return coinTransactions.filter((transaction) => {
            const matchesSearch =
                transaction.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transaction.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transaction.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = filterStatus === 'all' || transaction.type === filterStatus;
            return matchesSearch && matchesType;
        });
    };

    const getFilteredPremiumSubscriptions = () => {
        return premiumSubscriptions.filter((subscription) => {
            const matchesSearch =
                subscription.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subscription.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'refunded':
            case 'canceled':
            case 'past_due':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'purchase':
                return 'bg-blue-100 text-blue-800';
            case 'spend':
                return 'bg-purple-100 text-purple-800';
            case 'refund':
                return 'bg-orange-100 text-orange-800';
            case 'bonus':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const exportToCSV = (data: any[], filename: string) => {
        const csv = [
            Object.keys(data[0] || {}).join(','),
            ...data.map((row) =>
                Object.values(row)
                    .map((val) => (typeof val === 'string' ? `"${val}"` : val))
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const renderStripePaymentsTable = () => {
        const filtered = getFilteredStripePayments();
        const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
            <>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Coins</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                    <div>
                                        <p className="font-semibold">{payment.user?.name}</p>
                                        <p className="text-sm text-gray-500">{payment.user?.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{payment.product?.name}</TableCell>
                                <TableCell className="font-semibold">
                                    ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-blue-100 text-blue-800">{payment.coins} coins</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusBadgeColor(payment.status)}>
                                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {new Date(payment.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {paginatedData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No transactions found</div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={page === i + 1 ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const renderCoinTransactionsTable = () => {
        const filtered = getFilteredCoinTransactions();
        const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
            <>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell className="font-medium">
                                    <div>
                                        <p className="font-semibold">{transaction.user?.name}</p>
                                        <p className="text-sm text-gray-500">{transaction.user?.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getTypeColor(transaction.type)}>
                                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold">
                                    {transaction.type === 'spend' || transaction.type === 'refund' ? '-' : '+'}
                                    {transaction.amount} coins
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {new Date(transaction.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {paginatedData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No transactions found</div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={page === i + 1 ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const renderPremiumSubscriptionsTable = () => {
        const filtered = getFilteredPremiumSubscriptions();
        const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
            <>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Started</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((subscription) => (
                            <TableRow key={subscription.id}>
                                <TableCell className="font-medium">
                                    <div>
                                        <p className="font-semibold">{subscription.user?.name}</p>
                                        <p className="text-sm text-gray-500">{subscription.user?.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{subscription.premium_plan?.name}</TableCell>
                                <TableCell className="font-semibold">
                                    ${subscription.premium_plan?.price ? (subscription.premium_plan.price / 100).toFixed(2) : '0.00'}{' '}
                                    <span className="text-xs text-gray-500">
                                        / {subscription.premium_plan?.billing_period || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusBadgeColor(subscription.status)}>
                                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
                                    {new Date(subscription.current_period_end).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {new Date(subscription.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {paginatedData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No subscriptions found</div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={page === i + 1 ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Transactions</h1>
                <p className="text-gray-600 mt-2">Manage and view all payments and transactions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => {
                        setActiveTab('stripe');
                        setPage(1);
                        setFilterStatus('all');
                    }}
                    className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'stripe'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Stripe Payments
                </button>
                <button
                    onClick={() => {
                        setActiveTab('coins');
                        setPage(1);
                        setFilterStatus('all');
                    }}
                    className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'coins'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Coin Transactions
                </button>
                <button
                    onClick={() => {
                        setActiveTab('subscriptions');
                        setPage(1);
                        setFilterStatus('all');
                    }}
                    className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'subscriptions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Premium Subscriptions
                </button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by user name, email, or transaction ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={(value) => {
                            setFilterStatus(value);
                            setPage(1);
                        }}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {activeTab === 'stripe' && (
                                    <>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="refunded">Refunded</SelectItem>
                                    </>
                                )}
                                {activeTab === 'coins' && (
                                    <>
                                        <SelectItem value="purchase">Purchase</SelectItem>
                                        <SelectItem value="spend">Spend</SelectItem>
                                        <SelectItem value="refund">Refund</SelectItem>
                                        <SelectItem value="bonus">Bonus</SelectItem>
                                    </>
                                )}
                                {activeTab === 'subscriptions' && (
                                    <>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="canceled">Canceled</SelectItem>
                                        <SelectItem value="past_due">Past Due</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (activeTab === 'stripe') {
                                    exportToCSV(getFilteredStripePayments(), 'stripe-payments');
                                } else if (activeTab === 'coins') {
                                    exportToCSV(getFilteredCoinTransactions(), 'coin-transactions');
                                } else {
                                    exportToCSV(getFilteredPremiumSubscriptions(), 'premium-subscriptions');
                                }
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeTab === 'stripe' && 'Stripe Payments'}
                        {activeTab === 'coins' && 'Coin Transactions'}
                        {activeTab === 'subscriptions' && 'Premium Subscriptions'}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === 'stripe' && `Total: ${stripePayments.length} transactions`}
                        {activeTab === 'coins' && `Total: ${coinTransactions.length} transactions`}
                        {activeTab === 'subscriptions' && `Total: ${premiumSubscriptions.length} subscriptions`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : activeTab === 'stripe' ? (
                        renderStripePaymentsTable()
                    ) : activeTab === 'coins' ? (
                        renderCoinTransactionsTable()
                    ) : (
                        renderPremiumSubscriptionsTable()
                    )}
                </CardContent>
            </Card>
        </div>
    );
}