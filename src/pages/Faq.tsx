import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/packages/shadcn/ui/accordion"
import { Button } from "@/packages/shadcn/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Input } from "@/packages/shadcn/ui/input"
import { toast } from "sonner"
import { ArrowLeft, HelpCircle, Search, MessageCircle, Mail, Trophy, Zap, Award, BookOpen, ShoppingCart, User } from "lucide-react"

interface FAQCategory {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  items: FAQItem[]
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

export default function Faq() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [searchQuery, setSearchQuery] = useState("")

  const faqCategories: FAQCategory[] = [
    {
      id: "general",
      title: "General",
      description: "General questions about LevelUpED",
      icon: <HelpCircle className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      items: [
        {
          id: "g1",
          question: "What is LevelUpED?",
          answer: "LevelUpED is a comprehensive gamified learning platform designed to help you master new skills and advance your career through interactive courses, real-world challenges, and engaging content. Our platform uses a global map-based system where you unlock courses by progressing through different regions and levels.",
          category: "general"
        },
        {
          id: "g2",
          question: "How do I get started?",
          answer: "Simply create an account, explore our global learning map, and select a country/region that matches your skill level. Browse available courses, enroll in ones that interest you, and start learning at your own pace. You'll earn XP, badges, and level up as you progress through the content.",
          category: "general"
        },
        {
          id: "g3",
          question: "What devices can I use to access LevelUpED?",
          answer: "LevelUpED is accessible on any device with a web browser including desktops, laptops, tablets, and smartphones. Our platform is fully responsive and optimized for all screen sizes.",
          category: "general"
        },
        {
          id: "g4",
          question: "Is there a community or support forum?",
          answer: "Yes! We have an active community where you can connect with other learners in the platform. Most courses have discussion forums, and our support team is available 24/7 through live chat, email, and phone support.",
          category: "general"
        }
      ]
    },
    {
      id: "learning",
      title: "Learning & Courses",
      description: "Questions about courses and learning content",
      icon: <BookOpen className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600",
      items: [
        {
          id: "l1",
          question: "How are courses organized?",
          answer: "Courses are organized by countries and regions on our interactive map. Each region has a level range (e.g., Levels 1-10) that determines course difficulty. You can only access courses in regions that match your current level. As you level up, new regions and courses unlock.",
          category: "learning"
        },
        {
          id: "l2",
          question: "What types of content are included in courses?",
          answer: "Our courses include: E-learning modules with text and video content, interactive quizzes to test your knowledge, coding challenges with hands-on practice, real-world projects, and resource materials. Each course is designed with a mix of learning and practical application.",
          category: "learning"
        },
        {
          id: "l3",
          question: "What's the difference between quizzes and challenges?",
          answer: "Quizzes are multiple-choice assessments that test your theoretical knowledge. Challenges are hands-on exercises (like code challenges) that require you to apply what you've learned. Both contribute to your progress and XP earned.",
          category: "learning"
        },
        {
          id: "l4",
          question: "How long do courses take to complete?",
          answer: "Course duration varies depending on the course complexity and your pace. A typical course can take anywhere from a few hours to several weeks. You can learn at your own pace, with no time pressure. Most courses display an estimated completion time in the course details.",
          category: "learning"
        },
        {
          id: "l5",
          question: "Can I retake quizzes and challenges?",
          answer: "Yes! You can retake quizzes and challenges as many times as you need. Your best score is recorded. This helps you prepare better and master the content. Retakes may have time limits depending on the course settings.",
          category: "learning"
        }
      ]
    },
    {
      id: "levels",
      title: "Levels & Progression",
      description: "Questions about leveling up and progression",
      icon: <Trophy className="w-5 h-5" />,
      color: "from-yellow-500 to-orange-600",
      items: [
        {
          id: "lv1",
          question: "How do I level up?",
          answer: "You earn Experience Points (XP) by completing courses, quizzes, challenges, and other learning activities. Once you accumulate enough XP, you automatically level up. Your XP progress is displayed in your profile and dashboard.",
          category: "levels"
        },
        {
          id: "lv2",
          question: "How much XP do I need for the next level?",
          answer: "XP requirements increase as you level up. Each level requires progressively more XP than the previous one. For example, Level 1→2 might require 100 XP, but Level 10→11 might require 500 XP. Your progress bar shows exactly how much XP you need.",
          category: "levels"
        },
        {
          id: "lv3",
          question: "What happens when I level up?",
          answer: "When you level up, you unlock new regions and courses on the global map. You may also earn badges, achievements, and unlock premium features depending on your subscription. Your level is displayed on your profile and on the leaderboard.",
          category: "levels"
        },
        {
          id: "lv4",
          question: "Is there a maximum level?",
          answer: "We're constantly expanding! Currently, our platform goes up to Level 50, but we're adding more levels regularly. Keep learning and progressing—there's always more content to unlock!",
          category: "levels"
        },
        {
          id: "lv5",
          question: "Can I see my leaderboard rank?",
          answer: "Yes! Your leaderboard rank is based on total XP earned. You can view the global leaderboard and see where you rank compared to other learners. Premium members get additional leaderboard features and statistics.",
          category: "levels"
        }
      ]
    },
    {
      id: "premium",
      title: "Premium & Subscription",
      description: "Questions about premium membership",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
      items: [
        {
          id: "p1",
          question: "What are the benefits of premium?",
          answer: "Premium members get: Unlimited access to all courses, ad-free experience, offline downloads, priority support, exclusive premium courses, avatar customization with special borders, leaderboard bonus features, and early access to new content.",
          category: "premium"
        },
        {
          id: "p2",
          question: "How much does premium cost?",
          answer: "We offer flexible pricing: Monthly plans and yearly plans (with 20% discount). Visit our Premium page to see current pricing. Both plans include the same features with different billing cycles.",
          category: "premium"
        },
        {
          id: "p3",
          question: "Can I cancel my subscription anytime?",
          answer: "Yes! You can cancel your premium subscription at any time with no penalties. Your access will continue until the end of your current billing period. You can manage your subscription in your account settings.",
          category: "premium"
        },
        {
          id: "p4",
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee on all premium plans. If you're not satisfied with your subscription, contact our support team for a full refund within 30 days of purchase.",
          category: "premium"
        },
        {
          id: "p5",
          question: "What is the Coin Shop?",
          answer: "The Coin Shop allows you to purchase coins using real currency. Coins are a virtual currency used in the platform for premium features, special items, and upcoming monetization features. Premium members get bonus coins periodically.",
          category: "premium"
        }
      ]
    },
    {
      id: "achievements",
      title: "Badges & Achievements",
      description: "Questions about badges and achievements",
      icon: <Award className="w-5 h-5" />,
      color: "from-red-500 to-red-600",
      items: [
        {
          id: "a1",
          question: "How do I earn badges?",
          answer: "Badges are earned by completing specific achievements and milestones. Examples include: completing your first course, getting a perfect score on a quiz, completing all challenges in a region, or reaching specific leaderboard positions. Your earned badges are displayed on your profile.",
          category: "achievements"
        },
        {
          id: "a2",
          question: "What's the difference between badges and achievements?",
          answer: "Badges are visual rewards you can display on your profile. Achievements are broader milestones (like completing 5 courses). Some achievements award badges, while others just give you a sense of accomplishment. Both are tracked in your profile.",
          category: "achievements"
        },
        {
          id: "a3",
          question: "Can I share my badges?",
          answer: "Yes! Your badges are displayed on your public profile and can be shown to other users. Premium members have special badge display options and can showcase their achievements in personalized ways.",
          category: "achievements"
        },
        {
          id: "a4",
          question: "Are there seasonal or limited-time badges?",
          answer: "Yes! We regularly introduce limited-time badges for seasonal events, challenges, and special occasions. These are a great way to show your participation in community events. Check the Achievements section for current available badges.",
          category: "achievements"
        }
      ]
    },
    {
      id: "profile",
      title: "Profile & Account",
      description: "Questions about your profile and account",
      icon: <User className="w-5 h-5" />,
      color: "from-indigo-500 to-blue-600",
      items: [
        {
          id: "pr1",
          question: "How do I customize my profile?",
          answer: "You can customize your profile by: Uploading a profile picture, adding a bio, choosing an avatar border (premium feature), and editing your personal information. Visit your profile settings to make these changes. Premium members get exclusive avatar borders.",
          category: "profile"
        },
        {
          id: "pr2",
          question: "Can I make my profile private?",
          answer: "Currently, profiles are public by default so you can connect with other learners. However, you can control what information is displayed. We're working on more privacy options for future releases.",
          category: "profile"
        },
        {
          id: "pr3",
          question: "How do I change my password?",
          answer: "Go to your Account Settings and select 'Change Password'. You'll need to enter your current password and then create a new one. Make sure to choose a strong password with letters, numbers, and special characters.",
          category: "profile"
        },
        {
          id: "pr4",
          question: "How do I delete my account?",
          answer: "You can request account deletion from your Account Settings. This will permanently delete all your data. Contact our support team if you need assistance with this process.",
          category: "profile"
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Support",
      description: "Technical questions and troubleshooting",
      icon: <Zap className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-600",
      items: [
        {
          id: "t1",
          question: "What should I do if a course isn't loading?",
          answer: "Try these steps: 1) Refresh the page, 2) Clear your browser cache, 3) Try a different browser, 4) Check your internet connection, 5) Restart your device. If the issue persists, contact our support team with details about your browser and device.",
          category: "technical"
        },
        {
          id: "t2",
          question: "Why isn't my progress saving?",
          answer: "Make sure you have a stable internet connection. Your progress is automatically saved as you learn. If you notice progress isn't saving, try logging out and logging back in. Contact support if the issue continues.",
          category: "technical"
        },
        {
          id: "t3",
          question: "Which browsers are supported?",
          answer: "LevelUpED works best on modern browsers: Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience. Mobile browsers are fully supported as well.",
          category: "technical"
        },
        {
          id: "t4",
          question: "How do I report a bug?",
          answer: "Found a bug? Contact our support team with: A description of the issue, Steps to reproduce it, Your browser and device information, Screenshots or video if possible. Your feedback helps us improve the platform!",
          category: "technical"
        }
      ]
    }
  ]

  // Filter FAQs based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0 || !searchQuery)

  const selectedCategoryData = filteredCategories.find(cat => cat.id === selectedCategory) || filteredCategories[0]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold head-font text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about LevelUpED. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search FAQs..."
              className="pl-12 h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-4">
                Categories
              </h3>
              {faqCategories.map((category) => {
                const itemCount = category.items.filter(item =>
                  !searchQuery ||
                  item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.answer.toLowerCase().includes(searchQuery.toLowerCase())
                ).length

                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={`w-full justify-between h-auto py-3 px-4 rounded-lg transition-all ${selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`${selectedCategory === category.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {category.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{category.title}</p>
                        <p className={`text-xs ${selectedCategory === category.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-3 mt-9">
            {selectedCategoryData && (
              <div className="space-y-6">
                {/* Accordion */}
                {selectedCategoryData.items.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-3">
                    {selectedCategoryData.items.map((item, index) => (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <div className="flex items-start gap-4 flex-1 text-left">
                            <Badge
                              variant="outline"
                              className="flex-shrink-0 mt-0.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-gray-300 dark:border-gray-600"
                            >
                              Q{index + 1}
                            </Badge>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.question}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border-t border-gray-200 dark:border-gray-700">
                          <div className="pl-12 space-y-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/50">
                    <CardContent className="p-12 text-center">
                      <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Results Found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or browse other categories
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700 transition-all"></div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Live Chat</CardTitle>
              </div>
              <CardDescription>
                Chat with our support team in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Available 24/7 to answer your questions and help you get the most out of LevelUpED.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                onClick={() => toast.info("Chat feature coming soon!")}
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600 group-hover:from-purple-500 group-hover:to-purple-700 transition-all"></div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
              </div>
              <CardDescription>
                Send us an email with your question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We'll respond to your email within 24 hours with a detailed answer and support.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                onClick={() => window.location.href = 'mailto:support@leveluped.com'}
              >
                Email Us
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 group-hover:from-green-500 group-hover:to-green-700 transition-all"></div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Community Forum</CardTitle>
              </div>
              <CardDescription>
                Connect with other learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Join our community forum to discuss courses, share tips, and connect with learners.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                onClick={() => toast.info("Community forum coming soon!")}
              >
                View Forum
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}