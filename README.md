# PlantCare AI — Intelligent Plant Leaf Disease Detection & Agronomic Care

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TensorFlow](https://img.shields.io/badge/AI%20Model-MobileNetV2%20CNN-FF6F00.svg?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Language](https://img.shields.io/badge/i18n-English%20%7C%20%E0%B7%83%E0%B7%92%E0%B6%82%E0%B7%84%E0%B6%BD-22c55e.svg)](#bilingual-support)

**PlantCare AI** is a modern, full-stack smart agricultural decision-support web application designed to help growers, agronomists, and researchers identify plant leaf diseases early, verify plant species, and access verified agronomic treatment recommendations.

---

## 🌟 Key Features

* **BioCLIP & Gatekeeper Pre-screening**:
  * Automatically verifies whether the uploaded leaf belongs to a supported agricultural crop before running disease classification.
  * Blocks non-leaf images and unsupported plant species with clear gatekeeper advisory feedback.

* **MobileNetV2 Deep Learning Disease Classifier**:
  * Evaluates foliar color, texture, and lesion patterns across **15 distinct condition classes** for Tomato, Potato, and Bell Pepper with over **97% validation accuracy**.
  * Outputs diagnostic confidence scores, confirmation threshold checks, and top alternative predictions.

* **Verified Sri Lankan Treatment Recommendations**:
  * Integrates an agronomic treatment database adhering to recommendations from the **Sri Lanka Department of Agriculture (DOA)** and the **Office of the Registrar of Pesticides (ROP)**.
  * Provides structured 8-section guidance: *Disease Overview, Common Symptoms, Immediate Actions, Cultural Practices, Biological Controls, Officially Verified Chemical Controls, Long-term Prevention Tips, and References & DOA Hotline (1920)*.
  * Healthy foliage diagnoses automatically return sustainable plant care and maintenance protocols rather than chemical treatments.

* **Instant Bilingual Support (English / සිංහල)**:
  * Features a single, compact toggle switch in the navigation bar (**Toggle OFF = English**, **Toggle ON = සිංහල**).
  * Seamlessly translates the entire UI and dynamic backend classification results instantly without refreshing the page.
  * Full Sinhala Unicode typography rendered via Google's **Noto Sans Sinhala**.

---

## 🌾 Supported Crops & 15 Disease Classes

| Crop | Scientific Name | Condition / Disease Class | Pathogen / Type |
| :--- | :--- | :--- | :--- |
| **Bell Pepper** | *Capsicum annuum* | Bell Pepper Bacterial Spot | *Xanthomonas campestris pv. vesicatoria* (Bacterial) |
| **Bell Pepper** | *Capsicum annuum* | Healthy Bell Pepper Foliage | Healthy baseline |
| **Potato** | *Solanum tuberosum* | Potato Early Blight | *Alternaria solani* (Fungal) |
| **Potato** | *Solanum tuberosum* | Potato Late Blight (*Paschimaangamaraya*) | *Phytophthora infestans* (Oomycete) |
| **Potato** | *Solanum tuberosum* | Healthy Potato Foliage | Healthy baseline |
| **Tomato** | *Solanum lycopersicum* | Tomato Bacterial Spot | *Xanthomonas spp.* (Bacterial) |
| **Tomato** | *Solanum lycopersicum* | Tomato Early Blight | *Alternaria solani* (Fungal) |
| **Tomato** | *Solanum lycopersicum* | Healthy Tomato Foliage | Healthy baseline |
| **Tomato** | *Solanum lycopersicum* | Tomato Late Blight (*Paschimaangamaraya*) | *Phytophthora infestans* (Oomycete) |
| **Tomato** | *Solanum lycopersicum* | Tomato Leaf Mold | *Passalora fulva* (Fungal) |
| **Tomato** | *Solanum lycopersicum* | Tomato Septoria Leaf Spot | *Septoria lycopersici* (Fungal) |
| **Tomato** | *Solanum lycopersicum* | Two-Spotted Spider Mite Damage | *Tetranychus urticae* (Acarid pest) |
| **Tomato** | *Solanum lycopersicum* | Tomato Target Spot | *Corynespora cassiicola* (Fungal) |
| **Tomato** | *Solanum lycopersicum* | Tomato Mosaic Virus (ToMV) | Viral (*ToMV*) |
| **Tomato** | *Solanum lycopersicum* | Tomato Yellow Leaf Curl Virus (TYLCV) | Viral (*TYLCV*, Vector: *Bemisia tabaci*) |

*Roadmap Crops (curated in Disease Library)*: Apple, Corn, Grape, and Rice.

---

## 🏗️ Project Architecture

```
PlantCare-AI/
├── ai-model/
│   ├── trained_model/
│   │   ├── plant_disease_model.keras       # Trained MobileNetV2 model (23.45 MB)
│   │   ├── plant_gatekeeper_model.keras    # Gatekeeper verification model (9.28 MB)
│   │   ├── class_names.json                # 15 disease class labels
│   │   └── gatekeeper_class_names.json     # Gatekeeper crop labels
│   └── training/                           # Dataset preparation & training pipelines
├── backend/
│   ├── app/
│   │   ├── main.py                         # FastAPI application entrypoint
│   │   ├── config.py                       # Pydantic environment configuration
│   │   ├── data/
│   │   │   └── treatment_database.json     # DOA / ROP verified treatments database
│   │   ├── routes/                         # API routes (/api/predict, /api/treatments)
│   │   ├── schemas/                        # Pydantic request/response schemas
│   │   └── services/                       # Inference, BioCLIP gatekeeper & treatment services
│   ├── .env.example                        # Template environment variables
│   └── requirements.txt                    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/                     # Navbar, LanguageToggle, PredictionCard, TreatmentRecs
│   │   ├── pages/                          # Home, DetectDisease, Results, DiseaseLibrary, About
│   │   ├── i18n/                           # i18next configuration and en.json / si.json dictionaries
│   │   ├── services/                       # Frontend API client
│   │   └── utils/                          # Dynamic translation helpers
│   ├── public/                             # Static assets & hero seedling video
│   ├── package.json                        # Frontend dependencies
│   └── vite.config.js                      # Vite build configuration
├── documentation/                          # Architectural documentation
├── .gitignore                              # Comprehensive Git exclusion rules
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Python**: 3.10 or 3.11
* **Node.js**: v18+ and `npm`

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup (React + Vite)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & model readiness indicator |
| `POST` | `/api/predict` | Multipart leaf image upload, species gatekeeping & disease diagnosis |
| `GET` | `/api/treatments` | Retrieve all treatment database classes |
| `GET` | `/api/treatments/{class_label}` | Fetch full agronomic treatment plan for a specific disease |
| `GET` | `/api/treatments/categories` | List available treatment pathogen categories |

---

## 🔒 Security & Privacy
* Real secrets and local `.env` files are strictly excluded from version control via `.gitignore`.
* No agricultural treatment instructions are arbitrarily invented; chemical recommendations are grounded strictly in the official product registry of the Office of the Registrar of Pesticides, Sri Lanka.

---

## 📄 Agricultural Disclaimer
PlantCare AI is an educational and triage decision-support tool. It does not replace on-site physical evaluation by a professional agronomist. Always verify severe field outbreaks and chemical applications with your local Agricultural Instructor (AI) or Agrarian Services Centre (**DOA Hotline: 1920**).

---

## 👤 Author
Developed as part of the **PlantCare AI** Smart Agriculture Project.
