import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SETTING_KEYS = {
    TERMS: 'terms_and_conditions',
    PRIVACY: 'privacy_policy',
    AFFILIATE: 'affiliate_guidelines',
    BRIDGED_AGREEMENT: 'bridged_platform_agreement'
};

function RichTextEditor({ settingKey, title, description }) {
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    
    const { data: setting, isLoading } = useQuery({
        queryKey: ['platform-setting', settingKey],
        queryFn: async () => {
            const results = await base44.entities.PlatformSetting.filter({ key: settingKey });
            return results[0] || null;
        }
    });

    useEffect(() => {
        if (setting) {
            setContent(setting.value);
        }
    }, [setting]);

    const updateSetting = useMutation({
        mutationFn: (newContent) => {
            if (setting) {
                return base44.entities.PlatformSetting.update(setting.id, { value: newContent });
            } else {
                return base44.entities.PlatformSetting.create({ key: settingKey, value: newContent });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-setting', settingKey] });
            queryClient.invalidateQueries({ queryKey: ['bridged-agreement'] }); // Refresh agreement viewer
            alert(`${title} updated successfully!`);
        }
    });

    const handleSave = () => {
        updateSetting.mutate(content);
    };

    if (isLoading) return <p>Loading {title}...</p>;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ],
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    className="bg-white"
                    style={{ height: '400px', marginBottom: '50px' }}
                />
                <Button onClick={handleSave} disabled={updateSetting.isPending} className="bg-[#1A2238] hover:bg-[#2c3a5e] admin-button">
                    {updateSetting.isPending ? 'Saving...' : 'Save ' + title}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function AdminSettings() {
    return (
        <div>
            <h2 className="text-3xl mb-8 admin-dashboard-heading-font text-[#1A2238]">Platform Settings & Legal Documents</h2>
            
            <Tabs defaultValue="agreement" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="agreement">Bridged Agreement</TabsTrigger>
                    <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                    <TabsTrigger value="affiliate">Affiliate Guidelines</TabsTrigger>
                </TabsList>

                <TabsContent value="agreement" className="mt-6">
                    <RichTextEditor 
                        settingKey={SETTING_KEYS.BRIDGED_AGREEMENT} 
                        title="Bridged Platform Agreement"
                        description="The master agreement that all athletes and companies must agree to when starting a partnership. This will be displayed in the partnership onboarding flow."
                    />
                </TabsContent>

                <TabsContent value="terms" className="mt-6">
                    <RichTextEditor 
                        settingKey={SETTING_KEYS.TERMS} 
                        title="Terms & Conditions"
                        description="General terms of service for using the Bridged platform"
                    />
                </TabsContent>

                <TabsContent value="privacy" className="mt-6">
                    <RichTextEditor 
                        settingKey={SETTING_KEYS.PRIVACY} 
                        title="Privacy Policy"
                        description="How user data is collected, used, and protected"
                    />
                </TabsContent>

                <TabsContent value="affiliate" className="mt-6">
                    <RichTextEditor 
                        settingKey={SETTING_KEYS.AFFILIATE} 
                        title="Affiliate Guidelines"
                        description="Rules and best practices for affiliate partnerships"
                    />
                </TabsContent>
            </Tabs>
            
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Platform Tools</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-4">
                        <Button className="bg-[#946B56] hover:bg-[#a98471] admin-button">Export Reports</Button>
                        <Button className="bg-[#CFC7BD] hover:bg-[#E7E0DA] text-black admin-button">Backup Database</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}