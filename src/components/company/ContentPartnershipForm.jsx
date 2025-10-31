import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ContentPartnershipForm({ company }) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        product_service: '',
        brand_description: '',
        ideal_models_description: '',
        ideal_scenery_field: '',
        content_expectations: '',
        preferred_call_time_1: '',
        preferred_call_time_2: '',
        preferred_call_time_3: '',
        preferred_sports: '',
        goals: '',
        shoot_month: '',
        assets_url: '',
        notes: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true);
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                handleInputChange('assets_url', file_url);
                toast.success('Brand assets uploaded successfully');
            } catch (error) {
                toast.error('Failed to upload file');
            }
            setUploading(false);
        }
    };

    const createPartnershipMutation = useMutation({
        mutationFn: async (data) => {
            const partnership = await base44.entities.ContentPartnership.create({
                company_id: company.id,
                company_name: company.company_name,
                contact_name: company.contact_name,
                email: company.contact_email,
                phone: company.contact_phone || '',
                product_service: data.product_service,
                brand_description: data.brand_description,
                ideal_models_description: data.ideal_models_description,
                ideal_scenery_field: data.ideal_scenery_field,
                content_expectations: data.content_expectations,
                preferred_call_times: [
                    data.preferred_call_time_1,
                    data.preferred_call_time_2,
                    data.preferred_call_time_3
                ].filter(Boolean),
                preferred_sports: data.preferred_sports.split(',').map(s => s.trim()).filter(Boolean),
                goals: data.goals,
                shoot_month: data.shoot_month,
                assets_url: data.assets_url,
                notes: data.notes,
                status: 'Pending Review',
                payment_status: 'Pending',
                fee: 625
            });
            
            return partnership;
        },
        onSuccess: (partnership) => {
            toast.success('Content partnership request submitted! You will be contacted to schedule a meeting.');
            queryClient.invalidateQueries({ queryKey: ['companyContentPartnerships'] });
            
            setFormData({
                product_service: '',
                brand_description: '',
                ideal_models_description: '',
                ideal_scenery_field: '',
                content_expectations: '',
                preferred_call_time_1: '',
                preferred_call_time_2: '',
                preferred_call_time_3: '',
                preferred_sports: '',
                goals: '',
                shoot_month: '',
                assets_url: '',
                notes: ''
            });
        },
        onError: (error) => {
            toast.error(`Failed to submit: ${error.message}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.product_service || !formData.brand_description || !formData.ideal_models_description || !formData.content_expectations || !formData.shoot_month) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.preferred_call_time_1) {
            toast.error('Please provide at least one preferred meeting time');
            return;
        }

        createPartnershipMutation.mutate(formData);
    };

    return (
        <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-xl flex items-center justify-center shadow-sm">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-[#1C2E45]">Book a Content Campaign</CardTitle>
                </div>
                <p className="text-gray-600">Get professional content created by our athlete models for $625.</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="product_service">Product/Service *</Label>
                            <Input
                                id="product_service"
                                value={formData.product_service}
                                onChange={(e) => handleInputChange('product_service', e.target.value)}
                                placeholder="e.g., Fitness App, Protein Powder"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="shoot_month">Preferred Shoot Month *</Label>
                            <Input
                                id="shoot_month"
                                type="month"
                                value={formData.shoot_month}
                                onChange={(e) => handleInputChange('shoot_month', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="brand_description">Brand Description *</Label>
                        <Textarea
                            id="brand_description"
                            value={formData.brand_description}
                            onChange={(e) => handleInputChange('brand_description', e.target.value)}
                            placeholder="Tell us about your brand, mission, and target audience"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="ideal_models_description">Ideal Athlete/Model Description *</Label>
                        <Textarea
                            id="ideal_models_description"
                            value={formData.ideal_models_description}
                            onChange={(e) => handleInputChange('ideal_models_description', e.target.value)}
                            placeholder="Describe the type of athlete that would best represent your brand (e.g., energetic female volleyball player, confident male basketball player)"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="ideal_scenery_field">Ideal Setting/Location *</Label>
                        <Textarea
                            id="ideal_scenery_field"
                            value={formData.ideal_scenery_field}
                            onChange={(e) => handleInputChange('ideal_scenery_field', e.target.value)}
                            placeholder="Describe your ideal shoot location (e.g., outdoor track, gym, campus quad)"
                            rows={2}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="content_expectations">What Content Do You Hope to Receive? *</Label>
                        <Textarea
                            id="content_expectations"
                            value={formData.content_expectations}
                            onChange={(e) => handleInputChange('content_expectations', e.target.value)}
                            placeholder="Describe the type of content you want (e.g., '2 TikTok-style videos of athlete using our product' or '10 professional photos for website and social media')"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="goals">Campaign Goals</Label>
                        <Textarea
                            id="goals"
                            value={formData.goals}
                            onChange={(e) => handleInputChange('goals', e.target.value)}
                            placeholder="What are you hoping to achieve with this content?"
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label htmlFor="preferred_sports">Preferred Sports (comma-separated)</Label>
                        <Input
                            id="preferred_sports"
                            value={formData.preferred_sports}
                            onChange={(e) => handleInputChange('preferred_sports', e.target.value)}
                            placeholder="e.g., Basketball, Football, Volleyball"
                        />
                    </div>

                    <div>
                        <Label>Three Preferred Video Call Times *</Label>
                        <p className="text-sm text-gray-500 mb-2">We'll schedule a brief call to discuss your vision before the shoot.</p>
                        <div className="space-y-2">
                            <Input
                                type="datetime-local"
                                value={formData.preferred_call_time_1}
                                onChange={(e) => handleInputChange('preferred_call_time_1', e.target.value)}
                                required
                            />
                            <Input
                                type="datetime-local"
                                value={formData.preferred_call_time_2}
                                onChange={(e) => handleInputChange('preferred_call_time_2', e.target.value)}
                            />
                            <Input
                                type="datetime-local"
                                value={formData.preferred_call_time_3}
                                onChange={(e) => handleInputChange('preferred_call_time_3', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="assets">Brand Assets (Optional)</Label>
                        <p className="text-sm text-gray-500 mb-2">Upload logos, brand guidelines, or product photos</p>
                        <div className="flex items-center gap-4">
                            <Input
                                id="assets"
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="flex-1"
                            />
                            {uploading && <Loader2 className="w-5 h-5 animate-spin text-[#946b56]" />}
                        </div>
                        {formData.assets_url && (
                            <p className="text-sm text-green-600 mt-2">✓ File uploaded successfully</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Any other details we should know?"
                            rows={2}
                        />
                    </div>

                    <div className="bg-[#F8F5F2] p-4 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <strong>What's included:</strong> Two short-form ad clips perfect for social media + professional photography. Total cost: $625 (one-time fee).
                        </p>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-[#946b56] hover:bg-[#a98471] text-white text-lg py-6"
                        disabled={createPartnershipMutation.isPending}
                    >
                        {createPartnershipMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Content Partnership Request'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}