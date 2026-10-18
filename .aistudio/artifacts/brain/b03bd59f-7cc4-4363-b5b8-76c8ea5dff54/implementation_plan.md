# NutriScan: Supermarket Barcode Nutrition Monitor & Diary

A modern, responsive supermarket nutrition monitoring application that scans product barcodes using your device camera or uploaded photos, instantly breaks down caloric and macronutrient values, analyzes Nutri-Score (A–E) and NOVA ultra-processing groups (1–4), and logs meals into a daily calorie and macronutrient diary.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections in Phase 1, the core architecture and feature set have been locked in:
> - **Input Modality**: Live camera barcode scanning with photo upload and AI-powered label/ingredient analysis fallback.
> - **Nutrition Metrics**: Calories, macronutrients (protein, carbs, fat, fiber, sugars, sodium), official Nutri-Score (A–E), and NOVA food processing grade (1–4).
> - **Tracking Format**: Daily calorie and macro target dashboard with meal diary (Breakfast, Lunch, Dinner, Snacks), target progress rings, and historical food log.

- **Confirmed Decision 1**: Dual data source approach combining the global **Open Food Facts API** (over 3 million supermarket products worldwide) with a **Server-Side Gemini Vision API** endpoint for analyzing uploaded nutrition panels and ingredient lists when products aren't in the barcode database or barcodes are degraded.
- **Confirmed Decision 2**: Local offline-first diary storage (`localStorage`) with pre-loaded supermarket sample products so users can immediately test without needing a physical barcode scanner handy in testing environments.

---

### 1. Overview & Core Concept

- **What It Does**: Shoppers and health-conscious eaters scan any supermarket barcode or upload a food label photo to reveal complete nutritional values per 100g and per serving. It highlights Nutri-Score, NOVA processing level, and ingredient alerts, then lets users log the item into their daily diary with custom serving sizes.
- **Target Audience / Persona**: Everyday grocery shoppers, fitness enthusiasts tracking macros, individuals avoiding ultra-processed foods (UPFs), and diabetics/hypertension patients monitoring sugars and sodium.
- **Key Value**: Eliminates nutritional guesswork at the supermarket aisle, surfaces hidden processing levels and sugars, and seamlessly updates daily dietary goals in one fluid interface.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Barcode / Label Scan**:
   - User taps the prominent "Scan Product" action.
   - User points their camera at a supermarket barcode or uploads a photo of the product/nutrition label.
   - The app detects the barcode in real-time or sends the photo to the server-side Gemini Vision analyzer.
   - Quick one-click "Demo Barcodes" drawer allows instant testing with iconic supermarket items (e.g., Nutella, Heinz Baked Beans, Greek Yogurt, Oat Milk, Frozen Pizza).
2. **Product Nutrition Inspection**:
   - Detailed nutritional card reveals calories, macros (protein, fats, carbs, sugar, fiber, salt) per 100g and adjusted by serving size (e.g. 1 bowl / 30g).
   - Visual Nutri-Score indicator (A: dark green to E: dark orange/red) and NOVA group badge (1: Unprocessed to 4: Ultra-processed) with clear explanations.
   - Health notes: highlights high saturated fats, added sugars, artificial sweeteners, or clean ingredients.
3. **Daily Diary Logging**:
   - User chooses meal type (Breakfast, Lunch, Dinner, Snack) and serving quantity.
   - Daily progress bars and circular rings update instantly towards user-defined calorie and macro goals (e.g., 2,000 kcal, 130g protein, 220g carbs, 65g fats).
   - Food log list displays eaten items with macro summaries and quick deletion/editing.
4. **Nutrition Goals Customization**:
   - Modal to customize daily calorie targets and macro split (Protein / Carbs / Fat percentages or grams).

#### Visual Identity & Theme
- **Aesthetic Direction**: Clean Scandinavian health & wellness interface. Daylight clarity, crisp legibility, airy whitespace, and tactile data visualizations without AI visual clichés.
- **Color Palette**:
  - Neutral Canvas: Crisp white (`#FFFFFF`) / soft stone slate (`#F8FAFC`), dark mode ready (`#0F172A`).
  - Structural Surfaces: Pure white card surfaces (`#FFFFFF`), hairline subtle borders (`#E2E8F0` / `#1E293B`).
  - Brand & Accent Colors: Botanical emerald (`#059669` / `#10B981`) for health and Nutri-Score A, warm amber (`#D97706`) for Nutri-Score C / NOVA 3, and rich terracotta (`#E11D48`) for high-processed warning indicators.
- **Typography & Hierarchy**:
  - Display Face: `Plus Jakarta Sans` for clean, modern headings and numbers.
  - Body Face: `DM Sans` for high legibility on small food labels.
  - Metrics & Numbers: Tabular figures (`tabular-nums font-mono`) for precision nutrition counts.
