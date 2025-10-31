import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Target, Heart, TrendingUp, Send, Upload, User, FileText, CheckCircle2, Loader2, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { sendBridgedEmail } from "@/components/emailUtils";
import { createPageUrl } from "@/utils";

export default function ContentProposal() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    linkedin: "",
    website: "",
    bio: "",
    photo_url: "",
    content_type: "",
    title: "",
    main_topic: "",
    target_audience_description: "",
    content_url: "",
    content_file_url: "",
    live_workshop_interest: null,
  });

  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoFileName, setPhotoFileName] = useState("");
  const [contentFileName, setContentFileName] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field, nameSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    nameSetter(file.name);
    setIsUploading(true);
    try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        handleInputChange(field, file_url);
    } catch (error) {
        console.error(`Error uploading ${field}:`, error);
        alert(`There was an error uploading your ${field.replace('_url', '')}. Please try again.`);
        nameSetter("");
    } finally {
        setIsUploading(false);
    }
  };
  
  const createProposalMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentProposal.create(data),
    onSuccess: async (data, variables) => {
      setSubmitted(true);
      
      // Email to contributor
      await sendBridgedEmail({
          to: variables.email,
          subject: "We've Received Your Content Proposal!",
          body: `<p>Thank you for submitting your proposal, "${variables.title}". Our team will review it and get back to you shortly.</p>`,
          eventType: 'content_proposal_received'
      });
      
      // Email to admin
      await sendBridgedEmail({
          to: 'nbowles@bridged.agency',
          subject: "New Content Proposal Submitted",
          body: `<p>A new content proposal titled "${variables.title}" has been submitted by ${variables.full_name}.</p>`,
          buttonText: "Review Proposals",
          buttonUrl: createPageUrl('Admin'),
          eventType: 'admin_new_content_proposal'
      });
    },
    onError: (error) => {
      console.error("Error creating proposal:", error);
      alert("There was an error submitting your proposal. Please check your details and try again.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content_url && !formData.content_file_url) {
      alert("Please provide either a content URL or upload a content file.");
      return;
    }
    createProposalMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border border-[#E7E0DA] shadow-2xl bg-white">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C2E45] mb-4">
              Thank You for Your Submission!
            </h2>
            <p className="text-lg text-[#333333] mb-8 leading-relaxed">
              Our team will review your proposal and get back to you within 3-5 business days. You'll receive a confirmation email once your content is approved and published.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <GraduationCap className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Share Your Expertise
          </h1>
          <p className="text-xl text-[#DED4C4] text-center leading-relaxed text-medium">
            Submit your proposal for a master class or blog article to help others succeed in their career transitions.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border border-[#E7E0DA] shadow-lg bg-white">
          <CardHeader className="border-b border-[#E7E0DA]">
            <CardTitle className="text-2xl font-bold text-[#1C2E45]">
              Content Proposal Form
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* About You */}
              <div>
                <h3 className="text-xl font-bold text-[#1C2E45] mb-6 flex items-center gap-3"><User /> About You</h3>
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="full_name" className="text-[#333333] font-medium">Full Name *</Label>
                            <Input id="full_name" required value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-[#333333] font-medium">Email Address *</Label>
                            <Input id="email" type="email" required value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="mt-2" />
                        </div>
                         <div>
                            <Label htmlFor="linkedin" className="text-[#333333] font-medium">LinkedIn Profile</Label>
                            <Input id="linkedin" value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="website" className="text-[#333333] font-medium">Personal Website (Optional)</Label>
                            <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} className="mt-2" />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="bio" className="text-[#333333] font-medium">Your Bio *</Label>
                        <Textarea id="bio" required value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} className="mt-2" rows={4} placeholder="Tell us a bit about yourself and your expertise..."/>
                    </div>
                    <div>
                        <Label htmlFor="photo" className="text-[#333333] font-medium">Profile Picture</Label>
                        <div className="mt-2 flex items-center gap-4">
                             <Button asChild variant="outline" className="w-full justify-start text-left font-normal">
                                <label htmlFor="photo_upload" className="cursor-pointer flex items-center gap-2">
                                  <Upload className="w-4 h-4" />
                                  <span>{photoFileName || "Upload a photo..."}</span>
                                </label>
                            </Button>
                            <input id="photo_upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo_url', setPhotoFileName)} />
                            {formData.photo_url && !isUploading && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {isUploading && photoFileName && <Loader2 className="w-5 h-5 animate-spin" />}
                        </div>
                    </div>
                </div>
              </div>

              {/* Your Content Proposal */}
              <div>
                <h3 className="text-xl font-bold text-[#1C2E45] mb-6 flex items-center gap-3"><FileText /> Your Content Proposal</h3>
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="content_type" className="text-[#333333] font-medium">What kind of content are you submitting? *</Label>
                        <Select required value={formData.content_type} onValueChange={(value) => handleInputChange('content_type', value)}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Select a content type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="masterclass_workshop">Master Class / Workshop</SelectItem>
                            <SelectItem value="blog_article">Blog Article</SelectItem>
                            <SelectItem value="video_content">Video Content</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="title" className="text-[#333333] font-medium">Proposed Title *</Label>
                        <Input id="title" required value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="main_topic" className="text-[#333333] font-medium">What is the main topic or general idea? *</Label>
                        <Textarea id="main_topic" required value={formData.main_topic} onChange={(e) => handleInputChange('main_topic', e.target.value)} className="mt-2" rows={3} placeholder="Describe the core concept of your content..."/>
                    </div>
                    <div>
                        <Label htmlFor="target_audience_description" className="text-[#333333] font-medium">Who would this content most appeal to? *</Label>
                        <Input id="target_audience_description" required value={formData.target_audience_description} onChange={(e) => handleInputChange('target_audience_description', e.target.value)} className="mt-2" placeholder="e.g., Aspiring CEOs, athletes seeking career advice, etc."/>
                    </div>
                    <div className="space-y-2">
                         <Label className="text-[#333333] font-medium">Submit Your Content *</Label>
                         <p className="text-sm text-gray-500">Please provide a link to your content (e.g., Google Doc, YouTube) OR upload a file.</p>
                         <div className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-gray-400"/>
                            <Input id="content_url" value={formData.content_url} onChange={(e) => handleInputChange('content_url', e.target.value)} placeholder="https://..." />
                         </div>
                         <div className="flex items-center justify-center text-sm text-gray-500">OR</div>
                         <div className="flex items-center gap-4">
                             <Button asChild variant="outline" className="w-full justify-start text-left font-normal">
                                <label htmlFor="content_upload" className="cursor-pointer flex items-center gap-2">
                                  <Upload className="w-4 h-4" />
                                  <span>{contentFileName || "Upload a file..."}</span>
                                </label>
                            </Button>
                            <input id="content_upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'content_file_url', setContentFileName)} />
                            {formData.content_file_url && !isUploading && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {isUploading && contentFileName && <Loader2 className="w-5 h-5 animate-spin" />}
                        </div>
                    </div>
                </div>
              </div>

              {/* Future Opportunities */}
              <div>
                <h3 className="text-xl font-bold text-[#1C2E45] mb-6 flex items-center gap-3"><TrendingUp/> Future Opportunities</h3>
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="live_workshop_interest" className="text-[#333333] font-medium">Would you be interested in hosting a live workshop in the future? *</Label>
                         <Select required value={formData.live_workshop_interest} onValueChange={(value) => handleInputChange('live_workshop_interest', value === 'true')}>
                            <SelectTrigger className="mt-2"><SelectValue placeholder="Please select..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Yes, I'm interested</SelectItem>
                                <SelectItem value="false">No, not at this time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E7E0DA]">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createProposalMutation.isPending || isUploading}
                  className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium py-6 text-lg"
                >
                  {createProposalMutation.isPending || isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5 mr-2" />Submit Content Proposal</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}