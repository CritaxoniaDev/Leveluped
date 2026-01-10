import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import MainPage from "@/pages/MainPage"
import Login from "@/auth/Login"
import Signup from "@/auth/Signup"
import VerifyUser from "@/pages/verify/VerifyUser"
import { LayoutDashboard } from "@/pages/dashboard/layout/LayoutDashboard"
import LearnerDashboard from "@/pages/dashboard/learner/Dashboard"
import Course from "@/pages/dashboard/learner/Course"
import TakeResourceContent from "@/pages/dashboard/learner/TakeResourceContent"
import InstructorDashboard from "@/pages/dashboard/instructor/Dashboard"
import Courses from "@/pages/dashboard/instructor/Courses"
import ViewCourse from "@/pages/dashboard/instructor/ViewCourse"
import ElearningContent from "@/pages/dashboard/instructor/ElearningContent"
import ViewElearningContent from "@/pages/dashboard/learner/ViewElearningContent"
import ViewResourceContent from "@/pages/dashboard/instructor/ViewResourceContent"
import Students from "@/pages/dashboard/instructor/Students"
import AdminDashboard from "@/pages/dashboard/admin/Dashboard"
import Users from "@/pages/dashboard/admin/Users"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

function AppContent() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for auth callback from email verification
    const handleAuthCallback = async () => {
      const hash = window.location.hash
      if (hash) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error

          if (session) {
            // Route to verify page which will check role and redirect appropriately
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
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <MainPage onSignIn={() => navigate("/login")} />
          </div>
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

        <Route path="/verify/user" element={
          <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a] py-12 px-4 sm:px-6 lg:px-8">
            <VerifyUser />
          </div>
        } />

        {/* Protected Routes with Layout */}
        <Route path="/dashboard/learner" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <LearnerDashboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/course/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <Course />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/learner/course/:courseId/resource/:id" element={
          <LayoutDashboard allowedRoles={["learner"]}>
            <TakeResourceContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/instructor" element={
          <LayoutDashboard allowedRoles={["instructor"]}>
            <InstructorDashboard />
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
            <ViewElearningContent />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <AdminDashboard />
          </LayoutDashboard>
        } />

        <Route path="/dashboard/admin/users" element={
          <LayoutDashboard allowedRoles={["admin"]}>
            <Users />
          </LayoutDashboard>
        } />

        {/* 404 Route */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-white text-2xl">404 - Page Not Found</p>
          </div>
        } />
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App