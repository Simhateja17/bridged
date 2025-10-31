
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Target, ExternalLink, TrendingUp, Building2, CheckCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ApplyDialog = ({ campaign, user, existingPartnership }) => {
    const [alias, setAlias] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const applyMutation = useMutation({
        mutationFn: (data) => base44.entities.AffiliatePartnership.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['athleteAffiliatePartnerships', user.id]);
            alert("Application submitted successfully!");
            setIsOpen(false);
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
    });

    const handleSubmit = () => {
        if (!alias.trim()) {
            alert("Please suggest a code name.");
            return;
        }
        applyMutation.mutate({
            campaign_id: campaign.id,
            athlete_id: user.id,
            company_id: campaign.company_id,
            athlete_name: user.full_name,
            company_name: campaign.company_name,
            athlete_preferred_alias: alias,
        });
    };
    
    if (existingPartnership) {
        return (
            <Button disabled className="flex-1 bg-green-600 text-white font-medium">
                <CheckCircle className="w-5 h-5 mr-2" />
                Applied
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="flex-1 bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium">
                    Apply as Ambassador
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply for: {campaign.company_name}</DialogTitle>
                    <DialogDescription>
                        Suggest a preferred name for your unique affiliate code. This will be combined with the main campaign code.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="alias">Preferred Code Name</Label>
                    <Input 
                        id="alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="e.g., NATALIAFIT"
                    />
                    <p className="text-xs text-gray-500 mt-2">Example resulting code: <span className="font-mono bg-gray-100 p-1 rounded">{campaign.main_affiliate_code}-{alias.toUpperCase()}</span></p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={applyMutation.isPending}>
                        {applyMutation.isPending ? "Submitting..." : <>Submit Application <Send className="w-4 h-4 ml-2" /></>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function Partners() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['affiliate-campaigns'],
    queryFn: () => base44.entities.AffiliateCampaign.filter({ status: 'Active' }, '-created_date'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: athletePartnerships } = useQuery({
      queryKey: ['athleteAffiliatePartnerships', user?.id],
      queryFn: () => base44.entities.AffiliatePartnership.filter({ athlete_id: user.id }),
      enabled: !!user && user.account_type === 'athlete'
  });

  const getPartnershipForCampaign = (campaignId) => {
      return athletePartnerships?.find(p => p.campaign_id === campaignId);
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Affiliate Partner Brands
          </h1>
          <p className="text-xl text-[#DED4C4] max-w-2xl mx-auto mb-8 text-medium">
            Partner with top brands as an affiliate ambassador. Create personalized codes and keep 80% of commissions—Bridged takes a 20% service fee.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge className="bg-[#DED4C4] text-[#1C2E45] text-base px-4 py-2 border-none">
              <TrendingUp className="w-4 h-4 mr-2" />
              Earn Passive Income
            </Badge>
            <Badge className="bg-white/10 text-white text-base px-4 py-2 border-white/20">
              <Target className="w-4 h-4 mr-2" />
              Personalized Codes
            </Badge>
          </div>
        </div>
      </div>

      {/* Partner Benefits */}
      <div className="bg-white py-12 border-b border-[#E7E0DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#DED4C4] to-[#E7E0DA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[#1C2E45]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C2E45] mb-2">
                Custom Affiliate Codes
              </h3>
              <p className="text-gray-600 text-medium">
                Co-create personalized codes that reflect your brand and resonate with your audience.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#946b56] to-[#a98471] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1C2E45] mb-2">
                Fair Revenue Split
              </h3>
              <p className="text-gray-600 text-medium">
                You keep 80% of the commission—transparent and straightforward.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1C2E45] mb-2">
                Onboarding Support
              </h3>
              <p className="text-gray-600 text-medium">
                Access our partnership portal with tracking, deliverables, and payment management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Partners Grid */}
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
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-500 mb-2">No affiliate partners yet</p>
            <p className="text-gray-400">Check back soon for exciting partnership opportunities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-[#DED4C4]" />
                  </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-[#1C2E45] mb-2 group-hover:text-[#946b56] transition-colors">
                    {campaign.company_name}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 text-medium">
                    {campaign.terms}
                  </p>

                  <div className="bg-gradient-to-r from-[#DED4C4]/10 to-[#DED4C4]/5 rounded-lg p-4 mb-4 border border-[#E7E0DA]">
                      <p className="text-sm font-semibold text-[#1C2E45] mb-1">
                        Partnership Details
                      </p>
                      <p className="text-sm text-gray-600 text-medium">
                        {campaign.product_name} • {campaign.commission_structure}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        You keep 80% of the commission
                      </p>
                    </div>

                  <div className="flex gap-3">
                    {user?.account_type === 'athlete' ? (
                       <ApplyDialog campaign={campaign} user={user} existingPartnership={getPartnershipForCampaign(campaign.id)} />
                    ) : (
                        <Button disabled className="flex-1 bg-[#1C2E45] hover:bg-[#2A3F5F] text-white font-medium">
                            Login as Athlete to Apply
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
