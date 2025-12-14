import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, FileJson, RefreshCw, Trash2, Edit2, Check, X, Search, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

export function FileExplorer({ onLoad }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [newName, setNewName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/resumes');
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch files", error);
            toast.error("Failed to fetch files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleLoad = async (filename) => {
        let jsonFilename = filename;
        if (filename.endsWith('.pdf')) {
            jsonFilename = filename.replace('.pdf', '.json');
        } else if (!filename.endsWith('.json')) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:8000/resumes/${jsonFilename}`);
            if (res.ok) {
                const data = await res.json();
                onLoad(data);
            } else {
                if (filename.endsWith('.pdf')) {
                    toast.warning("No editable data found for this PDF. Please upload it again to parse.");
                } else {
                    toast.error("Failed to load resume");
                }
            }
        } catch (error) {
            toast.error("Failed to load resume");
        }
    };

    const handleDownload = (e, filename) => {
        e.stopPropagation();
        window.open(`http://localhost:8000/resumes/${filename}`, '_blank');
    };

    const handleDelete = async (e, filename) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

        try {
            const res = await fetch(`http://localhost:8000/resumes/${filename}`, { method: 'DELETE' });
            if (res.ok) {
                fetchFiles();
                toast.success("File deleted");
            }
        } catch (error) {
            toast.error("Failed to delete file");
        }
    };

    const startRename = (e, filename) => {
        e.stopPropagation();
        setEditingFile(filename);
        setNewName(filename);
    };

    const cancelRename = (e) => {
        e.stopPropagation();
        setEditingFile(null);
        setNewName('');
    };

    const submitRename = async (e) => {
        e.stopPropagation();
        if (!newName || newName === editingFile) {
            setEditingFile(null);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8000/resumes/${editingFile}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_filename: newName })
            });

            if (res.ok) {
                fetchFiles();
                setEditingFile(null);
                toast.success("File renamed");
            } else {
                toast.error("Failed to rename");
            }
        } catch (error) {
            toast.error("Error renaming file");
        }
    };

    const filteredFiles = files.filter(file => file.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-gray-50/30 dark:bg-gray-950/30">
            <div className="p-4 space-y-4 border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Saved Resumes</h2>
                    <Button variant="ghost" size="icon" onClick={fetchFiles} disabled={loading} className="hover:bg-primary/10 hover:text-primary">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white dark:bg-gray-950"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <File className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>No resumes found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <AnimatePresence>
                            {filteredFiles.map((file, index) => (
                                <motion.div
                                    key={file}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    layout
                                >
                                    <Card
                                        className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-transparent hover:border-primary/20 bg-white dark:bg-gray-900 ${file.endsWith('.json') ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-blue-500'
                                            }`}
                                        onClick={() => handleLoad(file)}
                                    >
                                        <CardContent className="p-3 flex items-center justify-between">
                                            {editingFile === file ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2" onClick={e => e.stopPropagation()}>
                                                    <Input
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={submitRename}>
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={cancelRename}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file.endsWith('.json') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {file.endsWith('.json') ? <FileJson className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <span className="truncate font-medium text-sm group-hover:text-primary transition-colors">{file}</span>
                                                </div>
                                            )}

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" onClick={(e) => startRename(e, file)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" onClick={(e) => handleDownload(e, file)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20" onClick={(e) => handleDelete(e, file)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
