import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type User = {
  id: number;
  username: string;
};

type Article = {
  id: number;
  title: string;
  content: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  authorId: number;
};

export default function DatabaseView() {
  const { user } = useAuth();
  const { data: users } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"],
  });
  const { data: articles } = useQuery<Article[]>({ 
    queryKey: ["/api/admin/articles"],
  });

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Database View</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.id}</td>
                        <td className="p-2">{user.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Articles Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Content</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Created At</th>
                      <th className="text-left p-2">Updated At</th>
                      <th className="text-left p-2">Author ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles?.map((article) => (
                      <tr key={article.id} className="border-b">
                        <td className="p-2">{article.id}</td>
                        <td className="p-2">{article.title}</td>
                        <td className="p-2 max-w-md">
                          <div className="truncate">{article.content}</div>
                        </td>
                        <td className="p-2">{article.metadata?.category || 'N/A'}</td>
                        <td className="p-2">{new Date(article.createdAt).toLocaleString()}</td>
                        <td className="p-2">{new Date(article.updatedAt).toLocaleString()}</td>
                        <td className="p-2">{article.authorId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
