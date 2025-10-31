import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, Loader2, AlertCircle, Star, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { sendBridgedEmail } from '@/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModelListEnrollment() {
    const [submitted, setSubmitted] = useState(false);

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: existingEntry, isLoading: entryLoading } = useQuery({
        queryKey: ['modelEntry', user?.id],
        queryFn: () => base44.entities.ModelListEntry.filter({ athlete_id: user.id }).then(res => res[0]),
        enabled: !!user
    });

    const enrollMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('User not authenticated');

            // Create model list entry from user profile
            const entry = await base44.entities.ModelListEntry.create({
                athlete_id: user.id,
                athlete_name: user.full_name,
                email: user.email,
                sport_team: user.sport || 'Not specified',
                instagram: user.instagram || '',
                portfolio_link: user.linkedin || '',
                photo_url: user.photo_url || '',
                availability: ['Weekdays', 'Weekends'], // Default
                experience_notes: user.nil_experience || 'No prior experience',
                status: 'Pending'
            });

            // Notify admin
            await sendBridgedEmail({
                to: 'nbowles@bridged.agency',
                subject: `New Model List Application: ${user.full_name}`,
                body: `
                    <p><strong>New Model List Application</strong></p>
                    <div style="background: #F8F5F2; padding: 20px; border-radius: 8px;">
                        <p><strong>Athlete:</strong> ${user.full_name}</p>
                        <p><strong>Sport:</strong> ${user.sport}</p>
                        <p><strong>School:</strong> ${user.school}</p>
                        <p><strong>Instagram:</strong> ${user.instagram || 'Not provided'}</p>
                        <p><strong>Total Followers:</strong> ${user.total_followers || 'Not provided'}</p>
                    </div>
                    <p>Review this application in the admin dashboard.</p>
                `,
                buttonText: "Review Application",
                buttonUrl: "https://pro.base44.com/app/bridged/pages/Admin",
                eventType: 'admin_notification'
            });

            return entry;
        },
        onSuccess: () => {
            setSubmitted(true);
            toast.success('Application submitted successfully!');
        },
        onError: (error) => {
            toast.error(`Failed to submit: ${error.message}`);
        }
    });

    if (userLoading || entryLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-4">Login Required</h2>
                        <p className="text-gray-600 mb-6">
                            You must be logged in as an athlete to join the model list.
                        </p>
                        <Button onClick={() => base44.auth.redirectToLogin()} size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                            Log In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (user.account_type !== 'athlete') {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-4">Athletes Only</h2>
                        <p className="text-gray-600 mb-6">
                            Only athlete accounts can join the model list.
                        </p>
                        <Link to={createPageUrl("Home")}>
                            <Button size="lg" variant="outline">
                                Return Home
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Already applied - show status
    if (existingEntry) {
        const statusConfig = {
            'Pending': {
                color: 'yellow',
                icon: Loader2,
                title: 'Application Under Review',
                message: 'Our team is reviewing your profile. We\'ll reach out if you\'re selected!'
            },
            'Approved': {
                color: 'green',
                icon: CheckCircle2,
                title: 'You\'re on the Model List! 🎉',
                message: 'Congratulations! You\'re now eligible for modeling campaigns and brand partnerships.'
            },
            'Rejected': {
                color: 'red',
                icon: AlertCircle,
                title: 'Application Not Approved',
                message: 'Unfortunately, your application wasn\'t approved at this time. You can reapply in the future.'
            }
        };

        const config = statusConfig[existingEntry.status] || statusConfig['Pending'];
        const Icon = config.icon;

        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="p-12 text-center">
                        <div className={`w-20 h-20 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                            <Icon className={`w-12 h-12 text-${config.color}-600 ${existingEntry.status === 'Pending' ? 'animate-spin' : ''}`} />
                        </div>
                        <h1 className="text-3xl font-bold text-[#1C2E45] mb-4 heading-font">
                            {config.title}
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            {config.message}
                        </p>
                        {existingEntry.status === 'Approved' && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                                <h3 className="font-bold text-[#1C2E45] mb-3">What This Means:</h3>
                                <ul className="text-left space-y-2 text-gray-700">
                                    <li>✅ You're eligible for modeling campaigns</li>
                                    <li>✅ Brands can request you for content creation</li>
                                    <li>✅ You'll be notified when opportunities arise</li>
                                </ul>
                            </div>
                        )}
                        <Link to={createPageUrl("AthleteDashboard")}>
                            <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success screen after submission
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#1C2E45] mb-4 heading-font">
                            Application Submitted! ✨
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Thanks! Our team will review your profile and reach out if selected.
                        </p>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-[#1C2E45] mb-3">What Happens Next?</h3>
                            <ol className="text-left space-y-2 text-gray-700">
                                <li>1. Our team reviews your profile (1-3 business days)</li>
                                <li>2. If approved, you'll receive an email notification</li>
                                <li>3. Start getting matched with brand campaigns!</li>
                            </ol>
                        </div>
                        <Link to={createPageUrl("AthleteDashboard")}>
                            <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Enrollment form (just a button)
    return (
        <div className="min-h-screen bg-[#F8F5F2] py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <Camera className="w-16 h-16 text-[#1C2E45] mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4 heading-font">
                        Join the Bridged Model List
                    </h1>
                    <p className="text-xl text-gray-600">
                        Get matched with brands for professional photoshoots and content creation
                    </p>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-[#1C2E45] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-[#1C2E45] mb-2">Professional Shoots</h3>
                            <p className="text-sm text-gray-600">
                                Work with brands on high-quality photo and video content
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-[#946b56] rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-[#1C2E45] mb-2">Build Your Portfolio</h3>
                            <p className="text-sm text-gray-600">
                                Gain professional content for your personal brand
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-[#DED4C4] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-6 h-6 text-[#1C2E45]" />
                            </div>
                            <h3 className="font-bold text-[#1C2E45] mb-2">Exclusive Opportunities</h3>
                            <p className="text-sm text-gray-600">
                                Access campaigns not available to general applicants
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Preview */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Your Profile Preview</CardTitle>
                        <CardDescription>
                            We'll use your existing profile information for your model list application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                {user.photo_url ? (
                                    <img src={user.photo_url} alt={user.full_name} className="w-20 h-20 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Users className="w-10 h-10 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-[#1C2E45]">{user.full_name}</h3>
                                    <p className="text-sm text-gray-600">{user.sport}</p>
                                    <p className="text-sm text-gray-600">{user.school}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Instagram:</span>
                                    <p className="text-sm text-[#1C2E45]">{user.instagram || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Total Followers:</span>
                                    <p className="text-sm text-[#1C2E45]">{user.total_followers || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {(!user.photo_url || !user.instagram) && (
                            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    <strong>💡 Tip:</strong> Complete your profile with a photo and Instagram handle to increase your chances of approval!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enrollment Button */}
                <Card className="border-2 border-[#1C2E45]">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-gray-600 mb-6">
                            By joining the model list, you agree to be contacted for brand partnership opportunities.
                        </p>
                        <Button
                            size="lg"
                            onClick={() => enrollMutation.mutate()}
                            disabled={enrollMutation.isPending}
                            className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg px-12 py-6"
                        >
                            {enrollMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    <Star className="w-5 h-5 mr-2" />
                                    Join Model List
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}