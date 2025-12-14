import React, { useState, useEffect } from 'react';
import { ResumeEditor } from './components/ResumeEditor';
import { PDFPreview } from './components/PDFPreview';
import ChatInterface from './components/ChatInterface';
import { FileExplorer } from './components/FileExplorer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, Wand2, MessageSquare, Edit, Save, Menu, X, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from './components/ThemeToggle';
import { ModelConfigDialog } from './components/ModelConfigDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function App() {
  const [resume, setResume] = useState({
    contact: { name: '', email: '', phone: '', linkedin: '', github: '' },
    logo_path: null,
    experience: [],
    education: [],
    projects: [],
    skills: [],
    custom_sections: []
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [modelName, setModelName] = useState('gemini-2.5-pro');
  const [jobDescription, setJobDescription] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "Hello! I'm your AI Resume Assistant. You can upload an existing resume to improve it, or we can start building one from scratch. Tell me about your experience!" }
  ]);
  const [viewMode, setViewMode] = useState('chat'); // 'chat', 'edit', 'files'
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('provider', 'gemini');
    formData.append('model_name', modelName);

    try {
      const res = await fetch('http://localhost:8000/parse', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to parse');
      const data = await res.json();
      setResume(data);
      setChatHistory([{ role: 'assistant', content: "I've analyzed your resume. How can I help you improve it? You can also paste a Job Description here." }]);
      toast.success("Resume uploaded and parsed successfully!");

      // Auto-generate PDF preview
      const genRes = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (genRes.ok) {
        const blob = await genRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (resumeData = null) => {
    setLoading(true);
    try {
      const dataToUse = resumeData || resume;
      const res = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUse),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF generated successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (content, callback) => {
    if (!apiKey) return toast.error("Please enter API Key");
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          job_description: jobDescription,
          api_key: apiKey,
          provider: 'gemini',
          model_name: modelName
        }),
      });
      const data = await res.json();
      callback(data.improved_content);
      toast.success("Content improved!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!apiKey) return toast.error("Please enter API Key");

    const newHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_resume: resume,
          chat_history: newHistory,
          user_message: message,
          api_key: apiKey,
          provider: 'gemini',
          model_name: modelName
        }),
      });

      if (!res.ok) throw new Error('Failed to chat');
      const data = await res.json();

      // The backend returns the full message object (content + tool_calls)
      setChatHistory([...newHistory, data.message]);
    } catch (err) {
      toast.error(err.message);
      setChatHistory([...newHistory, { role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApproveTool = (toolCall, approved) => {
    if (!approved) {
      toast.error("Change rejected by user.");
      return;
    }

    const args = JSON.parse(toolCall.function.arguments);
    const functionName = toolCall.function.name;
    let newResume = { ...resume };

    if (functionName === "update_contact_info") {
      newResume.contact = { ...newResume.contact, ...args };
    } else if (functionName === "update_summary") {
      newResume.summary = args.summary;
    } else if (functionName === "update_education") {
      newResume.education = args.education;
    } else if (functionName === "update_experience") {
      newResume.experience = args.experience;
    } else if (functionName === "update_projects") {
      newResume.projects = args.projects;
    } else if (functionName === "update_skills") {
      newResume.skills = args.skills;
    } else if (functionName === "update_custom_sections") {
      newResume.custom_sections = args.custom_sections;
    }

    setResume(newResume);
    toast.success("Resume updated!");
    // Auto-regenerate PDF with new data
    handleGenerate(newResume);
  };

  const handleSaveVersion = async () => {
    if (!saveName) return toast.error("Please enter a name for this version");

    try {
      const res = await fetch('http://localhost:8000/save-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: saveName,
          resume_data: resume
        })
      });

      if (res.ok) {
        toast.success("Version saved successfully!");
        setShowSaveDialog(false);
        setSaveName('');
      } else {
        toast.error("Failed to save");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLoadResume = (data) => {
    setResume(data);
    setViewMode('edit');
    handleGenerate(data); // Regenerate PDF for the loaded resume
    toast.success("Resume loaded!");
  };

  const NavButton = ({ mode, icon: Icon, label, tooltipText }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setViewMode(mode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${viewMode === mode
            ? 'bg-primary/10 text-primary font-semibold shadow-sm'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
        >
          <Icon className={`w-5 h-5 ${viewMode === mode ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
          <span className={!isSidebarOpen ? 'hidden' : ''}>{label}</span>
          {viewMode === mode && isSidebarOpen && (
            <motion.div
              layoutId="activeTab"
              className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
        <Toaster position="top-center" richColors />

        {/* Sidebar Navigation Rail */}
        <motion.div
          initial={{ width: 240 }}
          animate={{ width: isSidebarOpen ? 240 : 80 }}
          className="border-r bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl flex flex-col z-20 relative"
        >
          <div className="p-4 flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              {isSidebarOpen && <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Adaptive CV</span>}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  {isSidebarOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 px-3 py-4 space-y-2">
            <NavButton mode="chat" icon={MessageSquare} label="AI Assistant" tooltipText="Chat with AI to improve your resume" />
            <NavButton mode="edit" icon={Edit} label="Editor" tooltipText="Manually edit your resume sections" />
            <NavButton mode="files" icon={FolderOpen} label="My Resumes" tooltipText="Browse and load saved resume versions" />
          </div>

          <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 flex justify-center">
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-gray-900/50">
          <header className="h-16 border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
            <h2 className="text-lg font-semibold capitalize">{viewMode === 'files' ? 'My Resumes' : viewMode === 'chat' ? 'AI Assistant' : 'Resume Editor'}</h2>

            <div className="flex items-center gap-3">
              {/* Model Config */}
              <ModelConfigDialog apiKey={apiKey} setApiKey={setApiKey} modelName={modelName} setModelName={setModelName} />

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

              {/* Save Version */}
              <div className="flex gap-2">
                {showSaveDialog ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-white dark:bg-gray-900 p-1 rounded-lg border shadow-sm">
                    <Input
                      placeholder="Version Name (e.g. v1)"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="w-40 h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveVersion} className="h-8">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="h-9">
                        <Save className="w-4 h-4 mr-2 text-gray-500" /> Save Version
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save current resume as a version for later use</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

              {/* Upload & Generate */}
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" disabled={loading} className="relative overflow-hidden h-9">
                      <Upload className="w-4 h-4 mr-2" /> Upload PDF
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        accept=".pdf,.tex"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload an existing PDF or LaTeX resume to parse and edit</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => handleGenerate()} disabled={loading} size="sm" className="h-9 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    Generate PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate a professional PDF from your resume data</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Panel (Chat/Edit/Files) */}
            <div className="w-1/2 flex flex-col min-w-[400px] border-r bg-white dark:bg-gray-950 relative z-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  {viewMode === 'chat' ? (
                    <ChatInterface
                      chatHistory={chatHistory}
                      onSendMessage={handleSendMessage}
                      onApproveTool={handleApproveTool}
                      isLoading={chatLoading}
                    />
                  ) : viewMode === 'edit' ? (
                    <div className="flex-1 overflow-auto">
                      <ResumeEditor resume={resume} setResume={setResume} onImprove={handleImprove} />
                    </div>
                  ) : (
                    <FileExplorer onLoad={handleLoadResume} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Panel (PDF Preview) */}
            <div className="w-1/2 bg-gray-100 dark:bg-gray-900/50 relative">
              <div className="absolute inset-0 p-4">
                <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border bg-white">
                  <PDFPreview pdfUrl={pdfUrl} loading={loading} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm py-2 px-6 text-center text-xs text-muted-foreground">
            <p>
              Made with love for Open Source community by <span className="font-medium text-foreground">Ganeshan Arumuganainar</span> |
              <a href="https://www.linkedin.com/in/ganeshannainar" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors mx-1">LinkedIn</a> |
              <a href="https://ganeshannainar.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors mx-1">ganeshannainar.com</a> |
              <a href="https://github.com/intragalactic-stranger" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors mx-1">Github</a>
            </p>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
