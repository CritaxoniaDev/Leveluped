import { useNavigate } from "react-router-dom"
import { Button } from "@/packages/shadcn/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { ArrowLeft, Zap, Users, Target, Award, TrendingUp, Globe, Heart, Lightbulb, Shield } from "lucide-react"

export default function About() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-[#0a0a0a] dark:to-gray-900">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LevelUpED</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                            Transforming education through gamification, making learning engaging, rewarding, and fun for everyone.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                {/* Our Story */}
                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Story
                            </h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                LevelUpED was born from a simple observation: traditional learning methods often fail to engage 
                                students and keep them motivated. We realized that the gaming industry had cracked the code on 
                                engagement through mechanics like leveling, achievements, and social competition.
                            </p>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                In 2023, our team of educators and technologists came together with a mission: to revolutionize 
                                learning by bringing gamification principles to education. We combined cutting-edge technology with 
                                proven educational psychology to create LevelUpED.
                            </p>
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                                Today, LevelUpED empowers educators to create engaging learning experiences and helps learners 
                                achieve their goals through fun, interactive gamified courses.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 flex items-center justify-center min-h-96">
                            <div className="text-center">
                                <div className="inline-block mb-4">
                                    <img
                                        src="/images/leveluped-mainlogo.png"
                                        alt="LevelUpED Logo"
                                        className="w-40 h-40 drop-shadow-xl"
                                    />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">Gamified Learning Management System</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="mb-20">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Our Mission & Vision
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-2xl text-gray-900 dark:text-white">Our Mission</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    To make quality education accessible, engaging, and rewarding for learners worldwide by combining 
                                    the power of gamification with effective teaching practices. We believe that learning should be 
                                    fun, and success should be celebrated.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                    <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <CardTitle className="text-2xl text-gray-900 dark:text-white">Our Vision</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    A world where learning is interactive, engaging, and empowering. Where educators can easily create 
                                    compelling courses and learners are motivated to achieve their educational goals through gamification, 
                                    community, and recognition.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Core Values */}
                <section className="mb-20">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Our Core Values
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Engagement</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We create experiences that captivate and motivate learners to achieve more.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Community</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We foster inclusive communities where learners support and inspire each other.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Trust</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We prioritize security and transparency in all our interactions and operations.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-7 h-7 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Excellence</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We're committed to delivering the highest quality education and features.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Key Features */}
                <section className="mb-20">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Why Choose LevelUpED?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500/10 dark:bg-blue-500/20">
                                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Gamification Engine
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Earn XP, unlock badges, climb leaderboards, and complete quests. Learning becomes an exciting journey.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500/10 dark:bg-green-500/20">
                                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Instructor Tools
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Easy-to-use dashboard to create courses, track student progress, and manage assessments.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500/10 dark:bg-purple-500/20">
                                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Progress Tracking
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Detailed analytics and insights to monitor learning outcomes and identify areas for improvement.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500/10 dark:bg-orange-500/20">
                                    <Lightbulb className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Interactive Content
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Rich multimedia support with quizzes, challenges, e-learning modules, and resource materials.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500/10 dark:bg-red-500/20">
                                    <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Secure & Reliable
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enterprise-grade security with data encryption, privacy protection, and compliance standards.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20">
                                    <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Global Reach
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Connect with learners and instructors from around the world in a multi-language environment.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-cyan-500/10 dark:bg-cyan-500/20">
                                    <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Mobile Friendly
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Learn on the go with our responsive design that works seamlessly across all devices.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="mb-20">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Our Team
                    </h2>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                        <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                            Our team consists of passionate educators, experienced software engineers, and creative designers 
                            united by a common goal: to revolutionize education through technology and gamification.
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-center mb-8">
                            <div>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50+</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">15+</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Countries</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">100+</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Educators</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">10K+</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Users</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        Ready to Transform Your Learning?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                        Join thousands of learners and educators already using LevelUpED to unlock their potential.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => navigate("/signup")}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-6 text-lg font-semibold rounded-lg"
                        >
                            Get Started Today
                        </Button>
                        <Button
                            onClick={() => navigate("/")}
                            variant="outline"
                            className="px-8 py-6 text-lg font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                            Learn More
                        </Button>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        © 2024 LevelUpED. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}