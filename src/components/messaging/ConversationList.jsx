import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConversationListItem from './ConversationListItem';

export default function ConversationList({ conversations, isLoading, onSelectConversation, selectedConversationId, currentUser }) {
    return (
        <div className="w-full md:w-1/3 border-r border-[#E7E0DA] flex flex-col">
            <div className="p-4 border-b border-[#E7E0DA]">
                <h2 className="text-xl font-bold text-[#1C2E45]">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-2 space-y-2">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-2">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    conversations.map(conv => (
                        <ConversationListItem
                            key={conv.id}
                            conversation={conv}
                            onSelect={() => onSelectConversation(conv)}
                            isSelected={conv.id === selectedConversationId}
                            currentUser={currentUser}
                        />
                    ))
                )}
                 { !isLoading && conversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">You have no active conversations.</p>
                    </div>
                )}
            </div>
        </div>
    );
}