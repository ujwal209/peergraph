"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FolderUp, Loader2, Database, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getTaxonomy, saveMaterialRecord } from "@/app/actions/upload";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; // Must be an Unsigned preset

export default function UploadPage() {
  // Taxonomy Data
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);

  // Form State
  const [branchId, setBranchId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");

  // Progress State
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Load Data on Mount
  useEffect(() => {
    async function loadData() {
      const data = await getTaxonomy();
      setBranches(data.branches);
      setSemesters(data.semesters);
      setSubjects(data.subjects);
    }
    loadData();
  }, []);

  // Filter subjects when branch or sem changes
  useEffect(() => {
    if (branchId && semesterId) {
      const filtered = subjects.filter(s => s.branch_id === Number(branchId) && s.semester_id === Number(semesterId));
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
    setSubjectId(""); 
  }, [branchId, semesterId, subjects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !branchId || !semesterId || !subjectId) {
      toast.error("Please fill all metadata fields and select files/folder.");
      return;
    }

    setStatus("uploading");
    setProgress({ current: 0, total: files.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: "POST", body: formData }
        );

        const cloudData = await cloudRes.json();
        if (!cloudRes.ok) throw new Error(cloudData.error?.message);

        // 2. Save DB Record & Trigger Gemini Embeddings
        const dbResult = await saveMaterialRecord({
          fileName: file.webkitRelativePath || file.name, 
          cloudinaryUrl: cloudData.secure_url,
          branchId: Number(branchId),
          semesterId: Number(semesterId),
          subjectId: Number(subjectId)
        });

        if (dbResult.error) throw new Error(dbResult.error);
        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        errorCount++;
      }
      setProgress({ current: i + 1, total: files.length });
    }

    setStatus("success");
    if (errorCount === 0) {
      toast.success(`Successfully vectorized ${successCount} documents via Gemini.`);
    } else {
      toast.warning(`Uploaded ${successCount} files. ${errorCount} failed.`);
    }

    setTimeout(() => {
      setStatus("idle");
      setFiles([]);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-8 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#00BC7D]/10 border border-[#00BC7D]/30 flex items-center justify-center">
            <Database className="w-6 h-6 text-[#00BC7D]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">Data Ingestion Node</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Powered by Google Gemini Vector Engine</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-8">
          {/* DYNAMIC METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Branch</label>
              <select 
                value={branchId} onChange={(e) => setBranchId(Number(e.target.value))} disabled={status !== "idle"}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#00BC7D] transition-colors appearance-none"
              >
                <option value="">Select Branch...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Semester</label>
              <select 
                value={semesterId} onChange={(e) => setSemesterId(Number(e.target.value))} disabled={status !== "idle"}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#00BC7D] transition-colors appearance-none"
              >
                <option value="">Select Sem...</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>Semester {s.semester_number}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
              <select 
                value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))} disabled={status !== "idle" || !branchId || !semesterId}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#00BC7D] transition-colors appearance-none disabled:opacity-50"
              >
                <option value="">Select Subject...</option>
                {filteredSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.course_code}: {sub.course_title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* UPLOAD MODE TOGGLE & DROPZONE */}
          <div>
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => { setUploadMode("files"); setFiles([]); }} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors ${uploadMode === 'files' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-muted-foreground'}`}>Files</button>
              <button type="button" onClick={() => { setUploadMode("folder"); setFiles([]); }} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors ${uploadMode === 'folder' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-muted-foreground'}`}>Entire Folder</button>
            </div>

            <div className="relative">
              <input 
                type="file" 
                multiple 
                {...(uploadMode === "folder" ? { webkitdirectory: "", directory: "" } as any : {})}
                onChange={handleFileChange}
                disabled={status !== "idle"}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              
              <div className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors ${files.length > 0 ? 'border-[#00BC7D] bg-[#00BC7D]/5' : 'border-border bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-500'}`}>
                {files.length > 0 ? (
                  <>
                    <div className="flex -space-x-3 mb-4">
                      {files.slice(0, 3).map((f, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl bg-background border border-border shadow-md flex items-center justify-center"><FileText className="w-5 h-5 text-[#00BC7D]" /></div>
                      ))}
                      {files.length > 3 && (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-border shadow-md flex items-center justify-center text-xs font-bold">+{files.length - 3}</div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground">{files.length} items staged for ingestion</p>
                  </>
                ) : (
                  <>
                    {uploadMode === "folder" ? <FolderUp className="w-10 h-10 text-muted-foreground mb-3" /> : <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />}
                    <p className="text-sm font-bold text-foreground">Click to select {uploadMode === "folder" ? "a folder" : "files"}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Will automatically extract all valid documents</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Indicator & Submit */}
          <Button 
            type="submit" 
            disabled={status !== "idle" || files.length === 0}
            className="w-full h-14 bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] transition-all disabled:opacity-100"
          >
            {status === "idle" && "Initiate Batch Upload"}
            {status === "uploading" && (
              <div className="flex items-center gap-3 w-full px-4">
                <Loader2 className="w-4 h-4 animate-spin" /> 
                <span className="flex-1 text-left">Vectorizing {progress.current} of {progress.total}...</span>
                <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                </div>
              </div>
            )}
            {status === "success" && <><CheckCircle2 className="w-4 h-4 mr-2" /> Synced to Database</>}
          </Button>

        </form>
      </motion.div>
    </div>
  );
}