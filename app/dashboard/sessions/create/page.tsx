"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Radio, Calendar, Users, BookOpen, Hash, Tag, Info, Loader2, ArrowRight, Layers, ShieldCheck, Clock, Zap, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { getSubjectsForDropdown, createPeerSession } from "@/app/actions/sessions";

type Unit = { id: number; unit_number: number; unit_title: string; };
type Subject = { id: number; course_code: string; course_title: string; semester_id: number; semesters?: { semester_number: number }; units: Unit[]; };

export default function CreateSessionPage() {
  const router = useRouter();
  
  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form & UI state
  const [timingMode, setTimingMode] = useState<"now" | "later">("now");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    semester: "", 
    subject_id: "",
    unit_id: "",
    tags: "",
    start_time: "", // Only used if timingMode === "later"
    duration_minutes: 60,
    max_participants: 10,
  });

  useEffect(() => {
    async function loadData() {
      const res = await getSubjectsForDropdown();
      if (res.error) toast.error(res.error);
      if (res.subjects) setSubjects(res.subjects);
      setIsLoadingContext(false);
    }
    loadData();
  }, []);

  // Derived state for cascading dropdowns
  const uniqueSemesters = useMemo(() => {
    const sems = new Set<number>();
    subjects.forEach(sub => { if (sub.semesters) sems.add(sub.semesters.semester_number); });
    return Array.from(sems).sort((a, b) => a - b);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!formData.semester || formData.semester === "general") return [];
    return subjects.filter(sub => sub.semesters?.semester_number.toString() === formData.semester);
  }, [subjects, formData.semester]);

  const selectedSubject = filteredSubjects.find(s => s.id.toString() === formData.subject_id);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Cascade resets
      if (name === "semester") {
        newData.subject_id = "";
        newData.unit_id = "";
      }
      if (name === "subject_id") {
        newData.unit_id = "";
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Timing validation
    let finalStartTime = formData.start_time;
    if (timingMode === "now") {
      finalStartTime = new Date().toISOString(); // Right now
    } else if (!finalStartTime) {
      toast.error("Please select a valid future start time.");
      return;
    }

    setIsSubmitting(true);

    const tagArray = formData.tags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    const res = await createPeerSession({
      title: formData.title,
      description: formData.description,
      subject_id: formData.semester === "general" || !formData.subject_id ? null : parseInt(formData.subject_id),
      unit_id: formData.semester === "general" || !formData.unit_id ? null : parseInt(formData.unit_id),
      tags: tagArray,
      start_time: finalStartTime,
      duration_minutes: Number(formData.duration_minutes),
      max_participants: Number(formData.max_participants),
      status: timingMode === "now" ? "live" : "scheduled"
    });

    if (res.error) {
      toast.error(res.error);
      setIsSubmitting(false);
    } else {
      toast.success(timingMode === "now" ? "Hub Live! Redirecting..." : "Live protocol scheduled successfully!");
      
      // If "Start Now", drop them straight into the room!
      if (timingMode === "now" && res.roomCode) {
        router.push(`/dashboard/sessions/room/${res.roomCode}`);
      } else {
        router.push("/dashboard/sessions"); 
      }
    }
  };

  if (isLoadingContext) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00BC7D] mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  const isGeneral = formData.semester === "general";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-4">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> Create Live Protocol
        </div>
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground mb-2">
          Initialize Session
        </h1>
        <p className="text-muted-foreground font-medium max-w-xl leading-relaxed">
          Broadcast your availability to the network. Define the academic vectors and set the parameters for your native live peer learning environment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Context */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-border p-6 sm:p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground mb-6">
              <Info className="w-4 h-4 text-[#00BC7D]" /> Session Metadata
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transmission Title</label>
              <input 
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Matrix Transformations Deep Dive"
                className="w-full h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</label>
              <textarea 
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Outline what topics will be covered, prerequisites, and goals..."
                className="w-full bg-background border border-border rounded-2xl p-5 text-sm font-medium focus:border-[#00BC7D]/50 outline-none transition-colors min-h-[120px] resize-y custom-scrollbar" 
              />
            </div>

            {/* CASCADING ACADEMIC VECTORS */}
            <div className="p-5 bg-background border border-border rounded-3xl space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-widest">Academic Target</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Semester Dropdown */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phase / Sem</label>
                  <select 
                    required
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 text-xs font-bold focus:border-[#00BC7D]/50 outline-none transition-colors appearance-none"
                  >
                    <option value="" disabled>Select...</option>
                    <option value="general" className="font-bold text-[#00BC7D]">General / Interdisciplinary</option>
                    {uniqueSemesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Dropdown */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1"><BookOpen className="w-3 h-3 inline mr-1" /> Vector</label>
                  <select 
                    required={!isGeneral}
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleChange}
                    disabled={isGeneral || !formData.semester}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 text-xs font-bold focus:border-[#00BC7D]/50 outline-none transition-colors appearance-none disabled:opacity-40"
                  >
                    <option value="">{isGeneral ? 'Not Applicable' : 'Select Vector...'}</option>
                    {filteredSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.course_code}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Dropdown */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1"><Hash className="w-3 h-3 inline mr-1" /> Unit</label>
                  <select 
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleChange}
                    disabled={isGeneral || !selectedSubject || selectedSubject.units.length === 0}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 text-xs font-bold focus:border-[#00BC7D]/50 outline-none transition-colors appearance-none disabled:opacity-40"
                  >
                    <option value="">{isGeneral ? 'Not Applicable' : 'Entire Vector'}</option>
                    {selectedSubject?.units.sort((a,b) => a.unit_number - b.unit_number).map(unit => (
                      <option key={unit.id} value={unit.id}>Unit {unit.unit_number}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><Tag className="w-3 h-3" /> Search Tags (Comma Separated)</label>
              <input 
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., Finals Prep, Doubt Clearing, Formula Derivation"
                className="w-full h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Constraints & Scheduling */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-border p-6 sm:p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground mb-6">
              <Clock className="w-4 h-4 text-[#00BC7D]" /> Temporal Config
            </h3>
            
            {/* TIMING TOGGLE */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setTimingMode("now")}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  timingMode === "now"
                    ? "border-[#00BC7D] bg-[#00BC7D]/10 text-[#00BC7D]"
                    : "border-border bg-background text-muted-foreground hover:border-[#00BC7D]/50"
                }`}
              >
                <Zap className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Start Now</span>
              </button>
              <button
                type="button"
                onClick={() => setTimingMode("later")}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  timingMode === "later"
                    ? "border-[#00BC7D] bg-[#00BC7D]/10 text-[#00BC7D]"
                    : "border-border bg-background text-muted-foreground hover:border-[#00BC7D]/50"
                }`}
              >
                <CalendarClock className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
              </button>
            </div>

            {/* CONDITIONAL DATE PICKER */}
            {timingMode === "later" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Target Date & Time</label>
                <input 
                  required={timingMode === "later"}
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full h-14 bg-background border border-border rounded-2xl px-4 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration (Mins)</label>
                <input 
                  required
                  type="number"
                  min="15"
                  max="300"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  className="w-full h-14 bg-background border border-border rounded-2xl px-4 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors text-center" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1"><Users className="w-3 h-3" /> Max Peers</label>
                <input 
                  required
                  type="number"
                  min="2"
                  max="100"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  className="w-full h-14 bg-background border border-border rounded-2xl px-4 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors text-center" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="p-4 bg-[#00BC7D]/10 border border-[#00BC7D]/20 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00BC7D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00BC7D] mb-1">Native Room Generated</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    A secure, internal WebRTC meeting link will be automatically provisioned upon creation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full h-16 flex items-center justify-center gap-3 rounded-[1.5rem] text-white font-black uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,188,125,0.2)] hover:shadow-[0_0_30px_rgba(0,188,125,0.4)] active:scale-[0.98] ${
              timingMode === "now" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-[#00BC7D]"
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning...</>
            ) : timingMode === "now" ? (
              <>Deploy Hub & Enter Room <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Schedule Broadcast <CalendarClock className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}