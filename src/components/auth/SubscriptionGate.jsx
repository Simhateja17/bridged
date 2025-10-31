import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const Paywall = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] bg-[#F8F5F2] p-4">
        <div className="max-w-2xl mx-auto w-full">
            <Card className="bg-white border-[#E7E0DA] shadow-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-[#1C2E45]" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-[#1C2E45]">Unlock Your Full Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-gray-600 mb-6 text-medium">
                        Your company profile is active, but you need a subscription to access this feature. Subscribe now to post opportunities, browse athletes, and start connecting.
                    </p>
                    <Link to={createPageUrl('Pricing')}>
                        <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg py-6">
                            View Subscription Plans
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    </div>
);

export default function SubscriptionGate({ children }) {
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 5 * 60 * 1000,
    });

    const isCompany = user?.account_type === 'company';

    const { data: company, isLoading: companyLoading } = useQuery({
        queryKey: ['companyDataForGate', user?.email],
        queryFn: () => base44.entities.Company.filter({ contact_email: user.email }).then(res => res[0]),
        enabled: isCompany,
    });
    
    const { data: subscription, isLoading: subscriptionLoading } = useQuery({
        queryKey: ['companySubscription', company?.id],
        queryFn: () => base44.entities.CompanySubscription.filter({ company_id: company.id, status: 'active' }).then(res => res[0]),
        enabled: !!company,
    });

    const isLoading = userLoading || (isCompany && (companyLoading || subscriptionLoading));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-5rem)]">
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45]" />
            </div>
        );
    }
    
    if (isCompany && !subscription) {
        return <Paywall />;
    }

    // If not a company, or is a subscribed company, show the content.
    return <>{children}</>;
}