import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Check, X, ExternalLink } from 'lucide-react';

export default function AdminContentProposals() {
    const queryClient = useQueryClient();

    const { data: proposals, isLoading } = useQuery({
        queryKey: ['admin-content-proposals'],
        queryFn: () => base44.entities.ContentProposal.list('-created_date')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.ContentProposal.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-content-proposals'] });
            // TODO: In a real app, trigger an email notification on approval/rejection
        }
    });
    
    const handleStatusUpdate = (id, status) => {
        updateStatusMutation.mutate({ id, status });
    };

    if (isLoading) return <div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Manage Content Proposals</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contributor</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposals?.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="font-bold">{p.full_name}</div>
                                    <div className="text-sm text-gray-500">{p.email}</div>
                                </TableCell>
                                <TableCell className="font-medium max-w-xs truncate">{p.title}</TableCell>
                                <TableCell className="capitalize">{p.content_type?.replace(/_/g, ' ')}</TableCell>
                                <TableCell>{format(new Date(p.created_date), "MMM d, yyyy")}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusBadge(p.status)}>{p.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {(p.content_url || p.content_file_url) && (
                                            <Button asChild variant="outline" size="sm">
                                                <a href={p.content_url || p.content_file_url} target="_blank" rel="noopener noreferrer">
                                                    View Content <ExternalLink className="w-4 h-4 ml-2" />
                                                </a>
                                            </Button>
                                        )}
                                        {p.status === 'pending' && (
                                            <>
                                                <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleStatusUpdate(p.id, 'approved')}>
                                                    <Check className="w-5 h-5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleStatusUpdate(p.id, 'rejected')}>
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}