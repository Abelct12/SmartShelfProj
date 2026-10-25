from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter()

FOOD_GUIDELINES: List[Dict[str, Any]] = [
    {
        "category": "Dairy",
        "optimal_temperature_range": "1°C to 4°C (34°F to 39°F)",
        "optimal_humidity_range": "50% to 65% RH",
        "recommended_packaging": "Aseptically sealed cartons, oxygen-barrier plastic bottles, vacuum sealed tubs",
        "primary_spoilage_mechanisms": [
            "Bacterial acidification via lactic acid bacteria (Lactobacillus, Lactococcus)",
            "Psychrotrophic proteolysis and lipolysis (Pseudomonas fluorescens)",
            "Mold growth on cheese surfaces (Penicillium commune)"
        ],
        "critical_food_safety_rule": "USDA/FDA Danger Zone: Dairy kept above 4°C for > 2 hours allows rapid proliferation of Staphylococcus aureus and Listeria monocytogenes.",
        "typical_shelf_life_unopened": "10 to 18 days refrigerated (fluid milk); 3 to 8 weeks (pasteurized hard cheeses)",
        "source": "USDA Food Safety and Inspection Service (FSIS); FDA Food Code §3-501.16"
    },
    {
        "category": "Meat & Poultry",
        "optimal_temperature_range": "0°C to 2°C (32°F to 36°F) fresh; ≤ -18°C (0°F) frozen",
        "optimal_humidity_range": "85% to 90% RH (controlled to prevent surface slime without excessive drying)",
        "recommended_packaging": "Vacuum Skin Packaging (VSP), High-Barrier Modified Atmosphere (MAP: 70–80% O2 / 20–30% CO2 or 0.4% CO)",
        "primary_spoilage_mechanisms": [
            "Aerobic putrefaction by Pseudomonas spp., resulting in volatile sulfur compounds and surface slime",
            "Oxidative rancidity of polyunsaturated fatty acids",
            "Metmyoglobin pigment formation causing surface browning"
        ],
        "critical_food_safety_rule": "Store on bottom refrigerator shelf below ready-to-eat foods to prevent cross-contamination from raw drip. Consume or freeze within 1–2 days for raw ground meat or poultry.",
        "typical_shelf_life_unopened": "1 to 2 days (raw poultry/ground beef); 3 to 5 days (whole beef/pork cuts); 6 to 12 months (frozen)",
        "source": "USDA FSIS 'Safe Minimum Internal Temperature and Food Storage Guidelines'; International Commission on Microbiological Specifications for Foods (ICMSF)"
    },
    {
        "category": "Seafood",
        "optimal_temperature_range": "-1°C to 1°C (30°F to 34°F) packed on flaked melting ice",
        "optimal_humidity_range": "90% to 95% RH",
        "recommended_packaging": "Permeable film (≥ 10,000 cc/m²/24hr OTR) for refrigerated raw seafood; vacuum packs must remain strictly below 3.3°C",
        "primary_spoilage_mechanisms": [
            "Rapid psychrotrophic bacterial growth (Shewanella putrefaciens, Photobacterium phosphoreum)",
            "Enzymatic autolysis yielding trimethylamine (TMA) and histamine",
            "Rapid lipid oxidation in fatty species (salmon, mackerel)"
        ],
        "critical_food_safety_rule": "FDA Fish and Fishery Products Hazards Guide warns: Vacuum-packed seafood stored above 3.3°C (38°F) risks germination of non-proteolytic Clostridium botulinum Type E without visible spoilage.",
        "typical_shelf_life_unopened": "1 to 3 days (fresh finfish); 4 to 9 months (frozen at -18°C)",
        "source": "FDA Fish and Fishery Products Hazards and Controls Guidance (4th Edition); FAO Fisheries Technical Paper No. 348"
    },
    {
        "category": "Fruits",
        "optimal_temperature_range": "0°C to 4°C (berries, apples, temperate); 10°C to 14°C (bananas, mangoes, citrus to prevent chilling injury)",
        "optimal_humidity_range": "85% to 95% RH",
        "recommended_packaging": "Perforated polyethylene bags, macro-perforated clamshell containers allowing respiratory gas exchange",
        "primary_spoilage_mechanisms": [
            "Postharvest respiratory exhaustion and ethylene-mediated senescence",
            "Moisture loss leading to shriveling and skin depression",
            "Fungal rots (Botrytis cinerea grey mold, Rhizopus stolonifer soft rot)"
        ],
        "critical_food_safety_rule": "Do not wash fresh berries prior to refrigeration; moisture trapped in calyx initiates fungal spore germination within 24–48 hours.",
        "typical_shelf_life_unopened": "2 to 7 days (fresh berries); 2 to 6 weeks (crisp apples refrigerated); 4 to 7 days (room temperature bananas)",
        "source": "University of California Postharvest Technology Center; USDA Agriculture Handbook 66"
    },
    {
        "category": "Vegetables",
        "optimal_temperature_range": "0°C to 5°C (leafy greens, crucifers, root vegetables); 7°C to 10°C (cucumbers, peppers, tomatoes)",
        "optimal_humidity_range": "90% to 98% RH (in high-humidity refrigerator crisper drawers)",
        "recommended_packaging": "Micro-perforated breathable poly-films, anti-fog packaging",
        "primary_spoilage_mechanisms": [
            "Bacterial soft rot caused by Pectobacterium carotovorum",
            "Enzymatic chlorophyll degradation and yellowing",
            "Lignification (toughening of asparagus/broccoli stems)"
        ],
        "critical_food_safety_rule": "Avoid anaerobic conditions for fresh produce: oxygen concentrations below 1–2% induce fermentative alcoholic off-odors and promote anaerobe proliferation.",
        "typical_shelf_life_unopened": "3 to 7 days (leafy salad greens); 1 to 3 weeks (broccoli, carrots)",
        "source": "Kader, A. A. Postharvest Technology of Horticultural Crops; FAO Corporate Document Repository"
    },
    {
        "category": "Bakery",
        "optimal_temperature_range": "18°C to 22°C (64°F to 72°F) room temperature; avoid 2°C to 6°C refrigeration for plain breads",
        "optimal_humidity_range": "35% to 50% RH (dry ambient environment)",
        "recommended_packaging": "Waxed paper wrap, polyethylene bread bags with twist ties; MAP with CO2/N2 flushing for extended shelf-life pastries",
        "primary_spoilage_mechanisms": [
            "Starch retrogradation (amylose/amylopectin recrystallization causing crumb firming/staling)",
            "Moisture migration from crumb to crust causing loss of crispness",
            "Mold contamination by Penicillium, Aspergillus, and Rhizopus spores post-baking"
        ],
        "critical_food_safety_rule": "Refrigeration at 4°C paradoxically maximizes starch crystallization rate (staling occurs up to 6x faster than at room temperature). Store in bread bin or freeze directly at -18°C.",
        "typical_shelf_life_unopened": "3 to 7 days (unpreserved artisan bread at room temp); 10 to 14 days (preserved commercial bread); 3 months (frozen)",
        "source": "American Institute of Baking (AIB International); Journal of Food Science & Technology 'Staling in Bakery Products'"
    }
]

@router.get("/food-guidelines", tags=["Food Science Guidelines"])
def get_food_guidelines():
    """
    Retrieve empirical food storage standards and scientific domain reference guidelines
    from peer-reviewed literature, USDA FSIS, and FDA Food Codes.
    """
    return {
        "status": "success",
        "disclaimer": "Educational Domain Reference: These guidelines represent established food technology standards and literature recommendations. They are distinct from machine learning prediction outputs.",
        "guidelines": FOOD_GUIDELINES
    }
