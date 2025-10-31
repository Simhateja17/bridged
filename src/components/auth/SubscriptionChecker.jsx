import { base44 } from '@/api/base44Client';

/**
 * Check if a company has an active subscription
 */
export async function hasActiveSubscription(companyId) {
    try {
        const subscriptions = await base44.entities.CompanySubscription.filter({ 
            company_id: companyId,
            status: 'active'
        });
        
        if (subscriptions.length === 0) return false;
        
        const sub = subscriptions[0];
        const periodEnd = new Date(sub.current_period_end);
        const now = new Date();
        
        return periodEnd > now;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

/**
 * Get subscription status for a company
 */
export async function getSubscriptionStatus(companyId) {
    try {
        const subscriptions = await base44.entities.CompanySubscription.filter({ 
            company_id: companyId 
        });
        
        if (subscriptions.length === 0) {
            return { hasSubscription: false, status: 'none' };
        }
        
        const sub = subscriptions[0];
        const periodEnd = new Date(sub.current_period_end);
        const now = new Date();
        
        return {
            hasSubscription: true,
            status: sub.status,
            isActive: sub.status === 'active' && periodEnd > now,
            currentPeriodEnd: sub.current_period_end
        };
    } catch (error) {
        console.error('Error getting subscription status:', error);
        return { hasSubscription: false, status: 'error' };
    }
}