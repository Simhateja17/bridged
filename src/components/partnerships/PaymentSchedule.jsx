import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function PaymentSchedule({ partnership, userRole }) {
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments', partnership.id],
        queryFn: () => base44.entities.Payment.filter({ partnership_id: partnership.id }, 'scheduled_date'),
    });

    const updatePaymentStatus = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Payment.update(id, { 
            status, 
            paid_date: status === 'paid' ? new Date().toISOString() : null 
        }),
        onSuccess: () => {
            toast.success("Payment status updated!");
            queryClient.invalidateQueries({ queryKey: ['payments', partnership.id] });
        }
    });

    const paidPayments = payments?.filter(p => p.status === 'paid') || [];
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalStipend = partnership.total_stipend || 1500;
    const paymentProgress = totalStipend > 0 ? (totalPaid / totalStipend) * 100 : 0;
    
    const canManage = userRole === 'admin' || userRole === 'company';

    if (isLoading) return <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-[#1A2238]">
                    <span className="text-3xl font-bold">Payment Schedule</span>
                    <span className="text-lg font-semibold">
                        Total Paid: ${totalPaid.toFixed(2)} / ${totalStipend.toFixed(2)}
                    </span>
                </CardTitle>
                <Progress value={paymentProgress} className="w-full mt-4 h-3 bg-[#D4C6B8] [&>div]:bg-[#1A2238]" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid Date</TableHead>
                            {canManage && <TableHead className="text-right">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(payment.scheduled_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                <TableCell>{payment.paid_date ? format(new Date(payment.paid_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                {canManage && (
                                    <TableCell className="text-right">
                                        {payment.status !== 'paid' ? (
                                            <Button size="sm" onClick={() => updatePaymentStatus.mutate({id: payment.id, status: 'paid'})} className="bg-[#946B56] text-white">
                                                <DollarSign className="mr-2 h-4 w-4"/>Mark as Paid
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-end text-green-600 font-semibold">
                                               <CheckCircle2 className="mr-2 h-4 w-4"/> Paid
                                            </div>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {payments?.length === 0 && <p className="text-center text-gray-500 pt-8">No payment schedule has been created for this partnership yet.</p>}
            </CardContent>
        </Card>
    );
}