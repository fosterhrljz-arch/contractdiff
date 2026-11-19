"""Generate fictional realistic contracts and deterministic regression fixtures."""
import json, re, copy
from pathlib import Path
from difflib import SequenceMatcher
from docx import Document
from docx.shared import Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib import colors

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'samples'; OUT.mkdir(exist_ok=True)
paragraphs=[
'Professional Services Agreement',
'This Agreement is entered into on 1 January 2026 between Northstar Research Limited, 18 Market Street, Bristol BS1 4AB, United Kingdom (Customer), and Cedar Analytics Limited, 42 Station Road, Bristol BS2 0AA, United Kingdom (Supplier). The parties agree to the following terms for the research and reporting services described below.',
'1. Scope of services. Supplier shall provide a market research study of regional logistics operations, including stakeholder interviews, analysis of publicly available statistics, a written findings report, and a presentation for Customer management. Supplier shall use appropriately qualified personnel and exercise reasonable care and skill throughout the engagement.',
'2. Deliverables. The deliverables comprise a research plan, an interim findings memorandum, the final report, and an editable presentation. Each deliverable shall identify material assumptions and the information sources used. Customer shall provide reasonable access to relevant personnel and records needed to perform the agreed services.',
'3. Contract term. Services shall begin on 1 February 2026 and continue until 31 July 2026, unless the parties agree an extension in writing. Supplier shall provide a project schedule within ten business days after commencement. Any extension must identify the revised milestones and any agreed additional fees.',
'4. Payment terms. Customer shall pay each undisputed invoice within 30 days after receipt. Supplier shall submit invoices electronically to the designated accounts contact, identifying the completed milestone and applicable fees. Any disputed amount must be explained in writing within ten business days, and undisputed amounts remain payable under this clause.',
'5. Fees and expenses. The fixed service fee is USD 48,000, exclusive of applicable sales taxes. Reasonable travel expenses require prior written approval and supporting receipts. Supplier shall not charge additional fees or incur expenses beyond the approved budget without a written variation signed by both parties.',
'6. Delivery and acceptance. The final report shall be delivered by 30 June 2026. Customer shall review it within fifteen business days and identify any material failure to meet the agreed specification. Supplier shall correct substantiated deficiencies without additional charge and submit the corrected deliverable for a further reasonable review.',
'7. Change control. Either party may request a change to the scope, timing, or deliverables. Supplier shall describe the resulting fee and schedule implications before starting the additional work. A change is effective only when an authorized representative of each party has approved the written variation.',
'8. Confidentiality. Each party shall protect confidential information received from the other using reasonable safeguards and shall use it only for this engagement. Disclosure is permitted to personnel with a need to know who are subject to equivalent confidentiality duties. These obligations continue for three years after the engagement ends.',
'9. Breach of contract liability. A party that materially breaches this Agreement shall compensate the other party for documented direct losses caused by that breach, subject to the limitation in clause 10. The injured party shall take reasonable steps to mitigate its losses and provide supporting records for any claim.',
'10. Limitation of liability. Each party\'s aggregate liability arising under this Agreement shall not exceed USD 48,000. Neither party shall be liable for indirect or consequential losses, including lost anticipated profits. This clause does not exclude liability for fraud or any liability that cannot lawfully be excluded.',
'11. Termination. Either party may terminate this Agreement on thirty days of written notice if the other party commits a material breach and fails to remedy it during that period. On termination, Supplier shall deliver completed work, and Customer shall pay for services properly performed up to the effective termination date.',
'12. Information security. Supplier shall restrict access to Customer records to assigned project personnel and use encrypted storage and transmission where reasonably practicable. Supplier shall notify Customer promptly after discovering unauthorized access affecting those records and cooperate in investigating the event and taking reasonable corrective measures.',
'13. Ownership of work. Upon payment of the corresponding fees, Customer shall own the project-specific report and presentation. Supplier retains ownership of its pre-existing methods, software, templates, and general knowledge, and grants Customer a perpetual license to use any such material incorporated in the deliverables for internal business purposes.',
'14. Project governance. Each party shall nominate a project manager authorized to coordinate day-to-day activities. The project managers shall meet at least once every two weeks to review progress, outstanding decisions, and delivery dependencies. They may not amend the commercial terms without the written approval required by clause 7.',
'15. Records and audit. Supplier shall retain records supporting invoiced fees and approved expenses for two years after the final invoice. Upon reasonable notice, Customer may inspect relevant records during normal business hours, subject to confidentiality safeguards and without access to information concerning other customers or unrelated engagements.',
'16. Subcontracting. Supplier may engage specialist subcontractors with Customer\'s prior written consent. Supplier remains responsible for their work and compliance with applicable obligations under this Agreement. Consent to subcontracting does not create a contractual relationship between Customer and a subcontractor or relieve Supplier of its delivery responsibilities.',
'17. Force majeure. Neither party is responsible for delay caused by events beyond its reasonable control, provided that it promptly notifies the other party and takes reasonable steps to minimize disruption. Payment obligations for services already completed remain due. The parties shall consult on a practical revised delivery schedule.',
'18. Notices. Formal notices shall be delivered to the registered addresses stated above or to another address notified in writing. Electronic notices must be acknowledged by the receiving party. Routine project correspondence may be sent to the nominated project managers and does not replace a formal notice where this Agreement requires one.',
'19. Dispute resolution. The parties shall first refer a dispute to their project managers and then to senior representatives for good-faith discussion. If no resolution is reached within twenty business days, either party may pursue remedies before the competent courts. The parties shall continue undisputed obligations while discussions are pending.',
'20. Entire agreement. This Agreement and its signed variations constitute the entire understanding concerning the services and supersede prior proposals on the same subject. A failure to enforce a term does not waive future enforcement. If a provision is unenforceable, the remaining provisions continue to apply to the extent permitted.',
'Schedule A Milestone Fees',
]
table=[['Milestone','Amount','Target date'],['Research plan','USD 12,000','15 February 2026'],['Interim memorandum','USD 12,000','15 April 2026'],['Final report','USD 24,000','30 June 2026']]
ending='Signed for Customer: ____________________    Signed for Supplier: ____________________\nName and title: _________________________    Name and title: _________________________'
def blocks(ps, tab=table): return [{'text':p,'kind':'paragraph'} for p in ps]+[{'text':' | '.join(r),'kind':'table','cells':r} for r in tab]+[{'text':ending,'kind':'paragraph'}]
en=blocks(paragraphs); revised=copy.deepcopy(en)
revised=[b for b in revised if not b['text'].startswith('9. Breach')]
for b in revised:b['text']=b['text'].replace('within 30 days after receipt','within 90 days after receipt')
variants={'original':en,'revised':revised,'reordered':en[:4]+en[6:9]+en[4:6]+en[9:],'amount':copy.deepcopy(en),'paragraph':en[:15]+en[16:],'unchanged':copy.deepcopy(en)}
for b in variants['amount']:
 if b['kind']=='table' and b['text'].startswith('Final report'):b['cells'][1]='USD 29,000';b['text']=' | '.join(b['cells'])
