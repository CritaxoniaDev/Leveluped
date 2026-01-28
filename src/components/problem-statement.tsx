import { AlertTriangle, Users, TrendingDown } from "lucide-react"

export default function ProblemStatement() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The Learning Challenge
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional education often fails to engage students, leading to low retention and motivation.
          </p>
        </div>

        {/* Subtle Grid Background */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white border border-indigo-100 rounded-lg shadow-sm">
            <AlertTriangle className="w-12 h-12 text-indigo-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Low Engagement</h3>
            <p className="text-gray-600 leading-relaxed">
              Students struggle with boring lectures and passive learning, resulting in disinterest and poor outcomes.
            </p>
          </div>
          <div className="text-center p-8 bg-white border border-indigo-100 rounded-lg shadow-sm">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Inefficient Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Educators lack tools to monitor progress effectively, hindering personalized support.
            </p>
          </div>
          <div className="text-center p-8 bg-white border border-indigo-100 rounded-lg shadow-sm">
            <TrendingDown className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Stagnant Motivation</h3>
            <p className="text-gray-600 leading-relaxed">
              Without gamification, students lack incentives to excel, leading to suboptimal performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}