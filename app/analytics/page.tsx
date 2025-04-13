"use client"

import { useState } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart, LineChart } from "@/components/charts"
import { FileText, Mic, Video } from "lucide-react"
import { PerformanceTrends } from "@/components/analytics/performance-trends"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days")

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Analytics
          </h1>
          <p className="text-muted-foreground">Track your sales performance metrics and improvement over time</p>
        </div>

        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-full shadow-sm bg-accent p-1">
            <Button
              variant={timeRange === "7days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("7days")}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "30days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("30days")}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === "90days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("90days")}
            >
              90 Days
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 rounded-full p-1 bg-accent">
            <TabsTrigger
              value="overview"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Skills Breakdown
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Content Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Trends Component */}
            <PerformanceTrends className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300" />

            <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardHeader>
                <CardTitle>Recent Content Performance</CardTitle>
                <CardDescription>Performance scores for your recently analyzed content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/10 p-4 bg-accent/20 hover:bg-accent/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Mic className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Sales Call - Enterprise Client</p>
                        <p className="text-sm text-muted-foreground">Analyzed 2 days ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                          82/100
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Product knowledge</li>
                            <li>Building rapport</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Handling price objections</li>
                            <li>Closing techniques</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="rounded-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/10 p-4 bg-accent/20 hover:bg-accent/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Product Demo - New Feature</p>
                        <p className="text-sm text-muted-foreground">Analyzed 5 days ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                          76/100
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Feature explanation</li>
                            <li>Use case examples</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Technical clarity</li>
                            <li>Addressing customer needs</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="rounded-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/10 p-4 bg-accent/20 hover:bg-accent/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Follow-up Email Template</p>
                        <p className="text-sm text-muted-foreground">Analyzed 1 week ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                          91/100
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Clear call-to-action</li>
                            <li>Personalization</li>
                            <li>Concise messaging</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Value proposition</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="rounded-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-purple-400"></div>
                <CardHeader>
                  <CardTitle>Engagement</CardTitle>
                  <CardDescription>How well you engage with prospects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    78/100
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">+12% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Strong at asking open-ended questions</li>
                      <li>Good rapport building</li>
                      <li>Could improve active listening</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-purple-400"></div>
                <CardHeader>
                  <CardTitle>Objection Handling</CardTitle>
                  <CardDescription>How well you address customer concerns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    65/100
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">+8% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Need to acknowledge concerns better</li>
                      <li>Improve value-based responses</li>
                      <li>Practice handling price objections</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-purple-400"></div>
                <CardHeader>
                  <CardTitle>Closing Techniques</CardTitle>
                  <CardDescription>How effectively you close deals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    82/100
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">+15% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Strong at creating urgency</li>
                      <li>Good at summarizing value</li>
                      <li>Could improve asking for the sale directly</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardHeader>
                <CardTitle>Content Type Analysis</CardTitle>
                <CardDescription>Performance comparison across different content types</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[
                    { name: "Sales Calls", value: 76 },
                    { name: "Product Demos", value: 82 },
                    { name: "Email Templates", value: 91 },
                    { name: "Presentations", value: 85 },
                    { name: "Proposals", value: 79 },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