zh=blocks(['技术咨询服务合同','甲方：北辰研究有限公司。乙方：青杉数据有限公司。双方于2026年1月1日签订本合同，约定由乙方提供物流行业调研、数据分析及报告编制服务。以下主体及交易均为测试用途的虚构示例。','第一条 服务范围。乙方应完成行业调研方案、阶段性分析备忘录、最终报告及汇报材料。甲方应提供必要的业务资料并安排访谈联系人。乙方应以合理的注意和专业技能完成约定工作。','第二条 合同期限。服务自2026年2月1日起至2026年7月31日止。乙方应在项目启动后十个工作日内提交工作计划。延期或增加工作内容应由双方另行书面确认。','第三条 付款期限。甲方应在收到无争议发票后30天内支付相应款项。乙方应列明已完成的服务及对应费用。甲方对发票有异议的，应在十个工作日内书面说明，不影响无争议部分的支付。','第四条 服务费用。合同总金额为人民币300,000元，不含适用税费。差旅费用须事先取得甲方书面批准，并提供有效凭证。未经双方书面同意，乙方不得收取额外服务费用。','第五条 交付与验收。最终报告应于2026年6月30日前提交。甲方应在十五个工作日内完成审阅并列明实质性不符合要求的内容。乙方应免费修正经核实的问题，并再次提交验收。','第六条 保密义务。双方应采取合理措施保护对方的保密信息，仅为本项目目的使用该等信息。仅可向确有必要知悉且承担同等保密义务的人员披露。本条义务在项目结束后三年内持续有效。','第七条 违约责任。任何一方违反本合同约定，应赔偿守约方因此遭受并能够提供证据的直接损失。守约方应采取合理措施避免损失扩大。双方应及时协商补救方案，且不影响守约方依据本合同主张相应责任。','第八条 责任限制。双方在本合同项下的累计赔偿责任以人民币300,000元为上限。任何一方均不承担间接损失或预期利润损失，但法律禁止排除或限制的责任不受本条影响。','第九条 合同解除。一方发生重大违约且在收到书面通知后三十日内未予纠正的，另一方可解除合同。解除时，乙方应移交已完成的成果，甲方应结算已适当履行的服务费用。','第十条 通知。双方应以书面方式向各自指定的联系人发出正式通知。通过电子邮件发出的正式通知应取得收件方确认。项目日常沟通不能替代合同明确要求的正式通知。','附件一 费用安排'],[['里程碑','金额','日期'],['研究方案','人民币75,000元','2026年2月15日'],['中期备忘录','人民币75,000元','2026年4月15日'],['最终报告','人民币150,000元','2026年6月30日']])
zh[-1]['text']='甲方签字：____________________    乙方签字：____________________'
zhr=[{**b,'text':b['text'].replace('发票后30天内','发票后90天内')} for b in zh if not b['text'].startswith('第七条')]
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
def write(name, bs, chinese=False):
 d=Document();sec=d.sections[0];sec.top_margin=sec.bottom_margin=Inches(.7);sec.left_margin=sec.right_margin=Inches(.8)
 style=d.styles['Normal'];style.font.name='Times New Roman';style.font.size=Pt(11);style.paragraph_format.space_after=Pt(9)
 style.element.rPr.rFonts.set(qn('w:eastAsia'),'SimSun');style.paragraph_format.line_spacing=1.15
 story=[];font='STSong-Light' if chinese else 'Times-Roman';ps=ParagraphStyle('contract',fontName=font,fontSize=11,leading=15,spaceAfter=10,wordWrap='CJK' if chinese else None)
 ts=ParagraphStyle('title',fontName=font,fontSize=18,leading=23,spaceAfter=18)
 rows=[]
 def tableflush():
  nonlocal rows
  if not rows:return
  t=d.add_table(rows=0,cols=len(rows[0]));t.style='Table Grid'
  for r in rows:
   cells=t.add_row().cells
   for c,tx in zip(cells,r):c.text=tx
  pt=Table([[Paragraph(x,ps) for x in r] for r in rows],colWidths=[180,135,170],repeatRows=1)
  pt.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,colors.HexColor('#b8c2cb')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf1f5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.extend([pt,Spacer(1,14)]);rows=[]
 for i,b in enumerate(bs):
  if b['kind']=='table':rows.append(b['cells']);continue
  tableflush();d.add_paragraph(b['text'],style='Title' if i==0 else 'Normal');story.append(Paragraph(b['text'].replace('&','&amp;').replace('\n','<br/>'),ts if i==0 else ps))
 tableflush();d.save(OUT/f'{name}.docx');SimpleDocTemplate(str(OUT/f'{name}.pdf'),pagesize=(595.28,841.89),leftMargin=50,rightMargin=50,topMargin=45,bottomMargin=45,title='Sample services contract',author='ContractDiff fictional test fixtures').build(story)
for k,v in variants.items():write(f'en-{k}',v)
write('zh-original',zh,True);write('zh-revised',zhr,True)
fixtures={**variants,'zh-original':zh,'zh-revised':zhr}
(OUT/'fixtures.json').write_text(json.dumps(fixtures,ensure_ascii=False,indent=2),encoding='utf8')
a=re.findall(r'\w+|[^\w\s]',' '.join(b['text'] for b in en));b=re.findall(r'\w+|[^\w\s]',' '.join(b['text'] for b in revised));same=sum(m.size for m in SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks())
metrics={'originalTokens':len(a),'revisedTokens':len(b),'retainedOriginalTokenPercent':round(100*same/len(a),2),'symmetricTokenSimilarityPercent':round(200*same/(len(a)+len(b)),2),'requiredChanges':['30 days -> 90 days','Clause 9 breach of contract liability removed in full'],'fictional':True}
(OUT/'sample-metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf8');print(metrics)
