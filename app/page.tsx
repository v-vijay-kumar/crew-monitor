'use client';

import React, { useState, useEffect } from 'react';
import { db, CrewSession } from '@/lib/db';
import { Clock, Play, Square, Train, MapPin, User, History, Shield, Users, Lock, Key, CheckCircle, Fingerprint, Activity, Power } from 'lucide-react';

export default function Home() {
  const [role, setRole] = useState<'crew' | 'admin'>('crew');
  
  // Security States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);

  const ADMIN_PASSWORD = "CTLC@1234"; 

  // Form Fields
  const [crewId, setCrewId] = useState('');
  const [crewName, setCrewName] = useState('');
  const [locoNumber, setLocoNumber] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [startingStation, setStartingStation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [customSignOnTime, setCustomSignOnTime] = useState('');
  
  const [lastRegisteredSession, setLastRegisteredSession] = useState<CrewSession | null>(null);
  
  // Admin Lists
  const [allActiveSessions, setAllActiveSessions] = useState<CrewSession[]>([]);
  const [pastSessions, setPastSessions] = useState<CrewSession[]>([]);

  const getLocal24HourISOString = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const now = new Date();
    setCustomSignOnTime(getLocal24HourISOString(now));
    refreshAdminData();
  }, []);

  const refreshAdminData = async () => {
    const active = await db.sessions.where('status').equals('Active').toArray();
    const completed = await db.sessions.where('status').equals('Completed').reverse().sortBy('signOnTime');
    setAllActiveSessions(active);
    setPastSessions(completed);
  };

  const handleSignOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewId || !crewName || !locoNumber || !trainNumber || !startingStation || !currentLocation || !customSignOnTime) return;

    const chosenTime = new Date(customSignOnTime).toISOString();

    const newRecord: CrewSession = {
      crewId: crewId.trim().toUpperCase(),
      crewName: crewName.trim(),
      locoNumber: locoNumber.trim(),
      trainNumber: trainNumber.trim(),
      location: `${startingStation.toUpperCase()} → ${currentLocation.toUpperCase()}`,
      signOnTime: chosenTime,
      status: 'Active',
    };

    const insertedId = await db.sessions.add(newRecord);
    setLastRegisteredSession({ ...newRecord, id: insertedId });

    // Reset Form Fields
    setCrewId('');
    setCrewName('');
    setLocoNumber('');
    setTrainNumber('');
    setStartingStation('');
    setCurrentLocation('');
    setCustomSignOnTime(getLocal24HourISOString(new Date()));
    refreshAdminData();
  };

  const handleSignOff = async (id: number) => {
    await db.sessions.update(id, {
      signOffTime: new Date().toISOString(),
      status: 'Completed',
    });
    if (lastRegisteredSession && lastRegisteredSession.id === id) {
      setLastRegisteredSession(null);
    }
    refreshAdminData();
  };

  const handleAdminTabClick = () => {
    if (isAdminAuthenticated) {
      setRole('admin');
    } else {
      setShowPasswordGate(true);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAuthError(false);
      setShowPasswordGate(false);
      setRole('admin');
      setPasswordInput('');
      refreshAdminData();
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setRole('crew');
  };

  const formatFullDate24Hour = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} | ${hours}:${minutes} HRS`;
  };

  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const diffMs = endTime - startTime;
    if (diffMs < 0) return "00h 00m";
    const diffMins = Math.floor(diffMs / 60000);
    const hours = String(Math.floor(diffMins / 60)).padStart(2, '0');
    const mins = String(diffMins % 60).padStart(2, '0');
    return `${hours}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131c31] via-[#0b0f19] to-[#070a10] text-slate-100 p-6 font-sans relative overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* Visual Background Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d10_1px,transparent_1px),linear-gradient(to_bottom,#1f293d10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Top Operational Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/60 pb-6 gap-4 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600/20 to-cyan-500/10 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Clock className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Crew Monitor Terminal
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">SECR Raipur Division Console</p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex bg-[#111827]/80 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-inner w-fit self-start md:self-auto">
            <button 
              onClick={() => setRole('crew')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-300 ${role === 'crew' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] border-t border-emerald-400/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5" /> Crew View
            </button>
            <button 
              onClick={handleAdminTabClick} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-300 ${role === 'admin' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)] border-t border-blue-400/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Shield className="w-3.5 h-3.5" /> Control Desk
            </button>
          </div>
        </header>

        {/* --- SECURITY PASSWORD GATE OVERLAY MODAL --- */}
        {showPasswordGate && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-[#121824]/90 border border-slate-700/60 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-5 backdrop-blur-xl relative">
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 shadow-inner">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-200">Terminal Authentication</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Master layout roster data access is restricted to authorized console desks.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm text-slate-200 tracking-widest focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:tracking-normal placeholder:text-slate-600" placeholder="Enter Secure Token Key" autoFocus required />
                </div>
                {authError && <p className="text-xs text-rose-400 text-center font-semibold bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">❌ Invalid Security Passphrase</p>}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button type="button" onClick={() => setShowPasswordGate(false)} className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 transition text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition duration-200">Verify</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW: CREW INTERFACE --- */}
        {role === 'crew' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            
            {/* Elegant Registration Card */}
            <div className="lg:col-span-5 bg-[#111622]/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-black/40 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/40 via-teal-500/20 to-transparent" />
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5 text-slate-200">
                <Activity className="w-4 h-4 text-emerald-400" /> Sign-On Form
              </h2>
              
              <form onSubmit={handleSignOn} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Crew ID</label>
                    <div className="relative group/input">
                      <Fingerprint className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within/input:text-emerald-400 transition" />
                      <input type="text" value={crewId} onChange={e => setCrewId(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 text-sm text-slate-200 placeholder:text-slate-600 transition font-medium" placeholder="e.g. SECR994" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Crew Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={crewName} onChange={e => setCrewName(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 text-sm text-slate-200 placeholder:text-slate-600 transition font-medium" placeholder="Enter full name" required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Loco Number</label>
                    <div className="relative">
                      <Train className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={locoNumber} onChange={e => setLocoNumber(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 placeholder:text-slate-600 font-mono" placeholder="31045" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Train Number</label>
                    <input type="text" value={trainNumber} onChange={e => setTrainNumber(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 placeholder:text-slate-600 font-mono" placeholder="12834" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Starting Stn</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={startingStation} onChange={e => setStartingStation(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 placeholder:text-slate-600 font-semibold" placeholder="R" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Current Loc</label>
                    <input type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 placeholder:text-slate-600 font-semibold" placeholder="BSP" required />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Sign-On Time (24h Clock)</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="datetime-local" value={customSignOnTime} onChange={e => setCustomSignOnTime(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-mono color-scheme-dark" required />
                  </div>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 mt-2 border-t border-emerald-400/20 active:scale-[0.99]">
                  Register Session
                </button>
              </form>
            </div>

            {/* Premium Confirmation Receipt Panel */}
            <div className="lg:col-span-7 bg-[#111622]/40 border border-slate-800/60 rounded-2xl p-6 shadow-2xl shadow-black/30 backdrop-blur-md flex flex-col justify-between min-h-[450px]">
              <div>
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Registered Active Crew 
                </h2>
                
                {!lastRegisteredSession ? (
                  <div className="h-[320px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-[#0a0e17]/30">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800/80 mb-4 text-slate-600 shadow-inner">
                      <Train className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">No data initialized for this session. Complete the registration form to verify parameters.</p>
                  </div>
                ) : (
                  <div className="bg-[#0a0d14]/80 border border-slate-800 rounded-xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 tracking-wider uppercase mb-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live Terminal Logged
                        </span>
                        <h3 className="font-extrabold text-slate-100 text-xl tracking-tight">{lastRegisteredSession.crewName}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Crew Token</span>
                        <span className="font-mono font-black text-slate-200 text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg shadow-inner">{lastRegisteredSession.crewId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#111622]/40 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Loco & Train Assignment</p>
                        <p className="font-mono text-sm text-slate-200 font-bold flex items-center gap-2">
                          <span className="text-emerald-400">🚂</span> L-{lastRegisteredSession.locoNumber} <span className="text-slate-600">|</span> T-{lastRegisteredSession.trainNumber}
                        </p>
                      </div>
                      <div className="bg-[#111622]/40 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Sector Path Profile</p>
                        <p className="text-sm text-slate-200 font-bold font-sans flex items-center gap-2">
                          <span className="text-cyan-400">📍</span> {lastRegisteredSession.location}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-[#111622]/40 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Sign-On Clock (24h)</p>
                        <p className="font-mono text-sm text-emerald-400 font-black flex items-center gap-2">
                          <span className="text-slate-500">🕒</span> {formatFullDate24Hour(lastRegisteredSession.signOnTime)}
                        </p>
                      </div>
                      <div className="bg-[#111622]/40 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Duty Time Counter</p>
                        <p className="font-mono text-sm text-amber-400 font-black flex items-center gap-2">
                          <span className="text-slate-500">⏳</span> {calculateDuration(lastRegisteredSession.signOnTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {lastRegisteredSession && (
                <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 text-center text-xs text-slate-400 font-medium leading-relaxed shadow-inner">
                  ⚠️ Complete listing feeds are fully protected. For modifications or shift cancel updates, contact your regional section console supervisor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: ADMIN DASHBOARD MASTER TERMINAL --- */}
        {role === 'admin' && isAdminAuthenticated && (
          <div className="bg-[#111622]/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/40 via-indigo-500/20 to-transparent" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
              <div>
                <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2.5 tracking-tight">
                  <Shield className="w-5 h-5 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" /> Crew Management Terminal
                </h2>
                <p className="text-xs text-slate-400 mt-1">Authorized View: Operational Division Live Tracking Board</p>
              </div>
              <button onClick={handleAdminLogout} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition duration-200 shadow-md flex items-center gap-2">
                <Power className="w-3.5 h-3.5 text-rose-500" /> Lock Desk
              </button>
            </div>

            {/* Responsive Table Control Grid */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0a0d14]/60 shadow-inner">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase font-black tracking-widest bg-[#0d121c] text-slate-400 border-b border-slate-800">
                    <th className="py-4 px-5">Token</th>
                    <th className="py-4 px-5">Personnel Name</th>
                    <th className="py-4 px-5">Loco / Train</th>
                    <th className="py-4 px-5">Route Profile</th>
                    <th className="py-4 px-5">Sign-On (24h)</th>
                    <th className="py-4 px-5 text-center">Duty Status</th>
                    <th className="py-4 px-5 text-right">Elapsed Time</th>
                    <th className="py-4 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-[#0a0d14]/20">
                  {allActiveSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-medium uppercase tracking-wider">No active crew operations currently initialized.</td>
                    </tr>
                  ) : (
                    allActiveSessions.map((session) => {
                      const minutesRunning = Math.floor((new Date().getTime() - new Date(session.signOnTime).getTime()) / 60000);
                      const needsRelief = minutesRunning >= 480; 

                      return (
                        <tr key={session.id} className="hover:bg-[#121926]/40 transition duration-150 group">
                          <td className="py-4 px-5 font-mono text-xs font-black text-blue-400 group-hover:text-blue-300">{session.crewId}</td>
                          <td className="py-4 px-5 font-bold text-slate-200">{session.crewName}</td>
                          <td className="py-4 px-5 font-mono text-xs text-slate-400">
                            <span className="text-slate-500 font-sans">L-</span>{session.locoNumber} <span className="text-slate-700">/</span> <span className="text-slate-500 font-sans">T-</span>{session.trainNumber}
                          </td>
                          <td className="py-4 px-5 text-xs font-medium text-slate-300">{session.location}</td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-400">{formatFullDate24Hour(session.signOnTime)}</td>
                          <td className="py-4 px-5 text-center">
                            {needsRelief ? (
                              <span className="inline-block text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded font-black tracking-widest uppercase animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.15)]">CRITICAL RELIEF</span>
                            ) : (
                              <span className="inline-block text-[9px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold tracking-widest uppercase">NORMAL</span>
                            )}
                          </td>
                          <td className={`py-4 px-5 text-right font-black font-mono text-sm ${needsRelief ? 'text-rose-400 drop-shadow-[0_0_2px_rgba(244,63,94,0.3)]' : 'text-emerald-400'}`}>
                            {calculateDuration(session.signOnTime)}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <button onClick={() => handleSignOff(session.id!)} className="inline-flex mx-auto items-center gap-1.5 bg-rose-950/30 hover:bg-rose-600 border border-rose-800/40 hover:border-rose-500 text-rose-400 hover:text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200 shadow-md">
                              <Square className="w-2.5 h-2.5 fill-current" /> Sign-Off
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Historic Summary Tray */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <History className="w-4 h-4 text-slate-500" /> Completed Duty Registry ({pastSessions.length} Profiles Archive)
              </span>
              {pastSessions.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-[#0a0d14]/40 text-xs divide-y divide-slate-850 shadow-inner">
                  {pastSessions.map(ps => (
                    <div key={ps.id} className="p-3.5 flex justify-between items-center text-slate-400 hover:bg-[#0d121c]/60 transition">
                      <div className="font-medium">
                        <span className="font-bold text-blue-400 font-mono tracking-wide">{ps.crewId}</span> 
                        <span className="text-slate-600 mx-2">|</span> 
                        <span className="text-slate-300 font-bold">{ps.crewName}</span> 
                        <span className="text-slate-600 mx-2">—</span> 
                        <span className="font-mono text-slate-500">Loco {ps.locoNumber}</span>
                      </div>
                      <div className="font-mono text-right text-slate-500">
                        Operational Run: <span className="text-emerald-400 font-bold">{calculateDuration(ps.signOnTime, ps.signOffTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}