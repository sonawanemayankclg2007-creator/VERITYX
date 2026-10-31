import os
import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    along with a clean security & freshness footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "VERITYX — AI Information Gap Detection & Intelligence Report")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.drawString(54, 32, "CONFIDENTIAL & VERIFIED — VERITYX LIVING INTELLIGENCE")
        self.restoreState()

class PDFGenerator:
    """
    Generates professional, publication-quality Living PDFs for VERITYX
    using ReportLab with dynamic styling, version management, and data tables.
    """
    @staticmethod
    def generate_report(
        title: str,
        research_data: Dict[str, Any],
        version: int = 1,
        changes_summary: Optional[str] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54,
        )

        styles = getSampleStyleSheet()
        
        # Custom palette & styles
        navy = colors.HexColor("#0F172A")
        primary_blue = colors.HexColor("#2563EB")
        accent_purple = colors.HexColor("#7C3AED")
        slate_text = colors.HexColor("#334155")
        muted_gray = colors.HexColor("#64748B")
        critical_red = colors.HexColor("#DC2626")
        warning_amber = colors.HexColor("#D97706")
        success_green = colors.HexColor("#059669")

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=navy,
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=muted_gray,
            spaceAfter=14,
        )

        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=primary_blue,
            spaceBefore=12,
            spaceAfter=6,
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=14,
            textColor=slate_text,
            spaceAfter=6,
        )

        badge_style = ParagraphStyle(
            'Badge',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.white,
            alignment=1,
        )

        story = []

        # Header Title Banner
        story.append(Paragraph("VERITYX VERIFICATION INTELLIGENCE", ParagraphStyle('TopPre', fontName='Helvetica-Bold', fontSize=9, textColor=accent_purple, spaceAfter=4)))
        story.append(Paragraph(title, title_style))
        
        ver_tag = f"Living PDF: Version {version}.0"
        if changes_summary:
            ver_tag += f" • Change: {changes_summary}"
        story.append(Paragraph(f"{ver_tag}  |  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=primary_blue, spaceBefore=2, spaceAfter=12))

        # Executive Summary
        story.append(Paragraph("1. Executive Summary & Synthesis", h2_style))
        summary_text = research_data.get("summary") or "Comprehensive automated analysis of primary and secondary sources."
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))

        # Readiness Score Box
        readiness = research_data.get("readiness_score") or {}
        score = readiness.get("score", 70)
        score_color = success_green if score >= 75 else (warning_amber if score >= 50 else critical_red)
        
        score_table_data = [
            [
                Paragraph(f"<b>DECISION READINESS SCORE: {score}/100</b>", ParagraphStyle('ScoreH', fontName='Helvetica-Bold', fontSize=12, textColor=score_color)),
                Paragraph(f"Coverage: <b>{readiness.get('coverage_score', 80)}%</b> | Freshness: <b>{readiness.get('freshness_score', 85)}%</b> | Conflicts: <b>{readiness.get('unresolved_conflicts', 0)}</b>", body_style)
            ],
            [
                Paragraph(f"<b>Assessment:</b> {readiness.get('explanation', 'Factual criteria analyzed across ingested sources.')}", body_style),
                ""
            ]
        ]
        score_table = Table(score_table_data, colWidths=[200, 304])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('SPAN', (0,1), (1,1)),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(score_table)
        story.append(Spacer(1, 12))

        # Information Gaps Table
        gaps = research_data.get("information_gaps") or []
        story.append(Paragraph(f"2. Detected Information Gaps ({len(gaps)} Identified)", h2_style))
        if gaps:
            gap_rows = [["Priority", "Missing Requirement / Question", "Recommended Verification Action"]]
            for g in gaps:
                imp = str(g.get("importance", "high")).upper()
                badge_bg = critical_red if imp == "CRITICAL" else (warning_amber if imp == "HIGH" else primary_blue)
                p_badge = Paragraph(f"<font color='white'><b>{imp}</b></font>", badge_style)
                
                desc = f"<b>{g.get('title')}</b><br/>{g.get('description')}"
                gap_rows.append([
                    p_badge,
                    Paragraph(desc, body_style),
                    Paragraph(g.get("recommended_action") or "Verify with official primary authority.", body_style)
                ])
            gap_table = Table(gap_rows, colWidths=[65, 239, 200])
            gap_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(gap_table)
        else:
            story.append(Paragraph("No critical information gaps detected across ingested records.", body_style))
        story.append(Spacer(1, 12))

        # Conflict Radar
        conflicts = research_data.get("conflicts") or []
        story.append(Paragraph(f"3. Evidence Conflict Radar ({len(conflicts)} Divergences)", h2_style))
        if conflicts:
            conf_rows = [["Status", "Contradiction Details", "Resolution Guidance"]]
            for c in conflicts:
                conf_rows.append([
                    Paragraph("<font color='white'><b>UNRESOLVED</b></font>", badge_style),
                    Paragraph(f"<b>{c.get('description')}</b>", body_style),
                    Paragraph(c.get("recommended_action") or "Corroborate directly with primary gazette.", body_style)
                ])
            conf_table = Table(conf_rows, colWidths=[75, 229, 200])
            conf_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E293B")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(conf_table)
        else:
            story.append(Paragraph("No direct factual contradictions were identified among the analyzed sources.", body_style))
        story.append(Spacer(1, 12))

        # Verification Checklist
        tasks = research_data.get("verification_checklist") or []
        story.append(Paragraph(f"4. Prioritized Verification Checklist", h2_style))
        if tasks:
            task_rows = [["Check", "Task Item", "Priority"]]
            for t in tasks:
                prio = str(t.get("priority", "medium")).capitalize()
                task_rows.append([
                    Paragraph("[  ]", body_style),
                    Paragraph(f"<b>{t.get('title')}</b> — {t.get('description', '')}", body_style),
                    Paragraph(f"<b>{prio}</b>", body_style)
                ])
            task_table = Table(task_rows, colWidths=[40, 394, 70])
            task_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(task_table)
        story.append(Spacer(1, 12))

        # AI Disclaimer
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#CBD5E1"), spaceBefore=10, spaceAfter=8))
        disclaimer = (
            "<b>LEGAL & COMPLIANCE DISCLAIMER:</b> VERITYX uses automated AI processing to extract and cross-examine "
            "information from multiple online sources. This report is an analytical aid and does not constitute official legal, "
            "academic, or employment advice. Requirements, deadlines, and eligibility criteria are subject to change by issuing authorities. "
            "Users must always verify critical information against the official issuing portal before making binding decisions."
        )
        story.append(Paragraph(disclaimer, ParagraphStyle('Disclaimer', parent=body_style, fontSize=7.5, leading=11, textColor=muted_gray)))

        # Build document with custom canvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()

pdf_generator = PDFGenerator()

