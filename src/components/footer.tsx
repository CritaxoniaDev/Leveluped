import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
    return (
        <footer className="bg-white text-black">
            <Separator className="mb-8" />
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">
                            LevelUpED
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-md">
                            Empowering learners worldwide with cutting-edge educational technology.
                            Transform your learning journey with our gamified platform.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Twitter className="w-6 h-6" />
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Linkedin className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Courses</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Instructors</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Support</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Help Center</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a></li>
                        </ul>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="border-t border-gray-200 pt-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-600">support@leveluped.com</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-600">+1 (555) 123-4567</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-600">123 Learning Street, Education City, EC 12345</span>
                        </div>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <div className="border-t border-gray-200 pt-8 mb-8">
                    <div className="max-w-md">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">Stay Updated</h3>
                        <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest updates and educational insights.</p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500 text-black"
                            />
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-600 text-sm">
                        © {new Date().getFullYear()} LevelUpED. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Privacy</a>
                        <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Terms</a>
                        <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}