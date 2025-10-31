import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreVertical, Check, X, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generateUniqueSubCode } from '../athlete/AffiliateCodeGenerator';
import { sendBridgedEmail } from '@/components/emailUtils';
import { toast } from 'sonner';

const statusColors = {
    "Pending Approval": "bg-yellow-100 text-yellow-800",
    "Active": "bg-green-100 text-green-800",
    "Inactive": "bg-gray-100 text-gray-800",
};

const ActionsMenu = ({ campaign }) => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.AffiliateCampaign.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-affiliate-campaigns']);
            queryClient.invalidateQueries(['admin-affiliate-applications', campaign.id]);
        }
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <MoreVertical className="w-4 h-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {campaign.status !== 'Active' && (
                    <DropdownMenuItem onClick={() => mutation.mutate({ id: campaign.id, status: 'Active' })}>
                        <Check className="w-4 h-4 mr-2" /> Activate
                    </DropdownMenuItem>
                )}
                {campaign.status !== 'Inactive' && (
                    <DropdownMenuItem onClick={() => mutation.mutate({ id: campaign.id, status: 'Inactive' })} className="text-red-600">
                        <X className="w-4 h-4 mr-2" /> Deactivate
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ApplicationsTable = ({ campaign, onApprovePartnership }) => {
    const { data: applications, isLoading } = useQuery({
        queryKey: ['admin-affiliate-applications', campaign.id],
        queryFn: () => base44.entities.AffiliatePartnership.filter({ campaign_id: campaign.id })
    });
    const queryClient = useQueryClient();

    const rejectMutation = useMutation({
        mutationFn: ({ id, status }) => {
            return base44.entities.AffiliatePartnership.update(id, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-affiliate-applications', campaign.id]);
        }
    });

    if (isLoading) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-4"/>;
    if (!applications || applications.length === 0) return <p className="text-center text-sm text-gray-500 py-4">No applications yet.</p>;

    return (
        <div className="bg-gray-50 p-4 rounded-b-lg">
            <h4 className="font-semibold mb-2 px-2">Applications</h4>
            <Table size="sm">
                <TableHeader>
                    <TableRow>
                        <TableHead>Athlete</TableHead>
                        <TableHead>Preferred Code</TableHead>
                        <TableHead>Generated Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map(app => (
                        <TableRow key={app.id}>
                            <TableCell>{app.athlete_name}</TableCell>
                            <TableCell className="font-mono text-xs bg-gray-100">{app.athlete_preferred_alias}</TableCell>
                            <TableCell className="font-mono text-xs bg-blue-50">
                                {app.generated_sub_code || <span className="text-gray-400 italic">Pending...</span>}
                            </TableCell>
                            <TableCell>
                                <Badge className={
                                    app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }>
                                    {app.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {app.status === 'Pending' ? (
                                    <div className="space-x-2">
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            onClick={() => onApprovePartnership({
                                                partnershipId: app.id,
                                                campaignId: campaign.id,
                                                athleteAlias: app.athlete_preferred_alias,
                                                mainCode: campaign.main_affiliate_code,
                                                athleteId: app.athlete_id,
                                                athleteName: app.athlete_name,
                                                companyName: campaign.company_name
                                            })}
                                            disabled={rejectMutation.isPending}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="destructive"
                                            onClick={() => rejectMutation.mutate({ id: app.id, status: 'Rejected' })}
                                            disabled={rejectMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500">{app.status}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default function AdminAffiliatePrograms() {
    const queryClient = useQueryClient();
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['admin-affiliate-campaigns'],
        queryFn: () => base44.entities.AffiliateCampaign.list('-created_date')
    });

    const approvePartnershipMutation = useMutation({
        mutationFn: async ({ partnershipId, campaignId, athleteAlias, mainCode, athleteId, athleteName, companyName }) => {
            // Generate unique sub-code
            const subCode = await generateUniqueSubCode(mainCode, athleteAlias, campaignId);

            // Get athlete details for email
            const athlete = await base44.entities.User.filter({ id: athleteId }).then(res => res[0]);

            // Update partnership with generated code and status
            const updatedPartnership = await base44.entities.AffiliatePartnership.update(partnershipId, {
                status: 'Approved',
                generated_sub_code: subCode
            });

            // Send approval email to athlete
            if (athlete) {
                await sendBridgedEmail({
                    to: athlete.email,
                    subject: "🎉 Affiliate Partnership Approved!",
                    body: `
                        <p>Great news, ${athleteName}!</p>
                        <p>Your affiliate partnership with <strong>${companyName}</strong> has been approved!</p>
                        
                        <div style="background: #F8F5F2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #1C2E45; margin-bottom: 10px;">Your Unique Affiliate Code:</h3>
                            <p style="font-size: 32px; font-weight: bold; color: #946b56; font-family: monospace; letter-spacing: 2px;">${subCode}</p>
                        </div>
                        
                        <h3 style="color: #1C2E45;">How to Use Your Code:</h3>
                        <ol style="line-height: 1.8;">
                            <li>Share your unique code with your followers</li>
                            <li>Promote ${companyName} products on your social media</li>
                            <li>Earn commission on every sale made with your code</li>
                            <li>Track your performance in your dashboard</li>
                        </ol>
                        
                        <p style="margin-top: 20px;"><strong>Remember:</strong> You keep 80% of all commissions earned through your code. Bridged takes a 20% service fee.</p>
                        
                        <p>Start promoting and earning today!</p>
                    `,
                    buttonText: "View My Dashboard",
                    buttonUrl: "https://pro.base44.com/app/bridged/pages/AthleteDashboard",
                    eventType: 'affiliate_partnership_approved'
                });
            }

            return updatedPartnership;
        },
        onSuccess: async (updatedPartnership) => {
            queryClient.invalidateQueries(['admin-affiliate-applications', updatedPartnership.campaign_id]);
            queryClient.invalidateQueries(['affiliatePartnerships']);
            toast.success('Partnership approved! Athlete has been notified.');
        },
        onError: (error) => {
            toast.error(`Failed to approve: ${error.message}`);
        }
    });

    if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Manage Affiliate Programs</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Campaigns & Applications</CardTitle>
                    <CardDescription>Review and approve company-submitted affiliate campaigns and athlete applications. Unique codes are auto-generated upon approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Main Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {campaigns?.map(campaign => (
                               <React.Fragment key={campaign.id}>
                                   <TableRow>
                                       <TableCell className="font-bold">{campaign.company_name}</TableCell>
                                       <TableCell>{campaign.product_name}</TableCell>
                                       <TableCell>{campaign.commission_structure}</TableCell>
                                       <TableCell className="font-mono">{campaign.main_affiliate_code}</TableCell>
                                       <TableCell><Badge className={statusColors[campaign.status]}>{campaign.status}</Badge></TableCell>
                                       <TableCell className="text-right"><ActionsMenu campaign={campaign} /></TableCell>
                                   </TableRow>
                                   <TableRow>
                                       <TableCell colSpan={6} className="p-0">
                                            <ApplicationsTable
                                                campaign={campaign}
                                                onApprovePartnership={approvePartnershipMutation.mutate}
                                            />
                                       </TableCell>
                                   </TableRow>
                               </React.Fragment>
                           ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}