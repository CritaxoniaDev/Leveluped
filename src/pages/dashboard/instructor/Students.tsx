import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Search, Users, BookOpen, TrendingUp, Calendar, Mail, User } from "lucide-react"

interface Student {
    id: string
    name: string
    username: string
    email: string
    avatar_url?: string
    enrolled_at: string
    progress_percentage: number
    course_title: string
    course_id: string
    completed_at?: string
}

interface CourseSummary {
    id: string
    title: string
    total_students: number
    average_progress: number
}

export default function Students() {
    const [students, setStudents] = useState<Student[]>([])
    const [courseSummaries, setCourseSummaries] = useState<CourseSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCourse, setSelectedCourse] = useState<string>("all")
    const [sortBy, setSortBy] = useState<string>("enrolled_at")

    useEffect(() => {
        fetchStudents()
        fetchCourseSummaries()
    }, [])

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // First, get the instructor's courses
            const { data: courses, error: coursesError } = await supabase
                .from("courses")
                .select("id")
                .eq("instructor_id", session.user.id)

            if (coursesError) throw coursesError

            if (!courses || courses.length === 0) {
                setStudents([])
                return
            }

            const courseIds = courses.map(course => course.id)

            // Then, get enrollments for those courses
            const { data, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    enrolled_at,
                    progress_percentage,
                    completed_at,
                    courses (
                    id,
                    title
                    ),
                    users (
                    id,
                    name,
                    username,
                    email
                    )
                `)
                .in("course_id", courseIds)
                .order("enrolled_at", { ascending: false })

            if (error) throw error

            const formattedStudents: Student[] = data.map((enrollment: any) => ({
                id: enrollment.users.id,
                name: enrollment.users.name,
                username: enrollment.users.username,
                email: enrollment.users.email,
                enrolled_at: enrollment.enrolled_at,
                progress_percentage: enrollment.progress_percentage,
                course_title: enrollment.courses.title,
                course_id: enrollment.courses.id,
                completed_at: enrollment.completed_at
            }))

            setStudents(formattedStudents)
        } catch (error: any) {
            console.error("Error fetching students:", error)
            toast.error("Error", {
                description: "Failed to load students"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCourseSummaries = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from("courses")
                .select(`
          id,
          title,
          enrollments (
            progress_percentage
          )
        `)
                .eq("instructor_id", session.user.id)

            if (error) throw error

            const summaries: CourseSummary[] = data.map((course: any) => {
                const enrollments = course.enrollments || []
                const totalStudents = enrollments.length
                const averageProgress = totalStudents > 0
                    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + e.progress_percentage, 0) / totalStudents)
                    : 0

                return {
                    id: course.id,
                    title: course.title,
                    total_students: totalStudents,
                    average_progress: averageProgress
                }
            })

            setCourseSummaries(summaries)
        } catch (error) {
            console.error("Error fetching course summaries:", error)
        }
    }

    const filteredStudents = students
        .filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.username.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCourse = selectedCourse === "all" || student.course_id === selectedCourse
            return matchesSearch && matchesCourse
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name)
                case "progress":
                    return b.progress_percentage - a.progress_percentage
                case "enrolled_at":
                default:
                    return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
            }
        })

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return "bg-green-500"
        if (progress >= 60) return "bg-yellow-500"
        if (progress >= 30) return "bg-orange-500"
        return "bg-red-500"
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and track your enrolled students
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {students.length} Total Students
                    </span>
                </div>
            </div>

            {/* Course Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseSummaries.map((course) => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {course.total_students}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            {course.average_progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search students by name, email, or username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courseSummaries.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="enrolled_at">Enrollment Date</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="progress">Progress</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>
                        {filteredStudents.length} of {students.length} students
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchTerm || selectedCourse !== "all" ? "No students match your filters" : "No students enrolled yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Enrolled</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={`${student.id}-${student.course_id}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={student.avatar_url} alt={student.name} />
                                                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                                            {getInitials(student.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {student.email}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-500">
                                                            @{student.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {student.course_title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(student.progress_percentage)}`}
                                                            style={{ width: `${student.progress_percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {student.progress_percentage}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(student.enrolled_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.completed_at ? (
                                                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Completed
                                                    </Badge>
                                                ) : student.progress_percentage > 0 ? (
                                                    <Badge variant="secondary">
                                                        In Progress
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Not Started
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}