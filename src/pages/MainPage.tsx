import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

interface MainPageProps {
  onSignIn: () => void
}

export default function MainPage({ onSignIn }: MainPageProps) {
  return (
    <div className="mt-20 dark:bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center space-y-8 lg:space-y-10">
        {/* Main Logo with animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-blue-500 to-red-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <Avatar className="w-28 h-28 shadow-lg ring-4 ring-white dark:ring-gray-900">
            <AvatarImage
              src="/images/leveluped-mainlogo.png"
              alt="LevelUpED Main Logo"
              draggable={false}
              className="rounded-full"
            />
          </Avatar>
        </div>

        {/* App Name */}
        <h1 className="text-6xl sm:text-7xl font-bold text-center tracking-tighter text-gray-900 dark:text-white">
          <span className="bg-gradient-to-r from-yellow-500 via-blue-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg px-2">
            LevelUpED
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl font-medium leading-relaxed">
          LevelUpED is a simple{" "}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            Gamified LMS
          </span>{" "}
          that promotes learning while playing and helps students excel through challenges, quizzes, and achievements.
        </p>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mt-4">
          <Button
            variant="outline"
            className="border-1 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg font-semibold shadow-md hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-base sm:text-lg px-20 py-6"
            onClick={onSignIn}
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}