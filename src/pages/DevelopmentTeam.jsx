import React, { useState, useRef, useEffect } from "react";
import { motion, useViewportScroll, useTransform, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Linkedin, Github, Mail, Globe, Trophy, X, ChevronDown, ChevronUp, Send, Sparkles } from "lucide-react";
import axios from "axios";
import Confetti from "react-confetti";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const developers = [
  {
    name: "Simarjot Singh",
    role: "Full Stack Developer",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    email: "simarjot875@gmail.com",
    description: "B.Tech (IT) 4th year student batch 2022-26.",
    skills: {
      "Programming": ["Python", "JavaScript", "C/C++"],
      "Web": ["HTML/CSS", "Bootstrap", "React.js", "Node.js", "Express.js", "Flask"],
      "Databases": ["MySQL", "MongoDB", "PostgreSQL"],
      "Data Science & ML": ["Pandas", "NumPy", "Matplotlib", "Seaborn"],
      "Automation & WebScraping": ["Selenium", "BeautifulSoup", "Requests"],
      "GUI": ["Tkinter", "Turtle", "CSS Grid/Flexbox"],
      "Tools & Deployment": ["Git & GitHub", "Jinja2", "REST APIs", "Render/Vercel"],
      "Management": ["Event Management", "Team Leadership", "Communication"]
    },
    achievements: ["Built homepage UI", "Optimized animations", "Implemented responsive design", "Integrated backend APIs"],
    linkedin: "#",
    github: "#",
    portfolio: "#",
    bgGradient: "from-amber-500/10 to-orange-600/10"
  },
  {
    name: "Isha Verma",
    role: "UI/UX Designer",
    avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    email: "isha@example.com",
    description: "Designs intuitive, beautiful interfaces with motion and usability in mind.",
    skills: {
      "Design Tools": ["Figma", "Adobe XD", "Sketch", "Illustrator"],
      "UI/UX": ["User Research", "Wireframing", "Prototyping", "Design Systems"],
      "Frontend": ["HTML/CSS", "JavaScript", "React", "Framer Motion"],
      "Visual Design": ["Typography", "Color Theory", "Layout", "Illustration"]
    },
    achievements: ["Redesigned dashboard", "Created prototype flows", "Improved user engagement by 40%", "Developed design system"],
    linkedin: "#",
    github: "#",
    portfolio: "#",
    bgGradient: "from-rose-500/10 to-pink-600/10"
  },
  {
    name: "Rohan Gupta",
    role: "Backend Developer",
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    email: "rohan@example.com",
    description: "Builds scalable APIs, databases, and server-side logic with Node.js and MongoDB.",
    skills: {
      "Backend": ["Node.js", "Express", "Django", "Flask", "REST", "GraphQL"],
      "Databases": ["MongoDB", "PostgreSQL", "Redis", "Elasticsearch"],
      "DevOps": ["Docker", "Kubernetes", "AWS", "CI/CD", "Nginx"],
      "Testing": ["Jest", "Mocha", "Chai", "Postman", "Load Testing"]
    },
    achievements: ["Built API endpoints", "Deployed backend on AWS", "Reduced API response time by 60%", "Implemented caching system"],
    linkedin: "#",
    github: "#",
    portfolio: "#",
    bgGradient: "from-indigo-500/10 to-blue-600/10"
  },
];

