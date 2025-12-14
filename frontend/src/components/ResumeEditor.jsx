import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Briefcase, GraduationCap, Code, User, Layers, Upload, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

const SectionHeader = ({ title, icon: Icon, isOpen, onToggle, onAdd }) => (
    <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isOpen ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
        onClick={onToggle}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
            {onAdd && (
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAdd(); }} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
                    <Plus className="w-4 h-4" />
                </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
        </div>
    </div>
);

export function ResumeEditor({ resume, setResume, onImprove }) {
    const [openSection, setOpenSection] = useState('contact');
    const [logoUploading, setLogoUploading] = useState(false);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
            toast.error("Only PNG and JPEG images are supported");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setLogoUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/upload-logo', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to upload logo');

            const data = await res.json();
            setResume({ ...resume, logo_path: data.logo_path });
            toast.success("Logo uploaded successfully!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLogoUploading(false);
        }
    };

    const removeLogo = () => {
        setResume({ ...resume, logo_path: null });
        toast.success("Logo removed");
    };

    const handleChange = (section, index, field, value) => {
        const newResume = { ...resume };
        if (index !== null) {
            newResume[section][index][field] = value;
        } else {
            newResume[section][field] = value;
        }
        setResume(newResume);
    };

    const handleContactChange = (field, value) => {
        setResume({
            ...resume,
            contact: { ...resume.contact, [field]: value }
        });
    };

    const addItem = (section, template) => {
        setResume({
            ...resume,
            [section]: [...resume[section], template]
        });
        if (openSection !== section) setOpenSection(section);
    };

    const removeItem = (section, index) => {
        const newSection = [...resume[section]];
        newSection.splice(index, 1);
        setResume({ ...resume, [section]: newSection });
    };

    return (
        <div className="space-y-4 p-4 pb-20 max-w-3xl mx-auto">
            {/* Contact Information */}
            <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
                <SectionHeader
                    title="Contact Information"
                    icon={User}
                    isOpen={openSection === 'contact'}
                    onToggle={() => toggleSection('contact')}
                />
                <AnimatePresence>
                    {openSection === 'contact' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0 pb-6 px-6">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
                                    <Input value={resume.contact.name} onChange={(e) => handleContactChange('name', e.target.value)} className="bg-gray-50/50 dark:bg-gray-900/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                                    <Input value={resume.contact.email} onChange={(e) => handleContactChange('email', e.target.value)} className="bg-gray-50/50 dark:bg-gray-900/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                                    <Input value={resume.contact.phone} onChange={(e) => handleContactChange('phone', e.target.value)} className="bg-gray-50/50 dark:bg-gray-900/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">LinkedIn</Label>
                                    <Input value={resume.contact.linkedin} onChange={(e) => handleContactChange('linkedin', e.target.value)} className="bg-gray-50/50 dark:bg-gray-900/50" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">GitHub</Label>
                                    <Input value={resume.contact.github} onChange={(e) => handleContactChange('github', e.target.value)} className="bg-gray-50/50 dark:bg-gray-900/50" />
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Company/Organization Logo */}
            <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm">
                <SectionHeader
                    title="Company/Organization Logo"
                    icon={ImageIcon}
                    isOpen={openSection === 'logo'}
                    onToggle={() => toggleSection('logo')}
                />
                <AnimatePresence>
                    {openSection === 'logo' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="pt-0 pb-6 px-6">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground">
                                        Upload a logo to display in the header of your resume (PNG or JPEG, max 5MB)
                                    </div>
                                    
                                    {resume.logo_path ? (
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                                                    <ImageIcon className="w-4 h-4" />
                                                    Logo uploaded
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                                    {resume.logo_path}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={removeLogo}
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                id="logo-upload"
                                                disabled={logoUploading}
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer flex flex-col items-center gap-2"
                                            >
                                                <div className="p-3 bg-primary/10 rounded-full">
                                                    <Upload className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {logoUploading ? 'Uploading...' : 'Click to upload logo'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    PNG or JPEG (max 5MB)
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Experience */}
            <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm">
                <SectionHeader
                    title="Experience"
                    icon={Briefcase}
                    isOpen={openSection === 'experience'}
                    onToggle={() => toggleSection('experience')}
                    onAdd={() => addItem('experience', { company: '', position: '', start_date: '', end_date: '', description: [] })}
                />
                <AnimatePresence>
                    {openSection === 'experience' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-6 pt-0 pb-6 px-6">
                                {resume.experience.map((exp, index) => (
                                    <div key={index} className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3 group">
                                        <Button variant="ghost" size="icon" className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10" onClick={() => removeItem('experience', index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input placeholder="Company" value={exp.company} onChange={(e) => handleChange('experience', index, 'company', e.target.value)} className="font-semibold" />
                                            <Input placeholder="Position" value={exp.position} onChange={(e) => handleChange('experience', index, 'position', e.target.value)} />
                                            <Input placeholder="Start Date" value={exp.start_date} onChange={(e) => handleChange('experience', index, 'start_date', e.target.value)} className="text-sm" />
                                            <Input placeholder="End Date" value={exp.end_date} onChange={(e) => handleChange('experience', index, 'end_date', e.target.value)} className="text-sm" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-muted-foreground">Description</Label>
                                                <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onImprove(exp.description.join('\n'), (newVal) => {
                                                    const newExp = [...resume.experience];
                                                    newExp[index].description = newVal.split('\n').filter(line => line.trim() !== '');
                                                    setResume({ ...resume, experience: newExp });
                                                })}>
                                                    <Sparkles className="w-3 h-3 mr-1" /> Improve with AI
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={exp.description.join('\n')}
                                                onChange={(e) => {
                                                    const newExp = [...resume.experience];
                                                    newExp[index].description = e.target.value.split('\n');
                                                    setResume({ ...resume, experience: newExp });
                                                }}
                                                rows={4}
                                                className="resize-none bg-gray-50/50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {resume.experience.length === 0 && <p className="text-center text-muted-foreground text-sm italic py-4">No experience added yet.</p>}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Education */}
            <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm">
                <SectionHeader
                    title="Education"
                    icon={GraduationCap}
                    isOpen={openSection === 'education'}
                    onToggle={() => toggleSection('education')}
                    onAdd={() => addItem('education', { institution: '', degree: '', start_date: '', end_date: '', gpa: '' })}
                />
                <AnimatePresence>
                    {openSection === 'education' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-6 pt-0 pb-6 px-6">
                                {resume.education.map((edu, index) => (
                                    <div key={index} className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3 group">
                                        <Button variant="ghost" size="icon" className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10" onClick={() => removeItem('education', index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input placeholder="Institution" value={edu.institution} onChange={(e) => handleChange('education', index, 'institution', e.target.value)} className="font-semibold" />
                                            <Input placeholder="Degree" value={edu.degree} onChange={(e) => handleChange('education', index, 'degree', e.target.value)} />
                                            <Input placeholder="Start Date" value={edu.start_date} onChange={(e) => handleChange('education', index, 'start_date', e.target.value)} className="text-sm" />
                                            <Input placeholder="End Date" value={edu.end_date} onChange={(e) => handleChange('education', index, 'end_date', e.target.value)} className="text-sm" />
                                            <Input placeholder="GPA" value={edu.gpa} onChange={(e) => handleChange('education', index, 'gpa', e.target.value)} className="text-sm md:col-span-2" />
                                        </div>
                                    </div>
                                ))}
                                {resume.education.length === 0 && <p className="text-center text-muted-foreground text-sm italic py-4">No education added yet.</p>}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Projects */}
            <Card className="overflow-hidden border-l-4 border-l-pink-500 shadow-sm">
                <SectionHeader
                    title="Projects"
                    icon={Code}
                    isOpen={openSection === 'projects'}
                    onToggle={() => toggleSection('projects')}
                    onAdd={() => addItem('projects', { name: '', technologies: '', link: '', description: [] })}
                />
                <AnimatePresence>
                    {openSection === 'projects' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-6 pt-0 pb-6 px-6">
                                {resume.projects.map((proj, index) => (
                                    <div key={index} className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3 group">
                                        <Button variant="ghost" size="icon" className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10" onClick={() => removeItem('projects', index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input placeholder="Project Name" value={proj.name} onChange={(e) => handleChange('projects', index, 'name', e.target.value)} className="font-semibold" />
                                            <Input placeholder="Technologies" value={proj.technologies} onChange={(e) => handleChange('projects', index, 'technologies', e.target.value)} />
                                            <Input placeholder="Link" value={proj.link} onChange={(e) => handleChange('projects', index, 'link', e.target.value)} className="md:col-span-2" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Description</Label>
                                            <Textarea
                                                value={proj.description.join('\n')}
                                                onChange={(e) => {
                                                    const newProj = [...resume.projects];
                                                    newProj[index].description = e.target.value.split('\n');
                                                    setResume({ ...resume, projects: newProj });
                                                }}
                                                rows={3}
                                                className="resize-none bg-gray-50/50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {resume.projects.length === 0 && <p className="text-center text-muted-foreground text-sm italic py-4">No projects added yet.</p>}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Skills */}
            <Card className="overflow-hidden border-l-4 border-l-cyan-500 shadow-sm">
                <SectionHeader
                    title="Skills"
                    icon={Layers}
                    isOpen={openSection === 'skills'}
                    onToggle={() => toggleSection('skills')}
                    onAdd={() => addItem('skills', { category: '', skills: [] })}
                />
                <AnimatePresence>
                    {openSection === 'skills' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-4 pt-0 pb-6 px-6">
                                {resume.skills.map((skill, index) => (
                                    <div key={index} className="relative flex gap-3 items-start group">
                                        <div className="flex-1 space-y-2">
                                            <Input placeholder="Category (e.g. Languages)" value={skill.category} onChange={(e) => handleChange('skills', index, 'category', e.target.value)} className="font-semibold bg-gray-50/50 dark:bg-gray-900/50" />
                                            <Textarea
                                                placeholder="Skills (comma separated)"
                                                value={skill.skills.join(', ')}
                                                onChange={(e) => {
                                                    const newSkills = [...resume.skills];
                                                    newSkills[index].skills = e.target.value.split(',').map(s => s.trim());
                                                    setResume({ ...resume, skills: newSkills });
                                                }}
                                                className="min-h-[60px] resize-none"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 mt-1" onClick={() => removeItem('skills', index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {resume.skills.length === 0 && <p className="text-center text-muted-foreground text-sm italic py-4">No skills added yet.</p>}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Custom Sections */}
            {resume.custom_sections && resume.custom_sections.map((section, sIndex) => (
                <Card key={sIndex} className="overflow-hidden border-l-4 border-l-gray-500 shadow-sm">
                    <div
                        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${openSection === `custom-${sIndex}` ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                        onClick={() => toggleSection(`custom-${sIndex}`)}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${openSection === `custom-${sIndex}` ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                <Layers className="w-4 h-4" />
                            </div>
                            <Input
                                value={section.title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    const newSections = [...resume.custom_sections];
                                    newSections[sIndex].title = e.target.value;
                                    setResume({ ...resume, custom_sections: newSections });
                                }}
                                className="font-semibold text-lg border-transparent hover:border-input focus:border-input bg-transparent w-full max-w-xs px-0"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={(e) => {
                                e.stopPropagation();
                                const newSections = [...resume.custom_sections];
                                newSections.splice(sIndex, 1);
                                setResume({ ...resume, custom_sections: newSections });
                            }} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                {openSection === `custom-${sIndex}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {openSection === `custom-${sIndex}` && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CardContent className="pt-0 pb-6 px-6">
                                    <Textarea
                                        value={section.items.join('\n')}
                                        onChange={(e) => {
                                            const newSections = [...resume.custom_sections];
                                            newSections[sIndex].items = e.target.value.split('\n');
                                            setResume({ ...resume, custom_sections: newSections });
                                        }}
                                        rows={5}
                                        placeholder="List items (one per line)"
                                        className="bg-gray-50/50 dark:bg-gray-900/50"
                                    />
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            ))}

            <Button variant="outline" className="w-full border-dashed h-12 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5" onClick={() => {
                const newSections = resume.custom_sections ? [...resume.custom_sections] : [];
                newSections.push({ title: 'New Section', items: [] });
                setResume({ ...resume, custom_sections: newSections });
                setOpenSection(`custom-${newSections.length - 1}`);
            }}>
                <Plus className="w-4 h-4 mr-2" /> Add Custom Section
            </Button>
        </div>
    );
}
