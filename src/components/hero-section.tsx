import { Button } from "@/packages/shadcn/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/packages/shadcn/ui/avatar"
import { AvatarGroup } from "@/packages/shadcn/ui/shadcn-io/avatar-group"
import { Map, MapTileLayer, MapMarker, MapPopup, MapTooltip, MapLayers, MapZoomControl, MapLayersControl } from "@/packages/shadcn/ui/map"
import { MapPinIcon } from "lucide-react"
import { AuroraText } from "@/packages/shadcn/ui/aurora-text"
import { useNavigate } from "react-router-dom"
interface HeroSectionProps {
    onSignIn: () => void
}

export default function HeroSection({ onSignIn }: HeroSectionProps) {
    const navigate = useNavigate()

    return (
        <section className="relative flex flex-col items-center text-sm bg-white">
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
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Learner3" alt="Learner 3" />
                                <AvatarFallback>L3</AvatarFallback>
                            </Avatar>
                        </AvatarGroup>
                        <span className="text-sm text-slate-600">Join Now! More learners already using LevelUpED</span>
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
                <div className="w-[40vw] rounded-[15px] mt-16 overflow-hidden shadow-lg">
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