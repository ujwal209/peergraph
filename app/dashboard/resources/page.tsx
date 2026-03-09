"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, CheckCircle2, ChevronDown, Loader2, 
  Search, Filter, Folder, FileText, ChevronRight, Download, Check
} from "lucide-react";
import { getCurriculumData, getTaxonomy, getSubjectResources, toggleTopicCompletion } from "@/app/actions/curriculum";

// ============================================================================
// CUSTOM ATTRACTIVE DROPDOWN COMPONENT
// ============================================================================
function CustomSelect({ value, onChange, options, placeholder, label, disabled }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    <div className="relative flex-1" ref={dropdownRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-background dark:bg-zinc-900 border ${isOpen ? 'border-[#00BC7D] ring-2 ring-[#00BC7D]/20' : 'border-border'} rounded-xl py-3 px-4 text-sm font-bold flex justify-between items-center transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-950' : 'hover:border-[#00BC7D]/50'}`}
      >
        <span className={selectedOption ? "text-foreground truncate pr-2" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
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
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${value.toString() === opt.value.toString() ? 'bg-[#00BC7D]/10 text-[#00BC7D]' : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
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
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([{ id: null, name: "Root" }]);
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(true);

  const currentFolderId = folderHistory[folderHistory.length - 1].id;

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      const data = await getSubjectResources(subjectId, currentFolderId);
      setContents({ folders: data.folders as never[], files: data.files as never[] });
      setLoading(false);
    }
    loadResources();
  }, [subjectId, currentFolderId]);

  const navigateToFolder = (id: string, name: string) => setFolderHistory([...folderHistory, { id, name }]);
  const handleBreadcrumbClick = (index: number) => setFolderHistory(folderHistory.slice(0, index + 1));

  return (
    <div className="mt-8 border border-border rounded-2xl overflow-hidden bg-background">
      <div className="bg-zinc-100 dark:bg-zinc-900/50 px-4 py-3 flex flex-wrap items-center gap-2 border-b border-border">
        {folderHistory.map((hist, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button 
              onClick={() => handleBreadcrumbClick(idx)}
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${idx === folderHistory.length - 1 ? 'text-[#00BC7D]' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {hist.name}
            </button>
            {idx < folderHistory.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>
      <div className="p-4 min-h-[150px]">
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : contents.folders.length === 0 && contents.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground opacity-60">
            <Folder className="w-8 h-8 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">No resources found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contents.folders.map((folder: any) => (
              <div key={folder.id} onClick={() => navigateToFolder(folder.id, folder.name)} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-border cursor-pointer hover:border-[#00BC7D]/50 hover:bg-[#00BC7D]/5 transition-all group">
                <Folder className="w-6 h-6 text-blue-500 fill-blue-500/20 shrink-0" />
                <span className="text-sm font-bold truncate flex-1">{folder.name}</span>
              </div>
            ))}
            {contents.files.map((file: any) => (
              <div key={file.id} onClick={() => window.open(file.cloudinary_url, "_blank")} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-border cursor-pointer hover:border-zinc-400 transition-all group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-6 h-6 text-zinc-400 shrink-0" />
                  <span className="text-sm font-semibold text-muted-foreground truncate group-hover:text-foreground transition-colors">{file.file_name}</span>
                </div>
                <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
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
      const [currRes, taxRes] = await Promise.all([getCurriculumData(), getTaxonomy()]);
      if (currRes.data) setCurriculumData(currRes.data);
      if (taxRes) setTaxonomy(taxRes as any);
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

    // Create a lookup to map semester_id to actual semester_number (1-8)
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

  // Handle Checkbox Toggling Optimistically
  const handleToggleTopic = async (subjectIdStr: string, unitId: number, topicIndex: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;

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

    await toggleTopicCompletion(unitId, topicIndex, newStatus);
  };

  const toggleSubject = (id: string) => setExpandedSubject(expandedSubject === id ? null : id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6 xl:px-8">
      
      {/* PAGE HEADER & SEMESTER PROGRESSION */}
      <div className="bg-zinc-950 border border-border p-6 sm:p-8 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00BC7D]/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Curriculum Matrix
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-2">
            Active <span className="text-[#00BC7D]">Vectors.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl text-xs sm:text-sm mx-auto md:mx-0">
            Track your synchronization progress across all registered modules and check off topics as you complete them.
          </p>
        </div>

        {/* 8-Semester Tracking Grid */}
        <div className="relative z-10 grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 border-t border-border/50 pt-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => {
            const prog = semesterProgress[semNum];
            const isActive = prog.total > 0;
            
            return (
              <div 
                key={semNum} 
                className={`p-3 sm:p-4 rounded-2xl transition-all ${isActive ? 'bg-zinc-900 border border-border/80' : 'bg-transparent border border-dashed border-border/30 opacity-40'}`}
              >
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Sem 0{semNum}
                </div>
                <div className="text-lg sm:text-xl font-black tabular-nums text-foreground mb-3">
                  {prog.percent}%
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
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

      {/* FILTER & SEARCH BAR WITH CUSTOM DROPDOWNS */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search subjects by name or code..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:border-[#00BC7D] transition-colors shadow-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <CustomSelect 
            label="Branch"
            placeholder="All Branches"
            value={branchId}
            onChange={(val: any) => { setBranchId(val ? Number(val) : ""); setSubjectId(""); }}
            options={taxonomy.branches.map((b: any) => ({ label: b.code, value: b.id }))}
          />
          <CustomSelect 
            label="Semester"
            placeholder="All Semesters"
            value={semesterId}
            onChange={(val: any) => { setSemesterId(val ? Number(val) : ""); setSubjectId(""); }}
            options={taxonomy.semesters.map((s: any) => ({ label: `Semester ${s.semester_number}`, value: s.id }))}
          />
          <CustomSelect 
            label="Subject Filter"
            placeholder="All Subjects"
            value={subjectId}
            onChange={(val: any) => setSubjectId(val ? Number(val) : "")}
            options={filteredTaxonomySubjects.map((sub: any) => ({ label: sub.course_title, value: sub.id }))}
            disabled={!branchId || !semesterId}
          />
        </div>
      </div>

      {/* CURRICULUM GRID */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50 mb-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Matrix...</span>
          </div>
        ) : (!branchId || !semesterId) ? (
          <div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[300px] animate-in fade-in">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6"><Filter className="w-10 h-10 text-muted-foreground opacity-50" /></div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">Filter Parameters Required</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Please select your Branch and Semester from the filters above to load the appropriate curriculum matrix.</p>
          </div>
        ) : filteredCurriculum.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[300px] opacity-80">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-1">No Active Subjects</h2>
            <p className="text-sm text-muted-foreground">No subjects found matching your current filter configuration.</p>
          </div>
        ) : (
          filteredCurriculum.map((subject) => {
            const isExpanded = expandedSubject === subject.id;

            return (
              <div key={subject.id} className={`bg-card border transition-all duration-300 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden ${isExpanded ? 'border-[#00BC7D]/50 shadow-[0_0_30px_rgba(0,188,125,0.1)]' : 'border-border hover:border-zinc-700'}`}>
                {/* Subject Header */}
                <div onClick={() => toggleSubject(subject.id)} className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 cursor-pointer select-none group">
                  <div className={`hidden md:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-[#00BC7D]/10 text-[#00BC7D]' : 'bg-zinc-100 dark:bg-zinc-900 border border-border text-muted-foreground group-hover:text-foreground'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-muted-foreground">{subject.code}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{subject.completedSubjectTopics} / {subject.totalSubjectTopics} Topics Secured</span>
                    </div>
                    <h2 className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight truncate transition-colors ${isExpanded ? 'text-[#00BC7D]' : 'text-foreground'}`}>{subject.title}</h2>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                    <div className="w-full sm:w-32 flex-1 sm:flex-none">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sync</span>
                        <span className="text-[10px] sm:text-xs font-black tabular-nums text-foreground">{subject.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00BC7D] rounded-full transition-all duration-1000 ease-out" style={{ width: `${subject.progress}%` }} />
                      </div>
                    </div>
                    <div className={`w-8 h-8 shrink-0 rounded-full border border-border flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-zinc-100 dark:bg-zinc-800' : ''}`}><ChevronDown className="w-4 h-4 text-muted-foreground" /></div>
                  </div>
                </div>

                {/* Expanded Syllabus & Topics */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 pt-0 sm:pt-2">
                        <div className="h-px w-full bg-border mb-4 sm:mb-6" />
                        
                        <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syllabus Matrix</div>
                        
                        {/* EXPANDED GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                          {subject.units.length === 0 ? (
                            <p className="text-xs font-bold text-muted-foreground col-span-full">No units mapped for this subject yet.</p>
                          ) : (
                            subject.units.map((unit: any) => {
                              const isUnitComplete = unit.totalTopics > 0 && unit.completedTopics === unit.totalTopics;

                              return (
                                <div key={unit.id} className={`p-4 rounded-2xl border transition-all ${isUnitComplete ? 'bg-[#00BC7D]/5 border-[#00BC7D]/20' : 'bg-background border-border'}`}>
                                  {/* Unit Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="text-xs sm:text-sm font-bold text-foreground">{unit.title}</p>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Unit 0{unit.number}</p>
                                    </div>
                                    {isUnitComplete ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#00BC7D]" />
                                    ) : (
                                      <span className="text-xs font-bold text-muted-foreground">{unit.completedTopics} / {unit.totalTopics}</span>
                                    )}
                                  </div>

                                  {/* Topics Checkbox List */}
                                  <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-border/50">
                                    {unit.topics.length === 0 ? (
                                      <p className="text-xs text-muted-foreground italic">No topics extracted from unit content.</p>
                                    ) : (
                                      unit.topics.map((topic: any) => (
                                        <div 
                                          key={topic.id} 
                                          onClick={() => handleToggleTopic(subject.id, unit.id, topic.id, topic.completed)}
                                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors group/topic"
                                        >
                                          <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${topic.completed ? 'bg-[#00BC7D] border-[#00BC7D] text-white' : 'border-zinc-400 group-hover/topic:border-[#00BC7D]'}`}>
                                            {topic.completed && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                          </div>
                                          <span className={`text-xs sm:text-sm leading-snug select-none transition-colors ${topic.completed ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>
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

                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Materials & Resources</div>
                        <SubjectResources subjectId={subject.rawId} />

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