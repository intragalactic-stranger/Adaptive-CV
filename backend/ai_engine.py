import os
from litellm import completion
from models import Resume, ContactInfo, EducationItem, ExperienceItem, ProjectItem, SkillCategory, CustomSection
import json

# Default to a free model or allow user to set it. 
# For now, we assume the user provides an API key in the request or env.
# We will use Gemini 1.5 Flash as default if key is present, else OpenAI.

async def parse_resume_text(text: str, api_key: str, provider: str = "gemini", model_name: str = "gemini-flash-latest") -> Resume:
    """
    Uses LLM to parse raw text into a structured Resume object.
    """
    prompt = f"""
    You are an expert resume parser. Extract the following information from the resume text below and return it as a JSON object matching the schema.
    
    Resume Text:
    {text}
    
    Return ONLY the JSON object. No markdown formatting.
    
    IMPORTANT:
    - Map standard sections (Experience, Education, Projects, Skills) to their respective fields.
    - If there are ANY other sections (e.g., "Awards", "Certifications", "Volunteering", "Publications", "Languages", etc.), you MUST extract them into the `custom_sections` list.
    - Do NOT ignore any content.
    """
    
    model = f"gemini/{model_name}" if provider == "gemini" else "gpt-4o"
    
    print(f"DEBUG: Using model: {model}", flush=True)
    print(f"DEBUG: Provider: {provider}", flush=True)
    
    # Set API key dynamically
    os.environ["GEMINI_API_KEY"] = api_key if provider == "gemini" else ""
    os.environ["OPENAI_API_KEY"] = api_key if provider == "openai" else ""

    # Get the schema from the Pydantic model
    json_schema = Resume.model_json_schema()

    completion_kwargs = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {
            "type": "json_object",
            "response_schema": json_schema
        }
    }

    # Add reasoning_effort for Gemini 3+ or thinking models
    if "gemini-3" in model_name or "thinking" in model_name:
        completion_kwargs["reasoning_effort"] = "low"
        print("DEBUG: Added reasoning_effort='low' for Gemini 3/Thinking model", flush=True)

    try:
        response = completion(**completion_kwargs)
    except Exception as e:
        print(f"DEBUG: LiteLLM Error: {str(e)}", flush=True)
        raise e
    
    content = response.choices[0].message.content
    return Resume.model_validate_json(content)

async def improve_resume_section(current_content: str, job_description: str, api_key: str, provider: str = "gemini", model_name: str = "gemini-1.5-flash") -> str:
    """
    Improves a specific resume section based on a job description.
    """
    prompt = f"""
    You are an expert resume writer. Improve the following resume section to better match the job description.
    Keep it professional, concise, and impactful. Use action verbs.
    
    Current Content:
    {current_content}
    
    Job Description:
    {job_description}
    
    Return ONLY the improved text.
    """
    
    model = f"gemini/{model_name}" if provider == "gemini" else "gpt-4o"
    
    os.environ["GEMINI_API_KEY"] = api_key if provider == "gemini" else ""
    
    completion_kwargs = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}]
    }

    if "gemini-3" in model_name or "thinking" in model_name:
        completion_kwargs["reasoning_effort"] = "low"

    response = completion(**completion_kwargs)
    
    return response.choices[0].message.content

async def chat_with_resume(current_resume: dict, chat_history: list, user_message: str, api_key: str, provider: str = "gemini", model_name: str = "gemini-1.5-flash"):
    """
    Chat with the AI about the resume. The AI can suggest updates using tools.
    """
    model = f"gemini/{model_name}" if provider == "gemini" else "gpt-4o"
    os.environ["GEMINI_API_KEY"] = api_key if provider == "gemini" else ""
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "update_contact_info",
                "description": "Update contact information",
                "parameters": ContactInfo.model_json_schema()
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_summary",
                "description": "Update professional summary",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string", "description": "The new summary text"}
                    },
                    "required": ["summary"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_education",
                "description": "Update education section (replaces entire list)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "education": {
                            "type": "array",
                            "items": EducationItem.model_json_schema()
                        }
                    },
                    "required": ["education"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_experience",
                "description": "Update experience section (replaces entire list)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "experience": {
                            "type": "array",
                            "items": ExperienceItem.model_json_schema()
                        }
                    },
                    "required": ["experience"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_projects",
                "description": "Update projects section (replaces entire list)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "projects": {
                            "type": "array",
                            "items": ProjectItem.model_json_schema()
                        }
                    },
                    "required": ["projects"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_skills",
                "description": "Update skills section (replaces entire list)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "skills": {
                            "type": "array",
                            "items": SkillCategory.model_json_schema()
                        }
                    },
                    "required": ["skills"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_custom_sections",
                "description": "Update custom sections (Certifications, Awards, etc.). Replaces entire list.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "custom_sections": {
                            "type": "array",
                            "items": CustomSection.model_json_schema()
                        }
                    },
                    "required": ["custom_sections"]
                }
            }
        }
    ]

    system_prompt = f"""
    You are an expert resume consultant. You are helping a user improve their resume.
    
    Current Resume:
    {json.dumps(current_resume, indent=2)}
    
    You can use the provided tools to update specific sections of the resume.
    If the user asks for a change, call the appropriate tool with the NEW content.
    
    If the Current Resume is empty (or mostly empty), guide the user to provide their details (Contact, Experience, Education, etc.) so you can build it for them using the tools.
    
    IMPORTANT: When using `update_custom_sections`, you MUST provide the COMPLETE list of custom sections. 
    - To ADD a section: Get the current list, append the new section, and send the full list.
    - To REMOVE a section: Get the current list, filter out the section, and send the remaining list.
    - To MODIFY a section: Get the current list, find the section, update it, and send the full list.
    
    Always be helpful, professional, and concise.
    """

    messages = [{"role": "system", "content": system_prompt}] + chat_history + [{"role": "user", "content": user_message}]

    completion_kwargs = {
        "model": model,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto"
    }

    if "gemini-3" in model_name or "thinking" in model_name:
        completion_kwargs["reasoning_effort"] = "low"

    try:
        response = completion(**completion_kwargs)
        return response.choices[0].message
    except Exception as e:
        print(f"DEBUG: LiteLLM Error in chat: {str(e)}", flush=True)
        raise e
