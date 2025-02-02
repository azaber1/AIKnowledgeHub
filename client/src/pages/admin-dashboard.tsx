import { useQuery } from "@tanstack/react-query";
import { ArticleEditor } from "@/components/article-editor";
import { TeamManagement } from "@/components/team-management";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import type { SelectArticle } from "@db/schema";

export default function AdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(() => {
    const stored = localStorage.getItem('selectedTeamId');
    return stored ? Number(stored) : null;
  });

  // Update localStorage when team changes
  const handleTeamSelect = (teamId: number | null) => {
    setSelectedTeamId(teamId);
    if (teamId === null) {
      localStorage.removeItem('selectedTeamId');
    } else {
      localStorage.setItem('selectedTeamId', teamId.toString());
    }
  };

  const { data: articles, isLoading, error } = useQuery<SelectArticle[]>({
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
    cacheTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/home">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Article Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your knowledge base articles
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Article
          </Button>
        </div>

        <div className="mb-6">
          <TeamManagement
            selectedTeamId={selectedTeamId}
            onTeamSelect={handleTeamSelect}
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))
          ) : error ? (
            <div className="text-center py-12 bg-destructive/10 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Error loading articles</h3>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
          ) : articles?.length === 0 ? (
            <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed">
              <h3 className="text-lg font-medium mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">
                {selectedTeamId 
                  ? "Start by creating your first team article"
                  : "Start by creating your first personal article"}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </div>
          ) : (
            articles?.map(article => (
              <ArticleEditor 
                key={article.id} 
                article={article} 
                teamId={selectedTeamId}
              />
            ))
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
            </DialogHeader>
            <ArticleEditor 
              isCreate 
              teamId={selectedTeamId}
              onSuccess={() => setIsCreateOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}