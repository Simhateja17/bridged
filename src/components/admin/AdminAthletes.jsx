import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminAthletes() {
    const { data: athletes, isLoading } = useQuery({
        queryKey: ['admin-athletes'],
        queryFn: () => base44.entities.User.filter({ account_type: 'athlete' }, '-created_date')
    });
    
    if (isLoading) return <div>Loading athletes...</div>;

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Manage Athletes</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Sport</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead>Major</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {athletes?.map(athlete => (
                            <TableRow key={athlete.id}>
                                <TableCell className="font-bold text-gray-800">{athlete.full_name}</TableCell>
                                <TableCell>{athlete.sport}</TableCell>
                                <TableCell>{athlete.school}</TableCell>
                                <TableCell>{athlete.major}</TableCell>
                                <TableCell className="space-x-2">
                                    <Button variant="outline" size="sm" className="admin-button">View Profile</Button>
                                    <Button variant="destructive" size="sm" className="bg-[#CFC7BD] hover:bg-[#E7E0DA] text-black admin-button">Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}