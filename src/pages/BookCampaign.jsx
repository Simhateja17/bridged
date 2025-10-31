
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Building, Users, ArrowRight, CheckCircle, DollarSign, Star } from 'lucide-react';

export default function BookCampaign() {
  useEffect(() => {
    document.title = 'Confirm Simplified Payment Simulation';
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C2E45] via-[#2A3F5F] to-[#1C2E45]">
        <div className="absolute inset-0 bg-[url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f05187ddeac353e5298844/326e95237_tempImageSH570k.jpg')] opacity-10 bg-contain bg-center bg-no-repeat grayscale" />
        <div className="my-6 px-3 py-24 relative max-w-7xl sm:px-6 lg:px-8 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Camera className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight opacity-90 heading-font">
              Book a Campaign
            </h1>
            <p className="text-xl md:text-2xl text-[#DED4C4] mb-12 leading-relaxed text-medium">
              Authentic content, powerful results. Partner with talented student-athletes to create campaigns that resonate with your audience.
            </p>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-xl flex items-center justify-center shadow-sm">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-[#1C2E45] heading-font">For Companies</h2>
              </div>
              <p className="text-xl text-gray-600 mb-6 text-medium">
                Elevate your brand with high-quality, authentic content created by dedicated student-athletes.
              </p>
              <Card className="bg-[#F8F5F2] border border-[#E7E0DA] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#1C2E45] flex justify-between items-center">
                    <span>Content Partnership Package</span>
                    <span className="text-3xl font-bold text-[#946b56]">$625</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#333333]">Our flat-fee package includes everything you need to generate engaging social media and website content.</p>
                  <ul className="space-y-3 text-[#333333]">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>**Two (2) short-form ad clips** perfect for social media platforms like TikTok and Instagram Reels.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>**Professional photography** featuring our selected athletes with your product.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>A streamlined process managed entirely by the Bridged team.</span>
                    </li>
                  </ul>
                  <Link to={createPageUrl("CompanySignup")}>
                    <Button size="lg" className="w-full mt-4 bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg py-6 admin-button">
                      Apply for a Partnership <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f05187ddeac353e529844/92a1741a7_tempImage8IBlgJ.jpg" alt="Athletes in a photoshoot" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* For Athletes Section */}
      <section className="py-20 bg-[#F8F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="rounded-2xl overflow-hidden shadow-2xl order-last md:order-first">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f05187ddeac353e529844/ece7ff49e_tempImage7xddub.jpg" alt="Athlete posing" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-[#1C2E45]" />
                </div>
                <h2 className="text-4xl font-bold text-[#1C2E45] heading-font">For Athletes</h2>
              </div>
              <p className="text-xl text-gray-600 mb-6 text-medium">
                Ready for the spotlight? Join our exclusive model list to be featured in paid content shoots for top brands.
              </p>
              <Card className="bg-white border border-[#E7E0DA] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#1C2E45]">Join the Bridged Model List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#333333]">Apply to get on our exclusive list of athletes available for content partnerships. It's a great way to build your brand and earn money.</p>
                  <ul className="space-y-3 text-[#333333]">
                    <li className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>Get paid for professional photoshoots and video content creation.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>Gain exposure by working with exciting partner brands.</span>
                    </li>
                     <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                      <span>Simple application process and we handle all the logistics.</span>
                    </li>
                  </ul>
                   <Link to={createPageUrl("AthleteSignup")}>
                    <Button size="lg" className="w-full mt-4 bg-[#946b56] hover:bg-[#a98471] text-white text-lg py-6 admin-button">
                      Apply to the Model List <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>);

}
