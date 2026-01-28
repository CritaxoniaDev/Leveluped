import { CheckCircle, Users, Zap, Shield } from "lucide-react"

export default function Benefits() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose LevelUpED?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock the full potential of education with our enterprise-grade LMS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-start space-x-4">
            <CheckCircle className="w-8 h-8 text-green-500 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Boost Engagement</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Gamification increases participation by up to 300%, making learning addictive.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Users className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Scalable for Teams</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support thousands of users with robust analytics and multi-role access.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Zap className="w-8 h-8 text-yellow-500 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Efficiency</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automate content creation and grading, saving instructors hours.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Shield className="w-8 h-8 text-purple-500 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure & Compliant</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enterprise-level security with GDPR compliance and data protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}