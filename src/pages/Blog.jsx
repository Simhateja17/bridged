import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Blog() {
    const { data: blogs, isLoading } = useQuery({
        queryKey: ['all-blogs'],
        queryFn: () => base44.entities.BlogPost.list('-created_date'),
        initialData: [],
    });

    return (
        <div className="min-h-screen bg-[#F8F5F2]">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1C2E45] to-[#2A3F5F] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <BookOpen className="w-16 h-16 text-[#DED4C4] mx-auto mb-6" />
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 heading-font">
                        The Bridged Blog
                    </h1>
                    <p className="text-xl text-[#DED4C4] max-w-3xl mx-auto text-medium">
                        Insights, advice, and strategies for student-athletes and the companies that hire them.
                    </p>
                </div>
            </div>

            {/* Blog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array(9).fill(0).map((_, i) => (
                            <Card key={i} className="border border-[#E7E0DA] shadow-lg bg-white overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="p-6">
                                    <Skeleton className="h-4 w-1/3 mb-4" />
                                    <Skeleton className="h-6 w-full mb-2" />
                                    <Skeleton className="h-6 w-3/4 mb-4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-500">No articles found.</p>
                        <p className="text-gray-400 mt-2">Check back soon for new content!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Link key={blog.id} to={createPageUrl(`BlogPost?slug=${blog.slug}`)}>
                                <Card className="border border-[#E7E0DA] shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white h-full">
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
                                    <CardContent className="p-6 flex flex-col">
                                        <div className="text-xs font-semibold text-[#946b56] mb-2 uppercase tracking-wider">
                                            {blog.category.replace(/_/g, ' ')}
                                        </div>
                                        <h4 className="text-xl font-bold text-[#1C2E45] mb-3 group-hover:text-[#946b56] transition-colors">
                                            {blog.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 mb-4">By {blog.author}</p>
                                        <div className="mt-auto">
                                            <Button variant="ghost" className="text-[#1C2E45] hover:text-[#946b56] p-0 h-auto font-medium">
                                                Read More <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}