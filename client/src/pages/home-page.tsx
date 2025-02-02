import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ArticleCard } from "@/components/article-card";
import { TeamManagement } from "@/components/team-management";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, Loader2, LogIn } from "lucide-react";
import type { SelectArticle } from "@db/schema";
import { useState } from "react";

interface GroupedArticles {
  [key: string]: SelectArticle[];
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(() => {
    const stored = localStorage.getItem('selectedTeamId');
    return stored ? Number(stored) : null;
  });

  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles", selectedTeamId],
    queryFn: async () => {
      const url = new URL("/api/articles", window.location.origin);
      if (selectedTeamId !== null) {
        url.searchParams.set("teamId", selectedTeamId.toString());
      }
      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch articles");
      }
      return res.json();
    },
    staleTime: 1000, // Consider data fresh for 1 second
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
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

  // Update localStorage when team changes
  const handleTeamSelect = (teamId: number | null) => {
    setSelectedTeamId(teamId);
    if (teamId === null) {
      localStorage.removeItem('selectedTeamId');
    } else {
      localStorage.setItem('selectedTeamId', teamId.toString());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
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

          <div className="flex items-center justify-between">
            <TeamManagement
              selectedTeamId={selectedTeamId}
              onTeamSelect={handleTeamSelect}
            />
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
            <SearchBar className="max-w-xl mx-auto" teamId={selectedTeamId} />
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
        ) : articles?.length === 0 ? (
          <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed">
            <h3 className="text-lg font-medium mb-2">No articles yet</h3>
            <p className="text-muted-foreground mb-4">
              {selectedTeamId 
                ? "No team articles found"
                : "No personal articles found"}
            </p>
            <Link href="/admin">
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </Link>
          </div>
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