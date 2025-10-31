import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { sendBridgedEmail } from '@/components/emailUtils';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { Loader2 } from 'lucide-react';

const statusColors = {
    "Pending Review": "bg-yellow-100 text-yellow-800",
    "Meeting Scheduled": "bg-blue-100 text-blue-800",
    "Payment Pending": "bg-orange-100 text-orange-800",
    "Paid": "bg-green-100 text-green-800",
    "In Progress": "bg-purple-100 text-purple-800",
    "Completed": "bg-gray-100 text-gray-800",
};

export default function AdminContentPartnerships() {
    const queryClient = useQueryClient();
    const [selectedPartnership, setSelectedPartnership] = useState(null);

    const { data: partnerships, isLoading: partnershipsLoading } = useQuery({
        queryKey: ['admin-content-partnerships'],
        queryFn: () => base44.entities.ContentPartnership.list('-created_date')
    });

    const { data: models } = useQuery({
        queryKey: ['admin-model-list'],
        queryFn: () => base44.entities.ModelListEntry.filter({ status: 'Approved' }),
        initialData: []
    });

    const updatePartnershipMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.ContentPartnership.update(id, data),
        onSuccess: (updatedData, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-content-partnerships'] });
            toast.success(`Partnership status updated to ${variables.data.status}`);
            
            if (variables.data.status === 'Payment Pending') {
                const checkoutUrl = createPageUrl(`StripeCheckout?type=content_partnership&partnership_id=${updatedData.id}&company_id=${updatedData.company_id}`);
                sendBridgedEmail({
                    to: updatedData.email,
                    subject: 'Action Required: Payment for Your Bridged Content Partnership',
                    body: `<p>Hi ${updatedData.contact_name},</p><p>Following our meeting, the next step is to complete the payment of $${updatedData.fee} for your content partnership. Please use the link below to finalize the payment.</p>`,
                    buttonText: 'Complete Payment',
                    buttonUrl: `https://${window.location.host}${checkoutUrl}`,
                    eventType: 'content_partnership_payment_request'
                });
            }
        }
    });

    const handleScheduleMeeting = (partnership) => {
        const meetingDate = prompt("Enter meeting date and time (e.g., 2025-01-15 14:00):");
        if (meetingDate) {
            updatePartnershipMutation.mutate({
                id: partnership.id,
                data: { status: 'Meeting Scheduled', meeting_date: new Date(meetingDate).toISOString() }
            });
        }
    };
    
    const handleSendPaymentLink = (partnership) => {
        updatePartnershipMutation.mutate({
            id: partnership.id,
            data: { status: 'Payment Pending' }
        });
    };

    const handleAssignAthletes = (partnership, assigned_athlete_ids) => {
        updatePartnershipMutation.mutate({
            id: partnership.id,
            data: { assigned_athlete_ids }
        }, {
            onSuccess: () => setSelectedPartnership(null)
        });
    };

    if (partnershipsLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;

    const partnershipWithDetails = selectedPartnership ? partnerships.find(p => p.id === selectedPartnership.id) : null;

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Content Partnerships</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Shoot Month</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partnerships?.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-bold">{p.company_name}</TableCell>
                                <TableCell>{p.contact_name} <span className="text-gray-500">({p.email})</span></TableCell>
                                <TableCell><Badge className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                                <TableCell>{p.shoot_month && new Date(p.shoot_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Button variant="outline" size="sm" onClick={() => setSelectedPartnership(p)}>Details</Button>
                                    {p.status === 'Pending Review' && <Button size="sm" onClick={() => handleScheduleMeeting(p)} className="bg-[#946B56] admin-button">Schedule Meeting</Button>}
                                    {p.status === 'Meeting Scheduled' && <Button size="sm" onClick={() => handleSendPaymentLink(p)} className="bg-[#946B56] admin-button">Send Payment Link</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <Dialog open={!!selectedPartnership} onOpenChange={() => setSelectedPartnership(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Partnership Details: {partnershipWithDetails?.company_name}</DialogTitle>
                        <DialogDescription>Manage athletes and review details for this content partnership.</DialogDescription>
                    </DialogHeader>
                    {partnershipWithDetails && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
                           <p><strong>Status:</strong> <Badge className={statusColors[partnershipWithDetails.status]}>{partnershipWithDetails.status}</Badge></p>
                           <p><strong>Contact:</strong> {partnershipWithDetails.contact_name} - {partnershipWithDetails.email}</p>
                           <p><strong>Goals:</strong> {partnershipWithDetails.goals}</p>
                           <p><strong>Brand Description:</strong> {partnershipWithDetails.brand_description}</p>
                           <p><strong>Ideal Models:</strong> {partnershipWithDetails.ideal_models_description}</p>
                           <p><strong>Ideal Setting:</strong> {partnershipWithDetails.ideal_scenery_field}</p>
                           <p><strong>Content Expectations:</strong> {partnershipWithDetails.content_expectations}</p>
                           {partnershipWithDetails.assets_url && <a href={partnershipWithDetails.assets_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Brand Assets</a>}
                           <hr/>
                           
                           <AssignAthletesForm partnership={partnershipWithDetails} models={models} onAssign={handleAssignAthletes} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AssignAthletesForm({ partnership, models, onAssign }) {
    const [selected, setSelected] = useState(partnership.assigned_athlete_ids || []);

    const handleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    const assignedModels = partnership.assigned_athlete_ids?.map(id => models.find(m => m.id === id)).filter(Boolean) || [];

    return (
        <form onSubmit={(e) => { e.preventDefault(); onAssign(partnership, selected); }}>
             <h3 className="font-bold text-lg mt-4">Assign Athletes</h3>
             <div className="my-2 p-3 border rounded-lg bg-gray-50">
                 <h4 className="font-semibold">Currently Assigned:</h4>
                 {assignedModels.length > 0 ? (
                   <ul className="list-disc list-inside">{assignedModels.map(m => <li key={m.id}>{m.athlete_name}</li>)}</ul>
                 ) : <p className="text-sm text-gray-500">No athletes assigned yet.</p>}
             </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-md">
                {models.map(model => (
                    <div key={model.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
                        <Checkbox id={`model-${model.id}`} checked={selected.includes(model.id)} onCheckedChange={() => handleSelect(model.id)} />
                        <img src={model.photo_url} alt={model.athlete_name} className="w-8 h-8 rounded-full object-cover"/>
                        <label htmlFor={`model-${model.id}`} className="flex-grow">{model.athlete_name} ({model.sport_team})</label>
                    </div>
                ))}
            </div>
            <Button type="submit" className="mt-4 admin-button bg-[#1A2238]">Save Assignments</Button>
        </form>
    );
}