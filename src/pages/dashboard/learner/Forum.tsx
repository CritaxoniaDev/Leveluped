import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Textarea } from "@/packages/shadcn/ui/textarea"
import { Input } from "@/packages/shadcn/ui/input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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

    // Helper function to normalize user data
    const normalizeUser = (user: any) => {
        return Array.isArray(user) ? user[0] : user
    }

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
        if (!selectedPost) return

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
            }
            setCommentLoading(false)
        }

        fetchComments()

        // Subscribe to new comments in real-time
        const commentsSubscription = supabase
            .channel(`forum_comments_${selectedPost.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "forum_comments", filter: `post_id=eq.${selectedPost.id}` },
                async (payload: any) => {
                    const newComment = payload.new
                    const { data: userData } = await supabase
                        .from("users")
                        .select("username, avatar_url")
                        .eq("id", newComment.user_id)
                        .single()

                    if (userData) {
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
            commentsSubscription.unsubscribe()
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("You must be logged in to post")
                setCreating(false)
                return
            }

            const { data, error } = await supabase
                .from("forum_posts")
                .insert([{
                    title,
                    content,
                    user_id: user.id  // Add user_id explicitly
                }])
                .select(`
                id, user_id, title, content, created_at, upvotes, comments_count,
                user:users(username, avatar_url)
            `)
                .single()

            if (error) {
                console.error("Post error:", error)  // Log error for debugging
                toast.error(`Failed to post: ${error.message}`)
            } else if (data) {
                const normalizedPost = {
                    ...data,
                    user: normalizeUser((data as any).user)
                }
                setPosts([normalizedPost, ...posts])
                setTitle("")
                setContent("")
                toast.success("Posted!")
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
        const { error } = await supabase.rpc("forum_upvote", { post_id: postId })
        if (error) {
            toast.error("Failed to upvote")
        } else {
            setPosts(posts =>
                posts.map(p =>
                    p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p
                )
            )
        }
        setUpvoting(null)
    }

    // Add a comment
    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedPost) return
        setCommentLoading(true)
        const { data, error } = await supabase
            .from("forum_comments")
            .insert([{ post_id: selectedPost.id, content: commentText }])
            .select(`
                id, post_id, user_id, content, created_at,
                user:users(username, avatar_url)
            `)
            .single()

        if (!error && data) {
            const normalizedComment = {
                ...data,
                user: normalizeUser((data as any).user)
            }
            setComments([...comments, normalizedComment])
            setCommentText("")
            setPosts(posts =>
                posts.map(p =>
                    p.id === selectedPost.id
                        ? { ...p, comments_count: p.comments_count + 1 }
                        : p
                )
            )
        }
        setCommentLoading(false)
    }

    // Reddit-like layout
    return (
        <div className="max-w-4xl mx-auto py-8 px-2">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Forum</h1>
            <Card className="mb-8">
                <CardContent className="p-4">
                    <h2 className="font-semibold mb-2 text-lg">Ask a Question</h2>
                    <Input
                        placeholder="Title"
                        className="mb-2"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={100}
                    />
                    <Textarea
                        placeholder="What's your question?"
                        className="mb-2"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={3}
                        maxLength={1000}
                    />
                    <Button onClick={handleCreatePost} disabled={creating}>
                        {creating ? <Loader2 className="animate-spin w-4 h-4" /> : "Post"}
                    </Button>
                </CardContent>
            </Card>
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6" /></div>
                ) : posts.length === 0 ? (
                    <div className="text-center text-gray-500">No posts yet. Be the first to ask!</div>
                ) : (
                    posts.map(post => (
                        <Card key={post.id} className="flex flex-row items-start p-0">
                            <div className="flex flex-col items-center px-3 py-4 bg-gray-50 dark:bg-[#18181b] rounded-l-lg">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mb-1"
                                    onClick={() => handleUpvote(post.id)}
                                    disabled={upvoting === post.id}
                                >
                                    ▲
                                </Button>
                                <span className="font-bold text-indigo-600">{post.upvotes}</span>
                            </div>
                            <CardContent className="flex-1 py-4 px-6 cursor-pointer" onClick={() => setSelectedPost(post)}>
                                <div className="flex items-center gap-2 mb-1">
                                    {post.user?.avatar_url && (
                                        <img src={post.user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                                    )}
                                    <span className="text-sm text-gray-500">@{post.user?.username || "user"}</span>
                                    <span className="text-xs text-gray-400 ml-2">{new Date(post.created_at).toLocaleString()}</span>
                                </div>
                                <h3 className="font-semibold text-lg">{post.title}</h3>
                                <p className="text-gray-700 dark:text-gray-300 mt-1">{post.content}</p>
                                <div className="mt-2 text-xs text-gray-500">{post.comments_count} comments</div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            {/* Post detail & comments modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-y-auto">
                    <div className="bg-white dark:bg-[#18181b] rounded-lg shadow-lg max-w-xl w-full p-6 relative my-8">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                            onClick={() => setSelectedPost(null)}
                        >✕</button>
                        <div className="flex items-center gap-2 mb-2">
                            {selectedPost.user?.avatar_url && (
                                <img src={selectedPost.user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" />
                            )}
                            <span className="text-sm text-gray-500">@{selectedPost.user?.username || "user"}</span>
                            <span className="text-xs text-gray-400 ml-2">{new Date(selectedPost.created_at).toLocaleString()}</span>
                        </div>
                        <h2 className="font-bold text-xl mb-1">{selectedPost.title}</h2>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">{selectedPost.content}</p>
                        <div className="mb-2 font-semibold">Comments</div>
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-3">
                            {commentLoading ? (
                                <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                            ) : comments.length === 0 ? (
                                <div className="text-gray-400 text-sm">No comments yet.</div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex items-start gap-2">
                                        {c.user?.avatar_url && (
                                            <img src={c.user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full mt-1" />
                                        )}
                                        <div>
                                            <div className="text-xs text-gray-500">@{c.user?.username || "user"} · {new Date(c.created_at).toLocaleString()}</div>
                                            <div className="text-gray-800 dark:text-gray-200">{c.content}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                rows={2}
                                className="flex-1"
                                maxLength={500}
                            />
                            <Button onClick={handleAddComment} disabled={commentLoading || !commentText.trim()}>
                                {commentLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Comment"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Forum