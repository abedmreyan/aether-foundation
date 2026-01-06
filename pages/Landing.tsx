
import React, { useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../App';
import { AppState } from '../types';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { 
  ArrowRight, Database, TrendingUp, Bot, 
  CheckCircle, X, FileSpreadsheet, Zap, MessageSquare, 
  Layout, ChevronDown, Phone, Users, Lock, Mail, User as UserIcon
} from 'lucide-react';

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ children, delay = '0ms', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    });
    const current = domRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
};

const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none group"
      >
        <span className="text-lg font-medium text-deepBlue group-hover:text-teal transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-teal transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void; initialMode?: 'login' | 'signup' }> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const { login, register } = useContext(GlobalContext);
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setIsSignUp(initialMode === 'signup');
        setError('');
        // Clear fields when opening or switching modes if desired, 
        // but keeping them allows switching tabs without losing data.
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (isSignUp) {
            if (!name || !email || !password) {
                setError("All fields are required");
                return;
            }
            const success = register ? await register(name, email, password) : false;
            if (!success) setError("Registration failed. Email might be taken.");
            else onClose();
        } else {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid credentials. Try test@aether.com / password');
            } else {
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-deepBlue/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in-up">
                <div className="bg-deepBlue p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-white/60 text-sm">{isSignUp ? 'Start your transformation today' : 'Log in to your Aether Dashboard'}</p>
                </div>
                
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setIsSignUp(false)} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${!isSignUp ? 'text-teal border-b-2 border-teal' : 'text-gray-400'}`}
                    >
                        Log In
                    </button>
                    <button 
                        onClick={() => setIsSignUp(true)} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${isSignUp ? 'text-teal border-b-2 border-teal' : 'text-gray-400'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-bold text-deepBlue mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-deepBlue mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input 
                                    type="email" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-deepBlue mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input 
                                    type="password" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button type="submit" className="w-full">{isSignUp ? 'Create Account' : 'Log In'}</Button>
                        </div>
                    </form>
                    {!isSignUp && (
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400">
                                For demo access use: <br/>
                                <span className="font-mono text-deepBlue">test@aether.com</span> / <span className="font-mono text-deepBlue">password</span>
                            </p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export const Landing: React.FC = () => {
  const { setView } = useContext(GlobalContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <LoginModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
      />

      {/* Sticky Header */}
      <header className="border-b border-lightGray/50 fixed w-full top-0 bg-white/90 backdrop-blur-md z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo className="scale-90 sm:scale-100" />
          <div className="flex gap-3 sm:gap-4">
            <Button variant="secondary" size="sm" className="hidden sm:block" onClick={() => handleOpenAuth('login')}>Log In</Button>
            <Button variant="primary" size="sm" onClick={() => handleOpenAuth('signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-deepBlue text-white pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {/* Animated background gradients */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal/20 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-vibrantOrange/10 rounded-full blur-[120px] animate-pulse-slow"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 text-center lg:text-left">
              <FadeInSection>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-teal font-semibold text-sm mb-6 border border-white/20">
                    <span className="w-2 h-2 bg-vibrantOrange rounded-full animate-pulse"></span>
                    New: Aether Support Widget Live
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
                  Stop Running on <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-limeGreen">Spreadsheets.</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                  Transform operational chaos into an automated, AI-driven growth engine. We structure your data, build custom pipelines, and deploy AI agents so you can scale without the burnout.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" onClick={() => handleOpenAuth('signup')} className="shadow-lg shadow-teal/20 hover:shadow-teal/40 transition-shadow">
                    Build My Foundation <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:border-white" onClick={() => handleOpenAuth('login')}>
                    Log In / Demo
                  </Button>
                </div>
                <p className="mt-6 text-sm text-gray-400 flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal" /> No credit card required
                    <span className="mx-2">•</span>
                    <CheckCircle className="w-4 h-4 text-teal" /> Free initial audit
                </p>
              </FadeInSection>
            </div>

            {/* Dynamic 3D Visualization */}
            <div className="lg:w-1/2 relative w-full h-[400px] lg:h-[500px] flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Floating Elements */}
                <div className="absolute top-0 left-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 animate-float shadow-xl z-20">
                    <div className="flex items-center gap-3 mb-2">
                        <FileSpreadsheet className="text-red-400 w-5 h-5" />
                        <span className="text-sm font-mono">leads_v4_final.csv</span>
                    </div>
                    <div className="w-32 h-2 bg-white/20 rounded mb-1"></div>
                    <div className="w-24 h-2 bg-white/20 rounded"></div>
                </div>

                <div className="absolute bottom-10 right-0 bg-white p-5 rounded-xl shadow-2xl animate-float-delayed z-30 border-l-4 border-teal">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal/10 p-2 rounded-lg">
                            <Bot className="text-teal w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-deepBlue font-bold text-sm">The Architect</p>
                            <p className="text-green-600 text-xs font-medium">Pipeline Optimized (+24%)</p>
                        </div>
                    </div>
                </div>

                {/* Central Graphic */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 bg-gradient-to-br from-deepBlue to-teal rounded-full opacity-20 blur-3xl animate-pulse"></div>
                    <Logo className="transform scale-150 text-white drop-shadow-2xl relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Curve Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
            </svg>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-gray-400 text-sm font-semibold tracking-widest uppercase mb-8">Trusted by modern teams</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Logo Placeholders using text for simplicity in this demo */}
                <span className="text-2xl font-bold text-deepBlue flex items-center gap-2"><Layout className="w-6 h-6" /> NEXUS</span>
                <span className="text-2xl font-bold text-deepBlue flex items-center gap-2"><Zap className="w-6 h-6" /> BoltShift</span>
                <span className="text-2xl font-bold text-deepBlue flex items-center gap-2"><Database className="w-6 h-6" /> DataCore</span>
                <span className="text-2xl font-bold text-deepBlue flex items-center gap-2"><TrendingUp className="w-6 h-6" /> GrowthX</span>
            </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInSection>
                <div className="text-center mb-16">
                    <h2 className="text-deepBlue text-3xl md:text-4xl font-bold mb-4">The Hidden Cost of Chaos</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">Your business is growing, but your operations are breaking. Spreadsheets are not a scalable foundation.</p>
                </div>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: FileSpreadsheet,
                        color: "text-red-500",
                        title: "Data Silos",
                        desc: "Customer data lives in one sheet, sales in another. No single source of truth means lost revenue."
                    },
                    {
                        icon: X,
                        color: "text-vibrantOrange",
                        title: "Manual Bottlenecks",
                        desc: "Your team wastes 10+ hours a week on data entry instead of high-value strategic work."
                    },
                    {
                        icon: Zap,
                        color: "text-yellow-500",
                        title: "Zero Automation",
                        desc: "Without structured data, you can't use AI. You're falling behind competitors who automate."
                    }
                ].map((item, idx) => (
                    <FadeInSection key={idx} delay={`${idx * 100}ms`}>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className={`w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-6 ${item.color}`}>
                                <item.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-deepBlue mb-3">{item.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="lg:w-1/2">
                    <FadeInSection>
                        <span className="text-teal font-bold uppercase tracking-wider text-sm">The Aether Method</span>
                        <h2 className="text-4xl font-bold text-deepBlue mt-2 mb-6">From Messy Middle to <br/>Market Leader.</h2>
                        <p className="text-lg text-gray-600 mb-8">We don't just give you software; we provide a guided transformation. Our AI Architect analyzes your unique business model to build a custom operating system.</p>
                        
                        <div className="space-y-8">
                            {[
                                { title: "The Scaffold", desc: "One-click ingestion turns CSVs into a structured SQL database." },
                                { title: "The Architect", desc: "AI analyzes your workflows to build custom pipelines." },
                                { title: "The Engine", desc: "Deploy AI agents to handle support and scheduling 24/7." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deepBlue text-white flex items-center justify-center font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-deepBlue">{step.title}</h4>
                                        <p className="text-gray-600">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10">
                            <Button onClick={() => handleOpenAuth('signup')}>Start Transformation</Button>
                        </div>
                    </FadeInSection>
                </div>
                <div className="lg:w-1/2">
                    <FadeInSection delay="200ms">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal blur-[100px] opacity-20 rounded-full"></div>
                            <img 
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                                alt="Dashboard Preview" 
                                className="relative rounded-2xl shadow-2xl border-4 border-white z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500"
                            />
                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl z-20 flex items-center gap-3 animate-float">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Efficiency</p>
                                    <p className="text-xl font-bold text-deepBlue">+142%</p>
                                </div>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </div>
      </section>

      {/* Product Spotlight: Aether Support */}
      <section className="py-24 bg-deepBlue text-white relative overflow-hidden">
         <div className="absolute right-0 top-0 h-full w-1/2 bg-teal/10 skew-x-12"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Introducing Aether Support</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">A powerful communication widget that integrates into any website or app. Let AI handle your frontline support.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <FadeInSection className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <MessageSquare className="w-10 h-10 text-teal mb-6" />
                    <h3 className="text-xl font-bold mb-3">AI Chat Agents</h3>
                    <p className="text-gray-300">Intelligent agents that answer FAQs, schedule appointments, and escalate complex issues to humans.</p>
                </FadeInSection>
                <FadeInSection delay="100ms" className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <Phone className="w-10 h-10 text-vibrantOrange mb-6" />
                    <h3 className="text-xl font-bold mb-3">VoIP Integration</h3>
                    <p className="text-gray-300">Make and receive calls directly through the widget. Seamlessly switch between chat and voice.</p>
                </FadeInSection>
                <FadeInSection delay="200ms" className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <Users className="w-10 h-10 text-limeGreen mb-6" />
                    <h3 className="text-xl font-bold mb-3">Unified Inbox</h3>
                    <p className="text-gray-300">Manage all customer interactions from one central dashboard. Never miss a lead again.</p>
                </FadeInSection>
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-deepBlue">Frequently Asked Questions</h2>
            </div>
            <FadeInSection>
                <div className="space-y-2">
                    <FAQItem 
                        question="How is Aether different from a standard CRM?" 
                        answer="Standard CRMs like Salesforce require complex setup and manual data entry. Aether is a 'Guided Transformation' platform. We ingest your existing chaotic files and use AI to build the CRM structure for you, saving months of implementation time."
                    />
                    <FAQItem 
                        question="Do I need technical skills to use Aether?" 
                        answer="Not at all. Our 'One-Click Uploader' and AI Consultant handle the technical lifting. If you can use a spreadsheet, you can use Aether."
                    />
                    <FAQItem 
                        question="Is my data secure?" 
                        answer="Yes. We use enterprise-grade encryption for all data at rest and in transit. Your proprietary business data is never shared with other users."
                    />
                    <FAQItem 
                        question="Can I export my data later?" 
                        answer="Absolutely. We believe in data freedom. You can export your cleaned, structured data back to CSV or SQL formats at any time."
                    />
                </div>
            </FadeInSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-teal to-deepBlue text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Build Your Foundation?</h2>
            <p className="text-xl text-white/90 mb-10">Join 500+ businesses transforming chaos into structure today.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" variant="secondary" className="text-deepBlue font-bold" onClick={() => handleOpenAuth('signup')}>
                    Get Started for Free
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => handleOpenAuth('login')}>
                    Log In / Demo
                </Button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-darkGray text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <Logo className="text-white mb-4" />
                    <p className="max-w-sm">Architects of order. Partners in transformation. We help SMBs build the foundation for scalable growth.</p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Platform</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-teal transition-colors">The Scaffold</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">The Architect</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">Aether Support</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">Pricing</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Company</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-teal transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-teal transition-colors">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm">© 2025 Aether: Foundation. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Terms of Service</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
