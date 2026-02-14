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
import CourseOverview from "@/pages/CourseOverview"
import About from "@/pages/About"
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
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

// UUID generation function
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function AppContent() {
  const navigate = useNavigate()

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
        <Route path="/" element={
          <ReactLenis root>
            <MainPage onSignIn={() => navigate("/login")} />
          </ReactLenis>
        } />

        <Route path="/signup" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <Signup />
          </div>
        } />

        <Route path="/login" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <Login />
          </div>
        } />

        <Route path="/auth/input-otp" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <InputOTP />
          </div>
        } />

        <Route path="/verify/user" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <VerifyUser />
          </div>
        } />

        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<ReactLenis root><PrivacyPolicy /></ReactLenis>} />
        <Route path="/terms-of-service" element={<ReactLenis root><TermsOfService /></ReactLenis>} />
        <Route path="/course/:id" element={<ReactLenis root><CourseOverview /></ReactLenis>} />
        <Route path="/about" element={<ReactLenis root><About /></ReactLenis>} />

        {/* Protected Routes with Layout */}
        <Route path="/dashboard/learner" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerDashboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/my-courses" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <MyCourses />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/messages" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerMessage />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/profile/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerProfile />
          </LayoutDashboard>
        } />

        {/* Course Route */}
        <Route path="/dashboard/learner/course/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <Course />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/course/:courseId/feedback" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <FeedbackPage />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/course/:courseId/resource/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <TakeResourceContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/course/:courseId/elearning/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerViewElearningContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/achievements" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <Achievements />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/leaderboard" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <Leaderboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/settings" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerSettings />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorDashboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/profile/:id" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorProfile />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/messages" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorMessage />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/settings" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorSettings />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <Courses />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses/:id" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <ViewCourse />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses/:courseId/resource-content/:id" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <ViewResourceContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/students" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <Students />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses/:courseId/elearning" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <ElearningContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses/:courseId/elearning/:id" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorViewElearningContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor/courses/:courseId/feedback" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <ViewFeedback />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <AdminDashboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin/profile/:id" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <AdminProfile />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin/users" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <Users />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin/courses" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <CourseMap />
          </LayoutDashboard>
        } />

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
        <div className="tracking-tighter antialiased" data-version-id={versionId}>
          <AppContent />
        </div>
      </Router>
    </StripeProvider>
  )
}

export default App