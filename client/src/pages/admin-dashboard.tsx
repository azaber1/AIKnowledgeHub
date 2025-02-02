import { useQuery } from "@tanstack/react-query";
import { ArticleEditor } from "@/components/article-editor";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Database } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import type { SelectArticle } from "@db/schema";

export default function AdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Article Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your knowledge base articles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/database">
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                View Database
              </Button>
            </Link>
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Article
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))
          ) : articles?.length === 0 ? (
            <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed">
              <h3 className="text-lg font-medium mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first article
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </div>
          ) : (
            articles?.map(article => (
              <ArticleEditor key={article.id} article={article} />
            ))
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
            </DialogHeader>
            <ArticleEditor isCreate onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}