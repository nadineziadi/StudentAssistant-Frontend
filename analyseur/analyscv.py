"""
Flask app for CV analysis with optimized Ollama integration
"""

import io
import json
from typing import Tuple

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from werkzeug.utils import secure_filename

# Text extraction libraries
from PyPDF2 import PdfReader
from docx import Document

# ---------- Configuration ----------
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_CHARS_PER_CHUNK = 3000  # Réduit pour réponses plus rapides
# -----------------------------------

app = Flask(__name__)
CORS(app)

# ----------------- Helper functions -----------------

def allowed_file(filename: str) -> bool:
    return filename and "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream: io.BytesIO) -> str:
    reader = PdfReader(file_stream)
    texts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(texts).strip()

def extract_text_from_docx(file_stream: io.BytesIO) -> str:
    doc = Document(file_stream)
    return "\n".join(p.text for p in doc.paragraphs).strip()

def extract_text_from_txt(file_stream: io.BytesIO, encoding: str = "utf-8") -> str:
    file_stream.seek(0)
    raw = file_stream.read()
    if isinstance(raw, bytes):
        try:
            text = raw.decode(encoding)
        except Exception:
            text = raw.decode("latin-1", errors="ignore")
    else:
        text = str(raw)
    return text.strip()

def extract_text_from_uploaded_file(file_storage) -> Tuple[str, str]:
    filename = secure_filename(file_storage.filename)
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    file_bytes = file_storage.read()
    file_stream = io.BytesIO(file_bytes)

    if ext == "pdf":
        text = extract_text_from_pdf(file_stream)
    elif ext == "docx":
        text = extract_text_from_docx(file_stream)
    elif ext == "txt":
        text = extract_text_from_txt(file_stream)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    return text, ext

def call_ollama_cv_model(prompt_text: str, model: str = OLLAMA_MODEL, timeout: int = 300) -> str:
    """
    Calls Ollama API with optimized prompt - TIMEOUT INCREASED TO 300s
    """
    prompt = f"""Analyse ce CV en français de manière concise et claire.

CV : {prompt_text}

Réponds UNIQUEMENT avec ce format (pas de JSON, texte simple) :

ERREURS :
- [Liste les erreurs importantes]

SUGGESTIONS :
- [3-5 suggestions concrètes]

CV OPTIMISÉ :
[Réécris le CV de façon professionnelle en français]

Sois concis et professionnel."""

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 800,
            "top_k": 20,
            "top_p": 0.9
        }
    }

    print(f"🔄 Calling Ollama API with timeout={timeout}s...")

    try:
        resp = requests.post(
            OLLAMA_API_URL,
            json=payload,
            timeout=timeout
        )
    except requests.Timeout:
        raise RuntimeError(f"⏱️ Ollama timeout après {timeout}s. Essayez un modèle plus petit.")
    except requests.RequestException as e:
        raise RuntimeError(f"❌ Erreur connexion Ollama: {e}")

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama API error ({resp.status_code}): {resp.text}")

    try:
        data = resp.json()
        output = data.get("response", "")
        print(f"✅ Ollama response received: {len(output)} chars")
        return output.strip()
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Ollama response: {e}")

# ----------------- Flask routes -----------------

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        ollama_status = "connected" if resp.status_code == 200 else "error"
    except:
        ollama_status = "disconnected"

    return jsonify({
        "status": "healthy",
        "model": OLLAMA_MODEL,
        "ollama": ollama_status
    })

@app.route("/analyze-cv", methods=["POST"])
def analyze_cv_text():
    print("\n" + "="*60)
    print("📥 NEW CV ANALYSIS REQUEST (TEXT)")
    print("="*60)

    if not request.is_json:
        return jsonify({"success": False, "error": "Request must be JSON."}), 400

    data = request.get_json(silent=True)
    if not data or not isinstance(data.get("text"), str) or data.get("text").strip() == "":
        return jsonify({"success": False, "error": "Missing 'text' field."}), 400

    cv_text = data["text"].strip()
    print(f"📝 CV length: {len(cv_text)} chars")

    try:
        print("🚀 Starting Ollama analysis...")
        result = call_ollama_cv_model(cv_text)
        print(f"✅ Analysis complete: {len(result)} chars")

        return jsonify({
            "success": True,
            "analysis": result,
            "model": OLLAMA_MODEL,
            "original_length": len(cv_text)
        })

    except Exception as e:
        error_msg = str(e)
        print(f"❌ ERROR: {error_msg}")
        return jsonify({
            "success": False,
            "error": f"Analysis failed: {error_msg}"
        }), 500

@app.route("/analyze-cv-file", methods=["POST"])
def analyze_cv_file():
    print("\n" + "="*60)
    print("📥 NEW CV ANALYSIS REQUEST (FILE)")
    print("="*60)

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file in request."}), 400

    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"success": False, "error": f"Invalid file. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    try:
        cv_text, ext = extract_text_from_uploaded_file(file)
        print(f"📄 File: {file.filename} ({ext}), length: {len(cv_text)} chars")
    except Exception as e:
        return jsonify({"success": False, "error": f"File extraction error: {str(e)}"}), 400

    if not cv_text.strip():
        return jsonify({"success": False, "error": "File contains no text."}), 400

    try:
        print("🚀 Starting Ollama analysis...")
        result = call_ollama_cv_model(cv_text)
        print(f"✅ Analysis complete: {len(result)} chars")

        return jsonify({
            "success": True,
            "analysis": result,
            "model": OLLAMA_MODEL,
            "file_extension": ext,
            "original_length": len(cv_text)
        })

    except Exception as e:
        error_msg = str(e)
        print(f"❌ ERROR: {error_msg}")
        return jsonify({
            "success": False,
            "error": f"Analysis failed: {error_msg}"
        }), 500

# ----------------- Run server -----------------
if __name__ == "__main__":
    port = 5000
    print("\n" + "🚀 "*20)
    print(f"   Flask CV Analyzer Starting")
    print(f"   → http://0.0.0.0:{port}")
    print(f"   → Model: {OLLAMA_MODEL}")
    print("🚀 "*20 + "\n")
    app.run(host="0.0.0.0", port=port, debug=True)
