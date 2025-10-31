import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const RevenueStat = ({ title, value, icon: Icon, isLoading, formatAsCurrency = false }) => (
    <div className="bg-[#F6F4F0] p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4C6B8]/50 rounded-full">
                <Icon className="w-5 h-5 text-[#1A2238]" />
            </div>
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                {isLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                    <p className="text-2xl font-bold text-[#1A2238] admin-dashboard-heading-font">
                        {formatAsCurrency ? `$${Number(value || 0).toLocaleString()}` : value}
                    </p>
                )}
            </div>
        </div>
    </div>
);

export default function AdminRevenueOverview() {
    const { data: partnerships, isLoading } = useQuery({
        queryKey: ['admin-revenue-overview'],
        queryFn: () => base44.entities.ContentPartnership.filter({ status: 'Paid' })
    });

    const totalRevenue = partnerships?.reduce((acc, p) => acc + (p.fee || 0), 0) || 0;
    const paidDeals = partnerships?.length || 0;
    
    // For pending, we need a separate query
    const { data: pendingPartnerships } = useQuery({
        queryKey: ['admin-pending-revenue'],
        queryFn: () => base44.entities.ContentPartnership.filter({ status: 'Payment Pending' })
    });
    const pendingDeals = pendingPartnerships?.length || 0;
    
    const avgRevenue = paidDeals > 0 ? totalRevenue / paidDeals : 0;

    const monthlyRevenue = partnerships?.reduce((acc, p) => {
        const month = format(new Date(p.created_date), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + p.fee;
        return acc;
    }, {});
    
    const chartData = monthlyRevenue ? Object.entries(monthlyRevenue).map(([name, revenue]) => ({ name, revenue })).reverse() : [];

    return (
        <div className="mt-8">
            <h3 className="text-2xl mb-4 admin-dashboard-heading-font text-[#1A2238]">Content Partnership Revenue</h3>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <RevenueStat title="Total Revenue" value={totalRevenue} icon={DollarSign} isLoading={isLoading} formatAsCurrency />
                    <RevenueStat title="Paid Deals" value={paidDeals} icon={CheckCircle} isLoading={isLoading} />
                    <RevenueStat title="Pending Deals" value={pendingDeals} icon={Clock} isLoading={isLoading} />
                    <RevenueStat title="Avg. Revenue / Deal" value={avgRevenue.toFixed(2)} icon={DollarSign} isLoading={isLoading} formatAsCurrency />
                </div>
                
                <h4 className="font-bold text-lg mb-2 text-[#1A2238]">Monthly Revenue</h4>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                            <Tooltip
                                cursor={{ fill: '#F6F4F0' }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0',
                                    fontFamily: "'Montserrat', sans-serif"
                                }}
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#1A2238" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}