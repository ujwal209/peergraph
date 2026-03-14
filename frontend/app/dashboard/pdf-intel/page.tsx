"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/searchable-select";
import { 
  FileText, Send, User, Loader2, BookOpen, 
  MessageSquare, Menu, X, Database, ChevronUp, FilePlus, CloudUpload,
  Globe, Search, Copy, Check, RefreshCw, FileQuestion, Plus,
  Folder, Clock, Edit2, Trash2, Library,ExternalLink 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- MEMOIZED MESSAGE COMPONENT TO FIX EXTREME TYPING LAG ---
const ChatMessage = memo(({ msg, index, isLast, copyToClipboard, copiedIndex, handleRegenerate }: any) => {
  return (
    <div className={`flex gap-4 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {/* Avatar (Left side for AI) */}
      {msg.role === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-[#00BC7D] flex items-center justify-center text-white shrink-0 mt-1 shadow-[0_0_15px_rgba(0,188,125,0.3)]">
           <Library className="w-4 h-4" />
        </div>
      )}
      
      {/* Message Bubble - WIDENED FULLY FOR AI */}
      <div className={`flex flex-col min-w-0 ${msg.role === "user" ? "items-end max-w-[85%] sm:max-w-[70%]" : "items-start w-full sm:max-w-[95%] lg:max-w-[100%]"}`}>
          <div className={`py-3 text-sm sm:text-base leading-relaxed w-full min-w-0 ${
            msg.role === "user" 
            ? "dark:bg-zinc-800 bg-gray-200 dark:text-zinc-100 text-gray-900 px-5 rounded-2xl rounded-tr-sm shadow-md inline-block w-auto" 
            : "bg-transparent dark:text-zinc-200 text-gray-800 px-0"
          }`}>
              {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              ) : (
                  <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed dark:prose-pre:bg-zinc-900/80 prose-pre:bg-gray-100 prose-pre:border dark:prose-pre:border-zinc-800/50 prose-pre:border-gray-200 prose-pre:shadow-sm prose-code:text-[#00BC7D] dark:prose-code:bg-[#00BC7D]/10 prose-code:bg-[#00BC7D]/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md w-full break-words overflow-hidden">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
              )}
          </div>

          {/* Assistant Action Buttons */}
          {msg.role === "assistant" && (
              <div className="flex items-center gap-1.5 mt-2">
                  <button 
                      onClick={() => copyToClipboard(msg.content, index)}
                      className="p-1.5 dark:text-zinc-500 text-gray-400 dark:hover:text-zinc-300 hover:text-gray-700 dark:hover:bg-zinc-800/80 hover:bg-gray-200 rounded-lg transition-colors border border-transparent dark:hover:border-zinc-700 hover:border-gray-300"
                      title="Copy"
                  >
                      {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-[#00BC7D]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {isLast && (
                      <button 
                          onClick={handleRegenerate}
                          className="p-1.5 dark:text-zinc-500 text-gray-400 dark:hover:text-zinc-300 hover:text-gray-700 dark:hover:bg-zinc-800/80 hover:bg-gray-200 rounded-lg transition-colors border border-transparent dark:hover:border-zinc-700 hover:border-gray-300"
                          title="Regenerate"
                      >
                          <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                  )}
              </div>
          )}
      </div>

      {/* Avatar (Right side for User) */}
      {msg.role === "user" && (
        <div className="w-8 h-8 rounded-full dark:bg-zinc-800 bg-gray-200 flex items-center justify-center dark:text-zinc-300 text-gray-600 shrink-0 mt-1 border dark:border-zinc-700 border-gray-300 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
});
ChatMessage.displayName = "ChatMessage";
// -------------------------------------------------------------

export default function DocumentIntelligencePage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [context, setContext] = useState({ semesterId: "", subjectId: "", unitId: "" });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "history">("library");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState("");

  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { if (!isInitialLoading) loadMaterials(); }, [context.semesterId, context.subjectId, context.unitId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isChatting]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  }, [input]);

  async function loadInitialData() {
    setIsInitialLoading(true);
    const tax = await apiClient.get("/curriculum/taxonomy");
    if (!tax.error) setTaxonomy(tax);
    await Promise.all([loadMaterials(), loadSessions()]);
    setIsInitialLoading(false);
  }

  async function loadMaterials() {
    setIsMaterialsLoading(true);
    let url = "/upload/list?";
    if (context.semesterId) url += `semester_id=${context.semesterId}&`;
    if (context.subjectId) url += `subject_id=${context.subjectId}&`;
    if (context.unitId) url += `unit_id=${context.unitId}`;
    const mats = await apiClient.get(url);
    if (mats.materials) setMaterials(mats.materials);
    setIsMaterialsLoading(false);
  }

  async function loadSessions() {
    setIsSessionsLoading(true);
    const res = await apiClient.get("/ai/sessions");
    if (!res.error && res.sessions) setSessions(res.sessions);
    setIsSessionsLoading(false);
  }

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  async function handleSelectSession(session: any) {
    setSessionId(session.id);
    const matchedMat = materials.find(m => session.title?.includes(m.file_name));
    if (matchedMat) setSelectedMaterial(matchedMat);
    else if (!selectedMaterial && materials.length > 0) setSelectedMaterial(materials[0]);

    setIsChatting(true);
    setMessages([]); 
    const res = await apiClient.get(`/ai/sessions/${session.id}/messages`);
    if (!res.error && res.messages) {
         setMessages(res.messages.map((m: any) => ({ role: m.role, content: m.content })));
    } else {
         toast.error("Could not load chat history");
    }
    setIsChatting(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }

  async function renameSession(id: string, newTitle: string) {
    if (!newTitle.trim()) { setEditingSessionId(null); return; }
    await apiClient.patch(`/ai/sessions/${id}`, { title: newTitle });
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    setEditingSessionId(null);
    toast.success("Chat renamed");
  }

  async function deleteSession(id: string) {
    if (!window.confirm("Delete this chat?")) return;
    await apiClient.delete(`/ai/sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (sessionId === id) startNewChat();
    toast.success("Chat deleted");
  }

  async function renameMaterial(id: string, newName: string) {
    if (!newName.trim()) { setEditingMaterialId(null); return; }
    await apiClient.patch(`/upload/pdf/${id}`, { file_name: newName });
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, file_name: newName } : m));
    if (selectedMaterial?.id === id) setSelectedMaterial({ ...selectedMaterial, file_name: newName });
    setEditingMaterialId(null);
    toast.success("Document renamed");
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !context.subjectId || !context.semesterId) return toast.error("Context required");
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file); fd.append("branch_id", "1"); fd.append("semester_id", context.semesterId); fd.append("subject_id", context.subjectId);
      const res = await apiClient.upload("/upload/pdf", fd);
      if (res.success) { loadMaterials(); setShowUploadForm(false); toast.success("Uploaded!"); } else { toast.error("Upload failed"); }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function sendMessageToAPI(userMessage: string, history: any[]) {
    setIsChatting(true);
    const result = await apiClient.post("/ai/pdf-chat", { material_id: selectedMaterial.id, message: userMessage, session_id: sessionId });
    if (!result.error && !result.detail) {
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      if (result.session_id && result.session_id !== sessionId) {
          setSessionId(result.session_id);
          loadSessions(); 
      }
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing request." }]);
    }
    setIsChatting(false);
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedMaterial || isChatting) return;
    const userMsgContent = input.trim();
    const newHistory = [...messages, { role: "user", content: userMsgContent }];
    setMessages(newHistory); setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessageToAPI(userMsgContent, newHistory);
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isChatting) return;
    const lastUserIndex = messages.map(m => m.role).lastIndexOf("user");
    if (lastUserIndex === -1) return;
    const newHistory = messages.slice(0, lastUserIndex + 1);
    setMessages(newHistory);
    await sendMessageToAPI(messages[lastUserIndex].content, newHistory);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text); setCopiedIndex(index);
    toast.success("Copied"); setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const semesterOptions = taxonomy?.semesters?.map((sem: any) => ({ value: sem.id.toString(), label: `Semester ${sem.semester_number}` })) || [];
  const filterSubjects = taxonomy?.subjects?.filter((s: any) => !context.semesterId || s.semester_id?.toString() === context.semesterId);
  const subjectOptions = filterSubjects?.map((sub: any) => ({ value: sub.id.toString(), label: sub.course_title })) || [];
  const filterUnits = taxonomy?.units?.filter((u: any) => !context.subjectId || u.subject_id?.toString() === context.subjectId);
  const unitOptions = filterUnits?.map((u: any) => ({ value: u.id.toString(), label: `Unit ${u.unit_number}: ${u.unit_title}` })) || [];

  // Apply Search Filter
  const filteredMaterials = materials.filter(m => m.file_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSessions = sessions.filter(s => (s.title || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase()));

  if (isInitialLoading) {
    return (
      <div className="flex-1 h-[calc(100vh-80px)] dark:bg-[#09090b] bg-gray-50 flex items-center justify-center overflow-hidden">
         <Loader2 className="w-8 h-8 text-[#00BC7D] animate-spin" />
      </div>
    );
  }

  // ENTIRE LAYOUT IS LOCKED: h-[calc...], max-h-[calc...], overflow-hidden.
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] w-full dark:bg-[#09090b] bg-white dark:text-zinc-100 text-gray-900 overflow-hidden font-sans relative">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 dark:bg-zinc-950 bg-gray-50 border-b dark:border-zinc-800 border-gray-200 z-50 shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00BC7D]" /> Document Intel
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="dark:text-zinc-400 text-gray-600 dark:hover:text-white hover:text-gray-900">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar - STRICTLY fixed flex column */}
      <aside className={cn(
        "fixed inset-0 lg:relative lg:inset-auto z-40 lg:z-10 w-full lg:w-[340px] xl:w-[360px] border-r dark:border-zinc-800/80 border-gray-200 flex flex-col dark:bg-[#09090b] bg-gray-50 transition-transform duration-300 transform shrink-0 h-full overflow-hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* New Chat Button Area */}
        <div className="p-4 border-b dark:border-zinc-800/50 border-gray-200 shrink-0 pt-16 lg:pt-4">
          <Button 
             onClick={startNewChat}
             className="w-full dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-300 dark:hover:border-[#00BC7D]/50 hover:border-[#00BC7D] dark:hover:bg-zinc-800 hover:bg-gray-50 dark:text-zinc-100 text-gray-900 justify-start h-11 transition-all shadow-sm"
          >
             <Plus className="w-4 h-4 mr-2 text-[#00BC7D]" />
             New Intel Session
          </Button>
        </div>

        {/* Context & Upload Area */}
        <div className="p-4 border-b dark:border-zinc-800/50 border-gray-200 space-y-4 shrink-0 dark:bg-zinc-950/30 bg-gray-100/50">
            <div className="flex items-center justify-between">
                <div className="text-xs dark:text-zinc-400 text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Study Context
                </div>
                <button 
                   onClick={() => setShowUploadForm(!showUploadForm)}
                   className="text-xs text-[#00BC7D] font-semibold flex items-center gap-1 hover:text-[#009e69] transition-colors"
                >
                   {showUploadForm ? <ChevronUp className="w-3.5 h-3.5" /> : <FilePlus className="w-3.5 h-3.5" />}
                   {showUploadForm ? "Hide" : "Upload"}
                </button>
            </div>
            
            <div className="space-y-2.5">
                <SearchableSelect options={semesterOptions} value={context.semesterId} onValueChange={(val) => setContext(prev => ({ ...prev, semesterId: val, subjectId: "", unitId: "" }))} placeholder="Select Semester" className="h-10 text-sm rounded-lg dark:bg-zinc-900 bg-white dark:border-zinc-800 border-gray-300" />
                <SearchableSelect options={subjectOptions} value={context.subjectId} onValueChange={(val) => setContext(prev => ({ ...prev, subjectId: val, unitId: "" }))} placeholder="Select Subject" className="h-10 text-sm rounded-lg dark:bg-zinc-900 bg-white dark:border-zinc-800 border-gray-300" disabled={!context.semesterId} />
                <SearchableSelect options={unitOptions} value={context.unitId} onValueChange={(val) => setContext(prev => ({ ...prev, unitId: val }))} placeholder="Select Unit" className="h-10 text-sm rounded-lg dark:bg-zinc-900 bg-white dark:border-zinc-800 border-gray-300" disabled={!context.subjectId} />
            </div>

            {showUploadForm && (
                <div className="pt-2 animate-in slide-in-from-top duration-200">
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !context.subjectId} className="w-full bg-[#00BC7D] hover:bg-[#009e69] text-white font-bold text-sm h-11 rounded-lg transition-colors disabled:opacity-50">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CloudUpload className="w-4.5 h-4.5 mr-2" />}
                        {isUploading ? "Extracting Vectors..." : "Upload Document"}
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </div>
            )}
        </div>

        {/* Tabs & Search Area */}
        <div className="px-4 pt-4 pb-3 shrink-0">
            <div className="flex dark:bg-zinc-900 bg-gray-200 p-1 rounded-lg border dark:border-zinc-800 border-gray-300 mb-3">
                <button onClick={() => { setActiveTab("library"); setSearchQuery(""); }} className={cn("flex-1 text-xs font-semibold py-1.5 rounded-md flex items-center justify-center gap-2 transition-all", activeTab === "library" ? "dark:bg-zinc-800 bg-white dark:text-zinc-100 text-gray-900 shadow-sm" : "dark:text-zinc-500 text-gray-500 dark:hover:text-zinc-300 hover:text-gray-700")}>
                    <Folder className="w-3.5 h-3.5" /> Library
                </button>
                <button onClick={() => { setActiveTab("history"); setSearchQuery(""); }} className={cn("flex-1 text-xs font-semibold py-1.5 rounded-md flex items-center justify-center gap-2 transition-all", activeTab === "history" ? "dark:bg-zinc-800 bg-white dark:text-zinc-100 text-gray-900 shadow-sm" : "dark:text-zinc-500 text-gray-500 dark:hover:text-zinc-300 hover:text-gray-700")}>
                    <Clock className="w-3.5 h-3.5" /> History
                </button>
            </div>
            {/* Live Filter Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-500 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm dark:text-zinc-200 text-gray-900 focus:outline-none focus:border-[#00BC7D]/50 focus:ring-1 focus:ring-[#00BC7D]/20 transition-all dark:placeholder:text-zinc-600 placeholder:text-gray-400"
                />
            </div>
        </div>

        {/* MIN-H-0 is critical to prevent flex container from blowing out of viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 min-h-0">
            {activeTab === "library" ? (
                <div className="space-y-1">
                    {isMaterialsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin dark:text-zinc-500 text-gray-400" /></div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="text-center py-8 border dark:border-zinc-800/50 border-gray-200 rounded-xl dark:bg-zinc-900/30 bg-gray-50">
                            <p className="dark:text-zinc-500 text-gray-500 text-sm">No documents found.</p>
                        </div>
                    ) : (
                        filteredMaterials.map((mat) => (
                        <div key={mat.id} className="relative group">
                            <div
                                onClick={() => {
                                    if (editingMaterialId === mat.id) return;
                                    setSelectedMaterial(mat);
                                    startNewChat();
                                }}
                                className={`w-full cursor-pointer text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${
                                    selectedMaterial?.id === mat.id && !sessionId
                                    ? "dark:bg-zinc-800/80 bg-gray-200 dark:text-zinc-100 text-gray-900 border dark:border-zinc-700/50 border-gray-300 shadow-sm" 
                                    : "dark:text-zinc-400 text-gray-600 dark:hover:bg-zinc-900 hover:bg-gray-100 dark:hover:text-zinc-200 hover:text-gray-900 border border-transparent"
                                }`}
                            >
                                <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${selectedMaterial?.id === mat.id && !sessionId ? "text-[#00BC7D]" : "dark:text-zinc-500 text-gray-400"}`} />
                                <div className="flex flex-col overflow-hidden w-full pr-6">
                                    {editingMaterialId === mat.id ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editingMaterialName}
                                                onChange={(e) => setEditingMaterialName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && renameMaterial(mat.id, editingMaterialName)}
                                                className="flex-1 dark:bg-zinc-950 bg-white border border-[#00BC7D]/50 text-sm rounded px-1.5 py-0.5 dark:text-zinc-100 text-gray-900 focus:outline-none"
                                            />
                                            <button onClick={(e) => { e.stopPropagation(); renameMaterial(mat.id, editingMaterialName); }} className="text-[#00BC7D]"><Check className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <span className="truncate text-sm font-medium">{mat.file_name}</span>
                                    )}
                                </div>
                            </div>
                            {/* Edit Button overlay */}
                            {!editingMaterialId && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingMaterialId(mat.id);
                                        setEditingMaterialName(mat.file_name);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 dark:text-zinc-500 text-gray-400 dark:hover:text-zinc-300 hover:text-gray-700 dark:hover:bg-zinc-700 hover:bg-gray-200 rounded-md transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-1">
                    {isSessionsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin dark:text-zinc-500 text-gray-400" /></div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-8 border dark:border-zinc-800/50 border-gray-200 rounded-xl dark:bg-zinc-900/30 bg-gray-50">
                            <p className="dark:text-zinc-500 text-gray-500 text-sm">No chat history found.</p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => (
                        <div key={session.id} className="relative group">
                            <div
                                onClick={() => {
                                    if (editingSessionId === session.id) return;
                                    handleSelectSession(session);
                                }}
                                className={`w-full cursor-pointer text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${
                                    sessionId === session.id 
                                    ? "dark:bg-zinc-800/80 bg-gray-200 dark:text-zinc-100 text-gray-900 border dark:border-zinc-700/50 border-gray-300 shadow-sm" 
                                    : "dark:text-zinc-400 text-gray-600 dark:hover:bg-zinc-900 hover:bg-gray-100 dark:hover:text-zinc-200 hover:text-gray-900 border border-transparent"
                                }`}
                            >
                                <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${sessionId === session.id ? "text-[#00BC7D]" : "dark:text-zinc-500 text-gray-400"}`} />
                                <div className="flex flex-col overflow-hidden w-full pr-14">
                                    {editingSessionId === session.id ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editingSessionTitle}
                                                onChange={(e) => setEditingSessionTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && renameSession(session.id, editingSessionTitle)}
                                                className="flex-1 dark:bg-zinc-950 bg-white border border-[#00BC7D]/50 text-sm rounded px-1.5 py-0.5 dark:text-zinc-100 text-gray-900 focus:outline-none"
                                            />
                                            <button onClick={(e) => { e.stopPropagation(); renameSession(session.id, editingSessionTitle); }} className="text-[#00BC7D]"><Check className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="truncate text-sm font-medium">{session.title || "Untitled Chat"}</span>
                                            <span className="text-[10px] dark:text-zinc-500 text-gray-400 mt-1">{new Date(session.created_at).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Edit/Delete Actions */}
                            {!editingSessionId && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingSessionId(session.id);
                                            setEditingSessionTitle(session.title || "Untitled Chat");
                                        }}
                                        className="p-1.5 dark:text-zinc-500 text-gray-400 dark:hover:text-zinc-300 hover:text-gray-700 dark:hover:bg-zinc-700 hover:bg-gray-200 rounded-md"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-md"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </aside>

      {/* Main Chat Area - STRICTLY fixed flex column, min-w-0 prevents flex overflow */}
      <main className="flex-1 flex flex-col h-full min-w-0 dark:bg-[#09090b] bg-white relative overflow-hidden">
        
        {/* Empty State */}
        {!selectedMaterial ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative h-full overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#00BC7D]/5 blur-[100px] sm:blur-[150px] rounded-full pointer-events-none" />
             <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 sm:w-24 sm:h-24 dark:bg-zinc-900/60 bg-gray-50/80 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center border dark:border-zinc-800/50 border-gray-200 mb-6 shadow-2xl group hover:border-[#00BC7D]/40 transition-all duration-500 hover:scale-105">
                    <Library className="w-10 h-10 dark:text-zinc-600 text-gray-400 group-hover:text-[#00BC7D] transition-colors" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter dark:text-white text-gray-900 mb-4">Neural Library</h3>
                <p className="dark:text-zinc-500 text-gray-500 text-center max-w-[340px] leading-relaxed font-medium text-sm sm:text-base">
                    Initialize a document cluster from the sidebar to start high-fidelity academic retrieval.
                </p>
             </div>
          </div>
        ) : (
          <>
            {/* Top Bar for Context */}
            <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b dark:border-zinc-800/80 border-gray-200 dark:bg-[#09090b]/80 bg-white/80 backdrop-blur-md shrink-0 z-10">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-[#00BC7D] shrink-0" />
                <h3 className="font-medium dark:text-zinc-200 text-gray-800 text-sm truncate">
                  {selectedMaterial.file_name}
                </h3>
              </div>
              <a 
                 href={selectedMaterial.cloudinary_url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 px-3 py-1.5 dark:bg-zinc-900 bg-gray-100 dark:hover:bg-zinc-800 hover:bg-gray-200 border dark:border-zinc-800 border-gray-300 rounded-lg text-xs font-medium transition-colors dark:text-zinc-400 text-gray-600 dark:hover:text-zinc-200 hover:text-gray-900 shrink-0"
              >
                 <ExternalLink className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">Source PDF</span>
              </a>
            </header>

            {/* Chat History List - MIN-H-0 is critical here to prevent pushing boundaries */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 md:px-12 lg:px-16 pt-8 w-full min-h-0 z-0">
              <div className="max-w-5xl mx-auto pb-4">
                
                {/* First-time greeting */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-14 h-14 dark:bg-zinc-900/60 bg-gray-100 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 border dark:border-zinc-800/60 border-gray-300 shadow-xl">
                        <MessageSquare className="w-6 h-6 text-[#00BC7D]" />
                    </div>
                    <h4 className="text-xl font-bold dark:text-zinc-100 text-gray-900 mb-2 tracking-tight">System Synchronized</h4>
                    <p className="dark:text-zinc-400 text-gray-500 text-sm max-w-md leading-relaxed">
                        Currently interrogating <span className="text-[#00BC7D] font-semibold">{selectedMaterial.file_name}</span>. 
                        Feel free to ask for complex explanations, data extraction, or detailed summaries.
                    </p>
                  </div>
                )}
                
                {/* Messages Mapping */}
                {messages.map((msg, i) => (
                  <ChatMessage 
                      key={i} 
                      msg={msg} 
                      index={i} 
                      isLast={i === messages.length - 1}
                      copyToClipboard={copyToClipboard}
                      copiedIndex={copiedIndex}
                      handleRegenerate={handleRegenerate}
                  />
                ))}
                
                {/* Typing Indicator */}
                {isChatting && (
                  <div className="flex gap-4 w-full animate-in fade-in duration-300 mb-6">
                     <div className="w-8 h-8 rounded-full bg-[#00BC7D] flex items-center justify-center text-white shrink-0 mt-1 shadow-[0_0_15px_rgba(0,188,125,0.4)]">
                         <Library className="w-4 h-4" />
                     </div>
                     <div className="flex items-center gap-2.5 px-6 py-4 dark:bg-zinc-900/40 bg-gray-100 border dark:border-zinc-800/60 border-gray-300 rounded-3xl rounded-tl-none backdrop-blur-md shadow-sm w-fit">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#00BC7D] opacity-80">Synthesizing</span>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00BC7D] animate-bounce [animation-duration:800ms]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00BC7D] animate-bounce [animation-duration:800ms] [animation-delay:200ms]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00BC7D] animate-bounce [animation-duration:800ms] [animation-delay:400ms]" />
                        </div>
                     </div>
                  </div>
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Premium Input Bar - STRICTLY pinned to bottom */}
            <div className="p-4 sm:px-8 sm:pb-8 sm:pt-4 dark:bg-gradient-to-t dark:from-[#09090b] dark:via-[#09090b] dark:to-transparent bg-white shrink-0 z-20">
              <div className="max-w-4xl mx-auto relative">
                <div className={cn(
                    "flex flex-col dark:bg-zinc-900/70 bg-gray-50 backdrop-blur-3xl border transition-all duration-300 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
                    "dark:border-zinc-800 border-gray-300 focus-within:border-[#00BC7D]/40 focus-within:ring-4 focus-within:ring-[#00BC7D]/10 dark:focus-within:bg-zinc-900/90 focus-within:bg-white"
                )}>
                    <textarea 
                        ref={textareaRef}
                        placeholder="Message Neural Engine..."
                        className="w-full bg-transparent border-none py-5 px-6 sm:px-8 dark:text-zinc-100 text-gray-900 dark:placeholder:text-zinc-500 placeholder:text-gray-400 text-base sm:text-lg focus:outline-none resize-none custom-scrollbar leading-relaxed"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    
                    {/* Bottom Action Bar inside Input */}
                    <div className="flex items-center justify-between px-3 sm:px-5 pb-3 sm:pb-4 pt-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button 
                                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all border",
                                    isWebSearchEnabled 
                                    ? "bg-[#00BC7D]/10 text-[#00BC7D] border-[#00BC7D]/30" 
                                    : "dark:bg-zinc-800/40 bg-gray-200 dark:text-zinc-400 text-gray-600 border-transparent dark:hover:bg-zinc-800 hover:bg-gray-300 dark:hover:text-zinc-300 hover:text-gray-800"
                                )}
                            >
                                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Web Search</span>
                            </button>
                            <button 
                                onClick={() => setIsDeepResearchEnabled(!isDeepResearchEnabled)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all border",
                                    isDeepResearchEnabled 
                                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/30" 
                                    : "dark:bg-zinc-800/40 bg-gray-200 dark:text-zinc-400 text-gray-600 border-transparent dark:hover:bg-zinc-800 hover:bg-gray-300 dark:hover:text-zinc-300 hover:text-gray-800"
                                )}
                            >
                                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Deep Research</span>
                            </button>
                        </div>

                        <button 
                            onClick={handleSendMessage}
                            disabled={isChatting || !input.trim()}
                            className={cn(
                                "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0",
                                input.trim() 
                                ? "bg-[#00BC7D] text-white hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,188,125,0.3)]" 
                                : "dark:bg-zinc-800 bg-gray-300 dark:text-zinc-600 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                        </button>
                    </div>
                </div>
                <div className="text-center mt-3 sm:mt-4">
                    <span className="text-[10px] dark:text-zinc-600 text-gray-400 uppercase tracking-widest font-semibold">
                        AI CAN MAKE MISTAKES. VERIFY IMPORTANT DATA.
                    </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}