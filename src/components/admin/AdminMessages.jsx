import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Flag } from 'lucide-react';

export default function AdminMessages() {
    const { data: conversations, isLoading } = useQuery({
        queryKey: ['admin-conversations'],
        queryFn: () => base44.entities.Conversation.list('-last_message_timestamp')
    });
    
    if (isLoading) return <div>Loading conversations...</div>;

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Message Oversight</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Participants</TableHead>
                            <TableHead>Last Message</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {conversations?.map(convo => (
                            <TableRow key={convo.id}>
                                <TableCell className="font-bold text-gray-800">
                                    {convo.participant_details?.map(p => p.user_name).join(' & ')}
                                </TableCell>
                                <TableCell className="text-gray-600 truncate max-w-sm">{convo.last_message_content}</TableCell>
                                <TableCell>
                                    {convo.last_message_timestamp ? format(new Date(convo.last_message_timestamp), "PPp") : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" className="admin-button">View Chat</Button>
                                    <Button variant="ghost" size="sm" className="admin-button text-red-600 hover:bg-red-50 hover:text-red-700">
                                        <Flag className="w-4 h-4 mr-2"/>
                                        Flag
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}