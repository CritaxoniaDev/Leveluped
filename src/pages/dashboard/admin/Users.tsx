import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Users as UsersIcon, Mail, User, Shield } from "lucide-react"

interface User {
    id: string
    email: string
    username: string
    name?: string
    role: "learner" | "instructor" | "admin"
    is_verified: boolean
    created_at: string
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        const filtered = users.filter(user =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        setFilteredUsers(filtered)
    }, [users, searchTerm])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("users")
                .select("id, email, username, name, role, is_verified, created_at")
                .neq("role", "admin")
                .order("created_at", { ascending: false })

            if (error) throw error

            setUsers(data || [])
        } catch (error: any) {
            console.error("Error fetching users:", error)
            toast.error("Error", {
                description: "Failed to load users"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from("users")
                .update({ role: newRole })
                .eq("id", userId)

            if (error) throw error

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as "learner" | "instructor" | "admin" } : u))

            toast.success("Role updated", {
                description: "User role has been changed successfully"
            })
        } catch (error: any) {
            console.error("Error updating role:", error)
            toast.error("Error", {
                description: "Failed to update user role"
            })
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive"
            case "instructor":
                return "default"
            case "learner":
                return "secondary"
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
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
                        User Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        View and manage all users on the platform
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {users.length}
                    </span>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Search Users
                    </CardTitle>
                    <CardDescription>
                        Search by email, username, or name
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        {filteredUsers.length} of {users.length} users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <UsersIcon className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {searchTerm ? "No users found matching your search" : "No users found"}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {user.name || user.username}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                    {user.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_verified ? "default" : "secondary"}>
                                                    {user.is_verified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-gray-400">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => handleRoleChange(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="learner">Learner</SelectItem>
                                                        <SelectItem value="instructor">Instructor</SelectItem>
                                                    </SelectContent>
                                                </Select>
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