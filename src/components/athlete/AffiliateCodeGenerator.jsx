import { base44 } from '@/api/base44Client';

/**
 * Generates a unique sub-code for an athlete-company affiliate partnership
 * Format: {athletePreferredCode}-{companyShort}
 * Example: NATALIA10-SALT
 */
export async function generateUniqueSubCode(mainCampaignCode, athletePreferredAlias, campaignId) {
    // Clean and format the athlete alias
    const cleanAlias = athletePreferredAlias.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Extract company short name from main code (first part before any delimiter)
    const companyShort = mainCampaignCode.split(/[-_]/)[0].toUpperCase();
    
    // Generate base code
    let baseCode = `${cleanAlias}-${companyShort}`;
    let finalCode = baseCode;
    let attempt = 0;
    
    // Check for uniqueness across ALL affiliate partnerships
    while (true) {
        const existing = await base44.entities.AffiliatePartnership.filter({ 
            generated_sub_code: finalCode 
        });
        
        if (existing.length === 0) {
            // Code is unique!
            return finalCode;
        }
        
        // Code exists, try with a number suffix
        attempt++;
        finalCode = `${baseCode}${attempt}`;
        
        // Safety limit
        if (attempt > 100) {
            throw new Error('Unable to generate unique affiliate code after 100 attempts');
        }
    }
}

/**
 * Validates if a preferred affiliate code is unique across all athletes
 */
export async function isPreferredCodeUnique(preferredCode) {
    if (!preferredCode) return false;
    
    const cleanCode = preferredCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Check against all users' preferred codes
    const existingUsers = await base44.entities.User.filter({ 
        affiliate_code_suggestion: cleanCode 
    });
    
    return existingUsers.length === 0;
}

/**
 * Suggests alternative codes if the preferred one is taken
 */
export async function suggestAlternativeCodes(baseCode, count = 3) {
    const suggestions = [];
    const cleanBase = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    for (let i = 1; i <= count; i++) {
        const suggestion = `${cleanBase}${i}`;
        const isUnique = await isPreferredCodeUnique(suggestion);
        if (isUnique) {
            suggestions.push(suggestion);
        }
    }
    
    // Add random number suggestions
    for (let i = 0; i < count - suggestions.length; i++) {
        const randomNum = Math.floor(Math.random() * 1000);
        const suggestion = `${cleanBase}${randomNum}`;
        const isUnique = await isPreferredCodeUnique(suggestion);
        if (isUnique) {
            suggestions.push(suggestion);
        }
    }
    
    return suggestions;
}