"use client";

import { useState, useEffect } from "react";
import { Folder, FileText, Trash2, FolderPlus, ArrowLeft, MoveRight, Eye, X, Edit2, CheckSquare, Square, FolderSearch } from "lucide-react";
import { toast } from "sonner";
import { getTaxonomy } from "@/app/actions/upload"; 
import { getDirectoryContents, createFolder, deleteFiles, moveFiles, getAllSubjectFolders, renameFile } from "@/app/actions/explorer";

export default function RearrangePage() {
  const [taxonomy, setTaxonomy] = useState({ branches: [], semesters: [], subjects: [] });
  const [branchId, setBranchId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([{ id: null, name: "Root" }]);
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Mass Selection State
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Modals
  const [moveModal, setMoveModal] = useState<{ isOpen: boolean, fileIds: string[] } | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean, fileId: string, currentName: string, newName: string } | null>(null);

  // Move target state
  const [destBranchId, setDestBranchId] = useState<number | "">("");
  const [destSemesterId, setDestSemesterId] = useState<number | "">("");
  const [destSubjectId, setDestSubjectId] = useState<number | "">("");
  const [destFolderId, setDestFolderId] = useState<string | "root">("root");
  const [destFolders, setDestFolders] = useState<any[]>([]);

  useEffect(() => { getTaxonomy().then((data: any) => setTaxonomy(data)); }, []);

  useEffect(() => {
    if (subjectId) loadContents();
    else setContents({ folders: [], files: [] });
    // Clear selection when navigating
    setSelectedFiles([]);
    setLastSelectedIndex(null);
  }, [subjectId, currentFolderId]);

  useEffect(() => {
    if (destSubjectId) {
      getAllSubjectFolders(Number(destSubjectId)).then(data => setDestFolders(data));
      setDestFolderId("root");
    }
  }, [destSubjectId]);

  const loadContents = async () => {
    setLoading(true);
    const data = await getDirectoryContents(Number(subjectId), currentFolderId);
    setContents({ folders: data.folders as never[], files: data.files as never[] });
    setLoading(false);
  };

  const filteredSubjects = taxonomy.subjects.filter((s: any) => s.branch_id === Number(branchId) && s.semester_id === Number(semesterId));
  const destFilteredSubjects = taxonomy.subjects.filter((s: any) => s.branch_id === Number(destBranchId) && s.semester_id === Number(destSemesterId));

  // --- SELECTION LOGIC (Shift-Click Mass Select) ---
  const toggleFileSelection = (fileId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    let newSelection = [...selectedFiles];

    if (event.shiftKey && lastSelectedIndex !== null) {
      // Mass select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const filesInRange = contents.files.slice(start, end + 1).map((f: any) => f.id);
      
      // Add missing files from range
      filesInRange.forEach(id => { if (!newSelection.includes(id)) newSelection.push(id); });
    } else {
      // Standard toggle
      if (newSelection.includes(fileId)) {
        newSelection = newSelection.filter(id => id !== fileId);
      } else {
        newSelection.push(fileId);
      }
    }
    setSelectedFiles(newSelection);
    setLastSelectedIndex(index);
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === contents.files.length) setSelectedFiles([]); // deselect all
    else setSelectedFiles(contents.files.map((f: any) => f.id));
  };

  // --- HANDLERS ---
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || !branchId || !semesterId || !subjectId) return;
    const res = await createFolder({ name: newFolderName, branchId: Number(branchId), semesterId: Number(semesterId), subjectId: Number(subjectId), parentId: currentFolderId });
    if (res.error) toast.error(res.error);
    else { toast.success("Folder created!"); setNewFolderName(""); loadContents(); }
  };

  const handleDeleteFiles = async (fileIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${fileIds.length} file(s) permanently?`)) return;
    const res = await deleteFiles(fileIds);
    if (res.error) toast.error(res.error);
    else { toast.success("Deleted successfully."); setSelectedFiles([]); loadContents(); }
  };

  const handleRenameConfirm = async () => {
    if (!renameModal || !renameModal.newName.trim()) return;
    const res = await renameFile(renameModal.fileId, renameModal.newName);
    if (res.error) toast.error(res.error);
    else { toast.success("File renamed!"); setRenameModal(null); loadContents(); }
  };

  const handleMoveConfirm = async () => {
    if (!moveModal || !destSubjectId) return;
    const targetFolder = destFolderId === "root" ? null : destFolderId;
    const res = await moveFiles(moveModal.fileIds, Number(destSubjectId), targetFolder);
    if (res.error) toast.error(res.error);
    else { toast.success(`${moveModal.fileIds.length} file(s) moved!`); setMoveModal(null); setSelectedFiles([]); loadContents(); }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 relative">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground mb-2">File Manager</h1>
        <p className="text-sm text-muted-foreground">Reorganize, rename, and manage your resources.</p>
      </div>

      {/* LOCATION SELECTOR */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Branch</label>
          <select value={branchId} onChange={(e) => { setBranchId(e.target.value ? Number(e.target.value) : ""); setSubjectId(""); }} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-2 px-4 text-sm font-bold outline-none focus:border-blue-500 transition-colors">
            <option value="">Select Branch...</option>
            {taxonomy.branches.map((b: any) => <option key={b.id} value={b.id}>{b.code}</option>)}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Semester</label>
          <select value={semesterId} onChange={(e) => { setSemesterId(e.target.value ? Number(e.target.value) : ""); setSubjectId(""); }} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-2 px-4 text-sm font-bold outline-none focus:border-blue-500 transition-colors">
            <option value="">Select Sem...</option>
            {taxonomy.semesters.map((s: any) => <option key={s.id} value={s.id}>Sem {s.semester_number}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Subject</label>
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : ""); setCurrentFolderId(null); setFolderHistory([{id: null, name: "Root"}]); }} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-2 px-4 text-sm font-bold outline-none focus:border-blue-500 transition-colors disabled:opacity-50" disabled={!branchId || !semesterId}>
            <option value="">Select Subject to Open...</option>
            {filteredSubjects.map((sub: any) => <option key={sub.id} value={sub.id}>{sub.course_title}</option>)}
          </select>
        </div>
      </div>

      {/* EXPLORER UI OR EMPTY STATE */}
      {!subjectId ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            <FolderSearch className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Location Selected</h2>
          <p className="text-sm text-muted-foreground max-w-sm">Please select a Branch, Semester, and Subject from the dropdown menus above to view and organize your files.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          {/* BULK ACTION BAR */}
          {selectedFiles.length > 0 && (
            <div className="bg-blue-600/10 border-b border-blue-500/20 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 px-2">{selectedFiles.length} file(s) selected</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => { 
                    setDestBranchId(branchId); 
                    setDestSemesterId(semesterId); 
                    setDestSubjectId(subjectId); 
                    setMoveModal({ isOpen: true, fileIds: selectedFiles }); 
                  }} 
                  className="flex-1 sm:flex-none justify-center bg-background border border-border px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <MoveRight className="w-4 h-4" /> Move
                </button>
                <button onClick={() => handleDeleteFiles(selectedFiles)} className="flex-1 sm:flex-none justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button onClick={() => setSelectedFiles([])} className="p-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* EXPLORER TOOLBAR */}
          <div className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-border p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button onClick={() => {
                if (folderHistory.length <= 1) return;
                const newHistory = [...folderHistory];
                newHistory.pop(); 
                setFolderHistory(newHistory);
                setCurrentFolderId(newHistory[newHistory.length - 1].id);
              }} disabled={folderHistory.length <= 1} className="p-2 bg-background border border-border rounded-lg disabled:opacity-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-mono flex flex-wrap items-center gap-2 text-muted-foreground">
                {folderHistory.map((hist, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span>/</span>}
                    <span className={`truncate max-w-[150px] sm:max-w-[200px] ${idx === folderHistory.length - 1 ? "text-foreground font-bold" : ""}`}>{hist.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Folder Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto justify-end">
              {contents.files.length > 0 && (
                <button onClick={selectAllFiles} className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 sm:w-auto w-full">
                  {selectedFiles.length === contents.files.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} Select All
                </button>
              )}
              <form onSubmit={handleCreateFolder} className="flex gap-2 w-full sm:w-auto">
                <input type="text" placeholder="New folder..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none w-full sm:w-32 lg:w-40 focus:border-blue-500" />
                <button type="submit" disabled={!newFolderName} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shrink-0">
                  <FolderPlus className="w-4 h-4" /> Add
                </button>
              </form>
            </div>
          </div>

          {/* EXPLORER GRID */}
          <div className="p-4 flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-full text-muted-foreground text-sm font-bold py-12">Loading directory...</div>
            ) : contents.folders.length === 0 && contents.files.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground text-sm font-bold py-12 opacity-60">
                <Folder className="w-12 h-12 mb-3" />
                This folder is empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Render Folders */}
                {contents.folders.map((folder: any) => (
                  <div key={folder.id} onDoubleClick={() => {setCurrentFolderId(folder.id); setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);}} className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition group select-none relative overflow-hidden">
                    <Folder className="w-8 h-8 text-blue-500 fill-blue-500/20 shrink-0" />
                    <span className="font-bold text-sm truncate flex-1" title={folder.name}>{folder.name}</span>
                    
                    {/* Mobile helper to tap instead of double-click */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentFolderId(folder.id); setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);}} 
                      className="md:hidden absolute inset-0 w-full h-full opacity-0"
                    />
                  </div>
                ))}

                {/* Render Files */}
                {contents.files.map((file: any, index: number) => {
                  const isSelected = selectedFiles.includes(file.id);
                  return (
                    <div key={file.id} onClick={(e) => toggleFileSelection(file.id, index, e)} className={`bg-background border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition group relative ${isSelected ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)] bg-blue-50/50 dark:bg-blue-500/5' : 'border-border hover:border-zinc-400'}`}>
                      
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 right-3 text-muted-foreground">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 opacity-0 group-hover:opacity-100 md:opacity-0 opacity-40 transition" />}
                      </div>

                      <div className="flex items-start gap-3 mb-4 pr-6">
                        <FileText className={`w-8 h-8 shrink-0 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`} />
                        <span className="font-semibold text-xs text-muted-foreground break-all line-clamp-2 select-none" title={file.file_name}>{file.file_name}</span>
                      </div>
                      
                      {/* Individual File Actions (Hide when bulk selecting) */}
                      {selectedFiles.length === 0 && (
                        <div className="flex gap-1 sm:gap-2 justify-end border-t border-border pt-3 mt-auto md:opacity-0 opacity-100 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                          <button onClick={() => window.open(file.cloudinary_url, "_blank")} className="p-1.5 sm:p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-md transition" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setRenameModal({ isOpen: true, fileId: file.id, currentName: file.file_name, newName: file.file_name })} className="p-1.5 sm:p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-md transition" title="Rename"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => { setDestBranchId(branchId); setDestSemesterId(semesterId); setDestSubjectId(subjectId); setMoveModal({ isOpen: true, fileIds: [file.id] }); }} className="p-1.5 sm:p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition" title="Move"><MoveRight className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteFiles([file.id])} className="p-1.5 sm:p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold mb-4">Rename File</h2>
            <input type="text" value={renameModal.newName} onChange={(e) => setRenameModal({...renameModal, newName: e.target.value})} className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none mb-6" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setRenameModal(null)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-foreground py-2 rounded-lg text-sm font-bold transition">Cancel</button>
              <button onClick={handleRenameConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE MODAL */}
      {moveModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Move {moveModal.fileIds.length} File(s)</h2>
              <button onClick={() => setMoveModal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Branch</label>
                <select value={destBranchId} onChange={(e) => setDestBranchId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500">
                  <option value="">Select Branch...</option>
                  {taxonomy.branches.map((b: any) => <option key={b.id} value={b.id}>{b.code}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Semester</label>
                <select value={destSemesterId} onChange={(e) => setDestSemesterId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500">
                  <option value="">Select Sem...</option>
                  {taxonomy.semesters.map((s: any) => <option key={s.id} value={s.id}>Sem {s.semester_number}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Subject</label>
                <select value={destSubjectId} onChange={(e) => setDestSubjectId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50" disabled={!destBranchId || !destSemesterId}>
                  <option value="">Select Subject...</option>
                  {destFilteredSubjects.map((sub: any) => <option key={sub.id} value={sub.id}>{sub.course_title}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Folder</label>
                <select value={destFolderId} onChange={(e) => setDestFolderId(e.target.value)} className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50" disabled={!destSubjectId}>
                  <option value="root">/ Root (Main Directory)</option>
                  {destFolders.map((f: any) => <option key={f.id} value={f.id}>/ {f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setMoveModal(null)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground py-2.5 rounded-lg text-sm font-bold transition">Cancel</button>
              <button onClick={handleMoveConfirm} disabled={!destSubjectId} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 transition">Confirm Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}