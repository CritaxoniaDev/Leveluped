import { UserPlus, BookOpen, Trophy, BarChart3 } from "lucide-react"

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How LevelUpED Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A simple 4-step process to revolutionize your learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
            <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sign Up</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create your account as an instructor or learner.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create or Enroll</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Instructors build courses; learners join and start learning.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Engage & Learn</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Complete challenges, earn XP, and unlock achievements.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">4</div>
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Track & Improve</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Analyze progress and refine your learning journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}