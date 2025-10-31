
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import {
  User,
  GraduationCap,
  MapPin,
  Calendar,
  Globe,
  Target,
  Award,
  Briefcase,
  FileText,
  Instagram,
  Music2,
  Twitter,
  Linkedin,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Video,
  BookOpen,
  ShieldCheck
} from "lucide-react";

const SPORT_ICONS = {
  "Basketball": "🏀",
  "Football": "🏈",
  "Soccer": "⚽",
  "Baseball": "⚾",
  "Volleyball": "🏐",
  "Tennis": "🎾",
  "Track & Field": "🏃",
  "Swimming": "🏊",
  "Golf": "⛳",
  "Hockey": "🏒",
};

const createPageUrl = (path) => {
  return `/${path}`;
};

export default function AthleteProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const athleteId = urlParams.get('id');

  const { data: athlete, isLoading } = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: async () => {
      const athletes = await base44.entities.User.filter({ id: athleteId });
      return athletes[0];
    },
    enabled: !!athleteId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const allConversations = await base44.entities.Conversation.filter({});

      const existing = allConversations.find(conv => {
          const convParticipants = conv.participant_ids || [];
          return convParticipants.length === 2 &&
                 convParticipants.includes(currentUser.id) &&
                 convParticipants.includes(athleteId);
      });

      if (existing) {
        window.location.href = createPageUrl(`Messages?conversation_id=${existing.id}`);
        return;
      }

      const conversation = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, athleteId],
        participant_details: [
          {
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_photo_url: currentUser.photo_url
          },
          {
            user_id: athlete.id,
            user_name: athlete.full_name,
            user_photo_url: athlete.photo_url
          }
        ]
      });

      window.location.href = createPageUrl(`Messages?conversation_id=${conversation.id}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full rounded-xl mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Athlete Not Found</h2>
          <p className="text-gray-600">The athlete profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!athlete.verified_athlete) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="text-center p-8">
            <ShieldCheck className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-[#1C2E45] mb-2">Profile Under Review</h2>
            <p className="text-gray-600 max-w-md">This athlete's profile is currently pending verification and is not publicly visible. Please check back later.</p>
        </div>
      </div>
    );
  }

  const sportIcon = SPORT_ICONS[athlete.sport] || "🏆";

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-[#946b56] shadow-2xl flex-shrink-0">
              {athlete.photo_url ? (
                <img
                  src={athlete.photo_url}
                  alt={athlete.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#946b56] to-[#a98471] flex items-center justify-center text-6xl">
                  {sportIcon}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold">{athlete.full_name}</h1>
                <Badge className="bg-[#946b56] text-white text-base px-4 py-1 border-none">
                  {sportIcon} {athlete.sport}
                </Badge>
                {athlete.verified_athlete && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-base">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Verified
                    </Badge>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-[#946b56] text-lg">
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-medium">{athlete.major}</span>
                  {athlete.double_major && (
                    <>
                      <span>•</span>
                      <span>{athlete.double_major}</span>
                    </>
                  )}
                  {athlete.minor && (
                    <>
                      <span>•</span>
                      <span className="text-base">Minor: {athlete.minor}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {athlete.school}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Class of {athlete.graduation_year}
                  </div>
                  {athlete.region && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {athlete.region}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {athlete.instagram && (
                  <a
                    href={athlete.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm">Instagram</span>
                  </a>
                )}
                {athlete.tiktok && (
                  <a
                    href={athlete.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Music2 className="w-4 h-4" />
                    <span className="text-sm">TikTok</span>
                  </a>
                )}
                {athlete.twitter && (
                  <a
                    href={athlete.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                )}
                {athlete.linkedin && (
                  <a
                    href={athlete.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                {athlete.snapchat && (
                  <a
                    href={athlete.snapchat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Snapchat</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="lg"
                className="bg-[#946b56] hover:bg-[#a98471] text-white font-medium"
                onClick={() => startConversationMutation.mutate()}
                disabled={startConversationMutation.isPending}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {startConversationMutation.isPending ? "Opening..." : "Contact Athlete"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {athlete.bio && (
              <Card className="border border-[#E7E0DA] shadow-lg bg-white">
                <CardHeader className="border-b border-[#E7E0DA]">
                  <CardTitle className="flex items-center gap-3 text-[#1C2E45]">
                    <User className="w-6 h-6" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-[#333333] leading-relaxed text-medium whitespace-pre-line">
                    {athlete.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[#1C2E45]">
                  <User className="w-6 h-6 text-[#946b56]" />
                  Personal Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#946b56]" />
                    <span className="text-medium">Personal Information</span>
                  </div>
                  <ul className="pl-6 space-y-2 text-gray-700">
                    {athlete.date_of_birth && <li><strong>DOB:</strong> {format(new Date(athlete.date_of_birth), 'MMMM d, yyyy')}</li>}
                    {athlete.region && <li><strong>Region:</strong> {athlete.region}</li>}
                    {athlete.languages?.length > 0 && <li><strong>Languages:</strong> {athlete.languages.join(', ')}</li>}
                  </ul>
                </div>

                <div className="bg-white/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#946b56]" />
                    <span className="text-medium">Strengths & Traits</span>
                  </div>
                  {athlete.strengths_traits?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {athlete.strengths_traits.map((trait, index) => (
                        <Badge key={index} variant="secondary" className="bg-[#946b56] text-white">{trait}</Badge>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-600">No strengths listed.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[#1C2E45]">
                  <GraduationCap className="w-6 h-6 text-[#946b56]" />
                  Academic Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p><strong>GPA:</strong> {athlete.gpa || 'N/A'}</p>
                {athlete.key_courses?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-medium">Key Courses:</h4>
                    <div className="flex flex-wrap gap-2">
                      {athlete.key_courses.map((course, index) => (
                        <Badge key={index} variant="outline" className="border-[#E7E0DA] bg-[#F8F5F2]">{course}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {athlete.future_goals && (
                  <div>
                    <h4 className="font-semibold mb-2 text-medium flex items-center gap-2">
                      <Target className="w-4 h-4"/>
                      Future Career Goals
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{athlete.future_goals}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[#1C2E45]">
                  <Award className="w-6 h-6 text-[#946b56]" />
                  Athletic Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {athlete.highlight_reel_url && (
                  <Button
                    onClick={() => window.open(athlete.highlight_reel_url, "_blank")}
                    className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Watch Highlight Reel
                  </Button>
                )}
                {athlete.nil_experience && (
                  <div>
                    <h4 className="font-semibold mb-2 text-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4"/>
                      NIL Experience
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{athlete.nil_experience}</p>
                  </div>
                )}
              </CardContent>
            </Card>

             <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[#1C2E45]">
                  <BookOpen className="w-6 h-6 text-[#946b56]" />
                  Interests & Hobbies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.interests_hobbies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {athlete.interests_hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary" className="bg-[#F8F5F2] text-[#1C2E45] border border-[#E7E0DA]">{hobby}</Badge>
                    ))}
                  </div>
                ) : <p className="text-gray-700">No interests listed.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-[#1C2E45]">
                  <TrendingUp className="w-5 h-5 text-[#946b56]" />
                  Social Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {athlete.total_followers && <p><strong>Total Followers:</strong> {Number(athlete.total_followers).toLocaleString()}</p>}
                {athlete.instagram && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2" 
                    onClick={() => window.open(athlete.instagram, '_blank')}
                  >
                    <Instagram className="w-5 h-5 mr-3 text-[#946b56]"/> Instagram
                  </Button>
                )}
                {athlete.tiktok && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2" 
                    onClick={() => window.open(athlete.tiktok, '_blank')}
                  >
                    <Music2 className="w-5 h-5 mr-3 text-[#946b56]"/> TikTok
                  </Button>
                )}
                {athlete.twitter && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2" 
                    onClick={() => window.open(athlete.twitter, '_blank')}
                  >
                    <Twitter className="w-5 h-5 mr-3 text-[#946b56]"/> Twitter
                  </Button>
                )}
                {athlete.linkedin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2" 
                    onClick={() => window.open(athlete.linkedin, '_blank')}
                  >
                    <Linkedin className="w-5 h-5 mr-3 text-[#946b56]"/> LinkedIn
                  </Button>
                )}
                {athlete.snapchat && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2" 
                    onClick={() => window.open(athlete.snapchat, '_blank')}
                  >
                    <MessageCircle className="w-5 h-5 mr-3 text-[#946b56]"/> Snapchat
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-[#1C2E45]">
                  <FileText className="w-5 h-5 text-[#946b56]" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.resume_url ? (
                  <Button
                    onClick={() => window.open(athlete.resume_url, "_blank")}
                    className="w-full bg-[#946b56] hover:bg-[#a98471] text-white"
                  >
                    View Resume
                  </Button>
                ) : (
                  <p className="text-sm text-gray-600">No resume uploaded.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#E7E0DA] bg-gradient-to-br from-[#946b56] to-[#a98471] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <Target className="w-5 h-5" />
                  Partnership Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <p><strong>Suggested Code:</strong> {athlete.affiliate_code_suggestion || 'N/A'}</p>
                  <p><strong>Code Type:</strong> {athlete.affiliate_code_type || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
