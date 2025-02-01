import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ArticleCard } from "@/components/article-card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { SelectArticle } from "@db/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({ 
    queryKey: ["/api/articles"]
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Knowledge Base
              </h1>
              <p className="mt-1 text-gray-500">
                Find answers to your questions
              </p>
            </div>
            {user && (
              <Link href="/admin">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How can we help you?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Search our knowledge base for answers
            </p>
            <SearchBar className="max-w-xl mx-auto" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Popular Articles
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))
          ) : (
            articles?.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}