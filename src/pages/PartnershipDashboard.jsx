
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DeliverablesManager from '../components/partnerships/DeliverablesManager';
import PaymentSchedule from '../components/partnerships/PaymentSchedule';
import PaperworkHub from '../components/partnerships/PaperworkHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, DollarSign, Calendar, MessageCircle, Loader2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';
import { createNotification } from '../components/notificationUtils';
import { sendBridgedEmail } from '../utils';

const createPageUrl = (path) => {
    return `/${path}`;
};

export default function PartnershipDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const partnershipId = urlParams.get('id');
    const queryClient = useQueryClient();
    
    const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
    const [extensionMonths, setExtensionMonths] = useState(3);
    const [extensionReason, setExtensionReason] = useState('');

    const { data: currentUser, isLoading: currentUserLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: partnership, isLoading: partnershipLoading } = useQuery({
        queryKey: ['partnership', partnershipId],
        queryFn: () => base44.entities.Partnership.filter({ id: partnershipId }).then(res => res[0]),
        enabled: !!partnershipId
    });

    const openMessageMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser || !partnership) return;

            const otherUserId = currentUser.account_type === 'athlete'
                ? partnership.company_id
                : partnership.athlete_id;

            const existingConversations = await base44.entities.Conversation.filter({ partnership_id: partnershipId });

            if (existingConversations.length > 0) {
                window.location.href = createPageUrl(`Messages?conversation_id=${existingConversations[0].id}`);
                return;
            }

            const conversation = await base44.entities.Conversation.create({
                participant_ids: [currentUser.id, otherUserId],
                participant_details: [
                    {
                        user_id: currentUser.id,
                        user_name: currentUser.full_name,
                        user_photo_url: currentUser.photo_url
                    }
                ],
                partnership_id: partnershipId
            });

            window.location.href = createPageUrl(`Messages?conversation_id=${conversation.id}`);
        }
    });

    const initiatePaymentMutation = useMutation({
        mutationFn: async () => {
            window.location.href = createPageUrl(
                `StripeCheckout?type=internship_partnership&partnership_id=${partnership.id}&company_id=${partnership.company_id}&amount=${partnership.total_monthly_cost}`
            );
        }
    });

    const requestExtensionMutation = useMutation({
        mutationFn: async ({ months, reason }) => {
            return base44.entities.Partnership.update(partnershipId, {
                extension_requested: true,
                extension_months: months,
                extension_reason: reason,
                extension_status: 'pending',
                extension_requested_date: new Date().toISOString(),
                athlete_approved_extension: false
            });
        },
        onSuccess: async (updatedPartnership, variables) => {
            queryClient.invalidateQueries(['partnership', partnershipId]);
            setExtensionDialogOpen(false);
            setExtensionMonths(3);
            setExtensionReason('');
            
            const { months, reason } = variables;
            
            // Notify athlete
            const athlete = await base44.entities.User.get(partnership.athlete_id);
            await createNotification({
                userEmail: athlete.email,
                title: 'Partnership Extension Requested',
                message: `${partnership.company_name} has requested to extend your internship by ${months} months.`,
                type: 'partnership_created'
            });
            
            await sendBridgedEmail({
                to: athlete.email,
                subject: `Extension Request from ${partnership.company_name}`,
                body: `
                    <p>Hi ${athlete.full_name},</p>
                    <p>${partnership.company_name} would like to extend your internship partnership by <strong>${months} additional months</strong>.</p>
                    <p><strong>Their message:</strong></p>
                    <p style="background: #F8F5F2; padding: 15px; border-radius: 8px;">${reason}</p>
                    <p>Please review and respond in your partnership dashboard.</p>
                `,
                buttonText: "Review Extension Request",
                buttonUrl: `https://pro.base44.com/app/bridged/pages/PartnershipDashboard?id=${partnershipId}`,
                eventType: 'partnership_extension'
            });
            
            toast.success("Extension request sent to athlete!");
        },
        onError: (error) => toast.error(`Failed to request extension: ${error.message}`)
    });

    const approveExtensionMutation = useMutation({
        mutationFn: async () => {
            return base44.entities.Partnership.update(partnershipId, {
                athlete_approved_extension: true,
                extension_status: 'pending'
            });
        },
        onSuccess: async () => {
            queryClient.invalidateQueries(['partnership', partnershipId]);
            
            // Notify company and admin
            const company = await base44.entities.Company.get(partnership.company_id);
            await createNotification({
                userEmail: company.contact_email,
                title: 'Extension Approved by Athlete',
                message: `${partnership.athlete_name} has approved your extension request. Awaiting admin approval.`,
                type: 'partnership_created'
            });
            
            toast.success("Extension approved! Admin will finalize it.");
        }
    });

    const rejectExtensionMutation = useMutation({
        mutationFn: async () => {
            return base44.entities.Partnership.update(partnershipId, {
                extension_requested: false,
                extension_status: 'rejected',
                athlete_approved_extension: false
            });
        },
        onSuccess: async () => {
            queryClient.invalidateQueries(['partnership', partnershipId]);
            
            const company = await base44.entities.Company.get(partnership.company_id);
            await createNotification({
                userEmail: company.contact_email,
                title: 'Extension Request Declined',
                message: `${partnership.athlete_name} has declined the extension request.`,
                type: 'partnership_created'
            });
            
            toast.success("Extension request declined.");
        }
    });

    const isLoading = currentUserLoading || partnershipLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    if (!partnership) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-8">
                <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Partnership Not Found</h2>
                <p className="text-gray-600">We couldn't find the details for this partnership. Please check the ID and try again.</p>
            </div>
        );
    }

    const showPaymentPrompt = currentUser?.account_type === 'company' &&
                              partnership.status === 'pending' &&
                              !partnership.stripe_subscription_id;

    const daysUntilEnd = partnership.end_date ? differenceInDays(new Date(partnership.end_date), new Date()) : null;
    const showExtensionOption = currentUser?.account_type === 'company' && 
                                 partnership.status === 'active' && 
                                 daysUntilEnd !== null && 
                                 daysUntilEnd <= 30 &&
                                 !partnership.extension_requested;

    const showExtensionPending = partnership.extension_requested && partnership.extension_status === 'pending';

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold heading-font text-[#1C2E45]">
                            {currentUser?.account_type === 'athlete' ? partnership.company_name : partnership.athlete_name}
                        </h1>
                        <p className="text-lg text-gray-600 mt-2">
                            Partnership Dashboard • {partnership.plan_tier} Plan
                        </p>
                        {partnership.end_date && (
                            <p className="text-sm text-gray-500 mt-1">
                                Ends: {format(new Date(partnership.end_date), 'MMM dd, yyyy')} 
                                {daysUntilEnd !== null && daysUntilEnd > 0 && ` (${daysUntilEnd} days remaining)`}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={
                            partnership.status === 'active' ? 'default' :
                            partnership.status === 'pending' ? 'secondary' : 'outline'
                        }>
                            {partnership.status}
                        </Badge>
                        <Button onClick={() => openMessageMutation.mutate()} disabled={openMessageMutation.isPending}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {openMessageMutation.isPending ? "Opening..." : "Message"}
                        </Button>
                    </div>
                </div>
            </div>

            {showPaymentPrompt && (
                <Card className="mb-6 border-2 border-yellow-400 bg-yellow-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#1C2E45] mb-2">Payment Setup Required</h3>
                                <p className="text-gray-700 mb-4">
                                    Complete your payment setup to begin the internship partnership.
                                    You'll be charged <strong>${partnership.total_monthly_cost}/month</strong> starting today.
                                </p>
                                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                                    <p className="text-sm text-gray-600 mb-2"><strong>Plan Details:</strong></p>
                                    <ul className="text-sm space-y-1">
                                        <li>• {partnership.plan_tier} Plan: {partnership.internship_hours || 20} hours/month</li>
                                        <li>• Athlete Stipend: ${partnership.monthly_stipend}/month</li>
                                        <li>• Bridged Service Fee: ${partnership.monthly_service_fee}/month</li>
                                        <li>• <strong>Total: ${partnership.total_monthly_cost}/month</strong></li>
                                    </ul>
                                </div>
                                <Button
                                    onClick={() => initiatePaymentMutation.mutate()}
                                    disabled={initiatePaymentMutation.isPending}
                                    className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white"
                                    size="lg"
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    {initiatePaymentMutation.isPending ? 'Redirecting...' : 'Set Up Payment'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showExtensionOption && (
                <Card className="mb-6 border-2 border-blue-400 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#1C2E45] mb-2">Partnership Ending Soon</h3>
                                <p className="text-gray-700 mb-4">
                                    Your partnership with {partnership.athlete_name} ends in {daysUntilEnd} days. Would you like to extend it?
                                </p>
                                <Button onClick={() => setExtensionDialogOpen(true)} className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Request Extension
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showExtensionPending && currentUser?.account_type === 'company' && (
                <Card className="mb-6 border-2 border-yellow-400 bg-yellow-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <Clock className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#1C2E45] mb-2">Extension Request Pending</h3>
                                <p className="text-gray-700 mb-2">
                                    You requested to extend this partnership by <strong>{partnership.extension_months} months</strong>.
                                </p>
                                {partnership.athlete_approved_extension ? (
                                    <p className="text-green-600 font-medium flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        {partnership.athlete_name} has approved! Awaiting admin finalization.
                                    </p>
                                ) : (
                                    <p className="text-gray-600">Waiting for {partnership.athlete_name} to respond...</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showExtensionPending && currentUser?.account_type === 'athlete' && !partnership.athlete_approved_extension && (
                <Card className="mb-6 border-2 border-blue-400 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#1C2E45] mb-2">Extension Request</h3>
                                <p className="text-gray-700 mb-2">
                                    {partnership.company_name} would like to extend your partnership by <strong>{partnership.extension_months} months</strong>.
                                </p>
                                {partnership.extension_reason && (
                                    <div className="bg-white p-4 rounded-lg mb-4 border">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Their message:</p>
                                        <p className="text-gray-700">{partnership.extension_reason}</p>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => approveExtensionMutation.mutate()}
                                        disabled={approveExtensionMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve Extension
                                    </Button>
                                    <Button 
                                        onClick={() => rejectExtensionMutation.mutate()}
                                        disabled={rejectExtensionMutation.isPending}
                                        variant="destructive"
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showExtensionPending && currentUser?.account_type === 'athlete' && partnership.athlete_approved_extension && (
                <Card className="mb-6 border-2 border-green-400 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <h3 className="text-lg font-bold text-[#1C2E45]">Extension Approved</h3>
                                <p className="text-gray-700">You approved the {partnership.extension_months}-month extension. Waiting for admin to finalize.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="deliverables" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white p-2 h-auto rounded-xl shadow-sm border border-[#E7E0DA]">
                    <TabsTrigger value="deliverables" className="text-base py-3 data-[state=active]:bg-[#F6F4F0] data-[state=active]:text-[#1C2E45] data-[state=active]:shadow-sm flex items-center gap-2">
                        <FileText className="w-5 h-5 mr-2" />Deliverables
                    </TabsTrigger>
                    <TabsTrigger value="paperwork" className="text-base py-3 data-[state=active]:bg-[#F6F4F0] data-[state=active]:text-[#1C2E45] data-[state=active]:shadow-sm flex items-center gap-2">
                        <Users className="w-5 h-5 mr-2" />Paperwork
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="text-base py-3 data-[state=active]:bg-[#F6F4F0] data-[state=active]:text-[#1C2E45] data-[state=active]:shadow-sm flex items-center gap-2">
                        <DollarSign className="w-5 h-5 mr-2" />Payments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="deliverables" className="mt-6">
                    <DeliverablesManager partnership={partnership} userType={currentUser?.account_type} />
                </TabsContent>

                <TabsContent value="paperwork" className="mt-6">
                    <PaperworkHub partnership={partnership} currentUser={currentUser} />
                </TabsContent>

                <TabsContent value="payments" className="mt-6">
                    <PaymentSchedule partnership={partnership} />
                </TabsContent>
            </Tabs>

            {/* Extension Request Dialog */}
            <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Partnership Extension</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="extension_months">Extension Duration (months)</Label>
                            <Input
                                id="extension_months"
                                type="number"
                                min="1"
                                max="12"
                                value={extensionMonths}
                                onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="extension_reason">Message to Athlete</Label>
                            <Textarea
                                id="extension_reason"
                                placeholder="Explain why you'd like to extend the partnership..."
                                value={extensionReason}
                                onChange={(e) => setExtensionReason(e.target.value)}
                                rows={4}
                                className="mt-2"
                            />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-700">
                                <strong>Next Steps:</strong>
                            </p>
                            <ol className="text-sm text-gray-600 mt-2 space-y-1">
                                <li>1. {partnership.athlete_name} will review your request</li>
                                <li>2. If approved, admin will finalize the extension</li>
                                <li>3. Your billing will continue automatically</li>
                                <li>4. New end date will be {partnership.end_date && format(new Date(new Date(partnership.end_date).getTime() + (extensionMonths * 30 * 24 * 60 * 60 * 1000)), 'MMM dd, yyyy')}</li>
                            </ol>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setExtensionDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={() => requestExtensionMutation.mutate({ months: extensionMonths, reason: extensionReason })}
                            disabled={requestExtensionMutation.isPending || !extensionReason.trim()}
                        >
                            {requestExtensionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
