import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ConversationListItem({ conversation, onSelect, isSelected, currentUser }) {
    const otherParticipant = conversation.participant_details.find(p => p.user_id !== currentUser.id);
    const { data: unreadCount } = useQuery({
        queryKey: ['unreadCount', conversation.id, currentUser.id],
        queryFn: async () => {
            const messages = await base44.entities.Message.filter({
                conversation_id: conversation.id,
                is_read: false,
                sender_id: { op: '!=', value: currentUser.id }
            });
            return messages.length;
        },
        refetchInterval: 5000,
    });

    const lastMessageTimestamp = conversation.last_message_timestamp
        ? formatDistanceToNow(new Date(conversation.last_message_timestamp), { addSuffix: true })
        : '';
    
    const isLastMessageFromMe = conversation.last_message_sender_id === currentUser.id;

    return (
        <div
            onClick={onSelect}
            className={`flex items-start p-4 cursor-pointer border-b border-[#E7E0DA] transition-colors duration-150 ${
                isSelected ? 'bg-[#F8F5F2]' : 'hover:bg-[#F8F5F2]/50'
            }`}
        >
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={otherParticipant?.user_photo_url} alt={otherParticipant?.user_name} />
                <AvatarFallback>{otherParticipant?.user_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[#1C2E45] truncate">{otherParticipant?.user_name}</h3>
                    <p className="text-xs text-gray-500 flex-shrink-0">{lastMessageTimestamp}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-600 truncate">
                        {isLastMessageFromMe ? 'You: ' : ''}
                        {conversation.last_message_content || 'No messages yet...'}
                    </p>
                    {unreadCount > 0 && (
                        <Badge className="bg-[#946B56] text-white flex-shrink-0">{unreadCount}</Badge>
                    )}
                </div>
            </div>
        </div>
    );
}