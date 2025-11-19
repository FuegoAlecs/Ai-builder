/**
 * Beautiful, Lovable-quality component templates
 * These templates generate stunning, production-ready components
 * 
 * Includes:
 * - Navigation (Navbar)
 * - Footer
 * - Hero sections (multiple variants)
 * - Feature grids
 * - Pricing tables
 * - Testimonials
 * - Contact forms
 * - CTA sections
 * - Loading states
 * - Error boundaries
 */

/**
 * Generate a beautiful Navbar with glass morphism and smooth animations
 */
export function generateBeautifulNavbar(architectureSpec, planningSpec, designSystem) {
  const template = architectureSpec.template || 'vite-react';
  const isNextJs = template === 'nextjs';
  const pages = architectureSpec.fileStructure?.pages || [];
  const projectName = architectureSpec.projectName || 'My Website';
  const titleCase = projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const primaryColor = designSystem.colors?.primary || '#3B82F6';
  const secondaryColor = designSystem.colors?.secondary || '#8B5CF6';
  
  if (isNextJs) {
    return `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
${pages.map(page => `    { name: '${page.name}', path: '${page.route}' }`).join(',\n')}
  ]

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
      isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }\`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with gradient */}
          <Link 
            href="/" 
            className="text-2xl font-bold bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
          >
            ${titleCase}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={\`relative text-gray-700 hover:text-[${primaryColor}] transition-colors duration-300 font-medium \${
                  pathname === link.path ? 'text-[${primaryColor}]' : ''
                }\`}
              >
                {link.name}
                {pathname === link.path && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] rounded-full" />
                )}
              </Link>
            ))}
            <Link
              href="/contact"
              className="bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-[${primaryColor}] transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 animate-slideDown">
            <div className="flex flex-col space-y-4 bg-white rounded-2xl shadow-xl p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={\`text-gray-700 hover:text-[${primaryColor}] transition-colors duration-300 font-medium py-2 \${
                    pathname === link.path ? 'text-[${primaryColor}] font-semibold' : ''
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
`;
  }
  
  // Vite React version
  return `import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
${pages.map(page => `    { name: '${page.name}', path: '${page.route}' }`).join(',\n')}
  ]

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
      isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }\`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with gradient */}
          <Link 
            to="/" 
            className="text-2xl font-bold bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
          >
            ${titleCase}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={\`relative text-gray-700 hover:text-[${primaryColor}] transition-colors duration-300 font-medium \${
                  location.pathname === link.path ? 'text-[${primaryColor}]' : ''
                }\`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] rounded-full" />
                )}
              </Link>
            ))}
            <Link
              to="/contact"
              className="bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-[${primaryColor}] transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 animate-slideDown">
            <div className="flex flex-col space-y-4 bg-white rounded-2xl shadow-xl p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={\`text-gray-700 hover:text-[${primaryColor}] transition-colors duration-300 font-medium py-2 \${
                    location.pathname === link.path ? 'text-[${primaryColor}] font-semibold' : ''
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
`;
}

/**
 * Generate a beautiful Footer with social links and newsletter
 */
export function generateBeautifulFooter(architectureSpec, planningSpec, designSystem) {
  const template = architectureSpec.template || 'vite-react';
  const isNextJs = template === 'nextjs';
  const pages = architectureSpec.fileStructure?.pages || [];
  const projectName = architectureSpec.projectName || 'My Website';
  const titleCase = projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const primaryColor = designSystem.colors?.primary || '#3B82F6';
  const secondaryColor = designSystem.colors?.secondary || '#8B5CF6';
  
  const linkComponent = isNextJs ? 'Link' : 'Link';
  const linkImport = isNextJs ? "import Link from 'next/link'" : "import { Link } from 'react-router-dom'";
  
  return `${linkImport}
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react'

${isNextJs ? 'export default ' : ''}function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
${pages.slice(0, 4).map(page => `      { name: '${page.name}', path: '${page.route}' }`).join(',\n')}
    ],
    company: [
      { name: 'About', path: '/about' },
      { name: 'Blog', path: '/blog' },
      { name: 'Careers', path: '/careers' },
      { name: 'Contact', path: '/contact' }
    ],
    legal: [
      { name: 'Privacy', path: '/privacy' },
      { name: 'Terms', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' }
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] bg-clip-text text-transparent mb-4">
              ${titleCase}
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Building amazing digital experiences that help businesses grow and succeed in the modern world.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail size={18} />
                <span>hello@${projectName}.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Phone size={18} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <MapPin size={18} />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.path}>
                  <${linkComponent}
                    ${isNextJs ? 'href' : 'to'}={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </${linkComponent}>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <${linkComponent}
                    ${isNextJs ? 'href' : 'to'}={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </${linkComponent}>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <${linkComponent}
                    ${isNextJs ? 'href' : 'to'}={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </${linkComponent}>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-12 border-t border-gray-800">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-white font-semibold mb-2">Subscribe to our newsletter</h4>
            <p className="text-gray-400 mb-4">Get the latest updates and news delivered to your inbox.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] focus:border-transparent text-white placeholder-gray-500 transition-all duration-300"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-gray-400 text-sm">
              © {currentYear} ${titleCase}. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

${isNextJs ? '' : 'export default Footer'}
`;
}
