import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, Link } from "wouter";
import type { InsertUser } from "@db/schema";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      setLocation("/home");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{activeTab === "login" ? "Welcome Back" : "Create an Account"}</CardTitle>
              <CardDescription>
                {activeTab === "login" 
                  ? "Login to manage your knowledge base articles"
                  : "Start sharing your knowledge today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <LoginForm onSubmit={(data) => loginMutation.mutate(data)} />
                </TabsContent>

                <TabsContent value="register">
                  <RegisterForm onSubmit={(data) => {
                    const { confirmPassword: _, ...userData } = data;
                    registerMutation.mutate(userData);
                  }} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-primary/90 to-primary text-white">
        <h1 className="text-4xl font-bold mb-4">
          AI-Powered Knowledge Base
        </h1>
        <p className="text-lg opacity-90">
          Manage your knowledge base with intelligent search capabilities powered by
          advanced language models.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit }: { onSubmit: (data: InsertUser) => void }) {
  const form = useForm<InsertUser>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ onSubmit }: { onSubmit: (data: RegisterFormData) => void }) {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>
    </Form>
  );
}