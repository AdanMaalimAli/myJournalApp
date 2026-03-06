// Home.jsx
import React, {useState, useEffect} from "react";
import { Twitter, Github, Linkedin, Instagram, Check } from "lucide-react";
import SignupModal from "../pages/SignupModal.jsx";
import LoginModal from "../pages/LoginModal.jsx";
import ForgotPasswordModal from "./ForgotPasswordModal.jsx";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


function Home() { 
    const [activeModal, setActiveModal] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/dashboard/performance");
        }
    }, [user, navigate]);

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen overflow-x-hidden selection:bg-pink-500 selection:text-white">

      {/* --- NAVBAR (FIXED & GLASS) --- */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <nav className="w-full max-w-7xl flex justify-between items-center border border-white/20 bg-white/90 backdrop-blur-xl shadow-lg shadow-purple-900/5 py-4 px-8 rounded-2xl transition-all">
            <div className="flex items-center gap-2">
                {/* Logo Icon */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg">mJ</div>
                <div className="text-2xl font-black tracking-tight text-slate-900">myJournal</div>
            </div>
            
            <ul className="hidden md:flex space-x-8 text-slate-600 font-semibold text-sm">
            <li><a href="#features" className="hover:text-purple-600 transition">Features</a></li>
            <li><a href="#how" className="hover:text-purple-600 transition">How It Works</a></li>
            <li><a href="#pricing" className="hover:text-purple-600 transition">Pricing</a></li>
            </ul>
            
            <div className="hidden md:flex gap-4">
            <button onClick={() => setActiveModal("login")} className="text-slate-700 font-bold hover:text-purple-600 px-4 py-2 transition">
                Login
            </button>
            <button  onClick={() => setActiveModal("signup")} className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/25">
                Sign Up
            </button>
            </div>
        </nav>
      </div>

       {/* --- HERO SECTION (Light & Clean) --- */}
       <section className="pt-40 pb-24 px-6 overflow-hidden relative bg-white">
        
        {/* Vibrant Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 -translate-x-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>

        <div className="container mx-auto flex flex-col lg:flex-row items-center gap-16">

          {/* LEFT: Content */}
          <div className="lg:w-1/2 flex flex-col gap-8 z-10 text-center lg:text-left">

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-purple-600 uppercase bg-purple-50 border border-purple-100 rounded-full mx-auto lg:mx-0">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                The #1 Journal for Traders
              </div>
              <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-[1.1] text-slate-900">
                Turn your trades <br/> into a 
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"> Predictable Income.</span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-500 max-w-lg leading-relaxed mx-auto lg:mx-0">
                Stop guessing. Connect your broker, track your psychology, and let our data engine find your edge.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button  onClick={() => setActiveModal("signup")} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                Start for Free
              </button>
              <button className="px-8 py-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-purple-200 transition">
                View Live Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                <div className="flex -space-x-3">
                    {[1,2,3,4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-900">2,000+ Traders</p>
                    <p className="text-slate-500 text-xs">use myJournal daily.</p>
                </div>
            </div>

          </div>

          {/* RIGHT: 3 Hanging Images (Clean & Sharp) */}
          <div className="lg:w-1/2 relative h-[500px] lg:h-[650px] w-full mt-10 lg:mt-0 flex items-center justify-center pointer-events-none px-4">
            
            {/* Back Card (Left) */}
            <div className="absolute bottom-12 left-0 lg:left-8 w-3/4 lg:w-2/3 transform -rotate-6 transition hover:scale-105 duration-500 z-10">
                <img 
                src="trade.png" 
                alt="Performance" 
                className="rounded-xl shadow-2xl border border-slate-200 bg-white"
                />
            </div>
            
            {/* Back Card (Right) */}
            <div className="absolute top-12 right-0 lg:right-8 w-3/4 lg:w-2/3 transform rotate-6 transition hover:scale-105 duration-500 z-0">
                <img 
                src="journal.png" 
                alt="Journal" 
                className="rounded-xl shadow-2xl border border-slate-200 bg-white"
                />
            </div>

            {/* Front Main Card */}
            <div className="relative w-full lg:w-5/6 transform transition hover:scale-105 duration-500 z-30">
                <img 
                src="calender.png" 
                alt="Dashboard" 
                className="rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-white bg-white"
                />
            </div>
          </div>

        </div>
      </section>



{/* --- FEATURES SECTION (Professional Glass Cards) --- */}
      <section id="features" className="py-32 px-6 bg-slate-950 relative overflow-hidden">
        
        {/* Deep Ambient Background Gradients */}
        <div className="absolute top-0 left-0 -translate-x-1/2 translate-y-[-10%] w-[800px] h-[800px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-[10%] w-[600px] h-[600px] rounded-full bg-indigo-700/20 blur-[100px] pointer-events-none"></div>
        
        {/* Subtle Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnIHZpZXdCb3g9JzAgMCA0IDQnPjxwYXRoIGZpbGw9JyM5OTknIGZpbGwtb3BhY2l0eT0nLjEnIGQ9J00xIDNoMXYxSDF6TTMgM2gxdjFIM3onLz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>

        <div className="container mx-auto relative z-10">
            
            {/* Section Header */}
            <div className="text-center mb-24 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight text-white">
                    Professional tools for <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Serious Traders.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
                    Forget cluttered spreadsheets. Upgrade to an operating system designed to highlight your edge and eliminate costly behavioral mistakes.
                </p>
            </div>
            
            {/* Glass Cards Grid Layout */}
            <div className="grid md:grid-cols-3 gap-8">
                
                {/* Card 1: Automated Import (Blue Theme) */}
                <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/30">
                    {/* Internal Glow */}
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl transition-all duration-500 group-hover:bg-blue-600/40 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 shadow-lg shadow-blue-900/30 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Instant Sync</h3>
                        <p className="text-slate-400 leading-relaxed">Connect MT4, MT5, or cTrader in seconds. Your history is imported automatically, error-free, and ready for analysis.</p>
                    </div>
                </div>

                {/* Card 2: Psychology (Pink/Magenta Theme) */}
                <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 hover:border-pink-500/30">
                    {/* Internal Glow */}
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-600/20 blur-3xl transition-all duration-500 group-hover:bg-pink-600/40 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 shadow-lg shadow-pink-900/30 group-hover:scale-110 transition-transform">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Psychology Engine</h3>
                        <p className="text-slate-400 leading-relaxed">Tag trades with emotions like "FOMO" or "Revenge." Our engine quantifies exactly how much your mindset costs you.</p>
                    </div>
                </div>

                {/* Card 3: Growth/Equity (Emerald/Green Theme) */}
                <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/30">
                    {/* Internal Glow */}
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-600/20 blur-3xl transition-all duration-500 group-hover:bg-emerald-600/40 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-900/30 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Deep Analytics</h3>
                        <p className="text-slate-400 leading-relaxed">Visualize your equity curve, analyze drawdown, and identify your most profitable sessions and assets instantly.</p>
                    </div>
                </div>

            </div>
        </div>
      </section>


      {/* --- HOW IT WORKS (Clean Light with Gradient) --- */}
      <section id="how" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                <div className="md:w-1/2">
                    <h2 className="text-4xl font-black mb-8 text-slate-900">How it works</h2>
                    <div className="space-y-8">
                        <div className="flex gap-6 group">
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-xl shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Account</h3>
                                <p className="text-slate-500">Securely link your broker or upload your history file.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 group">
                            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-xl shrink-0 group-hover:bg-pink-600 group-hover:text-white transition">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Journal Daily</h3>
                                <p className="text-slate-500">Add notes, screenshots, and emotions to every trade.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 group">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xl shrink-0 group-hover:bg-slate-900 group-hover:text-white transition">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Review & Scale</h3>
                                <p className="text-slate-500">Check your weekly report, cut mistakes, and increase size.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:w-1/2 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20 rounded-full"></div>
                    <img src="trading.webp" alt="How it works" className="relative rounded-2xl shadow-2xl border-4 border-white rotate-3 hover:rotate-0 transition duration-500"/>
                </div>
            </div>
        </div>
      </section>

      {/* --- PRICING (High Contrast) --- */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-slate-900">Pricing Plans</h2>
            <p className="text-slate-500">Fair pricing for serious traders.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Free Plan */}
          <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200 hover:border-purple-200 transition">
            <h3 className="text-xl font-bold mb-4 text-slate-500">Starter</h3>
             <div className="flex items-baseline mb-6">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="ml-2 text-slate-500">/month</span>
            </div>
            <p className="text-slate-500 mb-8 text-sm">Best for beginners.</p>
            <ul className="space-y-4 mb-10 text-slate-600 text-sm font-medium">
              <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">✓</div> Manual Entry</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">✓</div> Basic Analytics</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">✓</div> 1 Month History</li>
            </ul>
            <button onClick={() => setActiveModal("signup")} className="w-full py-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-white transition">Get Started</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 p-1 relative rounded-[2rem] shadow-2xl hover:shadow-purple-500/20 transition hover:-translate-y-1">
             <div className="bg-slate-900 p-9 rounded-[1.8rem] h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl">POPULAR</div>
                
                <h3 className="text-xl font-bold mb-4 text-white">Pro Trader</h3>
                <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-black text-white">$11</span>
                    <span className="ml-2 text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 mb-8 text-sm">For consistent profitability.</p>
                <ul className="space-y-4 mb-10 text-slate-300 text-sm font-medium">
                    <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-[10px] text-white">✓</div> <strong>Automated Sync</strong></li>
                    <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-[10px] text-white">✓</div> Unlimited History</li>
                    <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-[10px] text-white">✓</div> Advanced Metrics</li>
                    <li className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-[10px] text-white">✓</div> AI Insights</li>
                </ul>
                <button onClick={() => setActiveModal("signup")} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 font-bold text-white hover:opacity-90 transition">Upgrade Now</button>
             </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER (Dark & Minimal) --- */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="container mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-pink-500"></div>
                    <span className="text-xl font-bold text-white">myJournal</span>
                 </div>
                 <p className="text-sm max-w-xs">Built for traders who treat their trading like a business.</p>
            </div>
            
            <div className="flex gap-12 text-sm">
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-white">Product</h4>
                    <a href="#" className="hover:text-purple-400 transition">Features</a>
                    <a href="#" className="hover:text-purple-400 transition">Pricing</a>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-white">Company</h4>
                    <a href="#" className="hover:text-purple-400 transition">About</a>
                    <a href="#" className="hover:text-purple-400 transition">Blog</a>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-white">Legal</h4>
                    <a href="#" className="hover:text-purple-400 transition">Privacy</a>
                    <a href="#" className="hover:text-purple-400 transition">Terms</a>
                </div>
            </div>

            <div className="flex gap-4">
                <SocialIcon icon={<Twitter size={18}/>} />
                <SocialIcon icon={<Github size={18}/>} />
                <SocialIcon icon={<Linkedin size={18}/>} />
                <SocialIcon icon={<Instagram size={18}/>} />
            </div>
        </div>
        <div className="text-center text-xs text-slate-600 mt-16">
             © 2025 myJournal. All rights reserved.
        </div>
      </footer>


      {/* Modals */}
      {activeModal === "signup" && <SignupModal onClose={() => setActiveModal(null)} goToLogin={() => setActiveModal("login")} />}
      {activeModal === "login" && <LoginModal onClose={() => setActiveModal(null)} goToSignup={() => setActiveModal("signup")} goToForgot={() => setActiveModal("forgot")} />}
      {activeModal === "forgot" && <ForgotPasswordModal onClose={() => setActiveModal(null)} goToLogin={() => setActiveModal("login")} />}

    </div>
  );
}

// Small helper for cleaner code
function SocialIcon({icon}) {
    return (
        <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all border border-slate-800">
            {icon}
        </a>
    )
}

export default Home;