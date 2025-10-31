
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const getPaperworkStatus = (p, isMinor) => {
    const isBridgedDone = p.bridged_agreement_signed_by_athlete && p.bridged_agreement_signed_by_company;
    const isInternshipDone = p.internship_agreement_signed_by_athlete && p.internship_agreement_signed_by_company;
    const isParentalDone = isMinor ? (p.parental_consent_signed_by_athlete && p.parental_consent_signed_by_parent) : true;

    if (isBridgedDone && isInternshipDone && isParentalDone) {
        return { text: "Complete", Icon: CheckCircle2, color: "text-green-600" };
    }
    return { text: "Pending", Icon: AlertCircle, color: "text-yellow-600" };
};


export default function AdminPartnerships() {
    const queryClient = useQueryClient();
    
    const { data: partnerships, isLoading: partnershipsLoading } = useQuery({
        queryKey: ['admin-partnerships'],
        queryFn: () => base44.entities.Partnership.list('-created_date')
    });
    
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['all-users-for-partnerships'],
        queryFn: () => base44.entities.User.list(),
    });
    
    const updateStatusMutation = useMutation({
        mutationFn: ({id, status}) => base44.entities.Partnership.update(id, {status}),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-partnerships']);
            toast.success("Partnership status updated!");
        }
    });

    const handleFinalize = async (partnership) => {
        const athlete = users?.find(u => u.id === partnership.athlete_id);
        const isMinor = athlete ? calculateAge(athlete.date_of_birth) < 18 : false;

        const paperwork = getPaperworkStatus(partnership, isMinor);
        if (paperwork.text !== 'Complete') {
            toast.error("Cannot finalize. All required agreements must be signed.", {
                description: "This includes the Bridged Agreement, Internship Agreement, and Parental Consent if applicable."
            });
            return;
        }

        // Check if company has paid
        if (!partnership.stripe_subscription_id) {
            toast.error("Payment not set up", {
                description: "The company needs to complete payment setup before activation."
            });
            return;
        }

        if(confirm("This will activate the partnership and schedule payments. Are you sure?")) {
            // Here you would also trigger payment schedule creation. For now, just activate.
            updateStatusMutation.mutate({id: partnership.id, status: 'active'});
        }
    };


    if (partnershipsLoading || usersLoading) return <div>Loading partnerships...</div>;
    
    const usersById = users?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {});

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Internship Monitoring</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Athlete</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paperwork</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partnerships?.map(p => {
                            const athlete = usersById?.[p.athlete_id];
                            const isMinor = athlete ? calculateAge(athlete.date_of_birth) < 18 : false;
                            const paperwork = getPaperworkStatus(p, isMinor);
                            const paymentStatus = p.stripe_subscription_id ? 'Set Up' : 'Pending';
                            
                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="font-bold">{p.company_name}</TableCell>
                                    <TableCell>{p.athlete_name}</TableCell>
                                    <TableCell><Badge>{p.status}</Badge></TableCell>
                                    <TableCell>
                                        <span className={`flex items-center gap-2 font-medium ${paperwork.color}`}>
                                            <paperwork.Icon className="w-4 h-4" /> {paperwork.text}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={paymentStatus === 'Set Up' ? 'default' : 'secondary'}>
                                            {paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Link to={createPageUrl(`PartnershipDashboard?id=${p.id}`)}>
                                            <Button className="admin-button bg-[#1A2238] text-white hover:bg-black" size="sm">Manage</Button>
                                        </Link>
                                        {p.status !== 'active' && (
                                            <Button 
                                                onClick={() => handleFinalize(p)}
                                                disabled={updateStatusMutation.isPending}
                                                size="sm"
                                                variant="outline"
                                                className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                                            >
                                                Finalize & Activate
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {partnerships?.length === 0 && <div className="text-center p-8 text-gray-500">No active partnerships found.</div>}
            </div>
        </div>
    );
}
