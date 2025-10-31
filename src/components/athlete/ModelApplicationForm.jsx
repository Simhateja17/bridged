import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModelApplicationForm({ user, existingEntry, isLoading }) {
    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    const statusConfig = {
        'Pending': {
            color: 'yellow',
            icon: Loader2,
            title: 'Application Under Review',
            message: 'Our team is reviewing your profile. We\'ll reach out if you\'re selected!',
            showSpin: true
        },
        'Approved': {
            color: 'green',
            icon: CheckCircle2,
            title: 'You\'re on the Model List! 🎉',
            message: 'Congratulations! You\'re now eligible for modeling campaigns and brand partnerships.',
            showSpin: false
        },
        'Rejected': {
            color: 'red',
            icon: AlertCircle,
            title: 'Application Not Approved',
            message: 'Unfortunately, your application wasn\'t approved at this time. You can reapply in the future.',
            showSpin: false
        }
    };

    // Has existing entry - show status
    if (existingEntry) {
        const config = statusConfig[existingEntry.status] || statusConfig['Pending'];
        const Icon = config.icon;

        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <div className={`w-20 h-20 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <Icon className={`w-12 h-12 text-${config.color}-600 ${config.showSpin ? 'animate-spin' : ''}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1C2E45] mb-4 heading-font">
                        {config.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                        {config.message}
                    </p>
                    {existingEntry.status === 'Approved' && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-left">
                            <h3 className="font-bold text-[#1C2E45] mb-3">What This Means:</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>✅ You're eligible for modeling campaigns</li>
                                <li>✅ Brands can request you for content creation</li>
                                <li>✅ You'll be notified when opportunities arise</li>
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // No entry - show apply button
    return (
        <div className="space-y-6">
            <Card className="border-2 border-[#1C2E45]">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Camera className="w-8 h-8 text-[#1C2E45]" />
                        <CardTitle className="text-2xl">Join the Model List</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        Get matched with brands for professional photoshoots and content creation opportunities
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                        <h3 className="font-bold text-[#1C2E45] mb-3">Benefits of the Model List:</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>📸 Professional photo and video shoots</li>
                            <li>🌟 Build your portfolio with high-quality content</li>
                            <li>💼 Exclusive brand partnership opportunities</li>
                            <li>💰 Compensation for your time and creativity</li>
                        </ul>
                    </div>

                    <div className="bg-[#F8F5F2] rounded-lg p-6">
                        <h3 className="font-bold text-[#1C2E45] mb-3">Your Profile Preview:</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-600">Name:</span>
                                <p className="text-[#1C2E45]">{user.full_name}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Sport:</span>
                                <p className="text-[#1C2E45]">{user.sport}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">School:</span>
                                <p className="text-[#1C2E45]">{user.school}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Instagram:</span>
                                <p className="text-[#1C2E45]">{user.instagram || 'Not provided'}</p>
                            </div>
                        </div>
                        
                        {(!user.photo_url || !user.instagram) && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                                <p className="text-sm text-gray-700">
                                    <strong>💡 Tip:</strong> Complete your profile with a photo and Instagram to increase approval chances!
                                </p>
                            </div>
                        )}
                    </div>

                    <Link to={createPageUrl("ModelListEnrollment")} className="block">
                        <Button size="lg" className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg py-6">
                            <Camera className="w-5 h-5 mr-2" />
                            Apply to Model List
                        </Button>
                    </Link>

                    <p className="text-xs text-center text-gray-500">
                        Applications are reviewed within 1-3 business days
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}