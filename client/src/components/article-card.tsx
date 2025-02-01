import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import type { SelectArticle } from "@db/schema";

interface ArticleCardProps {
  article: SelectArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
          <CardTitle>{article.title}</CardTitle>
          <CardDescription>
            {new Date(article.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-muted-foreground">
            {article.content}
          </p>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
            <CardDescription>
              {new Date(article.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert">
              {article.content}
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
    </>
  );
}
