import { useQuery,  } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ArticleCard } from "@/components/article-card";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, Loader2, LogIn } from "lucide-react";
import type { SelectArticle } from "@db/schema";
import { useEffect } from "react";

interface GroupedArticles {
  [key: string]: SelectArticle[];
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({ 
    queryKey: ["/api/articles"]
  });

  // Group articles by category
  const groupedArticles: GroupedArticles = {};
  articles?.forEach(article => {
    const category = article.metadata?.category || 'Uncategorized';
    if (!groupedArticles[category]) {
      groupedArticles[category] = [];
    }
    groupedArticles[category].push(article);
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // If not logged in, redirect to auth page
  useEffect(() => {
    if (!user && !logoutMutation.isPending) {
      setLocation('/auth');
    }
  }, [user, logoutMutation.isPending, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
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
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/admin">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Manage Articles
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
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
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="mb-12">
              <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="h-48 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          ))
        ) : (
          Object.entries(groupedArticles).map(([category, categoryArticles]) => (
            <div key={category} className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {category}
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}