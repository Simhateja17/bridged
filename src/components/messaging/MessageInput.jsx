import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MessageInput({ conversation, currentUser }) {
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);

    const sendMessageMutation = useMutation({
        mutationFn: (newMessage) => base44.entities.Message.create(newMessage),
        onSuccess: (newMessage) => {
            // After sending message, update the parent conversation
            return base44.entities.Conversation.update(conversation.id, {
                last_message_content: newMessage.content || 'File attached',
                last_message_sender_id: currentUser.id,
                last_message_timestamp: new Date().toISOString()
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !file) return;

        let attachment_url = null;
        let attachment_name = null;

        if (file) {
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                attachment_url = file_url;
                attachment_name = file.name;
            } catch (error) {
                toast.error("File upload failed. Please try again.");
                console.error("File upload error:", error);
                return;
            }
        }

        const messageData = {
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content: content.trim(),
            attachment_url,
            attachment_name
        };

        sendMessageMutation.mutate(messageData);

        setContent('');
        setFile(null);
    };

    return (
        <div className="p-4 bg-white border-t border-[#E7E0DA]">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                 <label htmlFor="file-upload" className="cursor-pointer">
                    <Paperclip className="w-6 h-6 text-gray-500 hover:text-[#1C2E45] transition-colors" />
                </label>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                
                <div className="flex-1 relative">
                    <Input
                        placeholder="Type your message..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="h-12 pr-12"
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-[#1C2E45] hover:bg-[#2A3F5F]">
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </form>
             {file && (
                <div className="mt-2 flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-6 w-6">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}