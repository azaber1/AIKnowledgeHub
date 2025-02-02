import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { SelectArticle } from "@db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ArticlePage() {
  const [, params] = useRoute<{ id: string }>("/article/:id");
  const { data: article, isLoading } = useQuery<SelectArticle>({
    queryKey: [`/api/articles/${params?.id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-primary/5 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{article.title}</CardTitle>
                <CardDescription>
                  {new Date(article.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {article.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
