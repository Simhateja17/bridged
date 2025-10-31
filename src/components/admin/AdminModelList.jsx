import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, ExternalLink, User } from 'lucide-react';
import { sendBridgedEmail } from '@/components/emailUtils';
import { createNotification } from '../notificationUtils';

const statusColors = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
};

export default function AdminModelList() {
    const queryClient = useQueryClient();
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: modelEntries, isLoading } = useQuery({
        queryKey: ['admin-model-entries'],
        queryFn: () => base44.entities.ModelListEntry.list('-created_date')
    });

    const approveMutation = useMutation({
        mutationFn: async (id) => {
            return base44.entities.ModelListEntry.update(id, {
                status: 'Approved'
            });
        },
        onSuccess: async (updatedEntry) => {
            queryClient.invalidateQueries({ queryKey: ['admin-model-entries'] });
            
            // Send approval email
            await sendBridgedEmail({
                to: updatedEntry.email,
                subject: '🎉 You\'re Approved for the Bridged Model List!',
                body: `
                    <p>Hi ${updatedEntry.athlete_name},</p>
                    <p>Congratulations! You've been approved for the Bridged Model List!</p>
                    
                    <h3 style="color: #1C2E45;">What This Means:</h3>
                    <ul style="line-height: 1.8;">
                        <li>✅ You're now eligible for modeling campaigns and brand photoshoots</li>
                        <li>✅ Brands can specifically request you for content creation</li>
                        <li>✅ You'll be notified when new opportunities arise</li>
                    </ul>
                    
                    <p>Keep your profile updated and be ready for exciting partnerships!</p>
                `,
                buttonText: "View Dashboard",
                buttonUrl: "https://pro.base44.com/app/bridged/pages/AthleteDashboard",
                eventType: 'model_list_approved'
            });

            // Create notification
            await createNotification({
                userEmail: updatedEntry.email,
                title: 'Model List Application Approved! 🎉',
                message: 'You\'re now on the Bridged Model List and eligible for brand campaigns.',
                type: 'partnership_created'
            });
            
            toast.success(`${updatedEntry.athlete_name} approved!`);
            setSelectedEntry(null);
        },
        onError: (error) => toast.error(`Failed to approve: ${error.message}`)
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }) => {
            return base44.entities.ModelListEntry.update(id, {
                status: 'Rejected'
            });
        },
        onSuccess: async (updatedEntry, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-model-entries'] });
            
            // Send rejection email
            await sendBridgedEmail({
                to: updatedEntry.email,
                subject: 'Update on Your Model List Application',
                body: `
                    <p>Hi ${updatedEntry.athlete_name},</p>
                    <p>Thank you for your interest in joining the Bridged Model List. After reviewing your application, we've decided not to move forward at this time.</p>
                    
                    ${variables.reason ? `
                        <div style="background: #F8F5F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Feedback:</strong></p>
                            <p>${variables.reason}</p>
                        </div>
                    ` : ''}
                    
                    <p>You're welcome to reapply in the future as your profile and experience grow.</p>
                `,
                eventType: 'model_list_rejected'
            });

            // Create notification
            await createNotification({
                userEmail: updatedEntry.email,
                title: 'Model List Application Update',
                message: 'Your model list application was not approved at this time.',
                type: 'partnership_created'
            });
            
            toast.success('Application rejected and athlete notified.');
            setShowRejectDialog(false);
            setSelectedEntry(null);
            setRejectionReason('');
        },
        onError: (error) => toast.error(`Failed to reject: ${error.message}`)
    });

    const handleApprove = (entry) => {
        if (window.confirm(`Approve ${entry.athlete_name} for the model list?`)) {
            approveMutation.mutate(entry.id);
        }
    };

    const handleReject = (entry) => {
        setSelectedEntry(entry);
        setShowRejectDialog(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    const pendingEntries = modelEntries?.filter(e => e.status === 'Pending') || [];
    const approvedEntries = modelEntries?.filter(e => e.status === 'Approved') || [];
    const rejectedEntries = modelEntries?.filter(e => e.status === 'Rejected') || [];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl admin-dashboard-heading-font text-[#1A2238]">Model List Applications</h2>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span>{pendingEntries.length} Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span>{approvedEntries.length} Approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span>{rejectedEntries.length} Rejected</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Athlete</TableHead>
                            <TableHead>Sport/Team</TableHead>
                            <TableHead>Instagram</TableHead>
                            <TableHead>Portfolio</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {modelEntries?.map(entry => (
                            <TableRow key={entry.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {entry.photo_url ? (
                                            <img src={entry.photo_url} alt={entry.athlete_name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold">{entry.athlete_name}</p>
                                            <p className="text-xs text-gray-500">{entry.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{entry.sport_team}</TableCell>
                                <TableCell>
                                    {entry.instagram ? (
                                        <a href={entry.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Not provided</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {entry.portfolio_link ? (
                                        <a href={entry.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-sm">None</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusColors[entry.status]}>
                                        {entry.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {entry.created_date && new Date(entry.created_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedEntry(entry)}
                                    >
                                        View Details
                                    </Button>
                                    {entry.status === 'Pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(entry)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                disabled={approveMutation.isPending}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(entry)}
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

                {modelEntries?.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        No model list applications yet.
                    </div>
                )}
            </div>

            {/* Entry Details Dialog */}
            <Dialog open={!!selectedEntry && !showRejectDialog} onOpenChange={() => setSelectedEntry(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Application Details: {selectedEntry?.athlete_name}</DialogTitle>
                        <DialogDescription>
                            Review the athlete's model list application
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedEntry && (
                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-4">
                                {selectedEntry.photo_url ? (
                                    <img src={selectedEntry.photo_url} alt={selectedEntry.athlete_name} className="w-24 h-24 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <User className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-[#1C2E45]">{selectedEntry.athlete_name}</h3>
                                    <p className="text-gray-600">{selectedEntry.sport_team}</p>
                                    <p className="text-sm text-gray-500">{selectedEntry.email}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-bold text-gray-700">Instagram</Label>
                                    {selectedEntry.instagram ? (
                                        <a href={selectedEntry.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            {selectedEntry.instagram} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <p className="text-gray-500">Not provided</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="font-bold text-gray-700">Portfolio</Label>
                                    {selectedEntry.portfolio_link ? (
                                        <a href={selectedEntry.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            View Portfolio <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <p className="text-gray-500">None</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="font-bold text-gray-700">Availability</Label>
                                <p className="mt-1 text-gray-600">{selectedEntry.availability?.join(', ') || 'Not specified'}</p>
                            </div>

                            <div>
                                <Label className="font-bold text-gray-700">Experience Notes</Label>
                                <p className="mt-1 text-gray-600">{selectedEntry.experience_notes || 'None provided'}</p>
                            </div>

                            <div>
                                <Label className="font-bold text-gray-700">Status</Label>
                                <Badge className={statusColors[selectedEntry.status]}>
                                    {selectedEntry.status}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                            Close
                        </Button>
                        {selectedEntry?.status === 'Pending' && (
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
                                        approveMutation.mutate(selectedEntry.id);
                                    }}
                                    disabled={approveMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {approveMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Approve for Model List
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
                            Provide optional feedback for the athlete
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rejection_reason">Feedback (Optional)</Label>
                        <Textarea
                            id="rejection_reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., We're looking for athletes with more followers or professional photography experience..."
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
                                    id: selectedEntry.id,
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