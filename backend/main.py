from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
import shutil
import os
import json
import aiofiles
import aiofiles.os
from models import Resume
from parser import parse_pdf, parse_tex
from renderer import render_pdf
from ai_engine import improve_resume_section, chat_with_resume
from cache import get_cache

app = FastAPI(title="Adaptive-CV API")

# Directory configuration
RESUME_DIR = "resumes"
LOGO_DIR = "logos"

# Ensure directories exist on startup
os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(LOGO_DIR, exist_ok=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Adaptive-CV API"}

@app.get("/cache/stats")
async def cache_stats():
    """Get Redis cache statistics"""
    return get_cache().get_stats()

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cache entries"""
    get_cache().clear_all()
    return {"message": "Cache cleared"}

@app.post("/parse")
async def parse_resume(
    file: UploadFile = File(...), 
    api_key: str = Form(...),
    provider: str = Form("gemini"),
    model_name: str = Form("gemini-1.5-flash")
):
    print(f"DEBUG: Received parse request. Provider: {provider}, Model: {model_name}", flush=True)
    content = await file.read()
    filename = file.filename.lower()
    
    # Check cache first
    cache = get_cache()
    cached_data = cache.get_parsed_resume(content, provider, model_name)
    if cached_data:
        return Resume(**cached_data)
    
    try:
        if filename.endswith(".pdf"):
            resume = await parse_pdf(content, api_key, provider, model_name)
        elif filename.endswith(".tex"):
            resume = await parse_tex(content, api_key, provider, model_name)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or LaTeX.")
        
        # Cache the parsed result
        cache.set_parsed_resume(content, provider, model_name, resume.model_dump())
        
        # Save files asynchronously with proper error handling
        try:
            # Ensure directory exists
            await aiofiles.os.makedirs(RESUME_DIR, exist_ok=True)
            
            # Save the original uploaded file
            save_path = os.path.join(RESUME_DIR, filename)
            async with aiofiles.open(save_path, "wb") as f:
                await f.write(content)
                
            # Save the parsed JSON
            json_filename = filename.rsplit(".", 1)[0] + ".json"
            json_path = os.path.join(RESUME_DIR, json_filename)
            async with aiofiles.open(json_path, "w") as f:
                await f.write(resume.model_dump_json(indent=2))
        except Exception as save_error:
            print(f"Warning: Could not save files: {save_error}")
            # Don't fail the request if save fails
            
        return resume
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_resume(resume: Resume):
    try:
        # Check PDF cache
        cache = get_cache()
        resume_json = resume.model_dump_json()
        cached_pdf = cache.get_generated_pdf(resume_json)
        
        if cached_pdf:
            return Response(
                content=cached_pdf,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=resume.pdf"}
            )
        
        # Generate PDF
        output_file = render_pdf(resume, "generated_resume.pdf")
        
        # Read and cache the PDF
        async with aiofiles.open(output_file, "rb") as f:
            pdf_content = await f.read()
        
        cache.set_generated_pdf(resume_json, pdf_content)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/improve")
async def improve_section(
    content: str = Body(...),
    job_description: str = Body(...),
    api_key: str = Body(...),
    provider: str = Body("gemini"),
    model_name: str = Body("gemini-1.5-flash")
):
    try:
        improved = await improve_resume_section(content, job_description, api_key, provider, model_name)
        return {"improved_content": improved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class ChatRequest(BaseModel):
    current_resume: dict
    chat_history: list
    user_message: str
    api_key: str
    provider: str = "gemini"
    model_name: str = "gemini-1.5-flash"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response_message = await chat_with_resume(
            request.current_resume,
            request.chat_history,
            request.user_message,
            request.api_key,
            request.provider,
            request.model_name
        )
        return {"message": response_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resume Management Endpoints

@app.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Upload a company/organization logo for the resume"""
    try:
        # Validate file type
        if not file.content_type in ["image/png", "image/jpeg", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only PNG and JPEG images are supported")
        
        # Ensure directory exists
        await aiofiles.os.makedirs(LOGO_DIR, exist_ok=True)
        
        # Generate safe filename
        file_extension = file.filename.split(".")[-1]
        safe_filename = f"logo_{os.urandom(8).hex()}.{file_extension}"
        file_path = os.path.join(LOGO_DIR, safe_filename)
        
        # Save the file asynchronously
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        
        return {"logo_path": file_path, "filename": safe_filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SaveRequest(BaseModel):
    filename: str
    resume_data: dict

@app.post("/save-version")
async def save_version(request: SaveRequest):
    """Save resume version with improved error handling"""
    try:
        # Ensure directory exists
        await aiofiles.os.makedirs(RESUME_DIR, exist_ok=True)
        
        # Sanitize filename
        base_name = request.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        base_name = "".join(c for c in base_name if c.isalnum() or c in "._-")
        
        if not base_name:
            base_name = "untitled"
        
        if not base_name.endswith(".json"):
            json_filename = f"{base_name}.json"
        else:
            json_filename = base_name
            
        json_path = os.path.join(RESUME_DIR, json_filename)
        
        # Save JSON asynchronously
        json_content = json.dumps(request.resume_data, indent=2)
        async with aiofiles.open(json_path, "w") as f:
            await f.write(json_content)
            
        # Generate and save PDF
        pdf_filename = json_filename.replace(".json", ".pdf")
        pdf_path = os.path.join(RESUME_DIR, pdf_filename)
        
        try:
            resume_obj = Resume(**request.resume_data)
            render_pdf(resume_obj, pdf_path)
        except Exception as pdf_error:
            print(f"PDF generation failed: {pdf_error}")
            # Return success for JSON save even if PDF fails
            return {
                "message": "JSON saved, PDF generation failed", 
                "files": [json_filename],
                "warning": str(pdf_error)
            }
        
        return {"message": "Saved successfully", "files": [json_filename, pdf_filename]}
    except Exception as e:
        print(f"Save error: {e}")
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")

@app.get("/resumes")
async def list_resumes():
    try:
        files = []
        # Ensure directory exists
        await aiofiles.os.makedirs(RESUME_DIR, exist_ok=True)
        
        if os.path.exists(RESUME_DIR):
            for f in os.listdir(RESUME_DIR):
                if f.endswith(".pdf") or f.endswith(".json"):
                    files.append(f)
        return {"files": sorted(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/resumes/{filename}")
async def get_resume(filename: str):
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(RESUME_DIR, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    if filename.endswith(".json"):
        async with aiofiles.open(file_path, "r") as f:
            content = await f.read()
            return json.loads(content)
    else:
        return FileResponse(file_path)

@app.delete("/resumes/{filename}")
async def delete_resume(filename: str):
    try:
        # Sanitize filename
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(RESUME_DIR, safe_filename)
        
        if os.path.exists(file_path):
            await aiofiles.os.remove(file_path)
            
        # Also try to delete associated PDF/JSON if it exists
        if filename.endswith(".json"):
            pdf_path = file_path.replace(".json", ".pdf")
            if os.path.exists(pdf_path):
                await aiofiles.os.remove(pdf_path)
        elif filename.endswith(".pdf"):
            json_path = file_path.replace(".pdf", ".json")
            if os.path.exists(json_path):
                await aiofiles.os.remove(json_path)
                
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RenameRequest(BaseModel):
    new_filename: str

@app.put("/resumes/{filename}")
async def rename_resume(filename: str, request: RenameRequest):
    try:
        old_path = os.path.join(RESUME_DIR, filename)
        if not os.path.exists(old_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        new_name = request.new_filename
        # Ensure extensions match
        if filename.endswith(".json") and not new_name.endswith(".json"):
            new_name += ".json"
        elif filename.endswith(".pdf") and not new_name.endswith(".pdf"):
            new_name += ".pdf"
            
        new_path = os.path.join(RESUME_DIR, new_name)
        os.rename(old_path, new_path)
        
        # Rename associated file if exists
        if filename.endswith(".json"):
            old_pdf = old_path.replace(".json", ".pdf")
            new_pdf = new_path.replace(".json", ".pdf")
            if os.path.exists(old_pdf):
                os.rename(old_pdf, new_pdf)
                
        return {"message": "Renamed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
