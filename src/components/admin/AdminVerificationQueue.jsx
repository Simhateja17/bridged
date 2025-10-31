
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Eye, ShieldQuestion, ShieldCheck, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { sendBridgedEmail } from '../emailUtils'; // Updated import path
import { createNotification } from '../notificationUtils'; // New import
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ConfidenceBadge = ({ score }) => {
    let colorClass, icon;
    if (score >= 90) {
        colorClass = "bg-green-100 text-green-800 border-green-200";
        icon = <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />;
    } else if (score >= 70) {
        colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
        icon = <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />;
    } else {
        colorClass = "bg-red-100 text-red-800 border-red-200";
        icon = <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />;
    }

    return (
        <Badge className={colorClass} variant="outline">
            {icon}
            {score}%
        </Badge>
    );
};

const StatusBadge = ({ status }) => {
    const statusConfig = {
        auto_approved: { text: "Auto-Approved", className: "bg-green-100 text-green-800" },
        manual_review: { text: "Manual Review", className: "bg-blue-100 text-blue-800" },
        hold: { text: "On Hold", className: "bg-yellow-100 text-yellow-800" },
        pending: { text: "Pending AI", className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.text}</Badge>;
};

export default function AdminVerificationQueue() {
    const queryClient = useQueryClient();

    const { data: pendingAthletes, isLoading } = useQuery({
        queryKey: ['admin-pending-athletes'],
        queryFn: () => base44.entities.User.filter({ account_type: 'athlete', verification_status: 'pending' }, '-created_date')
    });

    // Replaced original verificationMutation with separate approve and reject mutations
    const approveMutation = useMutation({
        mutationFn: (athleteId) => base44.entities.User.update(athleteId, { verification_status: 'verified', ai_status: 'auto_approved' }),
        onSuccess: async (updatedAthlete) => {
            queryClient.invalidateQueries({ queryKey: ['admin-pending-athletes'] }); // Use existing query key
            queryClient.invalidateQueries({ queryKey: ['admin-athletes-overview'] });
            
            // Send approval email
            await sendBridgedEmail({
                to: updatedAthlete.email,
                subject: "Your Bridged Profile is Approved!",
                body: `<p>Great news, ${updatedAthlete.full_name}! Your athlete profile has been verified and is now live on the Bridged platform. You can now apply for opportunities and connect with companies.</p>`,
                buttonText: "View Your Profile",
                buttonUrl: `https://pro.base44.com/app/bridged/pages/AthleteProfile?id=${updatedAthlete.id}`,
                eventType: 'athlete_verification_approved'
            });
            
            // Create notification
            await createNotification({
                userEmail: updatedAthlete.email,
                title: 'Profile Verified!',
                message: 'Your athlete profile has been verified. You can now apply for opportunities.',
                type: 'company_approved' // Assuming 'company_approved' is a placeholder for 'profile_verified' or similar
            });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ athleteId, notes }) => base44.entities.User.update(athleteId, { 
            verification_status: 'rejected', 
            ai_status: 'hold',
            admin_notes: notes 
        }),
        onSuccess: async (updatedAthlete) => {
            queryClient.invalidateQueries({ queryKey: ['admin-pending-athletes'] }); // Use existing query key
            queryClient.invalidateQueries({ queryKey: ['admin-athletes-overview'] });

            // Send rejection email
            await sendBridgedEmail({
                to: updatedAthlete.email,
                subject: "Bridged Profile Update",
                body: `<p>Thank you for your interest in Bridged. After reviewing your profile, we're unable to verify your account at this time. ${updatedAthlete.admin_notes ? updatedAthlete.admin_notes : 'Please ensure all information is accurate and try again.'}</p>`, // Added fallback for admin_notes
                buttonText: "Update Profile", // Added missing buttonText
                buttonUrl: `https://pro.base44.com/app/bridged/pages/AthleteSignup`, // Added missing buttonUrl, assuming the athlete needs to re-submit via signup flow
                eventType: 'athlete_verification_rejected'
            });
        }
    });

    const handleApprove = (id) => {
        approveMutation.mutate(id);
    };

    const handleReject = (id) => {
        const reason = prompt("Please provide a reason for rejection (this will be sent to the athlete):");
        if (reason) {
            rejectMutation.mutate({ athleteId: id, notes: reason });
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    if (!pendingAthletes || pendingAthletes.length === 0) {
        return (
            <div className="text-center py-20">
                <Check className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">All Clear!</h3>
                <p className="mt-1 text-sm text-gray-500">There are no pending athlete verifications.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl admin-dashboard-heading-font text-[#1A2238]">Athlete Verification Queue</h2>
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Sparkles className="w-5 h-5 text-[#946B56]" />
                        <span>AI-Assisted Screening Active</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Athlete Name</TableHead>
                                <TableHead>School</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>AI Confidence</TableHead>
                                <TableHead>AI Status</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingAthletes.map(athlete => (
                                <TableRow key={athlete.id} className={athlete.ai_status === 'hold' ? 'bg-yellow-50' : ''}>
                                    <TableCell className="font-bold">{athlete.full_name}</TableCell>
                                    <TableCell>{athlete.school}</TableCell>
                                    <TableCell>{format(new Date(athlete.created_date), 'PP')}</TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <ConfidenceBadge score={athlete.ai_confidence_score} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>AI-simulated confidence in profile authenticity.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={athlete.ai_status} />
                                    </TableCell>
                                    <TableCell>
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                                    <a href={athlete.school_id_photo_url} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>View Submitted ID</p></TooltipContent>
                                         </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleApprove(athlete.id)} 
                                            disabled={approveMutation.isPending && approveMutation.variables === athlete.id} // Updated disabled state
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Approve
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            onClick={() => handleReject(athlete.id)} 
                                            disabled={rejectMutation.isPending && rejectMutation.variables?.athleteId === athlete.id} // Updated disabled state
                                        >
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}
