import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Link, CheckCircle, Clock, Play } from "lucide-react"

interface ElearningContent {
  id: string
  topic: string
  title: string
  content: {
    sections: Array<{
      title: string
      content: string
      links?: Array<{
        title: string
        url: string
      }>
      videos?: Array<{
        title: string
        url: string
        videoId: string
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
  const [activeTab, setActiveTab] = useState("0")
  const [viewTimers] = useState<Map<number, number>>(new Map())
  const [progressId, setProgressId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const completedSectionsRef = useRef<Set<number>>(new Set())
  const viewTimersRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    if (id) {
      fetchContent()
    }
  }, [id])

  useEffect(() => {
    // Load completed sections from database
    if (content && id) {
      fetchCompletedSections()
    }
  }, [content, id])

  useEffect(() => {
    // Update refs when state changes
    completedSectionsRef.current = completedSections
    viewTimersRef.current = viewTimers
  }, [completedSections, viewTimers])

  const fetchCompletedSections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("elearning_progress")
        .select("id, completed_sections")
        .eq("user_id", session.user.id)
        .eq("elearning_content_id", id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setCompletedSections(new Set(data.completed_sections))
        setProgressId(data.id)
      } else {
        setProgressId(null)
      }
    } catch (error) {
      console.error("Error fetching completed sections:", error)
    }
  }

  const updateCompletedSections = async (newCompleted: Set<number>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const completedArray = [...newCompleted]
      const isFullyCompleted = completedArray.length === (content?.content.sections?.length || 0)

      if (progressId) {
        const { error } = await supabase
          .from("elearning_progress")
          .update({
            completed_sections: completedArray,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", progressId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("elearning_progress")
          .insert({
            user_id: session.user.id,
            elearning_content_id: id,
            completed_sections: completedArray,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .select("id")
          .single()

        if (error) throw error
        setProgressId(data.id)
      }
    } catch (error) {
      console.error("Error updating completed sections:", error)
    }
  }

  useEffect(() => {
    const sectionIndex = parseInt(activeTab)
    if (!completedSectionsRef.current.has(sectionIndex)) {
      const existingTimer = viewTimersRef.current.get(sectionIndex)
      if (existingTimer) clearTimeout(existingTimer)

      const timer = setTimeout(() => {
        const newCompleted = new Set([...completedSectionsRef.current, sectionIndex])
        setCompletedSections(newCompleted)
        updateCompletedSections(newCompleted)
        toast.success("Section completed!", {
          description: `You've completed "${content?.content.sections?.[sectionIndex]?.title}"`
        })
      }, 5000)

      viewTimersRef.current.set(sectionIndex, timer)
    }

    return () => {
      const timer = viewTimersRef.current.get(sectionIndex)
      if (timer) clearTimeout(timer)
    }
  }, [activeTab, content])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const totalSections = content.content.sections?.length || 0
  const completedCount = completedSections.size

  return (
    <div className="mx-auto px-6 sm:px-10 lg:px-20 py-2">
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
              {completedCount} of {totalSections} sections completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalSections) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          {content.content.sections?.map((section, index) => (
            <TabsTrigger
              key={index}
              value={index.toString()}
              className="relative flex items-center gap-2 py-2"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSections.has(index)
                ? 'bg-green-500 text-white'
                : activeTab === index.toString()
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                {completedSections.has(index) ? <CheckCircle className="w-3 h-3" /> : index + 1}
              </div>
              <span className="hidden lg:inline truncate">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {content.content.sections?.map((section, index) => (
          <TabsContent key={index} value={index.toString()} className="mt-0">
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completedSections.has(index)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {completedSections.has(index) ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  {section.title}
                  {!completedSections.has(index) && (
                    <Badge variant="outline" className="ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Viewing to complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6" ref={activeTab === index.toString() ? contentRef : null}>
                {/* Videos Section */}
                {section.videos && section.videos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Play className="w-5 h-5 text-red-500" />
                      Video Content
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.videos.map((video, videoIndex) => (
                        <div key={videoIndex} className="group">
                          <div className="relative overflow-hidden rounded-lg bg-black shadow-md hover:shadow-lg transition-shadow aspect-video">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {video.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Content Section */}
                <div className="border-t pt-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>

                {/* Resources Section */}
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
                          <ExternalLink className="w-4 h-4 text-blue-600 group-hover:text-blue-700 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 truncate">
                              {link.title}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 truncate">
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
          </TabsContent>
        ))}
      </Tabs>

      {/* Completion Summary */}
      {completedCount === totalSections && (
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
  )
}