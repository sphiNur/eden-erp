import json
import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import User, Product
from app.dependencies import get_current_user
from openai import OpenAI

router = APIRouter(prefix="/ai", tags=["AI Order Parsing"])

# Define the expected output structure from the LLM
class ParsedItem(BaseModel):
    product_id: Optional[str] = Field(None, description="The matching UUID from the product catalog, or null if no exact match.")
    original_text: str = Field(..., description="The original raw text snippet (e.g., 'Toʻgʻralgan sariq sabzi 2 kilo')")
    predicted_item_name: str = Field(..., description="The normalized English or generic name for the item")
    quantity: float = Field(..., description="The parsed numerical quantity")
    unit: str = Field(..., description="The parsed unit (kg, gr, l, pcs, fleyka, pachka, etc). Normalize to kg/l/pcs if possible.")

class ParsedOrderResponse(BaseModel):
    items: List[ParsedItem]

class ParseOrderRequest(BaseModel):
    raw_text: str

@router.post("/parse-order", response_model=ParsedOrderResponse)
async def parse_order(
    request: ParseOrderRequest,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user) # Uncomment when auth is strictly needed
):
    # 1. Fetch the active product catalog to provide exact UUIDs to the LLM
    products_stmt = select(Product).where(Product.is_active == True)
    active_products = db.scalars(products_stmt).all()
    
    # 2. Build a compressed dictionary for the LLM prompt to minimize tokens
    catalog_context = []
    for p in active_products:
        # p.name_i18n is typically {"uz": "Sabzi", "en": "Carrot", "ru": "Морковь"}
        names = " | ".join([str(v) for v in p.name_i18n.values() if v])
        catalog_context.append(f"UUID: {str(p.id)} - Names: [{names}]")
    
    catalog_text = "\n".join(catalog_context)
    
    # 3. Initialize OpenAI Client (Requires OPENAI_API_KEY in environment)
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY environment variable is not set. AI parsing is unavailable.")
        
    client = OpenAI(api_key=api_key)
    
    system_prompt = f"""
    You are an expert procurement parsing assistant for a multi-lingual restaurant chain (Uzbek, Russian, English).
    The user will paste a chaotic, unstructured shopping list. 
    Your job is to translate and map each row to EXACTLY ONE matching product from our database catalog, extract the quantitative value, and return pure JSON.
    
    If an item perfectly matches or is a close logical match to an item in the catalog, provide its exact UUID. 
    If you are completely unsure or it clearly doesn't exist, set 'product_id' to null but still extract the quantity and name.
    
    Normalize units: 'kilo'/'kg' -> 'kg', 'gr'/'gram' -> 'kg' (and divide quantity by 1000), 'l'/'litr' -> 'l', 'ta'/'dona'/'sht' -> 'pcs', 'fleyka' (egg tray, usually 30 pcs) -> 'tray', 'pochka'/'pachka' -> 'pack'.
    
    --- CATALOG ---
    {catalog_text}
    """
    
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.raw_text}
            ],
            response_format=ParsedOrderResponse
        )
        
        parsed_result = response.choices[0].message.parsed
        return parsed_result
        
    except Exception as e:
        print(f"LLM Parsing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse order with AI: {str(e)}")
