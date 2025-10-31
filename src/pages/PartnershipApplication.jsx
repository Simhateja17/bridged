import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CheckCircle2, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { sendBridgedEmail } from '@/utils';

export default function PartnershipApplication() {
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        company_headquarters: '',
        contact_name: '',
        contact_email: '',
        website: '',
        product_name: '',
        athlete_preference: 'Both',
        campaign_goal: '',
        campaign_message: '',
        campaign_vision: '',
        brand_assets_url: '',
        preferred_meeting_time_1: '',
        preferred_meeting_time_2: '',
        preferred_meeting_time_3: ''
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
                handleInputChange('brand_assets_url', file_url);
                toast.success('Brand assets uploaded successfully');
            } catch (error) {
                toast.error('Failed to upload file');
            }
            setUploading(false);
        }
    };

    const submitApplicationMutation = useMutation({
        mutationFn: async (data) => {
            const application = await base44.entities.PartnershipApplication.create({
                ...data,
                status: 'pending_review'
            });

            // Send confirmation email to company
            await sendBridgedEmail({
                to: data.contact_email,
                subject: 'Partnership Application Received - Bridged',
                body: `
                    <p>Hi ${data.contact_name},</p>
                    <p>Thank you for applying for a partnership with Bridged!</p>
                    <p>We've received your application for <strong>${data.product_name}</strong> and our team will review it shortly.</p>
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Our team reviews your application (1-2 business days)</li>
                        <li>If approved, we'll schedule a meeting using one of your preferred times</li>
                        <li>After the meeting, you'll complete payment and shipping details</li>
                        <li>We'll match you with the perfect athlete partners!</li>
                    </ol>
                    <p>We'll be in touch soon!</p>
                `,
                buttonText: "Learn More About Bridged",
                buttonUrl: "https://pro.base44.com/app/bridged",
                eventType: 'partnership_application'
            });

            // Notify admin
            await sendBridgedEmail({
                to: 'nbowles@bridged.agency',
                subject: `New Partnership Application: ${data.company_name}`,
                body: `
                    <p><strong>New Partnership Application Received</strong></p>
                    <div style="background: #F8F5F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Company:</strong> ${data.company_name}</p>
                        <p><strong>Product:</strong> ${data.product_name}</p>
                        <p><strong>Contact:</strong> ${data.contact_name} (${data.contact_email})</p>
                        <p><strong>Athlete Preference:</strong> ${data.athlete_preference}</p>
                        <p><strong>Campaign Goal:</strong> ${data.campaign_goal}</p>
                    </div>
                    <p>Review this application in the admin dashboard.</p>
                `,
                buttonText: "Review Application",
                buttonUrl: "https://pro.base44.com/app/bridged/pages/Admin",
                eventType: 'admin_notification'
            });

            return application;
        },
        onSuccess: () => {
            setSubmitted(true);
            toast.success('Application submitted successfully!');
        },
        onError: (error) => {
            toast.error(`Failed to submit: ${error.message}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.company_name || !formData.contact_email || !formData.product_name || !formData.campaign_goal) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.preferred_meeting_time_1) {
            toast.error('Please provide at least one preferred meeting time');
            return;
        }

        submitApplicationMutation.mutate(formData);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#1C2E45] mb-4 heading-font">
                            Application Submitted!
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Thank you for your interest in partnering with Bridged.
                        </p>
                        <div className="bg-[#F8F5F2] p-6 rounded-lg mb-6 text-left">
                            <h3 className="font-bold text-[#1C2E45] mb-3">What Happens Next?</h3>
                            <ol className="space-y-2 text-gray-700">
                                <li>✅ We review your application (1-2 business days)</li>
                                <li>📞 If approved, we'll schedule a strategy call</li>
                                <li>💳 Complete payment and shipping setup</li>
                                <li>🎯 Get matched with perfect athlete partners!</li>
                            </ol>
                        </div>
                        <p className="text-sm text-gray-500">
                            We've sent a confirmation email to <strong>{formData.contact_email}</strong>
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F5F2] py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <Building2 className="w-16 h-16 text-[#1C2E45] mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4 heading-font">
                        Apply for a Partnership
                    </h1>
                    <p className="text-xl text-gray-600">
                        Partner with talented student-athletes to create authentic content for your brand
                    </p>
                </div>

                {/* Form */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Partnership Application</CardTitle>
                        <CardDescription>
                            Tell us about your company and campaign vision. Our team will review and be in touch within 1-2 business days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Company Information */}
                            <div>
                                <h3 className="text-xl font-bold text-[#1C2E45] mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#1C2E45] text-white rounded-full flex items-center justify-center text-sm">1</div>
                                    Company Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="company_name">Company Name *</Label>
                                        <Input
                                            id="company_name"
                                            value={formData.company_name}
                                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                                            placeholder="e.g., Acme Fitness Co."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="website">Company Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            placeholder="https://yourcompany.com"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="company_headquarters">Company Headquarters Address *</Label>
                                        <Input
                                            id="company_headquarters"
                                            value={formData.company_headquarters}
                                            onChange={(e) => handleInputChange('company_headquarters', e.target.value)}
                                            placeholder="123 Main St, City, State, ZIP"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="contact_name">Contact Name *</Label>
                                        <Input
                                            id="contact_name"
                                            value={formData.contact_name}
                                            onChange={(e) => handleInputChange('contact_name', e.target.value)}
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="contact_email">Contact Email *</Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={formData.contact_email}
                                            onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                            placeholder="you@company.com"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="product_name">Product for Campaign *</Label>
                                        <Input
                                            id="product_name"
                                            value={formData.product_name}
                                            onChange={(e) => handleInputChange('product_name', e.target.value)}
                                            placeholder="e.g., Performance Protein Powder, Athletic Apparel"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Campaign Details */}
                            <div>
                                <h3 className="text-xl font-bold text-[#1C2E45] mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#1C2E45] text-white rounded-full flex items-center justify-center text-sm">2</div>
                                    Campaign Details
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="athlete_preference">Athlete Gender Preference *</Label>
                                        <Select value={formData.athlete_preference} onValueChange={(value) => handleInputChange('athlete_preference', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Girl">Female Athletes</SelectItem>
                                                <SelectItem value="Boy">Male Athletes</SelectItem>
                                                <SelectItem value="Both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="campaign_goal">Campaign Goal *</Label>
                                        <Textarea
                                            id="campaign_goal"
                                            value={formData.campaign_goal}
                                            onChange={(e) => handleInputChange('campaign_goal', e.target.value)}
                                            placeholder="Brief description of what you want to achieve with this campaign..."
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="campaign_message">Why This Partnership? *</Label>
                                        <Textarea
                                            id="campaign_message"
                                            value={formData.campaign_message}
                                            onChange={(e) => handleInputChange('campaign_message', e.target.value)}
                                            placeholder="Tell us why you want to partner with student-athletes and what makes your brand a good fit..."
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="campaign_vision">Campaign Vision & Execution *</Label>
                                        <Textarea
                                            id="campaign_vision"
                                            value={formData.campaign_vision}
                                            onChange={(e) => handleInputChange('campaign_vision', e.target.value)}
                                            placeholder="Describe how you envision the campaign being executed (e.g., social media posts, video content, product reviews, etc.)..."
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="brand_assets">Brand Assets (Optional)</Label>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Upload logos, brand guidelines, product photos, or any relevant materials
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="brand_assets"
                                                type="file"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="flex-1"
                                            />
                                            {uploading && <Loader2 className="w-5 h-5 animate-spin text-[#1C2E45]" />}
                                        </div>
                                        {formData.brand_assets_url && (
                                            <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                File uploaded successfully
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Scheduling */}
                            <div>
                                <h3 className="text-xl font-bold text-[#1C2E45] mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#1C2E45] text-white rounded-full flex items-center justify-center text-sm">3</div>
                                    Preferred Meeting Times
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Provide three meeting times that work for you. We'll schedule a strategy call to discuss your campaign in detail.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="time1">First Choice *</Label>
                                        <Input
                                            id="time1"
                                            type="datetime-local"
                                            value={formData.preferred_meeting_time_1}
                                            onChange={(e) => handleInputChange('preferred_meeting_time_1', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="time2">Second Choice</Label>
                                        <Input
                                            id="time2"
                                            type="datetime-local"
                                            value={formData.preferred_meeting_time_2}
                                            onChange={(e) => handleInputChange('preferred_meeting_time_2', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="time3">Third Choice</Label>
                                        <Input
                                            id="time3"
                                            type="datetime-local"
                                            value={formData.preferred_meeting_time_3}
                                            onChange={(e) => handleInputChange('preferred_meeting_time_3', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                <h4 className="font-bold text-[#1C2E45] mb-2">What Happens Next?</h4>
                                <ol className="text-sm text-gray-700 space-y-1">
                                    <li>1. Our team reviews your application (1-2 business days)</li>
                                    <li>2. If approved, we'll schedule a meeting to discuss your campaign</li>
                                    <li>3. Complete payment and provide product shipping details</li>
                                    <li>4. We match you with the perfect athletes and begin the campaign!</li>
                                </ol>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg py-6"
                                disabled={submitApplicationMutation.isPending}
                            >
                                {submitApplicationMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Submitting Application...
                                    </>
                                ) : (
                                    'Submit Partnership Application'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}