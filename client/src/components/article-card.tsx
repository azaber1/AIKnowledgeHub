import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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
        className="group cursor-pointer hover:shadow-lg transition-all duration-200"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-primary/5 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {article.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {new Date(article.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-muted-foreground">
            {article.content}
          </p>
          <Button 
            variant="link" 
            className="mt-2 p-0 h-auto font-medium text-primary hover:text-primary/80"
          >
            Read More →
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
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
        </DialogContent>
      </Dialog>
    </>
  );
}