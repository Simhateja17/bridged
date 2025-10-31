export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

// Re-export email utilities for convenience
export { sendBridgedEmail } from '@/components/emailUtils';