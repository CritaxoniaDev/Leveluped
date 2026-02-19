import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { StripeProvider } from "@/providers/StripeProvider"
import MainPage from "@/pages/MainPage"
import Login from "@/auth/Login"
import Signup from "@/auth/Signup"
import InputOTP from "@/auth/InputOTP"
import VerifyUser from "@/pages/verify/VerifyUser"
import PrivacyPolicy from "@/pages/PrivacyPolicy"
import { ReactLenis } from 'lenis/react'
import TermsOfService from "@/pages/TermsOfService"
import Pricing from "@/components/pricing"
import CourseOverview from "@/pages/CourseOverview"
import About from "@/pages/About"
import CookiesPolicy from "@/pages/CookiesPolicy"
import { LayoutDashboard } from "@/pages/dashboard/layout/LayoutDashboard"
import LearnerDashboard from "@/pages/dashboard/learner/Dashboard"
import MyCourses from "@/pages/dashboard/learner/MyCourses"
import Course from "@/pages/dashboard/learner/Course"
import TakeResourceContent from "@/pages/dashboard/learner/TakeResourceContent"
import Achievements from "@/pages/dashboard/learner/Achievements"
import LearnerProfile from "@/pages/dashboard/learner/Profile"
import LearnerViewElearningContent from "@/pages/dashboard/learner/ViewElearningContent"
import Leaderboard from "@/pages/dashboard/learner/Leaderboard"
import LearnerSettings from "@/pages/dashboard/learner/Settings"
import LearnerMessage from "@/pages/dashboard/learner/Message"
import FeedbackPage from "@/pages/dashboard/learner/FeedbackPage"
import CoinShop from "@/pages/dashboard/learner/CoinShop"
import Premium from "@/pages/dashboard/learner/Premium"
import InstructorDashboard from "@/pages/dashboard/instructor/Dashboard"
import Courses from "@/pages/dashboard/instructor/Courses"
import ViewCourse from "@/pages/dashboard/instructor/ViewCourse"
import ElearningContent from "@/pages/dashboard/instructor/ElearningContent"
import InstructorViewElearningContent from "@/pages/dashboard/instructor/ViewElearningContent"
import ViewResourceContent from "@/pages/dashboard/instructor/ViewResourceContent"
import Students from "@/pages/dashboard/instructor/Students"
import InstructorProfile from "@/pages/dashboard/instructor/Profile"
import InstructorSettings from "@/pages/dashboard/instructor/Settings"
import InstructorMessage from "@/pages/dashboard/instructor/Message"
import ViewFeedback from "@/pages/dashboard/instructor/ViewFeedback"
import AdminDashboard from "@/pages/dashboard/admin/Dashboard"
import Users from "@/pages/dashboard/admin/Users"
import CourseMap from "@/pages/dashboard/admin/CourseMap"
import AdminProfile from "@/pages/dashboard/admin/Profile"
import StripeProducts from "@/pages/dashboard/admin/StripeProducts"
import Transactions from "@/pages/dashboard/admin/Transactions"
import { Toaster } from "@/packages/shadcn/ui/sonner"
import { toast } from "sonner"

// UUID generation function
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function VersionedDiv({ children, versionId }: { children: React.ReactNode, versionId: string }) {
  return <div data-version-id={versionId}>{children}</div>
}

function AppContent() {
  const navigate = useNavigate()
  const [versionId] = useState(() => generateUUID())

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash
      if (hash) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error

          if (session) {
            navigate("/verify/user")
          }
        } catch (err) {
          toast.error("Authentication Error", {
            description: "Failed to verify email. Please try again."
          })
          navigate("/login")
        }
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <>
      <Toaster position="top-right" style={{ fontFamily: "var(--font)" }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<VersionedDiv versionId={versionId}><ReactLenis root><MainPage onSignIn={() => navigate("/login")} /></ReactLenis></VersionedDiv>} />
        <Route path="/pricing" element={<VersionedDiv versionId={versionId}><ReactLenis root><Pricing /></ReactLenis></VersionedDiv>} />
        <Route path="/signup" element={<VersionedDiv versionId={versionId}><div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8"><Signup /></div></VersionedDiv>} />
        <Route path="/login" element={<VersionedDiv versionId={versionId}><div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8"><Login /></div></VersionedDiv>} />
        <Route path="/auth/input-otp" element={<VersionedDiv versionId={versionId}><div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8"><InputOTP /></div></VersionedDiv>} />
        <Route path="/verify/user" element={<VersionedDiv versionId={versionId}><div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8"><VerifyUser /></div></VersionedDiv>} />
        
        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<VersionedDiv versionId={versionId}><ReactLenis root><PrivacyPolicy /></ReactLenis></VersionedDiv>} />
        <Route path="/terms-of-service" element={<VersionedDiv versionId={versionId}><ReactLenis root><TermsOfService /></ReactLenis></VersionedDiv>} />
        <Route path="/courses" element={<VersionedDiv versionId={versionId}><ReactLenis root><CourseOverview /></ReactLenis></VersionedDiv>} />
        <Route path="/about" element={<VersionedDiv versionId={versionId}><ReactLenis root><About /></ReactLenis></VersionedDiv>} />
        <Route path="/cookies-policy" element={<VersionedDiv versionId={versionId}><ReactLenis root><CookiesPolicy /></ReactLenis></VersionedDiv>} />

        {/* Protected Routes with Layout */}
        <Route path="/dashboard/learner" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><LearnerDashboard /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/my-courses" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><MyCourses /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/messages" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><LearnerMessage /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/profile/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><LearnerProfile /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/course/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><Course /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/course/:courseId/feedback" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><FeedbackPage /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/course/:courseId/resource/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><TakeResourceContent /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/course/:courseId/elearning/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><LearnerViewElearningContent /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/coin-shop" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><CoinShop /></LayoutDashboard></VersionedDiv>} />  
        <Route path="/dashboard/learner/achievements" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><Achievements /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/leaderboard" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><Leaderboard /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/premium" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><Premium /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/learner/settings" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["learner"]}><LearnerSettings /></LayoutDashboard></VersionedDiv>} />
        
        <Route path="/dashboard/instructor" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><InstructorDashboard /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/profile/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><InstructorProfile /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/messages" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><InstructorMessage /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/settings" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><InstructorSettings /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><Courses /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><ViewCourse /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses/:courseId/resource-content/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><ViewResourceContent /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/students" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><Students /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses/:courseId/elearning" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><ElearningContent /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses/:courseId/elearning/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><InstructorViewElearningContent /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/instructor/courses/:courseId/feedback" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["instructor"]}><ViewFeedback /></LayoutDashboard></VersionedDiv>} />

        <Route path="/dashboard/admin" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><AdminDashboard /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/admin/profile/:id" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><AdminProfile /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/admin/users" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><Users /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/admin/courses" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><CourseMap /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/admin/transactions" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><Transactions /></LayoutDashboard></VersionedDiv>} />
        <Route path="/dashboard/admin/stripe-products" element={<VersionedDiv versionId={versionId}><LayoutDashboard allowedRoles={["admin"]}><StripeProducts /></LayoutDashboard></VersionedDiv>} />

        {/* 404 Route */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                Go Home
              </button>
            </div>
          </div>
        } />
      </Routes>
    </>
  )
}

function App() {
  const [versionId] = useState(() => generateUUID())

  return (
    <StripeProvider>
      <Router>
        <div className="tracking-tight antialiased" data-version-id={versionId}>
          <AppContent />
        </div>
      </Router>
    </StripeProvider>
  )
}

export default App