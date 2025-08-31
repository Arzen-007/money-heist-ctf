import React, { useState, useEffect } from 'react';
import { ChevronDown, Moon, Sun, Music, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Import assets
import backgroundImg from './assets/background.jpeg';
import moneyImg from './assets/money.jpg';
import moneyHeistImg from './assets/moneyhesit.jpg';
import sideImg from './assets/sideimg.jpeg';

const App = () => {
  const [currentTheme, setCurrentTheme] = useState('red');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Theme configuration
  const themes = {
    red: {
      name: 'Red Wave',
      emoji: '🔴',
      description: 'Plan the Heist',
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#fca5a5'
    },
    blue: {
      name: 'Blue Wave', 
      emoji: '🔵',
      description: 'Defend the Loot',
      primary: '#2563eb',
      secondary: '#1d4ed8',
      accent: '#93c5fd'
    },
    purple: {
      name: 'Purple Wave',
      emoji: '🟣', 
      description: 'Outsmart the Game',
      primary: '#7c3aed',
      secondary: '#6d28d9',
      accent: '#c4b5fd'
    }
  };

  // Apply theme to document
  useEffect(() => {
    document.body.className = `theme-${currentTheme} ${isDarkMode ? 'dark' : 'light'}`;
  }, [currentTheme, isDarkMode]);

  // Navigation component
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={moneyHeistImg} 
              alt="Dali Mask" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="orbitron text-xl font-bold" style={{color: 'var(--theme-primary)'}}>
              Money Heist CTF
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Waves', 'Leaderboard', 'Chat', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                onClick={() => setActiveSection(item.toLowerCase())}
              >
                {item}
                <span 
                  className="absolute -bottom-1 left-0 h-0.5 bg-current transform scale-x-0 transition-transform duration-200 hover:scale-x-100"
                  style={{backgroundColor: 'var(--theme-primary)'}}
                />
              </a>
            ))}
            
            {/* Themes Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Themes
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isThemeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                  >
                    {/* Theme Options */}
                    <div className="p-2">
                      <div className="text-xs text-gray-400 px-3 py-2 font-medium">WAVE THEMES</div>
                      {Object.entries(themes).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentTheme(key);
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                            currentTheme === key 
                              ? 'bg-white/10 text-white' 
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{theme.emoji}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{theme.name}</div>
                            <div className="text-xs text-gray-400">{theme.description}</div>
                          </div>
                          {currentTheme === key && (
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{backgroundColor: theme.primary}}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Mode Toggle */}
                    <div className="border-t border-white/10 p-2">
                      <div className="text-xs text-gray-400 px-3 py-2 font-medium">APPEARANCE</div>
                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                      >
                        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        <span className="font-medium">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-white/5 transition-colors duration-200">
              Sign In
            </button>
            <button 
              className="px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{backgroundColor: 'var(--theme-primary)'}}
            >
              Join the Heist
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Hero Section
  const HeroSection = () => (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundImg} 
          alt="Money Heist Characters" 
          className="w-full h-full object-cover opacity-30"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, var(--theme-bg) 0%, transparent 50%, var(--theme-bg) 100%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div>
              <h1 className="orbitron text-6xl lg:text-7xl font-black mb-4">
                <span style={{color: 'var(--theme-primary)'}}>Money Heist CTF</span>
              </h1>
              <h2 className="orbitron text-3xl lg:text-4xl font-light text-gray-300">
                Royal Mint Heist
              </h2>
            </div>
            
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              Steal the Mint's Flags! Join the ultimate cybersecurity heist where you'll plan, defend, and outsmart your way through three intense waves. Are you ready to be part of the crew?
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 text-white rounded-lg font-semibold text-lg transition-all duration-200 ripple-effect"
                style={{backgroundColor: 'var(--theme-primary)'}}
              >
                <img src={sideImg} alt="Dali Mask" className="w-6 h-6 rounded-full" />
                Join the Heist
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 text-gray-300 border-2 border-gray-600 rounded-lg font-semibold text-lg hover:bg-white/5 transition-all duration-200"
              >
                📋 View Challenges
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { number: '500+', label: 'Active Hackers', icon: '👥' },
              { number: '45', label: 'Total Challenges', icon: '🔓' },
              { number: '3', label: 'Heist Waves', icon: '⚡' },
              { number: '6hrs', label: 'Duration', icon: '⏰' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="bg-black/50 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-200"
              >
                <div 
                  className="orbitron text-3xl font-bold mb-2"
                  style={{color: 'var(--theme-primary)'}}
                >
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm mb-2">{stat.label}</div>
                <div className="text-2xl">{stat.icon}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Music Control */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setIsMusicPlaying(!isMusicPlaying)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl z-50 hover:scale-110 transition-transform duration-200"
        style={{backgroundColor: 'var(--theme-primary)'}}
      >
        {isMusicPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </motion.button>
    </section>
  );

  // Waves Section
  const WavesSection = () => (
    <section className="py-20 bg-black/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="orbitron text-5xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
            The Three Waves
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Each wave brings new challenges and a different perspective on the heist
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {Object.entries(themes).map(([key, theme], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`bg-black/50 backdrop-blur-lg border-2 rounded-2xl p-8 hover:scale-105 transition-all duration-300 ${
                currentTheme === key ? 'animate-glow' : ''
              }`}
              style={{
                borderColor: currentTheme === key ? theme.primary : 'rgba(255,255,255,0.1)'
              }}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{theme.emoji}</div>
                <h3 className="orbitron text-2xl font-bold mb-2" style={{color: theme.primary}}>
                  {theme.name}
                </h3>
                <p className="text-gray-400 italic">"{theme.description}"</p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">
                  {key === 'red' && "You're the crew—break into the mint! Focus on attack strategies with web exploitation, crypto challenges, and binary exploits."}
                  {key === 'blue' && "Cops are closing in—secure your stolen flags! Master forensics, OSINT, and defensive security techniques."}
                  {key === 'purple' && "Be the Professor—outwit both sides to win! Combine red and blue team skills in advanced collaborative challenges."}
                </p>

                <div className="space-y-2">
                  {[
                    key === 'red' ? ["Tokyo's SQL Injection", "Berlin's Encrypted Message", "Rio's Binary Exploit", "Smart Lock Hacking"] :
                    key === 'blue' ? ["Angel's Intel Leak Trace", "AI Security Defense", "Cloud Vault Patching", "Network Forensics"] :
                    ["Mobile App Security", "Network Pivoting", "Game System Rigging", "Advanced Persistence"]
                  ][0].map((challenge, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <img src={sideImg} alt="Dali Mask" className="w-4 h-4 rounded-full" />
                      {challenge}
                    </div>
                  ))}
                </div>

                <div className="text-sm font-medium" style={{color: theme.accent}}>
                  Difficulty: {key === 'red' ? 'Easy - Medium' : key === 'blue' ? 'Medium - Hard' : 'Hard - Insane'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  // Features Section
  const FeaturesSection = () => (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="orbitron text-5xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
            Heist Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the ultimate cybersecurity heist with cutting-edge features
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: '🎭',
              title: 'Dynamic Theming',
              description: 'Experience the heist through different perspectives as themes change with each wave'
            },
            {
              icon: '🎵',
              title: 'Bella Ciao Soundtrack',
              description: 'Immerse yourself with the iconic Money Heist soundtrack and wave-specific audio'
            },
            {
              icon: '💬',
              title: 'Team Communication',
              description: 'Coordinate with your crew through global and private team chat channels'
            },
            {
              icon: '📊',
              title: 'Real-time Leaderboard',
              description: 'Track your progress across all waves with live scoring and rankings'
            },
            {
              icon: '📱',
              title: 'Mobile Optimized',
              description: 'Participate in the heist from anywhere with full mobile compatibility'
            },
            {
              icon: '🏆',
              title: 'Wave-specific Prizes',
              description: 'Win exclusive rewards for each wave and overall competition performance'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-black/50 backdrop-blur-lg border border-white/10 rounded-xl p-8 text-center hover:border-white/20 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="orbitron text-xl font-bold mb-3" style={{color: 'var(--theme-primary)'}}>
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen theme-transition">
      <Navigation />
      <HeroSection />
      <WavesSection />
      <FeaturesSection />
    </div>
  );
};

export default App;

