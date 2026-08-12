"use client";

import * as React from "react";
import { FileSearch, Sparkles, Plus, AlertCircle, RefreshCw, Layers, FolderOpen } from "lucide-react";
import { UploadZone } from "@/components/file-tracker/UploadZone";
import { FileGrid } from "@/components/file-tracker/FileGrid";
import { ActivityTimeline } from "@/components/file-tracker/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FileTracker, FileActivity } from "@/types";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";

export default function FileTrackerDashboardPage() {
  const { addToast } = useToast();
  const [files, setFiles] = React.useState<FileTracker[]>([]);
  const [activities, setActivities] = React.useState<FileActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selectedFile, setSelectedFile] = React.useState<FileTracker | null>(null);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = React.useState(false);
  const [selectedFileActivities, setSelectedFileActivities] = React.useState<FileActivity[]>([]);

  // Create tracker dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newTrackerName, setNewTrackerName] = React.useState("");
  const [newTrackerDesc, setNewTrackerDesc] = React.useState("");
  const [newTrackerPath, setNewTrackerPath] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Fetch all trackers from the backend
  const fetchTrackers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/file-tracker");
      const mapped: FileTracker[] = data.map((t: any) => ({
        id: t.id,
        fileName: t.name,
        fileType: "folder",
        fileSize: t.fileCount || 0,
        path: t.watchPath,
        status: t.status === "active" ? "monitoring" : t.status === "inactive" ? "paused" : "archived",
        lastModified: t.lastActivityAt || t.updatedAt || t.createdAt,
        changeCount: t._count?.activities || 0,
        createdAt: t.createdAt,
      }));
      setFiles(mapped);
    } catch (err) {
      console.error("Failed to fetch trackers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent activities across all trackers
  const fetchAllActivities = async () => {
    try {
      // Fetch activities for each tracker and merge
      const { data: trackers } = await api.get("/file-tracker");
      const allActivities: FileActivity[] = [];

      for (const tracker of trackers.slice(0, 5)) {
        try {
          const { data: acts } = await api.get(`/file-tracker/${tracker.id}/activities?limit=10`);
          for (const act of acts) {
            allActivities.push({
              id: act.id,
              fileId: act.trackerId,
              action: act.action as FileActivity["action"],
              description: act.details || `${act.action} ${act.fileName}`,
              user: "system-agent",
              timestamp: act.timestamp,
              metadata: act.fileSize ? { fileSize: act.fileSize, fileType: act.fileType } : undefined,
            });
          }
        } catch {
          // Skip individual tracker errors
        }
      }

      // Sort by timestamp descending
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities.slice(0, 20));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  React.useEffect(() => {
    fetchTrackers();
    fetchAllActivities();
  }, []);

  // Create a new tracker
  const handleCreateTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackerName || !newTrackerPath) return;

    setIsCreating(true);
    try {
      await api.post("/file-tracker", {
        name: newTrackerName,
        description: newTrackerDesc || undefined,
        watchPath: newTrackerPath,
      });
      setNewTrackerName("");
      setNewTrackerDesc("");
      setNewTrackerPath("");
      setIsCreateDialogOpen(false);
      await fetchTrackers();
      await fetchAllActivities();
      addToast({ type: "success", title: "Tracker Created", description: `Active monitor created for ${newTrackerName}.` });
    } catch (err: any) {
      console.error("Failed to create tracker:", err);
      addToast({ type: "error", title: "Creation Failed", description: err.response?.data?.error || err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpload = async (uploadedFiles: File[]) => {
    const file = uploadedFiles[0];
    if (!file || files.length === 0) {
      addToast({ type: "warning", title: "No Trackers", description: "Please create a tracker first before uploading files." });
      return;
    }

    // Upload to the first active tracker
    const activeTracker = files.find(f => f.status === "monitoring") || files[0];
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/file-tracker/${activeTracker.id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchTrackers();
      await fetchAllActivities();
      addToast({ type: "success", title: "File Uploaded", description: `File uploaded to ${activeTracker.fileName}.` });
    } catch (err: any) {
      console.error("Failed to upload file:", err);
      addToast({ type: "error", title: "Upload Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: FileTracker["status"]) => {
    try {
      const endpoint = currentStatus === "monitoring" ? "stop" : "start";
      await api.post(`/file-tracker/${id}/${endpoint}`);
      await fetchTrackers();
      addToast({ type: "success", title: "Status Updated", description: `Tracker ${currentStatus === "monitoring" ? "paused" : "started"} successfully.` });
    } catch (err: any) {
      console.error("Failed to toggle tracker:", err);
      addToast({ type: "error", title: "Update Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.post(`/file-tracker/${id}/stop`);
      await fetchTrackers();
    } catch (err: any) {
      console.error("Failed to archive tracker:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracker?")) return;
    try {
      await api.delete(`/file-tracker/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setActivities((prev) => prev.filter((a) => a.fileId !== id));
      addToast({ type: "success", title: "Tracker Deleted", description: "Tracker instance removed from database." });
    } catch (err: any) {
      console.error("Failed to delete tracker:", err);
      addToast({ type: "error", title: "Delete Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleViewLogs = async (file: FileTracker) => {
    setSelectedFile(file);
    setIsLogsDialogOpen(true);

    try {
      const { data: acts } = await api.get(`/file-tracker/${file.id}/activities?limit=50`);
      const mapped: FileActivity[] = acts.map((act: any) => ({
        id: act.id,
        fileId: act.trackerId,
        action: act.action as FileActivity["action"],
        description: act.details || `${act.action} ${act.fileName}`,
        user: "system-agent",
        timestamp: act.timestamp,
        metadata: act.fileSize ? { fileSize: act.fileSize, fileType: act.fileType } : undefined,
      }));
      setSelectedFileActivities(mapped);
    } catch (err) {
      console.error("Failed to fetch file activities:", err);
      setSelectedFileActivities([]);
    }
  };

  // Create lookup map of fileId to fileName
  const fileNameMap = React.useMemo(() => {
    return files.reduce<Record<string, string>>((acc, f) => {
      acc[f.id] = f.fileName;
      return acc;
    }, {});
  }, [files]);

  return (
    <div className="space-y-6 text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Ghost File Tracker <FileSearch className="h-5.5 w-5.5 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Audit and track file changes on your local filesystem using automated AI change detection agents.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus className="h-4 w-4 mr-1.5" /> Create Tracker
        </Button>
      </div>

      {/* Upload Zone & Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <UploadZone onUpload={handleUpload} />
        </div>

        <Card className="border border-white/10 bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <CardHeader>
            <CardTitle className="text-base text-white">Monitoring Policies</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              Active change detection heuristics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 text-xs text-zinc-400">
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold shrink-0">SHA-256:</span>
              <span>Calculates file checksums on changes to avoid duplicate reports.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold shrink-0">POLLING:</span>
              <span>Polled every 15s (local dev sandbox) with high-speed alerts.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold shrink-0">DIFFS:</span>
              <span>Visual change reports rendered per lines modified.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid displaying tracked files */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-indigo-400" />
          Tracked Files
        </h2>

        {isLoading ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-zinc-950/20 max-w-md mx-auto space-y-3">
            <RefreshCw className="h-8 w-8 text-indigo-400 mx-auto animate-spin" />
            <span className="font-semibold block">Loading Trackers...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-zinc-950/20 max-w-md mx-auto space-y-3">
            <FolderOpen className="h-8 w-8 text-zinc-500 mx-auto" />
            <span className="font-semibold block">No Trackers Created</span>
            <p className="text-xs text-zinc-400">Click "Create Tracker" to start monitoring a directory.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="border-white/10 hover:bg-white/5 text-zinc-300">
              <Plus className="h-4 w-4 mr-1" /> Create Your First Tracker
            </Button>
          </div>
        ) : (
          <FileGrid
            files={files}
            onToggleStatus={handleToggleStatus}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onViewDetails={handleViewLogs}
          />
        )}
      </div>

      {/* Activity Timeline */}
      <div className="border-t border-white/5 pt-6">
        <ActivityTimeline activities={activities} fileNameMap={fileNameMap} />
      </div>

      {/* Create Tracker Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg bg-zinc-950 border border-white/10 text-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Tracker</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-1">
              Specify a directory path to monitor for file changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTracker} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tracker-name">Tracker Name *</Label>
              <Input
                id="tracker-name"
                placeholder="e.g. Project Documents"
                value={newTrackerName}
                onChange={(e) => setNewTrackerName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracker-desc">Description</Label>
              <Input
                id="tracker-desc"
                placeholder="Optional description..."
                value={newTrackerDesc}
                onChange={(e) => setNewTrackerDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracker-path">Watch Directory Path *</Label>
              <Input
                id="tracker-path"
                placeholder="e.g. C:/work/data or ./watched-folder"
                value={newTrackerPath}
                onChange={(e) => setNewTrackerPath(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-mono text-sm"
                required
              />
              <p className="text-[11px] text-zinc-500">If the directory doesn't exist, it will be created automatically.</p>
            </div>

            <DialogFooter className="border-t border-white/5 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/10 text-zinc-300">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newTrackerName || !newTrackerPath} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {isCreating ? "Creating..." : "Create Tracker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Details Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border border-white/10 text-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedFile?.fileName} - Audit Logs
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-1">
              Path: {selectedFile?.path}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-4 pr-1 py-2 text-sm">
            {selectedFileActivities.length === 0 ? (
              <span className="text-zinc-500 block text-center py-4">No audit logs for this tracker.</span>
            ) : (
              selectedFileActivities.map((act) => (
                <div key={act.id} className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-indigo-300">{act.description}</span>
                    <span className="text-zinc-500">
                      {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 flex gap-4 pt-1">
                    <span>User: {act.user}</span>
                    <span className="capitalize">Action: {act.action}</span>
                  </div>
                  {act.metadata && (
                    <pre className="text-[10px] text-zinc-500 bg-zinc-950 p-2 rounded mt-2 border border-white/5 font-mono overflow-x-auto">
                      {JSON.stringify(act.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-white/5 pt-4">
            <Button onClick={() => setIsLogsDialogOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Close Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
