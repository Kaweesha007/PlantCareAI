from typing import List, Optional
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    """Reliable agricultural source reference."""

    title: str = Field(..., description="Title of official advisory document, bulletin, or manual")
    institution: str = Field(..., description="Issuing authority (e.g., Department of Agriculture Sri Lanka, ROP)")
    url: str = Field(..., description="Web resource URL or contact hotline")
    verification_date: str = Field(..., description="Date of verification in ISO YYYY-MM-DD format")


class ChemicalActiveIngredient(BaseModel):
    """Officially registered chemical active ingredient."""

    name: str = Field(..., description="Active ingredient name and formulation (e.g., Mancozeb 80% WP)")
    type: str = Field(..., description="Fungicide / bactericide classification and FRAC mode of action")
    rop_status: str = Field(..., description="Registration status under Office of the Registrar of Pesticides Sri Lanka")


class ChemicalControl(BaseModel):
    """Officially verified chemical management guidance."""

    status: str = Field(..., description="Verification status ('officially_verified', 'not_applicable', 'unavailable_no_chemical_cure')")
    active_ingredients: List[ChemicalActiveIngredient] = Field(default_factory=list, description="Registered active ingredients")
    application_notes: str = Field(..., description="Application rules, timing, label adherence, and PHI warnings")
    authority_guidance: str = Field(..., description="Guidance and resistance warnings from the Department of Agriculture")


class TreatmentRecommendation(BaseModel):
    """Structured agronomic treatment and management recommendation."""

    class_label: str = Field(..., description="Matching disease model classification label")
    crop: str = Field(..., description="Host crop common name")
    scientific_crop_name: str = Field(..., description="Botanical name of host crop")
    condition_type: str = Field(..., description="Condition category ('disease', 'healthy', 'pest_damage')")
    pathogen_type: str = Field(..., description="Pathogen group ('Fungal', 'Bacterial', 'Oomycete', 'Viral', 'Arachnid Pest', 'None')")
    disease_name: str = Field(..., description="Standard disease or plant condition name")
    scientific_name: str = Field(..., description="Causal agent scientific binomial or taxonomic name")
    short_description: str = Field(..., description="Short pathology overview and epidemiology")
    common_symptoms: List[str] = Field(default_factory=list, description="Common diagnostic foliar and fruit symptoms")
    immediate_actions: List[str] = Field(default_factory=list, description="Immediate triage and containment steps")
    cultural_and_preventive_practices: List[str] = Field(default_factory=list, description="Sanitation, spacing, irrigation, and rotation practices")
    biological_control_options: List[str] = Field(default_factory=list, description="Bio-control agents, biopesticides, and botanicals")
    chemical_control_options: ChemicalControl = Field(..., description="Officially registered chemical recommendations")
    prevention_tips: List[str] = Field(default_factory=list, description="Long-term agronomic prevention strategies")
    reliable_information_sources: List[SourceReference] = Field(default_factory=list, description="Authoritative reference sources")


class TreatmentCategoryItem(BaseModel):
    """Pathogen category summary with condition count."""

    id: str = Field(..., description="Category identifier (e.g., 'fungal', 'bacterial', 'viral', 'healthy', 'pest')")
    name: str = Field(..., description="Display title for the category")
    description: str = Field(..., description="Category scope and explanation")
    condition_count: int = Field(..., ge=0, description="Number of cataloged conditions in this category")


class TreatmentCategoriesResponse(BaseModel):
    """Response payload for GET /api/treatments/categories."""

    categories: List[TreatmentCategoryItem] = Field(..., description="Available treatment categories")
    crops: List[str] = Field(..., description="Supported crops covered by the treatment database")
    total_conditions: int = Field(..., ge=0, description="Total number of conditions in the database")


class TreatmentListResponse(BaseModel):
    """Response payload for GET /api/treatments."""

    total: int = Field(..., ge=0, description="Total items returned matching filters")
    items: List[TreatmentRecommendation] = Field(..., description="Treatment recommendations")
