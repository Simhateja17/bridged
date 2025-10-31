
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Building, User, Briefcase, Handshake, Bell, Settings, LogOut, MessageSquare, FileText, Camera, Mail, Target, ShieldCheck } from 'lucide-react';
import AdminOverview from '../components/admin/AdminOverview';
import AdminCompanies from '../components/admin/AdminCompanies';
import AdminAthletes from '../components/admin/AdminAthletes';
import AdminJobs from '../components/admin/AdminJobs';
import AdminPartnerships from '../components/admin/AdminPartnerships';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminSettings from '../components/admin/AdminSettings';
import AdminMessages from '../components/admin/AdminMessages';
import AdminContentProposals from '../components/admin/AdminContentProposals';
import AdminContentPartnerships from '../components/admin/AdminContentPartnerships';
import AdminModelList from '../components/admin/AdminModelList';
import AdminNewsletters from '../components/admin/AdminNewsletters';
import AdminAffiliatePrograms from '../components/admin/AdminAffiliatePrograms';
import AdminVerificationQueue from '../components/admin/AdminVerificationQueue';
import AdminPartnershipApplications from '../components/admin/AdminPartnershipApplications';


const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'companies', label: 'Companies', icon: Building },
    { id: 'athletes', label: 'Athletes', icon: User },
    { id: 'jobs', label: 'Jobs & Applications', icon: Briefcase },
    { id: 'partnerships', label: 'Internships', icon: Handshake },
    { id: 'partnership-applications', label: 'Partnership Applications', icon: FileText }, // Added new nav item
    { id: 'affiliate-programs', label: 'Affiliate Programs', icon: Target },
    { id: 'content-partnerships', label: 'Content Partnerships', icon: Camera },
    { id: 'model-list', label: 'Model List', icon: User },
    { id: 'content', label: 'Content Proposals', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'newsletters', label: 'Newsletters', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                if (currentUser && currentUser.role === 'admin') {
                    setUser(currentUser);
                } else {
                    window.location.href = createPageUrl('Home');
                }
            } catch (error) {
                window.location.href = createPageUrl('Home');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <AdminOverview setActiveTab={setActiveTab} />;
            case 'verification':
                return <AdminVerificationQueue />;
            case 'companies':
                return <AdminCompanies />;
            case 'athletes':
                return <AdminAthletes />;
            case 'jobs':
                return <AdminJobs />;
            case 'partnerships':
                return <AdminPartnerships />;
            case 'partnership-applications': // Added new case for partnership applications
                return <AdminPartnershipApplications />;
            case 'affiliate-programs':
                return <AdminAffiliatePrograms />;
            case 'content-partnerships':
                return <AdminContentPartnerships />;
            case 'model-list':
                return <AdminModelList />;
            case 'content':
                return <AdminContentProposals />;
            case 'messages':
                return <AdminMessages />;
            case 'notifications':
                return <AdminNotifications />;
            case 'newsletters':
                return <AdminNewsletters />;
            case 'settings':
                return <AdminSettings />;
            default:
                return <AdminOverview setActiveTab={setActiveTab} />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-[#FFF9F4]">Loading Admin Dashboard...</div>;
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600&family=Montserrat:wght@500;700&display=swap');
                body {
                    background-color: #FFF9F4 !important;
                }
                .admin-dashboard-font {
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 500;
                    color: #2B2B2B;
                }
                .admin-dashboard-heading-font {
                    font-family: 'Lora', serif;
                    font-weight: 600;
                }
                .admin-button {
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 700;
                }
            `}</style>
            <div className="flex min-h-screen bg-[#FFF9F4] admin-dashboard-font">
                <aside className="w-64 bg-[#1A2238] text-[#D4C6B8] flex flex-col">
                    <div className="p-6 text-center">
                        <h1 className="text-2xl text-white admin-dashboard-heading-font">Bridged Admin</h1>
                    </div>
                    <nav className="flex-1 px-4 py-2">
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                                    activeTab === item.id
                                        ? 'bg-[#946B56] text-white'
                                        : 'hover:bg-[#FFFFFF]/10'
                                }`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-white/10">
                        <button 
                          onClick={() => base44.auth.logout()}
                          className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-[#FFFFFF]/10"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8">
                    {renderContent()}
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