- **Top Bar Contract**:
  - Zone 1: Wordmark `NutriScan`.
  - Zone 2: Navigation tabs (`Today's Diary`, `Scanner`, `Food History`, `Goal Settings`).
  - Zone 3: Primary CTA `+ Scan Food`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Barcode + Gemini Label Vision Pipeline**
  - *Chosen Approach*: Query Open Food Facts v2 API for standard EAN-13/UPC barcodes; simultaneously provide Gemini 3.8 Flash Vision fallback to extract nutrition facts from any nutrition facts panel or ingredient label photo.
  - *Why*: Supermarket barcodes occasionally differ by region, private-label store brands, or damaged packaging. Gemini Vision ensures 100% scanning success rate even if the barcode database lacks the exact product.
  - *Alternatives Considered*: Barcode-only scanning (fails on deli/bakery foods or unlisted local store items).
- **Decision 2: Client Camera Barcode Scanning with Web API & Fallback**
  - *Chosen Approach*: Use HTML5 Canvas / BarcodeDetector API with graceful manual barcode search & sample presets.
  - *Why*: High-speed 60fps scanning on mobile devices with zero latency or external cloud costs.
- **Decision 3: Zero-Friction Local State Persistence**
  - *Chosen Approach*: Persist meals, goals, and recent scans in browser `localStorage`.
  - *Why*: Instant offline availability at supermarket aisles with spotty reception, zero sign-in walls, and privacy for daily diet history.

---

### 4. Technical Architecture & Data Strategy

#### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NutriScan Client                              │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand Wordmark · View Tabs · Quick Scan CTA)          │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │    Daily Overview     │  │          Product Inspector            │  │
│  │ ───────────────────── │  │ ───────────────────────────────────── │  │
│  │ • Calorie Goal Ring   │  │ • Product Image & Brand               │  │
│  │ • Macro Progress Bars │  │ • Nutri-Score (A-E) & NOVA (1-4)      │  │
│  │ • Meal Group Diaries  │  │ • Nutrients Table (100g vs Serving)   │  │
│  │ • Quick Log Adder     │  │ • Ingredient & Processing Highlights  │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
│                                 ▲                                      │
│                                 │ (Selected Product)                   │
│  ┌──────────────────────────────┴───────────────────────────────────┐  │
│  │                     Scanner & Ingestion Modal                    │  │
│  │  - Live Video Stream & Barcode Scanner                           │  │
│  │  - Food Label Photo Upload & AI Vision Analyzer                  │  │
│  │  - Quick Demo Barcode Tray (Instant test items)                  │  │
│  │  - Manual EAN / UPC / Keyword Search Bar                         │  │
│  └───────────────────┬─────────────────────────┬────────────────────┘  │
└──────────────────────┼─────────────────────────┼───────────────────────┘
                       │                         │
          (Barcode EAN/UPC)             (Label Image Base64)
                       ▼                         ▼
   ┌─────────────────────────────┐   ┌───────────────────────────────┐
   │ Open Food Facts API (Proxy) │   │ Express Server: /api/analyze  │
   │  world.openfoodfacts.org    │   │  (Google GenAI: gemini-flash) │
   └─────────────────────────────┘   └───────────────────────────────┘
```

#### Data Model & State
```ts
interface ProductNutrition {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  servingGrams: number;
  caloriesPer100g: number;
  proteinsPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  sugarsPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  nutriscoreGrade?: 'a' | 'b' | 'c' | 'd' | 'e';
  novaGroup?: 1 | 2 | 3 | 4;
  ingredientsText?: string;
  allergens?: string[];
  healthLabels?: string[];
}

interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  product: ProductNutrition;
  quantityGrams: number;
  calculatedCalories: number;
  calculatedProteins: number;
  calculatedCarbs: number;
  calculatedFat: number;
  timestamp: number;
}

interface DailyNutritionGoals {
  calories: number; // e.g. 2100
  proteins: number; // e.g. 130
  carbs: number;    // e.g. 230
  fat: number;      // e.g. 70
}
```

#### Implementation Steps
1. **Server-side Gemini Endpoint**: Express route `/api/analyze-label` in full-stack setup using `@google/genai` (`gemini-3.8-flash`) with structured JSON schema for nutritional values and ingredients.
2. **Barcode Scanner Component**: HTML5 camera stream with frame analyzer, barcode detector, file upload dropzone, and pre-seeded supermarket barcodes for zero-friction evaluation.
3. **Product Inspection & Nutri-Score/NOVA Engine**: Detailed breakdown with interactive serving size scaler (100g slider, portion multiplier) and health grade explanations.
4. **Daily Macro & Calorie Tracker**: Meal diary by category (Breakfast, Lunch, Dinner, Snacks), real-time progress bars, goal tracker, and date picker.
5. **Polished Design & Ergonomics**: Full-width desktop and mobile ergonomics adhering to the frontend design guidelines with tabular numbers, unboxed metadata, and high-contrast color coding.
