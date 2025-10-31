
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2, CheckCircle, Loader2, Upload, Link as LinkIcon, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import DeliverableForm from './DeliverableForm';
import { createNotification } from '../notificationUtils'; // Added import

const statusColors = {
  "Not Started": "bg-gray-200 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Completed": "bg-yellow-100 text-yellow-800",
  "Approved": "bg-green-100 text-green-800",
  "Needs Revision": "bg-orange-100 text-orange-800"
};

// DeliverableSubmissionForm component has been refactored into DeliverablesManager
// as its state management and mutations are now centralized there.
// Therefore, the import for DeliverableSubmissionForm is no longer needed.

export default function DeliverablesManager({ partnership, userRole }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingDeliverable, setEditingDeliverable] = useState(null);

    // New state for managing the submission dialog
    const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
    const [selectedDeliverableForSubmission, setSelectedDeliverableForSubmission] = useState(null);
    const [currentSubmissionNotes, setCurrentSubmissionNotes] = useState('');
    const [currentSubmissionUrl, setCurrentSubmissionUrl] = useState('');
    const [currentSubmissionFile, setCurrentSubmissionFile] = useState(null);
    const [isSubmissionUploading, setIsSubmissionUploading] = useState(false);

    // New state for managing the feedback dialog
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    const [selectedDeliverableForFeedback, setSelectedDeliverableForFeedback] = useState(null);
    const [feedbackInput, setFeedbackInput] = useState('');

    // Effect to pre-fill submission form if a deliverable is selected for submission
    useEffect(() => {
        if (selectedDeliverableForSubmission) {
            setCurrentSubmissionNotes(selectedDeliverableForSubmission.submission_notes || '');
            setCurrentSubmissionUrl(selectedDeliverableForSubmission.submission_url || '');
            setCurrentSubmissionFile(null); // Clear file input when opening for a new deliverable
        } else {
            setCurrentSubmissionNotes('');
            setCurrentSubmissionUrl('');
            setCurrentSubmissionFile(null);
        }
    }, [selectedDeliverableForSubmission]);

    const { data: deliverables, isLoading } = useQuery({
        queryKey: ['deliverables', partnership.id],
        queryFn: () => base44.entities.Deliverable.filter({ partnership_id: partnership.id }, 'week_number'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Deliverable.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliverables', partnership.id] });
            toast.success("Status updated!");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Deliverable.delete(id),
        onSuccess: () => {
            toast.success("Deliverable deleted.");
            queryClient.invalidateQueries({ queryKey: ['deliverables', partnership.id] });
        }
    });

    // New mutation for submitting deliverables, as per outline
    const submitDeliverableMutation = useMutation({
        mutationFn: ({ deliverableId, data }) => base44.entities.Deliverable.update(deliverableId, data),
        onSuccess: async (updatedDeliverable) => {
            queryClient.invalidateQueries(['deliverables', partnership.id]);
            setIsSubmissionFormOpen(false);
            setSelectedDeliverableForSubmission(null);
            setCurrentSubmissionNotes('');
            setCurrentSubmissionUrl('');
            setCurrentSubmissionFile(null);
            setIsSubmissionUploading(false);

            // Create notification for company
            await createNotification({
                userEmail: (await base44.entities.Company.filter({ id: partnership.company_id }).then(res => res[0]))?.contact_email,
                title: 'Deliverable Submitted',
                message: `${partnership.athlete_name} has submitted: ${updatedDeliverable.title}`,
                type: 'deliverable_uploaded'
            });
            toast.success("Work submitted successfully!");
        },
        onError: (err) => {
            toast.error(`Submission failed: ${err.message}`);
            setIsSubmissionUploading(false);
        }
    });
    
    // New mutation for providing feedback, as per outline
    const provideFeedbackMutation = useMutation({
        mutationFn: ({ deliverableId, feedback, status }) =>
            base44.entities.Deliverable.update(deliverableId, { feedback, status }),
        onSuccess: async (updatedDeliverable) => {
            queryClient.invalidateQueries(['deliverables', partnership.id]);
            setIsFeedbackDialogOpen(false);
            setSelectedDeliverableForFeedback(null);
            setFeedbackInput('');

            // Create notification for athlete
            await createNotification({
                userEmail: (await base44.entities.User.filter({ id: partnership.athlete_id }).then(res => res[0]))?.email,
                title: 'Deliverable Feedback',
                message: `Your deliverable "${updatedDeliverable.title}" has been reviewed: ${updatedDeliverable.status}`,
                type: 'deliverable_uploaded'
            });
            toast.success("Feedback sent and status updated to 'Needs Revision'.");
        },
        onError: (err) => toast.error(`Error sending feedback: ${err.message}`)
    });

    // Handle submission logic (extracted from the old DeliverableSubmissionForm component)
    const handleSubmission = async (e) => {
        e.preventDefault();
        if (!selectedDeliverableForSubmission) return;

        let finalSubmissionUrl = currentSubmissionUrl;

        if (selectedDeliverableForSubmission.submission_type === 'file') {
            if (!currentSubmissionFile && !selectedDeliverableForSubmission.submission_url) {
                toast.error("A file upload is required for this deliverable.");
                return;
            }
            if (currentSubmissionFile) {
                setIsSubmissionUploading(true);
                try {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file: currentSubmissionFile });
                    finalSubmissionUrl = file_url;
                } catch (error) {
                    toast.error("File upload failed. Please try again.");
                    setIsSubmissionUploading(false);
                    return;
                }
                setIsSubmissionUploading(false);
            } else {
                // If no new file is uploaded, retain the existing submission_url
                finalSubmissionUrl = selectedDeliverableForSubmission.submission_url;
            }
        } else if (selectedDeliverableForSubmission.submission_type === 'link') {
            if (!currentSubmissionUrl) {
                toast.error("A URL is required for this deliverable.");
                return;
            }
        }
        
        submitDeliverableMutation.mutate({
            deliverableId: selectedDeliverableForSubmission.id,
            data: {
                submission_url: finalSubmissionUrl,
                submission_notes: currentSubmissionNotes,
                status: 'Completed'
            }
        });
    };

    // Handle feedback submission logic
    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        if (!selectedDeliverableForFeedback || !feedbackInput.trim()) {
            toast.error("Feedback cannot be empty.");
            return;
        }
        provideFeedbackMutation.mutate({
            deliverableId: selectedDeliverableForFeedback.id,
            feedback: feedbackInput.trim(),
            status: 'Needs Revision'
        });
    };

    const canManage = userRole === 'admin' || userRole === 'company';
    const canSubmit = userRole === 'athlete' || userRole === 'admin';

    if (isLoading) return <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#1C2E45]">Weekly Deliverables</h2>
                {canManage && (
                    <Button onClick={() => { setShowForm(true); setEditingDeliverable(null); }} className="bg-[#1A2238] text-white hover:bg-[#946B56]">
                        <PlusCircle className="mr-2" /> Add Deliverable
                    </Button>
                )}
            </div>

            {showForm && canManage && <DeliverableForm partnership={partnership} deliverable={editingDeliverable} onDone={() => { setShowForm(false); setEditingDeliverable(null); }} />}
            
            <Accordion type="single" collapsible className="w-full space-y-4">
                 {deliverables?.map(d => (
                     <AccordionItem value={d.id} key={d.id} className="bg-white border border-[#E7E0DA] rounded-xl shadow-sm">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex-1 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-sm text-gray-500">Week {d.week_number}</p>
                                    <p className="font-bold text-lg text-[#1C2E45]">{d.title}</p>
                                </div>
                                <Badge className={`${statusColors[d.status]} py-1 px-3 text-sm`}>{d.status}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-6">
                            <div>
                                <p className="text-gray-700 font-medium">{d.description}</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-2">
                                    <span><strong>Due:</strong> {format(new Date(d.due_date), 'MMM dd, yyyy')}</span>
                                    <span><strong>Submission:</strong> <Badge variant="outline">{d.submission_type}</Badge></span>
                                    {d.meeting_link && <a href={d.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Meeting Link</a>}
                                </div>
                            </div>

                            {(d.status !== 'Not Started' && d.submission_notes) && (
                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-md text-[#1C2E45] mb-2">Athlete's Submission</h4>
                                    {d.submission_url && (
                                        <a href={d.submission_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 mb-2">
                                            <LinkIcon className="w-4 h-4" /> View Submitted {d.submission_type === 'file' ? 'File' : 'Link'}
                                        </a>
                                    )}
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md border">{d.submission_notes}</p>
                                </div>
                            )}

                            {(d.status === 'Needs Revision' || d.status === 'Approved') && d.feedback && (
                                <div className="border-t pt-4">
                                     <h4 className="font-bold text-md text-[#1C2E45] mb-2">Company Feedback</h4>
                                     <p className="text-gray-600 bg-orange-50 p-3 rounded-md border border-orange-200">{d.feedback}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 items-center justify-between text-sm border-t pt-4">
                                <div className="flex items-center gap-2">
                                     {canSubmit && (d.status === 'Not Started' || d.status === 'Needs Revision') && (
                                         <Button
                                            onClick={() => {
                                                setSelectedDeliverableForSubmission(d);
                                                setIsSubmissionFormOpen(true);
                                            }}
                                            className="bg-[#1A2238] text-white hover:bg-[#946B56]"
                                         >
                                            <Send className="mr-2 h-4 w-4" />
                                            {d.status === 'Needs Revision' ? 'Resubmit Work' : 'Submit Work'}
                                         </Button>
                                     )}

                                     {canManage && (
                                        <div className="flex items-center gap-2">
                                            <Select value={d.status} onValueChange={(status) => {
                                                // Only allow status updates that are not 'Needs Revision' from this select.
                                                // 'Needs Revision' is handled via the separate feedback mechanism.
                                                if(status !== 'Needs Revision') updateStatusMutation.mutate({ id: d.id, status })}
                                            }>
                                                <SelectTrigger className="w-[180px] h-9">
                                                    <SelectValue placeholder="Update status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { setEditingDeliverable(d); setShowForm(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => deleteMutation.mutate(d.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                     )}
                                </div>
                            </div>
                            
                            {canManage && d.status === 'Completed' && (
                                <div className="border-t pt-4">
                                    <label className="font-bold text-md text-[#1C2E45]">Provide Feedback for Revision</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="ml-2"
                                        onClick={() => {
                                            setSelectedDeliverableForFeedback(d);
                                            setFeedbackInput(d.feedback || ''); // Pre-fill if existing feedback
                                            setIsFeedbackDialogOpen(true);
                                        }}
                                    >
                                        <Send className="mr-2 h-4 w-4" /> Request Revision
                                    </Button>
                                </div>
                            )}
                        </AccordionContent>
                     </AccordionItem>
                 ))}
            </Accordion>
            {deliverables?.length === 0 && <p className="text-center text-gray-500 mt-8">No deliverables assigned yet.</p>}

            {/* Submission Dialog - This now replaces the external DeliverableSubmissionForm component */}
            <Dialog open={isSubmissionFormOpen} onOpenChange={setIsSubmissionFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit: {selectedDeliverableForSubmission?.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmission} className="space-y-4 py-4">
                        {selectedDeliverableForSubmission?.submission_type === 'link' && (
                            <div>
                                <label className="font-medium">Submission Link</label>
                                <Input
                                    type="url"
                                    placeholder="https://example.com/proof"
                                    value={currentSubmissionUrl}
                                    onChange={(e) => setCurrentSubmissionUrl(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                        )}
                        {selectedDeliverableForSubmission?.submission_type === 'file' && (
                            <div>
                                <label className="font-medium">File Upload</label>
                                <Input
                                    type="file"
                                    onChange={(e) => setCurrentSubmissionFile(e.target.files[0])}
                                    required={!selectedDeliverableForSubmission?.submission_url && !currentSubmissionFile}
                                    className="mt-1"
                                />
                                {selectedDeliverableForSubmission?.submission_url && !currentSubmissionFile && <p className="text-xs text-gray-500 mt-1">Current file: <a href={selectedDeliverableForSubmission.submission_url} target="_blank" rel="noreferrer" className="text-blue-600">View</a>. Upload a new file to replace it.</p>}
                                {currentSubmissionFile && <p className="text-xs text-gray-500 mt-1">New file selected: {currentSubmissionFile.name}</p>}
                            </div>
                        )}
                        <div>
                            <label className="font-medium">Notes / Description</label>
                            <Textarea
                                placeholder="Describe the work you completed..."
                                value={currentSubmissionNotes}
                                onChange={(e) => setCurrentSubmissionNotes(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsSubmissionFormOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitDeliverableMutation.isPending || isSubmissionUploading}>
                                {(submitDeliverableMutation.isPending || isSubmissionUploading) ? <Loader2 className="animate-spin" /> : 'Submit for Review'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Provide Feedback for: {selectedDeliverableForFeedback?.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4 py-4">
                        <div>
                            <label className="font-medium">Feedback Notes</label>
                            <Textarea
                                placeholder="Explain what needs to be changed..."
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsFeedbackDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={provideFeedbackMutation.isPending}>
                                {provideFeedbackMutation.isPending ? <Loader2 className="animate-spin" /> : 'Request Revision'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
