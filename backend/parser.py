import fitz  # PyMuPDF
from models import Resume
from ai_engine import parse_resume_text

async def parse_pdf(file_content: bytes, api_key: str, provider: str = "gemini", model_name: str = "gemini-1.5-flash") -> Resume:
    """
    Extracts text from PDF and uses AI to structure it.
    """
    doc = fitz.open(stream=file_content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    
    # Use AI to structure the text
    resume = await parse_resume_text(text, api_key, provider, model_name)
    return resume

async def parse_tex(file_content: bytes, api_key: str, provider: str = "gemini", model_name: str = "gemini-1.5-flash") -> Resume:
    """
    Extracts text from LaTeX and uses AI to structure it.
    """
    text = file_content.decode("utf-8")
    # Use AI to structure the text (AI is good at understanding LaTeX too)
    resume = await parse_resume_text(text, api_key, provider, model_name)
    return resume
