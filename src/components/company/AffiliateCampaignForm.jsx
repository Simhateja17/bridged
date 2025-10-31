import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2 } from 'lucide-react';

const statusColors = {
    "Pending Approval": "bg-yellow-100 text-yellow-800",
    "Active": "bg-green-100 text-green-800",
    "Inactive": "bg-gray-100 text-gray-800",
};

export default function AffiliateCampaignForm({ company, existingCampaigns, isLoading }) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        commission_structure: '',
        terms: '',
        main_affiliate_code: ''
    });
    const queryClient = useQueryClient();

    const createCampaignMutation = useMutation({
        mutationFn: (data) => base44.entities.AffiliateCampaign.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['companyAffiliateCampaigns', company.id]);
            setShowForm(false);
            setFormData({ product_name: '', commission_structure: '', terms: '', main_affiliate_code: '' });
            alert('Campaign submitted for approval!');
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createCampaignMutation.mutate({
            ...formData,
            company_id: company.id,
            company_name: company.company_name,
        });
    };

    return (
        <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold text-[#1C2E45]">Your Affiliate Campaigns</CardTitle>
                    <CardDescription>Create and manage your affiliate marketing campaigns.</CardDescription>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {showForm ? 'Cancel' : 'New Campaign'}
                </Button>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg border mb-8">
                        <h3 className="text-lg font-semibold text-[#1C2E45]">Create New Campaign</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="product_name">Product/Service Name</Label>
                                <Input id="product_name" value={formData.product_name} onChange={(e) => handleInputChange('product_name', e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="commission_structure">Commission Structure</Label>
                                <Input id="commission_structure" value={formData.commission_structure} onChange={(e) => handleInputChange('commission_structure', e.target.value)} placeholder="e.g., 10% per sale" required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="main_affiliate_code">Main Affiliate Code</Label>
                            <Input id="main_affiliate_code" value={formData.main_affiliate_code} onChange={(e) => handleInputChange('main_affiliate_code', e.target.value)} placeholder="e.g., YOURBRAND20" required />
                        </div>
                        <div>
                            <Label htmlFor="terms">Terms & Conditions</Label>
                            <Textarea id="terms" value={formData.terms} onChange={(e) => handleInputChange('terms', e.target.value)} rows={4} placeholder="Describe rules, duration, usage rights, etc." required />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={createCampaignMutation.isPending}>
                                {createCampaignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Submit for Approval
                            </Button>
                        </div>
                    </form>
                )}

                <h3 className="text-lg font-semibold text-[#1C2E45] mb-4">Existing Campaigns</h3>
                {isLoading ? (
                    <p>Loading campaigns...</p>
                ) : existingCampaigns.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">You haven't created any affiliate campaigns yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Main Code</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {existingCampaigns.map(campaign => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.product_name}</TableCell>
                                        <TableCell>{campaign.main_affiliate_code}</TableCell>
                                        <TableCell>{campaign.commission_structure}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}