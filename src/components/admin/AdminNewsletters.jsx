import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { sendBridgedEmail } from '@/components/emailUtils';
import { format } from 'date-fns';
import { Loader2, Calendar, Send, Clock, CheckCircle, Zap, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image'],
        ['clean']
    ],
};

export default function AdminNewsletters() {
    const queryClient = useQueryClient();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [canvaHtml, setCanvaHtml] = useState('');
    const [targetAudience, setTargetAudience] = useState('all_subscribers');
    const [scheduledDate, setScheduledDate] = useState('');
    const [useCanva, setUseCanva] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    const { data: pastNewsletters, isLoading: isLoadingNewsletters } = useQuery({
        queryKey: ['admin-newsletters'],
        queryFn: () => base44.entities.Newsletter.list('-created_date', 50),
    });

    const { data: scheduledNewsletters } = useQuery({
        queryKey: ['scheduled-newsletters'],
        queryFn: async () => {
            const all = await base44.entities.Newsletter.list('-scheduled_date');
            return all.filter(n => n.status === 'scheduled');
        },
    });

    // Get next Monday at 9 AM
    const getNextMonday9AM = () => {
        const now = new Date();
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
        nextMonday.setHours(9, 0, 0, 0);
        return nextMonday.toISOString().slice(0, 16);
    };

    const scheduleNewsletterMutation = useMutation({
        mutationFn: async ({ subject, body, targetAudience, scheduledDate }) => {
            return await base44.entities.Newsletter.create({
                subject: subject,
                body_html: body,
                target_audience: targetAudience,
                status: 'scheduled',
                scheduled_date: scheduledDate
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-newsletters'] });
            alert('Newsletter scheduled successfully! Click "Send Scheduled Newsletters" on Monday at 9 AM to send it.');
            setSubject('');
            setBody('');
            setCanvaHtml('');
            setScheduledDate('');
        },
        onError: (error) => {
            alert(`Failed to schedule newsletter: ${error.message}`);
        }
    });

    const sendScheduledMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('sendScheduledNewsletters');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-newsletters'] });
            setSendResult(data);
            setTimeout(() => setSendResult(null), 10000);
        },
        onError: (error) => {
            setSendResult({ success: false, error: error.message });
            setTimeout(() => setSendResult(null), 10000);
        }
    });

    const sendNowMutation = useMutation({
        mutationFn: async ({ subject, body, targetAudience }) => {
            let emailsToSend = new Set();

            if (targetAudience === 'all_subscribers') {
                const subscribedUsers = await base44.entities.User.filter({ is_newsletter_subscriber: true });
                subscribedUsers.forEach(user => emailsToSend.add(user.email));

                const guestSubscribers = await base44.entities.NewsletterSubscriber.list();
                guestSubscribers.forEach(sub => emailsToSend.add(sub.email));

            } else {
                const users = await base44.entities.User.filter({ account_type: targetAudience, is_newsletter_subscriber: true });
                users.forEach(user => emailsToSend.add(user.email));
            }
            
            for (const email of emailsToSend) {
                await sendBridgedEmail({
                    to: email,
                    subject: subject,
                    body: body,
                    eventType: 'newsletter'
                });
            }

            return await base44.entities.Newsletter.create({
                subject: subject,
                body_html: body,
                target_audience: targetAudience,
                status: 'sent',
                sent_date: new Date().toISOString(),
                recipient_count: emailsToSend.size
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
            queryClient.invalidateQueries({ queryKey: ['admin-email-logs'] });
            alert('Newsletter sent successfully!');
            setSubject('');
            setBody('');
            setCanvaHtml('');
        },
        onError: (error) => {
            alert(`Failed to send newsletter: ${error.message}`);
        }
    });

    const handleSchedule = () => {
        if (!subject || (!body && !canvaHtml)) {
            alert('Subject and content are required.');
            return;
        }
        if (!scheduledDate) {
            alert('Please select a scheduled date and time.');
            return;
        }
        const finalBody = useCanva ? canvaHtml : body;
        scheduleNewsletterMutation.mutate({ subject, body: finalBody, targetAudience, scheduledDate });
    };

    const handleSendNow = () => {
        if (!subject || (!body && !canvaHtml)) {
            alert('Subject and content are required.');
            return;
        }
        if (window.confirm(`Send newsletter immediately to ${audienceLabels[targetAudience]}?`)) {
            const finalBody = useCanva ? canvaHtml : body;
            sendNowMutation.mutate({ subject, body: finalBody, targetAudience });
        }
    };

    const audienceLabels = {
        all_subscribers: "All Subscribers",
        athlete: "Athletes Only",
        company: "Companies Only"
    };

    const getAudienceLabel = (audienceKey) => {
        return audienceLabels[audienceKey] || audienceKey;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl admin-dashboard-heading-font text-[#1A2238]">Weekly Newsletter Manager</h2>
                
                {scheduledNewsletters && scheduledNewsletters.length > 0 && (
                    <Button
                        size="lg"
                        onClick={() => sendScheduledMutation.mutate()}
                        disabled={sendScheduledMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg admin-button"
                    >
                        {sendScheduledMutation.isPending ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                        ) : (
                            <><Zap className="w-5 h-5 mr-2" /> Send Scheduled Newsletters ({scheduledNewsletters.length})</>
                        )}
                    </Button>
                )}
            </div>

            {/* Send Result Alert */}
            {sendResult && (
                <Alert className={`mb-6 ${sendResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <AlertDescription className="flex items-start gap-3">
                        {sendResult.success ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-900">✅ Newsletters Sent Successfully!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {sendResult.newsletters_sent} newsletter(s) sent to subscribers.
                                    </p>
                                    {sendResult.results && sendResult.results.length > 0 && (
                                        <ul className="text-xs text-green-600 mt-2 space-y-1">
                                            {sendResult.results.map((result, idx) => (
                                                <li key={idx}>
                                                    • {result.subject}: {result.recipients} recipients
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-900">❌ Error Sending Newsletters</p>
                                    <p className="text-sm text-red-700 mt-1">{sendResult.error || 'An unknown error occurred'}</p>
                                </div>
                            </>
                        )}
                    </AlertDescription>
                </Alert>
            )}
            
            {/* Scheduled Newsletters Preview */}
            {scheduledNewsletters && scheduledNewsletters.length > 0 && (
                <Card className="mb-8 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Clock className="w-5 h-5" />
                            Upcoming Scheduled Newsletters
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                            These will be sent when you click "Send Scheduled Newsletters" above
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {scheduledNewsletters.map(nl => (
                            <div key={nl.id} className="bg-white p-4 rounded-lg mb-2 border border-blue-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{nl.subject}</p>
                                        <p className="text-sm text-gray-600">
                                            Scheduled for: <strong>{format(new Date(nl.scheduled_date), 'PPpp')}</strong>
                                        </p>
                                        <p className="text-xs text-gray-500">Target: {getAudienceLabel(nl.target_audience)}</p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Ready to Send</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Composer */}
                <div className="lg:col-span-3">
                    <Card className="bg-white shadow-sm border border-gray-100">
                        <CardHeader>
                            <CardTitle className="admin-dashboard-heading-font text-2xl">Create Newsletter</CardTitle>
                            <CardDescription>Design your weekly newsletter to send every Monday at 9 AM</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="font-bold">Subject Line</Label>
                                <Input 
                                    value={subject} 
                                    onChange={e => setSubject(e.target.value)} 
                                    placeholder="Weekly Bridged Newsletter - [Date]"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label className="font-bold">Content Source</Label>
                                <div className="flex gap-4 mt-2">
                                    <Button
                                        type="button"
                                        variant={!useCanva ? "default" : "outline"}
                                        onClick={() => setUseCanva(false)}
                                    >
                                        Rich Text Editor
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={useCanva ? "default" : "outline"}
                                        onClick={() => setUseCanva(true)}
                                    >
                                        Paste Canva HTML
                                    </Button>
                                </div>
                            </div>

                            {useCanva ? (
                                <div>
                                    <Label className="font-bold">Canva HTML Code</Label>
                                    <Textarea
                                        value={canvaHtml}
                                        onChange={e => setCanvaHtml(e.target.value)}
                                        placeholder="Paste your Canva HTML export here..."
                                        className="mt-1 font-mono text-sm"
                                        rows={15}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        In Canva: Share → Download → More options → HTML → Copy code and paste here
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <Label className="font-bold">Newsletter Body</Label>
                                    <ReactQuill 
                                        theme="snow" 
                                        value={body} 
                                        onChange={setBody}
                                        modules={quillModules}
                                        className="mt-1 bg-white"
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="font-bold">Target Audience</Label>
                                <Select value={targetAudience} onValueChange={setTargetAudience}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_subscribers">All Subscribers</SelectItem>
                                        <SelectItem value="athlete">Athletes Only</SelectItem>
                                        <SelectItem value="company">Companies Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="font-bold">Schedule for Monday 9 AM</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        type="datetime-local"
                                        value={scheduledDate}
                                        onChange={e => setScheduledDate(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setScheduledDate(getNextMonday9AM())}
                                    >
                                        Next Monday
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Set to next Monday at 9:00 AM, or choose a custom date/time
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    onClick={handleSchedule} 
                                    disabled={scheduleNewsletterMutation.isPending}
                                    className="flex-1 bg-[#1C2E45] hover:bg-[#2A3F5F] admin-button text-lg py-6"
                                >
                                    {scheduleNewsletterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Schedule Newsletter
                                </Button>
                                <Button 
                                    onClick={handleSendNow} 
                                    disabled={sendNowMutation.isPending}
                                    variant="outline"
                                    className="admin-button"
                                >
                                    {sendNowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History */}
                <div className="lg:col-span-2">
                     <Card className="bg-white shadow-sm border border-gray-100">
                        <CardHeader>
                            <CardTitle className="admin-dashboard-heading-font text-2xl">Sent History</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[600px] overflow-y-auto">
                            {isLoadingNewsletters ? <p>Loading history...</p> : (
                                <ul className="space-y-4">
                                    {pastNewsletters?.filter(n => n.status === 'sent').map(nl => (
                                        <li key={nl.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="font-bold text-gray-800">{nl.subject}</p>
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Sent to {getAudienceLabel(nl.target_audience)} on {format(new Date(nl.sent_date || nl.created_date), 'PPp')}
                                            </p>
                                            {nl.recipient_count && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {nl.recipient_count} recipients
                                                </p>
                                            )}
                                            <details className="mt-2 text-xs">
                                                <summary className="cursor-pointer text-blue-600">Show Content</summary>
                                                <div 
                                                    className="mt-2 p-2 border rounded bg-white text-gray-700 max-h-48 overflow-auto" 
                                                    dangerouslySetInnerHTML={{ __html: nl.body_html }} 
                                                />
                                            </details>
                                        </li>
                                    ))}
                                    {pastNewsletters?.filter(n => n.status === 'sent').length === 0 && <p className="text-gray-500">No newsletters have been sent yet.</p>}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Guide */}
            <Card className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-900">
                        <Clock className="w-5 h-5" />
                        📬 How to Send Weekly Newsletters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3">
                        <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                        <p className="text-gray-700"><strong>Sunday Night:</strong> Create your newsletter using Canva or the rich text editor</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                        <p className="text-gray-700"><strong>Click "Next Monday"</strong> button to schedule it for Monday 9 AM</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                        <p className="text-gray-700"><strong>Click "Schedule Newsletter"</strong> to save it</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">4</div>
                        <p className="text-gray-700"><strong>Monday 9 AM:</strong> Come back here and click the big green <strong>"Send Scheduled Newsletters"</strong> button at the top</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-yellow-200 mt-4">
                        <p className="text-sm text-gray-600">
                            💡 <strong>Pro Tip:</strong> You can schedule multiple newsletters in advance. They'll all show in the "Upcoming" section and get sent when you click the button!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}