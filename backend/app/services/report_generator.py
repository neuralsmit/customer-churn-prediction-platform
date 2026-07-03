import io
from datetime import datetime
from typing import List, Dict, Any
import pandas as pd

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_csv_report(predictions_data: List[Dict[str, Any]]) -> io.BytesIO:
    rows = []
    for item in predictions_data:
        cust = item["customer"]
        rows.append({
            "Customer ID": cust.customer_id,
            "Name": cust.name,
            "Email": cust.email,
            "Tenure (Months)": cust.tenure,
            "Contract": cust.contract,
            "Internet Service": cust.internet_service,
            "Monthly Charges ($)": cust.monthly_charges,
            "Total Charges ($)": cust.total_charges,
            "Churn Probability (%)": round(item["probability"] * 100, 2),
            "Prediction": "CHURN" if item["is_churn"] else "ACTIVE"
        })
        
    df = pd.DataFrame(rows)
    stream = io.BytesIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return stream

def generate_pdf_report(predictions_data: List[Dict[str, Any]]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles to fit dark/sleek theme vibes inside printable PDF
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#2E1A47'),  # Deep violet
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=25
    )
    
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0D1B2A'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333')
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    
    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#333333')
    )

    table_body_bold = ParagraphStyle(
        'TableBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#333333')
    )

    story = []
    
    # 1. Header Title
    story.append(Paragraph("Customer Churn Analysis Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Analytical Export", subtitle_style))
    
    # 2. Executive Summary Metrics
    total = len(predictions_data)
    churned = sum(1 for x in predictions_data if x["is_churn"])
    churn_rate = (churned / total * 100) if total > 0 else 0
    high_risk = sum(1 for x in predictions_data if x["probability"] >= 0.70)
    
    story.append(Paragraph("Executive Summary", section_style))
    summary_text = (
        f"This report lists customer churn analysis computed by the platform. A total of <b>{total}</b> customer profiles "
        f"were assessed. The predictive model identified <b>{churned}</b> accounts at active risk of churn (predicted probability &ge; 50%), "
        f"yielding a batch churn rate of <b>{churn_rate:.2f}%</b>. In total, <b>{high_risk}</b> customers represent high-risk exposure "
        f"(probability &ge; 70%) requiring immediate customer success outreach."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 15))
    
    # KPI Table Cards
    kpi_data = [
        [
            Paragraph("<b>Total Scanned</b>", table_body_style),
            Paragraph("<b>Predicted Churners</b>", table_body_style),
            Paragraph("<b>Batch Churn Rate</b>", table_body_style),
            Paragraph("<b>Critical High-Risk</b>", table_body_style)
        ],
        [
            Paragraph(f"{total}", table_body_bold),
            Paragraph(f"{churned}", table_body_bold),
            Paragraph(f"{churn_rate:.2f}%", table_body_bold),
            Paragraph(f"{high_risk}", table_body_bold)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[1.5*inch, 1.8*inch, 1.8*inch, 1.5*inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F4F6F9')),
        ('BACKGROUND', (0,1), (-1,1), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E1E4E8')),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 20))
    
    # 3. High-Risk Customer List Table
    story.append(Paragraph("High Risk Accounts Details (Probability &ge; 50%)", section_style))
    
    # Table headers
    table_data = [[
        Paragraph("Customer ID", table_header_style),
        Paragraph("Customer Name", table_header_style),
        Paragraph("Tenure", table_header_style),
        Paragraph("Contract", table_header_style),
        Paragraph("Charges (Mo/Tot)", table_header_style),
        Paragraph("Churn Prob", table_header_style),
        Paragraph("Action Level", table_header_style)
    ]]
    
    # Sort predictions data by risk descending
    sorted_preds = sorted(predictions_data, key=lambda x: x["probability"], reverse=True)
    risk_records = [x for x in sorted_preds if x["probability"] >= 0.50]
    
    # Limit rows to avoid huge documents; display top 25 high risk
    display_limit = 25
    for item in risk_records[:display_limit]:
        c = item["customer"]
        prob_pct = f"{item['probability']*100:.1f}%"
        
        # Risk level label styling
        risk_color = '#D62828' if item["probability"] >= 0.70 else '#F77F00'
        action_text = f"<b><font color='{risk_color}'>CRITICAL</font></b>" if item["probability"] >= 0.70 else f"<b><font color='{risk_color}'>WARNING</font></b>"
        
        charges_str = f"${c.monthly_charges:.2f} / ${c.total_charges:.0f}"
        
        table_data.append([
            Paragraph(c.customer_id, table_body_style),
            Paragraph(c.name, table_body_style),
            Paragraph(f"{c.tenure} mo", table_body_style),
            Paragraph(c.contract, table_body_style),
            Paragraph(charges_str, table_body_style),
            Paragraph(prob_pct, table_body_bold),
            Paragraph(action_text, table_body_style)
        ])
        
    if len(risk_records) == 0:
        table_data.append([Paragraph("No customer accounts at high risk.", table_body_style)] + [Paragraph("", table_body_style)]*6)
        
    # Column width specifications
    col_widths = [1.1*inch, 1.3*inch, 0.7*inch, 1.2*inch, 1.2*inch, 0.9*inch, 1.0*inch]
    report_table = Table(table_data, colWidths=col_widths)
    
    # Alternating row background colors
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2E1A47')), # Primary deep color for header
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DDDDDD')),
    ]
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0,i), (-1,i), colors.HexColor('#F9F9F9')))
            
    report_table.setStyle(TableStyle(t_style))
    story.append(report_table)
    
    # Footnote if truncated
    if len(risk_records) > display_limit:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<i>* Showing top {display_limit} of {len(risk_records)} high-risk profiles. View full statistics online.</i>", body_style))
        
    doc.build(story)
    buffer.seek(0)
    return buffer
