import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Paperclip } from 'lucide-react';

export default function MessageBubble({ message, currentUser }) {
    const isSender = message.sender_id === currentUser.id;
    const alignment = isSender ? 'justify-end' : 'justify-start';
    const bubbleColors = isSender
        ? 'bg-[#1C2E45] text-white'
        : 'bg-white text-[#2B2B2B] border border-[#E7E0DA]';

    return (
        <div className={`flex ${alignment} items-end`}>
            <div className={`max-w-md lg:max-w-lg rounded-2xl px-4 py-3 ${bubbleColors} shadow-sm`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.attachment_url && (
                    <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors ${isSender ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate font-medium">{message.attachment_name || 'View Attachment'}</span>
                    </a>
                )}
                <div className="flex items-center justify-end mt-1.5">
                    <p className={`text-xs ${isSender ? 'text-gray-300' : 'text-gray-500'}`}>
                        {format(new Date(message.created_date), 'p')}
                    </p>
                    {isSender && (
                        message.is_read 
                            ? <CheckCheck className="w-4 h-4 ml-1 text-blue-400" /> 
                            : <Check className="w-4 h-4 ml-1 text-gray-400" />
                    )}
                </div>
            </div>
        </div>
    );
}