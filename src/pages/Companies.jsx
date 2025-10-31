import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyCard from "../components/companies/CompanyCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
    initialData: [],
  });

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.preferred_majors?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || company.opportunity_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover Innovative Companies
              </h1>
              <p className="text-xl text-[#DED4C4] max-w-2xl text-medium">
                Discover innovative companies looking for the perfect intern to help make an impact.
              </p>
            </div>
            <Link to={createPageUrl("CompanySignup")}>
              <Button size="lg" className="bg-[#DED4C4] hover:bg-[#E7E0DA] text-[#1C2E45] shadow-lg font-medium">
                <Plus className="w-5 h-5 mr-2" />
                Join as a Company
              </Button>
            </Link>
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
                placeholder="Search companies by name, description, or majors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 border-[#E7E0DA] focus:border-[#1C2E45] focus:ring-[#1C2E45]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by opportunity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Opportunities</SelectItem>
                <SelectItem value="internship">Internships Only</SelectItem>
                <SelectItem value="affiliate">Affiliate Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
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
            <p className="text-2xl text-gray-500">No companies found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg text-gray-600 text-medium">
                Showing <span className="font-semibold text-[#1C2E45]">{filteredCompanies.length}</span> compan{filteredCompanies.length !== 1 ? 'ies' : 'y'}
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