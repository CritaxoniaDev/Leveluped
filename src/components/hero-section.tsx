import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AvatarGroup } from "@/components/ui/shadcn-io/avatar-group"
import {
    Banner,
    BannerIcon,
    BannerTitle,
    BannerClose,
} from "@/components/ui/shadcn-io/banner"
import { Map, MapTileLayer, MapMarker, MapPopup, MapTooltip, MapLayers, MapZoomControl, MapLayersControl } from "@/components/ui/map"
import { MapPinIcon } from "lucide-react"
import { AuroraText } from "./ui/aurora-text"
import { useNavigate } from "react-router-dom"

interface HeroSectionProps {
    onSignIn: () => void
}

export default function HeroSection({ onSignIn }: HeroSectionProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isBannerVisible, setIsBannerVisible] = useState(true)
    const navigate = useNavigate()

    return (
        <section className="relative flex flex-col items-center text-sm bg-white overflow-hidden">
            {/* Top Banner */}
            {isBannerVisible && (
                <Banner
                    className="relative z-10 w-full py-2.5 font-medium text-sm text-white text-center bg-gradient-to-r from-indigo-600 to-purple-600"
                    onClose={() => setIsBannerVisible(false)}
                >
                    <BannerIcon icon={Sparkles} />
                    <BannerTitle className="flex-1 text-center">
                        Welcome to LevelUpED - Discover the future of gamified learning!
                    </BannerTitle>
                    <BannerClose />
                </Banner>
            )}

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur text-slate-800 text-sm">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <img
                        src="/images/leveluped-mainlogo.png"
                        alt="LevelUpED Logo"
                        className="w-8 h-8 rounded-lg"
                    />
                    <span className="text-xl head-font font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        LevelUpED
                    </span>
                </a>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 transition duration-500">
                    <a href="#features" className="hover:text-indigo-600 transition">
                        Features
                    </a>
                    <a href="/courses" className="hover:text-indigo-600 transition">
                        Courses
                    </a>
                    <a href="#testimonials" className="hover:text-indigo-600 transition">
                        Testimonials
                    </a>
                    <a href="/about" className="hover:text-indigo-600 transition">
                        About
                    </a>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:block space-x-3">
                    <Button
                        onClick={() => navigate('/signup')}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition text-white rounded-md"
                    >
                        Register
                    </Button>
                    <Button
                        onClick={() => navigate('/login')}
                        variant="outline"
                        className="px-6 py-2 border border-indigo-600 hover:bg-indigo-50 transition text-indigo-600 rounded-md"
                    >
                        Login
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden active:scale-90 transition"
                >
                    <Menu className="w-6 h-6" />
                </Button>
            </nav>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-white/60 text-slate-800 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-300 translate-x-0">
                    <a href="#features" onClick={() => setIsMenuOpen(false)}>
                        Features
                    </a>
                    <a href="#courses" onClick={() => setIsMenuOpen(false)}>
                        Courses
                    </a>
                    <a href="#pricing" onClick={() => setIsMenuOpen(false)}>
                        Pricing
                    </a>
                    <a href="#about" onClick={() => setIsMenuOpen(false)}>
                        About
                    </a>
                    <Button
                        onClick={() => {
                            setIsMenuOpen(false)
                            onSignIn()
                        }}
                        className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-slate-100 hover:bg-slate-200 transition text-black rounded-md flex"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>
            )}

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center max-md:px-2">
                {/* Localized Striped Pattern Section */}
                <div className="relative mt-32 flex flex-col items-center gap-4">
                    {/* Custom Grid with Fade */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e510_1px,transparent_1px),linear-gradient(to_bottom,#4f46e510_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] animate-pulse opacity-70"></div>

                    {/* Avatar Group */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <AvatarGroup variant="stack" size={40} animate>
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Learner1" alt="Learner 1" />
                                <AvatarFallback>L1</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor1" alt="Instructor 1" />
                                <AvatarFallback>I1</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin1" alt="Admin 1" />
                                <AvatarFallback>A1</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Learner2" alt="Learner 2" />
                                <AvatarFallback>L2</AvatarFallback>
                            </Avatar>
                        </AvatarGroup>
                        <span className="text-sm text-slate-600">Join 10K+ learners already using LevelUpED</span>
                    </div>

                    {/* Headline */}
                    <h1 className="relative z-10 head-font tracking-normal text-center text-5xl leading-[68px] md:text-6xl md:leading-[80px] font-bold max-w-4xl text-slate-900">
                        Transform Learning with <AuroraText >LevelUpED</AuroraText>
                    </h1>

                    {/* Subheadline */}
                    <p className="relative z-10 text-center text-base text-slate-700 max-w-lg mt-2">
                        The ultimate gamified LMS that turns education into an engaging adventure. Build, test, and deliver courses faster.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex items-center gap-4 mt-8">
                    <Button
                        onClick={onSignIn}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white active:scale-95 rounded-lg px-7 h-11 transition"
                    >
                        Get Started
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.166 10h11.667m0 0L9.999 4.165m5.834 5.833-5.834 5.834" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Button>
                </div>

                {/* Hero Image - Interactive Map */}
                <div className="w-full rounded-[15px] max-w-4xl mt-16 overflow-hidden shadow-lg">
                    <Map
                        center={[40, -95]}
                        zoom={4}
                        className="h-96 rounded-[15px]"
                    >
                        <MapLayers defaultTileLayer="Light">
                            <MapTileLayer name="Light" url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png" />
                            <MapTileLayer name="Dark" darkUrl="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png" />

                            {/* Sample Course Markers */}
                            <MapMarker position={[40.7128, -74.0060]} icon={<MapPinIcon className="size-6 text-blue-600" />}>
                                <MapPopup>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Web Development 101</h3>
                                        <p className="text-sm text-gray-600">Learn modern web development</p>
                                        <Button
                                            onClick={() => navigate('/signup')}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            size="sm"
                                        >
                                            Enroll Now
                                        </Button>
                                    </div>
                                </MapPopup>
                                <MapTooltip>Web Development 101</MapTooltip>
                            </MapMarker>

                            <MapMarker position={[34.0522, -118.2437]} icon={<MapPinIcon className="size-6 text-purple-600" />}>
                                <MapPopup>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Data Science Basics</h3>
                                        <p className="text-sm text-gray-600">Master data analysis & ML</p>
                                        <Button
                                            onClick={() => navigate('/signup')}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            size="sm"
                                        >
                                            Enroll Now
                                        </Button>
                                    </div>
                                </MapPopup>
                                <MapTooltip>Data Science Basics</MapTooltip>
                            </MapMarker>

                            <MapMarker position={[41.8781, -87.6298]} icon={<MapPinIcon className="size-6 text-green-600" />}>
                                <MapPopup>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Python Programming</h3>
                                        <p className="text-sm text-gray-600">From beginner to advanced</p>
                                        <Button
                                            onClick={() => navigate('/signup')}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            size="sm"
                                        >
                                            Enroll Now
                                        </Button>
                                    </div>
                                </MapPopup>
                                <MapTooltip>Python Programming</MapTooltip>
                            </MapMarker>

                            <MapMarker position={[37.7749, -122.4194]} icon={<MapPinIcon className="size-6 text-red-600" />}>
                                <MapPopup>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Cloud Computing</h3>
                                        <p className="text-sm text-gray-600">AWS, Azure & GCP essentials</p>
                                        <Button
                                            onClick={() => navigate('/signup')}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            size="sm"
                                        >
                                            Enroll Now
                                        </Button>
                                    </div>
                                </MapPopup>
                                <MapTooltip>Cloud Computing</MapTooltip>
                            </MapMarker>

                            <MapZoomControl />
                            <MapLayersControl />
                        </MapLayers>
                    </Map>
                </div>
            </main>
        </section>
    )
}