"use client";

import * as React from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  allowedExtensions?: string[];
  maxSizeMb?: number;
}

export function UploadZone({ onUpload, allowedExtensions = ["json", "csv", "txt", "pdf"], maxSizeMb = 10 }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadedFileName, setUploadedFileName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(Array.from(e.target.files));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }

    setUploadedFileName(file.name);
    setUploadStatus("uploading");
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus("success");
          onUpload(files);
          setTimeout(() => setUploadStatus("idle"), 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={status === "uploading" ? undefined : triggerFileInput}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[200px] text-white",
          isDragActive
            ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5"
            : "border-white/10 bg-zinc-950/20 hover:border-white/20 hover:bg-zinc-950/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={allowedExtensions.map((e) => `.${e}`).join(",")}
        />

        {uploadStatus === "idle" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto group-hover:text-white transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold">
                Drag & drop file here or <span className="text-indigo-400 hover:underline">browse</span>
              </span>
              <p className="text-xs text-zinc-500 leading-normal">
                Supported formats: {allowedExtensions.map((e) => e.toUpperCase()).join(", ")} up to {maxSizeMb}MB
              </p>
            </div>
          </div>
        )}

        {uploadStatus === "uploading" && (
          <div className="space-y-4 w-full max-w-xs">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 font-semibold truncate block">
                Uploading {uploadedFileName}...
              </span>
              <Progress value={uploadProgress} className="h-1.5 bg-zinc-800" />
            </div>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-white">Upload Complete!</span>
              <p className="text-xs text-zinc-400">{uploadedFileName} successfully parsed.</p>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-white">Upload Failed</span>
              <p className="text-xs text-zinc-400">Invalid format or size limit exceeded.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
