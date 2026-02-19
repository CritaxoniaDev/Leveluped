import { useNavigate } from "react-router-dom"
import { Button } from "@/packages/shadcn/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CookiesPolicy() {
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
                    <h1 className="text-4xl font-bold text-white">Cookies Policy</h1>
                    <p className="text-indigo-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose prose-invert max-w-none dark:prose-invert space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Introduction
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            This Cookies Policy explains how LevelUpED ("we", "us", or "our") uses cookies and similar technologies when you visit our website and use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            What Are Cookies?
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Cookies are small text files stored on your device by your browser. They help us remember your preferences, understand how you use our site, and improve your experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Types of Cookies We Use
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>
                                <strong>Essential Cookies:</strong> Necessary for the website to function and cannot be switched off.
                            </li>
                            <li>
                                <strong>Preference Cookies:</strong> Remember your settings and preferences.
                            </li>
                            <li>
                                <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site.
                            </li>
                            <li>
                                <strong>Marketing Cookies:</strong> Used to deliver relevant ads and track ad performance (only with your consent).
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            How We Use Cookies
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>To keep you logged in and maintain your session</li>
                            <li>To remember your preferences and settings</li>
                            <li>To analyze site usage and improve our services</li>
                            <li>To personalize your experience</li>
                            <li>To provide relevant content and advertising (with your consent)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Managing Cookies
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            You can control and manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. However, disabling cookies may affect your experience on our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Third-Party Cookies
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Some cookies may be set by third-party services we use, such as analytics providers or advertisers. We do not control these cookies. Please review their policies for more information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Changes to This Policy
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We may update this Cookies Policy from time to time. We will notify you of significant changes by posting a notice on our platform or by other means.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Contact Us
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            If you have questions about our use of cookies, please contact us at <a href="mailto:privacy@leveluped.com" className="text-indigo-600">privacy@leveluped.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}