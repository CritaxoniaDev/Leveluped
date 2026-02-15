import { useEffect, useState, useRef, createContext, useContext } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { useNavigate } from "react-router-dom"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/packages/shadcn/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Input } from "@/packages/shadcn/ui/input"
import { Textarea } from "@/packages/shadcn/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/packages/shadcn/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/packages/shadcn/ui/select"
import {
    Map,
    MapTileLayer,
    MapZoomControl,
    MapLocateControl,
} from "@/packages/shadcn/ui/map"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/packages/shadcn/ui/alert-dialog"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Checkbox } from "@/packages/shadcn/ui/checkbox"
import { toast } from "sonner"
import { Plus, BookOpen, Calendar, Edit, Trash2, Trophy, Target, Award, Eye, Globe } from "lucide-react"
import { Polygon, useMap } from 'react-leaflet'
import { City, type ICity } from 'country-state-city';
import { getAlpha2Code, registerLocale } from 'i18n-iso-countries';
import * as enLocale from 'i18n-iso-countries/langs/en.json';

registerLocale(enLocale);

interface Course {
    id: string
    title: string
    description: string
    category: string
    image_url: string
    levels: number
    max_xp: number
    leaderboard_enabled: boolean
    badges_enabled: boolean
    quests_enabled: boolean
    premium_enabled: boolean
    status: "draft" | "published" | "archived"
    created_at: string
    updated_at: string
    country_id?: string
    city_name?: string
}

interface City {
    id: string
    name: string
    country_id: string
    latitude: number
    longitude: number
}

interface CountryLevel {
    id: string
    country_name: string
    min_level: number
    max_level: number
    latitude: number
    longitude: number
    base_country?: string | undefined
    polygon?: [number, number][][]
}

interface GeoJsonFeature {
    type: "Feature"
    properties: {
        name: string
        [key: string]: any
    }
    geometry: {
        type: string
        coordinates: any
    }
}

const LEVEL_COLORS: { [key: number]: string } = {
    1: '#3b82f6',   // Blue
    2: '#10b981',   // Green
    3: '#f59e0b',   // Amber
    4: '#ef4444',   // Red
    5: '#8b5cf6',   // Purple
}

const HoverContext = createContext<{
    hoveredCountryId: string | null
    setHoveredCountryId: (id: string | null) => void
}>({
    hoveredCountryId: null,
    setHoveredCountryId: () => { },
})

interface InteractivePolygonProps {
    positions: [number, number][]
    country: CountryLevel
    color: string
    onCountryClick: (countryId: string) => void
}

function InteractivePolygon({ positions, country, color, onCountryClick }: InteractivePolygonProps) {
    const map = useMap()
    const polygonRef = useRef<any>(null)
    const [, setShowPopup] = useState(false)
    const [, setPopupPosition] = useState<[number, number]>([0, 0])
    const { hoveredCountryId, setHoveredCountryId } = useContext(HoverContext)
    const isHovered = hoveredCountryId === country.id

    useEffect(() => {
        if (polygonRef.current) {
            const polygon = polygonRef.current

            polygon.on('click', () => {
                onCountryClick(country.id)
            })

            polygon.on('mouseover', () => {
                setHoveredCountryId(country.id)
                polygon.setStyle({
                    fillOpacity: 0.6,
                    weight: 2,
                    dashArray: '5, 5'
                })
                polygon.bringToFront()

                const centerPoint = polygon.getBounds().getCenter()
                setPopupPosition([centerPoint.lat, centerPoint.lng])
                setShowPopup(true)
            })

            polygon.on('mouseout', () => {
                setHoveredCountryId(null)
                polygon.setStyle({
                    fillOpacity: 0.3,
                    weight: 0,
                    dashArray: ''
                })
                setShowPopup(false)
            })
        }
    }, [map, country, setHoveredCountryId, onCountryClick])

    useEffect(() => {
        if (polygonRef.current && isHovered) {
            polygonRef.current.setStyle({
                fillOpacity: 0.6,
                weight: 2,
                dashArray: '5, 5'
            })
        } else if (polygonRef.current && !isHovered) {
            polygonRef.current.setStyle({
                fillOpacity: 0.3,
                weight: 0,
                dashArray: ''
            })
        }
    }, [isHovered])

    return (
        <Polygon
            ref={polygonRef}
            positions={positions}
            pathOptions={{
                color: color,
                fillOpacity: 0.3,
                weight: 0,
            }}
        />
    )
}

