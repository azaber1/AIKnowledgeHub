import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Knowledge Hub
          </h1>
          <Link href="/auth">
            <Button variant="outline">
              Login
            </Button>
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tighter mb-8">
              Organize and Share Knowledge
              <span className="block text-primary">With AI-Powered Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Create, manage, and share knowledge articles with advanced AI assistance. 
              Perfect for teams and organizations looking to build their knowledge base.
            </p>
            <Link href="/auth">
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 py-16">
          {[
            {
              title: "AI-Powered Search",
              description: "Find exactly what you need with our intelligent search system."
            },
            {
              title: "Easy Content Management",
              description: "Create and edit articles with a beautiful, intuitive interface."
            },
            {
              title: "Smart Organization",
              description: "Automatically categorize and tag content for better organization."
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Why Choose Our Knowledge Hub?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Intuitive Interface",
              "Real-time Collaboration",
              "Advanced Analytics",
              "24/7 Support"
            ].map((benefit, i) => (
              <div 
                key={i} 
                className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <p className="font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of teams who are already using our platform to manage their knowledge base.
            </p>
            <Link href="/auth">
              <Button size="lg" variant="default">
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}