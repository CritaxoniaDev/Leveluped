import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Sparkles, FileText, Link } from "lucide-react"

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
    }>
  }
  created_at: string
}

export default function ElearningContent() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [elearningContents, setElearningContents] = useState<ElearningContent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    topic: "",
    title: ""
  })

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchElearningContents()
    }
  }, [courseId])

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

  const fetchElearningContents = async () => {
    try {
      const { data, error } = await supabase
        .from("elearning_content")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setElearningContents(data || [])
    } catch (error) {
      console.error("Error fetching elearning contents:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateContentWithAI = async (prompt: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_PUBLIC_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      }
      return null
    } catch (error) {
      console.error("Error generating content with AI:", error)
      return null
    }
  }

  const handleCreateElearningContent = async () => {
    if (!formData.topic.trim() || !formData.title.trim()) {
      toast.error("Error", {
        description: "Please fill in all fields"
      })
      return
    }

    try {
      setCreating(true)

      const aiPrompt = `Generate comprehensive e-learning content about "${formData.topic}" for a course.

Create detailed content with 4-6 sections. Each section should include:
- A clear section title
- Detailed explanatory content (200-400 words)
- 2-4 relevant external links with titles

Format the response as valid JSON:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed content here...",
      "links": [
        {
          "title": "Link Title",
          "url": "https://example.com"
        }
      ]
    }
  ]
}

Ensure all links are real, educational, and relevant. Focus on quality sources like educational websites, research papers, or reputable organizations.`

      const generatedContent = await generateContentWithAI(aiPrompt)

      let parsedContent = null
      try {
        const cleanedContent = generatedContent?.trim().replace(/```json\s*|\s*```/g, '') || '{"sections": []}'
        parsedContent = JSON.parse(cleanedContent)
        if (!parsedContent.sections || !Array.isArray(parsedContent.sections)) {
          throw new Error('Invalid content structure')
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e)
        parsedContent = {
          sections: [
            {
              title: "Introduction",
              content: "This is a basic introduction to the topic.",
              links: []
            }
          ]
        }
      }

      const { data, error } = await supabase
        .from("elearning_content")
        .insert({
          course_id: courseId,
          topic: formData.topic,
          title: formData.title,
          content: parsedContent,
          ai_generated: true
        })
        .select()
        .single()

      if (error) throw error

      setElearningContents([data, ...elearningContents])
      setFormData({ topic: "", title: "" })
      toast.success("E-learning content created", {
        description: "AI-generated content with sources has been created successfully"
      })
    } catch (error: any) {
      console.error("Error creating elearning content:", error)
      toast.error("Error", {
        description: "Failed to create e-learning content"
      })
    } finally {
      setCreating(false)
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

  if (!course) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">Course not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/instructor/courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-Learning Content</h1>
          <p className="text-gray-600 dark:text-gray-400">Create AI-generated learning materials for {course.title}</p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate E-Learning Content
          </CardTitle>
          <CardDescription>
            AI will create detailed content with sections and educational sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Machine Learning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Machine Learning Fundamentals"
              />
            </div>
          </div>
          <Button onClick={handleCreateElearningContent} disabled={creating} className="w-full">
            {creating ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate E-Learning Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Created Content</h2>
        {elearningContents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No e-learning content created yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Create your first AI-generated content above</p>
            </CardContent>
          </Card>
        ) : (
          elearningContents.map((content) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{content.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/instructor/courses/${courseId}/elearning/${content.id}`)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </CardTitle>
                <CardDescription>
                  Topic: {content.topic} • {content.content.sections?.length || 0} sections • Created {new Date(content.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.content.sections?.slice(0, 3).map((section, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {section.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Link className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">{section.links?.length || 0} sources</span>
                      </div>
                    </div>
                  ))}
                </div>
                {content.content.sections && content.content.sections.length > 3 && (
                  <p className="text-sm text-gray-500 mt-4">
                    And {content.content.sections.length - 3} more sections...
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}