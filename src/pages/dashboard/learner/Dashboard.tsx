import { useEffect, useState, useRef, createContext, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Map,
  MapTileLayer,
  MapMarker,
  MapTooltip,
  MapZoomControl,
  MapLocateControl,
} from "@/components/ui/map"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Eye, MapPin, BookCopy, Lightbulb, Award, Zap } from "lucide-react"
import { Polygon, useMap } from 'react-leaflet'

interface UserStats {
  total_xp: number
  current_level: number
  badges_count: number
  leaderboard_rank: number | null
}

interface CountryLevel {
  id: string
  country_name: string
  min_level: number
  max_level: number
  latitude: number
  longitude: number
  base_country?: string
}

interface AvailableCourse {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  levels: number
  max_xp: number
  instructor_name: string
  enrolled: boolean
  progress?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  is_new?: boolean
  latitude?: number
  longitude?: number
  country_id?: string
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
    <>
      <Polygon
        ref={polygonRef}
        positions={positions}
        pathOptions={{
          color: color,
          fillOpacity: 0.3,
          weight: 0,
        }}
      />
    </>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<UserStats>({
    total_xp: 0,
    current_level: 1,
    badges_count: 0,
    leaderboard_rank: null
  })
  const [countryLevels, setCountryLevels] = useState<CountryLevel[]>([])
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryLevel | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourse | null>(null)
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false)
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCountryMap, setShowCountryMap] = useState(false)
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonFeature[]>([])
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [introStep, setIntroStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          toast.error("Unauthorized", {
            description: "Please sign in to access the dashboard"
          })
          navigate("/login")
          return
        }

        // Fetch user profile from users table
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) {
          toast.error("Error", {
            description: "Failed to load user profile"
          })
          navigate("/login")
          return
        }

        setUser(userProfile)

        // Check if first time login
        const isFirstLogin = !userProfile.last_login
        setShowIntro(isFirstLogin)

        // Fetch user stats first
        const userStats = await fetchUserStats(session.user.id)

        // Fetch country levels
        await fetchCountryLevels(userStats)

        // Then fetch available courses
        await fetchAvailableCourses(userStats)

        // Fetch GeoJSON
        await fetchGeoJson()

        // Update last_login
        if (isFirstLogin) {
          await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", session.user.id)
        }

        toast.success("Welcome!", {
          description: `Welcome back, ${userProfile.name}!`
        })
      } catch (err) {
        toast.error("Error", {
          description: "An unexpected error occurred"
        })
        navigate("/login")
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [navigate])

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

  const extractPolygonCoordinates = (geometry: any): [number, number][][] | null => {
    try {
      if (geometry.type === 'Polygon') {
        return [geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]])]
      } else if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.map((polygon: any) =>
          polygon[0].map((coord: [number, number]) => [coord[1], coord[0]])
        )
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

  // @ts-ignore
  const fetchCountryLevels = async (userStats: UserStats | null) => {
    try {
      const { data: countries, error } = await supabase
        .from("countries_levels")
        .select("*")

      if (error) {
        console.error("Error fetching countries:", error)
        throw error
      }

      // Filter countries based on user level
      const accessibleCountries = countries.filter(country =>
        userStats && userStats.current_level >= country.min_level && userStats.current_level <= country.max_level
      )

      console.log("Accessible countries:", accessibleCountries)
      setCountryLevels(accessibleCountries)
    } catch (error) {
      console.error("Error fetching country levels:", error)
    }
  }

  // @ts-ignore
  const fetchAvailableCourses = async (userStats: UserStats | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error("No session found")
        return
      }

      console.log("Fetching published courses...")
      // Fetch published courses with enrollment status and location
      const { data: courses, error } = await supabase
        .from("courses")
        .select(`
        id,
        title,
        description,
        category,
        image_url,
        levels,
        max_xp,
        status,
        latitude,
        longitude,
        country_id,
        instructor_id,
        users!courses_instructor_id_fkey (
          name
        )
      `)
        .eq("status", "published")

      if (error) {
        console.error("Error fetching courses:", error)
        throw error
      }

      console.log("Courses fetched:", courses)

      if (!courses || courses.length === 0) {
        console.warn("No published courses found")
        setAvailableCourses([])
        return
      }

      // Check enrollment status for each course and calculate real progress
      const coursesWithEnrollment = await Promise.all(
        courses.map(async (course: any) => {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id, progress_percentage")
            .eq("user_id", session.user.id)
            .eq("course_id", course.id)
            .single()

          let progress = 0
          if (enrollment) {
            progress = enrollment.progress_percentage || 0
          }

          const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
          const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
          const is_new = Math.random() > 0.7

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            image_url: course.image_url,
            levels: course.levels,
            max_xp: course.max_xp,
            instructor_name: course.users?.name || "Unknown Instructor",
            enrolled: !!enrollment,
            progress,
            difficulty,
            is_new,
            latitude: course.latitude,
            longitude: course.longitude,
            country_id: course.country_id
          }
        })
      )

      const filteredCourses = coursesWithEnrollment.filter(course =>
        course.latitude && course.longitude
      )

      console.log("Filtered courses with coords:", filteredCourses)
      setAvailableCourses(filteredCourses)
    } catch (error) {
      console.error("Error fetching available courses:", error)
    }
  }

  const handleEnrollCourse = async (courseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from("enrollments")
        .insert({
          user_id: session.user.id,
          course_id: courseId
        })

      if (error) throw error

      // Update local state
      setAvailableCourses(courses =>
        courses.map(course =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      )

      toast.success("Enrolled!", {
        description: "You have successfully enrolled in this course"
      })
    } catch (error: any) {
      console.error("Error enrolling in course:", error)
      toast.error("Error", {
        description: "Failed to enroll in course"
      })
    }
  }

  const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        const statsData: UserStats = {
          total_xp: data.total_xp || 0,
          current_level: data.current_level || 1,
          badges_count: data.badges_count || 0,
          leaderboard_rank: data.leaderboard_rank
        }
        setStats(statsData)
        return statsData
      }
      return null
    } catch (error) {
      console.error("Error fetching user stats:", error)
      return null
    }
  }

  const handleCountryClick = (countryId: string) => {
    const country = countryLevels.find(c => c.id === countryId)
    if (country) {
      setSelectedCountry(country)
      setIsCountryDialogOpen(true)
    }
  }

  const getCoursesInCountry = (countryId: string) => {
    return availableCourses.filter(course => course.country_id === countryId)
  }

  const introSteps = [
    {
      title: "Welcome to LevelUpED",
      description: "Your journey to mastering new skills starts here",
      icon: Award,
      image: "/images/leveluped-mainlogo.png",
      tips: [
        "Explore countries to discover courses",
        "Level up by completing challenges",
        "Earn XP and unlock achievements"
      ]
    },
    {
      title: "How It Works",
      description: "Navigate through our global learning map",
      icon: MapPin,
      tips: [
        "Each country represents a learning region",
        "Colors show difficulty levels",
        "Hover to see available courses"
      ]
    },
    {
      title: "Your First Steps",
      description: "Get started with these quick tips",
      icon: Lightbulb,
      tips: [
        "Click on any country to view courses",
        "Enroll in courses that match your level",
        "Complete challenges to earn XP"
      ]
    }
  ]

  const handleSkipIntro = () => {
    setShowIntro(false)
    setIntroStep(0)
  }

  const handleNextStep = () => {
    if (introStep < introSteps.length - 1) {
      setIntroStep(introStep + 1)
    } else {
      handleSkipIntro()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate map center based on countries or default
  const center: [number, number] = countryLevels.length > 0
    ? [countryLevels[0].latitude, countryLevels[0].longitude]
    : [20, 0] // Default center for world

  // If showing country map, get courses for selected country
  const coursesInCountry = selectedCountry
    ? availableCourses.filter(course => course.country_id === selectedCountry.id)
    : []

  const countryMapCenter: [number, number] = selectedCountry
    ? [selectedCountry.latitude, selectedCountry.longitude]
    : [20, 0]

  if (showIntro) {
    const currentStep = introSteps[introStep]
    const CurrentIcon = currentStep.icon

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <div className="mb-6 animate-fade-in">
            {/* Display image only on first step */}
            {introStep === 0 && currentStep.image ? (
              <div className="mb-6 flex justify-center">
                <div className="rounded-xl shadow-lg overflow-hidden max-w-xs">
                  <img
                    src={currentStep.image}
                    alt="LevelUpED Dashboard"
                    className="w-16 h-16 object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <CurrentIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
                </div>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 head-font">
              {currentStep.title}
            </h1>

            <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
              {currentStep.description}
            </p>

            {/* Tips Section */}
            <div className="space-y-2 mb-6">
              {currentStep.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in text-sm"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-left text-gray-700 dark:text-gray-300">
                    {tip}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {introSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === introStep
                      ? 'w-6 bg-blue-600 dark:bg-blue-400'
                      : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                    }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleSkipIntro}
                className="px-4 py-1.5 text-sm"
              >
                Skip
              </Button>
              <Button
                onClick={handleNextStep}
                className="px-6 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold"
              >
                {introStep === introSteps.length - 1 ? 'Start Exploring' : 'Next'}
              </Button>
            </div>

            {/* Progress Text */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
              Step {introStep + 1} of {introSteps.length}
            </p>
          </div>
        </div>

        <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-950">
      {/* Full-screen Map */}
      <div className="flex-1 overflow-hidden">
        {!showCountryMap ? (
          // World Map - Countries Level View with Polygons
          <HoverContext.Provider value={{ hoveredCountryId, setHoveredCountryId }}>
            <Map center={center} zoom={4} className="h-full w-full">
              <MapTileLayer />
              <MapZoomControl />
              <MapLocateControl />

              {countryLevels.map((country) => {
                const polygons = getCountryPolygon(country.base_country!)
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
        ) : (
          // Country Map - Courses View
          <Map center={countryMapCenter} zoom={10} className="h-full w-full">
            <MapTileLayer />
            <MapZoomControl />
            <MapLocateControl />
            {coursesInCountry.map((course) => (
              <MapMarker
                key={course.id}
                position={[course.latitude!, course.longitude!]}
                eventHandlers={{
                  click: () => {
                    setSelectedCourse(course)
                    setIsCoursesDialogOpen(true)
                  }
                }}
              >
                <MapTooltip>
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <BookCopy className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-sm">{course.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      Level {course.levels}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click for details
                    </p>
                  </div>
                </MapTooltip>
              </MapMarker>
            ))}
          </Map>
        )}
      </div>

      {/* Country Details Dialog */}
      <Dialog open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold head-font">
                    {selectedCountry?.country_name}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Discover amazing courses in this region
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedCountry && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Level Range
                    </p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedCountry.min_level}
                      </p>
                      <p className="text-gray-500">to</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedCountry.max_level}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Your Level
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.current_level}
                      </p>
                      {stats.current_level >= selectedCountry.min_level && stats.current_level <= selectedCountry.max_level && (
                        <Badge className="bg-green-500">Accessible</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Available Courses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Available Courses
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getCoursesInCountry(selectedCountry.id).length} {getCoursesInCountry(selectedCountry.id).length === 1 ? 'course' : 'courses'} waiting for you
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {getCoursesInCountry(selectedCountry.id).length}
                  </Badge>
                </div>

                {getCoursesInCountry(selectedCountry.id).length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {getCoursesInCountry(selectedCountry.id).slice(0, 5).map((course) => (
                      <Card key={course.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                              <BookCopy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {course.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {course.category}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  Level {course.levels}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {course.max_xp} XP
                                </Badge>
                                {course.enrolled && (
                                  <Badge className="text-xs bg-green-500">Enrolled</Badge>
                                )}
                              </div>
                            </div>
                            <Eye className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {getCoursesInCountry(selectedCountry.id).length > 5 && (
                      <div className="p-3 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          +{getCoursesInCountry(selectedCountry.id).length - 5} more courses available
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                    <BookCopy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      No courses available yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Check back soon for new content
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold"
                onClick={() => {
                  setIsCountryDialogOpen(false)
                  setShowCountryMap(true)
                }}
                disabled={getCoursesInCountry(selectedCountry.id).length === 0}
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Courses on Map
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Course Details Dialog */}
      <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookCopy className="w-5 h-5 text-blue-500" />
              {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedCourse?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {selectedCourse.image_url && (
                    <img
                      src={selectedCourse.image_url}
                      alt={selectedCourse.title}
                      className="w-full h-48 rounded-lg object-cover mb-4"
                    />
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedCourse.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="font-medium">{selectedCourse.instructor_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Level {selectedCourse.levels}</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm">{selectedCourse.max_xp} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCourse.enrolled && (
                        <Badge className="text-xs bg-green-500">Enrolled</Badge>
                      )}
                      {selectedCourse.difficulty && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${selectedCourse.difficulty === 'easy'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedCourse.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {selectedCourse.difficulty}
                        </Badge>
                      )}
                      {selectedCourse.is_new && (
                        <Badge className="text-xs bg-purple-500">New</Badge>
                      )}
                    </div>
                    {selectedCourse.enrolled && selectedCourse.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{selectedCourse.progress}%</span>
                        </div>
                        <Progress value={selectedCourse.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() =>
                    selectedCourse.enrolled
                      ? navigate(`/dashboard/learner/course/${selectedCourse.id}`)
                      : handleEnrollCourse(selectedCourse.id)
                  }
                >
                  {selectedCourse.enrolled ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Continue Learning
                    </>
                  ) : (
                    'Enroll Now'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCoursesDialogOpen(false)
                    setShowCountryMap(false)
                  }}
                >
                  Back to Countries
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}