
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building, User, Briefcase, Handshake, CheckCircle, AlertTriangle, Camera, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import AdminRevenueOverview from './AdminRevenueOverview';

const StatCard = ({ title, value, icon: Icon, isLoading }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                    <p className="text-3xl font-bold text-[#1A2238] admin-dashboard-heading-font">{value}</p>
                )}
            </div>
            <div className="p-3 bg-[#D4C6B8] rounded-full">
                <Icon className="w-6 h-6 text-[#1A2238]" />
            </div>
        </div>
    </div>
);

const AlertCard = ({ title, count, onClick, isLoading }) => (
     <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3"/>
                <div>
                    <p className="font-bold text-yellow-800">{title}</p>
                    {isLoading ? (
                        <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1" />
                    ) : (
                        <p className="text-sm text-yellow-700">{count} item(s) need attention</p>
                    )}
                </div>
            </div>
            <Button size="sm" variant="outline" onClick={onClick} className="text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                View
            </Button>
        </div>
    </div>
);


export default function AdminOverview({ setActiveTab }) {
    const { data: athletes, isLoading: athletesLoading } = useQuery({
        queryKey: ['admin-athletes-overview'],
        queryFn: () => base44.entities.User.filter({ account_type: 'athlete' })
    });
    const { data: companies, isLoading: companiesLoading } = useQuery({
        queryKey: ['admin-companies-overview'],
        queryFn: () => base44.entities.Company.list()
    });
    const { data: contentPartnerships, isLoading: cpLoading } = useQuery({
        queryKey: ['admin-cp-overview'],
        queryFn: () => base44.entities.ContentPartnership.list()
    });
    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['admin-jobs-overview'],
        queryFn: () => base44.entities.Job.list()
    });
     const { data: applications, isLoading: applicationsLoading } = useQuery({
        queryKey: ['admin-applications-overview'],
        queryFn: () => base44.entities.Application.list()
    });

    const stats = [
        { title: 'Total Athletes', value: athletes?.filter(a => a.verification_status === 'verified').length ?? 0, icon: User, isLoading: athletesLoading },
        { title: 'Total Companies', value: companies?.filter(c => c.status === 'active').length ?? 0, icon: Building, isLoading: companiesLoading },
        { title: 'Content Deals', value: contentPartnerships?.length ?? 0, icon: Camera, isLoading: cpLoading },
        { title: 'Active Internships', value: jobs?.filter(j => j.status === 'active').length ?? 0, icon: Briefcase, isLoading: jobsLoading },
        { title: 'Pending Applications', value: applications?.filter(a => a.status === 'applied').length ?? 0, icon: Handshake, isLoading: applicationsLoading },
    ];

    const pendingCompaniesCount = companies?.filter(c => c.status === 'pending_approval').length ?? 0;
    const pendingContentDealsCount = contentPartnerships?.filter(c => c.status === 'Pending Review').length ?? 0;
    const pendingVerificationsCount = athletes?.filter(a => a.verification_status === 'pending').length ?? 0;
    
    // Placeholder counts for other alerts
    const overdueDeliverablesCount = 0; // Replace with actual query
    const pendingPaymentsCount = 0; // Replace with actual query

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>
            
            <AdminRevenueOverview />
            
            <div className="mt-12">
                <h3 className="text-2xl mb-4 admin-dashboard-heading-font text-[#1A2238]">Alerts & Pending Actions</h3>
                <div className="space-y-4">
                    {pendingVerificationsCount > 0 && (
                        <AlertCard title="Pending Athlete Verifications" count={pendingVerificationsCount} onClick={() => setActiveTab('verification')} isLoading={athletesLoading} />
                    )}

                    {pendingCompaniesCount > 0 && (
                         <AlertCard title="Pending Company Approvals" count={pendingCompaniesCount} onClick={() => setActiveTab('companies')} isLoading={companiesLoading} />
                    )}

                    {pendingContentDealsCount > 0 && (
                         <AlertCard title="Pending Content Partnerships" count={pendingContentDealsCount} onClick={() => setActiveTab('content-partnerships')} isLoading={cpLoading} />
                    )}
                    
                    {(pendingCompaniesCount === 0 && pendingContentDealsCount === 0 && pendingVerificationsCount === 0) && (
                        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                            <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
                            <p className="text-lg text-gray-700">All clear!</p>
                            <p className="text-sm text-gray-500">No pending actions or alerts at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
