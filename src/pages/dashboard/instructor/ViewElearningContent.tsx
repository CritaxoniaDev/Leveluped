import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Badge } from "@/packages/shadcn/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/packages/shadcn/ui/alert-dialog"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, BookOpen, Sparkles, Edit, Trash2, Play } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
}

interface ElearningContent {
  id: string
  topic: string
  title: string
  content: {
    sections: Array<{
      title: string
      content: string
      links: Array<{
        title: string
        url: string
      }>
      videos: Array<{
        title: string
        videoId: string
        url: string
      }>
    }>
  }
  created_at: string
}

export default function ViewElearningContent() {
  const { courseId, id } = useParams<{ courseId: string; id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [content, setContent] = useState<ElearningContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (courseId && id) {
      fetchCourse()
      fetchContent()
    }
  }, [courseId, id])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("id", courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error("Error fetching course:", error)
      navigate("/dashboard/instructor/courses")
    }
  }

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("elearning_content")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setContent(data)
    } catch (error) {
      console.error("Error fetching content:", error)
      toast.error("Error", {
        description: "Failed to load e-learning content"
      })
      navigate(`/dashboard/instructor/courses/${courseId}/elearning`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const { error } = await supabase
        .from("elearning_content")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Content deleted", {
        description: "E-learning content has been deleted successfully"
      })
      navigate(`/dashboard/instructor/courses/${courseId}/elearning`)
    } catch (error: any) {
      console.error("Error deleting content:", error)
      toast.error("Error", {
        description: "Failed to delete content"
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading e-learning content...</p>
        </div>
      </div>
    )
  }

  if (!course || !content) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">Content not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/instructor/courses/${courseId}/elearning`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to E-Learning Content
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{content.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">Course: {course.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete E-Learning Content</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{content.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ All sections, links, and videos associated with this content will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Content
                    </>
                  )}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Content Overview
          </CardTitle>
          <CardDescription>
            Topic: {content.topic} • {content.content.sections?.length || 0} sections • Created {new Date(content.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {content.content.sections?.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">{index + 1}</Badge>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>

              {section.videos && section.videos.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-white">Related Videos</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.videos.map((video, videoIndex) => (
                      <div key={videoIndex} className="space-y-2">
                        <div className="aspect-video" role="presentation">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            title={video.title}
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-red-500" />
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {video.title}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.links && section.links.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-white">Additional Resources</h4>
                  <div className="grid gap-2">
                    {section.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 hover:underline">
                          {link.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Generation Note */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">AI-Generated Content</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            This content was generated using AI. Review and edit as needed to ensure accuracy and relevance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}