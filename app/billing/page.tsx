"use client"

import { useState } from "react"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, Package, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AnimatedElement from "@/components/animated-element"

// Define plan types
interface Plan {
  id: string
  name: string
  description: string
  price: string
  priceId: string
  features: string[]
  popular?: boolean
  current?: boolean
}

export default function BillingPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock plans data
  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for individual sales professionals",
      price: "$29",
      priceId: "price_starter",
      features: [
        "Unlimited AI coaching sessions",
        "Basic sales call analysis",
        "5 file uploads per month",
        "Email support"
      ]
    },
    {
      id: "professional",
      name: "Professional",
      description: "For serious sales professionals",
      price: "$79",
      priceId: "price_professional",
      features: [
        "Everything in Starter",
        "Advanced performance analytics",
        "Unlimited file uploads",
        "Priority support",
        "Custom training data integration"
      ],
      popular: true,
      current: true
    },
    {
      id: "team",
      name: "Team",
      description: "For sales teams and organizations",
      price: "$199",
      priceId: "price_team",
      features: [
        "Everything in Professional",
        "Team analytics dashboard",
        "Admin controls",
        "Dedicated account manager",
        "Custom AI training",
        "API access"
      ]
    }
  ]
  
  // Mock billing history
  const billingHistory = [
    {
      id: "inv_123456",
      date: "Apr 1, 2025",
      amount: "$79.00",
      status: "Paid",
      plan: "Professional"
    },
    {
      id: "inv_123455",
      date: "Mar 1, 2025",
      amount: "$79.00",
      status: "Paid",
      plan: "Professional"
    },
    {
      id: "inv_123454",
      date: "Feb 1, 2025",
      amount: "$29.00",
      status: "Paid",
      plan: "Starter"
    }
  ]
  
  // Handle plan change
  const handleChangePlan = async (plan: Plan) => {
    if (plan.current) {
      toast({
        title: "Already subscribed",
        description: `You are already subscribed to the ${plan.name} plan.`
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // In a real implementation, this would call an API to change the plan
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Plan changed",
        description: `You have successfully changed to the ${plan.name} plan.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change plan. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setIsLoading(true)
    
    try {
      // In a real implementation, this would call an API to cancel the subscription
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You will still have access until the end of your billing period."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and billing information</p>
        </div>
        
        <Tabs defaultValue="subscription">
          <TabsList className="mb-6">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the Professional plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">Professional Plan</p>
                      <p className="text-muted-foreground">$79/month</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">Active</Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Your next billing date is May 1, 2025</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleCancelSubscription} disabled={isLoading}>
                    Cancel Subscription
                  </Button>
                  <Button variant="default" disabled={isLoading}>
                    Update Payment Method
                  </Button>
                </CardFooter>
              </Card>
              
              <div>
                <h2 className="text-xl font-bold mb-6">Available Plans</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <AnimatedElement key={plan.id} type="fade-in" duration={400} staggerIndex={plans.indexOf(plan)}>
                      <Card className={`h-full flex flex-col ${plan.popular ? 'border-primary shadow-md' : ''}`}>
                        <CardHeader>
                          {plan.popular && (
                            <Badge className="w-fit mb-2" variant="default">
                              Popular
                            </Badge>
                          )}
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="mb-4">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant={plan.current ? "outline" : plan.popular ? "gradient" : "default"}
                            className="w-full"
                            disabled={isLoading || plan.current}
                            onClick={() => handleChangePlan(plan)}
                          >
                            {plan.current ? "Current Plan" : "Change Plan"}
                          </Button>
                        </CardFooter>
                      </Card>
                    </AnimatedElement>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">{invoice.plan} Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.amount}</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Visa ending in 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 04/2026</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Default
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
