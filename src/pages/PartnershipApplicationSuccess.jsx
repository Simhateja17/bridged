import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Package, Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PartnershipApplicationSuccess() {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        // Track successful payment
        if (sessionId) {
            console.log('Payment session:', sessionId);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
            <Card className="max-w-3xl w-full">
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        
                        <h1 className="text-4xl font-bold text-[#1C2E45] mb-4 heading-font">
                            Payment Successful! 🎉
                        </h1>
                        
                        <p className="text-xl text-gray-600 mb-8">
                            Your partnership campaign is now officially underway!
                        </p>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-[#1C2E45] mb-4">What Happens Next?</h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C2E45]">1. Ship Your Product</h3>
                                    <p className="text-gray-700">
                                        Check your email for the shipping address. Please send your product within 5 business days.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C2E45]">2. Athlete Matching</h3>
                                    <p className="text-gray-700">
                                        Our team will carefully select the perfect athletes that align with your brand and campaign goals.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Rocket className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C2E45]">3. Campaign Launch</h3>
                                    <p className="text-gray-700">
                                        Content creation begins! You'll receive updates as your athletes create authentic, engaging content for your brand.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8F5F2] rounded-lg p-6 mb-8">
                        <p className="text-sm text-gray-700 mb-2">
                            <strong>📧 Check Your Email:</strong> We've sent you a confirmation with the shipping address and next steps.
                        </p>
                        <p className="text-sm text-gray-700">
                            <strong>⏱️ Timeline:</strong> Most campaigns launch within 2-3 weeks of product receipt.
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            Questions? Contact us at <a href="mailto:nbowles@bridged.agency" className="text-[#1C2E45] font-medium hover:underline">nbowles@bridged.agency</a>
                        </p>
                        
                        <Link to={createPageUrl("Home")}>
                            <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                Return to Homepage
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}