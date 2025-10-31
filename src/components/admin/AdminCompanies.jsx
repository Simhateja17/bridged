import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendBridgedEmail } from '@/components/emailUtils';

const statusColors = {
    pending_approval: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
};

export default function AdminCompanies() {
    const queryClient = useQueryClient();
    const { data: companies, isLoading } = useQuery({
        queryKey: ['admin-companies'],
        queryFn: () => base44.entities.Company.list('-created_date')
    });

    const updateCompanyStatus = useMutation({
        mutationFn: ({ id, status, email, companyName, contactName }) => base44.entities.Company.update(id, { status }),
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
            
            if (variables.status === 'active') {
                const message = `Welcome to Bridged! Your company profile for ${variables.companyName} has been verified and is now active. You can now post opportunities and connect with athletes.`;
                base44.entities.Notification.create({
                    user_email: variables.email,
                    title: "Your Company Profile is Approved!",
                    message: message,
                    type: "company_approved"
                });
                
                await sendBridgedEmail({
                    to: variables.email,
                    subject: `Welcome to Bridged, ${variables.companyName}!`,
                    body: `<p>Hello ${variables.contactName},</p><p>Great news! Your company profile has been verified by our team. You can now log in to post internship opportunities and connect with talented student-athletes.</p>`,
                    buttonText: "Post an Opportunity",
                    buttonUrl: `https://pro.base44.com/app/bridged/pages/Opportunities`,
                    eventType: 'company_approved'
                });
            }
        },
    });

    const handleApprove = (company) => {
        updateCompanyStatus.mutate({ id: company.id, status: 'active', email: company.contact_email, companyName: company.company_name, contactName: company.contact_name });
    };

    const handleSuspend = (company) => {
        updateCompanyStatus.mutate({ id: company.id, status: 'suspended', email: company.contact_email, companyName: company.company_name });
    };
    
    if (isLoading) return <div>Loading companies...</div>;

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Manage Companies</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies?.map(company => (
                            <TableRow key={company.id}>
                                <TableCell className="font-bold text-gray-800">{company.company_name}</TableCell>
                                <TableCell>{company.contact_email}</TableCell>
                                <TableCell>
                                    <Badge className={`${statusColors[company.status]}`}>
                                        {company.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {company.status === 'pending_approval' && (
                                        <Button onClick={() => handleApprove(company)} size="sm" className="bg-[#946B56] hover:bg-[#a98471] text-white admin-button">Approve</Button>
                                    )}
                                    {company.status === 'active' && (
                                        <Button onClick={() => handleSuspend(company)} variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600 text-white admin-button">Suspend</Button>
                                    )}
                                    {company.status === 'suspended' && (
                                         <Button onClick={() => handleApprove(company)} size="sm" className="bg-[#946B56] hover:bg-[#a98471] text-white admin-button">Re-activate</Button>
                                    )}
                                    <Button variant="outline" size="sm" className="admin-button">View Profile</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}