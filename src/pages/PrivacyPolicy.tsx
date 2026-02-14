import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicy() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Button
                        onClick={() => navigate("/")}
                        variant="ghost"
                        className="text-white hover:bg-white/20 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                    <p className="text-indigo-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose prose-invert max-w-none dark:prose-invert space-y-8">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Introduction
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            LevelUpED ("we," "us," "our," or "Company") is committed to protecting your privacy. 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                            when you visit our website and use our gamified Learning Management System (LMS) platform.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                            Please read this Privacy Policy carefully. If you do not agree with our policies and practices, 
                            please do not use our Services.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            1. Information We Collect
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Personal Information You Provide
                                </h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Name and username</li>
                                    <li>Email address</li>
                                    <li>Profile picture and avatar customization</li>
                                    <li>Bio and profile information</li>
                                    <li>Phone number (optional)</li>
                                    <li>Course enrollment and progress data</li>
                                    <li>Quiz and assignment responses</li>
                                    <li>Messages and communications within the platform</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Automatically Collected Information
                                </h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Device information (browser type, IP address, device type)</li>
                                    <li>Usage data (pages visited, time spent, interactions)</li>
                                    <li>Cookies and similar tracking technologies</li>
                                    <li>Login timestamps and activity logs</li>
                                    <li>Achievement and badge data</li>
                                    <li>XP and progression metrics</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Information from Third Parties
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    If you use social login features, we may collect information from your social media accounts 
                                    with your consent.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Information */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            2. How We Use Your Information
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>To provide and maintain the LevelUpED platform</li>
                            <li>To process your registration and manage your account</li>
                            <li>To track your learning progress and generate reports</li>
                            <li>To send educational content, updates, and notifications</li>
                            <li>To facilitate communication between instructors and learners</li>
                            <li>To manage achievements, badges, and gamification features</li>
                            <li>To analyze platform usage and improve our services</li>
                            <li>To comply with legal obligations</li>
                            <li>To prevent fraud and enhance security</li>
                            <li>To send marketing communications (with your consent)</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            3. How We Share Your Information
                        </h2>
                        <div className="space-y-4 text-gray-700 dark:text-gray-300">
                            <p>
                                <strong>Instructors:</strong> Your enrollment status, course progress, quiz scores, and assignment 
                                submissions are shared with course instructors.
                            </p>
                            <p>
                                <strong>Administrators:</strong> Platform administrators may access your data for system management 
                                and support purposes.
                            </p>
                            <p>
                                <strong>Leaderboards:</strong> Your username and achievement data may appear on leaderboards 
                                (you can customize privacy settings).
                            </p>
                            <p>
                                <strong>Service Providers:</strong> We may share data with third-party service providers who assist 
                                in platform operations (email services, analytics, hosting).
                            </p>
                            <p>
                                <strong>Legal Requirements:</strong> We may disclose information if required by law or to protect 
                                our rights and safety.
                            </p>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            4. Data Security
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your personal information 
                            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                            over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable 
                            means to protect your information, we cannot guarantee absolute security.
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            5. Data Retention
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We retain your personal information for as long as your account is active or as needed to provide 
                            our services. You can request deletion of your account and associated data at any time through your 
                            account settings. Some data may be retained for legal or business purposes after account deletion.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            6. Your Privacy Rights
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Depending on your location, you may have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li><strong>Right to Access:</strong> You can request access to your personal data</li>
                            <li><strong>Right to Correct:</strong> You can update or correct inaccurate information</li>
                            <li><strong>Right to Delete:</strong> You can request deletion of your account and data</li>
                            <li><strong>Right to Opt-Out:</strong> You can opt out of marketing communications</li>
                            <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a portable format</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                            To exercise any of these rights, please contact us at privacy@leveluped.com.
                        </p>
                    </section>

                    {/* Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            7. Cookies and Tracking Technologies
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We use cookies and similar tracking technologies to enhance your experience on our platform. 
                            This includes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                            <li><strong>Session Cookies:</strong> To keep you logged in</li>
                            <li><strong>Preference Cookies:</strong> To remember your settings</li>
                            <li><strong>Analytics Cookies:</strong> To understand how you use our platform</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                            You can control cookie settings through your browser preferences.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            8. Children's Privacy
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            LevelUpED is designed for educational use. If you are under 13, please ensure that your parent 
                            or guardian has provided consent for you to use our platform. We do not knowingly collect personal 
                            information from children under 13 without parental consent. If we discover we have collected such 
                            information, we will delete it promptly.
                        </p>
                    </section>

                    {/* Third-Party Links */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            9. Third-Party Links
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Our platform may contain links to third-party websites. We are not responsible for the privacy 
                            practices of external sites. Please review their privacy policies before providing any information.
                        </p>
                    </section>

                    {/* Contact Us */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            10. Contact Us
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            If you have questions about this Privacy Policy or our privacy practices, please contact us:
                        </p>
                        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> privacy@leveluped.com</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Physical Address:</strong> [Your Address Here]</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Support Portal:</strong> support.leveluped.com</p>
                        </div>
                    </section>

                    {/* Policy Updates */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            11. Policy Updates
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of significant changes 
                            via email or by posting a notice on our platform. Your continued use of LevelUpED after such 
                            modifications constitutes your acceptance of the updated Privacy Policy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}