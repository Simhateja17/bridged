import { base44 } from '@/api/base44Client';

/**
 * Utility functions to create notifications for various platform events
 */

export async function createNotification({ userEmail, title, message, type }) {
    try {
        await base44.entities.Notification.create({
            user_email: userEmail,
            title,
            message,
            type,
            is_read: false
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

export async function notifyApplicationReceived(application, job) {
    // Notify the company
    const company = await base44.entities.Company.filter({ id: application.company_id }).then(res => res[0]);
    if (company) {
        await createNotification({
            userEmail: company.contact_email,
            title: 'New Application Received',
            message: `${application.athlete_name} has applied for ${job.title}`,
            type: 'application_received'
        });
    }
}

export async function notifyPartnershipCreated(partnership) {
    // Notify athlete
    const athlete = await base44.entities.User.filter({ id: partnership.athlete_id }).then(res => res[0]);
    if (athlete) {
        await createNotification({
            userEmail: athlete.email,
            title: 'Partnership Created',
            message: `Your partnership with ${partnership.company_name} has been created. Complete your onboarding steps to get started.`,
            type: 'partnership_created'
        });
    }

    // Notify company
    const company = await base44.entities.Company.filter({ id: partnership.company_id }).then(res => res[0]);
    if (company) {
        await createNotification({
            userEmail: company.contact_email,
            title: 'Partnership Created',
            message: `Your partnership with ${partnership.athlete_name} has been created. Begin the onboarding process.`,
            type: 'partnership_created'
        });
    }
}

export async function notifyDeliverableSubmitted(deliverable, partnership) {
    // Notify company
    const company = await base44.entities.Company.filter({ id: partnership.company_id }).then(res => res[0]);
    if (company) {
        await createNotification({
            userEmail: company.contact_email,
            title: 'Deliverable Submitted',
            message: `${partnership.athlete_name} has submitted a deliverable: ${deliverable.title}`,
            type: 'deliverable_uploaded'
        });
    }
}

export async function notifyCompanyApproved(company) {
    await createNotification({
        userEmail: company.contact_email,
        title: 'Company Approved!',
        message: 'Your company profile has been verified and approved. You can now post jobs and create partnerships.',
        type: 'company_approved'
    });
}

export async function notifyAthleteVerified(athlete) {
    await createNotification({
        userEmail: athlete.email,
        title: 'Profile Verified!',
        message: 'Your athlete profile has been verified. You can now apply for opportunities and partnerships.',
        type: 'company_approved'
    });
}