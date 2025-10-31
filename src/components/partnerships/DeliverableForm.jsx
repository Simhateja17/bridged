import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DeliverableForm = ({ partnership, deliverable, onDone }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        week_number: '',
        title: '',
        description: '',
        due_date: '',
        meeting_link: '',
        submission_type: ''
    });

    useEffect(() => {
        if (deliverable) {
            setFormData({
                week_number: deliverable.week_number || '',
                title: deliverable.title || '',
                description: deliverable.description || '',
                due_date: deliverable.due_date ? format(new Date(deliverable.due_date), 'yyyy-MM-dd') : '',
                meeting_link: deliverable.meeting_link || '',
                submission_type: deliverable.submission_type || ''
            });
        } else {
            // Reset form for new deliverable
             setFormData({
                week_number: '',
                title: '',
                description: '',
                due_date: '',
                meeting_link: '',
                submission_type: ''
            });
        }
    }, [deliverable]);


    const mutation = useMutation({
        mutationFn: (data) => {
            if (deliverable) {
                return base44.entities.Deliverable.update(deliverable.id, data);
            }
            const payload = { ...data, partnership_id: partnership.id, status: 'Not Started' };
            return base44.entities.Deliverable.create(payload);
        },
        onSuccess: () => {
            toast.success(`Deliverable ${deliverable ? 'updated' : 'created'}!`);
            queryClient.invalidateQueries({ queryKey: ['deliverables', partnership.id] });
            onDone();
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Card className="my-4 bg-white border-[#E7E0DA]">
            <CardHeader><CardTitle className="text-[#1A2238]">{deliverable ? 'Edit' : 'Add'} Deliverable</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="week_number" type="number" placeholder="Week Number" value={formData.week_number} onChange={handleChange} required />
                    <Input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
                    <Textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
                        <Select name="submission_type" value={formData.submission_type} onValueChange={(value) => handleSelectChange('submission_type', value)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Submission Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="link">Link/URL Submission</SelectItem>
                                <SelectItem value="file">File Upload</SelectItem>
                                <SelectItem value="text">Text Description Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Input name="meeting_link" placeholder="Optional Meeting Link" value={formData.meeting_link} onChange={handleChange} />
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : (deliverable ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default DeliverableForm;