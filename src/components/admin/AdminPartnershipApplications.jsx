import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Calendar, ExternalLink } from 'lucide-react';
import { sendBridgedEmail } from '@/components/emailUtils';
import { format } from 'date-fns';

const statusColors = {
    "pending_review": "bg-yellow-100 text-yellow-800",
    "approved": "bg-green-100 text-green-800",
    "rejected": "bg-red-100 text-red-800",
    "payment_pending": "bg-blue-100 text-blue-800",
    "payment_complete": "bg-purple-100 text-purple-800",
};

export default function AdminPartnershipApplications() {
    const queryClient = useQueryClient();
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const { data: applications, isLoading } = useQuery({
        queryKey: ['admin-partnership-applications'],
        queryFn: () => base44.entities.PartnershipApplication.list('-created_date')
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, shipping_address }) => {
            return base44.entities.PartnershipApplication.update(id, {
                status: 'approved',
                approved_date: new Date().toISOString(),
                shipping_address: shipping_address
            });
        },
        onSuccess: async (updatedApp) => {
            queryClient.invalidateQueries({ queryKey: ['admin-partnership-applications'] });
            
            await sendBridgedEmail({
                to: updatedApp.contact_email,
                subject: '🎉 Your Partnership Application Has Been Approved!',
                body: `
                    <p>Hi ${updatedApp.contact_name},</p>
                    <p>Great news! Your partnership application for <strong>${updatedApp.product_name}</strong> has been approved!</p>
                    
                    <h3 style="color: #1C2E45; margin-top: 20px;">Next Steps:</h3>
                    <ol style="line-height: 1.8;">
                        <li><strong>Complete Payment:</strong> Click the button below to finalize payment</li>
                        <li><strong>Ship Your Product:</strong> Send your product to the address below</li>
                        <li><strong>Campaign Launch:</strong> We'll match you with athletes and begin!</li>
                    </ol>
                    
                    <div style="background: #F8F5F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #1C2E45; margin-bottom: 10px;">📦 Shipping Address:</h4>
                        <p style="font-size: 16px; line-height: 1.6; white-space: pre-line;">${updatedApp.shipping_address}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Please ship your product within 5 business days so we can begin the campaign promptly.</p>
                `,
                buttonText: "Complete Payment Now",
                buttonUrl: `https://pro.base44.com/app/bridged/pages/StripeCheckout?type=partnership_application&application_id=${updatedApp.id}`,
                eventType: 'partnership_approved'
            });
            
            toast.success("Application approved! Company has been notified.");
            setSelectedApplication(null);
            setShippingAddress('');
        },
        onError: (error) => toast.error(`Failed to approve: ${error.message}`)
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }) => {
            return base44.entities.PartnershipApplication.update(id, {
                status: 'rejected',
                rejection_reason: reason
            });
        },
        onSuccess: async (updatedApp) => {
            queryClient.invalidateQueries({ queryKey: ['admin-partnership-applications'] });
            
            await sendBridgedEmail({
                to: updatedApp.contact_email,
                subject: 'Update on Your Partnership Application',
                body: `
                    <p>Hi ${updatedApp.contact_name},</p>
                    <p>Thank you for your interest in partnering with Bridged. After careful review, we've decided not to move forward with your application at this time.</p>
                    
                    ${updatedApp.rejection_reason ? `
                        <div style="background: #F8F5F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Reason:</strong></p>
                            <p>${updatedApp.rejection_reason}</p>
                        </div>
                    ` : ''}
                    
                    <p>We appreciate you considering Bridged and wish you the best with your marketing efforts.</p>
                `,
                eventType: 'partnership_rejected'
            });
            
            toast.success("Application rejected. Company has been notified.");
            setShowRejectDialog(false);
            setSelectedApplication(null);
            setRejectionReason('');
        },
        onError: (error) => toast.error(`Failed to reject: ${error.message}`)
    });

    const handleApprove = (application) => {
        setSelectedApplication(application);
    };

    const handleReject = (application) => {
        setSelectedApplication(application);
        setShowRejectDialog(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Partnership Applications</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Athlete Pref.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications?.map(app => (
                            <TableRow key={app.id}>
                                <TableCell className="font-bold">{app.company_name}</TableCell>
                                <TableCell>{app.product_name}</TableCell>
                                <TableCell>
                                    {app.contact_name}
                                    <br />
                                    <span className="text-xs text-gray-500">{app.contact_email}</span>
                                </TableCell>
                                <TableCell>{app.athlete_preference}</TableCell>
                                <TableCell>
                                    <Badge className={statusColors[app.status]}>
                                        {app.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {app.created_date && format(new Date(app.created_date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedApplication(app)}
                                    >
                                        View Details
                                    </Button>
                                    {app.status === 'pending_review' && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(app)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(app)}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {applications?.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        No partnership applications yet.
                    </div>
                )}
            </div>

            {/* Application Details Dialog */}
            <Dialog open={!!selectedApplication && !showRejectDialog} onOpenChange={() => setSelectedApplication(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Application Details: {selectedApplication?.company_name}</DialogTitle>
                        <DialogDescription>
                            Review the full application and take action
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedApplication && (
                        <div className="space-y-6 py-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-bold text-gray-700">Company Name</Label>
                                    <p>{selectedApplication.company_name}</p>
                                </div>
                                <div>
                                    <Label className="font-bold text-gray-700">Product</Label>
                                    <p>{selectedApplication.product_name}</p>
                                </div>
                                <div>
                                    <Label className="font-bold text-gray-700">Contact Name</Label>
                                    <p>{selectedApplication.contact_name}</p>
                                </div>
                                <div>
                                    <Label className="font-bold text-gray-700">Contact Email</Label>
                                    <p>{selectedApplication.contact_email}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="font-bold text-gray-700">Company Headquarters</Label>
                                    <p>{selectedApplication.company_headquarters}</p>
                                </div>
                                {selectedApplication.website && (
                                    <div className="md:col-span-2">
                                        <Label className="font-bold text-gray-700">Website</Label>
                                        <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            {selectedApplication.website} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <Label className="font-bold text-gray-700">Athlete Preference</Label>
                                    <p>{selectedApplication.athlete_preference}</p>
                                </div>
                            </div>

                            <hr />

                            <div>
                                <Label className="font-bold text-gray-700">Campaign Goal</Label>
                                <p className="mt-1 text-gray-600">{selectedApplication.campaign_goal}</p>
                            </div>

                            <div>
                                <Label className="font-bold text-gray-700">Campaign Message / Why This Partnership</Label>
                                <p className="mt-1 text-gray-600">{selectedApplication.campaign_message}</p>
                            </div>

                            <div>
                                <Label className="font-bold text-gray-700">Campaign Vision & Execution</Label>
                                <p className="mt-1 text-gray-600">{selectedApplication.campaign_vision}</p>
                            </div>

                            {selectedApplication.brand_assets_url && (
                                <div>
                                    <Label className="font-bold text-gray-700">Brand Assets</Label>
                                    <a href={selectedApplication.brand_assets_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                        View Uploaded File <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}

                            <hr />

                            <div>
                                <Label className="font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Preferred Meeting Times
                                </Label>
                                <ul className="mt-2 space-y-1 text-gray-600">
                                    {selectedApplication.preferred_meeting_time_1 && (
                                        <li>1. {format(new Date(selectedApplication.preferred_meeting_time_1), 'PPpp')}</li>
                                    )}
                                    {selectedApplication.preferred_meeting_time_2 && (
                                        <li>2. {format(new Date(selectedApplication.preferred_meeting_time_2), 'PPpp')}</li>
                                    )}
                                    {selectedApplication.preferred_meeting_time_3 && (
                                        <li>3. {format(new Date(selectedApplication.preferred_meeting_time_3), 'PPpp')}</li>
                                    )}
                                </ul>
                            </div>

                            {selectedApplication.status === 'pending_review' && (
                                <>
                                    <hr />
                                    <div>
                                        <Label htmlFor="shipping_address" className="font-bold text-gray-700">
                                            Shipping Address (for product delivery) *
                                        </Label>
                                        <Textarea
                                            id="shipping_address"
                                            value={shippingAddress}
                                            onChange={(e) => setShippingAddress(e.target.value)}
                                            placeholder="Enter the Bridged address where the company should ship their product..."
                                            rows={4}
                                            className="mt-2"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            This address will be provided to the company after approval.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                            Close
                        </Button>
                        {selectedApplication?.status === 'pending_review' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setShowRejectDialog(true);
                                    }}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!shippingAddress.trim()) {
                                            toast.error('Please provide a shipping address');
                                            return;
                                        }
                                        approveMutation.mutate({
                                            id: selectedApplication.id,
                                            shipping_address: shippingAddress
                                        });
                                    }}
                                    disabled={approveMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {approveMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Approve & Send Payment Link
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this partnership application
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rejection_reason">Rejection Reason (Optional)</Label>
                        <Textarea
                            id="rejection_reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this application was rejected..."
                            rows={4}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowRejectDialog(false);
                            setRejectionReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                rejectMutation.mutate({
                                    id: selectedApplication.id,
                                    reason: rejectionReason
                                });
                            }}
                            disabled={rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}