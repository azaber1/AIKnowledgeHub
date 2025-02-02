import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectArticle } from "@db/schema";

interface SearchBarProps {
  className?: string;
  teamId?: number | null;
}

export function SearchBar({ className, teamId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles/search", query, teamId],
    enabled: query.length > 0,
    queryFn: async () => {
      const url = new URL("/api/articles/search", window.location.origin);
      url.searchParams.set("q", query);
      if (teamId) {
        url.searchParams.set("teamId", teamId.toString());
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search articles");
      return res.json();
    }
  });

  return (
    <div className={cn("relative w-full", className)}>
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
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg overflow-hidden z-10">
          {results && results.length > 0 ? (
            results.map((article) => (
              <Button
                key={article.id}
                variant="ghost"
                className="w-full justify-start text-left px-4 py-3 hover:bg-accent/50"
                onClick={() => setQuery("")}
              >
                <div className="w-full">
                  <div className="font-medium line-clamp-1">{article.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {article.content}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-3 text-muted-foreground">
              {isLoading ? "Searching..." : "No articles found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}