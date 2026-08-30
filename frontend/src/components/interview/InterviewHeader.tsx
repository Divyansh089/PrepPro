"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Clock,
  Brain,
} from "lucide-react";

interface InterviewHeaderProps {
  company: string;
  role: string;
  interviewType: string;
  timeRemaining: number;
  micActive: boolean;
  videoActive: boolean;
  audioActive: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndInterview: () => void;
}

export default function InterviewHeader({
  company,
  role,
  interviewType,
  timeRemaining,
  micActive,
  videoActive,
  audioActive,
  onToggleMic,
  onToggleVideo,
  onToggleAudio,
  onEndInterview,
}: InterviewHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6633FF]/10 text-[#6633FF] flex items-center justify-center font-bold">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {company} — {role}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs uppercase bg-[#6633FF]/10 text-[#6633FF] border-none font-semibold">
              {interviewType}
            </Badge>
            <span className="text-xs text-gray-500">• Live AI Evaluation</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-mono font-bold text-sm">
          <Clock className="w-4 h-4 text-[#6633FF]" />
          <span>{formatTime(timeRemaining)}</span>
        </div>

        {/* Device Controls */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleMic}
            className={`h-9 w-9 rounded-lg ${micActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-gray-600"}`}
            title={micActive ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleVideo}
            className={`h-9 w-9 rounded-lg ${videoActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-gray-600"}`}
            title={videoActive ? "Disable Camera" : "Enable Camera"}
          >
            {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleAudio}
            className={`h-9 w-9 rounded-lg ${audioActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-gray-600"}`}
            title={audioActive ? "Mute Speaker" : "Unmute Speaker"}
          >
            {audioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>

        {/* End Interview */}
        <Button
          type="button"
          variant="destructive"
          onClick={onEndInterview}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xs h-10 px-4 rounded-xl"
        >
          End Interview
        </Button>
      </div>
    </div>
  );
}
