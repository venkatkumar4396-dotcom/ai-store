"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Info,
  ChevronRight,
  Award,
  CheckCircle2,
  PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed";
  dueDate?: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  targetDate?: string;
  progress: number;
}

interface TimeSlot {
  time: string;
  activity: string;
  duration: string;
  priority: "low" | "medium" | "high" | "urgent";
}

interface DailyScheduleData {
  date: string;
  headline: string;
  timeSlots: TimeSlot[];
  coachingTip: string;
}

export default function ProductivityPage() {
  const { addToast } = useToast();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [schedule, setSchedule] = React.useState<DailyScheduleData | null>(null);

  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = React.useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = React.useState(false);

  // Task Form State
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskPriority, setTaskPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskDueDate, setTaskDueDate] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);

  // Goal Form State
  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalTargetDate, setGoalTargetDate] = React.useState("");
  const [isAddingGoal, setIsAddingGoal] = React.useState(false);

  // Pomodoro State
  const [timerTime, setTimerTime] = React.useState(25 * 60); // 25 minutes
  const [timerActive, setTimerActive] = React.useState(false);
  const [timerMode, setTimerMode] = React.useState<"work" | "short" | "long">("work");

  // Focus Execution State
  const [activeFocusActivity, setActiveFocusActivity] = React.useState<string | null>(null);
  const [activeFocusTaskId, setActiveFocusTaskId] = React.useState<string | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = React.useState(false);
  const [completedActivityName, setCompletedActivityName] = React.useState("");
  const [completedTaskId, setCompletedTaskId] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadTasks();
    loadGoals();
    loadTodaySchedule();
  }, []);

  // Pomodoro countdown effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime((prev) => prev - 1);
      }, 1000);
    } else if (timerTime === 0) {
      setTimerActive(false);
      // Play a small sound or notify the user
      addToast({
        type: "success",
        title: "Timer Finished!",
        description: `Pomodoro timer for ${timerMode === "work" ? "work block" : "break"} finished!`,
      });
      if (timerMode === "work" && activeFocusActivity) {
        setCompletedActivityName(activeFocusActivity);
        setCompletedTaskId(activeFocusTaskId);
        setShowCompletionDialog(true);
      }
      resetTimer(timerMode);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerTime, timerMode, activeFocusActivity, activeFocusTaskId]);

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await api.get("/agents/productivity/tasks");
      setTasks(res.data || []);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadGoals = async () => {
    setIsLoadingGoals(true);
    try {
      const res = await api.get("/agents/productivity/goals");
      setGoals(res.data || []);
    } catch (e) {
      console.error("Failed to load goals", e);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const loadTodaySchedule = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await api.get(`/agents/productivity/schedule/${today}`);
      if (res.data && res.data.tasks) {
        setSchedule(JSON.parse(res.data.tasks));
      }
    } catch (e) {
      // No schedule yet, that is fine
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      const res = await api.post("/agents/productivity/tasks", {
        title: taskTitle,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      setTasks((prev) => [res.data, ...prev]);
      setTaskTitle("");
      setTaskDueDate("");
      setTaskPriority("medium");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string) => {
    let newStatus: "todo" | "in_progress" | "completed" = "in_progress";
    if (currentStatus === "todo") {
      newStatus = "in_progress";
    } else if (currentStatus === "in_progress") {
      newStatus = "completed";
    } else if (currentStatus === "completed") {
      newStatus = "todo";
    }

    try {
      const res = await api.put(`/agents/productivity/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/agents/productivity/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setIsAddingGoal(true);
    try {
      const res = await api.post("/agents/productivity/goals", {
        title: goalTitle,
        targetDate: goalTargetDate || undefined,
        progress: 0,
      });
      setGoals((prev) => [res.data, ...prev]);
      setGoalTitle("");
      setGoalTargetDate("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, value: number) => {
    try {
      const res = await api.put(`/agents/productivity/goals/${goalId}`, { progress: value });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? res.data : g)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.delete(`/agents/productivity/goals/${goalId}`);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateSchedule = async () => {
    setIsGeneratingSchedule(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await api.post("/agents/productivity/schedule", { date: today });
      if (res.data && res.data.tasks) {
        setSchedule(JSON.parse(res.data.tasks));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // Timer utilities
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = (mode: "work" | "short" | "long" = "work", clearFocus = false) => {
    setTimerActive(false);
    setTimerMode(mode);
    if (mode === "work") setTimerTime(25 * 60);
    else if (mode === "short") setTimerTime(5 * 60);
    else if (mode === "long") setTimerTime(15 * 60);
    if (clearFocus) {
      setActiveFocusActivity(null);
      setActiveFocusTaskId(null);
    }
  };

  const parseDuration = (durationStr: string): number => {
    const match = durationStr.match(/(\d+)\s*(min|hour|hr)/i);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit.startsWith("hour") || unit.startsWith("hr")) {
        return value * 60 * 60;
      }
      return value * 60;
    }
    return 25 * 60; // Fallback to 25 mins
  };

  const handleExecuteSlot = async (slot: TimeSlot) => {
    try {
      // 1. Find or create task
      let targetTask = tasks.find(
        (t) => t.title.toLowerCase() === slot.activity.toLowerCase()
      );

      if (targetTask) {
        // Update existing task status to in_progress if not already in_progress/completed
        if (targetTask.status !== "in_progress" && targetTask.status !== "completed") {
          const res = await api.put(`/agents/productivity/tasks/${targetTask.id}`, {
            status: "in_progress",
          });
          targetTask = res.data;
          setTasks((prev) => prev.map((t) => (t.id === targetTask!.id ? res.data : t)));
          addToast({
            type: "success",
            title: "Task In Progress",
            description: `"${targetTask?.title}" has been moved to In Progress.`,
          });
        }
      } else {
        // Create new task in progress
        const res = await api.post("/agents/productivity/tasks", {
          title: slot.activity,
          priority: slot.priority || "medium",
          status: "in_progress",
        });
        targetTask = res.data;
        setTasks((prev) => [res.data, ...prev]);
        addToast({
          type: "success",
          title: "Task Created",
          description: `"${targetTask?.title}" has been added and moved to In Progress.`,
        });
      }

      // 2. Associate focus timer with this task/activity
      setActiveFocusActivity(slot.activity);
      setActiveFocusTaskId(targetTask ? targetTask.id : null);
      
      // Parse duration and start timer
      const durationSeconds = 3; // Temporarily 3s for testing
      setTimerTime(durationSeconds);
      setTimerMode("work");
      setTimerActive(true);

      addToast({
        type: "success",
        title: "Focus Started",
        description: `Timer set to ${slot.duration} for "${slot.activity}".`,
      });
    } catch (e: any) {
      console.error("Failed to execute schedule slot", e);
      addToast({
        type: "error",
        title: "Execution Failed",
        description: e.response?.data?.error || e.message || "Something went wrong.",
      });
    }
  };

  const handleCompleteFocusedTask = async () => {
    if (!completedTaskId) {
      setShowCompletionDialog(false);
      return;
    }
    try {
      const res = await api.put(`/agents/productivity/tasks/${completedTaskId}`, {
        status: "completed",
      });
      setTasks((prev) => prev.map((t) => (t.id === completedTaskId ? res.data : t)));
      addToast({
        type: "success",
        title: "Task Completed",
        description: `"${res.data.title}" has been marked as Completed!`,
      });
    } catch (e: any) {
      console.error("Failed to complete focused task", e);
      addToast({
        type: "error",
        title: "Update Failed",
        description: e.response?.data?.error || e.message || "Failed to mark task as completed.",
      });
    } finally {
      setShowCompletionDialog(false);
      setCompletedTaskId(null);
      setCompletedActivityName("");
      // Clear focus state on timer
      setActiveFocusActivity(null);
      setActiveFocusTaskId(null);
    }
  };

  // Organize tasks by column
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "medium":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
            Productivity Agent <CheckSquare className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Build high-performance tasks, prioritize goals, and let AI structure your day dynamically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-xs">
            <Zap className="h-3.5 w-3.5 text-cyan-400" /> Focus Engine Enabled
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Planner & Focus Timer */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pomodoro Timer */}
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" /> Pomodoro Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4 text-center">
              <span className="text-4xl font-black font-mono tracking-wider text-white">
                {formatTime(timerTime)}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mt-1.5">
                {timerMode === "work" ? "Focus Interval" : timerMode === "short" ? "Short Break" : "Long Break"}
              </span>

              {activeFocusActivity && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full max-w-[95%]">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                  <span className="truncate" title={activeFocusActivity}>Focusing: {activeFocusActivity}</span>
                </div>
              )}

              {/* Mode Selectors */}
              <div className="flex gap-1 mt-4 p-0.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <button
                  onClick={() => resetTimer("work", true)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    timerMode === "work" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Work
                </button>
                <button
                  onClick={() => resetTimer("short", true)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    timerMode === "short" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Short Break
                </button>
                <button
                  onClick={() => resetTimer("long", true)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    timerMode === "long" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Long Break
                </button>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-3 mt-5">
                <Button
                  onClick={() => setTimerActive(!timerActive)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-4 rounded-lg flex items-center gap-1.5"
                >
                  {timerActive ? (
                    <>
                      <Pause className="h-3.5 w-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" /> Focus
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => resetTimer(timerMode, true)}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-900/40 h-9 w-9 p-0 rounded-lg"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI schedule block */}
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" /> Daily Planner
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Sequences active tasks into an optimal day plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!schedule ? (
                <div className="text-center py-4 space-y-4">
                  <Compass className="h-10 w-10 mx-auto text-zinc-700 animate-pulse" />
                  <Button
                    onClick={handleGenerateSchedule}
                    disabled={isGeneratingSchedule}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    {isGeneratingSchedule ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Structuring Itinerary...
                      </>
                    ) : (
                      "Generate AI Schedule"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Focus Directive</p>
                    <p className="text-xs font-bold text-white mt-0.5 italic">"{schedule.headline}"</p>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {schedule.timeSlots.map((slot, idx) => {
                      const isExecuting = timerActive && activeFocusActivity === slot.activity;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-2 border-l pl-3 relative py-1.5 transition-all rounded-r-md ${
                            isExecuting
                              ? "border-emerald-500 bg-emerald-950/10"
                              : "border-zinc-800 hover:bg-zinc-900/30"
                          }`}
                        >
                          <div
                            className={`absolute -left-[5.5px] top-4.5 h-2.5 w-2.5 rounded-full bg-zinc-950 border ${
                              isExecuting ? "border-emerald-400 animate-pulse" : "border-indigo-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-zinc-500 leading-none flex items-center gap-1.5">
                              <span>{slot.time}</span>
                              <span className="text-[9px] px-1 bg-zinc-900 text-zinc-400 rounded-sm">{slot.duration}</span>
                            </p>
                            <p
                              className={`text-xs font-semibold mt-1 leading-tight truncate ${
                                isExecuting ? "text-emerald-400" : "text-zinc-200"
                              }`}
                              title={slot.activity}
                            >
                              {slot.activity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isExecuting ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTimerActive(false)}
                                className="h-7 w-7 p-0 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md"
                                title="Pause execution"
                              >
                                <Pause className="h-3 w-3 animate-pulse" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleExecuteSlot(slot)}
                                className="h-7 w-7 p-0 hover:bg-emerald-500/10 hover:text-emerald-400 text-zinc-500 rounded-md"
                                title="Execute task (moves to In Progress and starts focus)"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-900 pt-3 text-[11px] text-zinc-400 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{schedule.coachingTip}</span>
                  </div>

                  <Button
                    onClick={handleGenerateSchedule}
                    disabled={isGeneratingSchedule}
                    variant="outline"
                    className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/40 text-xs py-1.5 h-8 rounded-lg"
                  >
                    {isGeneratingSchedule ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sequencing...
                      </>
                    ) : (
                      "Regenerate Plan"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Kanban Board and Goals */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="bg-zinc-900/60 border border-zinc-800/80 p-0.5 rounded-lg mb-6">
              <TabsTrigger value="tasks" className="rounded-md text-xs py-1.5">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="goals" className="rounded-md text-xs py-1.5">
                Target Goals
              </TabsTrigger>
            </TabsList>

            {/* TASKS VIEW */}
            <TabsContent value="tasks" className="space-y-4 outline-none">
              {/* Task Creation Form */}
              <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">Add New Focus Item</label>
                      <Input
                        placeholder="E.g., Complete backend travel routes..."
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Priority</label>
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as any)}
                          className="w-full h-10 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="low" className="bg-zinc-950">Low</option>
                          <option value="medium" className="bg-zinc-950">Medium</option>
                          <option value="high" className="bg-zinc-950">High</option>
                          <option value="urgent" className="bg-zinc-950">Urgent</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Due Date</label>
                        <Input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg h-10 text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isAddingTask}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 rounded-lg transition-all"
                    >
                      {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" /> Add Task</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Kanban Column Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* TO DO COLUMN */}
                <Card className="bg-zinc-950/20 border-zinc-900">
                  <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-zinc-500" />
                      <span className="font-bold text-sm text-zinc-350">To Do</span>
                    </div>
                    <Badge className="bg-zinc-900 text-zinc-400 border border-zinc-850 hover:bg-zinc-900 font-mono text-[10px]">
                      {todoTasks.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {todoTasks.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No tasks waiting.</p>
                    ) : (
                      todoTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-zinc-900/35 border border-zinc-900 hover:border-zinc-800 rounded-lg flex flex-col gap-2 transition-all"
                        >
                          <p className="text-xs font-semibold text-white leading-tight">{t.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <Badge className={`border px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                                size="sm"
                                className="h-6 px-2 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-white text-[10px] font-bold"
                              >
                                Start
                              </Button>
                              <Button
                                onClick={() => handleDeleteTask(t.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-zinc-800 hover:text-white text-zinc-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* IN PROGRESS COLUMN */}
                <Card className="bg-zinc-950/20 border-zinc-900">
                  <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="font-bold text-sm text-indigo-300">In Progress</span>
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-900 font-mono text-[10px]">
                      {inProgressTasks.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {inProgressTasks.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">Nothing currently in progress.</p>
                    ) : (
                      inProgressTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-zinc-900/35 border border-zinc-900 hover:border-zinc-800 rounded-lg flex flex-col gap-2 transition-all"
                        >
                          <p className="text-xs font-semibold text-white leading-tight">{t.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <Badge className={`border px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                                size="sm"
                                className="h-6 px-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-400 hover:text-white text-[10px] font-bold"
                              >
                                Done
                              </Button>
                              <Button
                                onClick={() => handleDeleteTask(t.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-zinc-800 hover:text-white text-zinc-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* COMPLETED COLUMN */}
                <Card className="bg-zinc-950/20 border-zinc-900">
                  <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-sm text-emerald-400">Completed</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 hover:bg-zinc-900 font-mono text-[10px]">
                      {completedTasks.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {completedTasks.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No completed items.</p>
                    ) : (
                      completedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-zinc-900/10 border border-zinc-950 rounded-lg flex flex-col gap-2 opacity-60"
                        >
                          <p className="text-xs font-semibold text-zinc-350 line-through leading-tight">{t.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <Badge className="bg-zinc-900 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded text-[8px] uppercase">
                              Done
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[9px] hover:text-white"
                              >
                                Reopen
                              </Button>
                              <Button
                                onClick={() => handleDeleteTask(t.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-zinc-800 hover:text-white text-zinc-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* GOALS VIEW */}
            <TabsContent value="goals" className="space-y-4 outline-none">
              <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">What is your core target goal?</label>
                      <Input
                        placeholder="E.g., Launch Nexora marketplace beta..."
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">Target Date</label>
                      <Input
                        type="date"
                        value={goalTargetDate}
                        onChange={(e) => setGoalTargetDate(e.target.value)}
                        className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg h-10 text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isAddingGoal}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 rounded-lg transition-all"
                    >
                      {isAddingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4 mr-1.5" /> Create Goal</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Goal List */}
              <div className="space-y-4">
                {isLoadingGoals ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
                  </div>
                ) : goals.length === 0 ? (
                  <Card className="bg-zinc-950/20 border-zinc-900 py-10 text-center">
                    <Award className="h-10 w-10 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No active goals yet. Add one above to start tracking progress.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((g) => {
                      const dateStr = g.targetDate
                        ? new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "No deadline";

                      return (
                        <Card key={g.id} className="bg-zinc-950/30 border-zinc-900 hover:border-zinc-850 transition-all p-5">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm">{g.title}</h4>
                              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Target Date: {dateStr}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleDeleteGoal(g.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-md"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Progress bar and update slider */}
                          <div className="mt-5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-semibold">Progress</span>
                              <span className="font-mono font-extrabold text-indigo-400">{g.progress}%</span>
                            </div>
                            <div className="relative">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={g.progress}
                                onChange={(e) => handleUpdateGoalProgress(g.id, Number(e.target.value))}
                                className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Focus Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="bg-zinc-950 border border-zinc-900 text-white max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400 animate-bounce" /> Focus Session Complete!
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-2">
              Congratulations! You focused on <strong>"{completedActivityName}"</strong>. Would you like to mark this task as completed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
              className="bg-transparent border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              Keep In Progress
            </Button>
            <Button
              onClick={handleCompleteFocusedTask}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
