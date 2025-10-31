import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Briefcase, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyCard from "../components/companies/CompanyCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Opportunities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  
  const { data: user } = useQuery({
      queryKey: ['currentUser'],
      queryFn: () => base44.auth.me()
  });

  const { data: internshipCompanies, isLoading } = useQuery({
    queryKey: ['internship-companies'],
    queryFn: async () => {
      const allCompanies = await base44.entities.Company.list('-created_date');
      return allCompanies.filter(c => c.opportunity_type === 'internship' || c.opportunity_type === 'both');
    },
    initialData: [],
  });

  const filteredCompanies = internshipCompanies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.preferred_majors?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMajor = majorFilter === "all" || company.preferred_majors?.includes(majorFilter);
    
    return matchesSearch && matchesMajor;
  });

  const uniqueMajors = [...new Set(internshipCompanies.flatMap(c => c.preferred_majors || []))];
  
  const postOpportunityUrl = user?.account_type === 'company' ? createPageUrl("CompanyDashboard") : createPageUrl("CompanySignup");

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Briefcase className="w-16 h-16 text-[#DED4C4] mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Internship Opportunities
              </h1>
              <p className="text-xl text-[#DED4C4] max-w-2xl text-medium">
                Discover meaningful internship opportunities with companies looking for talented student-athletes. Gain real-world experience while pursuing your athletic and academic goals.
              </p>
            </div>
            <Link to={postOpportunityUrl}>
              <Button size="lg" className="bg-[#DED4C4] hover:bg-[#E7E0DA] text-[#1C2E45] shadow-lg font-medium">
                <Plus className="w-5 h-5 mr-2" />
                Post Opportunity
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Internship Benefits */}
      <div className="bg-white py-12 border-b border-[#E7E0DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#1C2E45] mb-2">$252+ / month</div>
              <p className="text-sm text-gray-600 text-medium">Guaranteed Stipend</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C2E45] mb-2">18-25 hrs/month</div>
              <p className="text-sm text-gray-600 text-medium">Flexible Schedule</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C2E45] mb-2">3 months</div>
              <p className="text-sm text-gray-600 text-medium">Contract Duration</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C2E45] mb-2">Real-World</div>
              <p className="text-sm text-gray-600 text-medium">Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#E7E0DA] sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search internships by company, description, or major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
              />
            </div>

            <Select value={majorFilter} onValueChange={setMajorFilter}>
              <SelectTrigger className="h-12 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by major" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Majors</SelectItem>
                {uniqueMajors.map(major => (
                  <SelectItem key={major} value={major}>{major}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Internships Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-500 mb-2">No internship opportunities found</p>
            <p className="text-gray-400">Check back soon for new postings or adjust your filters.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg text-gray-600 text-medium">
                Showing <span className="font-semibold text-[#1C2E45]">{filteredCompanies.length}</span> internship opportunit{filteredCompanies.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}