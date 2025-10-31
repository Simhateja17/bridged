
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Handshake,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Video,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  FileText,
  Presentation,
  TrendingUpIcon,
  Camera,
  Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const { data: featuredBlogs } = useQuery({
    queryKey: ['featured-blogs'],
    queryFn: () => base44.entities.BlogPost.filter({ is_featured: true }, '-created_date', 3),
    initialData: [],
    retry: false,
    onError: (error) => {
      console.log('Unable to fetch featured blogs:', error);
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C2E45] via-[#2A3F5F] to-[#1C2E45]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight opacity-90">
              Bridged: A
              <span className="text-[#DED4C4]"> Future Beyond the Game</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#DED4C4] mb-12 leading-relaxed">
              Unlock partnership opportunities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("AthleteSignup")}>
                <Button size="lg" className="bg-[#DED4C4] hover:bg-[#E7E0DA] text-[#1C2E45] text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Users className="w-5 h-5 mr-2" />
                  Join as Athlete
                </Button>
              </Link>
              <Link to={createPageUrl("PartnershipApplication")}>
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1C2E45] text-lg px-8 py-6 rounded-xl transition-all duration-300">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Apply for a Partnership
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <span className="text-[#DED4C4]/80">Already have an account? </span>
              <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="font-semibold text-white hover:text-[#DED4C4] underline underline-offset-4 transition-colors"
              >
                  Log In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4">
              How Bridged Works
            </h2>
            <p className="text-xl text-[#333333] max-w-2xl mx-auto">
              A seamless platform connecting talent with opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#F8F5F2]">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Athletes Create Profiles
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Showcase your academic achievements, athletic background, social presence, and unique strengths to stand out to top companies.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#F8F5F2]">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Briefcase className="w-8 h-8 text-[#1C2E45]" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Companies Post Opportunities
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Share internships and affiliate partnerships, specifying preferred majors, responsibilities, and the ideal candidate profile.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#F8F5F2]">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Handshake className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Connect & Partner
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Message directly, confirm partnerships, and access our onboarding portal with task tracking, deliverables, and secure payments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Bridged */}
      <section className="py-20 bg-[#F8F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4">
              An End-to-End Partnership Platform
            </h2>
            <p className="text-xl text-[#333333] max-w-3xl mx-auto">
              We provide the tools to discover talent, manage partnerships, and process payments—all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Award, text: "Access a verified network of talented student-athletes." },
              { icon: Target, text: "Post internship and affiliate opportunities in minutes." },
              { icon: CheckCircle2, text: "Manage deliverables, track progress, and communicate seamlessly." },
              { icon: TrendingUp, text: "Onboard talent with digital agreements and compliance tracking." },
              { icon: Users, text: "Automate monthly stipends and commission payouts." },
              { icon: Briefcase, text: "Secure, transparent, and built for meaningful partnerships." }
            ].map((item, index) => (
              <Card key={index} className="border border-[#E7E0DA] bg-white hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <item.icon className="w-6 h-6 text-[#1C2E45]" />
                  </div>
                  <p className="text-[#333333] leading-relaxed text-lg">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book a Campaign */}
      <section className="py-20 bg-[#1C2E45]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Camera className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#DED4C4] mb-4 heading-font">
              Book a Campaign
            </h2>
            <p className="text-xl text-[#DED4C4] max-w-3xl mx-auto leading-relaxed text-medium">
              Create authentic, high-impact content by partnering with our talented student-athletes. Our fully-managed campaigns make it simple to produce professional assets for your brand.
            </p>
            <div className="mt-12">
               <Link to={createPageUrl("BookCampaign")}>
                  <Button size="lg" className="bg-[#DED4C4] hover:bg-[#E7E0DA] text-[#1C2E45] text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 admin-button">
                    Learn More & Apply <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* Student Success Hub */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4">
              Student Success Hub
            </h2>
            <p className="text-xl text-[#333333] max-w-2xl mx-auto">
              Masterclasses, tips, and insights to accelerate your career
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-[#F8F5F2]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#1C2E45] mb-3 group-hover:text-[#946b56] transition-colors">
                      Quick Success Tips
                    </h3>
                    <p className="text-[#333333] mb-4 leading-relaxed">
                      Actionable advice on personal branding, time management, networking, and more.
                    </p>
                    <Link to={createPageUrl("Blog")}>
                      <Button variant="ghost" className="text-[#1C2E45] hover:text-[#946b56] p-0 h-auto font-medium">
                        Explore Tips <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-[#F8F5F2]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#1C2E45] mb-3 group-hover:text-[#946b56] transition-colors">
                      Masterclasses & Videos
                    </h3>
                    <p className="text-[#333333] mb-4 leading-relaxed">
                      In-depth workshops and video content from industry professionals and successful alumni.
                    </p>
                    <Link to={createPageUrl("Blog")}>
                      <Button variant="ghost" className="text-[#1C2E45] hover:text-[#946b56] p-0 h-auto font-medium">
                        Watch Now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Blog Posts */}
          {featuredBlogs.length > 0 && (
            <div>
              <h3 className="text-3xl font-bold text-[#1C2E45] mb-8 text-center">
                Featured Content
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredBlogs.map((blog) => (
                  <Card key={blog.id} className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
                    {blog.thumbnail_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={blog.thumbnail_url}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ transform: 'translateZ(0)' }}
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="text-xs font-semibold text-[#946b56] mb-2 uppercase tracking-wider">
                        {blog.category.replace(/_/g, ' ')}
                      </div>
                      <h4 className="text-xl font-bold text-[#1C2E45] mb-3 group-hover:text-[#946b56] transition-colors">
                        {blog.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">By {blog.author}</p>
                      <Link to={createPageUrl(`BlogPost?slug=${blog.slug}`)}>
                        <Button variant="ghost" className="text-[#1C2E45] hover:text-[#946b56] p-0 h-auto font-medium">
                          Read More <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Share Your Expertise */}
      <section className="py-20 bg-[#F8F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <GraduationCap className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-4">
              Share Your Expertise
            </h2>
            <p className="text-xl text-[#333333] max-w-3xl mx-auto leading-relaxed">
              Are you an industry professional, successful alumni, or career expert? Help the next generation of student-athletes by contributing your knowledge through master classes and blog content.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border border-[#E7E0DA] bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Industry Professionals
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Share insights from your career journey and help athletes understand industry expectations.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Award className="w-8 h-8 text-[#1C2E45]" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Successful Alumni
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Mentor current athletes by sharing your transition from sports to professional success.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <TrendingUpIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2E45] mb-4">
                  Career Experts
                </h3>
                <p className="text-[#333333] leading-relaxed">
                  Contribute specialized knowledge in areas like personal branding, networking, and career development.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border border-[#E7E0DA] bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-xl flex items-center justify-center shadow-sm">
                    <Presentation className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1C2E45]">
                    Master Classes
                  </h3>
                </div>
                <ul className="space-y-3 text-[#333333]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Live or recorded video sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Interactive workshops and Q&A</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Specialized skill development</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Industry-specific guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-xl flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1C2E45]">
                    Blog Articles
                  </h3>
                </div>
                <ul className="space-y-3 text-[#333333]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Career transition stories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Industry insights and trends</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Practical tips and strategies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#946b56] flex-shrink-0 mt-0.5" />
                    <span>Personal development advice</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link to={createPageUrl("ContentProposal")}>
              <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <FileText className="w-5 h-5 mr-2" />
                Submit Content Proposal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-16 h-16 text-[#1C2E45] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-6">
            Ready to Build Your Future?
          </h2>
          <p className="text-xl text-[#333333] mb-10 leading-relaxed">
            Join thousands of athletes and companies creating meaningful partnerships through Bridged.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("AthleteSignup")}>
              <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started as an Athlete
              </Button>
            </Link>
            <Link to={createPageUrl("CompanySignup")}>
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-[#1C2E45] text-[#1C2E45] hover:bg-[#1C2E45] hover:text-white text-lg px-8 py-6 rounded-xl transition-all duration-300">
                Join as a Company
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
