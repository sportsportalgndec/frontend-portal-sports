import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Linkedin, Github, Mail } from 'lucide-react';

// Simple, responsive cards for three team members
// Matches existing design accents and supports dark mode

const members = [
  {
    name: 'Aarav Sharma',
    role: 'Frontend Engineer',
    email: 'aarav@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    description: 'Focused on building fast, accessible UIs with React, Tailwind, and modern tooling.',
    linkedin: '#',
    github: '#'
  },
  {
    name: 'Isha Verma',
    role: 'UI/UX Designer',
    email: 'isha@example.com',
    phone: '+91 98765 40000',
    avatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
    description: 'Designs elegant, human-centered interfaces with a keen eye for details and motion.',
    linkedin: '#',
    github: '#'
  },
  {
    name: 'Rohan Gupta',
    role: 'Backend Engineer',
    email: 'rohan@example.com',
    phone: '+91 90000 12345',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    description: 'Builds robust APIs and systems with Node.js and databases, optimizing for reliability.',
    linkedin: '#',
    github: '#'
  }
];

export default function DevelopmentTeam() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
            Our Development Team
          </h1>
          <p className="mt-3 text-base md:text-lg text-gray-600 dark:text-gray-300">
            Meet the passionate minds behind this project.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((m, idx) => (
            <motion.div
              key={m.email}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
            >
              <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center justify-center pt-8">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <motion.img
                        src={m.avatar}
                        alt={m.name}
                        className="w-24 h-24 rounded-full object-cover ring-2 ring-orange-200 dark:ring-orange-900/40 shadow-md"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400/0 to-indigo-500/0 group-hover:from-orange-400/10 group-hover:to-indigo-500/10 transition-colors" />
                    </div>
                    <CardTitle className="mt-4 text-xl font-bold text-gray-900 dark:text-white text-center">
                      {m.name}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground text-gray-600 dark:text-gray-300 text-center">
                      {m.role}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                    {m.description}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <a
                      href={m.linkedin}
                      aria-label="LinkedIn"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-white hover:bg-[#0A66C2] hover:border-transparent transition-transform duration-200 hover:scale-105"
                      target="_blank" rel="noreferrer"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href={m.github}
                      aria-label="GitHub"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-800 hover:border-transparent transition-transform duration-200 hover:scale-105"
                      target="_blank" rel="noreferrer"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href={`mailto:${m.email}`}
                      aria-label="Mail"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-white hover:bg-red-600 hover:border-transparent transition-transform duration-200 hover:scale-105"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


