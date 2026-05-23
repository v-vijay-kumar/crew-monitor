'use client';

import React, { useState, useEffect } from 'react';
import { supabase, CrewSession } from '@/lib/supabase';
import { Clock, Play, Square, Train, MapPin, User, History, Shield, Users, Lock, Key, CheckCircle, Fingerprint, Activity, Power, AlertTriangle, ShieldCheck, PhoneCall, CalendarCheck } from 'lucide-react';

export default function Home() {
  const [role, setRole] = useState<'crew' | 'admin'>('crew');
  
  // Security & Operational States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(true);

  const ADMIN_PASSWORD = "zxc1234"; 

  // Form Fields
  const [crewId, setCrewId] = useState('');
  const [crewName, setCrewName] = useState('');
  const [locoNumber, setLocoNumber] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [startingStation, setStartingStation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [customSignOnTime, setCustomSignOnTime] = useState('');
  
  // Relief Planning Intermediate States
  const [planningSessionId, setPlanningSessionId] = useState<number | null>(null);
  const [reliefStationInput, setReliefStationInput] = useState('');
  const [reliefCrewInput, setReliefCrewInput] = useState('');

  const [lastRegisteredSession, setLastRegisteredSession] = useState<CrewSession | null>(null);
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
    if (sessionStorage.getItem('secr_integrity_acknowledged') === 'true') {
      setShowIntegrityModal(false);
    }
  }, []);

  // READ Operation: Fetches datasets live from the PostgreSQL Cloud instance
  const refreshAdminData = async () => {
    const { data: activeData } = await supabase
      .from('crew_sessions')
      .select('*')
      .eq('status', 'Active');

    const { data: completedData } = await supabase
      .from('crew_sessions')
      .select('*')
      .eq('status', 'Completed')
      .order('sign_on_time', { ascending: false });

    if (activeData) setAllActiveSessions(activeData as CrewSession[]);
    if (completedData) setPastSessions(completedData as CrewSession[]);
  };

  const handleIntegrityAcknowledge = () => {
    sessionStorage.setItem('secr_integrity_acknowledged', 'true');
    setShowIntegrityModal(false);
  };

  // CREATE Operation: Inserts a clean, structured row inside PostgreSQL
  const handleSignOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewId || !crewName || !locoNumber || !trainNumber || !startingStation || !currentLocation || !customSignOnTime) return;

    const chosenTime = new Date(customSignOnTime).toISOString();

    const newRecord = {
      crew_id: crewId.trim().toUpperCase(),
      crew_name: crewName.trim(),
      loco_number: locoNumber.trim(),
      train_number: trainNumber.trim(),
      location: `${startingStation.toUpperCase()} → ${currentLocation.toUpperCase()}`,
      sign_on_time: chosenTime,
      status: 'Active',
      dy_chc_informed: false,
      planned_relief_station: '',
      assigned_relief_crew_id: ''
    };

    const { data, error } = await supabase
      .from('crew_sessions')
      .insert([newRecord])
      .select();

    if (error) {
      console.error("PostgreSQL Insert Error:", error.message);
      return;
    }

    if (data && data[0]) {
      setLastRegisteredSession(data[0] as CrewSession);
    }

    setCrewId(''); setCrewName(''); setLocoNumber(''); setTrainNumber(''); setStartingStation(''); setCurrentLocation('');
    setCustomSignOnTime(getLocal24HourISOString(new Date()));
    refreshAdminData();
  };

  // UPDATE Operation: Updates row properties inside PostgreSQL to finalize shifts
  const handleSignOff = async (id: number) => {
    await supabase
      .from('crew_sessions')
      .update({ 
        sign_off_time: new Date().toISOString(), 
        status: 'Completed' 
      })
      .eq('id', id);

    if (lastRegisteredSession && lastRegisteredSession.id === id) {
      setLastRegisteredSession(null);
    }
    refreshAdminData();
  };

  // UPDATE Operation: Toggles communication logs inside PostgreSQL
  const toggleDyChcInfo = async (id: number, currentStatus: boolean) => {
    await supabase
      .from('crew_sessions')
      .update({ dy_chc_informed: !currentStatus })
      .eq('id', id);
      
    refreshAdminData();
  };

  // UPDATE Operation: Saves systematic planner configurations inside PostgreSQL
  const saveReliefPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planningSessionId === null) return;

    await supabase
      .from('crew_sessions')
      .update({
        planned_relief_station: reliefStationInput.trim().toUpperCase(),
        assigned_relief_crew_id: reliefCrewInput.trim().toUpperCase()
      })
      .eq('id', planningSessionId);

    setPlanningSessionId(null);
    setReliefStationInput('');
    setReliefCrewInput('');
    refreshAdminData();
  };

  const handleAdminTabClick = () => {
    if (isAdminAuthenticated) { setRole('admin'); } else { setShowPasswordGate(true); }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setRole('crew');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true); setAuthError(false); setShowPasswordGate(false); setRole('admin'); setPasswordInput(''); refreshAdminData();
    } else { setAuthError(true); setPasswordInput(''); }
  };

  const formatFullDate24Hour = (isoString: string) => {
    const date = new Date(isoString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} | ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} HRS`;
  };

  const calculateDuration = (start: string, end?: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const diffMs = endTime - startTime;
    if (diffMs < 0) return "00h 00m";
    const diffMins = Math.floor(diffMs / 60000);
    return `${String(Math.floor(diffMins / 60)).padStart(2, '0')}h ${String(diffMins % 60).padStart(2, '0')}m`;
  };

  return (
    <main className="min-h-screen bg-[#070a13] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#070a13] to-[#03050a] text-slate-100 p-4 md:p-6 font-sans relative flex flex-col justify-between selection:bg-emerald-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3341550a_1px,transparent_1px),linear-gradient(to_bottom,#3341550a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto space-y-6 flex-grow">
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-5 gap-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 shadow-inner"><Clock className="w-7 h-7 text-emerald-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-slate-100">Crew Hours Audit Desk</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">South East Central Railway Terminal [PostgreSQL Mode]</p>
              </div>
            </div>
          </div>

          <div className="flex bg-[#0d1220] p-1 rounded-xl border border-slate-800 shadow-inner w-fit">
            <button onClick={() => setRole('crew')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${role === 'crew' ? 'bg-slate-800 text-emerald-400 border border-slate-700/60' : 'text-slate-400 hover:text-slate-200'}`}>
              <Users className="w-3.5 h-3.5" /> Crew Entry View
            </button>
            <button onClick={handleAdminTabClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${role === 'admin' ? 'bg-slate-800 text-blue-400 border border-slate-700/60' : 'text-slate-400 hover:text-slate-200'}`}>
              <Shield className="w-3.5 h-3.5" /> Roster Management
            </button>
          </div>
        </header>

        {/* --- SYSTEM POLICY INTEGRITY POPUP MODAL --- */}
        {showIntegrityModal && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f1422] border-2 border-amber-500/20 rounded-2xl p-6 max-w-md w-full space-y-5 relative">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-200">System Integrity Warning</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Compliance Checklist</p>
                </div>
              </div>
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>This monitoring terminal tracks active running metrics. You are explicitly required to input true and precise operational data parameters.</p>
                <blockquote className="border-l-2 border-rose-500/40 bg-rose-500/5 p-3 rounded-r-lg text-rose-300 font-semibold text-[11px]">
                  ⚠️ Warning: Misleading this monitoring panel by submitting false statements, incorrect locomotive codes, or manipulated timestamps constitutes a serious operational violation.
                </blockquote>
              </div>
              <button onClick={handleIntegrityAcknowledge} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg">I Acknowledge & Confirm</button>
            </div>
          </div>
        )}

        {/* --- DESK SECURITY ACCESS PROTECTION MODAL --- */}
        {showPasswordGate && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0e121f] border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
              <div className="flex flex-col items-center text-center space-y-1.5">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400"><Lock className="w-5 h-5" /></div>
                <h3 className="text-lg font-bold tracking-tight text-slate-200">Terminal Authentication</h3>
                <p className="text-xs text-slate-400">Roster records locked behind controller access token desk.</p>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-[#060810] border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm text-slate-200 tracking-widest" placeholder="Enter Password" autoFocus required />
                </div>
                {authError && <p className="text-xs text-rose-400 text-center font-bold bg-rose-500/10 py-1.5 rounded border border-rose-500/20">❌ Authorization Failed</p>}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setShowPasswordGate(false)} className="bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs py-2.5 px-4 rounded-xl">Verify</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW 1: CREW WORKSPACE INTERFACE --- */}
        {role === 'crew' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-5 bg-[#0b0e17] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/30 to-transparent" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Duty Registration Panel</h2>
              <form onSubmit={handleSignOn} className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Crew Token ID</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={crewId} onChange={e => setCrewId(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-semibold" placeholder="SECR994" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Crew Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={crewName} onChange={e => setCrewName(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200" placeholder="Enter Full Name" required />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Loco No.</label>
                    <div className="relative">
                      <Train className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={locoNumber} onChange={e => setLocoNumber(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-mono" placeholder="31045" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Train Number</label>
                    <input type="text" value={trainNumber} onChange={e => setTrainNumber(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-mono" placeholder="12834" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Starting Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" value={startingStation} onChange={e => setStartingStation(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-bold" placeholder="R" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Current Sector</label>
                    <input type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-bold" placeholder="BSP" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Sign-On Time (24h Standard)</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="datetime-local" value={customSignOnTime} onChange={e => setCustomSignOnTime(e.target.value)} className="w-full bg-[#05070c] border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm text-slate-200 font-mono color-scheme-dark" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition duration-150">Submit Registration</button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-[#0b0e17]/50 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[440px]">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Terminal Transmission Data</h2>
                {!lastRegisteredSession ? (
                  <div className="h-[300px] border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-[#05070c]/20">
                    <div className="w-10 h-10 rounded-xl bg-[#060912] border border-slate-850 text-slate-600 mb-3"><ShieldCheck className="w-4 h-4" /></div>
                    <p className="text-xs font-semibold text-slate-500 max-w-xs leading-relaxed uppercase tracking-wider">Awaiting dynamic PostgreSQL sync logs.</p>
                  </div>
                ) : (
                  <div className="bg-[#05070c] border border-slate-850 rounded-xl p-5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                      <div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase block w-fit mb-1">TRANSMITTED TO CLOUD SQL</span>
                        <h3 className="font-extrabold text-slate-200 text-lg tracking-tight">{lastRegisteredSession.crew_name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Roster Ref</span>
                        <span className="font-mono font-bold text-slate-300 text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">{lastRegisteredSession.crew_id}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 text-xs font-medium">
                      <div className="bg-[#0b0e17]/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Locomotive Module</span>
                        <span className="font-mono font-bold text-slate-200">L-{lastRegisteredSession.loco_number} / T-{lastRegisteredSession.train_number}</span>
                      </div>
                      <div className="bg-[#0b0e17]/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Operational Run Path</span>
                        <span className="font-sans font-bold text-slate-200">{lastRegisteredSession.location}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 text-xs font-medium">
                      <div className="bg-[#0b0e17]/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Sign-On (24h clock)</span>
                        <span className="font-mono font-bold text-emerald-400">{formatFullDate24Hour(lastRegisteredSession.sign_on_time)}</span>
                      </div>
                      <div className="bg-[#0b0e17]/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Duration Logged</span>
                        <span className="font-mono font-bold text-amber-400">{calculateDuration(lastRegisteredSession.sign_on_time)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: ROSTER MANAGEMENT SYSTEM (ADMIN VIEW) --- */}
        {role === 'admin' && isAdminAuthenticated && (
          <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/30 to-transparent" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-4">
              <div>
                <h2 className="text-base font-bold text-blue-400 flex items-center gap-2 tracking-tight uppercase">
                  <Shield className="w-4 h-4" /> Relief Allocation Register [SQL Cloud Active]
                </h2>
                <p className="text-[11px] text-slate-400">Authorized View: SECR Running Personnel Centralized Control Roll</p>
              </div>
              <button onClick={handleAdminLogout} className="bg-[#05070c] hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl transition flex items-center gap-1.5">
                <Power className="w-3 text-rose-500" /> Lock Desk
              </button>
            </div>

            {/* Systematic Crew Planning Form Overlay */}
            {planningSessionId !== null && (
              <div className="p-4 bg-[#0e1424] border border-blue-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <CalendarCheck className="w-4 h-4" /> Systematic Crew Relief Planner
                </div>
                <form onSubmit={saveReliefPlan} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Target Relief Station</label>
                    <input type="text" value={reliefStationInput} onChange={e => setReliefStationInput(e.target.value)} className="w-full bg-[#05070c] border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-semibold uppercase" placeholder="e.g. BSP" required />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Assigned Relief Crew ID</label>
                    <input type="text" value={reliefCrewInput} onChange={e => setReliefCrewInput(e.target.value)} className="w-full bg-[#05070c] border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono" placeholder="e.g. SECR104" required />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase p-2 rounded-lg transition">Commit Plan</button>
                    <button type="button" onClick={() => setPlanningSessionId(null)} className="bg-slate-800 text-slate-300 text-xs font-bold uppercase p-2 rounded-lg">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* PostgreSQL Master Table Grid */}
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-[#05070c] shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[9px] uppercase font-bold tracking-widest bg-[#080b12] text-slate-400 border-b border-slate-850">
                    <th className="py-3.5 px-4">Ref Code</th>
                    <th className="py-3.5 px-4">Crew Name</th>
                    <th className="py-3.5 px-4">Loco / Train</th>
                    <th className="py-3.5 px-4">Sector Path</th>
                    <th className="py-3.5 px-4">Sign-On Time</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Running Time</th>
                    <th className="py-3.5 px-4 text-center">DY/CHC Status</th>
                    <th className="py-3.5 px-4 text-center">Systematic Planning</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-medium text-slate-300">
                  {allActiveSessions.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-slate-500 font-bold uppercase tracking-wider">No active running operations deployed within PostgreSQL cloud tables.</td></tr>
                  ) : (
                    allActiveSessions.map((session) => {
                      const minutesRunning = Math.floor((new Date().getTime() - new Date(session.sign_on_time).getTime()) / 60000);
                      const needsRelief = minutesRunning >= 480; 

                      return (
                        <tr key={session.id} className={`hover:bg-[#0c111e] transition duration-75 ${needsRelief && !session.dy_chc_informed ? 'bg-rose-950/5' : ''}`}>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{session.crew_id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">{session.crew_name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">L-{session.loco_number} / T-{session.train_number}</td>
                          <td className="py-3.5 px-4 text-slate-300">{session.location}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{formatFullDate24Hour(session.sign_on_time)}</td>
                          <td className="py-3.5 px-4 text-center">
                            {needsRelief ? (
                              <span className="inline-block text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">CRITICAL</span>
                            ) : (
                              <span className="inline-block text-[8px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold tracking-widest uppercase">NORMAL</span>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-bold font-mono text-xs ${needsRelief ? 'text-rose-400' : 'text-emerald-400'}`}>{calculateDuration(session.sign_on_time)}</td>
                          
                          <td className="py-3.5 px-4 text-center">
                            <button 
                              onClick={() => toggleDyChcInfo(session.id!, session.dy_chc_informed)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase border tracking-wider transition ${session.dy_chc_informed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                            >
                              <PhoneCall className="w-2.5 h-2.5" />
                              {session.dy_chc_informed ? 'Informed' : 'Pending'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {session.planned_relief_station && session.assigned_relief_crew_id ? (
                              <div className="text-left bg-blue-950/20 border border-blue-900/30 rounded p-1 text-[9px] space-y-0.5 max-w-[120px] mx-auto">
                                <p className="text-blue-400"><strong className="text-slate-400">Stn:</strong> {session.planned_relief_station}</p>
                                <p className="text-blue-400 font-mono"><strong className="text-slate-400">Crew:</strong> {session.assigned_relief_crew_id}</p>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setPlanningSessionId(session.id!);
                                  setReliefStationInput('');
                                  setReliefCrewInput('');
                                }}
                                className="bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-900/30 text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wider transition"
                              >
                                + Plan Relief
                              </button>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button onClick={() => handleSignOff(session.id!)} className="bg-rose-950/20 hover:bg-rose-600 border border-rose-900/30 text-rose-400 hover:text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition">Sign-Off</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Historical Cloud Archive Panel */}
            <div className="pt-3 border-t border-slate-850 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><History className="w-3.5 h-3.5" /> Historical Shift Cloud Archives ({pastSessions.length} Logs Processed)</span>
              {pastSessions.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-slate-850 rounded-xl bg-[#05070c] text-[11px] divide-y divide-slate-850">
                  {pastSessions.map(ps => (
                    <div key={ps.id} className="p-3 flex justify-between items-center text-slate-400">
                      <div>
                        <span className="font-bold text-blue-400 font-mono">{ps.crew_id}</span> 
                        <span className="text-slate-600 mx-2">|</span> 
                        <span className="text-slate-300 font-bold">{ps.crew_name}</span> 
                        <span className="text-slate-600 mx-2">—</span> 
                        <span className="font-mono text-slate-500">Loco {ps.loco_number}</span>
                        {ps.planned_relief_station && (
                          <span className="text-[10px] bg-blue-950/40 border border-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded ml-3">Relieved at {ps.planned_relief_station} by {ps.assigned_relief_crew_id}</span>
                        )}
                      </div>
                      <div className="font-mono text-slate-500">Total Duty: <span className="text-emerald-400 font-bold">{calculateDuration(ps.sign_on_time, ps.sign_off_time)}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- CORPORATE FOOTER BRANDING --- */}
      <footer className="w-full max-w-7xl mx-auto border-t border-slate-850/60 mt-8 pt-4 pb-2 text-[10px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-3 font-medium tracking-wide uppercase">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Designed, Developed & Maintained **By the Crew, For the Crew**</span>
        </div>
        <div className="text-slate-400 font-semibold bg-[#0d1220] border border-slate-850 px-3 py-1 rounded-lg">
          Project Lead: <span className="text-emerald-400 font-bold font-sans tracking-normal pl-0.5">V Vijay Kumar</span>
        </div>
      </footer>

    </main>
  );
}