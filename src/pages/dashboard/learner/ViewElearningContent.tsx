import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Link, CheckCircle } from "lucide-react"

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
    }>
  }
  course_title: string
}

export default function ViewElearningContent() {
  const { courseId, id } = useParams<{ courseId: string; id: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState<ElearningContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (id) {
      fetchContent()
    }
  }, [id])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/login")
        return
      }

      const { data, error } = await supabase
        .from("elearning_content")
        .select(`
          id,
          topic,
          title,
          content,
          courses (
            title
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      setContent({
        id: data.id,
        topic: data.topic,
        title: data.title,
        content: data.content,
        course_title: (data.courses as any)?.title || "Unknown Course"
      })
    } catch (error: any) {
      console.error("Error fetching content:", error)
      toast.error("Error", {
        description: "Failed to load content"
      })
      navigate(`/dashboard/learner/course/${courseId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = (sectionIndex: number) => {
    const newCompleted = new Set(completedSections)
    if (newCompleted.has(sectionIndex)) {
      newCompleted.delete(sectionIndex)
    } else {
      newCompleted.add(sectionIndex)
    }
    setCompletedSections(newCompleted)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading learning content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Content not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/learner/course/${courseId}`)} className="hover:bg-white/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">{content.course_title}</Badge>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {content.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Topic: {content.topic}</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Learning Progress</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completedSections.size} of {content.content.sections?.length || 0} sections completed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${((completedSections.size / (content.content.sections?.length || 1)) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {content.content.sections?.map((section, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      completedSections.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    {section.title}
                  </CardTitle>
                  <Button
                    variant={completedSections.has(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMarkComplete(index)}
                    className={completedSections.has(index) ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {completedSections.has(index) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </>
                    ) : (
                      "Mark Complete"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>

                {section.links && section.links.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Link className="w-5 h-5" />
                      Additional Resources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 truncate">
                              {link.title}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-500 truncate">
                              {link.url}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Summary */}
        {completedSections.size === (content.content.sections?.length || 0) && (
          <Card className="mt-8 shadow-2xl border-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardContent className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Congratulations! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You've completed all sections of this e-learning content
              </p>
              <Button onClick={() => navigate(`/dashboard/learner/course/${courseId}`)} className="bg-green-500 hover:bg-green-600">
                Back to Course
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}