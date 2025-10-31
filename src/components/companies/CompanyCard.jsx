import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, Target, Users, ExternalLink, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CompanyCard({ company }) {
  const isPlaceholder = company.status === 'coming_soon';
  
  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white">
      <CardHeader className="border-b border-gray-100 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-[#1C2E45] group-hover:text-[#DED4C4] transition-colors">
                {company.company_name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {isPlaceholder ? (
                  <Badge className="bg-gray-100 text-gray-600 border-none">
                    <Clock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                ) : (
                  <>
                    {company.opportunity_type === "internship" && (
                      <Badge className="bg-blue-100 text-blue-800 border-none">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Internships
                      </Badge>
                    )}
                    {company.opportunity_type === "affiliate" && (
                      <Badge className="bg-purple-100 text-purple-800 border-none">
                        <Target className="w-3 h-3 mr-1" />
                        Affiliate
                      </Badge>
                    )}
                    {company.opportunity_type === "both" && (
                      <>
                        <Badge className="bg-blue-100 text-blue-800 border-none">
                          <Briefcase className="w-3 h-3 mr-1" />
                          Internships
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 border-none">
                          <Target className="w-3 h-3 mr-1" />
                          Affiliate
                        </Badge>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Deadline & Hours for Internships */}
        {!isPlaceholder && (company.opportunity_type === "internship" || company.opportunity_type === "both") && (company.internship_deadline || company.internship_hours) && (
          <div className={`grid ${company.internship_deadline && company.internship_hours ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {company.internship_deadline && (
              <div className="bg-[#F8F5F2] rounded-lg p-4 border border-[#E7E0DA]">
                <div className="flex items-center gap-2 text-[#1C2E45]">
                  <Calendar className="w-5 h-5 text-[#DED4C4]" />
                  <div>
                    <p className="text-sm font-semibold text-medium">Application Deadline</p>
                    <p className="text-lg font-bold">{format(new Date(company.internship_deadline), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
            {company.internship_hours && (
              <div className="bg-[#F8F5F2] rounded-lg p-4 border border-[#E7E0DA]">
                <div className="flex items-center gap-2 text-[#1C2E45]">
                  <Clock className="w-5 h-5 text-[#DED4C4]" />
                  <div>
                    <p className="text-sm font-semibold text-medium">Time Commitment</p>
                    <p className="text-lg font-bold">{company.internship_hours} hrs/month</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {company.description && (
          <div>
            <p className="text-gray-600 leading-relaxed line-clamp-3">
              {company.description}
            </p>
          </div>
        )}

        {/* Requirements */}
        {!isPlaceholder && (company.opportunity_type === "internship" || company.opportunity_type === "both") && company.intern_description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#DED4C4]" />
              Requirements
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {company.intern_description}
            </p>
          </div>
        )}

        {/* Preferred Majors */}
        {!isPlaceholder && company.preferred_majors && company.preferred_majors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#DED4C4]" />
              <p className="text-sm font-semibold text-gray-700 text-medium">Preferred Majors</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.preferred_majors.map((major, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-[#F8F5F2] text-[#1C2E45] border border-[#E7E0DA]"
                >
                  {major}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3 pt-4">
          {isPlaceholder ? (
            <Button disabled className="flex-1 bg-gray-300 text-gray-600 cursor-not-allowed font-medium">
              <Clock className="w-5 h-5 mr-2" />
              Coming Soon
            </Button>
          ) : (
            <>
              <Button className="flex-1 bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium">
                View Opportunities
              </Button>
              {company.website && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#DED4C4] text-[#DED4C4] hover:bg-[#DED4C4] hover:text-[#1C2E45]"
                  onClick={() => window.open(company.website, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Payment Note for Internships */}
        {!isPlaceholder && (company.opportunity_type === "internship" || company.opportunity_type === "both") && (
          <p className="text-xs text-gray-500 italic pt-2 border-t border-gray-100">
            Payments will only be delivered once the deliverables from interns are completed and accepted.
          </p>
        )}
      </CardContent>
    </Card>
  );
}