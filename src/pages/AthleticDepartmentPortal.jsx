import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, X, Loader2, Shield, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { sendBridgedEmail } from '@/components/emailUtils';

export default function AthleticDepartmentPortal() {
    const queryClient = useQueryClient();
    const [token, setToken] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        setToken(tokenParam);
    }, []);

    const { data: verificationRequest, isLoading, error } = useQuery({
        queryKey: ['verification-request', token],
        queryFn: async () => {
            const requests = await base44.entities.VerificationRequest.filter({ verification_token: token });
            if (requests.length === 0) {
                throw new Error('Invalid or expired verification link');
            }
            const request = requests[0];
            
            if (new Date(request.token_expires) < new Date()) {
                throw new Error('This verification link has expired');
            }
            
            return request;
        },
        enabled: !!token,
        retry: false
    });

    const approveMutation = useMutation({
        mutationFn: async ({ requestId, userId, verifierEmail }) => {
            await base44.entities.VerificationRequest.update(requestId, {
                status: 'verified',
                verified_by: verifierEmail,
                verified_date: new Date().toISOString()
            });
            
            await base44.entities.User.update(userId, {
                verified_athlete: true,
                verification_status: 'verified',
                verified_date: new Date().toISOString(),
                verified_by: verifierEmail
            });
        },
        onSuccess: async () => {
            if (verificationRequest) {
                await sendBridgedEmail({
                    to: verificationRequest.email,
                    subject: "Your Bridged Profile is Verified! 🎉",
                    body: `
                        <p>Great news, ${verificationRequest.name.split(' ')[0]}!</p>
                        <p>Your athletic department has verified your status as a student-athlete at <strong>${verificationRequest.school}</strong>.</p>
                        <p><strong>You now have full access to:</strong></p>
                        <ul>
                            <li>Apply for paid internships</li>
                            <li>Join affiliate marketing partnerships</li>
                            <li>Connect with brands</li>
                            <li>Access exclusive NIL opportunities</li>
                        </ul>
                        <p>Start exploring opportunities now!</p>
                    `,
                    buttonText: "View My Profile",
                    buttonUrl: "https://pro.base44.com/app/bridged",
                    eventType: 'athlete_verified'
                });
            }
            
            queryClient.invalidateQueries({ queryKey: ['verification-request'] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ requestId, userId, verifierEmail, reason }) => {
            await base44.entities.VerificationRequest.update(requestId, {
                status: 'rejected',
                verified_by: verifierEmail,
                verified_date: new Date().toISOString(),
                rejection_reason: reason
            });
            
            await base44.entities.User.update(userId, {
                verification_status: 'rejected',
                verified_athlete: false,
                admin_notes: reason
            });
        },
        onSuccess: async () => {
            if (verificationRequest) {
                await sendBridgedEmail({
                    to: verificationRequest.email,
                    subject: "Update on Your Bridged Verification",
                    body: `
                        <p>Hello ${verificationRequest.name.split(' ')[0]},</p>
                        <p>We've received feedback from your athletic department regarding your verification request.</p>
                        <p><strong>Reason:</strong> ${rejectionReason}</p>
                        <p>If you believe this is an error, please contact your athletic department directly or reach out to Bridged support at support@bridged.com.</p>
                    `,
                    buttonText: "Contact Support",
                    buttonUrl: "mailto:support@bridged.com",
                    eventType: 'athlete_verification_rejected'
                });
            }
            
            queryClient.invalidateQueries({ queryKey: ['verification-request'] });
        }
    });

    const handleApprove = () => {
        const verifierEmail = prompt("Please enter your .edu email address to confirm verification:");
        if (verifierEmail && verifierEmail.endsWith('.edu')) {
            approveMutation.mutate({
                requestId: verificationRequest.id,
                userId: verificationRequest.user_id,
                verifierEmail
            });
        } else {
            alert("Please provide a valid .edu email address");
        }
    };

    const handleReject = () => {
        setShowRejectionForm(true);
    };

    const submitRejection = () => {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        
        const verifierEmail = prompt("Please enter your .edu email address to confirm rejection:");
        if (verifierEmail && verifierEmail.endsWith('.edu')) {
            rejectMutation.mutate({
                requestId: verificationRequest.id,
                userId: verificationRequest.user_id,
                verifierEmail,
                reason: rejectionReason
            });
        } else {
            alert("Please provide a valid .edu email address");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#1C2E45]" />
            </div>
        );
    }

    if (error || !verificationRequest) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Invalid Link</h2>
                        <p className="text-gray-600">{error?.message || 'This verification link is invalid or has expired.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (verificationRequest.status !== 'pending') {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Already Processed</h2>
                        <p className="text-gray-600">
                            This verification request has already been {verificationRequest.status === 'verified' ? 'approved' : 'rejected'}.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F5F2]">
            <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Shield className="w-16 h-16 text-[#DED4C4] mx-auto mb-4" />
                    <h1 className="text-4xl font-bold mb-2">Athletic Department Verification</h1>
                    <p className="text-[#DED4C4] text-lg">Review and verify student-athlete status</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card className="border-2 border-[#946b56] shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-[#F8F5F2] to-white border-b border-[#E7E0DA]">
                        <CardTitle className="text-2xl font-bold text-[#1C2E45]">Athlete Verification Request</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {verificationRequest.photo_url && (
                            <div className="flex justify-center mb-8">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#946b56] shadow-lg">
                                    <img 
                                        src={verificationRequest.photo_url} 
                                        alt={verificationRequest.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3 p-4 bg-[#F8F5F2] rounded-lg">
                                <UserIcon className="w-5 h-5 text-[#946b56] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600">Full Name</p>
                                    <p className="text-lg font-semibold text-[#1C2E45]">{verificationRequest.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-[#F8F5F2] rounded-lg">
                                <Mail className="w-5 h-5 text-[#946b56] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="text-lg font-semibold text-[#1C2E45]">{verificationRequest.email}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-[#F8F5F2] rounded-lg">
                                    <p className="text-sm text-gray-600">School</p>
                                    <p className="text-lg font-semibold text-[#1C2E45]">{verificationRequest.school}</p>
                                </div>
                                <div className="p-4 bg-[#F8F5F2] rounded-lg">
                                    <p className="text-sm text-gray-600">Sport</p>
                                    <p className="text-lg font-semibold text-[#1C2E45]">{verificationRequest.sport}</p>
                                </div>
                            </div>

                            {verificationRequest.graduation_year && (
                                <div className="flex items-start gap-3 p-4 bg-[#F8F5F2] rounded-lg">
                                    <Calendar className="w-5 h-5 text-[#946b56] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Expected Graduation</p>
                                        <p className="text-lg font-semibold text-[#1C2E45]">{verificationRequest.graduation_year}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                            <p className="text-sm text-blue-800">
                                <strong>About Bridged:</strong> This platform helps student-athletes connect with NIL opportunities, internships, and brand partnerships. By verifying this athlete, you confirm they are a current student-athlete at your institution.
                            </p>
                        </div>

                        {showRejectionForm && (
                            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
                                <Label htmlFor="rejection_reason" className="text-[#1C2E45] font-semibold mb-2 block">
                                    Please provide a reason for rejection:
                                </Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="mb-4"
                                    rows={4}
                                    placeholder="e.g., Not currently on the roster, incorrect information, etc."
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={submitRejection}
                                        disabled={rejectMutation.isPending}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                                        Confirm Rejection
                                    </Button>
                                    <Button
                                        onClick={() => setShowRejectionForm(false)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!showRejectionForm && (
                            <div className="flex flex-col md:flex-row gap-4">
                                <Button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                                >
                                    {approveMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                    )}
                                    Verify Athlete
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    variant="destructive"
                                    className="flex-1 py-6 text-lg"
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    Reject Request
                                </Button>
                            </div>
                        )}

                        {approveMutation.isSuccess && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="text-green-800 font-semibold">Athlete successfully verified!</p>
                                <p className="text-sm text-green-700 mt-1">They will receive a confirmation email shortly.</p>
                            </div>
                        )}

                        {rejectMutation.isSuccess && (
                            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                <p className="text-gray-800 font-semibold">Request has been rejected.</p>
                                <p className="text-sm text-gray-700 mt-1">The athlete will be notified.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>🔒 This is a secure, one-time verification link. No login or account creation required.</p>
                    <p className="mt-2">Questions? Contact Bridged support at <a href="mailto:support@bridged.com" className="text-[#946b56] underline">support@bridged.com</a></p>
                </div>
            </div>
        </div>
    );
}