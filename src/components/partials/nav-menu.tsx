import { Button } from "@/packages/shadcn/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import {
    Banner,
    BannerIcon,
    BannerTitle,
} from "@/packages/shadcn/ui/shadcn-io/banner"
import { Menu, Sparkles } from "lucide-react"

export default function NavMenu() {
    const [isBannerVisible, setIsBannerVisible] = useState(true)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const navigate = useNavigate()

    return (
        <>
            {/* Top Banner */}
            {isBannerVisible && (
                <Banner
                    className="relative z-10 w-full py-4 font-medium text-sm text-white text-center bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border-b border-indigo-500 flex items-center justify-center gap-3"
                    onClose={() => setIsBannerVisible(false)}
                >
                    <BannerIcon icon={Sparkles} className="text-yellow-300" />
                    <BannerTitle className="flex-1 text-center tracking-wide">
                        <span className="inline-flex items-center gap-2">
                            <span className="bg-white/20 rounded px-2 py-1 font-semibold text-yellow-200 shadow-sm">
                                🎉 Welcome!
                            </span>
                            <span>
                                <span className="font-bold text-yellow-200">Register now</span>
                                <span className="mx-1">—</span>
                                <span className="font-semibold text-white">Free 100 coins</span>
                                <span className="mx-1">for first time users!</span>
                            </span>
                        </span>
                    </BannerTitle>
                    
                </Banner>
            )}

            <nav className="sticky top-0 z-[100] border-b border-gray-200 w-full py-6 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur text-slate-800 text-sm bg-white/80">
                <div className="flex items-center justify-center w-full relative">
                    {/* Logo - absolutely left */}
                    <a href="/" className="absolute left-0 flex items-center gap-2">
                        <img
                            src="/images/leveluped-mainlogo.png"
                            alt="LevelUpED Logo"
                            className="w-8 h-8 rounded-lg"
                        />
                    </a>

                    {/* Centered Links */}
                    <div className="hidden md:flex items-center gap-8 transition duration-500">
                        <a href="/courses" className="hover:text-indigo-600 transition">
                            Courses
                        </a>
                        <a href="/about" className="hover:text-indigo-600 transition">
                            About
                        </a>
                        <a href="/pricing" className="hover:text-indigo-600 transition">
                            Pricing
                        </a>
                    </div>

                    {/* Desktop Buttons - absolutely right */}
                    <div className="hidden md:flex items-center space-x-3 absolute right-0">
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

                    {/* Mobile Menu Button - absolutely right */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden absolute right-0 active:scale-90 transition"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </nav>
        </>
    )
}