import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import { MessageSquare, Loader2 } from 'lucide-react';
import SubscriptionGate from '@/components/auth/SubscriptionGate';
import { useSearchParams } from 'react-router-dom';

export default function Messages() {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchParams] = useSearchParams();
    const conversationIdFromUrl = searchParams.get('conversation_id');

    useEffect(() => {
        const fetchUser = async () => {
            const user = await base44.auth.me();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if(conversationIdFromUrl) {
            // Logic to fetch and set the selected conversation based on ID from URL
            const fetchConversation = async () => {
                const conversation = await base44.entities.Conversation.get(conversationIdFromUrl);
                setSelectedConversation(conversation);
            }
            fetchConversation();
        }
    }, [conversationIdFromUrl]);

    const { data: conversations, isLoading: conversationsLoading } = useQuery({
        queryKey: ['conversations', currentUser?.id],
        queryFn: () => currentUser ? base44.entities.Conversation.filter({ participant_ids: { op: 'in', value: [currentUser.id] } }, '-last_message_timestamp') : [],
        enabled: !!currentUser,
        refetchInterval: 5000, // Poll for new conversations or updates
    });

    return (
        <SubscriptionGate>
            <div className="min-h-screen bg-[#F8F5F2]">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex h-[calc(100vh-12rem)] border border-[#E7E0DA] bg-white rounded-2xl shadow-lg overflow-hidden">
                        <ConversationList
                            conversations={conversations || []}
                            isLoading={conversationsLoading}
                            onSelectConversation={setSelectedConversation}
                            selectedConversationId={selectedConversation?.id}
                            currentUser={currentUser}
                        />
                        
                        {selectedConversation && currentUser ? (
                            <ChatWindow
                                key={selectedConversation.id}
                                conversation={selectedConversation}
                                currentUser={currentUser}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 bg-[#F8F5F2]">
                                {conversationsLoading ? <Loader2 className="w-16 h-16 text-gray-300 animate-spin" /> : <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />}
                                <h2 className="text-2xl font-bold text-[#1C2E45]">
                                    {conversationsLoading ? 'Loading Conversations...' : 'Select a conversation'}
                                </h2>
                                {!conversationsLoading && <p className="text-medium">Choose a chat from the left to start messaging.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SubscriptionGate>
    );
}