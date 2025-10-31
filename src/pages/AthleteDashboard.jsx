
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Camera, Loader2, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelApplicationForm from '../components/athlete/ModelApplicationForm';
import AthleteAffiliateDashboard from '../components/athlete/AthleteAffiliateDashboard';

export default function AthleteDashboard() {
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: modelEntry, isLoading: modelEntryLoading } = useQuery({
        queryKey: ['modelEntry', user?.id],
        queryFn: () => base44.entities.ModelListEntry.filter({ athlete_id: user.id }).then(res => res[0]),
        enabled: !!user
    });

    if (userLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
             <header className="mb-8">
                <h1 className="text-4xl font-bold heading-font text-[#1A2238]">{user.full_name}</h1>
                <p className="text-lg text-gray-600">Welcome to your athlete dashboard.</p>
            </header>
            <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-3 bg-white p-2 h-auto rounded-xl shadow-sm border border-[#E7E0DA]">
                    <TabsTrigger value="profile" className="text-lg py-3"><User className="w-5 h-5 mr-2"/>My Profile</TabsTrigger>
                    <TabsTrigger value="modeling" className="text-lg py-3"><Camera className="w-5 h-5 mr-2"/>Modeling</TabsTrigger>
                    <TabsTrigger value="affiliate" className="text-lg py-3"><Target className="w-5 h-5 mr-2"/>Affiliate</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-8">
                    <p>Manage your athlete profile here (feature coming soon).</p>
                </TabsContent>
                <TabsContent value="modeling" className="mt-8">
                    <ModelApplicationForm user={user} existingEntry={modelEntry} isLoading={modelEntryLoading} />
                </TabsContent>
                <TabsContent value="affiliate" className="mt-8">
                    <AthleteAffiliateDashboard user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
