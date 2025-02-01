import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectArticle } from "@db/schema";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles/search", { q: query }],
    enabled: query.length > 0,
  });

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="pr-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg p-2 space-y-2 z-10">
          {results && results.length > 0 ? (
            results.map((article) => (
              <Button
                key={article.id}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => setQuery("")}
              >
                <div>
                  <div className="font-medium">{article.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {article.content}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              {isLoading ? "Searching..." : "No articles found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}