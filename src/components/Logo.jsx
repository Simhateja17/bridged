import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Renders the Bridged application logo.
 * @param {{
 *  size?: 'default' | 'small',
 *  textClassName?: string
 * }} props
 * - `size`: 'default' for the main nav bar, 'small' for the footer.
 * - `textClassName`: Optional classes to apply to the "Bridged" text.
 */
export default function Logo({ size = 'default', textClassName = "text-white" }) {
    const isDefault = size === 'default';
    const containerSize = isDefault ? 'w-10 h-10' : 'w-8 h-8';
    const imageSize = isDefault ? 'w-7 h-7' : 'w-5 h-5';

    return (
        <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
            {/* App-style icon container */}
            <div className={`${containerSize} bg-gradient-to-br from-[#1C2E45] via-[#2A3F5F] to-[#3A4F6F] rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f05187ddeac353e5298844/3ab882a22_BridgedLogo.png"
                    alt="Bridged Logo"
                    className={`${imageSize} w-auto`}
                />
            </div>
            <span className={`font-bold tracking-tight heading-font ${isDefault ? 'text-2xl' : 'text-xl'} ${textClassName}`}>
                Bridged
            </span>
        </Link>
    );
}