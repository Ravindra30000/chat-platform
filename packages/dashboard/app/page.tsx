import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Zap, Globe, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            TechSurf Chat Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build powerful AI chat agents with Contentstack integration. Create,
            customize, and deploy chat widgets in minutes.
          </p>
          <Link href="/api/auth/signin">
            <Button size="lg" className="px-8 py-3 text-lg">
              Get Started with Contentstack
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader>
              <MessageCircle className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Visual Agent Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and configure chat agents with our intuitive visual
                interface
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-yellow-600 mb-4" />
              <CardTitle>Real-time Streaming</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Lightning-fast responses with Server-Sent Events streaming
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Contentstack Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect your content for intelligent, context-aware responses
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track performance and user interactions with detailed analytics
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Get Started in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Connect Contentstack
              </h3>
              <p className="text-gray-600">
                Authenticate with your Contentstack account to access your
                content
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Your Agent</h3>
              <p className="text-gray-600">
                Use our visual builder to create and customize your chat agent
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Deploy & Integrate</h3>
              <p className="text-gray-600">
                Get your integration code and embed the chat widget anywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
