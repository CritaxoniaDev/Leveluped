import { useEffect, useState, useRef } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardHeader } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Textarea } from "@/packages/shadcn/ui/textarea"
import { Input } from "@/packages/shadcn/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/shadcn/ui/avatar"
import { toast } from "sonner"
import { Loader2, MessageCircle, ThumbsUp, Share2, MoreHorizontal, ArrowLeft } from "lucide-react"

type ForumPost = {
    id: string
    user_id: string
    title: string
    content: string
    created_at: string
    upvotes: number
    comments_count: number
    user: { username: string, avatar_url: string | null }
}

type ForumComment = {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    user: { username: string, avatar_url: string | null }
}

function Forum() {
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
    const [comments, setComments] = useState<ForumComment[]>([])
    const [commentText, setCommentText] = useState("")
    const [commentLoading, setCommentLoading] = useState(false)
    const [upvoting, setUpvoting] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const commentsSubscriptionRef = useRef<any>(null)
    const commentIdsRef = useRef<Set<string>>(new Set())

    // Helper function to normalize user data
    const normalizeUser = (user: any) => {
        return Array.isArray(user) ? user[0] : user
    }

    // Get current user
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        getCurrentUser()
    }, [])

    // Fetch posts
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from("forum_posts")
                .select(`
                    id, user_id, title, content, created_at, upvotes, 
                    comments_count,
                    user:users(username, avatar_url)
                `)
                .order("created_at", { ascending: false })

            if (!error && data) {
                const normalizedPosts = (data as any[]).map(p => ({
                    ...p,
                    user: normalizeUser(p.user)
                }))
                setPosts(normalizedPosts)
            }
            setLoading(false)
        }

        fetchPosts()

        // Subscribe to new posts in real-time
        const postsSubscription = supabase
            .channel("forum_posts")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "forum_posts" },
                async (payload: any) => {
                    const newPost = payload.new
                    const { data: userData } = await supabase
                        .from("users")
                        .select("username, avatar_url")
                        .eq("id", newPost.user_id)
                        .single()

                    if (userData) {
                        setPosts(prev => [
                            { ...newPost, user: userData },
                            ...prev
                        ])
                    }
                }
            )
            .subscribe()

        // Subscribe to upvote changes
        const upvoteSubscription = supabase
            .channel("forum_upvotes")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "forum_posts" },
                (payload: any) => {
                    setPosts(prev =>
                        prev.map(p =>
                            p.id === payload.new.id
                                ? { ...p, upvotes: payload.new.upvotes }
                                : p
                        )
                    )
                }
            )
            .subscribe()

        return () => {
            postsSubscription.unsubscribe()
            upvoteSubscription.unsubscribe()
        }
    }, [])

    // Fetch comments for selected post
    useEffect(() => {
        if (!selectedPost) {
            // Cleanup when deselecting post
            if (commentsSubscriptionRef.current) {
                commentsSubscriptionRef.current.unsubscribe()
                commentsSubscriptionRef.current = null
            }
            commentIdsRef.current.clear()
            return
        }

        const fetchComments = async () => {
            setCommentLoading(true)
            const { data, error } = await supabase
                .from("forum_comments")
                .select(`
                    id, post_id, user_id, content, created_at,
                    user:users(username, avatar_url)
                `)
                .eq("post_id", selectedPost.id)
                .order("created_at", { ascending: true })

            if (!error && data) {
                const normalizedComments = (data as any[]).map(c => ({
                    ...c,
                    user: normalizeUser(c.user)
                }))
                setComments(normalizedComments)
                
                // Track existing comment IDs to avoid duplicates
                normalizedComments.forEach(c => commentIdsRef.current.add(c.id))
            }
            setCommentLoading(false)
        }

        fetchComments()

        // Unsubscribe from previous subscription
        if (commentsSubscriptionRef.current) {
            commentsSubscriptionRef.current.unsubscribe()
        }

        // Subscribe to new comments in real-time
        commentsSubscriptionRef.current = supabase
            .channel(`forum_comments_${selectedPost.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "forum_comments", filter: `post_id=eq.${selectedPost.id}` },
                async (payload: any) => {
                    const newComment = payload.new
                    
                    // Check if comment ID already exists to avoid duplicates
                    if (commentIdsRef.current.has(newComment.id)) {
                        return
                    }
                    
                    const { data: userData } = await supabase
                        .from("users")
                        .select("username, avatar_url")
                        .eq("id", newComment.user_id)
                        .single()

                    if (userData) {
                        commentIdsRef.current.add(newComment.id)
                        setComments(prev => [
                            ...prev,
                            { ...newComment, user: userData }
                        ])
                        // Update comments count in posts
                        setPosts(prev =>
                            prev.map(p =>
                                p.id === selectedPost.id
                                    ? { ...p, comments_count: p.comments_count + 1 }
                                    : p
                            )
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            if (commentsSubscriptionRef.current) {
                commentsSubscriptionRef.current.unsubscribe()
                commentsSubscriptionRef.current = null
            }
        }
    }, [selectedPost])

    // Create a new post
    const handleCreatePost = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content required")
            return
        }
        setCreating(true)

        try {
            if (!currentUser) {
                toast.error("You must be logged in to post")
                setCreating(false)
                return
            }

            const { data, error } = await supabase
                .from("forum_posts")
                .insert([{
                    title,
                    content,
                    user_id: currentUser.id
                }])
                .select(`
                    id, user_id, title, content, created_at, upvotes, comments_count,
                    user:users(username, avatar_url)
                `)
                .single()

            if (error) {
                console.error("Post error:", error)
                toast.error(`Failed to post: ${error.message}`)
                return
            }

            if (data) {
                const normalizedPost = {
                    ...data,
                    user: normalizeUser((data as any).user)
                }
                setPosts([normalizedPost, ...posts])
                setTitle("")
                setContent("")
                toast.success("Posted successfully!")
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            toast.error("An unexpected error occurred")
        }

        setCreating(false)
    }

    // Upvote a post
    const handleUpvote = async (postId: string) => {
        setUpvoting(postId)
        try {
            const { error } = await supabase.rpc("forum_upvote", { post_id: postId })
            if (error) {
                toast.error("Failed to upvote")
            } else {
                setPosts(posts =>
                    posts.map(p =>
                        p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p
                    )
                )
                if (selectedPost?.id === postId) {
                    setSelectedPost(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null)
                }
            }
        } catch (err) {
            console.error("Upvote error:", err)
            toast.error("Failed to upvote")
        }
        setUpvoting(null)
    }

    // Add a comment
    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedPost) return
        
        if (!currentUser) {
            toast.error("You must be logged in to comment")
            return
        }

        setCommentLoading(true)
        try {
            const { data, error } = await supabase
                .from("forum_comments")
                .insert([{ 
                    post_id: selectedPost.id, 
                    content: commentText,
                    user_id: currentUser.id
                }])
                .select(`
                    id, post_id, user_id, content, created_at,
                    user:users(username, avatar_url)
                `)
                .single()

            if (error) {
                console.error("Comment error:", error)
                toast.error(`Failed to comment: ${error.message}`)
                return
            }

            if (data) {
                const normalizedComment = {
                    ...data,
                    user: normalizeUser((data as any).user)
                }
                
                // Add to tracking set
                commentIdsRef.current.add(normalizedComment.id)
                
                setComments([...comments, normalizedComment])
                setCommentText("")
                setPosts(posts =>
                    posts.map(p =>
                        p.id === selectedPost.id
                            ? { ...p, comments_count: p.comments_count + 1 }
                            : p
                    )
                )
                if (selectedPost?.id === selectedPost.id) {
                    setSelectedPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
                }
                toast.success("Comment added!")
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            toast.error("An unexpected error occurred")
        }
        setCommentLoading(false)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    // Show post detail view
    if (selectedPost) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPost(null)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discussion</h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
                    {/* Post Card */}
                    <Card className="border-0 shadow-md dark:shadow-lg">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="flex gap-4">
                                <Avatar className="w-12 h-12 flex-shrink-0">
                                    <AvatarImage src={selectedPost.user?.avatar_url || undefined} alt={selectedPost.user?.username} />
                                    <AvatarFallback className="bg-blue-500 text-white font-bold text-lg">
                                        {selectedPost.user?.username?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        @{selectedPost.user?.username}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(selectedPost.created_at)}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedPost.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {selectedPost.content}
                                </p>
                            </div>

                            {/* Post Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                    onClick={() => handleUpvote(selectedPost.id)}
                                    disabled={upvoting === selectedPost.id}
                                >
                                    <ThumbsUp className="w-5 h-5 mr-2" />
                                    {selectedPost.upvotes} Likes
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {selectedPost.comments_count} Comments
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                >
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments Section */}
                    <Card className="border-0 shadow-md dark:shadow-lg">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                Comments ({selectedPost.comments_count})
                            </h3>

                            {/* Comment Input */}
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-6 space-y-3">
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                        <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                            {currentUser?.email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <Textarea
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            rows={2}
                                            className="bg-gray-100 dark:bg-gray-800 border-0 resize-none"
                                            maxLength={500}
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCommentText("")}
                                                disabled={!commentText.trim()}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleAddComment}
                                                disabled={commentLoading || !commentText.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {commentLoading ? (
                                                    <>
                                                        <Loader2 className="animate-spin w-3 h-3 mr-2" />
                                                        Posting...
                                                    </>
                                                ) : (
                                                    "Comment"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {commentLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin w-5 h-5 text-blue-600" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        No comments yet. Be the first to comment!
                                    </p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                                <AvatarImage src={comment.user?.avatar_url || undefined} alt={comment.user?.username} />
                                                <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                                    {comment.user?.username?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        {comment.user?.username}
                                                    </p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDate(comment.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Show posts list
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Community Forum</h1>
                    <p className="text-gray-600 dark:text-gray-400">Ask questions, share knowledge, and help others</p>
                </div>

                {/* Create Post Card */}
                <Card className="border-0 shadow-md dark:shadow-lg">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex gap-4">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarFallback className="bg-blue-500 text-white font-bold">
                                    {currentUser?.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Input
                                    placeholder="What's your question?"
                                    className="mb-3 bg-gray-100 dark:bg-gray-800 border-0"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={100}
                                />
                                <Textarea
                                    placeholder="Provide details..."
                                    className="mb-4 bg-gray-100 dark:bg-gray-800 border-0 resize-none"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={3}
                                    maxLength={1000}
                                />
                                <Button 
                                    onClick={handleCreatePost} 
                                    disabled={creating || !title.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                            Posting...
                                        </>
                                    ) : (
                                        "Post"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Posts List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                        </div>
                    ) : posts.length === 0 ? (
                        <Card className="border-0 shadow-md p-12 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                No posts yet. Be the first to ask a question!
                            </p>
                        </Card>
                    ) : (
                        posts.map(post => (
                            <Card 
                                key={post.id} 
                                className="border-0 shadow-md hover:shadow-lg transition-shadow dark:shadow-lg"
                            >
                                <CardContent className="p-6 space-y-4">
                                    {/* Post Header */}
                                    <div className="flex gap-4">
                                        <Avatar className="w-10 h-10 flex-shrink-0">
                                            <AvatarImage src={post.user?.avatar_url || undefined} alt={post.user?.username} />
                                            <AvatarFallback className="bg-blue-500 text-white font-bold">
                                                {post.user?.username?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        @{post.user?.username}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(post.created_at)}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                                            {post.content}
                                        </p>
                                    </div>

                                    {/* Post Stats */}
                                    <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span>{post.upvotes} likes</span>
                                        <span>{post.comments_count} comments</span>
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleUpvote(post.id)
                                            }}
                                            disabled={upvoting === post.id}
                                        >
                                            <ThumbsUp className="w-4 h-4 mr-2" />
                                            <span className="text-xs">Like</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedPost(post)
                                            }}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            <span className="text-xs">Comment</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Share2 className="w-4 h-4 mr-2" />
                                            <span className="text-xs">Share</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Forum