export default function DeveloperPage() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useViewportScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.3]);

  const handleContactChange = (e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    try {
      await axios.post("/api/contact", contactForm);
      setSuccess("Message sent successfully!");
      setContactForm({ name: "", email: "", message: "" });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (err) {
      setSuccess("Failed to send message. Try again.");
    }
    setLoading(false);
  };

  const particlesInit = async (main) => await loadFull(main);

  const toggleExpand = (email) => {
    setExpandedCards(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  // Filter developers based on category
  const filteredDevelopers = activeCategory === "all" 
    ? developers 
    : developers.filter(dev => dev.role.toLowerCase().includes(activeCategory));

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-orange-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white/80 to-transparent dark:from-gray-900/80"></div>
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-white/80 to-transparent dark:from-gray-900/80"></div>
        
        {/* Animated circles */}
        {[1, 2, 3, 4, 5].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(${i % 2 ? '255,150,50' : '100,150,255'},0.1) 0%, transparent 70%)`
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      {/* Particles Background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            interactivity: { 
              events: { 
                onHover: { enable: true, mode: "grab" }, 
                resize: true 
              } 
            },
            particles: {
              color: { value: ["#FF7F50", "#6366F1", "#EC4899"] },
              links: { 
                color: "#9CA3AF", 
                distance: 150, 
                enable: true, 
                opacity: 0.4, 
                width: 1 
              },
              collisions: { enable: false },
              move: { 
                enable: true, 
                speed: 1,
                outModes: "bounce",
                direction: "none",
                random: true,
                straight: false
              },
              number: { value: 40, density: { enable: true, area: 800 } },
              opacity: { value: 0.5 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 5 } }
            },
            detectRetina: true
          }}
        />
      </div>

      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Header/Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="text-xl font-bold bg-gradient-to-r from-orange-500 to-indigo-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              Team Spectrum
            </motion.div>
            
            <div className="hidden md:flex space-x-8">
              <motion.a 
                href="#team" 
                className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                whileHover={{ y: -2 }}
              >
                Our Team
              </motion.a>
              <motion.a 
                href="#skills" 
                className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                whileHover={{ y: -2 }}
              >
                Skills
              </motion.a>
              <motion.a 
                href="#contact" 
                className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                whileHover={{ y: -2 }}
              >
                Contact
              </motion.a>
            </div>
            
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-current transition duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="px-4 py-4 space-y-4">
                <motion.a 
                  href="#team" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Our Team
                </motion.a>
                <motion.a 
                  href="#skills" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Skills
                </motion.a>
                <motion.a 
                  href="#contact" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        style={{ y: heroY, opacity }}
        className="relative max-w-6xl mx-auto text-center mb-16 px-4 pt-20 pb-10 z-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-orange-500 to-indigo-600 rounded-full mb-6"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
        >
          Meet The <span className="bg-gradient-to-r from-orange-500 to-indigo-600 bg-clip-text text-transparent">Creators</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
        >
          The passionate minds behind our innovative sports platform. We blend technology and creativity to deliver exceptional experiences.
        </motion.p>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-indigo-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
          >
            View Our Work
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-full font-medium shadow hover:shadow-md transition-all"
          >
            Contact Team
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Category Filter */}
      <motion.section 
        id="skills"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 mb-12 z-10 relative"
      >
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Filter by Role</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {["all", "full stack", "ui/ux", "backend"].map((category) => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category 
                ? "bg-gradient-to-r from-orange-500 to-indigo-600 text-white shadow-lg" 
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow"}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Developer Cards */}
      <section id="team" className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 z-10 relative pb-20">
        {filteredDevelopers.map((dev, idx) => (
          <motion.div
            key={dev.email}
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="relative"
          >
            <Card className={`rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br ${dev.bgGradient} backdrop-blur-sm overflow-hidden group h-full flex flex-col`}>
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-0"></div>
              
              <CardHeader className="flex flex-col items-center pt-8 relative z-10">
                <motion.div 
                  className="relative"
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-white/80 dark:ring-gray-800/80 shadow-xl"
                    whileHover={{ scale: 1.05 }}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-indigo-600 text-white p-2 rounded-full shadow-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                </motion.div>
                
                <CardTitle className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">{dev.name}</CardTitle>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{dev.role}</p>
                
                <motion.div 
                  className="mt-4 flex items-center justify-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[
                    ["LinkedIn", dev.linkedin, Linkedin, "text-blue-600"],
                    ["GitHub", dev.github, Github, "text-gray-800 dark:text-gray-200"],
                    ["Portfolio", dev.portfolio, Globe, "text-green-600"],
                    ["Mail", `mailto:${dev.email}`, Mail, "text-red-500"]
                  ].map(([label, url, Icon, color], i) => (
                    <motion.a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className={`h-10 w-10 inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg ${color} transition-all duration-200 border border-gray-200 dark:border-gray-700`}
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </motion.div>
              </CardHeader>

              <CardContent className="px-6 pb-6 flex-grow flex flex-col relative z-10">
                {/* Description */}
                <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">{dev.description}</p>

                {/* Skills Preview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Key Skills</h3>
                    <button 
                      onClick={() => toggleExpand(dev.email)}
                      className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                    >
                      {expandedCards[dev.email] ? 'Show less' : 'Show all'} 
                      {expandedCards[dev.email] ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Object.values(dev.skills)
                      .flat()
                      .slice(0, expandedCards[dev.email] ? 20 : 6)
                      .map((skill, idx) => (
                        <motion.span 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs text-gray-800 dark:text-gray-200 shadow border border-gray-200 dark:border-gray-700"
                        >
                          {skill}
                        </motion.span>
                      ))
                    }
                  </div>
                </div>

                {/* Achievements */}
                <div className="mt-auto">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Achievements</h3>
                  <ul className="space-y-2">
                    {dev.achievements.slice(0, 3).map((achievement, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start"
                      >
                        <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{achievement}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
                {/* Contact Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 w-full py-2.5 bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center"
                  onClick={() => setContactForm({...contactForm, message: `Hi ${dev.name},\n\nI would like to discuss...`})}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact {dev.name.split(' ')[0]}
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Stats Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 py-16 mb-16 bg-gradient-to-r from-orange-500/10 to-indigo-600/10 rounded-3xl relative overflow-hidden z-10"
      >
        <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          {[
            { value: "15+", label: "Projects Completed" },
            { value: "8", label: "Technologies" },
            { value: "100%", label: "Client Satisfaction" },
            { value: "24/7", label: "Support" }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-indigo-600 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-gray-700 dark:text-gray-300 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact Form */}
      <motion.section 
        id="contact"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl relative z-10 mb-20 border border-gray-200 dark:border-gray-700"
      >
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
          Get In Touch
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Contact Our Team</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Have a project in mind? Let's discuss how we can help.</p>
        
        <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <input 
                type="text" 
                name="name" 
                placeholder="Your Name" 
                value={contactForm.name} 
                onChange={handleContactChange} 
                required 
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-10" 
              />
            </div>
            <div className="relative">
              <input 
                type="email" 
                name="email" 
                placeholder="Your Email" 
                value={contactForm.email} 
                onChange={handleContactChange} 
                required 
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-10" 
              />
            </div>
          </div>
          
          <div className="relative">
            <textarea 
              name="message" 
              placeholder="Your Message" 
              value={contactForm.message} 
              onChange={handleContactChange} 
              required 
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none h-32 pr-10" 
            />
          </div>
          
          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-orange-500 to-indigo-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Message
              </>
            )}
          </motion.button>
          
          {success && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center mt-4 px-4 py-2 rounded-lg ${success.includes("successfully") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
            >
              {success}
            </motion.p>
          )}
        </form>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-indigo-600 bg-clip-text text-transparent"
          >
            Team Spectrum
          </motion.div>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Creating innovative digital experiences with passion and expertise. Let's build something amazing together.
          </p>
          
          <div className="flex justify-center space-x-6 mb-8">
            {developers.map((dev, idx) => (
              <motion.a
                key={idx}
                href={`mailto:${dev.email}`}
                whileHover={{ y: -5 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {dev.name.split(' ')[0]}
              </motion.a>
            ))}
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Team Spectrum. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}