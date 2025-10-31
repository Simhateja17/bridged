import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BlogPostPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['blogPost', slug],
        queryFn: async () => {
            const results = await base44.entities.BlogPost.filter({ slug: slug });
            if (results.length === 0) {
                throw new Error('Blog post not found');
            }
            return results[0];
        },
        enabled: !!slug,
    });

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Skeleton className="h-64 w-full rounded-2xl mb-8" />
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-8" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-[#1C2E45] mb-4">Blog Post Not Found</h2>
                    <p className="text-gray-600 mb-8">The article you're looking for doesn't exist or has been removed.</p>
                    <Link to={createPageUrl('Blog')}>
                        <Button className="bg-[#1C2E45] hover:bg-[#2A3F5F]">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Blog
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F8F5F2] min-h-screen">
            {post.thumbnail_url && (
                <div className="h-96 w-full">
                    <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-24">
                <Link to={createPageUrl('Blog')} className="inline-block mb-6">
                    <Button variant="ghost" className="text-[#1C2E45] hover:text-[#946b56]">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Button>
                </Link>
                
                <Card className="shadow-2xl border border-[#E7E0DA]">
                    <CardContent className="p-8 md:p-12">
                        <div className="text-lg font-semibold text-[#946b56] mb-2 uppercase tracking-wider">
                            {post.category.replace(/_/g, ' ')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#1C2E45] mb-6 heading-font">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 mb-8">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="text-medium">{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(post.created_date), 'MMMM d, yyyy')}</span>
                            </div>
                        </div>

                        <article className="prose prose-lg max-w-none 
                            prose-headings:font-bold prose-headings:text-[#1C2E45] prose-headings:heading-font
                            prose-p:text-[#333333] prose-p:leading-relaxed prose-p:text-medium
                            prose-a:text-[#946b56] hover:prose-a:text-[#1C2E45]
                            prose-strong:text-[#1C2E45] prose-strong:font-semibold
                            prose-ul:text-[#333333] prose-ol:text-[#333333]
                            prose-li:text-medium
                            prose-img:rounded-xl prose-img:shadow-md">
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </article>
                    </CardContent>
                </Card>
                
                {post.author_bio && (
                    <Card className="mt-8 bg-white border border-[#E7E0DA] shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-lg text-[#1C2E45] mb-2 heading-font">About the Author</h3>
                            <p className="text-gray-600 text-medium">{post.author_bio}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-8 text-center">
                    <Link to={createPageUrl('Blog')}>
                        <Button variant="outline" className="border-[#1C2E45] text-[#1C2E45] hover:bg-[#1C2E45] hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Read More Articles
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}