
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, MapPin, Target, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function AthleteCard({ athlete }) {
  const sportIcon = SPORT_ICONS[athlete.sport] || "🏆";

  return (
    <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden bg-white">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F]">
        {athlete.photo_url ? (
          <img
            src={athlete.photo_url}
            alt={athlete.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {sportIcon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Sport Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-[#DED4C4] text-[#1C2E45] border-none font-semibold text-sm px-3 py-1">
            {sportIcon} {athlete.sport}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Name and Verification */}
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold text-[#1C2E45] group-hover:text-[#946b56] transition-colors">
              {athlete.full_name}
            </h3>
            {athlete.verification_status === 'verified' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    Verified
                </Badge>
            )}
        </div>

        {/* Major & Academic Info */}
        <div className="flex items-start gap-2 text-[#333333] mb-3">
          <GraduationCap className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#DED4C4]" />
          <div>
            <p className="font-semibold">{athlete.major}</p>
            {(athlete.double_major || athlete.minor) && (
              <p className="text-sm text-gray-600">
                {athlete.double_major && `Double Major: ${athlete.double_major}`}
                {athlete.double_major && athlete.minor && " • "}
                {athlete.minor && `Minor: ${athlete.minor}`}
              </p>
            )}
          </div>
        </div>

        {/* School & Graduation Year */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b border-[#E7E0DA]">
          <MapPin className="w-4 h-4 text-[#DED4C4]" />
          <span className="font-semibold">{athlete.school}</span>
          <span className="text-gray-400">•</span>
          <span>Class of {athlete.graduation_year}</span>
        </div>

        {/* Future Career Goals */}
        {athlete.future_goals && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#DED4C4]" />
              <p className="text-sm font-semibold text-[#333333]">Career Goals</p>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {athlete.future_goals}
            </p>
          </div>
        )}

        {/* View Profile Button */}
        <Link to={createPageUrl(`AthleteProfile?id=${athlete.id}`)}>
          <Button className="w-full bg-[#1C2E45] hover:bg-[#2A3F5F] text-white">
            View Full Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
