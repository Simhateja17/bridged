import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function StripeCheckout() {
    const [searchParams] = useState(new URLSearchParams(window.location.search));
    const [error, setError] = useState(null);
    
    const type = searchParams.get('type');
    const partnershipId = searchParams.get('partnership_id');
    const companyId = searchParams.get('company_id');
    
    const { data: partnership } = useQuery({
        queryKey: ['partnershipCheckout', partnershipId],
        queryFn: () => base44.entities.ContentPartnership.get(partnershipId),
        enabled: !!partnershipId && type === 'content_partnership'
    });

    const { data: company } = useQuery({
        queryKey: ['companyCheckout', companyId],
        queryFn: () => base44.entities.Company.get(companyId),
        enabled: !!companyId && type === 'subscription'
    });

    useEffect(() => {
        const initiateCheckout = async () => {
            try {
                if (type === 'content_partnership' && partnership) {
                    const response = await base44.functions.invoke('createStripeCheckout', {
                        type: 'content_partnership',
                        partnership_id: partnership.id,
                        company_id: partnership.company_id,
                        amount: partnership.fee || 625
                    });

                    if (response.data.success && response.data.url) {
                        window.location.href = response.data.url;
                    } else {
                        setError(response.data.error || 'Failed to create checkout session');
                    }
                } else if (type === 'subscription' && company) {
                    const response = await base44.functions.invoke('createStripeCheckout', {
                        type: 'subscription',
                        company_id: company.id
                    });

                    if (response.data.success && response.data.url) {
                        window.location.href = response.data.url;
                    } else {
                        setError(response.data.error || 'Failed to create checkout session');
                    }
                }
            } catch (err) {
                console.error('Checkout error:', err);
                setError(err.message || 'An unexpected error occurred');
            }
        };

        if ((type === 'content_partnership' && partnership) || (type === 'subscription' && company)) {
            initiateCheckout();
        }
    }, [type, partnership, company]);

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8F5F2]">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-[#E7E0DA]">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold heading-font text-[#1C2E45] mb-2">Payment Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.history.back()} className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex items-center justify-center bg-[#F8F5F2]">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-[#E7E0DA]">
                <div className="mx-auto bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-[#1C2E45]" />
                </div>
                <h1 className="text-2xl font-bold heading-font text-[#1C2E45] mb-2">Redirecting to Secure Checkout</h1>
                <p className="text-gray-600 mb-6">Please wait while we redirect you to Stripe's secure payment page...</p>
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45] mx-auto" />
            </div>
        </div>
    );
}