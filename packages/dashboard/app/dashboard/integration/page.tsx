import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeGenerator } from "@/components/CodeGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function IntegrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integration Guide</h1>
        <p className="text-gray-600 mt-1">
          Learn how to integrate TechSurf chat widgets into your applications
        </p>
      </div>

      <Tabs defaultValue="installation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="basic">Basic Usage</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="installation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Installation</CardTitle>
              <CardDescription>
                Get started with TechSurf chat SDK in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Implementation</CardTitle>
              <CardDescription>
                Simple integration examples for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  The most basic implementation requires just a few lines of
                  code:
                </p>
                <CodeGenerator type="basic" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Custom themes, event handlers, and advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeGenerator type="advanced" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>E-commerce</CardTitle>
                <CardDescription>
                  Customer support for online stores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeGenerator type="ecommerce" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Help widget for documentation sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeGenerator type="docs" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
