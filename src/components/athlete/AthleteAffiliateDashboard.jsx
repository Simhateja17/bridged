import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, BarChart, Users, Link as LinkIcon, Loader2, Copy, CheckCircle2, Target } from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
};

const StatCard = ({ title, value, icon: Icon, isCurrency = false, subtitle }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency && '$'}{value}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
    </Card>
);

export default function AthleteAffiliateDashboard({ user }) {
    const { data: partnerships, isLoading } = useQuery({
        queryKey: ['athleteAffiliatePartnerships', user.id],
        queryFn: () => base44.entities.AffiliatePartnership.filter({ athlete_id: user.id }),
        enabled: !!user,
    });

    const totalCommission = partnerships?.reduce((acc, p) => acc + (p.commission_earned || 0), 0) || 0;
    const totalSales = partnerships?.reduce((acc, p) => acc + (p.sales || 0), 0) || 0;
    const totalClicks = partnerships?.reduce((acc, p) => acc + (p.clicks || 0), 0) || 0;
    const activePartnerships = partnerships?.filter(p => p.status === 'Approved').length || 0;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard!');
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Earnings" 
                    value={totalCommission.toFixed(2)} 
                    icon={DollarSign} 
                    isCurrency 
                    subtitle="Your 80% share"
                />
                <StatCard 
                    title="Total Sales Generated" 
                    value={totalSales} 
                    icon={BarChart} 
                />
                <StatCard 
                    title="Total Clicks" 
                    value={totalClicks} 
                    icon={Target} 
                />
                <StatCard 
                    title="Active Partnerships" 
                    value={activePartnerships} 
                    icon={Users} 
                />
            </div>

            {/* Active Codes */}
            {partnerships?.filter(p => p.status === 'Approved').length > 0 && (
                <Card className="border-2 border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Your Active Affiliate Codes
                        </CardTitle>
                        <CardDescription>Share these codes with your followers to earn commission</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {partnerships?.filter(p => p.status === 'Approved').map(p => (
                                <div key={p.id} className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-lg p-6 text-white">
                                    <p className="text-sm opacity-80 mb-2">{p.company_name}</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-2xl font-bold tracking-wider">{p.generated_sub_code}</code>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-white hover:bg-white/10"
                                            onClick={() => copyToClipboard(p.generated_sub_code)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
                                        <div>
                                            <p className="text-xs opacity-70">Clicks</p>
                                            <p className="font-bold">{p.clicks || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs opacity-70">Sales</p>
                                            <p className="font-bold">{p.sales || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs opacity-70">Earned</p>
                                            <p className="font-bold">${(p.commission_earned || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All Partnerships Table */}
            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                <CardHeader>
                    <CardTitle>All Affiliate Partnerships</CardTitle>
                    <CardDescription>Track your applications and performance for each campaign. You earn 80% of all commissions generated.</CardDescription>
                </CardHeader>
                <CardContent>
                    {partnerships?.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">You haven't applied to any affiliate campaigns yet.</p>
                            <p className="text-sm text-gray-400">Visit the Affiliates page to browse available partnerships.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Your Code</TableHead>
                                        <TableHead>Clicks</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead>Commission Earned</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {partnerships?.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.company_name}</TableCell>
                                            <TableCell>
                                                {p.generated_sub_code ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                                            {p.generated_sub_code}
                                                        </code>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => copyToClipboard(p.generated_sub_code)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Pending approval...</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{p.clicks || 0}</TableCell>
                                            <TableCell>{p.sales || 0}</TableCell>
                                            <TableCell className="font-bold text-green-600">
                                                ${(p.commission_earned || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[p.status]}>{p.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {p.status === 'Approved' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(p.generated_sub_code)}
                                                    >
                                                        Copy Code
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                    <h3 className="font-bold text-[#1C2E45] mb-2">💡 How to Maximize Your Earnings</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Share your codes regularly on Instagram, TikTok, and other platforms</li>
                        <li>• Create authentic content showing how you use the products</li>
                        <li>• Engage with your followers and answer questions about the products</li>
                        <li>• Track which platforms drive the most sales and focus your efforts there</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}