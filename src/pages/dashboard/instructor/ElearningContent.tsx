import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Sparkles, FileText, Link, Plus, X, Upload } from "lucide-react"

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

interface ManualSection {
  id: string
  title: string
  content: string
  links: Array<{
    id: string
    title: string
    url: string
  }>
  videos: Array<{
    id: string
    title: string
    videoId: string
    url: string
  }>
}

export default function ElearningContent() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [elearningContents, setElearningContents] = useState<ElearningContent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai')
  const [inputType, setInputType] = useState<'paragraph' | 'bullets'>('bullets')
  const [formData, setFormData] = useState({
    topic: "",
    title: ""
  })

  // Manual content state
  const [manualTitle, setManualTitle] = useState("")
  const [manualSections, setManualSections] = useState<ManualSection[]>([])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [newLink, setNewLink] = useState({ title: "", url: "" })
  const [newVideo, setNewVideo] = useState({ title: "", videoId: "" })

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

  const fetchYouTubeVideos = async (query: string, maxResults: number = 2) => {
    try {
      const apiKey = import.meta.env.VITE_PUBLIC_YOUTUBE_API_KEY
      if (!apiKey) {
        console.warn("YouTube API key not found")
        return []
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=${maxResults}&order=relevance&safeSearch=strict`
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      return data.items.map((item: any) => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }))
    } catch (error) {
      console.error("Error fetching YouTube videos:", error)
      return []
    }
  }

  const generateContentWithAI = async (prompt: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_PUBLIC_GEMINI_API_KEY}`, {
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

    Format the response as valid JSON (no markdown, pure JSON only):
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
          ],
          "videos": []
        }
      ]
    }

    IMPORTANT: Return ONLY valid JSON with properly escaped quotes. Do not include any markdown code blocks or explanations.`

      const generatedContent = await generateContentWithAI(aiPrompt)

      let parsedContent = null
      try {
        if (!generatedContent) {
          throw new Error('No content generated')
        }

        // Remove markdown code blocks if present
        let cleanedContent = generatedContent.trim()
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')

        // Try to extract JSON object if wrapped in text
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedContent = jsonMatch[0]
        }

        // Parse and validate
        parsedContent = JSON.parse(cleanedContent)

        if (!parsedContent.sections || !Array.isArray(parsedContent.sections)) {
          throw new Error('Invalid content structure: missing sections array')
        }

        // Validate sections structure
        parsedContent.sections = parsedContent.sections.filter((section: any) =>
          section.title && section.content
        )

        if (parsedContent.sections.length === 0) {
          throw new Error('No valid sections in response')
        }

        // Ensure all sections have required fields
        parsedContent.sections = parsedContent.sections.map((section: any) => ({
          title: section.title || 'Untitled',
          content: section.content || '',
          links: Array.isArray(section.links) ? section.links.filter((l: any) => l.title && l.url) : [],
          videos: []
        }))

      } catch (e: any) {
        console.error('Failed to parse AI response:', e)
        console.error('Raw response:', generatedContent?.substring(0, 500))

        // Fallback to basic structure
        parsedContent = {
          sections: [
            {
              title: "Overview",
              content: generatedContent || "Unable to generate content. Please try again.",
              links: [],
              videos: []
            }
          ]
        }
      }

      // Fetch real YouTube videos for each section
      for (const section of parsedContent.sections) {
        try {
          const videos = await fetchYouTubeVideos(`${section.title} ${formData.topic}`, 2)
          section.videos = videos
        } catch (error) {
          console.error('Error fetching videos for section:', section.title)
          section.videos = []
        }
      }

      const { data, error } = await supabase
        .from("elearning_content")
        .insert({
          course_id: courseId,
          topic: formData.topic,
          title: `Module ${elearningContents.length + 1}: ${formData.title}`,
          content: parsedContent,
          ai_generated: true
        })
        .select()
        .single()

      if (error) throw error

      setElearningContents([data, ...elearningContents])
      setFormData({ topic: "", title: "" })
      setInputType('bullets')
      toast.success("E-learning content created", {
        description: "AI-generated content with sources and YouTube videos has been created successfully"
      })
    } catch (error: any) {
      console.error("Error creating elearning content:", error)
      toast.error("Error", {
        description: error.message || "Failed to create e-learning content"
      })
    } finally {
      setCreating(false)
    }
  }

  // Manual content functions
  const addManualSection = () => {
    const newSection: ManualSection = {
      id: Date.now().toString(),
      title: "",
      content: "",
      links: [],
      videos: []
    }
    setManualSections([...manualSections, newSection])
    setEditingSectionId(newSection.id)
  }

  const updateManualSection = (id: string, updates: Partial<ManualSection>) => {
    setManualSections(manualSections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    ))
  }

  const deleteManualSection = (id: string) => {
    setManualSections(manualSections.filter(section => section.id !== id))
  }

  const addLinkToSection = (sectionId: string) => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Error", {
        description: "Please fill in both link title and URL"
      })
      return
    }

    setManualSections(manualSections.map(section =>
      section.id === sectionId
        ? {
          ...section,
          links: [...section.links, { id: Date.now().toString(), ...newLink }]
        }
        : section
    ))
    setNewLink({ title: "", url: "" })
  }

  const removeLinkFromSection = (sectionId: string, linkId: string) => {
    setManualSections(manualSections.map(section =>
      section.id === sectionId
        ? {
          ...section,
          links: section.links.filter(link => link.id !== linkId)
        }
        : section
    ))
  }

  const addVideoToSection = (sectionId: string) => {
    if (!newVideo.title.trim() || !newVideo.videoId.trim()) {
      toast.error("Error", {
        description: "Please fill in both video title and YouTube video ID"
      })
      return
    }

    const videoUrl = `https://www.youtube.com/watch?v=${newVideo.videoId}`

    setManualSections(manualSections.map(section =>
      section.id === sectionId
        ? {
          ...section,
          videos: [...section.videos, { id: Date.now().toString(), ...newVideo, url: videoUrl }]
        }
        : section
    ))
    setNewVideo({ title: "", videoId: "" })
  }

  const removeVideoFromSection = (sectionId: string, videoId: string) => {
    setManualSections(manualSections.map(section =>
      section.id === sectionId
        ? {
          ...section,
          videos: section.videos.filter(video => video.id !== videoId)
        }
        : section
    ))
  }

  const handleCreateManualContent = async () => {
    if (!manualTitle.trim()) {
      toast.error("Error", {
        description: "Please enter a title for the content"
      })
      return
    }

    if (manualSections.length === 0) {
      toast.error("Error", {
        description: "Please add at least one section"
      })
      return
    }

    // Validate sections
    for (const section of manualSections) {
      if (!section.title.trim() || !section.content.trim()) {
        toast.error("Error", {
          description: "All sections must have a title and content"
        })
        return
      }
    }

    try {
      setCreating(true)

      const contentData = {
        sections: manualSections.map(section => ({
          title: section.title,
          content: section.content,
          links: section.links.map(link => ({
            title: link.title,
            url: link.url
          })),
          videos: section.videos.map(video => ({
            title: video.title,
            videoId: video.videoId,
            url: video.url
          }))
        }))
      }

      const { data, error } = await supabase
        .from("elearning_content")
        .insert({
          course_id: courseId,
          topic: "Manual Content",
          title: `Module ${elearningContents.length + 1}: ${manualTitle}`,
          content: contentData,
          ai_generated: false
        })
        .select()
        .single()

      if (error) throw error

      setElearningContents([data, ...elearningContents])
      setManualTitle("")
      setManualSections([])
      setEditingSectionId(null)
      setCreationMode('ai')
      toast.success("Manual content created", {
        description: "Your custom e-learning content has been created successfully"
      })
    } catch (error: any) {
      console.error("Error creating manual content:", error)
      toast.error("Error", {
        description: "Failed to create manual content"
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
          <p className="text-gray-600 dark:text-gray-400">Create learning materials for {course.title}</p>
        </div>
      </div>

      {/* Creation Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${creationMode === 'ai' ? 'ring-2 ring-blue-500' : ''
            }`}
          onClick={() => creationMode !== 'ai' && setCreationMode('ai')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Generated Content
            </CardTitle>
            <CardDescription>
              Let AI generate comprehensive content with sections and sources
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${creationMode === 'manual' ? 'ring-2 ring-blue-500' : ''
            }`}
          onClick={() => creationMode !== 'manual' && setCreationMode('manual')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Manual Content
            </CardTitle>
            <CardDescription>
              Create custom content with your own sections and videos
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* AI Content Creation Form */}
      {creationMode === 'ai' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate E-Learning Content
            </CardTitle>
            <CardDescription>
              AI will create detailed content with sections, educational sources, and YouTube videos
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
              <div className="space-y-4">
                <Label>Topic Input Type</Label>
                <RadioGroup value={inputType} onValueChange={(value) => setInputType(value as 'paragraph' | 'bullets')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bullets" id="bullets" />
                    <Label htmlFor="bullets">Bullet Points</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paragraph" id="paragraph" />
                    <Label htmlFor="paragraph">Paragraph</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                onKeyDown={(e) => {
                  if (inputType === 'bullets' && e.key === 'Enter') {
                    e.preventDefault()
                    const textarea = e.target as HTMLTextAreaElement
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const value = formData.topic
                    const before = value.substring(0, start)
                    const after = value.substring(end)
                    const newValue = before + '\n- ' + after
                    setFormData({ ...formData, topic: newValue })
                    setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = start + 3
                    }, 0)
                  }
                }}
                onPaste={(e) => {
                  if (inputType === 'bullets') {
                    e.preventDefault()
                    const textarea = e.target as HTMLTextAreaElement
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const pasted = e.clipboardData.getData('text')
                    const lines = pasted.split('\n').map(line => line.trim() ? `- ${line.trim()}` : '').join('\n')
                    const value = formData.topic
                    const before = value.substring(0, start)
                    const after = value.substring(end)
                    const newValue = before + lines + after
                    setFormData({ ...formData, topic: newValue })
                    setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = start + lines.length
                    }, 0)
                  }
                }}
                placeholder={
                  inputType === 'bullets'
                    ? "Enter topics as bullet points (one per line):\n- Machine Learning Fundamentals\n- Neural Networks\n- Deep Learning Algorithms"
                    : "Describe the topic in a paragraph..."
                }
                rows={inputType === 'bullets' ? 5 : 3}
              />
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
      )}

      {/* Manual Content Creation Form */}
      {creationMode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Create Manual Content
            </CardTitle>
            <CardDescription>
              Build custom e-learning content with your own sections, links, and videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Title */}
            <div className="space-y-2">
              <Label htmlFor="manualTitle">Content Title</Label>
              <Input
                id="manualTitle"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g., Advanced Python Programming"
              />
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sections</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addManualSection}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </Button>
              </div>

              {manualSections.length === 0 ? (
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <p className="text-gray-500 dark:text-gray-400">No sections added yet</p>
                  <p className="text-sm text-gray-400 mb-3">Add your first section to get started</p>
                  <Button variant="outline" size="sm" onClick={addManualSection}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {manualSections.map((section) => (
                    <Card key={section.id} className="p-4">
                      <div className="space-y-4">
                        {/* Section Title */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <Label>Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) =>
                                updateManualSection(section.id, { title: e.target.value })
                              }
                              placeholder="e.g., Functions and Decorators"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteManualSection(section.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Section Content */}
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <Textarea
                            value={section.content}
                            onChange={(e) =>
                              updateManualSection(section.id, { content: e.target.value })
                            }
                            placeholder="Write detailed content for this section..."
                            rows={4}
                          />
                        </div>

                        {/* Links Section */}
                        <div className="border-t pt-4 space-y-3">
                          <h4 className="font-medium text-sm">External Links</h4>
                          {section.links.map((link) => (
                            <div
                              key={link.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Link className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{link.title}</p>
                                  <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLinkFromSection(section.id, link.id)}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}

                          {editingSectionId === section.id && (
                            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              <Input
                                value={newLink.title}
                                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                placeholder="Link title"
                              />
                              <Input
                                value={newLink.url}
                                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                placeholder="https://example.com"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLinkToSection(section.id)}
                                  className="flex-1"
                                >
                                  Add Link
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewLink({ title: "", url: "" })}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {editingSectionId !== section.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSectionId(section.id)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Link
                            </Button>
                          )}
                        </div>

                        {/* Videos Section */}
                        <div className="border-t pt-4 space-y-3">
                          <h4 className="font-medium text-sm">📺 YouTube Videos</h4>
                          {section.videos.map((video) => (
                            <div
                              key={video.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{video.title}</p>
                                <p className="text-xs text-gray-500 truncate">{video.videoId}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVideoFromSection(section.id, video.id)}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}

                          {editingSectionId === section.id && (
                            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              <Input
                                value={newVideo.title}
                                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                placeholder="Video title"
                              />
                              <Input
                                value={newVideo.videoId}
                                onChange={(e) => setNewVideo({ ...newVideo, videoId: e.target.value })}
                                placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addVideoToSection(section.id)}
                                  className="flex-1"
                                >
                                  Add Video
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewVideo({ title: "", videoId: "" })}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {editingSectionId !== section.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSectionId(section.id)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Video
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateManualContent}
              disabled={creating || manualSections.length === 0}
              className="w-full"
            >
              {creating ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Content...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manual Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Created Content</h2>
        {elearningContents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No e-learning content created yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Create your first content above using AI or manual methods</p>
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
                  {content.content.sections?.length || 0} sections • Created {new Date(content.created_at).toLocaleDateString()}
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
                      {section.videos && section.videos.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-red-600">📺 {section.videos.length} videos</span>
                        </div>
                      )}
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