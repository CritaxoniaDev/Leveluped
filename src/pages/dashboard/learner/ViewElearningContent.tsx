import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Progress } from "@/packages/shadcn/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Link, CheckCircle, Clock, Play, ChevronRight, BookOpen } from "lucide-react"

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
    if (content && id) {
      fetchCompletedSections()
    }
  }, [content, id])

  useEffect(() => {
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
        .maybeSingle()

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading learning content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Content not found</p>
      </div>
    )
  }

  const totalSections = content.content.sections?.length || 0
  const completedCount = completedSections.size

  return (
    <div className="flex">
      {/* Sticky Sidebar - Sections Navigation */}
      <aside className="sticky top-0 h-screen w-64 lg:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        {/* Content Info in Sidebar */}
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}
            className="mb-3 lg:mb-4 w-full justify-start text-xs lg:text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>

          <div className="space-y-2 mb-4">
            <Badge variant="outline" className="text-xs capitalize inline-block break-words max-w-full">
              {content.course_title}
            </Badge>
            <h2 className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white break-words line-clamp-3">
              {content.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
              <span className="font-medium">Topic:</span> {content.topic}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap ml-2">
                {completedCount}/{totalSections}
              </span>
            </div>
            <Progress value={(completedCount / totalSections) * 100} className="h-2" />
          </div>
        </div>

        {/* Sections List */}
        <div className="p-4 lg:p-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Sections
          </h3>

          <nav className="space-y-1">
            {content.content.sections?.map((section, index) => {
              const isCompleted = completedSections.has(index)
              const isActive = activeTab === index.toString()

              return (
                <li key={index} className="list-none">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(index.toString())}
                    className={`w-full justify-start text-xs h-10 ${isActive
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "text-gray-700 dark:text-gray-300"
                      }`}
                    title={section.title}
                  >
                    {/* Status Badge */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-xs ${isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-blue-400 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                      }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <span className="font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Section Title - with ellipsis */}
                    <span className="flex-1 text-left truncate">
                      {section.title}
                    </span>

                    {/* Indicator */}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </Button>
                </li>
              )
            })}
          </nav>

          {/* Completion Info */}
          {completedCount === totalSections && (
            <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                All done!
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-8 py-10">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {content.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Topic: <span className="font-semibold">{content.topic}</span>
                </p>
              </div>
            </div>

            {/* Overall Progress Card */}
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Learning Progress
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {completedCount}/{totalSections} sections
                    </span>
                  </div>
                  <Progress value={(completedCount / totalSections) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Content */}
          {content.content.sections?.map((section, index) => (
            activeTab === index.toString() && (
              <div key={index} className="mb-10">
                <Card className="border-0 shadow-lg overflow-hidden">
                  {/* Section Header */}
                  <div className={`h-2 bg-gradient-to-r ${completedSections.has(index)
                    ? 'from-green-400 to-green-600'
                    : 'from-blue-400 to-purple-600'
                    }`}></div>

                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${completedSections.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                        }`}>
                        {completedSections.has(index) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-gray-900 dark:text-white">
                          {section.title}
                        </CardTitle>
                        {!completedSections.has(index) && (
                          <Badge variant="outline" className="mt-2 flex w-fit items-center gap-1">
                            <Clock className="w-3 h-3" />
                            View to complete (5s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-8" ref={contentRef}>
                    {/* Videos Section */}
                    {section.videos && section.videos.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <Play className="w-5 h-5 text-red-500" />
                          Video Content
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {section.videos.map((video, videoIndex) => (
                            <div key={videoIndex} className="group">
                              <div className="relative overflow-hidden rounded-lg bg-black shadow-md hover:shadow-xl transition-shadow aspect-video">
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
                              <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {video.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Text Content Section */}
                    <div className="border-t pt-8 dark:border-gray-700">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                        Content
                      </h4>
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                          {section.content}
                        </div>
                      </div>
                    </div>

                    {/* Resources Section */}
                    {section.links && section.links.length > 0 && (
                      <div className="border-t pt-8 dark:border-gray-700">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                              className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group border border-blue-100 dark:border-blue-800/50"
                            >
                              <ExternalLink className="w-5 h-5 text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 truncate text-sm">
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
              </div>
            )
          ))}

          {/* Completion Summary */}
          {completedCount === totalSections && (
            <Card className="shadow-2xl border-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 mb-10">
              <CardContent className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Congratulations! 🎉
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  You've completed all sections of this learning module
                </p>
                <Button
                  onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  size="lg"
                >
                  Back to Course
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Spacer */}
          <div className="h-10"></div>
        </div>
      </main>
    </div>
  )
}