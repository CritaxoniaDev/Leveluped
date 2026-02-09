import { useEffect, useState, useRef, createContext, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Globe } from "lucide-react"
import {
    Map,
    MapTileLayer,
    MapZoomControl,
    MapLocateControl,
} from "@/components/ui/map"
import { Polygon } from 'react-leaflet'
import { Popup, useMap } from 'react-leaflet'
import countries from 'world-countries'

interface CountryLevel {
    id: string
    country_name: string
    min_level: number
    max_level: number
    latitude: number
    longitude: number
    base_country?: string
    polygon?: [number, number][][]
    created_at: string
}

interface CountryOption {
    name: string
    latlng: [number, number]
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

interface InteractivePolygonProps {
    positions: [number, number][]
    country: CountryLevel
    color: string
}

const HoverContext = createContext<{
    hoveredCountryId: string | null
    setHoveredCountryId: (id: string | null) => void
}>({
    hoveredCountryId: null,
    setHoveredCountryId: () => { },
})

function InteractivePolygon({ positions, country, color }: InteractivePolygonProps) {
    const map = useMap()
    const polygonRef = useRef<any>(null)
    const [showPopup, setShowPopup] = useState(false)
    const [popupPosition, setPopupPosition] = useState<[number, number]>([0, 0])
    const { hoveredCountryId, setHoveredCountryId } = useContext(HoverContext)
    const isHovered = hoveredCountryId === country.id

    useEffect(() => {
        if (polygonRef.current) {
            const polygon = polygonRef.current

            polygon.on('click', () => {
                const bounds = polygon.getBounds()
                map.fitBounds(bounds, { padding: [50, 50] })
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
    }, [map, country, setHoveredCountryId])

    // Apply hover style to all polygons of the same country
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
            {showPopup && isHovered && (
                <Popup
                    position={popupPosition}
                    closeButton={false}
                    autoClose={false}
                >
                    <div className="text-center bg-white p-2 rounded-md shadow-md">
                        <p className="text-md font-semibold">{country.country_name}</p><br />
                        <p className="text-xs text-muted font-light">Levels {country.min_level} - {country.max_level}</p>
                    </div>
                </Popup>
            )}
        </>
    )
}

export default function CourseMap() {
    const [countriesData, setCountriesData] = useState<CountryLevel[]>([])
    const [geoJsonData, setGeoJsonData] = useState<GeoJsonFeature[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
    const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
    const [showPolygons, setShowPolygons] = useState(true)
    const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        country_name: "",
        base_country: "",
        min_level: 1,
        max_level: 20,
        latitude: 0,
        longitude: 0,
    })
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)

    const countryList: CountryOption[] = countries.map(c => ({
        name: c.name.common,
        latlng: c.latlng as [number, number]
    })).sort((a, b) => a.name.localeCompare(b.name))

    useEffect(() => {
        const initializeMap = async () => {
            try {
                setLoading(true)
                const response = await fetch(
                    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
                )
                const geojson = await response.json()
                setGeoJsonData(geojson.features || [])

                await fetchCountries()
            } catch (error) {
                console.error("Error initializing map:", error)
                toast.error("Error", {
                    description: "Failed to load map data"
                })
            } finally {
                setLoading(false)
            }
        }

        initializeMap()
    }, [])

    const fetchCountries = async () => {
        try {
            const { data, error } = await supabase
                .from("countries_levels")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setCountriesData(data || [])
        } catch (error: any) {
            console.error("Error fetching countries:", error)
            toast.error("Error", {
                description: "Failed to load countries"
            })
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

    const handleBaseCountryChange = (value: string) => {
        const selectedCountry = countryList.find(c => c.name === value)
        if (selectedCountry) {
            setFormData({
                ...formData,
                base_country: value,
                latitude: selectedCountry.latlng[0],
                longitude: selectedCountry.latlng[1],
            })
        }
    }

    const handleCreateCountry = async () => {
        try {
            setCreating(true)

            const { data, error } = await supabase
                .from("countries_levels")
                .insert({
                    country_name: formData.country_name,
                    base_country: formData.base_country,
                    min_level: formData.min_level,
                    max_level: formData.max_level,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                })
                .select()
                .single()

            if (error) throw error

            setCountriesData([data, ...countriesData])
            setFormData({
                country_name: "",
                base_country: "",
                min_level: 1,
                max_level: 20,
                latitude: 0,
                longitude: 0,
            })
            setIsCreateDialogOpen(false)
            toast.success("Country added", {
                description: "Country level range has been created successfully"
            })
        } catch (error: any) {
            console.error("Error creating country:", error)
            toast.error("Error", {
                description: "Failed to create country"
            })
        } finally {
            setCreating(false)
        }
    }

    const handleEditCountry = (country: CountryLevel) => {
        setSelectedCountryId(country.id)
        setFormData({
            country_name: country.country_name,
            base_country: country.base_country || "",
            min_level: country.min_level,
            max_level: country.max_level,
            latitude: country.latitude,
            longitude: country.longitude,
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateCountry = async () => {
        if (!selectedCountryId) return

        try {
            setUpdating(true)

            const { data, error } = await supabase
                .from("countries_levels")
                .update({
                    country_name: formData.country_name,
                    min_level: formData.min_level,
                    max_level: formData.max_level,
                })
                .eq("id", selectedCountryId)
                .select()
                .single()

            if (error) throw error

            setCountriesData(
                countriesData.map(c => c.id === selectedCountryId ? data : c)
            )
            setFormData({
                country_name: "",
                base_country: "",
                min_level: 1,
                max_level: 20,
                latitude: 0,
                longitude: 0,
            })
            setIsEditDialogOpen(false)
            setSelectedCountryId(null)
            toast.success("Country updated", {
                description: "Country level range has been updated successfully"
            })
        } catch (error: any) {
            console.error("Error updating country:", error)
            toast.error("Error", {
                description: "Failed to update country"
            })
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteCountry = async () => {
        if (!selectedCountryId) return

        try {
            const { error } = await supabase
                .from("countries_levels")
                .delete()
                .eq("id", selectedCountryId)

            if (error) throw error

            setCountriesData(countriesData.filter(c => c.id !== selectedCountryId))
            setDeleteAlertOpen(false)
            setSelectedCountryId(null)
            toast.success("Country deleted", {
                description: "Country has been deleted successfully"
            })
        } catch (error: any) {
            console.error("Error deleting country:", error)
            toast.error("Error", {
                description: "Failed to delete country"
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

    const getColorForLevel = (minLevel: number, maxLevel: number) => {
        // Use the average of min and max level to determine color
        const avgLevel = (minLevel + maxLevel) / 2

        if (avgLevel <= 10) return LEVEL_COLORS[1]      // Levels 1-10: Blue
        if (avgLevel <= 20) return LEVEL_COLORS[2]      // Levels 11-20: Green
        if (avgLevel <= 30) return LEVEL_COLORS[3]      // Levels 21-30: Amber
        if (avgLevel <= 40) return LEVEL_COLORS[4]      // Levels 31-40: Red
        return LEVEL_COLORS[5]                           // Levels 41+: Purple
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading map data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Course Map Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage countries and their level ranges for course placement
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            World Map Overview
                        </CardTitle>
                        <CardDescription>
                            Click any country to zoom in • Hover to see level range
                        </CardDescription>
                    </div>
                    <Button
                        variant={showPolygons ? "default" : "outline"}
                        onClick={() => setShowPolygons(!showPolygons)}
                        size="sm"
                    >
                        {showPolygons ? "Hide" : "Show"} Regions
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full rounded-md overflow-hidden">
                        <HoverContext.Provider value={{ hoveredCountryId, setHoveredCountryId }}>
                            <Map center={[20, 0]} zoom={2} className="h-full w-full">
                                <MapTileLayer />
                                <MapZoomControl />
                                <MapLocateControl />

                                {showPolygons && countriesData.map((country) => {
                                    const polygons = country.polygon || getCountryPolygon(country.base_country!)
                                    if (!polygons || polygons.length === 0) return null

                                    return polygons.map((polygon, idx) => (
                                        <InteractivePolygon
                                            key={`${country.id}-${idx}`}
                                            positions={polygon}
                                            country={country}
                                            color={getColorForLevel(country.min_level, country.max_level)}
                                        />
                                    ))
                                })}
                            </Map>
                        </HoverContext.Provider>
                    </div>
                </CardContent>
            </Card>

            {/* Rest of the component remains the same */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Countries & Level Ranges
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define countries with accurate GeoJSON boundaries for course localization
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Country
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Country</DialogTitle>
                            <DialogDescription>
                                Add a country with its level range. GeoJSON boundaries are automatically fetched and stored.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="country_name" className="text-right text-sm font-medium">
                                    Country Name
                                </label>
                                <Input
                                    id="country_name"
                                    value={formData.country_name}
                                    onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Custom country name"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="base_country" className="text-right text-sm font-medium">
                                    Base Country
                                </label>
                                <Select value={formData.base_country} onValueChange={handleBaseCountryChange}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select country (GeoJSON will be auto-loaded)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryList.map((country) => (
                                            <SelectItem key={country.name} value={country.name}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="min_level" className="text-right text-sm font-medium">
                                    Min Level
                                </label>
                                <Input
                                    id="min_level"
                                    type="number"
                                    value={formData.min_level}
                                    onChange={(e) => setFormData({ ...formData, min_level: parseInt(e.target.value) || 1 })}
                                    className="col-span-3"
                                    placeholder="1"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="max_level" className="text-right text-sm font-medium">
                                    Max Level
                                </label>
                                <Input
                                    id="max_level"
                                    type="number"
                                    value={formData.max_level}
                                    onChange={(e) => setFormData({ ...formData, max_level: parseInt(e.target.value) || 20 })}
                                    className="col-span-3"
                                    placeholder="20"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateCountry} disabled={creating || !formData.country_name || !formData.base_country}>
                                {creating ? "Creating..." : "Add Country"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Country Level Ranges
                    </CardTitle>
                    <CardDescription>
                        {countriesData.length} countr{countriesData.length !== 1 ? 'ies' : 'y'} configured with production-grade GeoJSON
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Base Country</TableHead>
                                    <TableHead>Level Range</TableHead>
                                    <TableHead>Coordinates</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {countriesData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Globe className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    No countries configured yet. Add your first country!
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    countriesData.map((country) => (
                                        <TableRow key={country.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: getColorForLevel(country.min_level, country.max_level) }}
                                                    ></div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {country.country_name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {country.base_country || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    Levels {country.min_level} - {country.max_level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {country.latitude.toFixed(4)}, {country.longitude.toFixed(4)}
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-gray-400">
                                                {formatDate(country.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditCountry(country)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedCountryId(country.id)
                                                            setDeleteAlertOpen(true)
                                                        }}
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Country</DialogTitle>
                        <DialogDescription>
                            Update the country details and level range.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit_country_name" className="text-right text-sm font-medium">
                                Country Name
                            </label>
                            <Input
                                id="edit_country_name"
                                value={formData.country_name}
                                onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                                className="col-span-3"
                                placeholder="Custom country name"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit_base_country" className="text-right text-sm font-medium">
                                Base Country
                            </label>
                            <Input
                                id="edit_base_country"
                                disabled
                                value={formData.base_country}
                                className="col-span-3 bg-gray-100"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit_min_level" className="text-right text-sm font-medium">
                                Min Level
                            </label>
                            <Input
                                id="edit_min_level"
                                type="number"
                                value={formData.min_level}
                                onChange={(e) => setFormData({ ...formData, min_level: parseInt(e.target.value) || 1 })}
                                className="col-span-3"
                                placeholder="1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit_max_level" className="text-right text-sm font-medium">
                                Max Level
                            </label>
                            <Input
                                id="edit_max_level"
                                type="number"
                                value={formData.max_level}
                                onChange={(e) => setFormData({ ...formData, max_level: parseInt(e.target.value) || 20 })}
                                className="col-span-3"
                                placeholder="20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleUpdateCountry} disabled={updating || !formData.country_name}>
                            {updating ? "Updating..." : "Update Country"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Country?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the country and affect any courses associated with it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCountry}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}