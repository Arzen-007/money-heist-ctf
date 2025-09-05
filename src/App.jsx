import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Moon, Sun, Music, Volume2, VolumeX, Play, Pause, MessageCircle, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import { api } from './utils/api.js';

// Import assets
import backgroundImg from './assets/background.jpeg';
import sideImg from './assets/sideimg.jpeg';
import iconImg from './assets/icon.jpg';
import bellaCiaoAudio from './assets/bella-ciao-rise-of-legend-dance-house-version-background-vlog-music-186473.mp3';

const App = () => {
  const [currentTheme, setCurrentTheme] = useState('red');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Professor', message: 'Welcome to the heist, crew!', time: '10:30', color: '#dc2626' },
    { id: 2, user: 'Tokyo', message: 'Ready to break into the mint! 🔥', time: '10:31', color: '#f59e0b' },
    { id: 3, user: 'Berlin', message: 'Elegance is key to a perfect heist', time: '10:32', color: '#3b82f6' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const audioRef = useRef(null);

  // Theme configuration
  const themes = {
    red: {
      name: 'Red Wave',
      emoji: '🔴',
      description: 'Plan the Heist',
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#fca5a5',
      phase: 'Red Wave Active'
    },
    blue: {
      name: 'Blue Wave', 
      emoji: '🔵',
      description: 'Defend the Loot',
      primary: '#2563eb',
      secondary: '#1d4ed8',
      accent: '#93c5fd',
      phase: 'Blue Wave'
    },
    purple: {
      name: 'Purple Wave',
      emoji: '🟣', 
      description: 'Outsmart the Game',
      primary: '#7c3aed',
      secondary: '#6d28d9',
      accent: '#c4b5fd',
      phase: 'Purple Wave'
    }
  };

  // Apply theme to document
  useEffect(() => {
    document.body.className = `theme-${currentTheme} ${isDarkMode ? 'dark' : 'light'}`;
  }, [currentTheme, isDarkMode]);

  // Load session
  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setCurrentUser(me);
      } catch (_) {
        setCurrentUser(null);
      }
    })();
  }, []);

  // Fetch leaderboard data from backend
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const teams = await api.getScoreboardTeams({ limit: 50 });
        const mapped = teams.map((t) => ({
          rank: t.rank,
          team: t.name,
          country: t.country || '',
          flag: '',
          points: t.total_points,
          solved: t.solves,
          progress: Math.min(100, Math.round((t.total_points / 5000) * 100))
        }));
        setLeaderboardData(mapped);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboardData([]);
      }
    };
    fetchLeaderboard();
  }, []);

  // Music control
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleSignOut = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const form = new FormData(e.currentTarget);
    const username = form.get('username');
    const password = form.get('password');
    const email = form.get('email');
    try {
      if (authMode === 'login') {
        await api.login({ username, password });
      } else {
        await api.register({ username, email, password });
        await api.login({ username, password });
      }
      const me = await api.me();
      setCurrentUser(me);
      setAuthModalOpen(false);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Navigation component
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={iconImg} 
              alt="Dali Mask" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="orbitron text-xl font-bold" style={{color: 'var(--theme-primary)'}}>
              Money Heist CTF
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Waves', 'Leaderboard', 'Profile', 'Team', 'About'].map((item) => (
              <button
                key={item}
                onClick={() => setActiveSection(item.toLowerCase())}
                className={`relative font-medium transition-colors duration-200 ${
                  activeSection === item.toLowerCase() 
                    ? 'text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item}
                {activeSection === item.toLowerCase() && (
                  <span 
                    className="absolute -bottom-1 left-0 right-0 h-0.5"
                    style={{backgroundColor: 'var(--theme-primary)'}}
                  />
                )}
              </button>
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
            {currentUser ? (
              <>
                <span className="text-gray-300">Hi, {currentUser.username}</span>
                <button onClick={handleSignOut} className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-white/5 transition-colors duration-200">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-white/5 transition-colors duration-200">
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthMode('register'); setAuthModalOpen(true); }}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{backgroundColor: 'var(--theme-primary)'}}
                >
                  Join the Heist
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Auth Modal
  const AuthModal = () => (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-black/90 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white">{authMode === 'login' ? 'Sign In' : 'Create account'}</h3>
              <p className="text-gray-400 text-sm">Access the CTF platform</p>
            </div>
            {authError && <div className="mb-3 text-red-400 text-sm">{authError}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input name="username" required placeholder="Username" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
              {authMode === 'register' && (
                <input name="email" required placeholder="Email" type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
              )}
              <input name="password" required placeholder="Password" type="password" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <div className="flex items-center justify-between">
                <button disabled={authLoading} type="submit" className="px-4 py-2 rounded-lg font-medium" style={{backgroundColor: 'var(--theme-primary)', color: 'white'}}>
                  {authLoading ? 'Please wait…' : (authMode === 'login' ? 'Sign In' : 'Register')}
                </button>
                <button type="button" onClick={() => setAuthModalOpen(false)} className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg">Cancel</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    </section>
  );

  // Features Section
  const FeaturesSection = () => (
    <section className="py-20 bg-black/30">
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
              className="bg-black/50 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
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

  // Progress Section
  const ProgressSection = () => {
    const progressSteps = [
      { id: 'planning', title: 'Planning Phase', active: false },
      { id: 'red', title: themes.red.phase, active: currentTheme === 'red' },
      { id: 'blue', title: themes.blue.phase, active: currentTheme === 'blue' },
      { id: 'purple', title: themes.purple.phase, active: currentTheme === 'purple' },
      { id: 'complete', title: 'Heist Complete', active: false }
    ];

    return (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="orbitron text-5xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
              Heist Progress
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-8">
            {progressSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    step.active 
                      ? 'bg-current/20 border-current' 
                      : 'bg-black/50 border-white/10'
                  }`}
                  style={{
                    color: step.active ? 'var(--theme-primary)' : '#ffffff',
                    backgroundColor: step.active ? `var(--theme-primary)20` : 'rgba(0,0,0,0.5)'
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={iconImg} 
                      alt="Dali Mask" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="text-center">
                      <div className="orbitron font-bold text-lg">{step.title}</div>
                    </div>
                  </div>
                </motion.div>
                {index < progressSteps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-600"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Waves Page
  const WavesPage = () => (
    <section className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="orbitron text-6xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
            The Three Waves
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Each wave brings new challenges and a different perspective on the heist
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {Object.entries(themes).map(([key, theme], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`bg-black/50 backdrop-blur-lg border-2 rounded-2xl p-8 transition-all duration-300 ${
                currentTheme === key ? 'animate-glow' : ''
              }`}
              style={{
                borderColor: currentTheme === key ? theme.primary : 'rgba(255,255,255,0.1)'
              }}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                  style={{backgroundColor: theme.primary}}
                >
                  {theme.emoji}
                </div>
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

  // Footer
  const Footer = () => (
    <footer className="bg-black/80 border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="orbitron text-xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
              Money Heist CTF
            </h3>
            <p className="text-gray-400">
              The ultimate cybersecurity heist experience
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{color: 'var(--theme-primary)'}}>
              Quick Links
            </h4>
            <div className="space-y-2">
              {['Waves', 'Leaderboard', 'Chat'].map((link) => (
                <button
                  key={link}
                  onClick={() => setActiveSection(link.toLowerCase())}
                  className="block text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{color: 'var(--theme-primary)'}}>
              Support
            </h4>
            <div className="space-y-2">
              {['Help Center', 'Contact', 'Rules'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 flex items-center justify-center gap-2">
            © 2025 Money Heist CTF. All rights reserved.
            <img src={iconImg} alt="Dali Mask" className="w-4 h-4 rounded-full" />
          </p>
        </div>
      </div>
    </footer>
  );

  // Music Player Component
  const MusicPlayer = () => (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {showMusicPlayer && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-4 mb-4 w-64"
          >
            <div className="flex items-center gap-3">
              <img src={iconImg} alt="Album" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-white font-medium text-sm">Bella Ciao (Rise of Legend)</div>
                <div className="text-gray-400 text-xs">Money Heist Theme</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => {
          toggleMusic();
          setShowMusicPlayer(!showMusicPlayer);
        }}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform duration-200"
        style={{backgroundColor: 'var(--theme-primary)'}}
      >
        {isMusicPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </motion.button>
    </div>
  );

  // Leaderboard Page Component
  const LeaderboardPage = ({ leaderboardData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [waves, setWaves] = useState([]);
    const [selectedWave, setSelectedWave] = useState('');
    const [mode, setMode] = useState('overall'); // 'overall' | 'wave'
    const [waveData, setWaveData] = useState([]);

    useEffect(() => {
      const loadWaves = async () => {
        try {
          const stats = await api.getScoreboardStats();
          // fallback to distinct waves endpoint if needed later
          const wavesResp = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:8000/api') + '/scoreboard/waves');
          const wavesJson = await wavesResp.json();
          const waveKeys = Object.keys(wavesJson || {});
          setWaves(waveKeys);
          if (waveKeys.length > 0) setSelectedWave(waveKeys[0]);
        } catch (e) {
          console.error('Failed to load waves', e);
          setWaves([]);
        }
      };
      loadWaves();
    }, []);

    useEffect(() => {
      const loadWaveData = async () => {
        if (mode !== 'wave' || !selectedWave) { setWaveData([]); return; }
        try {
          const data = await api.getScoreboardTeams({ wave: selectedWave, limit: 50 });
          const mapped = data.map((t) => ({
            rank: t.rank,
            team: t.name,
            country: t.country || '',
            flag: '',
            points: t.total_points,
            solved: t.solves,
            progress: Math.min(100, Math.round((t.total_points / 5000) * 100))
          }));
          setWaveData(mapped);
        } catch (e) {
          console.error('Failed to load wave scoreboard', e);
          setWaveData([]);
        }
      };
      loadWaveData();
    }, [mode, selectedWave]);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'web', label: 'Web Security' },
      { value: 'crypto', label: 'Cryptography' },
      { value: 'forensics', label: 'Forensics' },
      { value: 'reverse', label: 'Reverse Engineering' },
      { value: 'pwn', label: 'Binary Exploitation' }
    ];

    const rows = mode === 'overall' ? leaderboardData : waveData;

    const filteredData = rows.filter(team => 
      team.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.country || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRankIcon = (rank) => {
      if (rank === 1) return "🥇";
      if (rank === 2) return "🥈";
      if (rank === 3) return "🥉";
      return rank;
    };

    const generateChartData = () => {
      const hours = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
      const chartData = hours.map((time, index) => {
        const dataPoint = { time };
        rows.slice(0, 6).forEach(team => {
          const teamKey = team.team.replace(/[^a-zA-Z0-9]/g, '');
          dataPoint[teamKey] = team.points - (Math.random() * 500) + (index * 50);
        });
        return dataPoint;
      });
      return chartData;
    };

    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-4xl">🏆</div>
              <h1 className="orbitron text-4xl md:text-5xl font-bold" style={{color: 'var(--theme-primary)'}}>
                Money Heist Scoreboard
              </h1>
            </div>
            <p className="text-gray-400 text-lg">Track the progress of all heist crews in real-time</p>
          </div>

          {/* Mode + Wave selectors */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('overall')}
                className={`px-4 py-2 rounded-lg font-medium ${mode==='overall' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={{backgroundColor: mode==='overall' ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)'}}
              >
                Overall
              </button>
              <button
                onClick={() => setMode('wave')}
                className={`px-4 py-2 rounded-lg font-medium ${mode==='wave' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={{backgroundColor: mode==='wave' ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)'}}
              >
                By Wave
              </button>
            </div>
            {mode==='wave' && (
              <select
                value={selectedWave}
                onChange={(e) => setSelectedWave(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/20"
              >
                {waves.map((w) => (
                  <option key={w} value={w} className="bg-black">{w}</option>
                ))}
              </select>
            )}
          </div>

          {/* Score Progression Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="text-xl">📈</div>
              <h3 className="text-xl font-bold text-white">Score Progression (Last 6 Hours)</h3>
            </div>
            <div className="h-64 bg-black/30 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  {rows.slice(0, 6).map((team, index) => (
                    <Line
                      key={team.team}
                      type="monotone"
                      dataKey={team.team.replace(/[^a-zA-Z0-9]/g, '')}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search teams or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-black">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 p-4 border-b border-white/10 font-semibold text-gray-300">
              <div>Rank</div>
              <div>Team</div>
              <div>Country</div>
              <div>Points</div>
              <div>Solved</div>
              <div>Progress</div>
            </div>

            {/* Table Rows */}
            {filteredData.map((team, index) => (
              <motion.div
                key={`${team.rank}-${team.team}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.01 * index }}
                className="grid grid-cols-6 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getRankIcon(team.rank)}</span>
                  <span className="font-bold">{team.rank}</span>
                </div>
                <div className="font-medium text-white">{team.team}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{team.flag}</span>
                  <span className="text-gray-300">{team.country}</span>
                </div>
                <div className="font-bold" style={{color: 'var(--theme-primary)'}}>
                  {team.points.toLocaleString()}
                </div>
                <div className="text-gray-300">{team.solved} challenges</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${team.progress}%`,
                        backgroundColor: 'var(--theme-primary)'
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-400">{team.progress}%</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Live Updates Indicator */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: 'var(--theme-primary)'}}></div>
              <span className="text-gray-400 text-sm">Live updates every 30 seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile Page Component
  const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // EDIT: Using real currentUser from API; keeping old mock commented for reference
    // const [userStats] = useState({
    //   totalPoints: 2850,
    //   challengesSolved: 15,
    //   currentStreak: 5,
    //   rank: 1,
    //   country: "ES",
    //   flag: "🇪🇸",
    //   joinDate: "1/15/2024",
    //   lastActive: "1 hour ago",
    //   email: "professor@heist.com"
    // });

    const userStats = {
      totalPoints: currentUser?.points ?? 0,
      challengesSolved: currentUser?.solves ?? 0,
      currentStreak: 0,
      rank: 0,
      country: currentUser?.country ?? '',
      flag: '',
      joinDate: currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '-',
      lastActive: currentUser?.last_active ? new Date(currentUser.last_active).toLocaleString() : '-',
      email: currentUser?.email ?? '-'
    };

    // const [skillProgress] = useState([
    //   { name: 'Web Security', level: 8, xp: 450, maxXp: 500, color: '#dc2626' },
    //   { name: 'Cryptography', level: 6, xp: 300, maxXp: 400, color: '#2563eb' },
    //   { name: 'Digital Forensics', level: 4, xp: 250, maxXp: 350, color: '#7c3aed' },
    //   { name: 'Reverse Engineering', level: 3, xp: 180, maxXp: 300, color: '#059669' },
    //   { name: 'Binary Exploitation', level: 2, xp: 120, maxXp: 250, color: '#dc2626' }
    // ]);

    const skillProgress = [
      { name: 'Overall XP', level: currentUser?.level ?? 1, xp: currentUser?.xp ?? 0, maxXp: ((currentUser?.level ?? 1) * 100), color: 'var(--theme-primary)' }
    ];

    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'categories', label: 'Categories', icon: '🎯' },
      { id: 'achievements', label: 'Achievements', icon: '🏆' },
      { id: 'activity', label: 'Activity', icon: '⚡' }
    ];

    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center text-3xl font-bold text-white">
                {currentUser?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="orbitron text-4xl md:text-5xl font-bold" style={{color: 'var(--theme-primary)'}}>
                  {currentUser?.username || 'Your Profile'}
                </h1>
                <p className="text-gray-400 text-lg">{currentUser?.country ? ` ${currentUser.country}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-3xl font-bold mb-2" style={{color: 'var(--theme-primary)'}}>
                {userStats.totalPoints.toLocaleString()}
              </div>
              <div className="text-gray-300 font-medium">Total Points</div>
              <div className="text-gray-500 text-sm mt-1">Level {currentUser?.level ?? 1}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="text-3xl mb-2">🔓</div>
              <div className="text-3xl font-bold mb-2" style={{color: 'var(--theme-primary)'}}>
                {userStats.challengesSolved}
              </div>
              <div className="text-gray-300 font-medium">Challenges Solved</div>
              <div className="text-gray-500 text-sm mt-1">XP: {currentUser?.xp ?? 0}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-3xl font-bold mb-2" style={{color: 'var(--theme-primary)'}}>
                {userStats.currentStreak}
              </div>
              <div className="text-gray-300 font-medium">Current Streak</div>
              <div className="text-gray-500 text-sm mt-1">Rank: {userStats.rank}</div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>👤</span>
                User Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Email:</span>
                  <span className="text-white">{userStats.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Country:</span>
                  <span className="text-white">{userStats.flag} {userStats.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Joined:</span>
                  <span className="text-white">{userStats.joinDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Last Active:</span>
                  <span className="text-white">{userStats.lastActive}</span>
                </div>
              </div>
            </motion.div>

            {/* Skill Progression */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📈</span>
                Skill Progression
              </h3>
              <div className="space-y-6">
                {skillProgress.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{skill.name}</span>
                      <span className="text-sm text-gray-400">Level {skill.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/50 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (skill.xp / skill.maxXp) * 100)}%`,
                            backgroundColor: skill.color
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-24">
                        {skill.xp}/{skill.maxXp} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  // Team Page Component
  const TeamPage = () => {
    const [hasTeam, setHasTeam] = useState(!!currentUser?.team_id);
    const [teamData, setTeamData] = useState(null);

    useEffect(() => {
      if (currentUser?.team_id) {
        (async () => {
          try {
            const t = await api.getTeam(currentUser.team_id);
            setTeamData(t);
            setHasTeam(true);
          } catch (e) {
            console.error('Failed to load team', e);
            setHasTeam(false);
          }
        })();
      } else {
        setHasTeam(false);
      }
    }, [currentUser?.team_id]);

    // EDIT: Commented mock team data
    // const [teamData] = useState({
    //   name: "The Professor's Crew",
    //   rank: 1,
    //   totalPoints: 8450,
    //   members: [
    //     { name: "The Professor", role: "Leader", points: 2850, country: "ES", flag: "🇪🇸", status: "online" },
    //     { name: "Tokyo", role: "Member", points: 2720, country: "JP", flag: "🇯🇵", status: "online" },
    //     { name: "Berlin", role: "Member", points: 2650, country: "DE", flag: "🇩🇪", status: "offline" },
    //     { name: "Nairobi", role: "Member", points: 230, country: "KE", flag: "🇰🇪", status: "online" }
    //   ]
    // });

    const teamStats = teamData ? [
      { label: "Team Rank", value: teamData.rank ? `#${teamData.rank}` : '-', icon: "🏆" },
      { label: "Total Points", value: (teamData.total_points ?? teamData.score_points ?? 0).toLocaleString(), icon: "🎯" },
      { label: "Members", value: (teamData.members_count ?? 0).toString(), icon: "👥" },
      { label: "Free Hints", value: (teamData.free_hints_left ?? 0).toString(), icon: "💡" }
    ] : [];

    if (!hasTeam) {
      return (
        <div className="min-h-screen pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-12">
              <div className="text-6xl mb-6">👥</div>
              <h1 className="orbitron text-4xl font-bold mb-4" style={{color: 'var(--theme-primary)'}}>
                Join a Team
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                Team up with other hackers to tackle challenges together and climb the leaderboard!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105"
                  style={{backgroundColor: 'var(--theme-primary)', color: 'white'}}
                >
                  Create Team
                </button>
                <button className="px-8 py-4 text-gray-300 border-2 border-gray-600 rounded-lg font-semibold text-lg hover:bg-white/5 transition-all duration-200">
                  Join Existing Team
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Team Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center text-3xl font-bold text-white">
                {teamData?.name?.charAt(0) || '?'}
              </div>
              <div>
                <h1 className="orbitron text-4xl md:text-5xl font-bold" style={{color: 'var(--theme-primary)'}}>
                  {teamData?.name || 'Team'}
                </h1>
                <p className="text-gray-400 text-lg">Team Rank #{teamData?.rank ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {teamStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold mb-2" style={{color: 'var(--theme-primary)'}}>
                  {stat.value}
                </div>
                <div className="text-gray-300 font-medium text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>👥</span>
                Team Members
              </h3>
            </div>
            <div className="space-y-4">
              {/* EDIT: Load members from API */}
              {/* We don't have members inside teamData; fetch via API */}
              <TeamMembers teamId={currentUser?.team_id} />
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // Chat System Component
  const ChatSystem = () => {
    const sendMessage = () => {
      if (newMessage.trim()) {
        const currentTime = new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        setChatMessages([...chatMessages, {
          id: chatMessages.length + 1,
          user: 'You',
          message: newMessage,
          time: currentTime,
          color: 'var(--theme-primary)'
        }]);
        setNewMessage('');
      }
    };

    return (
      <>
        {/* Chat Toggle Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl z-50 hover:scale-110 transition-transform duration-200"
          style={{backgroundColor: 'var(--theme-primary)'}}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>

        {/* Chat Window */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100, y: 100 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100, y: 100 }}
              className="fixed bottom-24 right-6 w-80 h-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: 'var(--theme-primary)'}}></div>
                  <span className="font-medium text-white">Crew Chat</span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{color: msg.color}}>
                        {msg.user}
                      </span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <div className="text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                  />
                  <button
                    onClick={sendMessage}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                    style={{backgroundColor: 'var(--theme-primary)'}}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  const TeamMembers = ({ teamId }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
      if (!teamId) return;
      (async () => {
        setLoading(true);
        setError('');
        try {
          const list = await api.getTeamMembers(teamId);
          setMembers(list);
        } catch (e) {
          setError('Failed to load team members');
        } finally {
          setLoading(false);
        }
      })();
    }, [teamId]);

    if (!teamId) return null;

    if (loading) {
      return <div className="text-gray-400">Loading members…</div>;
    }
    if (error) {
      return <div className="text-red-400">{error}</div>;
    }
    if (!members.length) {
      return <div className="text-gray-400">No members found.</div>;
    }

    return (
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center text-sm font-bold text-white">
                {m.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{m.username}</span>
                  {m.role === 'admin' && (
                    <span className="px-2 py-1 bg-yellow-600 text-black text-xs rounded-full font-bold">ADMIN</span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">{m.email}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{backgroundColor: '#000000'}}>
      <audio ref={audioRef} src={bellaCiaoAudio} loop />
      
      <Navigation />
      <AuthModal />
      
      {activeSection === 'home' && (
        <>
          <HeroSection />
          <FeaturesSection />
          <ProgressSection />
        </>
      )}
      
      {activeSection === 'waves' && <WavesPage />}
      
      {activeSection === 'leaderboard' && <LeaderboardPage leaderboardData={leaderboardData} />}
      
      {activeSection === 'profile' && <ProfilePage />}
      
      {activeSection === 'team' && <TeamPage />}
      
      {activeSection === 'about' && (
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <h1 className="orbitron text-4xl font-bold" style={{color: 'var(--theme-primary)'}}>
            About Coming Soon
          </h1>
        </div>
      )}
      
      <Footer />
      <MusicPlayer />
      <ChatSystem />
    </div>
  );
};

export default App;
