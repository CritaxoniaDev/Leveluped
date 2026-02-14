import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, ArrowLeft, Search, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
    id: string
    participant_1_id: string
    participant_2_id: string
    last_message_id?: string | null
    last_message_at?: string | null
    created_at: string
    updated_at: string
    otherUser?: {
        id: string
        name: string
        username: string
        avatar_url?: string
    }
    lastMessage?: {
        id: string
        content: string
        sender_id: string
        created_at: string
    } | null
}

interface Message {
    id: string
    sender_id: string
    recipient_id: string
    content: string
    is_read: boolean
    created_at: string
}

interface UserProfile {
    id: string
    name: string
    username: string
    avatar_url?: string
    role: string
}

export default function InstructorMessage() {
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<any>(null)

    useEffect(() => {
        fetchCurrentUser()
    }, [])

    useEffect(() => {
        if (currentUser) {
            fetchConversations()
        }
    }, [currentUser])

    useEffect(() => {
        if (selectedConversation && currentUser) {
            fetchMessages()
            markAsRead()
            subscribeToMessages()

            return () => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current)
                    channelRef.current = null
                }
            }
        }
    }, [selectedConversation?.id, currentUser?.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchCurrentUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate("/login")
                return
            }

            const { data: user, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single()

            if (error) throw error
            setCurrentUser(user)
        } catch (error: any) {
            console.error("Error fetching user:", error)
            toast.error("Error", { description: "Failed to load user" })
        } finally {
            setLoading(false)
        }
    }

    const fetchConversations = async () => {
        try {
            if (!currentUser) return

            const { data, error } = await supabase
                .from("conversations")
                .select(`
                id,
                participant_1_id,
                participant_2_id,
                last_message_id,
                last_message_at,
                created_at,
                updated_at
            `)
                .or(
                    `participant_1_id.eq.${currentUser.id},participant_2_id.eq.${currentUser.id}`
                )
                .order("last_message_at", { ascending: false, nullsFirst: false })

            if (error) throw error

            // Fetch user details and last message for each conversation
            const conversationsWithUsers = await Promise.all(
                (data || []).map(async (conv: any): Promise<Conversation | null> => {
                    const otherUserId = conv.participant_1_id === currentUser.id
                        ? conv.participant_2_id
                        : conv.participant_1_id

                    const { data: otherUser, error: userError } = await supabase
                        .from("users")
                        .select("id, name, username, avatar_url")
                        .eq("id", otherUserId)
                        .single()

                    if (userError) {
                        console.error("Error fetching other user:", userError)
                        return null
                    }

                    // Fetch last message by querying messages table directly
                    let lastMessage = null
                    const { data: messageData, error: msgError } = await supabase
                        .from("messages")
                        .select("id, content, sender_id, created_at")
                        .or(
                            `and(sender_id.eq.${conv.participant_1_id},recipient_id.eq.${conv.participant_2_id}),and(sender_id.eq.${conv.participant_2_id},recipient_id.eq.${conv.participant_1_id})`
                        )
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single()

                    if (!msgError && messageData) {
                        lastMessage = {
                            id: messageData.id,
                            content: messageData.content,
                            sender_id: messageData.sender_id,
                            created_at: messageData.created_at
                        }
                    }

                    return {
                        id: conv.id,
                        participant_1_id: conv.participant_1_id,
                        participant_2_id: conv.participant_2_id,
                        last_message_id: conv.last_message_id,
                        last_message_at: conv.last_message_at || (lastMessage?.created_at),
                        created_at: conv.created_at,
                        updated_at: conv.updated_at,
                        otherUser,
                        lastMessage
                    }
                })
            )

            // Filter out null values and sort by last_message_at
            const validConversations = conversationsWithUsers
                .filter((c): c is Conversation => c !== null)
                .sort((a, b) => {
                    const dateA = new Date(a.last_message_at || a.created_at).getTime()
                    const dateB = new Date(b.last_message_at || b.created_at).getTime()
                    return dateB - dateA
                })

            setConversations(validConversations)
        } catch (error: any) {
            console.error("Error fetching conversations:", error)
            toast.error("Error", { description: "Failed to load conversations" })
        }
    }

    const fetchMessages = async () => {
        try {
            if (!selectedConversation || !currentUser) return

            const otherUserId = selectedConversation.participant_1_id === currentUser.id
                ? selectedConversation.participant_2_id
                : selectedConversation.participant_1_id

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`
                )
                .order("created_at", { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error: any) {
            console.error("Error fetching messages:", error)
            toast.error("Error", { description: "Failed to load messages" })
        }
    }

    const subscribeToMessages = () => {
        if (!selectedConversation || !currentUser) return

        const otherUserId = selectedConversation.participant_1_id === currentUser.id
            ? selectedConversation.participant_2_id
            : selectedConversation.participant_1_id

        const channelName = `messages_${[currentUser.id, otherUserId].sort().join('_')}`

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        channelRef.current = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages"
                },
                (payload) => {
                    const newMsg = payload.new as Message

                    if (
                        (newMsg.sender_id === currentUser.id && newMsg.recipient_id === otherUserId) ||
                        (newMsg.sender_id === otherUserId && newMsg.recipient_id === currentUser.id)
                    ) {
                        setMessages(prev => [...prev, newMsg])
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "messages"
                },
                (payload) => {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
                }
            )
            .subscribe()
    }

    const markAsRead = async () => {
        try {
            if (!selectedConversation || !currentUser) return

            const otherUserId = selectedConversation.participant_1_id === currentUser.id
                ? selectedConversation.participant_2_id
                : selectedConversation.participant_1_id

            const { error } = await supabase
                .from("messages")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("recipient_id", currentUser.id)
                .eq("sender_id", otherUserId)
                .eq("is_read", false)

            if (error) throw error
        } catch (error: any) {
            console.error("Error marking as read:", error)
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !currentUser) return

        try {
            const otherUserId = selectedConversation.participant_1_id === currentUser.id
                ? selectedConversation.participant_2_id
                : selectedConversation.participant_1_id

            const { error } = await supabase
                .from("messages")
                .insert({
                    sender_id: currentUser.id,
                    recipient_id: otherUserId,
                    content: newMessage.trim(),
                    is_read: false
                })

            if (error) throw error
            setNewMessage("")
        } catch (error: any) {
            console.error("Error sending message:", error)
            toast.error("Error", { description: "Failed to send message" })
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const formatDate = (date: string) => {
        const today = new Date()
        const messageDate = new Date(date)
        if (messageDate.toDateString() === today.toDateString()) {
            return "Today"
        }
        return messageDate.toLocaleDateString([], { month: "short", day: "numeric" })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex w-full h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Sidebar - Conversations List */}
            <div className={cn(
                "w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 overflow-hidden",
                selectedConversation && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-full focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1 overflow-hidden">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {conversations
                                .filter(conv =>
                                    !searchQuery ||
                                    conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    conv.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((conv) => {
                                    // Get the last message and determine who sent it
                                    const lastMsg = conv.lastMessage
                                    const isLastMessageFromOther = lastMsg
                                        ? lastMsg.sender_id !== currentUser?.id
                                        : false

                                    const messagePreview = lastMsg?.content || "No messages yet"
                                    const senderPrefix = lastMsg
                                        ? isLastMessageFromOther
                                            ? ""
                                            : "You: "
                                        : ""

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={cn(
                                                "w-full p-3 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                                                selectedConversation?.id === conv.id && "bg-gray-100 dark:bg-gray-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-12 h-12 flex-shrink-0">
                                                    <AvatarImage src={conv.otherUser?.avatar_url} />
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        {conv.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                            {conv.otherUser?.name || "Unknown"}
                                                        </h3>
                                                        {conv.last_message_at && (
                                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                                {formatDate(conv.last_message_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {senderPrefix}
                                                        </span>
                                                        {messagePreview}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Avatar className="flex-shrink-0">
                                <AvatarImage src={selectedConversation.otherUser?.avatar_url} />
                                <AvatarFallback className="bg-blue-500 text-white">
                                    {selectedConversation.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {selectedConversation.otherUser?.name || "Unknown"}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    @{selectedConversation.otherUser?.username || "unknown"}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-400">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const showDate = idx === 0 || formatDate(messages[idx - 1].created_at) !== formatDate(msg.created_at)
                                    const isOwn = msg.sender_id === currentUser?.id

                                    return (
                                        <div key={msg.id}>
                                            {showDate && (
                                                <div className="flex items-center justify-center my-4">
                                                    <Separator className="flex-1" />
                                                    <span className="px-3 text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(msg.created_at)}
                                                    </span>
                                                    <Separator className="flex-1" />
                                                </div>
                                            )}
                                            <div className={cn(
                                                "flex gap-2 mb-2",
                                                isOwn && "flex-row-reverse"
                                            )}>
                                                {!isOwn && (
                                                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                                        <AvatarImage src={selectedConversation.otherUser?.avatar_url} />
                                                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                                                            {selectedConversation.otherUser?.name?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn(
                                                    "flex flex-col max-w-xs",
                                                    isOwn && "items-end"
                                                )}>
                                                    <div className={cn(
                                                        "px-4 py-2 rounded-lg break-words",
                                                        isOwn
                                                            ? "bg-blue-500 text-white rounded-br-none"
                                                            : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                                                        {formatTime(msg.created_at)}
                                                        {isOwn && (
                                                            <span className="ml-1">
                                                                {msg.is_read ? "✓✓" : "✓"}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                size="icon"
                                className="bg-blue-500 hover:bg-blue-600 rounded-full flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Select a conversation to view messages</p>
                    </div>
                </div>
            )}
        </div>
    )
}