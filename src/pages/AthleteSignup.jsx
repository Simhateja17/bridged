
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Users, CheckCircle2, Target, Briefcase, Handshake, Mail, Shield, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { sendBridgedEmail } from "@/components/emailUtils";
import { isPreferredCodeUnique, suggestAlternativeCodes } from '@/components/athlete/AffiliateCodeGenerator';

export default function AthleteSignup() {
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signupType, setSignupType] = useState('full_access');
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [suggestedCodes, setSuggestedCodes] = useState([]);

  const debounceTimeoutRef = useRef(null); // Ref to store the debounce timeout ID

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    date_of_birth: "",
    password: "",
    athletic_dept_email: "",
    photo_url: "",
    bio: "",
    strengths_traits: "", // Changed to string
    sport: "",
    region: "",
    highlight_reel_url: "",
    nil_experience: "",
    school: "",
    major: "",
    minor: "",
    double_major: "",
    graduation_year: "",
    gpa: "",
    key_courses: "", // Changed to string
    languages: "", // Changed to string
    future_goals: "",
    resume_url: "",
    total_followers: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    linkedin: "",
    snapchat: "",
    interests_hobbies: "", // Changed to string
    affiliate_code_suggestion: "",
    affiliate_code_type: "",
    profile_type: "full_access",
    social_link: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSignupTypeChange = (type) => {
    setSignupType(type);
    handleInputChange('profile_type', type);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        handleInputChange('photo_url', file_url);
      } catch (error) {
        console.error("Error uploading photo:", error);
        alert("Failed to upload photo. Please try again.");
        setPhotoFile(null); // Reset file on error
        handleInputChange('photo_url', ''); // Clear photo_url on error
      }
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        handleInputChange('resume_url', file_url);
      } catch (error) {
        console.error("Error uploading resume:", error);
        alert("Failed to upload resume. Please try again.");
        setResumeFile(null); // Reset file on error
        handleInputChange('resume_url', ''); // Clear resume_url on error
      }
      setUploading(false);
    }
  };

  const validateAffiliateCode = async (code) => {
    if (!code || code.trim().length === 0) {
      setCodeError('');
      setSuggestedCodes([]);
      return;
    }

    setCodeValidating(true);
    setCodeError('');
    setSuggestedCodes([]);

    try {
      const isUnique = await isPreferredCodeUnique(code);
      
      if (!isUnique) {
        setCodeError('This code is already taken. Try one of these suggestions:');
        const suggestions = await suggestAlternativeCodes(code, 3);
        setSuggestedCodes(suggestions);
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setCodeError('Error checking code availability.');
    } finally {
      setCodeValidating(false);
    }
  };

  const handleAffiliateCodeChange = (value) => {
    handleInputChange('affiliate_code_suggestion', value);
    // Clear previous timeout if any
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Set new timeout for validation
    debounceTimeoutRef.current = setTimeout(() => {
      validateAffiliateCode(value);
    }, 500); // Debounce for 500ms
  };

  // Helper function to convert comma-separated string to array
  const parseArrayField = (value) => {
    if (!value || typeof value !== 'string') return [];
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('=== Starting athlete signup ===');
      console.log('Form data:', data);
      
      try {
        // Step 1: Create user
        console.log('Step 1: Creating user account...');
        const userData = {
          ...data,
          // Parse string fields into arrays
          strengths_traits: parseArrayField(data.strengths_traits),
          key_courses: parseArrayField(data.key_courses),
          languages: parseArrayField(data.languages),
          interests_hobbies: parseArrayField(data.interests_hobbies),
          account_type: 'athlete',
          role: 'user',
          is_newsletter_subscriber: true,
          verification_status: 'pending_email',
          verified_student: false,
          verified_athlete: false
        };
        const user = await base44.entities.User.create(userData);
        console.log('✅ User created:', user.id);
        
        // Step 2: Create verification request
        console.log('Step 2: Creating verification request...');
        const verificationToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const tokenExpires = new Date();
        tokenExpires.setDate(tokenExpires.getDate() + 7);
        
        const verificationRequest = await base44.entities.VerificationRequest.create({
          user_id: user.id,
          name: data.full_name,
          email: data.email,
          school: data.school,
          sport: data.sport,
          graduation_year: data.graduation_year,
          athletic_dept_email: data.athletic_dept_email,
          photo_url: data.photo_url,
          verification_token: verificationToken,
          token_expires: tokenExpires.toISOString(),
          status: 'pending'
        });
        console.log('✅ Verification request created:', verificationRequest.id);
        
        return { user, verificationRequest };
      } catch (error) {
        console.error('❌ Signup error:', error);
        console.error('Error message:', error.message);
        console.error('Error response data:', error.response?.data);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('✅ Signup successful!');
      const { user, verificationRequest } = data;
      
      try {
        // Send welcome email to athlete
        console.log('Sending welcome email to athlete...');
        await sendBridgedEmail({
          to: variables.email,
          subject: `Welcome to Bridged, ${variables.full_name.split(' ')[0]}!`,
          body: `<p>We're excited to have you join Bridged!</p><p><strong>Next Steps:</strong></p><ol><li>✅ Verify your .edu email address (check your inbox)</li><li>⏳ Wait for your athletic department to confirm your athlete status</li><li>🎉 Once verified, you'll have full access to all opportunities!</li></ol><p>We've sent a verification request to your athletic department at <strong>${variables.athletic_dept_email}</strong>. They'll review your request shortly.</p>`,
          buttonText: "Go to Bridged",
          buttonUrl: "https://pro.base44.com/app/bridged",
          eventType: 'athlete_welcome'
        });
        console.log('✅ Athlete welcome email sent.');
        
        // Send verification request to athletic department with magic link
        const verificationUrl = `https://pro.base44.com/app/bridged/pages/AthleticDepartmentPortal?token=${verificationRequest.verification_token}`;
        
        console.log('Sending verification request email to athletic department...');
        await sendBridgedEmail({
          to: variables.athletic_dept_email,
          subject: `Athlete Verification Request - ${variables.full_name}`,
          body: `
            <p><strong>New Athlete Verification Request</strong></p>
            <p>A student from your institution has applied to join the Bridged platform and listed you as their athletic department contact.</p>
            
            <div style="background-color: #F8F5F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Athlete Name:</strong> ${variables.full_name}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${variables.email}</p>
              <p style="margin: 5px 0 0 0;"><strong>School:</strong> ${variables.school}</p>
              <p style="margin: 5px 0 0 0;"><strong>Sport:</strong> ${variables.sport}</p>
              <p style="margin: 5px 0 0 0;"><strong>Graduation Year:</strong> ${variables.graduation_year}</p>
            </div>
            
            <p><strong>What is Bridged?</strong></p>
            <p>Bridged is a platform connecting student-athletes with NIL opportunities, internships, and brand partnerships. We verify all athletes to ensure authenticity.</p>
            
            <p><strong>Action Required:</strong></p>
            <p>Please click the button below to verify this athlete's status. No login or account creation required - this is a one-time verification link.</p>
            
            <p style="margin-top: 20px;"><em>This link will expire in 7 days.</em></p>
          `,
          buttonText: "Verify This Athlete",
          buttonUrl: verificationUrl,
          eventType: 'athletic_dept_verification_request'
        });
        console.log('✅ Athletic department verification email sent.');
        
        alert("✅ Profile created successfully! Please check your .edu email to verify your account. We've also sent a verification request to your athletic department.");
        navigate('/');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        alert("✅ Profile created! However, there was an issue sending some verification emails. Please contact support if you don't receive emails shortly.");
        navigate('/');
      }
    },
    onError: (error) => {
      console.error("=== SIGNUP FAILED ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      let userFacingMessage = "There was an error creating your profile.\n\n";
      
      // Check for specific error types or messages from the backend
      if (error.response && error.response.data && error.response.data.message) {
        // Assume backend returns structured error messages
        const backendMessage = error.response.data.message.toLowerCase();
        if (backendMessage.includes('duplicate') || backendMessage.includes('already exists')) {
          userFacingMessage += "❌ This email is already registered. Please use a different email or try logging in.";
        } else if (backendMessage.includes('password')) {
          userFacingMessage += "❌ Password error: " + error.response.data.message;
        } else if (backendMessage.includes('email') || backendMessage.includes('.edu')) {
          userFacingMessage += "❌ Please use a valid .edu email address as provided.";
        } else if (backendMessage.includes('required')) {
          userFacingMessage += "❌ Missing required field: " + error.response.data.message;
        } else {
          userFacingMessage += "❌ " + error.response.data.message;
        }
      } else if (error.message) {
        // Fallback for general JS error messages
        if (error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('already exists')) {
          userFacingMessage += "❌ This email is already registered. Please use a different email or try logging in.";
        } else if (error.message.toLowerCase().includes('password')) {
          userFacingMessage += "❌ Password error: " + error.message;
        } else if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('.edu')) {
          userFacingMessage += "❌ Please ensure your school email is a valid .edu address.";
        } else if (error.message.toLowerCase().includes('network')) {
          userFacingMessage += "❌ Network error. Please check your internet connection and try again.";
        } else {
          userFacingMessage += "❌ " + error.message;
        }
      } else {
        userFacingMessage += "❌ An unknown error occurred. Please check all fields and try again.";
      }
      
      // Add detailed error info for support
      userFacingMessage += "\n\n📋 Error details (for support): " + JSON.stringify({
        message: error.message,
        statusCode: error.response?.status,
        data: error.response?.data
      }, null, 2);
      
      alert(userFacingMessage);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== Form Submit Clicked ===');
    console.log('Current form data:', formData);
    
    // Client-side validation before mutation
    if (!formData.email.endsWith('.edu')) {
      alert("❌ Please sign up using your official school email ending in .edu");
      return;
    }
    
    if (!formData.athletic_dept_email || !formData.athletic_dept_email.includes('@')) {
      alert("❌ Please provide a valid athletic department contact email");
      return;
    }
    
    if (formData.password.length < 8) {
      alert("❌ Password must be at least 8 characters long");
      return;
    }

    if (!formData.photo_url) {
      alert("❌ Please upload a profile picture.");
      return;
    }

    // Validate affiliate code uniqueness if provided
    if (formData.affiliate_code_suggestion) {
      setCodeValidating(true); // Indicate validation is happening before submission
      const isUnique = await isPreferredCodeUnique(formData.affiliate_code_suggestion);
      setCodeValidating(false);
      if (!isUnique) {
        alert("❌ The affiliate code you chose is already taken. Please select a different one or choose from suggestions.");
        setCodeError('This code is already taken. Please pick another one.');
        return; // Prevent form submission
      }
    }

    const dataToSubmit = { ...formData };

    if (signupType === 'affiliate_only') {
      dataToSubmit.minor = '';
      dataToSubmit.double_major = '';
      dataToSubmit.gpa = '';
      dataToSubmit.key_courses = ''; // Changed from [] to ''
      dataToSubmit.future_goals = '';
      dataToSubmit.resume_url = '';
    }

    console.log('Submitting data:', dataToSubmit);
    createProfileMutation.mutate(dataToSubmit);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Users className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Join as an Athlete
          </h1>
          <p className="text-xl text-[#DED4C4] text-center leading-relaxed text-medium max-w-3xl mx-auto">
            Create your athlete profile and connect with brands. Verification is simple: use your .edu email and get approved by your athletic department.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Verification Requirements */}
        <Card className="mb-8 border-2 border-[#946b56] shadow-lg bg-gradient-to-br from-[#FFF9F4] to-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1C2E45] flex items-center gap-3">
              <Shield className="w-7 h-7 text-[#946b56]" />
              Verification Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                <p className="text-[#333333]"><strong>Step 1:</strong> Sign up with your official <strong>.edu email address</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                <p className="text-[#333333]"><strong>Step 2:</strong> Provide your athletic department contact email</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                <p className="text-[#333333]"><strong>Step 3:</strong> Your athletic department will receive an email to verify your athlete status (no login required)</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                <p className="text-[#333333]"><strong>Step 4:</strong> Once approved, you'll have full access to all opportunities!</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Type Selection */}
        <Card className="mb-8 border border-[#E7E0DA] shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1C2E45]">Choose Your Path</CardTitle>
            <p className="text-gray-600">Select the type of opportunities you're interested in.</p>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => handleSignupTypeChange('full_access')}
              className={`p-6 rounded-lg border-2 text-left transition-all ${signupType === 'full_access' ? 'border-[#1C2E45] bg-[#F8F5F2] ring-2 ring-[#1C2E45]' : 'border-[#E7E0DA] hover:border-[#1C2E45]'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-6 h-6 text-[#1C2E45]" />
                <h3 className="font-bold text-lg text-[#1C2E45]">Full Access Profile</h3>
              </div>
              <p className="text-sm text-gray-600">Apply for paid internships and affiliate marketing partnerships. A complete profile to showcase all your skills.</p>
            </button>
            <button
              type="button"
              onClick={() => handleSignupTypeChange('affiliate_only')}
              className={`p-6 rounded-lg border-2 text-left transition-all ${signupType === 'affiliate_only' ? 'border-[#946b56] bg-[#F8F5F2] ring-2 ring-[#946b56]' : 'border-[#E7E0DA] hover:border-[#946b56]'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Handshake className="w-6 h-6 text-[#946b56]" />
                <h3 className="font-bold text-lg text-[#1C2E45]">Affiliate-Only Profile</h3>
              </div>
              <p className="text-sm text-gray-600">A streamlined profile focused on connecting you with brands for affiliate marketing opportunities.</p>
            </button>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name" className="text-[#333333] font-medium">Full Name *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#333333] font-medium">School Email (.edu) *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="you@university.edu"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be your official school email ending in .edu
                  </p>
                </div>
                <div>
                  <Label htmlFor="date_of_birth" className="text-[#333333] font-medium">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[#333333] font-medium">Login Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="athletic_dept_email" className="text-[#333333] font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#946b56]" />
                  Athletic Department Contact Email *
                </Label>
                <Input
                  id="athletic_dept_email"
                  type="email"
                  required
                  value={formData.athletic_dept_email}
                  onChange={(e) => handleInputChange('athletic_dept_email', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  placeholder="athletics@university.edu"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a verification request to this email. They'll be able to approve your athlete status with one click - no login required.
                </p>
              </div>

              <div>
                <Label htmlFor="photo" className="text-[#333333] font-medium">Profile Picture Upload *</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                  {uploading && photoFile && <span className="text-sm text-gray-500">Uploading...</span>}
                  {formData.photo_url && <CheckCircle2 className="w-5 h-5 text-[#946b56]" />}
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-[#333333] font-medium">Bio *</Label>
                <Textarea
                  id="bio"
                  required
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <Label htmlFor="strengths_traits" className="text-[#333333] font-medium">Strengths & Personality Traits *</Label>
                <Input
                  id="strengths_traits"
                  required
                  value={formData.strengths_traits}
                  onChange={(e) => handleInputChange('strengths_traits', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  placeholder="e.g., Leadership, Creative, Driven, Team Player"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple traits with commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Athletic Information */}
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                Athletic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sport" className="text-[#333333] font-medium">Primary Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                    <SelectTrigger className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]">
                      <SelectValue placeholder="Select your sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Baseball">Baseball</SelectItem>
                      <SelectItem value="Soccer">Soccer</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Golf">Golf</SelectItem>
                      <SelectItem value="Swimming">Swimming</SelectItem>
                      <SelectItem value="Track & Field">Track & Field</SelectItem>
                      <SelectItem value="Wrestling">Wrestling</SelectItem>
                      <SelectItem value="Volleyball">Volleyball</SelectItem>
                      <SelectItem value="Softball">Softball</SelectItem>
                      <SelectItem value="Hockey">Hockey</SelectItem>
                      <SelectItem value="Lacrosse">Lacrosse</SelectItem>
                      <SelectItem value="Cross Country">Cross Country</SelectItem>
                      <SelectItem value="Gymnastics">Gymnastics</SelectItem>
                      <SelectItem value="Cheerleading">Cheerleading</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region" className="text-[#333333] font-medium">Region *</Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]">
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Northeast">Northeast</SelectItem>
                      <SelectItem value="Southeast">Southeast</SelectItem>
                      <SelectItem value="Midwest">Midwest</SelectItem>
                      <SelectItem value="Southwest">Southwest</SelectItem>
                      <SelectItem value="West Coast">West Coast</SelectItem>
                      <SelectItem value="Mountain West">Mountain West</SelectItem>
                      <SelectItem value="Pacific Northwest">Pacific Northwest</SelectItem>
                      <SelectItem value="Great Lakes">Great Lakes</SelectItem>
                      <SelectItem value="Mid-Atlantic">Mid-Atlantic</SelectItem>
                      <SelectItem value="South Central">South Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="highlight_reel_url" className="text-[#333333] font-medium">Highlight Reel URL (Optional)</Label>
                <Input
                  id="highlight_reel_url"
                  value={formData.highlight_reel_url}
                  onChange={(e) => handleInputChange('highlight_reel_url', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="nil_experience" className="text-[#333333] font-medium">
                  NIL Experiences {signupType === 'affiliate_only' ? '*' : '(Optional)'}
                </Label>
                <Textarea
                  id="nil_experience"
                  required={signupType === 'affiliate_only'}
                  value={formData.nil_experience}
                  onChange={(e) => handleInputChange('nil_experience', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  rows={3}
                  placeholder="Describe any previous NIL deals or brand partnerships..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="school" className="text-[#333333] font-medium">School/University *</Label>
                  <Input
                    id="school"
                    required
                    value={formData.school}
                    onChange={(e) => handleInputChange('school', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                </div>

                <div>
                  <Label htmlFor="major" className="text-[#333333] font-medium">Major/Field of Study *</Label>
                  <Input
                    id="major"
                    required
                    value={formData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  />
                </div>
                
                {signupType === 'full_access' && (
                  <>
                    <div>
                      <Label htmlFor="minor" className="text-[#333333] font-medium">Minor (Optional)</Label>
                      <Input
                        id="minor"
                        value={formData.minor}
                        onChange={(e) => handleInputChange('minor', e.target.value)}
                        className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      />
                    </div>
    
                    <div>
                      <Label htmlFor="double_major" className="text-[#333333] font-medium">Double Major (Optional)</Label>
                      <Input
                        id="double_major"
                        value={formData.double_major}
                        onChange={(e) => handleInputChange('double_major', e.target.value)}
                        className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="graduation_year" className="text-[#333333] font-medium">Graduation Year *</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    required
                    value={formData.graduation_year}
                    onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="2025"
                  />
                </div>
                
                {signupType === 'full_access' && (
                  <div>
                    <Label htmlFor="gpa" className="text-[#333333] font-medium">GPA (Optional)</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      value={formData.gpa}
                      onChange={(e) => handleInputChange('gpa', e.target.value)}
                      className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      placeholder="3.50"
                    />
                  </div>
                )}
              </div>
              
              {signupType === 'full_access' && (
                <>
                  <div>
                    <Label htmlFor="key_courses" className="text-[#333333] font-medium">Key Courses/Classes Taken (Optional)</Label>
                    <Textarea
                      id="key_courses"
                      value={formData.key_courses}
                      onChange={(e) => handleInputChange('key_courses', e.target.value)}
                      className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      rows={3}
                      placeholder="e.g., Digital Marketing, Business Communications, Sports Management"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple courses with commas
                    </p>
                  </div>
    
                  <div>
                    <Label htmlFor="languages" className="text-[#333333] font-medium">Languages Spoken *</Label>
                    <Input
                      id="languages"
                      required
                      value={formData.languages}
                      onChange={(e) => handleInputChange('languages', e.target.value)}
                      className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      placeholder="e.g., English, Spanish, Mandarin"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple languages with commas
                    </p>
                  </div>
    
                  <div>
                    <Label htmlFor="future_goals" className="text-[#333333] font-medium">Future Career Goals *</Label>
                    <Textarea
                      id="future_goals"
                      required
                      value={formData.future_goals}
                      onChange={(e) => handleInputChange('future_goals', e.target.value)}
                      className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      rows={4}
                      placeholder="Describe your career aspirations..."
                    />
                  </div>
    
                  <div>
                    <Label htmlFor="resume" className="text-[#333333] font-medium">Resume/CV Upload (Optional)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                      />
                      {uploading && resumeFile && <span className="text-sm text-gray-500">Uploading...</span>}
                      {formData.resume_url && <CheckCircle2 className="w-5 h-5 text-[#946b56]" />}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Social & Personal */}
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45]">
                Social & Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label htmlFor="total_followers" className="text-[#333333] font-medium">Total Social Media Followers *</Label>
                <Input
                  id="total_followers"
                  type="number"
                  required
                  value={formData.total_followers}
                  onChange={(e) => handleInputChange('total_followers', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  placeholder="10000"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="instagram" className="text-[#333333] font-medium">Instagram Profile URL *</Label>
                  <Input
                    id="instagram"
                    type="url"
                    required
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok" className="text-[#333333] font-medium">TikTok Profile URL *</Label>
                  <Input
                    id="tiktok"
                    type="url"
                    required
                    value={formData.tiktok}
                    onChange={(e) => handleInputChange('tiktok', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="https://tiktok.com/@yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter" className="text-[#333333] font-medium">Twitter/X URL (Optional)</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin" className="text-[#333333] font-medium">LinkedIn URL (Optional)</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="https://linkedin.com/in/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="snapchat" className="text-[#333333] font-medium">Snapchat URL (Optional)</Label>
                  <Input
                    id="snapchat"
                    type="url"
                    value={formData.snapchat}
                    onChange={(e) => handleInputChange('snapchat', e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="https://snapchat.com/add/yourusername"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="interests_hobbies" className="text-[#333333] font-medium">Interests & Hobbies *</Label>
                <Textarea
                  id="interests_hobbies"
                  required
                  value={formData.interests_hobbies}
                  onChange={(e) => handleInputChange('interests_hobbies', e.target.value)}
                  className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                  rows={3}
                  placeholder="e.g., Fitness, Travel, Photography"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple interests with commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Info */}
          <Card className="border border-[#E7E0DA] shadow-lg bg-white">
            <CardHeader className="border-b border-[#E7E0DA]">
              <CardTitle className="text-2xl font-bold text-[#1C2E45] flex items-center gap-3">
                <Target className="w-7 h-7" />
                Affiliate Partnership Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label htmlFor="affiliate_code_suggestion" className="text-[#333333] font-medium">Preferred Affiliate Code</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Choose a unique code (e.g., NATALIA10, JOHNFIT). This will be used for your affiliate partnerships.
                </p>
                <div className="relative">
                  <Input
                    id="affiliate_code_suggestion"
                    value={formData.affiliate_code_suggestion}
                    onChange={(e) => handleAffiliateCodeChange(e.target.value)}
                    className="mt-2 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
                    placeholder="e.g., JOHNSMITH10"
                  />
                  {codeValidating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {codeError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 mb-2">{codeError}</p>
                    {suggestedCodes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {suggestedCodes.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleInputChange('affiliate_code_suggestion', suggestion);
                              setCodeError('');
                              setSuggestedCodes([]);
                            }}
                            className="px-3 py-1 bg-white border border-red-300 text-red-800 rounded-md text-sm hover:bg-red-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {formData.affiliate_code_suggestion && !codeError && !codeValidating && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Code available!
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="affiliate_code_type" className="text-[#333333] font-medium">Code Usage (Optional)</Label>
                <Select value={formData.affiliate_code_type} onValueChange={(value) => handleInputChange('affiliate_code_type', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Who will use this code?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="team">Team Code</SelectItem>
                    <SelectItem value="athletic_department">Athletic Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              size="lg"
              disabled={createProfileMutation.isPending || uploading || codeValidating}
              className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium py-6 text-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              {createProfileMutation.isPending ? "Creating Profile..." : (codeValidating ? "Checking Code..." : "Create Athlete Profile")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
