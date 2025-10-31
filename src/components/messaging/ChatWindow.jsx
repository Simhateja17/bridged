import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Skeleton } from '../ui/skeleton';

export default function ChatWindow({ conversation, currentUser }) {
    const queryClient = useQueryClient();
    const otherParticipant = conversation.participant_details.find(p => p.user_id !== currentUser.id);
    const messagesEndRef = useRef(null);

    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages', conversation.id],
        queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date'),
        refetchInterval: 2000, // Poll for new messages
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (messageIds) => {
            // This is not atomic, but it's the best we can do without a bulk update endpoint
            for (const id of messageIds) {
                await base44.entities.Message.update(id, { is_read: true });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unreadCount', conversation.id] });
        }
    });

    useEffect(() => {
        // Scroll to the bottom when messages load or new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Mark messages as read when the chat window is opened/active
        const unreadMessageIds = messages
            ?.filter(msg => !msg.is_read && msg.sender_id !== currentUser.id)
            .map(msg => msg.id);

        if (unreadMessageIds?.length > 0) {
            markAsReadMutation.mutate(unreadMessageIds);
        }
    }, [messages, conversation.id, currentUser.id]);

    return (
        <div className="flex-1 flex flex-col bg-[#F8F5F2]">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-[#E7E0DA] bg-white shadow-sm">
                <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage src={otherParticipant?.user_photo_url} alt={otherParticipant?.user_name} />
                    <AvatarFallback>{otherParticipant?.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold text-[#1C2E45]">{otherParticipant?.user_name}</h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-3/4" />
                        <Skeleton className="h-16 w-3/4 ml-auto" />
                        <Skeleton className="h-12 w-1/2" />
                    </div>
                ) : (
                    messages?.map(msg => (
                        <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
                    ))
                )}
                 <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <MessageInput conversation={conversation} currentUser={currentUser} />
        </div>
    );
}