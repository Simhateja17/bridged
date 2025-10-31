
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Target, CheckCircle2, Building2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { sendBridgedEmail } from "@/components/emailUtils";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompanySignup() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: internshipPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['internshipPlans'],
    queryFn: () => base44.entities.InternshipPlan.list('hours_per_month'),
    initialData: [],
  });

  const [formData, setFormData] = useState({
    contact_name: "",
    contact_position: "",
    contact_email: "",
    password: "",
    company_name: "",
    website: "",
    logo_url: "",
    description: "",
    internship_deadline: "",
    preferred_majors: [],
    intern_description: "",
    internship_plan_name: "",
    internship_hours: null,
    internship_stipend: null,
    responsibilities: "",
    minimum_followers: "",
    affiliate_criteria: "",
    affiliate_discount: "",
    affiliate_return: "",
    main_affiliate_code: "",
    opportunity_type: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanSelection = (planName) => {
    const selectedPlan = internshipPlans.find(p => p.name === planName);
    if (selectedPlan) {
        setFormData(prev => ({
            ...prev,
            internship_plan_name: selectedPlan.name,
            internship_hours: selectedPlan.hours_per_month,
            internship_stipend: selectedPlan.pay_to_athlete,
        }));
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        handleInputChange('logo_url', file_url);
      } catch (error) {
        console.error("Error uploading logo:", error);
      }
      setUploading(false);
    }
  };

  const handleTypeSelection = (type) => {
    let newType;
    if (selectedType === null) {
      newType = type;
    } else if (selectedType === type) {
      newType = null;
    } else if ((selectedType === 'internship' && type === 'affiliate') || (selectedType === 'affiliate' && type === 'internship')) {
      newType = 'both';
    } else if (selectedType === 'both') {
        if(type === 'internship') newType = 'affiliate';
        else newType = 'internship';
    }
    setSelectedType(newType);
    setFormData(prev => ({ ...prev, opportunity_type: newType }));
  };

  const createCompanyMutation = useMutation({
    mutationFn: async (data) => {
      console.log('=== Starting company creation ===');
      console.log('Form data being submitted:', data);
      
      try {
        console.log('Step 1: Creating user account...');
        const user = await base44.entities.User.create({
          full_name: data.contact_name,
          email: data.contact_email,
          password: data.password,
          account_type: 'company',
          role: 'user',
          is_newsletter_subscriber: true,
        });
        console.log('User created successfully:', user);

        console.log('Step 2: Creating company profile...');
        const companyData = {
          company_name: data.company_name,
          logo_url: data.logo_url || "",
          description: data.description,
          opportunity_type: data.opportunity_type,
          preferred_majors: data.preferred_majors || [],
          intern_description: data.intern_description || "",
          responsibilities: data.responsibilities || "",
          contact_name: data.contact_name,
          contact_position: data.contact_position,
          contact_email: data.contact_email,
          website: data.website || "",
          internship_deadline: data.internship_deadline || "",
          internship_plan_name: data.internship_plan_name || "",
          internship_hours: data.internship_hours || null,
          internship_stipend: data.internship_stipend || null,
          minimum_followers: data.minimum_followers || "",
          affiliate_criteria: data.affiliate_criteria || "",
          affiliate_discount: data.affiliate_discount || "",
          affiliate_return: data.affiliate_return || "",
          main_affiliate_code: data.main_affiliate_code || "",
          status: 'pending_approval'
        };
        
        console.log('Company data to be created:', companyData);
        const company = await base44.entities.Company.create(companyData);
        console.log('Company created successfully:', company);
        
        return { user, company };
      } catch (error) {
        console.error('=== ERROR DETAILS ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('=== Success! ===');
      alert("Your company profile has been submitted for approval. You will receive an email confirmation shortly.");
      
      try {
        await sendBridgedEmail({
          to: variables.contact_email,
          subject: "Thanks for joining Bridged!",
          body: `<p>Your company profile for <strong>${variables.company_name}</strong> is under review. We'll notify you as soon as it's approved (usually within 24 hours).</p>`,
          eventType: 'company_signup_pending'
        });

        await sendBridgedEmail({
          to: 'nbowles@bridged.agency',
          subject: "New Company Pending Approval",
          body: `<p>A new company, <strong>${variables.company_name}</strong>, has signed up and is awaiting verification.</p>`,
          buttonText: "Review Companies",
          buttonUrl: createPageUrl('Admin'),
          eventType: 'admin_new_company_alert'
        });
      } catch (emailError) {
        console.error('Email sending failed, but continuing:', emailError);
      }

      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      console.error("=== MUTATION ERROR HANDLER ===");
      console.error("Full error object:", error);
      
      let errorMessage = "There was an error creating your profile.\n\n";
      
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage += "This email is already registered. Please use a different email or try logging in.";
        } else if (error.message.includes('password')) {
          errorMessage += "Password error: " + error.message;
        } else if (error.message.includes('required')) {
          errorMessage += "Missing required field: " + error.message;
        } else {
          errorMessage += "Error: " + error.message;
        }
      } else {
        errorMessage += "Please check all required fields and try again.\n\n";
        errorMessage += "Details: " + JSON.stringify(error, null, 2);
      }
      
      alert(errorMessage);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedType) {
      alert("Please select at least one partnership type");
      return;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    if ((selectedType === 'internship' || selectedType === 'both') && !formData.internship_plan_name) {
      alert("Please select an internship plan.");
      return;
    }
    if ((selectedType === 'affiliate' || selectedType === 'both')) {
      if (!formData.main_affiliate_code) {
        alert("Please provide a main affiliate code.");
        return;
      }
      if (!formData.affiliate_discount) {
        alert("Please provide the discount for customers.");
        return;
      }
      if (!formData.affiliate_return) {
        alert("Please provide the commission per sale.");
        return;
      }
      if (!formData.affiliate_criteria) {
        alert("Please describe the affiliate requirements & opportunities.");
        return;
      }
    }
    
    console.log('Submitting form data:', formData);
    createCompanyMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Building2 className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Join as a Company
          </h1>
          <p className="text-xl text-[#DED4C4] text-center leading-relaxed text-medium max-w-3xl mx-auto">
            Connect with talented athletes for authentic brand partnerships. Create your company profile and start discovering athletes who align with your brand values.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                How would you like to partner with us?
              </CardTitle>
              <p className="text-[#333333] text-medium mt-2">
                Select the type of partnership opportunities you're interested in. You can choose one or both options.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => handleTypeSelection('internship')}
                  className={`text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedType === 'internship' || selectedType === 'both'
                      ? 'border-[#1C2E45] bg-[#F6F4F0] shadow-lg'
                      : 'border-[#E7E0DA] hover:border-[#1C2E45]/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      selectedType === 'internship' || selectedType === 'both'
                        ? 'bg-[#1C2E45] text-white'
                        : 'bg-[#F8F5F2] text-[#1C2E45]'
                    }`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1C2E45]">
                      Post Internship Opportunities
                    </h3>
                  </div>
                  <p className="text-[#333333] text-medium mb-4 leading-relaxed">
                    Offer paid, flexible internships to talented student-athletes. Choose from various plans to fit your needs.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-[#333333]">
                      <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>Payments only released after deliverables are approved.</span>
                    </li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelection('affiliate')}
                  className={`text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedType === 'affiliate' || selectedType === 'both'
                      ? 'border-[#1C2E45] bg-[#F6F4F0] shadow-lg'
                      : 'border-[#E7E0DA] hover:border-[#1C2E45]/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      selectedType === 'affiliate' || selectedType === 'both'
                        ? 'bg-[#1C2E45] text-white'
                        : 'bg-[#F8F5F2] text-[#1C2E45]'
                    }`}>
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1C2E45]">
                      Become an Affiliate Partner
                    </h3>
                  </div>
                  <p className="text-[#333333] text-medium mb-4 leading-relaxed">
                    Partner with athletes for authentic brand endorsements and affiliate marketing campaigns.
                  </p>
                   <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-[#333333]">
                      <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>Custom affiliate codes and performance-based partnerships.</span>
                    </li>
                  </ul>
                </button>
              </div>
            </CardContent>
          </Card>

          {selectedType && (
            <>
              <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                <CardHeader className="border-b border-[#E7E0DA]">
                  <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contact_name" className="text-[#333333] font-medium">Point of Contact Name *</Label>
                      <Input id="contact_name" required value={formData.contact_name} onChange={(e) => handleInputChange('contact_name', e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="contact_position" className="text-[#333333] font-medium">Point of Contact Position *</Label>
                      <Input id="contact_position" required value={formData.contact_position} onChange={(e) => handleInputChange('contact_position', e.target.value)} className="mt-2" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contact_email" className="text-[#333333] font-medium">Contact Email Address *</Label>
                      <Input id="contact_email" type="email" required value={formData.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-[#333333] font-medium">Login Password *</Label>
                      <Input id="password" type="password" required value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="mt-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters long.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                 <CardHeader className="border-b border-[#E7E0DA]">
                  <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div>
                    <Label htmlFor="company_name" className="text-[#333333] font-medium">Company Name *</Label>
                    <Input id="company_name" required value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-[#333333] font-medium">Website URL</Label>
                    <Input id="website" type="url" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} className="mt-2" placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="logo" className="text-[#333333] font-medium">Company Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1" />
                      {uploading && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
                      {formData.logo_url && !uploading && <CheckCircle2 className="w-5 h-5 text-[#946b56]" />}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-[#333333] font-medium">Company Description *</Label>
                    <Textarea id="description" required value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="mt-2" rows={4} />
                  </div>
                </CardContent>
              </Card>
              
              {(selectedType === 'internship' || selectedType === 'both') && (
                <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                  <CardHeader className="border-b border-[#E7E0DA]">
                    <CardTitle className="text-2xl font-bold text-[#1C2E45]">Internship Program Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div>
                      <Label htmlFor="internship_plan" className="text-[#333333] font-medium">Internship Plan *</Label>
                      <Select 
                        onValueChange={handlePlanSelection}
                        value={formData.internship_plan_name}
                        required
                      >
                        <SelectTrigger className="mt-2" disabled={plansLoading}>
                          <SelectValue placeholder="Select the hours and stipend for your internship" />
                        </SelectTrigger>
                        <SelectContent>
                            {internshipPlans.map(plan => (
                                <SelectItem key={plan.name} value={plan.name}>
                                    {plan.name} Plan: {plan.hours_per_month} hrs/month @ ${plan.pay_to_athlete}/month
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                       <p className="text-xs text-gray-500 mt-1">
                        This determines the monthly hours and stipend for your intern.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="internship_deadline" className="text-[#333333] font-medium">Application Deadline *</Label>
                      <Input id="internship_deadline" type="date" required value={formData.internship_deadline} onChange={(e) => handleInputChange('internship_deadline', e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="preferred_majors" className="text-[#333333] font-medium">Preferred Majors</Label>
                      <Textarea id="preferred_majors" value={formData.preferred_majors.join(', ')} onChange={(e) => handleArrayInput('preferred_majors', e.target.value)} className="mt-2" rows={3} placeholder="e.g., Marketing, Business, Communications (comma-separated)" />
                    </div>
                    <div>
                      <Label htmlFor="intern_description" className="text-[#333333] font-medium">Intern Requirements & Duties *</Label>
                      <Textarea id="intern_description" required value={formData.intern_description} onChange={(e) => handleInputChange('intern_description', e.target.value)} className="mt-2" rows={6} placeholder="Describe the ideal intern profile and their responsibilities..." />
                    </div>
                  </CardContent>
                </Card>
              )}

              {(selectedType === 'affiliate' || selectedType === 'both') && (
                <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                  <CardHeader className="border-b border-[#E7E0DA]">
                    <CardTitle className="text-2xl font-bold text-[#1C2E45]">Affiliate Partnership Details</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Set up your affiliate program details. Athletes will receive personalized codes to share with their audience.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div>
                      <Label htmlFor="main_affiliate_code" className="text-[#333333] font-medium">Main Affiliate Code *</Label>
                      <Input 
                        id="main_affiliate_code" 
                        required 
                        value={formData.main_affiliate_code} 
                        onChange={(e) => handleInputChange('main_affiliate_code', e.target.value.toUpperCase())} 
                        className="mt-2"
                        placeholder="e.g., BRIDGED20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Athletes will receive personalized codes like: {formData.main_affiliate_code || 'YOURCODE'}-ATHLETENAME
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="affiliate_discount" className="text-[#333333] font-medium">Discount for Customers *</Label>
                        <Input 
                          id="affiliate_discount" 
                          required 
                          value={formData.affiliate_discount} 
                          onChange={(e) => handleInputChange('affiliate_discount', e.target.value)} 
                          className="mt-2"
                          placeholder="e.g., 20% off or $10 off"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          What discount do customers get when using an athlete's code?
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="affiliate_return" className="text-[#333333] font-medium">Commission Per Sale *</Label>
                        <Input 
                          id="affiliate_return" 
                          required 
                          value={formData.affiliate_return} 
                          onChange={(e) => handleInputChange('affiliate_return', e.target.value)} 
                          className="mt-2"
                          placeholder="e.g., 10% per sale or $5 per sale"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Athletes keep 80%, Bridged takes 20% service fee
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="minimum_followers" className="text-[#333333] font-medium">Minimum Social Following</Label>
                      <Input 
                        id="minimum_followers" 
                        value={formData.minimum_followers} 
                        onChange={(e) => handleInputChange('minimum_followers', e.target.value)} 
                        className="mt-2"
                        placeholder="e.g., 1,000 followers"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: Specify minimum follower count requirement
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="affiliate_criteria" className="text-[#333333] font-medium">Affiliate Requirements & Opportunities *</Label>
                      <Textarea 
                        id="affiliate_criteria" 
                        required 
                        value={formData.affiliate_criteria} 
                        onChange={(e) => handleInputChange('affiliate_criteria', e.target.value)} 
                        className="mt-2" 
                        rows={6}
                        placeholder="Describe what you're looking for in affiliate partners and what opportunities they'll have. Include any specific requirements, content expectations, and promotional guidelines."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Be specific about what athletes will promote, posting requirements, and any performance expectations.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-[#DED4C4]/10 to-[#DED4C4]/5 rounded-lg p-6 border border-[#E7E0DA]">
                      <h4 className="text-sm font-semibold text-[#1C2E45] mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        How Affiliate Partnerships Work
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                          <span>Athletes apply to become brand ambassadors for your products/services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                          <span>Each athlete receives a personalized affiliate code (e.g., YOURCODE-ATHLETENAME)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                          <span>Athletes promote your brand to their followers using their unique code</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                          <span>You track sales and pay commissions (athlete keeps 80%, Bridged takes 20%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#946b56] flex-shrink-0 mt-0.5" />
                          <span>Bridged manages the partnership portal, tracking, and athlete communication</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="pt-6">
                <Button type="submit" size="lg" disabled={createCompanyMutation.isPending || uploading} className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium py-6 text-lg">
                  {createCompanyMutation.isPending ? "Submitting..." : "Submit Company Profile for Approval"}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
