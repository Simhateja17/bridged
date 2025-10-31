
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, Loader2, Upload, ExternalLink, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const OnboardingStep = ({ step, partnership, userRole }) => {
    const queryClient = useQueryClient();
    const [meetingLink, setMeetingLink] = useState(step.meeting_link || '');
    
    const updateStepsMutation = useMutation({
        mutationFn: (newSteps) => base44.entities.Partnership.update(partnership.id, { onboarding_steps: newSteps }),
        onSuccess: () => {
            queryClient.invalidateQueries(['partnership', partnership.id]);
            toast.success("Onboarding step updated!");
        },
        onError: (err) => toast.error(`Update failed: ${err.message}`)
    });

    const handleSaveMeetingLink = () => {
        const newSteps = partnership.onboarding_steps.map(s => 
            s.step_number === step.step_number ? { ...s, meeting_link: meetingLink, is_completed: !!meetingLink } : s
        );
        updateStepsMutation.mutate(newSteps);
    };

    const isManager = userRole === 'admin' || userRole === 'company';
    const isIntroCallStep = step.name.toLowerCase().includes('introduction call');

    return (
        <div className="flex items-start gap-4 p-4 border-b border-[#E7E0DA] last:border-b-0">
            {step.is_completed ? (
                <CheckCircle2 className="w-8 h-8 text-green-500 mt-1 flex-shrink-0" />
            ) : (
                <Clock className="w-8 h-8 text-yellow-500 mt-1 flex-shrink-0" />
            )}
            <div className="flex-1">
                <p className="font-bold text-lg text-[#1C2E45]">{step.name}</p>
                <p className="text-gray-600 text-medium">{step.description}</p>
                {step.completed_date && (
                    <p className="text-xs text-gray-500 mt-1">Completed on: {format(new Date(step.completed_date), 'MMM d, yyyy')}</p>
                )}

                {/* Specific logic for Introduction Call */}
                {isIntroCallStep && (
                    <div className="mt-4">
                        {isManager ? (
                            <div className="flex gap-2 items-center max-w-md">
                                <Input 
                                    placeholder="Paste Google Meet/Zoom link here"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                />
                                <Button onClick={handleSaveMeetingLink} disabled={updateStepsMutation.isPending || !meetingLink}>
                                    {updateStepsMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
                                </Button>
                            </div>
                        ) : (
                            step.meeting_link ? (
                                <Button asChild>
                                    <a href={step.meeting_link} target="_blank" rel="noopener noreferrer">
                                        <Video className="w-4 h-4 mr-2" />
                                        Join Introduction Call
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-sm text-gray-500 italic">The company will schedule the call and add the link here.</p>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const SignatureStatus = ({ isSigned, text, signatureDate }) => (
    <div className={`flex items-center gap-2 text-sm font-medium ${isSigned ? 'text-green-600' : 'text-gray-500'}`}>
        {isSigned ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        <span>{text}</span>
        {isSigned && signatureDate && (
            <span className="text-xs text-gray-400">on {format(new Date(signatureDate), 'MMM d, yyyy')}</span>
        )}
    </div>
);

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const BridgedAgreementViewer = ({ open, onClose, onAgree, userType }) => {
    const { data: agreementSetting } = useQuery({
        queryKey: ['bridged-agreement'],
        queryFn: async () => {
            const results = await base44.entities.PlatformSetting.filter({ key: 'bridged_platform_agreement' });
            return results[0];
        }
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Bridged Platform Agreement
                    </DialogTitle>
                    <DialogDescription>
                        Please review the terms and conditions before signing
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="h-[400px] border rounded-lg p-6 bg-gray-50">
                    {agreementSetting ? (
                        <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: agreementSetting.value }}
                        />
                    ) : (
                        <div className="space-y-4 text-gray-700">
                            <h3 className="font-bold text-lg">BRIDGED PLATFORM AGREEMENT</h3>
                            
                            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                            
                            <h4 className="font-semibold mt-4">1. Platform Services</h4>
                            <p>Bridged provides a platform connecting student-athletes with companies for internship opportunities, affiliate partnerships, and content creation campaigns.</p>
                            
                            <h4 className="font-semibold mt-4">2. User Verification</h4>
                            <p>All athletes must verify their student-athlete status through their athletic department. Companies must verify their business registration and contact information.</p>
                            
                            <h4 className="font-semibold mt-4">3. Partnership Terms</h4>
                            <p>• All partnerships must be documented through official agreements</p>
                            <p>• Payment terms are as specified in individual partnership agreements</p>
                            <p>• Either party may terminate with written notice as per agreement terms</p>
                            
                            <h4 className="font-semibold mt-4">4. Payment Processing</h4>
                            <p>Bridged processes payments through Stripe. A service fee of 17-20% applies to all transactions as outlined in the specific partnership agreement.</p>
                            
                            <h4 className="font-semibold mt-4">5. Content & IP Rights</h4>
                            <p>Content created during partnerships is owned according to the specific partnership agreement. Athletes retain rights to their name, image, and likeness unless otherwise agreed.</p>
                            
                            <h4 className="font-semibold mt-4">6. Limitation of Liability</h4>
                            <p>Bridged acts as a facilitator and is not liable for disputes between athletes and companies. We recommend all parties obtain appropriate insurance and legal counsel.</p>
                            
                            <h4 className="font-semibold mt-4">7. Data Privacy</h4>
                            <p>Your data is protected according to our Privacy Policy. We do not sell your personal information to third parties.</p>
                            
                            <h4 className="font-semibold mt-4">8. Dispute Resolution</h4>
                            <p>Any disputes will be resolved through mediation, and if necessary, binding arbitration in accordance with the laws of the jurisdiction where Bridged is registered.</p>
                            
                            <h4 className="font-semibold mt-4">9. Modifications</h4>
                            <p>Bridged reserves the right to modify these terms with 30 days notice to all users.</p>
                            
                            <p className="mt-6 font-semibold">By signing below, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
                        </div>
                    )}
                </ScrollArea>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onAgree} className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                        I Agree & Sign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function PaperworkHub({ partnership, currentUser }) {
    const queryClient = useQueryClient();
    const [uploadingFile, setUploadingFile] = useState(null); // Stores the field name currently being uploaded
    const [signingField, setSigningField] = useState(null); // Stores the field name currently being signed
    const [parentName, setParentName] = useState(partnership.parental_consent_parent_name || '');
    const [parentEmail, setParentEmail] = useState(partnership.parental_consent_parent_email || '');
    const [showBridgedAgreement, setShowBridgedAgreement] = useState(false);
    const [agreementUserType, setAgreementUserType] = useState(null);

    const { data: athlete } = useQuery({
        queryKey: ['athleteForPartnership', partnership.athlete_id],
        queryFn: () => base44.entities.User.get(partnership.athlete_id),
        enabled: !!partnership.athlete_id,
    });

    const isMinor = athlete ? calculateAge(athlete.date_of_birth) < 18 : false;
    const isManager = currentUser.role === 'admin' || currentUser.account_type === 'company';

    // This mutation now handles both updating fields (like signature statuses, parent info)
    // AND updating file URLs after the file has been uploaded separately.
    const updatePartnershipMutation = useMutation({
        mutationFn: (data) => base44.entities.Partnership.update(partnership.id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['partnership', partnership.id]);
            const fieldName = Object.keys(variables)[0]; // Assumes single field update per mutate call

            let toastMessage = "Update successful!";
            if (fieldName.includes('signed')) {
                toastMessage = "Agreement signed successfully!";
            } else if (fieldName === 'school_credit_form_url') {
                toastMessage = "For-Credit Form uploaded successfully!";
            } else if (fieldName === 'internship_agreement_url') {
                toastMessage = "Internship Agreement uploaded successfully!";
            } else if (fieldName.includes('parental_consent_parent')) {
                 toastMessage = "Parental consent info saved!";
            }
            toast.success(toastMessage);
        },
        onError: (error) => toast.error(`Update failed: ${error.message}`),
        onSettled: () => {
            // Note: setUploadingFile is handled by handleFileUpload's try/catch/finally
            setSigningField(null); // Only reset signingField here, uploadingFile is managed by handleFileUpload
        }
    });

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setUploadingFile(fieldName);
            try {
                // Perform the actual file upload first
                const { file_url } = await base44.integrations.Core.UploadPrivateFile({ file });
                // Then update the partnership record with the new file URL
                await updatePartnershipMutation.mutateAsync({ [fieldName]: file_url });
            } catch (error) {
                // Catch errors from file upload or partnership update
                toast.error(`Operation failed: ${error.message}`);
            } finally {
                setUploadingFile(null); // Ensure loading state is reset
            }
        }
    };

    const handleSignature = (field) => {
        setSigningField(field);
        updatePartnershipMutation.mutate({ [field]: true });
    };

    const handleBridgedAgreementSign = (userType) => {
        setAgreementUserType(userType);
        setShowBridgedAgreement(true);
    };

    const confirmBridgedAgreement = () => {
        const field = agreementUserType === 'company' 
            ? 'bridged_agreement_signed_by_company' 
            : 'bridged_agreement_signed_by_athlete';
        handleSignature(field);
        setShowBridgedAgreement(false);
    };
    
    const handleParentInfoSave = () => {
        // Set signingField to indicate pending for this specific action, though it's not a 'signature'
        // This leverages the existing loading state management for the button
        setSigningField('parent_info_save'); 
        updatePartnershipMutation.mutate({
            parental_consent_parent_name: parentName,
            parental_consent_parent_email: parentEmail,
        });
    };

    return (
        <Card className="bg-white border-[#E7E0DA]">
            <CardHeader>
                <CardTitle className="text-2xl text-[#1A2238]">Onboarding & Agreements</CardTitle>
                <CardDescription>
                    Complete these steps to finalize the partnership and get started.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="font-bold text-xl mb-2 text-[#1C2E45]">Onboarding Checklist</h3>
                    <div className="border border-[#E7E0DA] rounded-lg">
                        {partnership.onboarding_steps?.sort((a, b) => a.step_number - b.step_number).map(step => (
                           <OnboardingStep key={step.step_number} step={step} partnership={partnership} userRole={currentUser.role} />
                        ))}
                    </div>
                </div>

                <div className="border-t pt-6 space-y-6">
                    <h3 className="font-bold text-xl text-[#1C2E45]">Partnership Agreements</h3>
                    
                    {isMinor && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg text-red-600">Parent/Guardian Consent (Required)</CardTitle>
                                <CardDescription>As the athlete is a minor, consent from a parent or guardian is required to proceed.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isManager && (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                                        <h4 className="font-medium">Enter Parent/Guardian Information</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">Full Name</label>
                                                <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Parent/Guardian Name" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Email Address</label>
                                                <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" />
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleParentInfoSave} disabled={updatePartnershipMutation.isPending && signingField === 'parent_info_save'}>
                                            {updatePartnershipMutation.isPending && signingField === 'parent_info_save' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : 'Save Info'}
                                        </Button>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <SignatureStatus isSigned={partnership.parental_consent_signed_by_parent} text={`Signed by Parent/Guardian (${partnership.parental_consent_parent_name || 'TBD'})`} />
                                    <SignatureStatus isSigned={partnership.parental_consent_signed_by_athlete} text={`Signed by Athlete (${partnership.athlete_name || 'N/A'})`} />
                                </div>
                                <div className="flex gap-4">
                                    {isManager && !partnership.parental_consent_signed_by_parent && (
                                        <Button onClick={() => handleSignature('parental_consent_signed_by_parent')} disabled={!partnership.parental_consent_parent_name || !partnership.parental_consent_parent_email || (updatePartnershipMutation.isPending && signingField === 'parental_consent_signed_by_parent')}>
                                            {updatePartnershipMutation.isPending && signingField === 'parental_consent_signed_by_parent' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                            Record Parent Signature
                                        </Button>
                                    )}
                                    {currentUser.account_type === 'athlete' && !partnership.parental_consent_signed_by_athlete && (
                                         <Button onClick={() => handleSignature('parental_consent_signed_by_athlete')} disabled={!partnership.parental_consent_signed_by_parent || (updatePartnershipMutation.isPending && signingField === 'parental_consent_signed_by_athlete')}>
                                            {updatePartnershipMutation.isPending && signingField === 'parental_consent_signed_by_athlete' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                            Athlete Acknowledges
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 italic mt-2">{isManager ? "After receiving consent (e.g., via email), record the parent's signature here. Parent info must be saved first." : "Your parent/guardian must provide consent before you can acknowledge."}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bridged Platform Agreement</CardTitle>
                            <CardDescription>This confirms all parties agree to engage through the Bridged platform, acknowledging our terms, verification, and liability policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700">
                                    <strong>📄 Important:</strong> Please review the full Bridged Platform Agreement before signing.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setShowBridgedAgreement(true)}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Agreement
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <SignatureStatus 
                                    isSigned={partnership.bridged_agreement_signed_by_company} 
                                    text={`Signed by Company (${partnership.company_name || 'N/A'})`} 
                                    signatureDate={partnership.bridged_agreement_company_signed_date}
                                />
                                <SignatureStatus 
                                    isSigned={partnership.bridged_agreement_signed_by_athlete} 
                                    text={`Signed by Athlete (${partnership.athlete_name || 'N/A'})`}
                                    signatureDate={partnership.bridged_agreement_athlete_signed_date}
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                {isManager && !partnership.bridged_agreement_signed_by_company && (
                                    <Button 
                                        onClick={() => handleBridgedAgreementSign('company')} 
                                        disabled={updatePartnershipMutation.isPending && signingField === 'bridged_agreement_signed_by_company'}
                                    >
                                        {updatePartnershipMutation.isPending && signingField === 'bridged_agreement_signed_by_company' ? 
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Review & Sign as Company
                                    </Button>
                                )}
                                {currentUser.account_type === 'athlete' && !partnership.bridged_agreement_signed_by_athlete && (
                                    <Button 
                                        onClick={() => handleBridgedAgreementSign('athlete')} 
                                        disabled={updatePartnershipMutation.isPending && signingField === 'bridged_agreement_signed_by_athlete'}
                                    >
                                        {updatePartnershipMutation.isPending && signingField === 'bridged_agreement_signed_by_athlete' ? 
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Review & Sign as Athlete
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Internship-Specific Agreement</CardTitle>
                            <CardDescription>The official agreement outlining the specific terms of the internship, provided by the company.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isManager && !partnership.internship_agreement_url && (
                                <div className="flex items-center gap-2">
                                    <Input id="internship_agreement" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'internship_agreement_url')} />
                                    <Button asChild variant="outline" disabled={updatePartnershipMutation.isPending && uploadingFile === 'internship_agreement_url'}>
                                        <label htmlFor="internship_agreement" className="cursor-pointer flex items-center gap-2">
                                            {updatePartnershipMutation.isPending && uploadingFile === 'internship_agreement_url' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                                            {uploadingFile === 'internship_agreement_url' ? "Uploading..." : "Upload Agreement"}
                                        </label>
                                    </Button>
                                </div>
                            )}
                            {partnership.internship_agreement_url && <Button variant="secondary" asChild><a href={partnership.internship_agreement_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2"/>View Agreement</a></Button>}
                            <div className="space-y-2">
                                <SignatureStatus isSigned={partnership.internship_agreement_signed_by_company} text={`Signed by Company (${partnership.company_name || 'N/A'})`} />
                                <SignatureStatus isSigned={partnership.internship_agreement_signed_by_athlete} text={`Signed by Athlete (${partnership.athlete_name || 'N/A'})`} />
                            </div>
                            <div className="flex gap-4">
                                {isManager && !partnership.internship_agreement_signed_by_company && (
                                    <Button onClick={() => handleSignature('internship_agreement_signed_by_company')} disabled={!partnership.internship_agreement_url || (updatePartnershipMutation.isPending && signingField === 'internship_agreement_signed_by_company')}>
                                        {updatePartnershipMutation.isPending && signingField === 'internship_agreement_signed_by_company' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                        Sign as Company
                                    </Button>
                                )}
                                {currentUser.account_type === 'athlete' && !partnership.internship_agreement_signed_by_athlete && (
                                    <Button onClick={() => handleSignature('internship_agreement_signed_by_athlete')} disabled={!partnership.internship_agreement_url || (updatePartnershipMutation.isPending && signingField === 'internship_agreement_signed_by_athlete')}>
                                        {updatePartnershipMutation.isPending && signingField === 'internship_agreement_signed_by_athlete' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                        Sign as Athlete
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* School Credit Form - updated mutation usage */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">For-Credit Form (If Applicable)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm mb-4">If you are taking this internship for school credit, please have this form signed by the appropriate faculty member and upload it here.</p>
                             {isManager && (
                                <div className="flex items-center gap-2">
                                    <Input id="school_credit_form" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'school_credit_form_url')} />
                                    <Button asChild variant="outline" disabled={updatePartnershipMutation.isPending && uploadingFile === 'school_credit_form_url'}>
                                        <label htmlFor="school_credit_form" className="cursor-pointer flex items-center gap-2">
                                            {updatePartnershipMutation.isPending && uploadingFile === 'school_credit_form_url' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                                            {uploadingFile === 'school_credit_form_url' ? "Uploading..." : "Upload Form"}
                                        </label>
                                    </Button>
                                </div>
                            )}
                            {partnership.school_credit_form_url && <Button variant="secondary" asChild className="mt-2"><a href={partnership.school_credit_form_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2"/>View Uploaded Form</a></Button>}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>

            {/* Bridged Agreement Viewer Dialog */}
            <BridgedAgreementViewer
                open={showBridgedAgreement}
                onClose={() => setShowBridgedAgreement(false)}
                onAgree={confirmBridgedAgreement}
                userType={agreementUserType}
            />
        </Card>
    );
}
