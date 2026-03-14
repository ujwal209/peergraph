"use client";

import { useState, useEffect, useRef } from "react";
import { Book, Layers, FileText, CheckCircle, BookOpen, ArrowLeft, Loader2, ChevronDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getInstitutionalSyllabus } from "@/app/actions/curriculum";
import { toast } from "sonner";

// --- Types ---
type Branch = { id: number; code: string; name: string; };
type Semester = { id: number; semester_number: number; };
type Unit = { id: number; unit_number: number; unit_title: string; unit_content: string; hours?: number | null; };
type Subject = {
  id: number; branch_id: number; semester_id: number; course_type: string; course_code: string; course_title: string;
  credits: number; l_t_p: string; total_lecture_hours: number | null;
  units: Unit[]; course_outcomes?: any[]; textbooks?: any[];
};

// --- Custom Attractive Dropdown ---
function CustomSelect({ value, onChange, options, placeholder, label }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value.toString() === value?.toString());

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-background dark:bg-zinc-950 border ${isOpen ? 'border-[#00BC7D] ring-2 ring-[#00BC7D]/20' : 'border-border'} rounded-xl py-3 px-4 text-sm font-bold flex justify-between items-center transition-all hover:border-[#00BC7D]/50`}
      >
        <span className={selectedOption ? "text-foreground truncate pr-2" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden origin-top"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors mb-1"
              >
                Clear Selection
              </button>
              {options.map((opt: any) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${value?.toString() === opt.value.toString() ? 'bg-[#00BC7D]/10 text-[#00BC7D]' : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function CurriculumPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  
  // Selection States
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // 1. Fetch data on mount
  useEffect(() => {
    async function loadData() {
      const res = await getInstitutionalSyllabus();
      if (res.error) {
        toast.error(res.error);
      } else {
        setBranches(res.branches || []);
        setSemesters(res.semesters || []);
        setSubjects(res.subjects || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // 2. Filter subjects based on branch AND semester
  const filteredSubjects = subjects.filter(sub => {
    const matchesBranch = selectedBranch ? sub.branch_id === selectedBranch : true;
    const matchesSemester = selectedSemester ? sub.semester_id === selectedSemester : true;
    return matchesBranch && matchesSemester;
  });

  // 3. Auto-select the first subject when filters change
  useEffect(() => {
    if (!loading && selectedBranch && selectedSemester) {
      if (filteredSubjects.length > 0) {
        // If current subject is not in the filtered list, select the first one
        if (!selectedSubject || !filteredSubjects.find(s => s.id === selectedSubject.id)) {
          setSelectedSubject(filteredSubjects[0]);
        }
      } else {
        setSelectedSubject(null);
      }
    }
  }, [selectedBranch, selectedSemester, filteredSubjects, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-12 h-12 animate-spin text-[#00BC7D] mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-foreground animate-pulse">
          Decrypting Matrix...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-8 lg:pb-0">
      <div className="mb-8 shrink-0 px-4 lg:px-0">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">Syllabus Matrix</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">
          Explore the institutional curriculum registry
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:bg-zinc-50 lg:dark:bg-zinc-900/40 lg:border lg:border-border lg:rounded-[2.5rem] lg:p-6 lg:shadow-sm relative overflow-hidden flex-1 min-h-0 px-4 lg:px-0">
        
        {/* --- Left Sidebar (Filters & Subjects) --- */}
        <div className={`w-full lg:w-[350px] flex-col gap-6 relative z-10 ${isMobileDetailView ? 'hidden lg:flex' : 'flex'} h-full`}>
          
          {/* Controls Box (Branch & Semester) */}
          <div className="bg-background border border-border rounded-3xl p-5 shadow-sm shrink-0 space-y-5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Matrix Parameters</h2>
            
            <CustomSelect 
              placeholder="Select Branch..."
              value={selectedBranch}
              onChange={(val: any) => setSelectedBranch(val ? Number(val) : null)}
              options={branches.map(b => ({ label: `${b.code} - ${b.name}`, value: b.id }))}
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 block">Semester Phase</label>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 lg:flex-wrap lg:pb-0">
                {semesters.map((sem) => (
                  <button
                    key={sem.id}
                    onClick={() => { 
                      setSelectedSemester(sem.id); 
                      setIsMobileDetailView(false); 
                    }}
                    className={`flex-1 min-w-[64px] whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      selectedSemester === sem.id 
                        ? "bg-[#00BC7D] text-white shadow-lg shadow-[#00BC7D]/20 lg:scale-[1.02]" 
                        : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-transparent hover:border-border"
                    }`}
                  >
                    S-0{sem.semester_number}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subjects List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar pb-20 lg:pb-0">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#00BC7D] sticky top-0 py-2 hidden lg:block bg-zinc-50 dark:bg-zinc-900/40 backdrop-blur-md z-10">
              Subject Vectors
            </h2>
            
            {(!selectedBranch || !selectedSemester) ? (
              <div className="text-center p-8 border-2 border-dashed border-border rounded-3xl text-muted-foreground bg-background opacity-60">
                <Filter className="w-8 h-8 opacity-50 mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">Select Parameters</p>
                <p className="text-[10px] mt-1 opacity-70">Choose branch and semester to load subjects.</p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-border rounded-3xl text-muted-foreground bg-background">
                <Layers className="w-8 h-8 opacity-20 mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">No Vectors Found</p>
              </div>
            ) : (
              filteredSubjects.map((subject) => (
                <motion.button 
                  key={subject.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { 
                    setSelectedSubject(subject); 
                    setIsMobileDetailView(true); 
                  }}
                  className={`w-full text-left p-5 rounded-3xl border transition-all flex flex-col gap-3 group ${
                    selectedSubject?.id === subject.id 
                      ? "bg-background border-[#00BC7D] shadow-sm relative overflow-hidden" 
                      : "bg-background border-transparent hover:border-border lg:border-border shadow-sm lg:shadow-none"
                  }`}
                >
                  {selectedSubject?.id === subject.id && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00BC7D]" />
                  )}
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-muted-foreground group-hover:text-foreground transition-colors">
                      {subject.course_code}
                    </span>
                    <Badge variant="outline" className="text-[9px] border-none bg-[#00BC7D]/10 text-[#00BC7D] uppercase tracking-widest">
                      {subject.credits} CR
                    </Badge>
                  </div>
                  <h3 className={`font-bold text-sm leading-tight ${selectedSubject?.id === subject.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"}`}>
                    {subject.course_title}
                  </h3>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* --- Right Detail Area --- */}
        <div className={`flex-1 bg-background border border-border rounded-[2.5rem] p-6 lg:p-12 shadow-xl relative overflow-hidden overflow-y-auto custom-scrollbar ${!isMobileDetailView ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00BC7D]/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!selectedSubject ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
                  <Book className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">Syllabus Matrix</h3>
                <p className="text-muted-foreground font-medium max-w-sm">Select a subject vector from the sidebar to engage with the institutional curriculum.</p>
              </motion.div>
            ) : (
              <motion.div key={selectedSubject.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="relative z-10 flex flex-col h-full space-y-10">
                
                {/* Mobile Back Button */}
                <Button variant="ghost" onClick={() => setIsMobileDetailView(false)} className="lg:hidden w-fit -ml-4 mb-2 text-muted-foreground font-bold tracking-widest uppercase text-xs hover:bg-[#00BC7D]/10 hover:text-[#00BC7D]">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Vectors
                </Button>
                
                {/* Header Info */}
                <div className="border-b border-border pb-8 shrink-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-900 text-zinc-100 dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]">
                      {selectedSubject.course_type}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground font-bold uppercase tracking-widest text-[10px]">
                      L-T-P: {selectedSubject.l_t_p}
                    </Badge>
                    {selectedSubject.total_lecture_hours && (
                      <Badge variant="outline" className="border-border text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                        {selectedSubject.total_lecture_hours} Total Hrs
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-[1.05] mb-4">
                    {selectedSubject.course_title}
                  </h1>
                </div>

                <div className="space-y-12 pb-10">
                  {/* Units Section */}
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-[#00BC7D]/10 rounded-xl"><FileText className="w-5 h-5 text-[#00BC7D]" /></div>
                      <h2 className="text-2xl font-black uppercase tracking-widest text-foreground">Syllabus Units</h2>
                    </div>
                    <div className="space-y-6">
                      {!selectedSubject.units || selectedSubject.units.length === 0 ? (
                        <p className="text-sm font-medium text-muted-foreground italic">No units registered for this vector.</p>
                      ) : (
                        [...selectedSubject.units].sort((a,b) => a.unit_number - b.unit_number).map((unit) => (
                          <div key={unit.id} className="bg-zinc-50 dark:bg-zinc-900/40 border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-4 group hover:border-[#00BC7D]/30 transition-colors">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-foreground">Unit {unit.unit_number}: {unit.unit_title}</h3>
                              {unit.hours && (
                                <span className="text-[10px] w-fit font-bold uppercase tracking-widest bg-background border border-border px-3 py-1.5 rounded-full text-muted-foreground shrink-0">
                                  {unit.hours} Hrs
                                </span>
                              )}
                            </div>
                            <div className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed">
                              {/* Renders the extracted content, handling newlines properly */}
                              <ul className="list-disc pl-5 space-y-1.5">
                                {unit.unit_content.split(/\r?\n|,/).map(t => t.trim().replace(/^[-*•\d.]+\s*/, '')).filter(Boolean).map((topic, i) => (
                                  <li key={i}>{topic}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Course Outcomes */}
                  {selectedSubject.course_outcomes && selectedSubject.course_outcomes.length > 0 && (
                    <section className="bg-[#00BC7D]/5 border border-[#00BC7D]/20 rounded-3xl p-6 md:p-10 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-[#00BC7D]" />
                      <div className="flex items-center gap-3 mb-8">
                        <CheckCircle className="w-6 h-6 text-[#00BC7D]" />
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-foreground">Course Outcomes</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {selectedSubject.course_outcomes.map((co: any) => (
                          <div key={co.id} className="bg-background border border-border rounded-2xl p-5 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                            <span className="text-xs font-black uppercase tracking-widest bg-[#00BC7D]/10 text-[#00BC7D] px-2 py-1 rounded shrink-0 mt-0.5">
                              {co.co_number}
                            </span>
                            <p className="text-sm font-medium text-foreground leading-relaxed">{co.co_description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Textbooks */}
                  {selectedSubject.textbooks && selectedSubject.textbooks.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl"><BookOpen className="w-5 h-5 text-foreground" /></div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-foreground">References</h2>
                      </div>
                      <div className="space-y-4">
                        {selectedSubject.textbooks.map((book: any) => (
                          <div key={book.id} className="flex flex-col md:flex-row gap-5 md:items-center p-6 bg-background border border-border rounded-3xl relative overflow-hidden group hover:border-foreground/30 transition-colors">
                            {book.is_primary && (
                              <div className="absolute top-0 right-0 bg-[#00BC7D] text-[9px] font-black uppercase tracking-widest px-4 py-1 text-white rounded-bl-2xl">
                                Primary
                              </div>
                            )}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${book.is_primary ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground"}`}>
                              <Book className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-foreground mb-1 md:pr-16">{book.book_title}</h4>
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                {book.authors && <span className="text-foreground/80">By {book.authors}</span>}
                                {book.edition && <span> • {book.edition}</span>}
                              </p>
                              {book.publisher && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-md text-muted-foreground/80">
                                  {book.publisher}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}