import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function JobsList() {
    const { data: jobs, isLoading } = useQuery({
        queryKey: ['admin-jobs'],
        queryFn: () => base44.entities.Job.list('-created_date')
    });
    
    if (isLoading) return <div>Loading jobs...</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {jobs?.map(job => (
                    <TableRow key={job.id}>
                        <TableCell className="font-bold">{job.title}</TableCell>
                        <TableCell>{job.company_name}</TableCell>
                        <TableCell><Badge>{job.status}</Badge></TableCell>
                        <TableCell><Button variant="outline" size="sm" className="admin-button">View</Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ApplicationsList() {
    const { data: applications, isLoading } = useQuery({
        queryKey: ['admin-applications'],
        queryFn: () => base44.entities.Application.list('-created_date')
    });
    
    if (isLoading) return <div>Loading applications...</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications?.map(app => (
                    <TableRow key={app.id}>
                        <TableCell className="font-bold">{app.athlete_name}</TableCell>
                        <TableCell>{app.job_id}</TableCell>
                        <TableCell><Badge>{app.status}</Badge></TableCell>
                        <TableCell><Button variant="outline" size="sm" className="admin-button">View</Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function AdminJobs() {
    const [activeTab, setActiveTab] = useState('jobs');

    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Jobs & Applications</h2>
            
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-4 py-2 text-lg ${activeTab === 'jobs' ? 'border-b-2 border-[#946B56] text-[#946B56]' : 'text-gray-500'}`}
                >
                    Jobs
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 text-lg ${activeTab === 'applications' ? 'border-b-2 border-[#946B56] text-[#946B56]' : 'text-gray-500'}`}
                >
                    Applications
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                {activeTab === 'jobs' ? <JobsList /> : <ApplicationsList />}
            </div>
        </div>
    );
}