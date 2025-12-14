import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function ModelConfigDialog({ apiKey, setApiKey, modelName, setModelName }) {
    const [open, setOpen] = useState(false);
    const [tempApiKey, setTempApiKey] = useState(apiKey);
    const [tempModelName, setTempModelName] = useState(modelName);
    const [status, setStatus] = useState("idle"); // 'idle', 'testing', 'success', 'error'
    const [showConfig, setShowConfig] = useState(false);

    const handleTest = async () => {
        if (!tempApiKey || !tempModelName) {
            toast.error("Please fill in both API Key and Model Name");
            return;
        }

        setStatus("testing");

        try {
            // Simple test: try to call the improve endpoint with minimal data
            const res = await fetch('http://localhost:8000/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: "Test",
                    job_description: "",
                    api_key: tempApiKey,
                    provider: 'gemini',
                    model_name: tempModelName
                }),
            });

            if (res.ok) {
                setStatus("success");
                setApiKey(tempApiKey);
                setModelName(tempModelName);
                toast.success("Model configured successfully!");
                setShowConfig(false);
            } else {
                setStatus("error");
                toast.error("Failed to connect. Please check your API key and model name.");
            }
        } catch (err) {
            setStatus("error");
            toast.error("Connection failed. Is the backend running?");
        }
    };

    const StatusIndicator = () => {
        if (status === "idle") return null;

        if (status === "testing") {
            return (
                <div className="flex items-center gap-2 text-yellow-600">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="w-4 h-4" />
                    </motion.div>
                    <motion.span
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm font-medium"
                    >
                        Testing connection...
                    </motion.span>
                </div>
            );
        }

        if (status === "success") {
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-green-600"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{modelName}</span>
                </motion.div>
            );
        }

        if (status === "error") {
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-red-600"
                >
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Connection failed</span>
                </motion.div>
            );
        }
    };

    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
            setShowConfig(status !== "success");
            setTempApiKey(apiKey);
            setTempModelName(modelName);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {status === "idle" || showConfig ? (
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Configure</span>
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 hover:bg-accent"
                        onClick={() => setShowConfig(true)}
                    >
                        <StatusIndicator />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Model Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure your AI model settings. We'll test the connection when you save.
                    </DialogDescription>
                </DialogHeader>

                {showConfig || status === "idle" ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="model-name" className="text-sm font-medium">
                                Model Name
                            </Label>
                            <Input
                                id="model-name"
                                placeholder="e.g., gemini-2.5-pro"
                                value={tempModelName}
                                onChange={(e) => setTempModelName(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-900"
                            />
                            <p className="text-xs text-muted-foreground">
                                Supported: Gemini models (gemini-1.5-pro, gemini-2.5-flash, etc.)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-key" className="text-sm font-medium">
                                API Key
                            </Label>
                            <Input
                                id="api-key"
                                type="password"
                                placeholder="Enter your API key"
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-900"
                            />
                            <p className="text-xs text-muted-foreground">
                                Your API key is stored locally and never sent to external servers.
                            </p>
                        </div>

                        {status !== "idle" && <StatusIndicator />}
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-4">
                        <StatusIndicator />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfig(true)}
                        >
                            Change Configuration
                        </Button>
                    </div>
                )}

                {(showConfig || status === "idle") && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleTest} disabled={status === "testing"}>
                            {status === "testing" ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                "Test & Save"
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
