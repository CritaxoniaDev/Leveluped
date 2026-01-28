import { Trophy, BookOpen, Target, BarChart3 } from "lucide-react"

export default function KeyFeatures() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for Modern Learning
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover tools designed to make education interactive, measurable, and fun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Gamified Challenges</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Turn learning into quests with rewards, badges, and leaderboards.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Generated Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create courses instantly with AI-powered quizzes and resources.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Progress Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor student advancement with detailed analytics and XP systems.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Comprehensive Dashboards</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Visualize data for instructors and learners with intuitive interfaces.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}