export default function Courses() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [countries, setCountries] = useState<CountryLevel[]>([])
    const [geoJsonData, setGeoJsonData] = useState<GeoJsonFeature[]>([])
    const [selectedCountry, setSelectedCountry] = useState<string>("")
    const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null)
    const [cities, setCities] = useState<ICity[]>([])
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [, setDeleteType] = useState<"course">("course")
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        image_url: "",
        levels: 10,
        max_xp: 5000,
        leaderboard_enabled: true,
        badges_enabled: true,
        quests_enabled: true,
        premium_enabled: false,
    })
    const [creating, setCreating] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [editFormData, setEditFormData] = useState({
        title: "",
        description: "",
        category: "",
        image_url: "",
        levels: 10,
        max_xp: 5000,
        leaderboard_enabled: true,
        badges_enabled: true,
        quests_enabled: true,
        premium_enabled: false,
    })
    const [editSelectedCountry, setEditSelectedCountry] = useState<string>("")
    const [editSelectedCity, setEditSelectedCity] = useState<string>("")
    const [editCities, setEditCities] = useState<ICity[]>([])
    const [editingCourseLoading, setEditingCourseLoading] = useState(false)
    const [isCountryCoursesDialogOpen, setIsCountryCoursesDialogOpen] = useState(false)
    const [selectedCountryForCourses, setSelectedCountryForCourses] = useState<string>("")

    useEffect(() => {
        fetchCourses()
        fetchCountries()
        fetchGeoJson()
    }, [])

    const fetchGeoJson = async () => {
        try {
            const response = await fetch(
                'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
            )
            const geojson = await response.json()
            setGeoJsonData(geojson.features || [])
        } catch (error) {
            console.error("Error fetching GeoJSON:", error)
        }
    }

    const fetchCountries = async () => {
        try {
            const { data, error } = await supabase
                .from("countries_levels")
                .select("*")
                .order("base_country", { ascending: true })

            if (error) throw error
            setCountries(data || [])
        } catch (error: any) {
            console.error("Error fetching countries:", error)
        }
    }

    const fetchCourses = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("instructor_id", session.user.id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setCourses(data || [])
        } catch (error: any) {
            console.error("Error fetching courses:", error)
            toast.error("Error", {
                description: "Failed to load courses"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCourseImage = async (category: string) => {
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(category)}&per_page=1&client_id=${import.meta.env.VITE_PUBLIC_UNSPLASH_API_KEY}`
            )
            const data = await response.json()
            if (data.results && data.results.length > 0) {
                return data.results[0].urls.small
            }
            return null
        } catch (error) {
            console.error("Error fetching image:", error)
            return null
        }
    }

    const extractPolygonCoordinates = (geometry: any): [number, number][][] | null => {
        try {
            if (geometry.type === 'Polygon') {
                return [geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]])]
            } else if (geometry.type === 'MultiPolygon') {
                return geometry.coordinates.map((polygon: any) =>
                    polygon[0].map((coord: [number, number]) => [coord[1], coord[0]]))
            }
            return null
        } catch (error) {
            console.error("Error extracting polygon:", error)
            return null
        }
    }

    const getCountryPolygon = (countryName: string): [number, number][][] | null => {
        const feature = geoJsonData.find(f =>
            f.properties.name === countryName ||
            f.properties.ADMIN === countryName ||
            f.properties.NAME === countryName ||
            f.properties.FORMAL_EN === countryName
        )

        if (feature) {
            return extractPolygonCoordinates(feature.geometry)
        }
        return null
    }

    const getColorForLevel = (minLevel: number, maxLevel: number) => {
        const avgLevel = (minLevel + maxLevel) / 2

        if (avgLevel <= 10) return LEVEL_COLORS[1]
        if (avgLevel <= 20) return LEVEL_COLORS[2]
        if (avgLevel <= 30) return LEVEL_COLORS[3]
        if (avgLevel <= 40) return LEVEL_COLORS[4]
        return LEVEL_COLORS[5]
    }

    const handleCountryClick = (countryId: string) => {
        setSelectedCountryForCourses(countryId)
        setIsCountryCoursesDialogOpen(true)
    }

    const handleCreateCourse = async () => {
        try {
            setCreating(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const selectedCountryData = countries.find(c => c.id === selectedCountry)
            const selectedCityData = cities.find(c => c.name === selectedCity)
            if (!selectedCountryData || !selectedCityData) {
                toast.error("Error", {
                    description: "Please select a country and city"
                })
                setCreating(false)
                return
            }

            let imageUrl = formData.image_url
            if (!imageUrl && formData.category) {
                imageUrl = await fetchCourseImage(formData.category)
            }

            const { data, error } = await supabase
                .from("courses")
                .insert({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    image_url: imageUrl,
                    levels: selectedCountryData.max_level,
                    max_xp: formData.max_xp,
                    leaderboard_enabled: formData.leaderboard_enabled,
                    badges_enabled: formData.badges_enabled,
                    quests_enabled: formData.quests_enabled,
                    premium_enabled: formData.premium_enabled,
                    country_id: selectedCountry,
                    city_name: selectedCity,
                    latitude: selectedCityData.latitude,
                    longitude: selectedCityData.longitude,
                    instructor_id: session.user.id,
                })
                .select()
                .single()

            if (error) throw error

            setCourses([data, ...courses])
            setFormData({
                title: "",
                description: "",
                category: "",
                image_url: "",
                levels: 10,
                max_xp: 5000,
                leaderboard_enabled: true,
                badges_enabled: true,
                quests_enabled: true,
                premium_enabled: false,
            })
            setSelectedCountry("")
            setSelectedCity("")
            setCities([])
            setIsCreateDialogOpen(false)
            toast.success("Course created", {
                description: "Your course has been created successfully"
            })
        } catch (error: any) {
            console.error("Error creating course:", error)
            toast.error("Error", {
                description: "Failed to create course"
            })
        } finally {
            setCreating(false)
        }
    }

    const handleEditCourse = async (course: Course) => {
        setEditingCourse(course)
        setEditFormData({
            title: course.title,
            description: course.description,
            category: course.category,
            image_url: course.image_url,
            levels: course.levels,
            max_xp: course.max_xp,
            leaderboard_enabled: course.leaderboard_enabled,
            badges_enabled: course.badges_enabled,
            quests_enabled: course.quests_enabled,
            premium_enabled: course.premium_enabled,
        })
        setEditSelectedCountry(course.country_id || "")
        setEditSelectedCity(course.city_name || "")

        if (course.country_id) {
            const countryData = countries.find(c => c.id === course.country_id)
            if (countryData && countryData.base_country) {
                const isoCode = getAlpha2Code(countryData.base_country, 'en')
                if (isoCode) {
                    const cityData = City.getCitiesOfCountry(isoCode)
                    setEditCities(cityData || [])
                }
            }
        }

        setIsEditDialogOpen(true)
    }

    const handleSaveEditCourse = async () => {
        try {
            setEditingCourseLoading(true)

            if (!editingCourse) return

            const selectedCountryData = countries.find(c => c.id === editSelectedCountry)
            const selectedCityData = editCities.find(c => c.name === editSelectedCity)

            if (!selectedCountryData || !selectedCityData) {
                toast.error("Error", {
                    description: "Please select a country and city"
                })
                setEditingCourseLoading(false)
                return
            }

            let imageUrl = editFormData.image_url
            if (!imageUrl && editFormData.category) {
                imageUrl = await fetchCourseImage(editFormData.category)
            }

            const { error } = await supabase
                .from("courses")
                .update({
                    title: editFormData.title,
                    description: editFormData.description,
                    category: editFormData.category,
                    image_url: imageUrl,
                    levels: editFormData.levels,
                    max_xp: editFormData.max_xp,
                    leaderboard_enabled: editFormData.leaderboard_enabled,
                    badges_enabled: editFormData.badges_enabled,
                    quests_enabled: editFormData.quests_enabled,
                    premium_enabled: editFormData.premium_enabled,
                    country_id: editSelectedCountry,
                    city_name: editSelectedCity,
                    latitude: selectedCityData.latitude,
                    longitude: selectedCityData.longitude,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", editingCourse.id)

            if (error) throw error

            setCourses(courses.map(c =>
                c.id === editingCourse.id
                    ? {
                        ...c,
                        title: editFormData.title,
                        description: editFormData.description,
                        category: editFormData.category,
                        image_url: imageUrl || c.image_url,
                        levels: editFormData.levels,
                        max_xp: editFormData.max_xp,
                        leaderboard_enabled: editFormData.leaderboard_enabled,
                        badges_enabled: editFormData.badges_enabled,
                        quests_enabled: editFormData.quests_enabled,
                        premium_enabled: editFormData.premium_enabled,
                        country_id: editSelectedCountry,
                        city_name: editSelectedCity,
                    }
                    : c
            ))

            setIsEditDialogOpen(false)
            setEditingCourse(null)
            toast.success("Course updated", {
                description: "Your course has been updated successfully"
            })
        } catch (error: any) {
            console.error("Error updating course:", error)
            toast.error("Error", {
                description: "Failed to update course"
            })
        } finally {
            setEditingCourseLoading(false)
        }
    }

    const handleDeleteCourse = async (courseId: string) => {
        setDeletingId(courseId)
        setDeleteType("course")
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingId) return

        try {
            const { error } = await supabase
                .from("courses")
                .delete()
                .eq("id", deletingId)

            if (error) throw error

            setCourses(courses.filter(c => c.id !== deletingId))
            toast.success("Course deleted", {
                description: "Course has been deleted successfully"
            })
        } catch (error: any) {
            console.error(`Error deleting course:`, error)
            toast.error("Error", {
                description: `Failed to delete course`
            })
        } finally {
            setDeleteDialogOpen(false)
            setDeletingId(null)
        }
    }

    const handleStatusChange = async (courseId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("courses")
                .update({ status: newStatus })
                .eq("id", courseId)

            if (error) throw error

            setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus as "draft" | "published" | "archived" } : c))

            toast.success("Status updated", {
                description: "Course status has been changed successfully"
            })
        } catch (error: any) {
            console.error("Error updating status:", error)
            toast.error("Error", {
                description: "Failed to update course status"
            })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
    }

    const countryCourses = courses.filter(course => course.country_id === selectedCountryForCourses)
    const selectedCountryData = countries.find(c => c.id === selectedCountryForCourses)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Instructor Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your courses and gamification elements
                    </p>
                </div>
            </div>

            {/* Interactive World Map Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Course Locations Map
                        </CardTitle>
                        <CardDescription>
                            Interactive map showing your courses by country • Click and hover for details
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full rounded-md overflow-hidden">
                        <HoverContext.Provider value={{ hoveredCountryId, setHoveredCountryId }}>
                            <Map center={[20, 0]} zoom={2} className="h-full w-full">
                                <MapTileLayer />
                                <MapZoomControl />
                                <MapLocateControl />

                                {countries.map((country) => {
                                    const polygons = country.polygon || getCountryPolygon(country.base_country!)
                                    if (!polygons || polygons.length === 0) return null

                                    return polygons.map((polygon, idx) => (
                                        <InteractivePolygon
                                            key={`${country.id}-${idx}`}
                                            positions={polygon}
                                            country={country}
                                            color={getColorForLevel(country.min_level, country.max_level)}
                                            onCountryClick={handleCountryClick}
                                        />
                                    ))
                                })}
                            </Map>
                        </HoverContext.Provider>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Courses
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your courses and create new ones
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Course
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Course</DialogTitle>
                            <DialogDescription>
                                Add a new course to your catalog. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="title" className="text-right text-sm font-medium">
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Course title"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="description" className="text-right text-sm font-medium">
                                    Description
                                </label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Course description"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="category" className="text-right text-sm font-medium">
                                    Category
                                </label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="programming">Programming</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="data-science">Data Science</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="image_url" className="text-right text-sm font-medium">
                                    Image URL (optional)
                                </label>
                                <Input
                                    id="image_url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://example.com/image.jpg or leave blank for auto-fetch"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="levels" className="text-right text-sm font-medium">
                                    Level Required
                                </label>
                                <Input
                                    id="levels"
                                    type="number"
                                    value={formData.levels}
                                    onChange={(e) => setFormData({ ...formData, levels: parseInt(e.target.value) || 10 })}
                                    className="col-span-3"
                                    placeholder="10"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="country" className="text-right text-sm font-medium">
                                    Country
                                </label>
                                <Select value={selectedCountry} onValueChange={(value) => {
                                    setSelectedCountry(value)
                                    setSelectedCity("")
                                    const countryData = countries.find(c => c.id === value)
                                    if (countryData && countryData.base_country) {
                                        const isoCode = getAlpha2Code(countryData.base_country, 'en')
                                        if (isoCode) {
                                            const cityData = City.getCitiesOfCountry(isoCode)
                                            setCities(cityData || [])
                                        }
                                    }
                                }}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((country) => (
                                            <SelectItem key={country.id} value={country.id}>
                                                {country.country_name} (Levels {country.min_level}-{country.max_level})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="city" className="text-right text-sm font-medium">
                                    City
                                </label>
                                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountry}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.slice(0, 300).map((city, index) => (
                                            <SelectItem key={city.name + '-' + city.stateCode + '-' + index} value={city.name}>
                                                {city.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="max_xp" className="text-right text-sm font-medium">
                                    Max XP
                                </label>
                                <Input
                                    id="max_xp"
                                    type="number"
                                    value={formData.max_xp}
                                    onChange={(e) => setFormData({ ...formData, max_xp: parseInt(e.target.value) || 5000 })}
                                    className="col-span-3"
                                    placeholder="5000"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <label className="text-right text-sm font-medium pt-2">
                                    Features
                                </label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="leaderboard"
                                            checked={formData.leaderboard_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, leaderboard_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="leaderboard" className="text-sm">
                                            Enable Leaderboard
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="badges"
                                            checked={formData.badges_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, badges_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="badges" className="text-sm">
                                            Enable Badges
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="quests"
                                            checked={formData.quests_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, quests_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="quests" className="text-sm">
                                            Enable Quests
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="premium"
                                            checked={formData.premium_enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, premium_enabled: checked as boolean })}
                                        />
                                        <label htmlFor="premium" className="text-sm">
                                            Enable Premium Features
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateCourse} disabled={creating}>
                                {creating ? "Creating..." : "Create Course"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Your Courses
                    </CardTitle>
                    <CardDescription>
                        {courses.length} course{courses.length !== 1 ? 's' : ''} total
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Level Required</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    No courses yet. Create your first course!
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    courses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={course.image_url || "/placeholder-course.jpg"}
                                                        alt={course.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {truncateText(course.title, 20)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {truncateText(course.description, 50)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {course.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    <span className="font-medium">{course.levels}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {course.leaderboard_enabled && <Target className="w-4 h-4 text-blue-500" />}
                                                    {course.badges_enabled && <Award className="w-4 h-4 text-purple-500" />}
                                                    {course.quests_enabled && <Trophy className="w-4 h-4 text-green-500" />}
                                                    {course.premium_enabled && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1 py-0.5 rounded">Premium</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={course.status}
                                                    onValueChange={(value) => handleStatusChange(course.id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(course.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/instructor/courses/${course.id}`)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditCourse(course)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Course?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your course.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>
                            Update your course details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-title" className="text-right text-sm font-medium">
                                Title
                            </label>
                            <Input
                                id="edit-title"
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="col-span-3"
                                placeholder="Course title"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-description" className="text-right text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="edit-description"
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                className="col-span-3"
                                placeholder="Course description"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-category" className="text-right text-sm font-medium">
                                Category
                            </label>
                            <Select value={editFormData.category} onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="programming">Programming</SelectItem>
                                    <SelectItem value="design">Design</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="data-science">Data Science</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-image_url" className="text-right text-sm font-medium">
                                Image URL (optional)
                            </label>
                            <Input
                                id="edit-image_url"
                                value={editFormData.image_url}
                                onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-country" className="text-right text-sm font-medium">
                                Country
                            </label>
                            <Select value={editSelectedCountry} onValueChange={(value) => {
                                setEditSelectedCountry(value)
                                setEditSelectedCity("")
                                const countryData = countries.find(c => c.id === value)
                                if (countryData && countryData.base_country) {
                                    const isoCode = getAlpha2Code(countryData.base_country, 'en')
                                    if (isoCode) {
                                        const cityData = City.getCitiesOfCountry(isoCode)
                                        setEditCities(cityData || [])
                                    }
                                }
                            }}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.id} value={country.id}>
                                            {country.country_name} (Levels {country.min_level}-{country.max_level})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-city" className="text-right text-sm font-medium">
                                City
                            </label>
                            <Select value={editSelectedCity} onValueChange={setEditSelectedCity} disabled={!editSelectedCountry}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                    {editCities.slice(0, 300).map((city, index) => (
                                        <SelectItem key={city.name + '-' + city.stateCode + '-' + index} value={city.name}>
                                            {city.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-levels" className="text-right text-sm font-medium">
                                Level Required
                            </label>
                            <Input
                                id="edit-levels"
                                type="number"
                                value={editFormData.levels}
                                onChange={(e) => setEditFormData({ ...editFormData, levels: parseInt(e.target.value) || 10 })}
                                className="col-span-3"
                                placeholder="10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-max_xp" className="text-right text-sm font-medium">
                                Max XP
                            </label>
                            <Input
                                id="edit-max_xp"
                                type="number"
                                value={editFormData.max_xp}
                                onChange={(e) => setEditFormData({ ...editFormData, max_xp: parseInt(e.target.value) || 5000 })}
                                className="col-span-3"
                                placeholder="5000"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <label className="text-right text-sm font-medium pt-2">
                                Features
                            </label>
                            <div className="col-span-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-leaderboard"
                                        checked={editFormData.leaderboard_enabled}
                                        onCheckedChange={(checked) => setEditFormData({ ...editFormData, leaderboard_enabled: checked as boolean })}
                                    />
                                    <label htmlFor="edit-leaderboard" className="text-sm">
                                        Enable Leaderboard
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-badges"
                                        checked={editFormData.badges_enabled}
                                        onCheckedChange={(checked) => setEditFormData({ ...editFormData, badges_enabled: checked as boolean })}
                                    />
                                    <label htmlFor="edit-badges" className="text-sm">
                                        Enable Badges
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-quests"
                                        checked={editFormData.quests_enabled}
                                        onCheckedChange={(checked) => setEditFormData({ ...editFormData, quests_enabled: checked as boolean })}
                                    />
                                    <label htmlFor="edit-quests" className="text-sm">
                                        Enable Quests
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-premium"
                                        checked={editFormData.premium_enabled}
                                        onCheckedChange={(checked) => setEditFormData({ ...editFormData, premium_enabled: checked as boolean })}
                                    />
                                    <label htmlFor="edit-premium" className="text-sm">
                                        Enable Premium Features
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSaveEditCourse} disabled={editingCourseLoading}>
                            {editingCourseLoading ? "Updating..." : "Update Course"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCountryCoursesDialogOpen} onOpenChange={setIsCountryCoursesDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Courses in {selectedCountryData?.country_name}</DialogTitle>
                        <DialogDescription>
                            {countryCourses.length} course{countryCourses.length !== 1 ? 's' : ''} available in this country
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {countryCourses.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No courses created for this country yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {countryCourses.map((course) => (
                                    <Card key={course.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={course.image_url || "/placeholder-course.jpg"}
                                                    alt={course.title}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {course.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <Badge variant="outline" className="capitalize">
                                                            {course.category}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                                            <span className="text-sm font-medium">Level {course.levels}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {course.leaderboard_enabled && <Target className="w-4 h-4 text-blue-500" />}
                                                            {course.badges_enabled && <Award className="w-4 h-4 text-purple-500" />}
                                                            {course.quests_enabled && <Trophy className="w-4 h-4 text-green-500" />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/instructor/courses/${course.id}`)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}