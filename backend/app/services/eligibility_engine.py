"""
VERITYX AI 2.0 - Dynamic AI Eligibility & Selection Readiness Analyzer
Deterministic verification engine with transparent rule checking,
verified opportunity templates, and explainable readiness scoring.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
import uuid

from app.schemas.eligibility import (
    CriterionRequirement,
    OpportunityCriteria,
    CandidateProfileInput,
    CriterionEvaluationResult,
    ReadinessBreakdown,
    EligibilityAssessmentReport,
)

# Pre-configured Verified Templates
VERIFIED_OPPORTUNITY_TEMPLATES: List[OpportunityCriteria] = [
    OpportunityCriteria(
        opportunity_id="tmpl-railway-alp",
        title="RRB Assistant Loco Pilot (ALP) & Technician",
        organization="Railway Recruitment Boards (RRB), Ministry of Railways",
        category="railway",
        official_notification_url="https://indianrailways.gov.in",
        application_deadline="2026-11-30",
        medical_disclaimer="Medical fitness (Distance Vision 6/6 without glasses with fogging test + colour vision) is assessed strictly by Railway Medical Authorities. This evaluation is an advisory pre-check.",
        required_documents=[
            "10th / Matriculation Certificate (DOB Proof)",
            "ITI Certificate (NCVT/SCVT) OR Engineering Diploma",
            "Caste Certificate (OBC-NCL / SC / ST if applicable)",
            "Aadhaar Card",
            "Passport Size Photographs"
        ],
        criteria_list=[
            CriterionRequirement(
                id="alp-age",
                criterion_type="age",
                label="Age Limit (as of 01-07-2026)",
                official_requirement="18 to 30 years. Category relaxations: OBC: +3 years (up to 33), SC/ST: +5 years (up to 35), PwD: Not eligible for ALP due to safety category.",
                is_mandatory=True,
                input_type="number",
                min_value=18,
                max_value=30,
                unit="years",
                help_text="Enter your age as of July 1, 2026."
            ),
            CriterionRequirement(
                id="alp-education",
                criterion_type="education",
                label="Educational / Technical Qualification",
                official_requirement="Matriculation / SSLC plus ITI from recognized NCVT/SCVT institutions in specified trades OR 3 Years Diploma in Mechanical / Electrical / Electronics / Automobile Engineering.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "10th Pass + ITI (Relevant Trade)",
                    "3 Years Polytechnic Diploma (Mechanical/Electrical/Electronics/Auto)",
                    "B.E. / B.Tech (Mechanical/Electrical/Electronics/Auto)",
                    "10th / 12th Pass Only (No Technical Qualification)",
                    "Graduate in Non-Engineering Subject"
                ]
            ),
            CriterionRequirement(
                id="alp-vision",
                criterion_type="medical",
                label="Medical Standard - Distant Vision (A-1 Category)",
                official_requirement="6/6, 6/6 without glasses with fogging test (must not accept +2D). Must pass colour vision and binocular tests.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "6/6 without glasses (Normal Colour Vision)",
                    "6/6 or 6/9 with glasses",
                    "Requires corrective spectacles/lenses",
                    "Colour Blind or Defective Vision"
                ]
            )
        ]
    ),
    OpportunityCriteria(
        opportunity_id="tmpl-defence-nda",
        title="National Defence Academy (NDA) & Naval Academy Exam",
        organization="Union Public Service Commission (UPSC) & Armed Forces",
        category="defence",
        official_notification_url="https://upsc.gov.in",
        application_deadline="2026-12-15",
        medical_disclaimer="Final physical, mental, and medical standards are adjudicated strictly by the Services Selection Board (SSB) and Special Medical Board (SMB).",
        required_documents=[
            "10th Class Passing Certificate (Date of Birth Proof)",
            "12th Class Marksheet / Passing Certificate",
            "Photo ID Card (Aadhaar / Voter ID / Passport)",
            "Domicile / Identity Proof"
        ],
        criteria_list=[
            CriterionRequirement(
                id="nda-age",
                criterion_type="age",
                label="Age Bracket (Born between 02-07-2007 and 01-07-2010)",
                official_requirement="16.5 to 19.5 years. No category relaxation in age limit for any reserved category.",
                is_mandatory=True,
                input_type="number",
                min_value=16.5,
                max_value=19.5,
                unit="years",
                help_text="Unmarried male and female candidates only."
            ),
            CriterionRequirement(
                id="nda-education",
                criterion_type="education",
                label="Educational Qualification",
                official_requirement="For Army Wing: 12th Class pass of 10+2 pattern (any stream). For Air Force and Navy: 12th Class pass with Physics, Chemistry and Mathematics (PCM).",
                is_mandatory=True,
                input_type="select",
                options=[
                    "12th Pass with Physics, Chemistry & Mathematics (PCM)",
                    "12th Appearing with PCM",
                    "12th Pass (Non-PCM / Commerce / Humanities)",
                    "10th Pass only"
                ]
            ),
            CriterionRequirement(
                id="nda-height",
                criterion_type="physical",
                label="Minimum Height",
                official_requirement="Minimum 157 cm for Army/Navy (162.5 cm for Air Force Flying branch). 5 cm relaxation for Gorkhas and NE candidates.",
                is_mandatory=True,
                input_type="number",
                min_value=157,
                unit="cm"
            ),
            CriterionRequirement(
                id="nda-chest",
                criterion_type="physical",
                label="Chest Measurement & Expansion",
                official_requirement="Well-developed chest with minimum 5 cm expansion capability (Normal >= 77 cm).",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Satisfies 77 cm unexpanded with >= 5 cm expansion",
                    "Below 77 cm or less than 5 cm expansion",
                    "Not Measured"
                ]
            )
        ]
    ),
    OpportunityCriteria(
        opportunity_id="tmpl-scholarship-central",
        title="Central Sector Merit-cum-Means Scholarship",
        organization="Ministry of Education & National Scholarship Portal (NSP)",
        category="scholarship",
        official_notification_url="https://scholarships.gov.in",
        application_deadline="2026-11-25",
        medical_disclaimer=None,
        required_documents=[
            "Income Certificate issued by Revenue Authority (Tahsildar/SDM)",
            "Caste Certificate (if applying under SC/ST/OBC quota)",
            "Class 12th Board Marksheet",
            "Aadhaar linked Bank Account Passbook",
            "Bonafide Student Certificate from College/University"
        ],
        criteria_list=[
            CriterionRequirement(
                id="sch-income",
                criterion_type="income",
                label="Family Annual Income Ceiling",
                official_requirement="Total gross family income from all sources must be less than ₹4,50,000 per annum (under ₹2,50,000 for full fee waiver).",
                is_mandatory=True,
                input_type="number",
                max_value=450000,
                unit="INR/year",
                help_text="Income must be supported by an official Revenue Department certificate."
            ),
            CriterionRequirement(
                id="sch-education",
                criterion_type="education",
                label="Class 12th Board Examination Percentage",
                official_requirement="Minimum 60% aggregate in Class 12 (or top 20th percentile of relevant state board). 55% for SC/ST.",
                is_mandatory=True,
                input_type="number",
                min_value=60,
                unit="percentage",
                help_text="Enter your aggregate percentage achieved in 12th board exams."
            ),
            CriterionRequirement(
                id="sch-enrolled",
                criterion_type="education",
                label="Current Enrollment Status",
                official_requirement="Must be currently enrolled in a recognized regular degree/diploma program.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Regular Full-Time College Student",
                    "Distance / Correspondence Course Student",
                    "Not Currently Enrolled"
                ]
            )
        ]
    ),
    OpportunityCriteria(
        opportunity_id="tmpl-college-engg",
        title="Undergraduate Engineering / B.Tech Central Admission",
        organization="Joint Seat Allocation Authority (JoSAA) & Central Counselling",
        category="college_admission",
        official_notification_url="https://josaa.nic.in",
        application_deadline="2026-06-30",
        medical_disclaimer=None,
        required_documents=[
            "10th Class Marksheet (DOB proof)",
            "12th Class Marksheet with PCM",
            "JEE Entrance Scorecard",
            "Category / EWS Certificate (issued on/after April 1 of admission year)",
            "State Domicile Certificate"
        ],
        criteria_list=[
            CriterionRequirement(
                id="col-board-pct",
                criterion_type="education",
                label="Class 12 Board Percentage",
                official_requirement="Minimum 75% aggregate marks in 12th Board Examination (65% for SC/ST/PwD) OR top 20 percentile in respective board.",
                is_mandatory=True,
                input_type="number",
                min_value=75,
                unit="percentage"
            ),
            CriterionRequirement(
                id="col-subjects",
                criterion_type="education",
                label="Compulsory 12th Subjects",
                official_requirement="Physics and Mathematics compulsory, along with Chemistry/Biotechnology/Technical Vocational subject.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Physics, Mathematics and Chemistry/Technical subject",
                    "Non-PCM Stream"
                ]
            )
        ]
    ),
    OpportunityCriteria(
        opportunity_id="tmpl-job-sde",
        title="Full-Stack Software Development Engineer (SDE-1)",
        organization="Technology Enterprise / Product Startup",
        category="private_job",
        official_notification_url="https://verityx.ai/careers",
        application_deadline="2026-12-31",
        medical_disclaimer=None,
        required_documents=[
            "Updated Resume (PDF)",
            "GitHub / Portfolio Link",
            "Degree Certificate / Provisional Degree",
            "Government ID"
        ],
        criteria_list=[
            CriterionRequirement(
                id="sde-degree",
                criterion_type="education",
                label="Education Degree",
                official_requirement="B.E. / B.Tech / BCA / MCA / B.Sc in Computer Science or equivalent demonstrated practical coding portfolio.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "B.Tech / B.E. / BCA / MCA in CS / IT / Related",
                    "Other STEM Degree with Coding Portfolio",
                    "Non-Technical Degree"
                ]
            ),
            CriterionRequirement(
                id="sde-skills",
                criterion_type="skill",
                label="Core Technical Skills",
                official_requirement="Hands-on experience in React/Next.js, Node.js or Python, SQL databases, RESTful APIs, and Git.",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Proficient in React, Node/Python, and SQL",
                    "Basic knowledge of frontend only",
                    "No practical web development experience"
                ]
            ),
            CriterionRequirement(
                id="sde-portfolio",
                criterion_type="document",
                label="Project Portfolio / GitHub",
                official_requirement="At least 2 deployed full-stack web projects or active GitHub repositories.",
                is_mandatory=False,
                input_type="select",
                options=[
                    "Active GitHub with live deployed projects",
                    "Coursework projects only",
                    "No portfolio projects"
                ]
            )
        ]
    ),
    OpportunityCriteria(
        opportunity_id="tmpl-upsc-cse",
        title="Civil Services Examination (CSE)",
        organization="Union Public Service Commission (UPSC)",
        category="exam",
        official_notification_url="https://upsc.gov.in",
        application_deadline="2027-02-15",
        medical_disclaimer="Appendix III of Civil Services Examination Rules prescribes physical and medical parameters for IAS/IPS/IFS.",
        required_documents=[
            "Degree Certificate / Proof of Graduation",
            "Age Proof (10th Board Certificate)",
            "Category Certificate (OBC-NCL / SC / ST / EWS)",
            "Aadhaar Card"
        ],
        criteria_list=[
            CriterionRequirement(
                id="cse-age",
                criterion_type="age",
                label="Age Limit (as of 1st August)",
                official_requirement="21 to 32 years. Category relaxations: OBC: +3 years (up to 35), SC/ST: +5 years (up to 37), PwBD: +10 years.",
                is_mandatory=True,
                input_type="number",
                min_value=21,
                max_value=32,
                unit="years"
            ),
            CriterionRequirement(
                id="cse-education",
                criterion_type="education",
                label="Degree from Recognized University",
                official_requirement="Must hold a Bachelor's Degree in any discipline from a recognized University or Institute (or appearing in final semester).",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Graduate Degree in Any Discipline",
                    "Final Year / Final Semester Appearing",
                    "10+2 / Under-graduation Incomplete"
                ]
            ),
            CriterionRequirement(
                id="cse-nationality",
                criterion_type="document",
                label="Nationality",
                official_requirement="Must be a citizen of India (for IAS and IPS).",
                is_mandatory=True,
                input_type="select",
                options=[
                    "Citizen of India",
                    "Non-Indian National"
                ]
            )
        ]
    )
]


class EligibilityEvaluationEngine:
    """
    Deterministic evaluation engine. Strictly verifies candidate profile
    against official requirements without hallucinating rules.
    """

    @staticmethod
    def get_template(template_id: str) -> Optional[OpportunityCriteria]:
        for t in VERIFIED_OPPORTUNITY_TEMPLATES:
            if t.opportunity_id == template_id:
                return t
        return None

    @staticmethod
    def get_all_templates() -> List[OpportunityCriteria]:
        return VERIFIED_OPPORTUNITY_TEMPLATES

    @staticmethod
    def evaluate(
        criteria_def: OpportunityCriteria,
        candidate: CandidateProfileInput
    ) -> EligibilityAssessmentReport:
        evaluations: List[CriterionEvaluationResult] = []
        strengths: List[str] = []
        missing_requirements: List[str] = []
        required_certs: List[str] = []
        weaknesses_gaps: List[str] = []
        recommendations: List[str] = []
        next_steps: List[str] = []
        verification_warnings: List[str] = []

        has_failed_hard_criterion = False
        has_conditional_criterion = False
        has_missing_info = False

        social_cat = (candidate.social_category or "General").upper()

        # Category age relaxations (standard government norms)
        age_relaxation = 0
        if "SC" in social_cat or "ST" in social_cat:
            age_relaxation = 5
        elif "OBC" in social_cat:
            age_relaxation = 3

        # 1. Evaluate each criterion in the opportunity requirement list
        for crit in criteria_def.criteria_list:
            c_id = crit.id
            c_type = crit.criterion_type
            user_val = candidate.criteria_responses.get(c_id)

            # --- AGE EVALUATION ---
            if c_type == "age":
                cand_age = candidate.age
                if cand_age is None and user_val is not None:
                    try:
                        cand_age = float(user_val)
                    except Exception:
                        pass

                if cand_age is None:
                    has_missing_info = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input="Not Provided",
                        status="Missing Information",
                        explanation="Age was not specified. Age validation is mandatory to confirm official eligibility."
                    ))
                    missing_requirements.append("Candidate Age")
                    continue

                # Defence NDA does not permit category age relaxation
                effective_relaxation = 0 if "nda" in c_id.lower() or "defence" in criteria_def.category.lower() else age_relaxation
                min_a = crit.min_value or 0
                max_a = (crit.max_value or 100) + effective_relaxation

                if cand_age < min_a:
                    has_failed_hard_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=f"{cand_age} years",
                        status="Failed",
                        explanation=f"Candidate age ({cand_age} yrs) is below the minimum mandatory threshold ({min_a} yrs)."
                    ))
                    missing_requirements.append(f"Age below minimum required ({min_a} yrs)")
                elif cand_age > max_a:
                    has_failed_hard_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=f"{cand_age} years (Category: {social_cat})",
                        status="Failed",
                        explanation=f"Candidate age ({cand_age} yrs) exceeds maximum permissible ceiling of {max_a} yrs (including {effective_relaxation} yrs relaxation for {social_cat})."
                    ))
                    missing_requirements.append(f"Age exceeds permissible limit of {max_a} years")
                else:
                    if effective_relaxation > 0 and cand_age > (crit.max_value or 100):
                        has_conditional_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=f"{cand_age} years ({social_cat})",
                            status="Conditionally Eligible",
                            explanation=f"Age is within permissible limits utilizing {effective_relaxation} years {social_cat} relaxation. Valid non-creamy layer/caste certificate is legally mandatory."
                        ))
                        required_certs.append(f"Official {social_cat} Caste/Category Certificate for Age Relaxation")
                        strengths.append(f"Age satisfied under {social_cat} category quota ({cand_age} yrs)")
                    else:
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=f"{cand_age} years",
                            status="Satisfied",
                            explanation=f"Age ({cand_age} years) is fully within the standard non-relaxed bracket ({min_a}-{crit.max_value} years)."
                        ))
                        strengths.append(f"Age requirement satisfied ({cand_age} years)")

            # --- EDUCATION & DEGREE EVALUATION ---
            elif c_type == "education":
                edu_input = str(user_val or candidate.education_level or "").strip()
                cand_pct = candidate.education_percentage

                if not edu_input:
                    has_missing_info = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input="Not Provided",
                        status="Missing Information",
                        explanation="Educational qualification was not specified."
                    ))
                    missing_requirements.append("Educational Qualification")
                    continue

                # Check percentage threshold if required
                pct_failed = False
                if crit.min_value is not None:
                    # Category relaxation for marks (usually 5% lower for SC/ST)
                    pct_threshold = crit.min_value - (5 if "SC" in social_cat or "ST" in social_cat else 0)
                    if cand_pct is not None:
                        if cand_pct < pct_threshold:
                            pct_failed = True
                            has_failed_hard_criterion = True
                            evaluations.append(CriterionEvaluationResult(
                                criterion_id=c_id,
                                label=crit.label,
                                official_requirement=crit.official_requirement,
                                user_input=f"{edu_input} with {cand_pct}%",
                                status="Failed",
                                explanation=f"Academic percentage ({cand_pct}%) falls below mandatory minimum cutoff of {pct_threshold}%."
                            ))
                            missing_requirements.append(f"Minimum academic percentage ({pct_threshold}%)")
                            continue

                # Incompatible qualifications check
                if any(x in edu_input.lower() for x in ["incomplete", "non-pcm", "no technical", "non-engineering", "not currently enrolled"]):
                    if "pcm" in crit.official_requirement.lower() and "non-pcm" in edu_input.lower():
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=edu_input,
                            status="Failed",
                            explanation="Official regulations strictly require Physics and Mathematics (PCM). Non-PCM stream cannot be considered."
                        ))
                        missing_requirements.append("12th PCM Subject Group")
                    elif "iti" in crit.official_requirement.lower() and "no technical" in edu_input.lower():
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=edu_input,
                            status="Failed",
                            explanation="Mandatory requirement specifies ITI or Engineering Diploma in relevant trades."
                        ))
                        missing_requirements.append("ITI Trade Certificate or Engineering Diploma")
                    elif "regular" in crit.official_requirement.lower() and "distance" in edu_input.lower():
                        has_conditional_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=edu_input,
                            status="Verification Required",
                            explanation="Distance education applicants must verify whether the governing scholarship portal permits non-regular courses."
                        ))
                        verification_warnings.append("Confirm UGC/AICTE equivalence of distance learning enrollment.")
                    else:
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=edu_input,
                            status="Failed",
                            explanation=f"Qualification '{edu_input}' does not fulfill the mandatory educational criterion."
                        ))
                elif "appearing" in edu_input.lower() or "final semester" in edu_input.lower():
                    has_conditional_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=edu_input,
                        status="Conditionally Eligible",
                        explanation="Provisionally eligible as final year appearing candidate. Degree certificate / final marksheet must be produced prior to document verification."
                    ))
                    required_certs.append("Provisional Degree / Final Semester Marksheet")
                    strengths.append("Educational qualification matched (Provisionally appearing)")
                else:
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=f"{edu_input} {f'({cand_pct}%)' if cand_pct else ''}".strip(),
                        status="Satisfied",
                        explanation=f"Educational requirement fully satisfied by '{edu_input}'."
                    ))
                    strengths.append(f"Educational qualification satisfied ({edu_input})")

            # --- PHYSICAL CRITERIA EVALUATION ---
            elif c_type == "physical":
                if "height" in crit.label.lower():
                    cand_h = candidate.height_cm
                    if cand_h is None and user_val is not None:
                        try:
                            cand_h = float(user_val)
                        except Exception:
                            pass

                    if cand_h is None:
                        has_missing_info = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input="Not Provided",
                            status="Missing Information",
                            explanation="Height measurement was not provided. Physical measurements are mandatory for defence/police services."
                        ))
                        missing_requirements.append("Candidate Height (cm)")
                    elif cand_h < (crit.min_value or 157):
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=f"{cand_h} cm",
                            status="Failed",
                            explanation=f"Measured height ({cand_h} cm) is below official minimum threshold of {crit.min_value} cm."
                        ))
                        missing_requirements.append(f"Minimum height requirement ({crit.min_value} cm)")
                    else:
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=f"{cand_h} cm",
                            status="Satisfied",
                            explanation=f"Height ({cand_h} cm) satisfies minimum benchmark ({crit.min_value} cm)."
                        ))
                        strengths.append(f"Height standard satisfied ({cand_h} cm)")

                elif "chest" in crit.label.lower():
                    chest_val = str(user_val or "").strip()
                    if not chest_val or "not measured" in chest_val.lower():
                        has_conditional_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input="Unmeasured / Self-Assessment Pending",
                            status="Verification Required",
                            explanation="Chest circumference and 5 cm expansion must be confirmed during physical medical exam."
                        ))
                        verification_warnings.append("Chest expansion minimum 5 cm must be verified.")
                    elif "below" in chest_val.lower():
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=chest_val,
                            status="Failed",
                            explanation="Failed chest measurement or inadequate chest expansion (< 5 cm)."
                        ))
                        missing_requirements.append("Chest expansion capability (minimum 5 cm)")
                    else:
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=chest_val,
                            status="Satisfied",
                            explanation="Chest expansion benchmark satisfied."
                        ))
                        strengths.append("Chest expansion standard met")

            # --- MEDICAL CRITERIA EVALUATION ---
            elif c_type == "medical":
                vis_val = str(user_val or candidate.vision_standard or "").strip()
                vis_lower = vis_val.lower()
                if not vis_val:
                    has_missing_info = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input="Not Provided",
                        status="Missing Information",
                        explanation="Vision standard was not provided. Medical eye exam is critical for transport & defence cadres."
                    ))
                    missing_requirements.append("Vision Test Details")
                elif "without glasses" in vis_lower or "no glasses" in vis_lower or ("normal" in vis_lower and "blind" not in vis_lower):
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=vis_val,
                        status="Satisfied",
                        explanation="Vision benchmark reported as satisfying 6/6 unassisted standard."
                    ))
                    strengths.append("Vision standard reported as 6/6 unassisted")
                elif any(x in vis_lower for x in ["colour blind", "defective", "spectacles", "with glasses", "corrective"]):
                    if "without glasses" in crit.official_requirement.lower():
                        has_failed_hard_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=vis_val,
                            status="Failed",
                            explanation=f"A-1 Railway / Fighter Air Force standards strictly disqualify refractive errors or glasses. Given: '{vis_val}'."
                        ))
                        missing_requirements.append("A-1 Distant Vision 6/6 without glasses")
                    else:
                        has_conditional_criterion = True
                        evaluations.append(CriterionEvaluationResult(
                            criterion_id=c_id,
                            label=crit.label,
                            official_requirement=crit.official_requirement,
                            user_input=vis_val,
                            status="Conditionally Eligible",
                            explanation=f"Vision with glasses accepted for ground duty / technical branches within diopter limits. Current: '{vis_val}'."
                        ))
                        verification_warnings.append("Confirm diopter power falls within permissible military/railway ground limits.")
                else:
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=vis_val,
                        status="Satisfied",
                        explanation="Vision benchmark reported as satisfying 6/6 standard."
                    ))
                    strengths.append("Vision standard reported as 6/6")

            # --- INCOME CEILING EVALUATION ---
            elif c_type == "income":
                cand_inc = candidate.family_annual_income
                if cand_inc is None and user_val is not None:
                    try:
                        cand_inc = float(user_val)
                    except Exception:
                        pass

                if cand_inc is None:
                    has_missing_info = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input="Not Provided",
                        status="Missing Information",
                        explanation="Family annual income is required to verify means-tested scholarship eligibility."
                    ))
                    missing_requirements.append("Family Annual Income")
                elif crit.max_value and cand_inc > crit.max_value:
                    has_failed_hard_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=f"₹{cand_inc:,.0f} / year",
                        status="Failed",
                        explanation=f"Gross family income (₹{cand_inc:,.0f}) exceeds the official maximum ceiling of ₹{crit.max_value:,.0f}."
                    ))
                    missing_requirements.append(f"Income below ceiling (₹{crit.max_value:,.0f})")
                else:
                    has_conditional_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=f"₹{cand_inc:,.0f} / year",
                        status="Conditionally Eligible",
                        explanation=f"Income (₹{cand_inc:,.0f}) is within eligible limit. Must be certified by Tahsildar / Revenue Authority."
                    ))
                    required_certs.append("Official Income Certificate (Current Financial Year)")
                    strengths.append(f"Income qualification satisfied (₹{cand_inc:,.0f} / year)")

            # --- SKILLS & DOMAIN FIT ---
            elif c_type == "skill":
                skill_val = str(user_val or "").strip()
                if not skill_val or "no practical" in skill_val.lower():
                    has_conditional_criterion = True
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=skill_val or "Not Specified",
                        status="Missing Information",
                        explanation="Technical domain skill evaluation indicates gaps in required stack."
                    ))
                    weaknesses_gaps.append("Required core technical skills (React, Node, SQL)")
                else:
                    evaluations.append(CriterionEvaluationResult(
                        criterion_id=c_id,
                        label=crit.label,
                        official_requirement=crit.official_requirement,
                        user_input=skill_val,
                        status="Satisfied",
                        explanation="Core technical skill requirements matched."
                    ))
                    strengths.append("Required technical skills verified")

            # --- DOCUMENTS & OTHER ---
            else:
                doc_val = str(user_val or "").strip()
                evaluations.append(CriterionEvaluationResult(
                    criterion_id=c_id,
                    label=crit.label,
                    official_requirement=crit.official_requirement,
                    user_input=doc_val or "Self-declared",
                    status="Satisfied" if doc_val and "not" not in doc_val.lower() else "Conditionally Eligible",
                    explanation="Condition recorded. Supporting proof required during documentation stage."
                ))

        # Check required documents
        for req_doc in criteria_def.required_documents:
            doc_matched = any(req_doc.lower() in d.lower() or d.lower() in req_doc.lower() for d in candidate.available_documents)
            if not doc_matched:
                required_certs.append(req_doc)

        # 2. Determine Deterministic Overall Status
        if has_failed_hard_criterion:
            overall_status = "Not Eligible"
        elif has_missing_info:
            overall_status = "Insufficient Information"
        elif has_conditional_criterion or len(required_certs) > 0:
            overall_status = "Conditionally Eligible"
        else:
            overall_status = "Eligible"

        # 3. Calculate Transparent AI Opportunity Readiness Score (0 to 100)
        # 1. Qualifications & Core Eligibility (40 pts)
        if overall_status == "Eligible":
            qual_pts = 40
        elif overall_status == "Conditionally Eligible":
            qual_pts = 32
        elif overall_status == "Insufficient Information":
            qual_pts = 18
        else:
            qual_pts = 5

        # 2. Certificates & Document Readiness (20 pts)
        total_docs = len(criteria_def.required_documents) or 1
        missing_docs_cnt = len(set(required_certs))
        doc_ratio = max(0.0, (total_docs - missing_docs_cnt) / total_docs)
        cert_pts = int(round(doc_ratio * 20))

        # 3. Skills & Domain Fit (20 pts)
        skills_matched = len(candidate.skills or [])
        skills_pts = min(20, 10 + (skills_matched * 3)) if skills_matched > 0 else (15 if overall_status != "Not Eligible" else 5)

        # 4. Preparation Timeline & Progress (10 pts)
        prep_pts = 8 if overall_status in ("Eligible", "Conditionally Eligible") else 4

        # 5. Profile Completeness (10 pts)
        completed_fields = sum(1 for v in [candidate.age, candidate.education_level, candidate.social_category, candidate.state_of_domicile] if v is not None)
        profile_pts = int(round((completed_fields / 4.0) * 10))

        readiness_score = max(5, min(100, qual_pts + cert_pts + skills_pts + prep_pts + profile_pts))
        if overall_status == "Not Eligible":
            readiness_score = min(readiness_score, 25)

        breakdown = ReadinessBreakdown(
            qualifications_score=qual_pts,
            certificates_score=cert_pts,
            skills_score=skills_pts,
            preparation_progress_score=prep_pts,
            profile_completeness_score=profile_pts
        )

        readiness_explanation = (
            f"Readiness Score evaluated at {readiness_score}/100. "
            f"Qualifications score: {qual_pts}/40. "
            f"Document availability score: {cert_pts}/20 ({len(set(required_certs))} certificate(s) pending). "
            f"Skills & domain readiness: {skills_pts}/20. "
            f"Status determined as '{overall_status}'."
        )

        # Generate Actionable Improvement Plan & Next Steps
        if overall_status == "Eligible":
            recommendations.append("All primary non-negotiable criteria are strictly met.")
            recommendations.append("Begin early revision of technical syllabus and past year question papers.")
            next_steps.append("Register on the official portal before server traffic increases near the deadline.")
            next_steps.append("Prepare digital scans of certificates conforming to portal dimension and file size limits.")
        elif overall_status == "Conditionally Eligible":
            recommendations.append("You qualify under primary qualifications, but conditional verifications remain.")
            for c in list(set(required_certs))[:3]:
                recommendations.append(f"Procure/validate '{c}' from authorized issuing authority.")
            next_steps.append("Schedule revenue or college visits to obtain pending certificates.")
            next_steps.append("Keep original transcripts ready for spot document verification.")
        elif overall_status == "Insufficient Information":
            recommendations.append("Complete missing profile inputs (age, qualification, physical measurements) to unlock exact determination.")
            next_steps.append("Update profile fields to re-run automated verification.")
        else: # Not Eligible
            recommendations.append("You do not meet one or more mandatory eligibility thresholds for this specific opportunity.")
            if missing_requirements:
                recommendations.append(f"Primary barrier: {', '.join(missing_requirements[:2])}.")
            recommendations.append("Explore alternative opportunities aligned with your exact profile category and current qualifications.")
            next_steps.append("Review personalized recommendations in the Dashboard tailored to your category.")

        if criteria_def.medical_disclaimer:
            verification_warnings.append(criteria_def.medical_disclaimer)

        return EligibilityAssessmentReport(
            id=str(uuid.uuid4()),
            user_id="00000000-0000-0000-0000-000000000000",
            opportunity_id=criteria_def.opportunity_id,
            opportunity_title=criteria_def.title,
            category=criteria_def.category,
            overall_status=overall_status,
            readiness_score=readiness_score,
            readiness_explanation=readiness_explanation,
            readiness_breakdown=breakdown,
            criteria_evaluations=evaluations,
            strengths=strengths,
            missing_requirements=missing_requirements,
            required_certificates=list(set(required_certs)),
            weaknesses_and_gaps=weaknesses_gaps,
            recommendations=recommendations,
            next_steps=next_steps,
            verification_warnings=verification_warnings,
            assessed_at=datetime.utcnow().isoformat()
        )
