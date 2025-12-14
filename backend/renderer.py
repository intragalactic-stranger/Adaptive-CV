import os
import subprocess
from jinja2 import Environment, FileSystemLoader
from models import Resume

# Configure Jinja2 to use LaTeX-friendly delimiters
latex_jinja_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")),
    block_start_string='\BLOCK{',
    block_end_string='}',
    variable_start_string='\VAR{',
    variable_end_string='}',
    comment_start_string='\#{',
    comment_end_string='}',
    line_statement_prefix='%%',
    line_comment_prefix='%#',
    trim_blocks=True,
    autoescape=False,
)

def latex_escape(value):
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value)
    return value.replace("\\", "\\textbackslash").replace("&", "\&").replace("%", "\%").replace("$", "\$").replace("#", "\#").replace("_", "\_").replace("{", "\{").replace("}", "\}").replace("~", "\\textasciitilde").replace("^", "\\textasciicircum")

latex_jinja_env.filters['escape_tex'] = latex_escape

def render_pdf(resume: Resume, output_filename: str = "resume.pdf") -> str:
    """
    Renders the resume to PDF using Tectonic.
    Returns the path to the generated PDF.
    """
    template = latex_jinja_env.get_template("resume.tex")
    tex_content = template.render(resume=resume)
    
    # Save .tex file
    tex_filename = output_filename.replace(".pdf", ".tex")
    with open(tex_filename, "w") as f:
        f.write(tex_content)
    
    # Compile with Tectonic
    # Assuming tectonic is in the current directory or path
    tectonic_path = os.path.join(os.path.dirname(__file__), "tectonic")
    if not os.path.exists(tectonic_path):
        tectonic_path = "tectonic" # Try system path
        
    try:
        subprocess.run([tectonic_path, tex_filename], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"Error compiling PDF: {e.stderr.decode()}")
        raise e
        
    return output_filename
