"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, CheckCircle2, ChevronDown, Loader2, 
  Search, Filter, Folder, FileText, ChevronRight, Download, Check, Library, Layers
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// CUSTOM ATTRACTIVE DROPDOWN COMPONENT
// ============================================================================
function CustomSelect({ value, onChange, options, placeholder, label, disabled }: any) {
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

  const selectedOption = options.find((o: any) => o.value.toString() === value.toString());

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1 mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "w-full bg-white dark:bg-zinc-900/50 border rounded-xl py-3.5 px-4 text-sm font-semibold flex justify-between items-center transition-all duration-300",
            isOpen ? "border-[#00BC7D] ring-4 ring-[#00BC7D]/10 dark:ring-[#00BC7D]/20 shadow-sm" : "border-zinc-200 dark:border-zinc-800",
            disabled ? "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-950" : "hover:border-zinc-300 dark:hover:border-zinc-700"
        )}
      >
        <span className={selectedOption ? "text-zinc-900 dark:text-zinc-100 truncate pr-2" : "text-zinc-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1A1A1B] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden origin-top"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mb-1"
              >
                Clear Selection
              </button>
              {options.map((opt: any) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                      value.toString() === opt.value.toString() 
                      ? "bg-[#00BC7D]/10 text-[#00BC7D] dark:bg-[#00BC7D]/20" 
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
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
// RESOURCE EXPLORER (MOUNTS INSIDE THE SUBJECT)
// ============================================================================
function SubjectResources({ subjectId }: { subjectId: number }) {
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([{ id: null, name: "Root Directory" }]);
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(true);

  const currentFolderId = folderHistory[folderHistory.length - 1].id;

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      const url = currentFolderId ? `/explorer/subject/${subjectId}?folder_id=${currentFolderId}` : `/explorer/subject/${subjectId}`;
      const data = await apiClient.get(url);
      if (!data.error) {
          setContents({ folders: data.folders || [], files: data.files || [] });
      }
      setLoading(false);
    }
    loadResources();
  }, [subjectId, currentFolderId]);

  const navigateToFolder = (id: string, name: string) => setFolderHistory([...folderHistory, { id, name }]);
  const handleBreadcrumbClick = (index: number) => setFolderHistory(folderHistory.slice(0, index + 1));

  return (
    <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#09090b] shadow-sm">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 px-5 py-3.5 flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {folderHistory.map((hist, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button 
              onClick={() => handleBreadcrumbClick(idx)}
              className={cn(
                  "text-[11px] font-black uppercase tracking-widest transition-colors",
                  idx === folderHistory.length - 1 ? "text-[#00BC7D]" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              )}
            >
              {hist.name}
            </button>
            {idx < folderHistory.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />}
          </div>
        ))}
      </div>
      <div className="p-5 min-h-[150px]">
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-[#00BC7D]" /></div>
        ) : contents.folders.length === 0 && contents.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-400 dark:text-zinc-600">
            <Folder className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest">Directory Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contents.folders.map((folder: any) => (
              <div key={folder.id} onClick={() => navigateToFolder(folder.id, folder.name)} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group shadow-sm">
                <Folder className="w-6 h-6 text-blue-500 fill-blue-500/20 shrink-0" />
                <span className="text-sm font-semibold truncate flex-1 text-zinc-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{folder.name}</span>
              </div>
            ))}
            {contents.files.map((file: any) => (
              <div key={file.id} onClick={() => window.open(file.cloudinary_url, "_blank")} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 cursor-pointer hover:border-[#00BC7D] dark:hover:border-[#00BC7D]/50 hover:bg-[#00BC7D]/5 transition-all group shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-6 h-6 text-zinc-400 shrink-0 group-hover:text-[#00BC7D] transition-colors" />
                  <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{file.file_name}</span>
                </div>
                <Download className="w-4 h-4 text-[#00BC7D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function CurriculumPage() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [curriculumData, setCurriculumData] = useState<any[]>([]);
  const [taxonomy, setTaxonomy] = useState({ branches: [], semesters: [], subjects: [] });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const [currRes, taxRes] = await Promise.all([
          apiClient.get("/curriculum/data"),
          apiClient.get("/curriculum/taxonomy")
      ]);
      
      if (!currRes.error) {
          const data = currRes.data || currRes;
          setCurriculumData(Array.isArray(data) ? data : []);
      }
      if (!taxRes.error) setTaxonomy(taxRes as any);
      
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredTaxonomySubjects = taxonomy.subjects.filter((s: any) => (branchId ? s.branch_id === Number(branchId) : true) && (semesterId ? s.semester_id === Number(semesterId) : true));

  const filteredCurriculum = curriculumData.filter((subject) => {
    const matchesBranch = branchId ? subject.branch_id === Number(branchId) : true;
    const matchesSem = semesterId ? subject.semester_id === Number(semesterId) : true;
    const matchesSubject = subjectId ? subject.id === subjectId.toString() : true;
    const matchesSearch = searchQuery ? subject.title.toLowerCase().includes(searchQuery.toLowerCase()) || subject.code.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesBranch && matchesSem && matchesSubject && matchesSearch;
  });

  // Calculate Progress for all 8 Semesters
  const semesterProgress = useMemo(() => {
    const progressMap: Record<number, { total: number, completed: number, percent: number }> = {};
    for (let i = 1; i <= 8; i++) progressMap[i] = { total: 0, completed: 0, percent: 0 };

    const semIdToNumber: Record<number, number> = {};
    taxonomy.semesters.forEach((s: any) => { semIdToNumber[s.id] = s.semester_number; });

    curriculumData.forEach(sub => {
      const semNum = semIdToNumber[sub.semester_id];
      if (semNum && progressMap[semNum]) {
        progressMap[semNum].total += sub.totalSubjectTopics;
        progressMap[semNum].completed += sub.completedSubjectTopics;
      }
    });

    for (let i = 1; i <= 8; i++) {
      if (progressMap[i].total > 0) {
        progressMap[i].percent = Math.round((progressMap[i].completed / progressMap[i].total) * 100);
      }
    }
    return progressMap;
  }, [curriculumData, taxonomy.semesters]);

  const handleToggleTopic = async (subjectIdStr: string, unitId: number, topicIndex: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI Update
    setCurriculumData(prev => prev.map(sub => {
      if (sub.id !== subjectIdStr) return sub;

      let subTotal = sub.totalSubjectTopics;
      let subCompleted = sub.completedSubjectTopics + (newStatus ? 1 : -1);

      const updatedUnits = sub.units.map((u: any) => {
        if (u.id !== unitId) return u;
        const updatedTopics = u.topics.map((t: any) => t.id === topicIndex ? { ...t, completed: newStatus } : t);
        return {
          ...u,
          topics: updatedTopics,
          completedTopics: updatedTopics.filter((t: any) => t.completed).length
        };
      });

      return {
        ...sub,
        completedSubjectTopics: subCompleted,
        progress: subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100),
        units: updatedUnits
      };
    }));

    // API Call
    const res = await apiClient.post("/curriculum/toggle-topic", {
        unit_id: unitId,
        topic_index: topicIndex,
        status: newStatus
    });
    
    if (res.error) toast.error("Failed to sync progress with server.");
  };

  const toggleSubject = (id: string) => setExpandedSubject(expandedSubject === id ? null : id);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center w-full">
         <Loader2 className="w-10 h-10 text-[#00BC7D] animate-spin mb-4" />
         <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  // Note: Parent layout already handles padding and overflow, so we just use min-h-full and let it flow naturally.
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 relative z-10">
      
      {/* Background Ambient Effects (Fixed to Viewport to not break scrolling) */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#00BC7D]/5 dark:bg-[#00BC7D]/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* PAGE HEADER & SEMESTER PROGRESSION */}
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00BC7D]/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest mb-5">
                <Library className="w-3.5 h-3.5" /> Intelligence Matrix
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white mb-3">
                Curriculum <span className="text-[#00BC7D]">Core.</span>
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-xl text-sm sm:text-base mx-auto md:mx-0 leading-relaxed">
                Monitor your academic trajectory, track mastery across subjects, and access classified repository nodes.
              </p>
          </div>
        </div>

        {/* 8-Semester Tracking Grid */}
        <div className="relative z-10 grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 border-t border-zinc-200 dark:border-zinc-800/50 pt-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => {
            const prog = semesterProgress[semNum];
            const isActive = prog.total > 0;
            
            return (
              <div 
                key={semNum} 
                className={cn(
                    "p-3 sm:p-4 rounded-2xl transition-all duration-500",
                    isActive ? "bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm" : "bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 opacity-40"
                )}
              >
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                  Sem 0{semNum}
                </div>
                <div className={cn("text-xl sm:text-2xl font-black tabular-nums mb-3", isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                  {prog.percent}%
                </div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-950 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-[#00BC7D] rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${prog.percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/90 dark:bg-[#09090b]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-5 sm:p-8 shadow-lg shadow-zinc-200/50 dark:shadow-none space-y-6 relative z-30">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search subjects by nomenclature or designation code..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm font-semibold outline-none focus:border-[#00BC7D]/50 focus:ring-4 focus:ring-[#00BC7D]/10 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <CustomSelect label="Branch / Protocol" placeholder="All Branches" value={branchId}
            onChange={(val: any) => { setBranchId(val ? Number(val) : ""); setSubjectId(""); }}
            options={taxonomy.branches.map((b: any) => ({ label: b.code, value: b.id }))}
          />
          <CustomSelect label="Phase / Semester" placeholder="All Semesters" value={semesterId}
            onChange={(val: any) => { setSemesterId(val ? Number(val) : ""); setSubjectId(""); }}
            options={taxonomy.semesters.map((s: any) => ({ label: `Phase 0${s.semester_number}`, value: s.id }))}
          />
          <CustomSelect label="Target / Subject" placeholder="All Subjects" value={subjectId}
            onChange={(val: any) => setSubjectId(val ? Number(val) : "")}
            options={filteredTaxonomySubjects.map((sub: any) => ({ label: sub.course_title, value: sub.id }))}
            disabled={!branchId || !semesterId}
          />
        </div>
      </div>

      {/* CURRICULUM GRID */}
      <div className="space-y-6 pt-4 relative z-20">
        {(!branchId || !semesterId) ? (
          <div className="bg-white/50 dark:bg-zinc-950/30 backdrop-blur-sm border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center min-h-[350px] animate-in fade-in">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner"><Filter className="w-10 h-10 text-zinc-400" /></div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">Parameters Required</h2>
            <p className="text-base text-zinc-500 max-w-md leading-relaxed">Establish your operational Branch and Phase above to decrypt the curriculum nodes.</p>
          </div>
        ) : filteredCurriculum.length === 0 ? (
          <div className="bg-white/50 dark:bg-zinc-950/30 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8"><BookOpen className="w-10 h-10 text-zinc-400" /></div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">No Active Nodes</h2>
            <p className="text-base text-zinc-500 max-w-md leading-relaxed">No operational subjects discovered matching the current filter parameters.</p>
          </div>
        ) : (
          filteredCurriculum.map((subject) => {
            const isExpanded = expandedSubject === subject.id;

            return (
              <div key={subject.id} className={cn(
                  "bg-white dark:bg-[#09090b] border transition-all duration-500 rounded-[2rem] overflow-hidden group/card shadow-sm hover:shadow-md",
                  isExpanded ? "border-[#00BC7D]/50 shadow-[0_10px_40px_rgba(0,188,125,0.08)] dark:shadow-[0_10px_40px_rgba(0,188,125,0.05)] z-30" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}>
                {/* Subject Header */}
                <div onClick={() => toggleSubject(subject.id)} className="p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 cursor-pointer select-none relative overflow-hidden">
                  {/* Subtle expand highlight */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-[#00BC7D]/5 to-transparent opacity-0 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : ''}`} />

                  <div className={cn(
                      "hidden md:flex w-16 h-16 rounded-[1.5rem] items-center justify-center shrink-0 transition-all duration-500 relative z-10",
                      isExpanded ? "bg-[#00BC7D] text-zinc-950 shadow-[0_0_20px_rgba(0,188,125,0.3)]" : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover/card:text-zinc-600 dark:group-hover/card:text-zinc-200"
                  )}>
                    <BookOpen className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{subject.code}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{subject.completedSubjectTopics} / {subject.totalSubjectTopics} Synced</span>
                    </div>
                    <h2 className={cn("text-xl sm:text-2xl md:text-3xl font-black tracking-tight truncate transition-colors duration-300", isExpanded ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-100")}>
                        {subject.title}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 relative z-10">
                    <div className="w-full sm:w-40 flex-1 sm:flex-none">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sync Level</span>
                        <span className="text-xs font-black tabular-nums text-zinc-900 dark:text-zinc-100">{subject.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-zinc-200/50 dark:border-zinc-800/50">
                        <div className="h-full bg-[#00BC7D] rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${subject.progress}%` }}>
                            {/* Shiny progress reflection */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20" />
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                        "w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-all duration-500",
                        isExpanded ? "rotate-180 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100" : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover/card:border-zinc-300 dark:group-hover/card:border-zinc-600"
                    )}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Expanded Syllabus & Topics */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-5 sm:px-7 md:px-8 pb-8 sm:pb-10 pt-2">
                        <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 mb-6 sm:mb-8" />
                        
                        <div className="mb-5 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#00BC7D]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Syllabus Matrix</span>
                        </div>
                        
                        {/* EXPANDED GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                          {subject.units.length === 0 ? (
                            <div className="col-span-full p-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center text-zinc-500 text-sm font-semibold">
                                No units configured for this vector.
                            </div>
                          ) : (
                            subject.units.map((unit: any) => {
                              const isUnitComplete = unit.totalTopics > 0 && unit.completedTopics === unit.totalTopics;

                              return (
                                <div key={unit.id} className={cn(
                                    "p-5 rounded-[1.5rem] border transition-all duration-300 shadow-sm",
                                    isUnitComplete ? "bg-[#00BC7D]/5 border-[#00BC7D]/20 dark:border-[#00BC7D]/10" : "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800"
                                )}>
                                  {/* Unit Header */}
                                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
                                    <div>
                                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{unit.title}</p>
                                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#00BC7D] mt-1.5">Module 0{unit.number}</p>
                                    </div>
                                    {isUnitComplete ? (
                                      <CheckCircle2 className="w-6 h-6 text-[#00BC7D]" />
                                    ) : (
                                      <div className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-300">
                                          {unit.completedTopics} / {unit.totalTopics}
                                      </div>
                                    )}
                                  </div>

                                  {/* Topics Checkbox List */}
                                  <div className="space-y-1">
                                    {unit.topics.length === 0 ? (
                                      <p className="text-xs text-zinc-500 italic px-2">No topic fragments extracted.</p>
                                    ) : (
                                      unit.topics.map((topic: any) => (
                                        <div 
                                          key={topic.id} 
                                          onClick={() => handleToggleTopic(subject.id, unit.id, topic.id, topic.completed)}
                                          className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-800/80 cursor-pointer transition-all group/topic"
                                        >
                                          <div className={cn(
                                              "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 shrink-0",
                                              topic.completed ? "bg-[#00BC7D] border-[#00BC7D] text-white shadow-[0_0_10px_rgba(0,188,125,0.4)]" : "border-zinc-300 dark:border-zinc-600 group-hover/topic:border-[#00BC7D] bg-white dark:bg-zinc-950"
                                          )}>
                                            {topic.completed && <Check className="w-3.5 h-3.5" />}
                                          </div>
                                          <span className={cn(
                                              "text-sm leading-snug select-none transition-all duration-300 font-medium",
                                              topic.completed ? "text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-600" : "text-zinc-700 dark:text-zinc-200 group-hover/topic:text-zinc-900 dark:group-hover/topic:text-white"
                                          )}>
                                            {topic.title}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="mb-5 flex items-center gap-2">
                            <Folder className="w-4 h-4 text-[#00BC7D]" />
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Repository Archives</div>
                        </div>
                        <SubjectResources subjectId={subject.rawId || parseInt(subject.id)} />

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}