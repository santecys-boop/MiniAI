import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceMode from "@/components/VoiceMode";
import { Msg } from "@/types";

export default function VoicePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const savedName = localStorage.getItem("mini_ai_user_name") || "";
    setUserName(savedName);
  }, []);

  const handleMessageAdded = (m: Msg) => {
    try {
      const existing: Msg[] = JSON.parse(localStorage.getItem("mini_ai_active_chat_messages") || "[]");
      localStorage.setItem("mini_ai_active_chat_messages", JSON.stringify([...existing, m]));
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-stone-950 text-white z-50 flex flex-col">
      <VoiceMode
        onClose={() => navigate("/")}
        userName={userName}
        onMessageAdded={handleMessageAdded}
      />
    </div>
  );
}
