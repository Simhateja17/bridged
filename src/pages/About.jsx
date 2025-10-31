
import React from 'react';
import { Award, Handshake, Target, Users, Briefcase, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 heading-font">
            About Bridged
          </h1>
          <p className="text-xl text-[#DED4C4] max-w-2xl mx-auto text-medium">
            Empowering athletes to build a future beyond the game through meaningful career opportunities.
          </p>
        </div>
      </div>

      {/* Our Mission */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Handshake className="w-16 h-16 text-[#946b56] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#1C2E45] mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed text-medium">
            At Bridged, we believe the skills, discipline, and drive that create a great athlete are the same qualities that build a great professional. Our mission is to connect talented student-athletes with forward-thinking companies for internships, affiliate partnerships, and authentic brand collaborations. We provide a comprehensive platform that handles everything from discovery and onboarding to project management and payments, allowing athletes to gain invaluable career experience while enabling companies to tap into a unique and motivated talent pool.
          </p>
        </div>
      </div>

      {/* Founder Story */}
      <div className="bg-gradient-to-br from-[#946b56] to-[#a98471] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 heading-font">
              Built by Athletes, for Athletes
            </h2>
            <p className="text-xl leading-relaxed text-[#DED4C4] mb-6">
              Bridged was created by a current college athlete who experienced firsthand the challenges of balancing sports, academics, and building a professional future. After seeing talented teammates struggle to find meaningful opportunities beyond athletics, it became clear that there was a need for change.
            </p>
            <p className="text-lg leading-relaxed text-white/90 mb-8">
              This platform was born from that real-world experience understanding the unique schedule demands, the desire for authentic partnerships, and the need for a system that truly supports athletes' career development. Bridged isn't just a marketplace; it's a movement to empower student-athletes to leverage their skills, build their brands, and create opportunities that extend far beyond the field.
            </p>
            
            {/* Co-Founder Quote */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 mt-12">
              <div className="text-6xl text-[#DED4C4] mb-4">"</div>
              <p className="text-lg leading-relaxed text-white italic mb-6">
                As a college athlete, I watched so many of my teammates struggle to find their footing once their playing days ended. We spent years giving everything to our sport, but no one prepared us for what came next. I founded Bridged because I believe every athlete deserves more than just a season they deserve a future. After seeing firsthand how difficult the transition can be, I wanted to create a platform that connects athletes with opportunities, mentorship, and purpose beyond the field.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-[#DED4C4]"></div>
                <p className="text-[#DED4C4] font-semibold text-base">
                  Natalia Bowles, Co-Founder, Bridged
                </p>
                <div className="h-px w-12 bg-[#DED4C4]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1C2E45] mb-4">A Platform for Growth</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">We provide the infrastructure for successful partnerships to flourish.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md">
                <Users className="w-8 h-8 text-[#1C2E45]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#1C2E45]">For Athletes</h3>
              <p className="text-gray-600 text-medium">Showcase your skills, connect with innovative companies, and gain real-world experience that complements your athletic and academic journey. Build your resume, your network, and your future.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#1C2E45]">For Companies</h3>
              <p className="text-gray-600 text-medium">Discover a pipeline of ambitious, disciplined talent. Post opportunities, manage collaborations, and build authentic connections that resonate with your brand values and audience.</p>
            </div>
            <div className="text-center p-6 lg:col-span-1 md:col-span-2">
              <div className="w-16 h-16 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#1C2E45]">End-to-End Management</h3>
              <p className="text-gray-600 text-medium">From digital onboarding and contract signing to deliverable tracking and automated payments, our platform streamlines the entire partnership lifecycle for a secure and efficient experience.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Join Us CTA */}
      <div className="py-20 bg-[#F8F5F2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#1C2E45] mb-6">Join the Bridged Community</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Whether you're an athlete ready to take the next step in your career or a company looking for exceptional talent, we invite you to join us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("AthleteSignup")}>
              <Button size="lg" className="bg-[#1C2E45] hover:bg-[#2A3F5F] text-white">Join as an Athlete</Button>
            </Link>
            <Link to={createPageUrl("CompanySignup")}>
              <Button size="lg" variant="outline" className="border-[#1C2E45] text-[#1C2E45] hover:bg-[#1C2E45] hover:text-white">Join as a Company</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
