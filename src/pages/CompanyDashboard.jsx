
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Briefcase, Users, Target, Loader2, Camera, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl, sendBridgedEmail } from '@/utils';
import ContentPartnershipForm from '../components/company/ContentPartnershipForm';
import AffiliateCampaignForm from '../components/company/AffiliateCampaignForm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'; // Added table components

export default function CompanyDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: company, isLoading: companyLoading } = useQuery({
        queryKey: ['companyForUser', user?.email],
        queryFn: () => base44.entities.Company.filter({ contact_email: user.email }).then(res => res[0]),
        enabled: !!user && user.account_type === 'company'
    });

    const { data: partnerships, isLoading: partnershipsLoading } = useQuery({
        queryKey: ['companyPartnerships', company?.id],
        queryFn: () => base44.entities.Partnership.filter({ company_id: company.id }),
        enabled: !!company
    });

    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['companyJobs', company?.id],
        queryFn: () => base44.entities.Job.filter({ company_id: company.id }),
        enabled: !!company
    });

    // Original query for all applications (needed for job-specific counts)
    const { data: allApplications, isLoading: allApplicationsLoading } = useQuery({
        queryKey: ['companyAllApplications', company?.id], // Renamed key to differentiate
        queryFn: () => base44.entities.Application.filter({ company_id: company.id }),
        enabled: !!company
    });

    // New query for pending applications (as per outline)
    const { data: pendingApplications, isLoading: pendingApplicationsLoading } = useQuery({
        queryKey: ['companyApplications', company?.id], // Key as specified in outline
        queryFn: () => base44.entities.Application.filter({ company_id: company.id, status: 'applied' }),
        enabled: !!company
    });

    const { data: affiliateCampaigns } = useQuery({
        queryKey: ['companyAffiliateCampaigns', company?.id],
        queryFn: () => base44.entities.AffiliateCampaign.filter({ company_id: company.id }),
        enabled: !!company
    });

    const { data: affiliatePartnerships } = useQuery({
        queryKey: ['companyAffiliatePartnerships', company?.id],
        queryFn: async () => {
            // Get all campaigns for this company
            const campaigns = await base44.entities.AffiliateCampaign.filter({ company_id: company.id });
            const campaignIds = campaigns.map(c => c.id);
            
            // Fetch partnerships for all campaigns
            const allPartnerships = [];
            for (const campaignId of campaignIds) {
                const partnerships = await base44.entities.AffiliatePartnership.filter({ campaign_id: campaignId });
                allPartnerships.push(...partnerships);
            }
            return allPartnerships;
        },
        enabled: !!company
    });

    const { data: contentPartnerships } = useQuery({
        queryKey: ['companyContentPartnerships', company?.id],
        queryFn: () => base44.entities.ContentPartnership.filter({ company_id: company.id }),
        enabled: !!company
    });

    const acceptApplicationMutation = useMutation({
        mutationFn: async (applicationId) => {
            const application = await base44.entities.Application.filter({ id: applicationId }).then(res => res[0]);
            
            // Update application status
            await base44.entities.Application.update(applicationId, { status: 'accepted' });
            
            // Create partnership
            const partnership = await base44.entities.Partnership.create({
                athlete_id: application.athlete_id,
                company_id: company.id,
                athlete_name: application.athlete_name,
                company_name: company.company_name,
                partnership_type: 'internship',
                status: 'pending',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0], // 90 days from now
                plan_tier: company.internship_plan_name,
                monthly_stipend: company.internship_stipend,
                monthly_service_fee: company.internship_stipend * 0.17, // Assuming 17% service fee
                total_monthly_cost: company.internship_stipend * 1.17
            });

            // Send email to athlete
            const athlete = await base44.entities.User.filter({ id: application.athlete_id }).then(res => res[0]);
            if (athlete) {
                await sendBridgedEmail({
                    to: athlete.email,
                    subject: "Congratulations! Your Internship Application Was Accepted",
                    body: `
                        <p>Great news, ${athlete.full_name}!</p>
                        <p>${company.company_name} has accepted your application.</p>
                        <p>Your partnership is now being set up. You'll receive onboarding instructions shortly.</p>
                    `,
                    buttonText: "View Partnership",
                    buttonUrl: createPageUrl(`PartnershipDashboard/${partnership.id}`),
                    eventType: 'application_accepted'
                });
            }

            return partnership;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyApplications'] }); // Invalidates pending applications
            queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] }); // Invalidates all applications
            queryClient.invalidateQueries({ queryKey: ['companyPartnerships'] });
        }
    });

    const rejectApplicationMutation = useMutation({
        mutationFn: async (applicationId) => {
            const application = await base44.entities.Application.filter({ id: applicationId }).then(res => res[0]);
            await base44.entities.Application.update(applicationId, { status: 'rejected' });
            
            const athlete = await base44.entities.User.filter({ id: application.athlete_id }).then(res => res[0]);
            if (athlete) {
                await sendBridgedEmail({
                    to: athlete.email,
                    subject: "Update on Your Application",
                    body: `
                        <p>Hello ${athlete.full_name},</p>
                        <p>Thank you for your interest in ${company.company_name}. After careful consideration, we've decided to move forward with other candidates for this position.</p>
                        <p>We encourage you to keep exploring other opportunities on Bridged!</p>
                    `,
                    eventType: 'application_rejected'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyApplications'] }); // Invalidates pending applications
            queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] }); // Invalidates all applications
        }
    });

    if (userLoading || companyLoading || pendingApplicationsLoading || allApplicationsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">No Company Profile Found</h2>
                <p className="text-gray-600 mb-6">Please complete your company registration to access the dashboard.</p>
                <Link to={createPageUrl('CompanySignup')}>
                    <Button className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                        Complete Registration
                    </Button>
                </Link>
            </div>
        );
    }

    const activePartnerships = partnerships?.filter(p => p.status === 'active') || [];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold heading-font text-[#1C2E45]">{company.company_name}</h1>
                <p className="text-lg text-gray-600">Welcome to your company dashboard</p>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 bg-white p-2 h-auto rounded-xl shadow-sm border border-[#E7E0DA]">
                    <TabsTrigger value="overview" className="text-base py-3">
                        <Building2 className="w-5 h-5 mr-2" />Overview
                    </TabsTrigger>
                    <TabsTrigger value="jobs" className="text-base py-3">
                        <Briefcase className="w-5 h-5 mr-2" />Jobs
                    </TabsTrigger>
                    <TabsTrigger value="partnerships" className="text-base py-3">
                        <Users className="w-5 h-5 mr-2" />Partnerships
                    </TabsTrigger>
                    <TabsTrigger value="affiliate" className="text-base py-3">
                        <Target className="w-5 h-5 mr-2" />Affiliate
                    </TabsTrigger>
                    <TabsTrigger value="content" className="text-base py-3">
                        <Camera className="w-5 h-5 mr-2" />Content
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#1C2E45]">
                                    <Users className="w-5 h-5" />
                                    Active Partnerships
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-[#946b56]">{activePartnerships.length}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#1C2E45]">
                                    <Briefcase className="w-5 h-5" />
                                    Pending Applications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-[#946b56]">{pendingApplications?.length || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#1C2E45]">
                                    <Target className="w-5 h-5" />
                                    Active Jobs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-[#946b56]">{jobs?.filter(j => j.status === 'active').length || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#1C2E45]">Recent Applications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingApplications && pendingApplications.length === 0 ? (
                                    <p className="text-gray-500">No pending applications</p>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingApplications?.slice(0, 5).map(app => (
                                            <div key={app.id} className="flex justify-between items-center p-3 bg-[#F8F5F2] rounded-lg">
                                                <div>
                                                    <p className="font-medium">{app.athlete_name}</p>
                                                    <p className="text-sm text-gray-600">{app.created_date && new Date(app.created_date).toLocaleDateString()}</p>
                                                </div>
                                                <Badge>Pending</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#1C2E45]">Active Partnerships</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activePartnerships.length === 0 ? (
                                    <p className="text-gray-500">No active partnerships</p>
                                ) : (
                                    <div className="space-y-3">
                                        {activePartnerships.slice(0, 5).map(partnership => (
                                            <Link key={partnership.id} to={createPageUrl(`PartnershipDashboard/${partnership.id}`)}>
                                                <div className="flex justify-between items-center p-3 bg-[#F8F5F2] rounded-lg hover:bg-[#E7E0DA] transition-colors">
                                                    <div>
                                                        <p className="font-medium">{partnership.athlete_name}</p>
                                                        <p className="text-sm text-gray-600">{partnership.partnership_type}</p>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="jobs" className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[#1C2E45]">Job Postings & Applications</h2>
                        <Link to={createPageUrl('Opportunities')}>
                            <Button className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                <Plus className="w-5 h-5 mr-2" />
                                Post New Job
                            </Button>
                        </Link>
                    </div>

                    {/* Pending Applications */}
                    {pendingApplications && pendingApplications.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#1C2E45] mb-4">Pending Applications</h3>
                            <div className="grid gap-4">
                                {pendingApplications.map(app => (
                                    <Card key={app.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>{app.athlete_name}</CardTitle>
                                                    <p className="text-sm text-gray-600 mt-1">Applied: {new Date(app.created_date).toLocaleDateString()}</p>
                                                    {app.cover_note && <p className="text-sm text-gray-700 mt-2">{app.cover_note}</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => acceptApplicationMutation.mutate(app.id)}
                                                        disabled={acceptApplicationMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => rejectApplicationMutation.mutate(app.id)}
                                                        disabled={rejectApplicationMutation.isPending}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing Jobs */}
                    {jobsLoading ? (
                        <p>Loading jobs...</p>
                    ) : jobs && jobs.length > 0 ? (
                        <div>
                            <h3 className="text-xl font-bold text-[#1C2E45] mb-4">Your Job Postings</h3>
                            <div className="grid gap-4">
                                {jobs.map(job => (
                                    <Card key={job.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>{job.title}</CardTitle>
                                                    <p className="text-sm text-gray-600 mt-1">{job.description?.substring(0, 150)}...</p>
                                                </div>
                                                <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                                    {job.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600">
                                                Applications: {allApplications?.filter(a => a.job_id === job.id).length || 0}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">No job postings yet</p>
                                <Link to={createPageUrl('Opportunities')}>
                                    <Button className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                        Post Your First Job
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="partnerships" className="mt-8">
                    <h2 className="text-2xl font-bold text-[#1C2E45] mb-6">Internship Partnerships</h2>
                    {partnershipsLoading ? (
                        <p>Loading partnerships...</p>
                    ) : partnerships && partnerships.length > 0 ? (
                        <div className="grid gap-4">
                            {partnerships.map(partnership => (
                                <Link key={partnership.id} to={createPageUrl(`PartnershipDashboard/${partnership.id}`)}>
                                    <Card className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>{partnership.athlete_name}</CardTitle>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {new Date(partnership.start_date).toLocaleDateString()} - {new Date(partnership.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant={
                                                    partnership.status === 'active' ? 'default' :
                                                    partnership.status === 'pending' ? 'secondary' :
                                                    partnership.status === 'completed' ? 'outline' : 'destructive'
                                                }>
                                                    {partnership.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Plan:</p>
                                                    <p className="font-medium">{partnership.plan_tier}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Monthly Cost:</p>
                                                    <p className="font-medium">${partnership.total_monthly_cost}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No partnerships yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="affiliate" className="mt-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Affiliate Campaigns</h2>
                        <p className="text-gray-600">Create and manage affiliate marketing campaigns with athletes</p>
                    </div>
                    <AffiliateCampaignForm company={company} />
                    
                    {/* Active Partnerships Overview */}
                    {affiliatePartnerships && affiliatePartnerships.filter(p => p.status === 'Approved').length > 0 && (
                        <Card className="mt-8 border-2 border-green-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-600" />
                                    Active Athlete Affiliate Codes
                                </CardTitle>
                                <CardDescription>Track your athletes' performance and commission earned</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Athlete</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Clicks</TableHead>
                                                <TableHead>Sales</TableHead>
                                                <TableHead>Total Commission</TableHead>
                                                <TableHead>Company Pays (Bridged's 20%)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {affiliatePartnerships?.filter(p => p.status === 'Approved').map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{p.athlete_name}</TableCell>
                                                    <TableCell>
                                                        <code className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                                            {p.generated_sub_code}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>{p.clicks || 0}</TableCell>
                                                    <TableCell>{p.sales || 0}</TableCell>
                                                    <TableCell className="font-bold">
                                                        ${(p.commission_earned || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">
                                                        ${((p.commission_earned || 0) * 0.25).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        <strong>💡 Revenue Split:</strong> Athletes keep 80% of commission, Bridged takes 20% service fee.
                                        The commission structure you set determines the total amount paid out.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Campaign List */}
                    {affiliateCampaigns && affiliateCampaigns.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-[#1C2E45] mb-4">Your Campaigns</h3>
                            <div className="grid gap-4">
                                {affiliateCampaigns.map(campaign => {
                                    const campaignPartnerships = affiliatePartnerships?.filter(p => p.campaign_id === campaign.id) || [];
                                    const approvedCount = campaignPartnerships.filter(p => p.status === 'Approved').length;
                                    const totalClicks = campaignPartnerships.reduce((sum, p) => sum + (p.clicks || 0), 0);
                                    const totalSales = campaignPartnerships.reduce((sum, p) => sum + (p.sales || 0), 0);
                                    
                                    return (
                                        <Card key={campaign.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle>{campaign.product_name}</CardTitle>
                                                        <p className="text-sm text-gray-600 mt-1">{campaign.commission_structure}</p>
                                                    </div>
                                                    <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>
                                                        {campaign.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Main Code</p>
                                                        <p className="font-mono font-bold">{campaign.main_affiliate_code}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Active Athletes</p>
                                                        <p className="font-bold">{approvedCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Total Clicks</p>
                                                        <p className="font-bold">{totalClicks}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Total Sales</p>
                                                        <p className="font-bold">{totalSales}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="content" className="mt-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Content Partnerships</h2>
                        <p className="text-gray-600">Book professional content creation campaigns with our athlete models</p>
                    </div>
                    <ContentPartnershipForm company={company} />
                    
                    {contentPartnerships && contentPartnerships.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-[#1C2E45] mb-4">Your Content Projects</h3>
                            <div className="grid gap-4">
                                {contentPartnerships.map(cp => (
                                    <Card key={cp.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>Content Campaign</CardTitle>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Shoot: {new Date(cp.shoot_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <Badge variant={
                                                    cp.payment_status === 'Paid' ? 'default' : 'secondary'
                                                }>
                                                    {cp.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600">{cp.goals}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
