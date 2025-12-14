from pydantic import BaseModel, Field
from typing import List, Optional

class ContactInfo(BaseModel):
    name: str = Field(..., description="Full name of the candidate")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    website: Optional[str] = Field(None, description="Personal website URL")
    location: Optional[str] = Field(None, description="City, Country")

class EducationItem(BaseModel):
    institution: str = Field(..., description="University or School name")
    degree: str = Field(..., description="Degree obtained")
    start_date: Optional[str] = Field(None, description="Start date (e.g., 'Sep 2018')")
    end_date: Optional[str] = Field(None, description="End date (e.g., 'Jun 2022')")
    gpa: Optional[str] = Field(None, description="GPA or grade")

class ExperienceItem(BaseModel):
    company: str = Field(..., description="Company name")
    position: str = Field(..., description="Job title")
    start_date: Optional[str] = Field(None, description="Start date")
    end_date: Optional[str] = Field(None, description="End date or 'Present'")
    description: List[str] = Field(default_factory=list, description="List of bullet points describing responsibilities")

class ProjectItem(BaseModel):
    name: str = Field(..., description="Project name")
    technologies: Optional[str] = Field(None, description="Technologies used")
    link: Optional[str] = Field(None, description="Link to project")
    description: List[str] = Field(default_factory=list, description="List of bullet points")

class SkillCategory(BaseModel):
    category: str = Field(..., description="Category name (e.g., 'Languages', 'Frameworks')")
    skills: List[str] = Field(..., description="List of skills in this category")

class CustomSection(BaseModel):
    title: str = Field(..., description="Section title (e.g., 'Certifications', 'Volunteering')")
    items: List[str] = Field(..., description="List of bullet points")

class Resume(BaseModel):
    contact: ContactInfo
    logo_path: Optional[str] = Field(None, description="Path to company/organization logo image")
    summary: Optional[str] = Field(None, description="Professional summary")
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    skills: List[SkillCategory] = Field(default_factory=list)
    custom_sections: List[CustomSection] = Field(default_factory=list, description="Additional sections like Certifications, Awards, etc.")
