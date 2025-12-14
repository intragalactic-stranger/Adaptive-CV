import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Check, X, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatInterface = ({ chatHistory, onSendMessage, onApproveTool, isLoading }) => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderToolCall = (toolCall, index) => {
        const args = JSON.parse(toolCall.function.arguments);
        const functionName = toolCall.function.name;

        let summary = "Proposed Change";
        if (functionName === "update_contact_info") summary = "Update Contact Info";
        if (functionName === "update_summary") summary = "Update Summary";
        if (functionName === "update_education") summary = "Update Education";
        if (functionName === "update_experience") summary = "Update Experience";
        if (functionName === "update_projects") summary = "Update Projects";
        if (functionName === "update_skills") summary = "Update Skills";
        if (functionName === "update_custom_sections") summary = "Update Custom Sections";

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
            >
                <Card key={index} className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200/50">
                        <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            {summary}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                        <pre className="text-xs font-mono bg-white/50 dark:bg-black/20 rounded-lg p-3 overflow-x-auto max-h-60 text-amber-900 dark:text-amber-100">
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </CardContent>
                    <CardFooter className="py-3 px-4 flex justify-end gap-3 bg-amber-50/30 dark:bg-amber-900/5">
                        <Button size="sm" variant="outline" onClick={() => onApproveTool(toolCall, false)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 text-xs">
                            <X className="w-3 h-3 mr-1.5" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => onApproveTool(toolCall, true)}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs shadow-sm shadow-green-200 dark:shadow-none">
                            <Check className="w-3 h-3 mr-1.5" /> Approve
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/30 dark:bg-gray-950/30 relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <AnimatePresence initial={false}>
                    {chatHistory.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-primary border'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                <div className={`space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-sm'
                                        }`}>
                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                    </div>

                                    {/* Render Tool Calls if present */}
                                    {msg.tool_calls && msg.tool_calls.map((tc, idx) => renderToolCall(tc, idx))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-primary border flex items-center justify-center shadow-sm">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg p-2 flex gap-2 items-center ring-1 ring-black/5">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI to improve your resume..."
                        disabled={isLoading}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
