import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  UserCircle, 
  Users, 
  Hash, 
  MessageSquare, 
  ChevronLeft,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

export function AnonymousChat({ onBack }: { onBack: () => void }) {
  const [roomId, setRoomId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (socket && roomId) {
      socket.emit("join-room", roomId);
      setIsJoined(true);
    }
  };

  const generateRoom = () => {
    const newId = Math.random().toString(36).substring(7).toUpperCase();
    setRoomId(newId);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && message.trim() && isJoined) {
      socket.emit("send-message", { roomId, message });
      setMessage("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isJoined) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col p-6 space-y-8"
      >
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Anonymous Chat</h1>
        </header>

        <Card className="glass-panel rounded-3xl p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">Encrypted Rooms</h2>
            <p className="text-sm text-slate-400">Join a private room to chat without revealing your identity.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Hash className="w-3 h-3" /> Room Identity
              </label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Room Code..." 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="bg-slate-900 border-slate-800 h-12 rounded-xl focus:ring-blue-500/50"
                />
                <Button 
                  variant="outline" 
                  onClick={generateRoom}
                  className="h-12 w-12 rounded-xl border-slate-800 bg-slate-900/50"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={joinRoom}
              disabled={!roomId}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20"
            >
              Start Chatting Anonymously
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
    >
      <header className="p-4 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsJoined(false)} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Room #{roomId}</span>
              <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">Active</Badge>
            </div>
            <p className="text-[10px] text-slate-500">Identity hidden for all members</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={copyToClipboard}
          className="text-slate-400 hover:text-white"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <MessageSquare className="w-12 h-12 mx-auto mb-2" />
            <p className="text-xs">Waiting for messages... Be the first to say hello!</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = socket?.id.substring(0, 5) === msg.senderId;
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  {!isMe && <UserCircle className="w-3 h-3 text-slate-500" />}
                  <span className="text-[9px] text-slate-600 font-mono">
                    {msg.senderId} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type an anonymous message..."
            className="flex-1 bg-slate-900 border-slate-800 h-12 rounded-xl focus:ring-blue-500/50"
          />
          <Button 
            type="submit" 
            disabled={!message.trim()}
            className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </motion.div>
  );
}
