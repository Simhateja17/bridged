
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AthleteCard from "../components/athletes/AthleteCard";
import SubscriptionGate from "@/components/auth/SubscriptionGate";

export default function Athletes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.User.filter({ 
      account_type: 'athlete', 
      verified_athlete: true 
    }, '-created_date'),
    initialData: [],
  });

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = !searchQuery || 
      athlete.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.sport?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSport = sportFilter === "all" || athlete.sport === sportFilter;
    const matchesMajor = majorFilter === "all" || athlete.major === majorFilter;
    
    return matchesSearch && matchesSport && matchesMajor;
  });

  const uniqueSports = [...new Set(athletes.map(a => a.sport).filter(Boolean))];
  const uniqueMajors = [...new Set(athletes.map(a => a.major).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A2A47] to-[#2A3A57] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Talented Athletes
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Browse profiles of college athletes ready to bring their skills, passion, and creativity to your brand.
          </p>
        </div>
      </div>
      <SubscriptionGate>
        {/* Filters */}
        <div className="bg-white border-b border-gray-200 sticky top-20 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search athletes by name, major, or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-[#C9A77D] focus:ring-[#C9A77D]"
                />
              </div>

              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-[#C9A77D] focus:ring-[#C9A77D]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {uniqueSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={majorFilter} onValueChange={setMajorFilter}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-[#C9A77D] focus:ring-[#C9A77D]">
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

        {/* Athletes Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500">No athletes found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-lg text-gray-600">
                  Showing <span className="font-semibold text-[#1A2A47]">{filteredAthletes.length}</span> athlete{filteredAthletes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAthletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>
            </>
          )}
        </div>
      </SubscriptionGate>
    </div>
  );
}
