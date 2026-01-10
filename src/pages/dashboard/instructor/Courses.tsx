import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Plus, BookOpen, Calendar, Edit, Trash2, Trophy, Target, Award, Eye } from "lucide-react"

interface Course {
    id: string
    title: string
    description: string
    category: string
    image_url: string
    levels: number
    max_xp: number
    leaderboard_enabled: boolean
    badges_enabled: boolean
    quests_enabled: boolean
    premium_enabled: boolean
    status: "draft" | "published" | "archived"
    created_at: string
    updated_at: string
}

export default function Courses() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        image_url: "",
        levels: 10,
        max_xp: 5000,
        leaderboard_enabled: true,
        badges_enabled: true,
        quests_enabled: true,
        premium_enabled: false,
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("instructor_id", session.user.id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setCourses(data || [])
        } catch (error: any) {
            console.error("Error fetching courses:", error)
            toast.error("Error", {
                description: "Failed to load courses"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCourseImage = async (category: string) => {
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(category)}&per_page=1&client_id=${import.meta.env.VITE_PUBLIC_UNSPLASH_API_KEY}`
            )
            const data = await response.json()
            if (data.results && data.results.length > 0) {
                return data.results[0].urls.small
            }
            return null
        } catch (error) {
            console.error("Error fetching image:", error)
            return null
        }
    }

    const handleCreateCourse = async () => {
        try {
            setCreating(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Use provided image URL or fetch from Unsplash
            let imageUrl = formData.image_url
            if (!imageUrl && formData.category) {
                imageUrl = await fetchCourseImage(formData.category)
            }

            const { data, error } = await supabase
                .from("courses")
                .insert({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    image_url: imageUrl,
                    levels: formData.levels,
                    max_xp: formData.max_xp,
                    leaderboard_enabled: formData.leaderboard_enabled,
                    badges_enabled: formData.badges_enabled,
                    quests_enabled: formData.quests_enabled,
                    premium_enabled: formData.premium_enabled,
                    instructor_id: session.user.id,
                })
                .select()
                .single()

            if (error) throw error

            setCourses([data, ...courses])
            setFormData({
                title: "",
                description: "",
                category: "",
                image_url: "",
                levels: 10,
                max_xp: 5000,
                leaderboard_enabled: true,
                badges_enabled: true,
                quests_enabled: true,
                premium_enabled: false,
            })
            setIsCreateDialogOpen(false)
            toast.success("Course created", {
                description: "Your course has been created successfully"
            })
        } catch (error: any) {
            console.error("Error creating course:", error)
            toast.error("Error", {
                description: "Failed to create course"
            })
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return

        try {
            const { error } = await supabase
                .from("courses")
                .delete()
                .eq("id", courseId)

            if (error) throw error

            setCourses(courses.filter(c => c.id !== courseId))
            toast.success("Course deleted", {
                description: "Course has been deleted successfully"
            })
        } catch (error: any) {
            console.error("Error deleting course:", error)
            toast.error("Error", {
                description: "Failed to delete course"
            })
        }
    }

    const handleStatusChange = async (courseId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("courses")
                .update({ status: newStatus })
                .eq("id", courseId)

            if (error) throw error

            // Update local state
            setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus as "draft" | "published" | "archived" } : c))

            toast.success("Status updated", {
                description: "Course status has been changed successfully"
            })
        } catch (error: any) {
            console.error("Error updating status:", error)
            toast.error("Error", {
                description: "Failed to update course status"
            })
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "published":
                return "default"
            case "draft":
                return "secondary"
            case "archived":
                return "outline"
            default:
                return "outline"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        My Courses
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your courses and create new ones
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Course
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Course</DialogTitle>
                            <DialogDescription>
                                Add a new course to your catalog. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="title" className="text-right text-sm font-medium">
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Course title"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="description" className="text-right text-sm font-medium">
                                    Description
                                </label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Course description"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="category" className="text-right text-sm font-medium">
                                    Category
                                </label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="programming">Programming</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="data-science">Data Science</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="image_url" className="text-right text-sm font-medium">
                                    Image URL (optional)
                                </label>
                                <Input
                                    id="image_url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://example.com/image.jpg or leave blank for auto-fetch"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="levels" className="text-right text-sm font-medium">
                                    Levels
                                </label>
                                <Input
                                    id="levels"
                                    type="number"
                                    value={formData.levels}
                                    onChange={(e) => setFormData({ ...formData, levels: parseInt(e.target.value) || 10 })}
                                    className="col-span-3"
                                    placeholder="10"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="max_xp" className="text-right text-sm font-medium">
                                    Max XP
                                </label>
                                <Input
                                    id="max_xp"
                                    type="number"
                                    value={formData.max_xp}
                                    onChange={(e) => setFormData({ ...formData, max_xp: parseInt(e.target.value) || 5000 })}
                                    className="col-span-3"
                                    placeholder="5000"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <label className="text-right text-sm font-medium pt-2">
                                    Features
                                </label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="leaderboard"
                                            checked={formData.leaderboard_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, leaderboard_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="leaderboard" className="text-sm">
                                            Enable Leaderboard
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="badges"
                                            checked={formData.badges_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, badges_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="badges" className="text-sm">
                                            Enable Badges
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="quests"
                                            checked={formData.quests_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, quests_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="quests" className="text-sm">
                                            Enable Quests
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="premium"
                                            checked={formData.premium_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, premium_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="premium" className="text-sm">
                                            Enable Premium Features
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateCourse} disabled={creating}>
                                {creating ? "Creating..." : "Create Course"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Courses Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Your Courses
                    </CardTitle>
                    <CardDescription>
                        {courses.length} course{courses.length !== 1 ? 's' : ''} total
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Levels</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    No courses yet. Create your first course!
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    courses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={course.image_url || "/placeholder-course.jpg"}
                                                        alt={course.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {truncateText(course.title, 20)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {truncateText(course.description, 50)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {course.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    <span className="font-medium">{course.levels}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {course.leaderboard_enabled && <Target className="w-4 h-4 text-blue-500" />}
                                                    {course.badges_enabled && <Award className="w-4 h-4 text-purple-500" />}
                                                    {course.quests_enabled && <Trophy className="w-4 h-4 text-green-500" />}
                                                    {course.premium_enabled && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1 py-0.5 rounded">Premium</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={course.status}
                                                    onValueChange={(value) => handleStatusChange(course.id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(course.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/instructor/courses/${course.id}`)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}