import { useNavigate } from "react-router-dom"
import { Button } from "@/packages/shadcn/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsOfService() {
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
                    <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
                    <p className="text-indigo-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose prose-invert max-w-none dark:prose-invert space-y-8">
                    {/* Agreement to Terms */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            1. Agreement to Terms
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            These Terms of Service ("Terms") govern your access to and use of LevelUpED's website, mobile 
                            application, and services (collectively, the "Services"). By accessing or using LevelUpED, you agree 
                            to be bound by these Terms. If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    {/* Use License */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            2. Use License
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Permission is granted to temporarily download one copy of the materials (information or software) on 
                            LevelUpED's Services for personal, non-commercial transitory viewing only.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Modifying or copying the materials</li>
                            <li>Using the materials for any commercial purpose or for any public display</li>
                            <li>Attempting to decompile or reverse engineer any software contained on LevelUpED</li>
                            <li>Removing any copyright or other proprietary notations from the materials</li>
                            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                            <li>Using the materials for illegal purposes or in violation of any applicable regulations</li>
                            <li>Harassing, threatening, defaming, or engaging in abusive behavior toward other users</li>
                            <li>Accessing or attempting to access the accounts of other users without authorization</li>
                        </ul>
                    </section>

                    {/* Disclaimer */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            3. Disclaimer
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            The materials on LevelUpED's Services are provided on an 'as is' basis. LevelUpED makes no warranties, 
                            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
                            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                            of intellectual property or other violation of rights.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Further, LevelUpED does not warrant or make any representations concerning the accuracy, likely results, 
                            or reliability of the use of the materials on its Services or otherwise relating to such materials or on 
                            any sites linked to this site.
                        </p>
                    </section>

                    {/* Limitations of Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            4. Limitations of Liability
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            In no event shall LevelUpED or its suppliers be liable for any damages (including, without limitation, 
                            damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                            to use the materials on LevelUpED's Services, even if LevelUpED or an authorized representative has been 
                            notified orally or in writing of the possibility of such damage.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for 
                            consequential or incidental damages, these limitations may not apply to you.
                        </p>
                    </section>

                    {/* Accuracy of Materials */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            5. Accuracy of Materials
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            The materials appearing on LevelUpED's Services could include technical, typographical, or photographic 
                            errors. LevelUpED does not warrant that any of the materials on its Services are accurate, complete, or 
                            current. LevelUpED may make changes to the materials contained on its Services at any time without notice.
                        </p>
                    </section>

                    {/* Links */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            6. Links
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            LevelUpED has not reviewed all of the sites linked to its website and is not responsible for the contents 
                            of any such linked site. The inclusion of any link does not imply endorsement by LevelUpED of the site. 
                            Use of any such linked website is at the user's own risk.
                        </p>
                    </section>

                    {/* Modifications */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            7. Modifications
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            LevelUpED may revise these Terms of Service for its Services at any time without notice. By using this 
                            service, you are agreeing to be bound by the then current version of these Terms of Service.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            8. Governing Law
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            These Terms and Conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] 
                            and you irrevocably submit to the exclusive jurisdiction of the courts located in that location.
                        </p>
                    </section>

                    {/* User Accounts */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            9. User Accounts
                        </h2>
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Account Registration:</strong> You are responsible for maintaining the confidentiality of your 
                                account credentials and for all activities that occur under your account.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>User Responsibility:</strong> You agree to provide accurate, complete, and truthful information 
                                during registration and to update this information as necessary.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Account Security:</strong> You are solely responsible for maintaining the security of your password 
                                and for any consequences resulting from unauthorized access to your account.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Termination:</strong> You may terminate your account at any time. LevelUpED reserves the right to 
                                suspend or terminate accounts that violate these Terms or for any reason at our discretion.
                            </p>
                        </div>
                    </section>

                    {/* User Conduct */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            10. User Conduct
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            You agree not to engage in any conduct that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Violates any applicable law or regulation</li>
                            <li>Infringes on the rights of others, including intellectual property rights</li>
                            <li>Harasses, threatens, defames, or abuses other users</li>
                            <li>Uploads viruses, malware, or any other malicious code</li>
                            <li>Attempts to gain unauthorized access to the platform or other users' accounts</li>
                            <li>Impersonates another person or entity</li>
                            <li>Interferes with or disrupts the Services or servers connected to the Services</li>
                            <li>Spams, phishes, or engages in fraudulent activities</li>
                            <li>Cheats on quizzes, assignments, or plagiarizes content</li>
                        </ul>
                    </section>

                    {/* Intellectual Property Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            11. Intellectual Property Rights
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            <strong>Our Content:</strong> All content provided on LevelUpED, including course materials, quizzes, 
                            videos, and other educational resources, is the intellectual property of LevelUpED or its content 
                            providers and is protected by copyright laws.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            <strong>Your Content:</strong> By submitting content to LevelUpED (including forum posts, messages, or 
                            assignment submissions), you grant LevelUpED a non-exclusive, worldwide, royalty-free license to use, 
                            reproduce, modify, and distribute such content as necessary to provide and improve the Services.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <strong>Third-Party Content:</strong> LevelUpED respects intellectual property rights and will respond 
                            to valid DMCA takedown notices in accordance with applicable law.
                        </p>
                    </section>

                    {/* Payments and Subscriptions */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            12. Payments and Subscriptions
                        </h2>
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Payment Terms:</strong> All payments must be made in accordance with the payment terms displayed 
                                at the time of purchase.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Refunds:</strong> You may request a refund within 30 days of purchase if you are not satisfied 
                                with your subscription. After 30 days, refunds are not available.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Recurring Billing:</strong> If you have enrolled in a recurring subscription, your payment method 
                                will be charged automatically on the renewal date unless you cancel your subscription.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Price Changes:</strong> LevelUpED reserves the right to change prices with 30 days' notice.
                            </p>
                        </div>
                    </section>

                    {/* Coaching and Educational Disclaimer */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            13. Educational Disclaimer
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            LevelUpED provides educational content for informational purposes only. While we strive for accuracy:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>The content is not a substitute for professional advice in specialized fields</li>
                            <li>Completion of courses does not guarantee employment or specific outcomes</li>
                            <li>Users are responsible for verifying information and seeking professional guidance when necessary</li>
                            <li>Course completion certificates are not official academic credentials</li>
                        </ul>
                    </section>

                    {/* Academic Integrity */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            14. Academic Integrity
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Users agree to maintain academic integrity by:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Not cheating on assessments or taking quizzes for other users</li>
                            <li>Not plagiarizing content or submitting work that is not their own</li>
                            <li>Not sharing account credentials with other users</li>
                            <li>Following all course guidelines and academic standards</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                            Violations of academic integrity may result in course suspension or account termination.
                        </p>
                    </section>

                    {/* Suspension and Termination */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            15. Suspension and Termination
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            LevelUpED may immediately suspend or terminate your account if you:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Violate these Terms of Service</li>
                            <li>Engage in abusive or threatening behavior</li>
                            <li>Violate intellectual property rights</li>
                            <li>Attempt to gain unauthorized access to systems</li>
                            <li>Violate applicable laws or regulations</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                            Upon termination, your access to the Services will be immediately revoked.
                        </p>
                    </section>

                    {/* Indemnification */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            16. Indemnification
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            You agree to indemnify and hold harmless LevelUpED, its owners, operators, and employees from any claims, 
                            damages, losses, liabilities, and expenses arising from your use of the Services or violation of these Terms.
                        </p>
                    </section>

                    {/* Dispute Resolution */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            17. Dispute Resolution
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            <strong>Informal Resolution:</strong> Before initiating formal proceedings, you agree to attempt to resolve 
                            any dispute informally by contacting LevelUpED's support team.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <strong>Binding Arbitration:</strong> Any dispute that cannot be resolved informally shall be settled by 
                            binding arbitration in accordance with the rules of [Arbitration Service], except that either party may 
                            seek injunctive relief in court if necessary to prevent irreparable harm.
                        </p>
                    </section>

                    {/* Contact Information */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            18. Contact Us
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            If you have any questions about these Terms of Service, please contact us at:
                        </p>
                        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg space-y-2">
                            <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> support@leveluped.com</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Support Portal:</strong> support.leveluped.com</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Address:</strong> [Your Address Here]</p>
                        </div>
                    </section>

                    {/* Severability */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            19. Severability
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall 
                            continue in full force and effect.
                        </p>
                    </section>

                    {/* Entire Agreement */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            20. Entire Agreement
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and 
                            LevelUpED regarding your use of the Services and supersede all prior and contemporaneous agreements, 
                            understandings, and negotiations, whether written or oral.
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            21. Changes to These Terms
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            LevelUpED reserves the right to modify these Terms at any time. We will notify you of significant changes 
                            via email or by posting a notice on our platform. Your continued use of the Services after modifications 
                            constitutes your acceptance of the updated Terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}