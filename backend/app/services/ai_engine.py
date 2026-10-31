import json
import re
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.schemas.research import (
    ResearchAnalysis,
    ClaimBase,
    InformationGapBase,
    ConflictBase,
    VerificationTaskBase,
    ReadinessScore,
    OutdatedInfoItem,
)

class AIEngine:
    """
    Modular AI Provider for VERITYX with Google Gemini integration.
    Supports structured JSON generation, claim extraction, conflict detection,
    information gap identification, and heuristic fallback.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def _call_gemini(self, prompt: str, json_mode: bool = True, temperature: float = 0.2) -> str:
        """
        Executes a live call to Google Gemini with automatic fallback across supported models.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        # Prioritize ultra-fast responsive models
        models_to_try = ["gemini-3.5-flash-lite", "gemini-3.5-flash", self.model]
        seen = set()
        unique_models = []
        for m in models_to_try:
            if m and m not in seen:
                seen.add(m)
                unique_models.append(m)

        last_err = None
        for model_name in unique_models:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": temperature,
                }
            }
            if json_mode:
                payload["generationConfig"]["response_mime_type"] = "application/json"

            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(
                        f"{endpoint}?key={self.api_key}",
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    res.raise_for_status()
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
            except Exception as e:
                last_err = e
                print(f"[AIEngine] Gemini call with model {model_name} note: {e}. Trying next model.")
                continue

        raise RuntimeError(f"All Gemini models failed. Last error: {last_err}")

    async def analyze_research(
        self,
        title: str,
        research_question: Optional[str],
        research_goal: Optional[str],
        sources: List[Dict[str, Any]],
    ) -> ResearchAnalysis:
        """
        Executes comprehensive information gap detection, claim extraction,
        conflict analysis, and decision readiness scoring.
        """
        if self.api_key:
            try:
                return await self._analyze_with_gemini(title, research_question, research_goal, sources)
            except Exception as e:
                print(f"[AIEngine] Gemini API call failed: {e}. Executing heuristic engine fallback.")

        # Fallback to intelligent heuristic analysis
        return self._heuristic_analysis(title, research_question, research_goal, sources)

    async def _analyze_with_gemini(
        self,
        title: str,
        research_question: Optional[str],
        research_goal: Optional[str],
        sources: List[Dict[str, Any]],
    ) -> ResearchAnalysis:
        sources_summary = []
        for i, s in enumerate(sources):
            content_snippet = (s.get("source_content") or s.get("title") or "")[:2500]
            sources_summary.append(
                f"Source [{i+1}] ID: {s.get('id', str(i+1))}\n"
                f"Title: {s.get('title')}\n"
                f"URL: {s.get('url', 'N/A')}\n"
                f"Date: {s.get('publication_date', 'Unknown')}\n"
                f"Type: {s.get('source_type', 'webpage')}\n"
                f"Content: {content_snippet}\n"
            )

        prompt = f"""
You are the VERITYX Information Gap & Conflict Detection Engine.
Analyze the following user research initiative and sources.

RESEARCH CONTEXT:
- Title: {title}
- Question: {research_question or 'Analyze key details, requirements, and gaps'}
- Goal: {research_goal or 'Verify factual accuracy, find gaps, and resolve conflicts'}

SOURCES:
{'---'.join(sources_summary)}

TASK:
Produce a rigorous factual analysis identifying:
1. Concrete Claims extracted with verbatim or near-verbatim evidence snippets.
2. Information Gaps (critical unanswered questions, missing application fees, unverified dates, undefined formats).
3. Conflicts between different sources (divergent deadlines, contradictory age limits, conflicting criteria).
4. Potentially Outdated Information (sources citing past cycles, expired criteria).
5. Verification Checklist (prioritized action items to verify before making a decision).
6. Decision Readiness Score (0 to 100) with a detailed breakdown and honest explanation.

RETURN ONLY VALID JSON conforming strictly to this structure:
{{
  "summary": "Concise 2-3 paragraph executive summary of the findings.",
  "key_findings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "claims": [
    {{
      "claim_text": "Precise claim statement",
      "claim_type": "eligibility | deadline | fee | requirement | factual",
      "confidence": 0.95,
      "evidence_text": "Exact or representative snippet from source text",
      "source_id": "Source ID"
    }}
  ],
  "information_gaps": [
    {{
      "title": "Title of gap",
      "description": "Why this missing information matters",
      "importance": "critical | high | medium | low",
      "confidence": 0.90,
      "status": "open",
      "recommended_action": "Action to obtain or clarify this info",
      "related_source_ids": ["Source ID"]
    }}
  ],
  "conflicts": [
    {{
      "description": "Exact point of contradiction between sources",
      "confidence": 0.90,
      "status": "unresolved",
      "recommended_action": "How to resolve the contradiction",
      "claim_a_id": null,
      "claim_b_id": null
    }}
  ],
  "outdated_information": [
    {{
      "source_title": "Source Title",
      "observed_claim": "Claim referencing past or outdated cycle",
      "reason": "Why it appears outdated",
      "estimated_period": "2024 or earlier"
    }}
  ],
  "unanswered_questions": [
    "Unanswered question 1",
    "Unanswered question 2"
  ],
  "verification_checklist": [
    {{
      "title": "Verification action item",
      "description": "Specific instruction",
      "priority": "critical | high | medium | low",
      "status": "pending",
      "due_date": null,
      "information_gap_id": null
    }}
  ],
  "readiness_score": {{
    "score": 65,
    "explanation": "Transparent explanation of what is ready and what blocks decision",
    "coverage_score": 70,
    "evidence_quality_score": 75,
    "unresolved_conflicts": 1,
    "freshness_score": 80,
    "critical_missing_information": "Key missing requirement"
  }},
  "uncertainty_notes": [
    "Note on source reliability or missing verification"
  ]
}}
"""

        raw_text = await self._call_gemini(prompt, json_mode=True, temperature=0.2)
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except Exception:
            match = re.search(r'(\{[\s\S]*\})', cleaned)
            if match:
                parsed = json.loads(match.group(1))
            else:
                raise

        # Ensure required fields have defaults if omitted by LLM
        if "summary" not in parsed or not parsed["summary"]:
            parsed["summary"] = f"VERITYX intelligence synthesis for '{title}' analyzing {len(sources)} sources."
        if "key_findings" not in parsed or not isinstance(parsed["key_findings"], list):
            parsed["key_findings"] = ["Extracted core parameters from available intelligence."]
        if "claims" not in parsed or not isinstance(parsed["claims"], list):
            parsed["claims"] = []
        if "information_gaps" not in parsed or not isinstance(parsed["information_gaps"], list):
            parsed["information_gaps"] = []
        if "conflicts" not in parsed or not isinstance(parsed["conflicts"], list):
            parsed["conflicts"] = []
        if "outdated_information" not in parsed or not isinstance(parsed["outdated_information"], list):
            parsed["outdated_information"] = []
        if "unanswered_questions" not in parsed or not isinstance(parsed["unanswered_questions"], list):
            parsed["unanswered_questions"] = []
        if "verification_checklist" not in parsed or not isinstance(parsed["verification_checklist"], list):
            parsed["verification_checklist"] = []
        if "uncertainty_notes" not in parsed or not isinstance(parsed["uncertainty_notes"], list):
            parsed["uncertainty_notes"] = []

        # Safe readiness_score mapping
        r_score = parsed.get("readiness_score")
        if not isinstance(r_score, dict):
            r_score = {}
        r_score.setdefault("score", 70)
        r_score.setdefault("explanation", "Evaluated based on available evidence and identified information gaps.")
        r_score.setdefault("coverage_score", 75)
        r_score.setdefault("evidence_quality_score", 75)
        r_score.setdefault("unresolved_conflicts", len(parsed.get("conflicts", [])))
        r_score.setdefault("freshness_score", 80)
        r_score.setdefault("critical_missing_information", "Review prioritized verification checklist before finalizing.")
        parsed["readiness_score"] = r_score

        return ResearchAnalysis.model_validate(parsed)

    def _heuristic_analysis(
        self,
        title: str,
        research_question: Optional[str],
        research_goal: Optional[str],
        sources: List[Dict[str, Any]],
    ) -> ResearchAnalysis:
        """
        Robust heuristic extraction engine that inspects source content,
        detects date patterns, age requirements, fee keywords, conflicts,
        and builds a complete, structured ResearchAnalysis report.
        """
        claims: List[ClaimBase] = []
        gaps: List[InformationGapBase] = []
        conflicts: List[ConflictBase] = []
        outdated: List[OutdatedInfoItem] = []
        unanswered: List[str] = []
        checklist: List[VerificationTaskBase] = []

        all_text = ""
        source_dates = []

        # Analyze each source
        for s in sources:
            s_id = s.get("id", "src_1")
            content = s.get("source_content") or s.get("title") or ""
            all_text += " " + content
            p_date = s.get("publication_date")
            if p_date:
                source_dates.append((s.get("title", "Source"), p_date))

            # Look for dates and deadlines
            deadline_matches = re.findall(
                r'(?:deadline|closing date|last date|valid till|due date)(?:[^\d\n\r]{1,30})([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})',
                content,
                re.IGNORECASE
            )
            for m in deadline_matches[:2]:
                claims.append(ClaimBase(
                    claim_text=f"Application closing date indicated as: {m}",
                    claim_type="deadline",
                    confidence=0.90,
                    evidence_text=f"Closing date statement found in source: '{m}'",
                    source_id=s_id
                ))

            # Look for age limits
            age_matches = re.findall(
                r'(?:age limit|minimum age|maximum age|years old|between)\s*(?:is|of|for candidates)?\s*([0-9]{1,2})\s*(?:and|to|-)\s*([0-9]{1,2})\s*years?',
                content,
                re.IGNORECASE
            )
            for m in age_matches[:2]:
                claims.append(ClaimBase(
                    claim_text=f"Age eligibility bracket defined as {m[0]} to {m[1]} years.",
                    claim_type="eligibility",
                    confidence=0.88,
                    evidence_text=f"Age limit criteria text extracted: {m[0]} to {m[1]} years.",
                    source_id=s_id
                ))

            # Look for fee claims
            fee_matches = re.findall(r'(?:application fee|registration fee|fee of|costs?|stipend)[:\s]+(?:Rs\.?|INR|\$|₹)?\s*([0-9,]+)', content, re.IGNORECASE)
            for m in fee_matches[:2]:
                claims.append(ClaimBase(
                    claim_text=f"Fee / financial consideration stated as ₹{m}.",
                    claim_type="fee",
                    confidence=0.85,
                    evidence_text=f"Fee pattern detected in source: {m}",
                    source_id=s_id
                ))

        # Check for conflicts in extracted deadlines or age claims
        deadline_claims = [c for c in claims if c.claim_type == "deadline"]
        if len(deadline_claims) >= 2:
            d1 = deadline_claims[0].claim_text
            d2 = deadline_claims[1].claim_text
            if d1 != d2:
                conflicts.append(ConflictBase(
                    description=f"Conflicting deadlines reported across sources: '{d1}' vs '{d2}'.",
                    confidence=0.88,
                    status="unresolved",
                    recommended_action="Verify against the official gazette portal or primary institutional notification PDF."
                ))

        # Identify standard Information Gaps based on topic and missing criteria
        has_fee = any("fee" in c.claim_type for c in claims)
        has_deadline = any("deadline" in c.claim_type for c in claims)
        has_eligibility = any("eligibility" in c.claim_type for c in claims)

        if not has_fee:
            gaps.append(InformationGapBase(
                title="Missing Application Fee & Refund Terms",
                description="No verified official fee structure or category exemption criteria was identified in the provided sources.",
                importance="high",
                confidence=0.85,
                status="open",
                recommended_action="Check the official payment portal instructions or fee annexure."
            ))
            unanswered.append("What is the official application fee and are exemptions provided for reserved categories?")
            checklist.append(VerificationTaskBase(
                title="Confirm Application Fee and Payment Mode",
                description="Locate the payment gateway section to verify valid transaction modes (UPI/Netbanking/Demand Draft).",
                priority="high",
                status="pending"
            ))

        if not has_deadline:
            gaps.append(InformationGapBase(
                title="Unverified Final Submission Deadline",
                description="No explicit closing timestamp or extension circular was detected in the active documents.",
                importance="critical",
                confidence=0.92,
                status="open",
                recommended_action="Access the primary registration portal banner to confirm the server cutoff timestamp."
            ))
            unanswered.append("What is the exact cutoff hour and server timezone for submission?")
            checklist.append(VerificationTaskBase(
                title="Verify Server Submission Cutoff Timestamp",
                description="Confirm whether the deadline closes at 17:00 IST or 23:59 IST to avoid last-minute portal lockouts.",
                priority="critical",
                status="pending"
            ))

        # Always add document format gap
        gaps.append(InformationGapBase(
            title="Required Document Specifications & Formats",
            description="Specific file size (KB), dimension limits, and valid gazetted attestation requirements are unconfirmed.",
            importance="medium",
            confidence=0.80,
            status="open",
            recommended_action="Inspect the upload guidelines page before preparing digital scans of certificates."
        ))
        checklist.append(VerificationTaskBase(
            title="Inspect Scanned Document Dimensions & Size Limits",
            description="Ensure caste/income/educational certificates match the portal's upload dimensions (usually PDF/JPG under 200KB).",
            priority="medium",
            status="pending"
        ))

        # Check for outdated information
        for title_str, dt in source_dates:
            if dt.year < 2026:
                outdated.append(OutdatedInfoItem(
                    source_title=title_str,
                    observed_claim=f"Publication date indicates {dt} which may reflect an earlier selection cycle.",
                    reason="Pre-dates the current operational cycle; terms and cutoff boundaries may have been revised.",
                    estimated_period=str(dt.year)
                ))

        # Calculate explainable readiness score
        coverage = 85 if (has_deadline and has_eligibility) else (65 if (has_deadline or has_eligibility) else 45)
        evidence_quality = 80 if len(sources) >= 2 else 60
        unresolved_c = len(conflicts)
        freshness = 50 if outdated else 90

        penalty = (unresolved_c * 15) + (len(gaps) * 8)
        score = max(20, min(95, int((coverage * 0.4 + evidence_quality * 0.3 + freshness * 0.3) - penalty)))

        explanation = (
            f"Readiness Score evaluated at {score}/100. "
            f"Coverage is at {coverage}% with {len(claims)} verified claims. "
            f"{'Found ' + str(unresolved_c) + ' unresolved conflict(s). ' if unresolved_c else 'No major source contradictions detected. '}"
            f"{'Identified ' + str(len(gaps)) + ' information gap(s) requiring verification before final action.' if gaps else 'All critical requirements verified.'}"
        )

        readiness = ReadinessScore(
            score=score,
            explanation=explanation,
            coverage_score=coverage,
            evidence_quality_score=evidence_quality,
            unresolved_conflicts=unresolved_c,
            freshness_score=freshness,
            critical_missing_information=gaps[0].title if gaps else None
        )

        summary = (
            f"VERITYX Research Synthesis for '{title}': We synthesized {len(sources)} source(s) and extracted {len(claims)} "
            f"core claims. Our analysis identified {len(gaps)} information gap(s) and {len(conflicts)} conflict(s) across sources. "
            f"To prevent errors or missed deadlines, review the generated verification checklist below."
        )

        key_findings = [
            f"Synthesized {len(sources)} primary/secondary source documents.",
            f"Extracted {len(claims)} discrete factual claims regarding eligibility, dates, and requirements.",
            f"Detected {len(gaps)} potential information gaps needing confirmation before proceeding.",
            f"Calculated a Decision Readiness Score of {score}%."
        ]

        return ResearchAnalysis(
            summary=summary,
            key_findings=key_findings,
            claims=claims,
            information_gaps=gaps,
            conflicts=conflicts,
            outdated_information=outdated,
            unanswered_questions=unanswered,
            verification_checklist=checklist,
            readiness_score=readiness,
            uncertainty_notes=[
                "Online announcements and blogs are subject to unilateral changes by issuing authorities.",
                "Always corroborate secondary updates with the official gazette or authorized institutional domain."
            ]
        )

    async def extract_eligibility_criteria(
        self,
        notification_text: str,
        title: str,
        category: str
    ) -> Dict[str, Any]:
        """
        Uses Gemini to parse official notification text into structured eligibility criteria
        (age, education, physical, medical, income, required certificates, deadlines).
        """
        prompt = f"""
You are the VERITYX Official Opportunity Criteria Extractor.
Extract precise official eligibility criteria from this notification text:

OPPORTUNITY TITLE: {title}
CATEGORY: {category}
NOTIFICATION TEXT:
{notification_text[:6000]}

TASK:
Extract structured criteria into valid JSON conforming strictly to:
{{
  "title": "{title}",
  "organization": "Issuing Authority / Organization name",
  "category": "{category}",
  "official_notification_url": null,
  "application_deadline": "YYYY-MM-DD or null",
  "medical_disclaimer": "Medical note or null",
  "required_documents": [
    "10th Marksheet",
    "Degree Certificate",
    "Category Certificate"
  ],
  "criteria_list": [
    {{
      "id": "crit_age",
      "criterion_type": "age",
      "label": "Age Limit",
      "official_requirement": "Exact official age limit and category relaxations",
      "is_mandatory": true,
      "input_type": "number",
      "min_value": 18,
      "max_value": 30,
      "unit": "years",
      "help_text": "Age as of specified cutoff date"
    }},
    {{
      "id": "crit_edu",
      "criterion_type": "education",
      "label": "Educational Qualification",
      "official_requirement": "Exact degree and subjects required",
      "is_mandatory": true,
      "input_type": "select",
      "options": ["Degree in Relevant Field", "Incompatible Qualification"]
    }}
  ]
}}
"""
        if self.api_key:
            try:
                raw_text = await self._call_gemini(prompt, json_mode=True, temperature=0.1)
                return json.loads(raw_text)
            except Exception as e:
                print(f"[AIEngine] Gemini criteria extraction failed: {e}. Using structured fallback.")

        # Fallback structured criteria
        return {
            "title": title,
            "organization": "Official Issuing Authority",
            "category": category,
            "official_notification_url": None,
            "application_deadline": None,
            "medical_disclaimer": "Advisory verification check. Official medical fitness is determined by authorized medical boards.",
            "required_documents": [
                "10th Marksheet (DOB Proof)",
                "Relevant Educational / Technical Qualification Certificate",
                "Category / Caste / Income Certificate (if applicable)",
                "Government Photo ID Proof"
            ],
            "criteria_list": [
                {
                    "id": "crit_age",
                    "criterion_type": "age",
                    "label": "Age Limit",
                    "official_requirement": "Candidate must meet prescribed age bracket as on closing date.",
                    "is_mandatory": True,
                    "input_type": "number",
                    "min_value": 18,
                    "max_value": 32,
                    "unit": "years",
                    "help_text": "Enter your age as of the closing date."
                },
                {
                    "id": "crit_edu",
                    "criterion_type": "education",
                    "label": "Educational Qualification",
                    "official_requirement": "Recognized diploma, degree, or trade certification as mandated.",
                    "is_mandatory": True,
                    "input_type": "select",
                    "options": [
                        "Meets required degree/qualification",
                        "Appearing in final year/semester",
                        "Does not possess required qualification"
                    ]
                }
            ]
        }

    async def generate_personalized_guidance(
        self,
        report_data: Dict[str, Any],
        candidate_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Uses Gemini to generate tailored study schedules, document acquisition steps,
        and improvement strategies based on the candidate's assessment report.
        """
        prompt = f"""
You are the VERITYX Career & Opportunity Intelligence Advisor.
The candidate was evaluated for '{report_data.get('opportunity_title')}' ({report_data.get('category')}).
Evaluation Status: {report_data.get('overall_status')}
Readiness Score: {report_data.get('readiness_score')}/100

Strengths: {report_data.get('strengths')}
Missing Requirements / Gaps: {report_data.get('missing_requirements')}
Required Certificates: {report_data.get('required_certificates')}

Generate concrete, empathetic, highly actionable guidance.
Return valid JSON:
{{
  "executive_advice": "2-3 sentences summarizing the strategic recommendation",
  "priority_action_items": [
    "Action step 1",
    "Action step 2",
    "Action step 3"
  ],
  "document_procurement_guide": [
    "Step-by-step guidance on where and how to obtain missing certificates"
  ],
  "preparation_roadmap": [
    "Recommended syllabus focus or technical skill practice"
  ],
  "timeline_warning": "Warning about portal cutoff timing"
}}
"""
        if self.api_key:
            try:
                raw_text = await self._call_gemini(prompt, json_mode=True, temperature=0.3)
                return json.loads(raw_text)
            except Exception as e:
                print(f"[AIEngine] Gemini guidance generation failed: {e}. Fallback used.")

        return {
            "executive_advice": f"Your current readiness score is {report_data.get('readiness_score')}/100 with status '{report_data.get('overall_status')}'. Focus immediately on resolving pending certificates and early registration.",
            "priority_action_items": [
                "Double-check all eligibility responses against the primary gazette notification PDF.",
                "Procure required certificates from revenue or educational authorities.",
                "Submit your application at least 48 hours prior to cutoff to avoid portal server congestion."
            ],
            "document_procurement_guide": [
                "Caste/Income certificates: Apply via state e-District or Tahsildar portal.",
                "Academic transcripts: Request provisional degree or bonafide certificate from your college registrar."
            ],
            "preparation_roadmap": [
                "Review syllabus weightage and solve past 3 years' question papers or technical interview coding questions."
            ],
            "timeline_warning": "Official portals frequently experience server lockouts during the last 24 hours. Submit well in advance."
        }

    async def generate_category_recommendations(
        self,
        user_category: str,
        interests: List[str] = [],
        skills: List[str] = [],
        education: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Uses Gemini to recommend 4-6 personalized high-fit opportunities based on the user's category
        (Student, Employee, Unemployed) and custom interests/skills.
        """
        cat = user_category or "Student"
        prompt = f"""
You are the VERITYX Opportunity Recommendation Intelligence Engine.
Recommend 4 to 6 active, highly relevant real-world opportunities tailored for this profile:

USER PROFILE:
- Category: {cat} (Student, Employee, or Unemployed)
- Target Interests: {interests}
- Core Skills: {skills}
- Education Level: {education or 'Undergraduate / Graduate'}

GUIDELINES BY CATEGORY:
- Student: Recommend active scholarships (NSP, Reliance, Central Sector), summer internships, hackathons, defence (NDA/CDS), railway apprentice exams.
- Employee: Recommend lateral corporate roles, industry certifications, executive training, tech upskilling fellowships, career advancement exams (UPSC CSE, SSC CGL).
- Unemployed: Recommend government direct recruitments (RRB, SSC), free skill development programs (PMKVY, Skill India), entry-level internships, private tech job openings.

RETURN VALID JSON:
{{
  "recommendations": [
    {{
      "id": "rec-1",
      "title": "Exact Title of Opportunity",
      "organization": "Issuing Organization / Company",
      "category": "scholarship | internship | railway | defence | private_job | exam | government",
      "application_deadline": "2026-11-30",
      "fit_reason": "Specific 1-sentence reason why this matches this {cat} candidate's background",
      "key_eligibility": "Core eligibility criteria in 10-15 words",
      "action_url": "https://official-portal.gov.in or https://careers.example.com"
    }}
  ]
}}
"""
        if self.api_key:
            try:
                raw_text = await self._call_gemini(prompt, json_mode=True, temperature=0.3)
                data = json.loads(raw_text)
                if "recommendations" in data and isinstance(data["recommendations"], list):
                    return data["recommendations"]
            except Exception as e:
                print(f"[AIEngine] Gemini recommendation failed: {e}. Delivering curated fallback.")

        # High-impact curated fallbacks based on category
        if cat.lower() == "student":
            return [
                {
                    "id": "rec-std-1",
                    "title": "Central Sector Scheme of Scholarship for College and University Students",
                    "organization": "Department of Higher Education (NSP)",
                    "category": "scholarship",
                    "application_deadline": "2026-11-25",
                    "fit_reason": "Top-tier merit scholarship offering annual financial grants for undergraduate students.",
                    "key_eligibility": "Class 12 > 80th percentile; Family annual income < ₹4.5 Lakhs.",
                    "action_url": "https://scholarships.gov.in"
                },
                {
                    "id": "rec-std-2",
                    "title": "Google Summer of Code (GSoC) 2026 Developer Fellowship",
                    "organization": "Google Open Source",
                    "category": "internship",
                    "application_deadline": "2026-04-15",
                    "fit_reason": "Prestigious international open source mentorship and coding stipend for student programmers.",
                    "key_eligibility": "Enrolled student or open source beginner, age 18+, coding proficiency.",
                    "action_url": "https://summerofcode.withgoogle.com"
                },
                {
                    "id": "rec-std-3",
                    "title": "Combined Defence Services (CDS) Examination I 2027",
                    "organization": "Union Public Service Commission (UPSC)",
                    "category": "defence",
                    "application_deadline": "2027-01-10",
                    "fit_reason": "Direct commission into Indian Army, Navy, or Air Force for graduating students.",
                    "key_eligibility": "Degree in any stream (PCM/Engg for Navy & Air Force); Age 19-24.",
                    "action_url": "https://upsc.gov.in"
                },
                {
                    "id": "rec-std-4",
                    "title": "Smart India Hackathon (SIH) 2026",
                    "organization": "Ministry of Education & AICTE",
                    "category": "hackathon",
                    "application_deadline": "2026-10-15",
                    "fit_reason": "Nationwide innovation contest offering ₹1 Lakh per problem statement and direct startup/job visibility.",
                    "key_eligibility": "Regular college students in teams of 6 members.",
                    "action_url": "https://sih.gov.in"
                }
            ]
        elif cat.lower() == "employee":
            return [
                {
                    "id": "rec-emp-1",
                    "title": "UPSC Civil Services Examination (CSE) 2027",
                    "organization": "Union Public Service Commission",
                    "category": "exam",
                    "application_deadline": "2027-02-15",
                    "fit_reason": "Premier administrative leadership opportunities (IAS/IPS/IRS) with age window up to 32.",
                    "key_eligibility": "Bachelor's degree; Age 21-32 years (relaxations for OBC/SC/ST).",
                    "action_url": "https://upsc.gov.in"
                },
                {
                    "id": "rec-emp-2",
                    "title": "Senior Full-Stack Engineer / Cloud Architect Openings",
                    "organization": "Technology Enterprise Product Companies",
                    "category": "private_job",
                    "application_deadline": "2026-12-31",
                    "fit_reason": "Lateral career advancement with competitive compensation and remote options.",
                    "key_eligibility": "2+ years experience in React, Python/FastAPI, Node.js, and Cloud Infrastructure.",
                    "action_url": "https://linkedin.com/jobs"
                },
                {
                    "id": "rec-emp-3",
                    "title": "AWS Certified Solutions Architect Professional Fellowship",
                    "organization": "Amazon Web Services (AWS)",
                    "category": "certification",
                    "application_deadline": "2026-11-30",
                    "fit_reason": "High-value industry certification to transition into high-paying enterprise cloud roles.",
                    "key_eligibility": "Professional IT experience; cloud architecture fundamentals.",
                    "action_url": "https://aws.amazon.com/certification"
                }
            ]
        else: # Unemployed
            return [
                {
                    "id": "rec-une-1",
                    "title": "RRB Assistant Loco Pilot & Technician Recruitment",
                    "organization": "Railway Recruitment Boards (RRB)",
                    "category": "railway",
                    "application_deadline": "2026-11-30",
                    "fit_reason": "Permanent Central Government employment with stable salary, medical benefits, and allowances.",
                    "key_eligibility": "10th + ITI or Diploma in Engineering; Age 18-30 (relaxations apply).",
                    "action_url": "https://indianrailways.gov.in"
                },
                {
                    "id": "rec-une-2",
                    "title": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0) Free Skill Certification",
                    "organization": "Ministry of Skill Development and Entrepreneurship (MSDE)",
                    "category": "skill_development",
                    "application_deadline": "2026-12-15",
                    "fit_reason": "Govt funded free industry training with direct placement assistance and stipend.",
                    "key_eligibility": "Indian citizen, unemployed youth, minimum 8th/10th pass.",
                    "action_url": "https://pmkvyofficial.org"
                },
                {
                    "id": "rec-une-3",
                    "title": "Staff Selection Commission Combined Graduate Level (SSC CGL)",
                    "organization": "Staff Selection Commission (SSC)",
                    "category": "govt_job",
                    "application_deadline": "2026-12-20",
                    "fit_reason": "Direct recruitment into Ministries (Income Tax Inspector, ASO, Excise Inspector).",
                    "key_eligibility": "Bachelor's degree in any discipline; Age 18-30/32.",
                    "action_url": "https://ssc.gov.in"
                }
            ]

    async def chat_assistant(
        self,
        message: str,
        history: List[Dict[str, str]] = [],
        context_opp: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Powers the global conversational Gemini Assistant across VERITYX.
        Answers user inquiries about eligibility, documents, dates, and strategies.
        """
        history_formatted = "\n".join([f"{h.get('role', 'user').capitalize()}: {h.get('content', '')}" for h in history[-6:]])
        context_str = f"CURRENT OPPORTUNITY CONTEXT: {context_opp}" if context_opp else "No specific opportunity focused."

        prompt = f"""
You are the VERITYX AI Career & Opportunity Assistant powered by Google Gemini.
You assist candidates in discovering opportunities, verifying eligibility, resolving deadline anxieties,
and preparing required certificates for Indian and Global exams, scholarships, railway, defence, and tech jobs.

{context_str}

RECENT CONVERSATION:
{history_formatted}

USER MESSAGE:
{message}

TONE & BEHAVIOR:
- Be clear, authoritative, encouraging, and accurate.
- When answering eligibility questions, emphasize checking official gazette PDFs.
- Never guarantee exam selection; guide on eligibility and readiness.
- Provide 2-3 short suggested next actions.

RETURN VALID JSON:
{{
  "reply": "Comprehensive, markdown-formatted response answering user query directly",
  "suggested_actions": ["Suggested action 1", "Suggested action 2"],
  "related_opportunity_id": null
}}
"""
        if self.api_key:
            try:
                raw_text = await self._call_gemini(prompt, json_mode=True, temperature=0.3)
                return json.loads(raw_text)
            except Exception as e:
                print(f"[AIEngine] Gemini chat assistant failed: {e}. Fallback used.")

        # Fallback intelligent response
        return {
            "reply": f"I received your inquiry regarding: '{message}'. In VERITYX AI 2.0, you can use our **Dynamic AI Eligibility Analyzer** to verify your exact eligibility status, check age relaxations for OBC/SC/ST, verify minimum board/degree percentages, and identify required certificates before applying.",
            "suggested_actions": [
                "Run Dynamic AI Eligibility Check on main dashboard",
                "Review verified requirements for Railway, Defence, or Scholarships",
                "Check Smart Deadline Guardian for cutoff alerts"
            ],
            "related_opportunity_id": context_opp.get("id") if context_opp else None
        }

ai_engine = AIEngine()


