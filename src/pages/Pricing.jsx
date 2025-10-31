import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PricingPage() {
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['internshipPlans'],
        queryFn: () => base44.entities.InternshipPlan.list('hours_per_month'),
    });

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    const { data: company, isLoading: companyLoading } = useQuery({
        queryKey: ['companyForPricing', user?.id],
        queryFn: () => base44.entities.Company.filter({ contact_email: user?.email }).then(res => res[0]),
        enabled: !!user && user.account_type === 'company'
    });

    const createCheckoutMutation = useMutation({
        mutationFn: async () => {
            if (!company || !company.id) {
                throw new Error("Company information is missing. Please complete your profile first.");
            }

            window.location.href = createPageUrl(`StripeCheckout?type=subscription&company_id=${company.id}`);
        },
        onError: (error) => {
            toast.error(`Failed to start checkout: ${error.message}`);
        }
    });

    const handleSubscribeClick = () => {
        if (userLoading || companyLoading) {
            return;
        }

        if (!user) {
            window.location.href = createPageUrl('CompanySignup');
        } else if (user.account_type === 'company' && company) {
            createCheckoutMutation.mutate();
        } else {
            window.location.href = createPageUrl('CompanySignup');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F5F2]">
            <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 heading-font">
                        Pricing & Plans
                    </h1>
                    <p className="text-xl text-[#DED4C4] max-w-2xl mx-auto text-medium">
                        Flexible plans designed to connect your company with top athlete talent.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <Card className="mb-12 border border-[#E7E0DA] shadow-lg bg-white overflow-hidden">
                    <div className="grid md:grid-cols-2 items-center">
                        <div className="p-8 md:p-12">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-3xl font-bold text-[#1C2E45] heading-font">Company Subscription</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <p className="text-4xl font-bold text-[#1C2E45] mb-4">
                                    $99<span className="text-lg font-medium text-gray-500">/month</span>
                                </p>
                                <p className="text-gray-600 text-medium mb-6">All the tools you need to build and manage successful athlete partnerships.</p>

                                <div className="space-y-6 text-[#333333] text-medium">
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-[#1C2E45]">Talent Discovery</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Search and filter verified athletes by skills, major, and availability.</span></li>
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Access detailed athlete profiles with bios, stats, and social links.</span></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-[#1C2E45]">Onboarding & Compliance</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Step-by-step onboarding for both company and athlete.</span></li>
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Digital agreements, paperwork uploads, and secure signature tracking.</span></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-[#1C2E45]">Project Management</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Assign weekly deliverables and track athlete submissions.</span></li>
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Built-in messaging to communicate directly with athletes.</span></li>
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>View performance metrics and milestones for each collaboration.</span></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-[#1C2E45]">Payment & Contract Management</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Automated payment scheduling and bi-weekly payouts to athletes.</span></li>
                                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#946b56] mt-0.5 flex-shrink-0" /><span>Securely store signed contracts and manage partnership renewals.</span></li>
                                        </ul>
                                    </div>
                                </div>

                            </CardContent>
                        </div>
                        <div className="bg-[#F6F4F0] p-8 h-full flex flex-col justify-center items-center border-l border-[#E7E0DA]">
                            <Button
                                size="lg"
                                className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg py-6 rounded-xl shadow-md"
                                disabled={userLoading || companyLoading || createCheckoutMutation.isPending}
                                onClick={handleSubscribeClick}
                            >
                                {createCheckoutMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : user && user.account_type === 'company' ? (
                                    <>Subscribe Now <ArrowRight className="w-5 h-5 ml-2" /></>
                                ) : (
                                    <>Get Started <ArrowRight className="w-5 h-5 ml-2" /></>
                                )}
                            </Button>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                {user?.account_type !== 'company' && "You'll be prompted to create a company profile first."}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="border border-[#E7E0DA] shadow-lg bg-white mt-20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-[#1C2E45] heading-font">Athlete Collaboration Plans</CardTitle>
                        <p className="text-[#333333] text-medium mt-2">
                            Choose a plan to hire one or more athletes for a 3-month internship.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {plansLoading ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-base text-[#1C2E45]">Plan</TableHead>
                                        <TableHead className="text-base text-[#1C2E45]">Hours / Month</TableHead>
                                        <TableHead className="text-base text-[#1C2E45]">Pay to Athlete ($14/hr)</TableHead>
                                        <TableHead className="text-base text-[#1C2E45]">Bridged Fee (17%)</TableHead>
                                        <TableHead className="text-base text-[#1C2E45] font-bold">Total Monthly Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array(3).fill(0).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !plans || plans.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-red-500">No plans found. Please contact support.</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-base text-[#1C2E45]">Plan</TableHead>
                                            <TableHead className="text-base text-[#1C2E45]">Hours / Month</TableHead>
                                            <TableHead className="text-base text-[#1C2E45]">Pay to Athlete ($14/hr)</TableHead>
                                            <TableHead className="text-base text-[#1C2E45]">Bridged Fee (17%)</TableHead>
                                            <TableHead className="text-base text-[#1C2E45] font-bold">Total Monthly Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map((plan) => (
                                            <TableRow key={plan.name}>
                                                <TableCell className="font-bold">{plan.name}</TableCell>
                                                <TableCell>{plan.hours_per_month} hrs</TableCell>
                                                <TableCell>${plan.pay_to_athlete.toFixed(2)}</TableCell>
                                                <TableCell>${plan.bridged_fee.toFixed(2)}</TableCell>
                                                <TableCell className="font-bold text-[#1C2E45]">${plan.total_monthly_cost.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-8 text-center">
                                    <Link to={createPageUrl('CompanySignup')}>
                                        <Button size="lg" className="bg-[#946b56] hover:bg-[#a98471] text-white text-lg px-8 py-6 rounded-xl">
                                            Get Started with Bridged <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </Link>
                                    <p className="text-sm text-gray-600 mt-4">
                                        3-month minimum commitment for all athlete collaborations.
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}