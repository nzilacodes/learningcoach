#!/usr/bin/env python3
"""Generate the LEWC Platform Analysis PDF report."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

W, H = A4

# ── Styles ──────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "CustomTitle", parent=styles["Title"],
    fontSize=28, leading=34, spaceAfter=6,
    textColor=colors.HexColor("#0F172A"),
    fontName="Helvetica-Bold",
)
subtitle_style = ParagraphStyle(
    "Subtitle", parent=styles["Normal"],
    fontSize=12, leading=16, spaceAfter=20,
    textColor=colors.HexColor("#64748B"),
    fontName="Helvetica",
)
h1_style = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontSize=20, leading=26, spaceBefore=16, spaceAfter=8,
    textColor=colors.HexColor("#0EA5A4"),
    fontName="Helvetica-Bold",
    borderPadding=(0, 0, 4, 0),
)
h2_style = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontSize=14, leading=18, spaceBefore=12, spaceAfter=6,
    textColor=colors.HexColor("#1E293B"),
    fontName="Helvetica-Bold",
)
h3_style = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontSize=11, leading=14, spaceBefore=8, spaceAfter=4,
    textColor=colors.HexColor("#334155"),
    fontName="Helvetica-Bold",
)
body_style = ParagraphStyle(
    "Body", parent=styles["BodyText"],
    fontSize=9.5, leading=13, spaceAfter=6,
    textColor=colors.HexColor("#334155"),
    fontName="Helvetica",
    alignment=TA_JUSTIFY,
)
bullet_style = ParagraphStyle(
    "Bullet", parent=body_style,
    leftIndent=16, bulletIndent=6,
    spaceBefore=2, spaceAfter=2,
)
small_style = ParagraphStyle(
    "Small", parent=body_style,
    fontSize=8, leading=11,
    textColor=colors.HexColor("#64748B"),
)
table_header_style = ParagraphStyle(
    "TH", parent=body_style,
    fontSize=8.5, leading=11,
    textColor=colors.white,
    fontName="Helvetica-Bold",
)
table_cell_style = ParagraphStyle(
    "TD", parent=body_style,
    fontSize=8.5, leading=11,
    spaceAfter=0,
)

# ── Colors ──────────────────────────────────────────────────────────────
TEAL = colors.HexColor("#0EA5A4")
SLATE = colors.HexColor("#1E293B")
LIGHT_BG = colors.HexColor("#F8FAFC")
RED = colors.HexColor("#EF4444")
AMBER = colors.HexColor("#F59E0B")
GREEN = colors.HexColor("#22C55E")

# ── Helper ──────────────────────────────────────────────────────────────
def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    data = [[Paragraph(h, table_header_style) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), table_cell_style) for c in row])
    
    if col_widths is None:
        col_widths = [None] * len(headers)
    
    tbl = Table(data, colWidths=col_widths, hAlign="LEFT", repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SLATE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl

def severity_badge(level):
    """Return colored severity text."""
    colors_map = {
        "CRITICA": f'<font color="#DC2626"><b>{level}</b></font>',
        "Alta": f'<font color="#F97316"><b>{level}</b></font>',
        "Media": f'<font color="#EAB308"><b>{level}</b></font>',
        "Baixa": f'<font color="#22C55E"><b>{level}</b></font>',
    }
    return colors_map.get(level, level)

# ── Chrome (header/footer) ─────────────────────────────────────────────
def chrome(canv, doc):
    canv.saveState()
    # Header line
    canv.setStrokeColor(TEAL)
    canv.setLineWidth(1.5)
    canv.line(20*mm, H - 18*mm, W - 20*mm, H - 18*mm)
    # Header text
    canv.setFont("Helvetica", 7)
    canv.setFillColor(colors.HexColor("#94A3B8"))
    canv.drawString(20*mm, H - 16*mm, "LEARNING ENGLISH WITH COACH — Análise Completa da Plataforma")
    canv.drawRightString(W - 20*mm, H - 16*mm, "Julho 2026")
    # Footer
    canv.setStrokeColor(colors.HexColor("#E2E8F0"))
    canv.setLineWidth(0.5)
    canv.line(20*mm, 18*mm, W - 20*mm, 18*mm)
    canv.setFont("Helvetica", 7)
    canv.setFillColor(colors.HexColor("#94A3B8"))
    canv.drawString(20*mm, 13*mm, "Documento confidencial — Uso interno")
    canv.drawRightString(W - 20*mm, 13*mm, f"Página {doc.page}")
    canv.restoreState()

# ── Build document ──────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    "C:/Users/NzilaCodePC2/Music/AI English Coach/AI English Coach/docs/LEWC_Analise_Plataforma.pdf",
    pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=25*mm, bottomMargin=25*mm,
    title="LEWC — Análise Completa da Plataforma",
    author="MiMoCode Analysis",
)

story = []

# ══════════════════════════════════════════════════════════════════════
# COVER PAGE
# ══════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 60*mm))
story.append(Paragraph("LEARNING ENGLISH<br/>WITH COACH", title_style))
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Análise Completa da Plataforma", subtitle_style))
story.append(Spacer(1, 4*mm))
story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=10))
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Estado atual, lacunas, comparação com concorrência<br/>e recomendações para desenvolvimento.", body_style))
story.append(Spacer(1, 30*mm))

cover_info = [
    ["Documento:", "Análise Técnica e Estratégica"],
    ["Versão:", "1.0"],
    ["Data:", "Julho 2026"],
    ["Base:", "PRD Versão 2.0 + Código-fonte actual"],
    ["Plataforma:", "coach-speak-bright.lovable.app"],
]
cover_tbl = Table(cover_info, colWidths=[40*mm, 100*mm])
cover_tbl.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#475569")),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
]))
story.append(cover_tbl)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("Índice", h1_style))
story.append(Spacer(1, 4*mm))
toc_items = [
    "1. Resumo Executivo",
    "2. Stack Tecnológica",
    "3. Funcionalidades Implementadas",
    "4. Problemas Críticos Identificados",
    "5. Funcionalidades em Falta (PRD vs Actual)",
    "6. FASE 1 — MVP: Análise Detalhada",
    "7. FASE 2 — Funcionalidades Avançadas",
    "8. FASE 3 — Enterprise",
    "9. Comparação com Concorrência",
    "10. Vantagens Competitivas do LEWC",
    "11. Priorização de Correcções",
    "12. Plano de Acção Recomendado",
]
for item in toc_items:
    story.append(Paragraph(item, ParagraphStyle("TOC", parent=body_style, fontSize=10, leading=16, leftIndent=10)))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 1. RESUMO EXECUTIVO
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("1. Resumo Executivo", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))
story.append(Paragraph(
    "O <b>Learning English Coach (LEWC)</b> é uma plataforma web EdTech full-stack para aprendizagem de inglês, "
    "voltada para o mercado lusófono (preços em Kwanza, pagamentos via Multicaixa Express). O PRD Versão 2.0 "
    "define 36 secções com dezenas de funcionalidades organizadas em 3 fases de lançamento.",
    body_style
))
story.append(Paragraph(
    "O estado actual do projeto implementa aproximadamente <b>30-35% do MVP</b> definido no PRD. "
    "Existem problemas críticos no fluxo de onboarding, o AI Coach é simulado, os jogos não estão "
    "implementados, e várias funcionalidades essenciais estão em falta.",
    body_style
))
story.append(Spacer(1, 4*mm))

summary_data = [
    ["Métrica", "Estado"],
    ["Funcionalidades PRD implementadas", "~35%"],
    ["Problemas críticos", "6"],
    ["Funcionalidades em falta", "15+"],
    ["Testes automatizados", "0"],
    ["Ficheiros com mais de 500 linhas", "3"],
    ["Migrações de BD", "35"],
    ["Rotas de API", "3 (TTS, STT, Diagnostic)"],
]
story.append(make_table(
    summary_data[0], summary_data[1:],
    col_widths=[100*mm, 60*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 2. STACK TECNOLÓGICA
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("2. Stack Tecnológica", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

stack_data = [
    ["Camada", "Tecnologia", "Versão"],
    ["Framework", "React + TanStack Start (SSR)", "19 / 1.168"],
    ["Roteamento", "TanStack Router", "1.170"],
    ["Estado/Dados", "TanStack React Query + Supabase", "5.101 / 2.110"],
    ["Estilo", "Tailwind CSS + Radix UI", "4.2 / multi"],
    ["Build", "Vite + TypeScript", "8.0 / 5.8"],
    ["Base de Dados", "PostgreSQL via Supabase", "35 migrações"],
    ["APIs de IA", "OpenAI via Lovable Gateway", "gpt-4o-mini"],
    ["Pagamento", "Multicaixa Express (manual)", "—"],
    ["SSR Server", "Nitro", "3.0"],
]
story.append(make_table(
    stack_data[0], stack_data[1:],
    col_widths=[40*mm, 80*mm, 40*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 3. FUNCIONALIDADES IMPLEMENTADAS
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("3. Funcionalidades Implementadas", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

impl_data = [
    ["Funcionalidade", "Estado", "Notas"],
    ["Autenticação (Email, Google, Apple)", "✅ Completo", "Supabase Auth com RLS"],
    ["Dashboard do aluno", "✅ Funcional", "Stats, streak, XP, leaderboard"],
    ["Teste de nível (7 skills)", "⚠️ Parcial", "Onboarding trap, depende de IA"],
    ["Pronúncia com IA", "✅ Funcional", "TTS/STT, gráficos de evolução"],
    ["Leitura (Read Aloud)", "⚠️ Parcial", "Só 3 textos hardcoded"],
    ["Aulas interativas", "⚠️ Parcial", "Só 1 aula demo"],
    ["Certificados PDF", "✅ Funcional", "QR code verificável"],
    ["Sistema de assinatura", "⚠️ Parcial", "Pagamento manual, sem gateway"],
    ["Painel administrativo", "⚠️ Parcial", "Básico, sem filtros/exportação"],
    ["i18n (PT/EN)", "✅ Funcional", "Bilíngue completo"],
    ["Temas por idade", "✅ Funcional", "Kids, Teens, Adults"],
    ["WhatsApp suporte", "✅ Funcional", "Float button"],
    ["SEO", "⚠️ Parcial", "Meta tags, JSON-LD"],
    ["Gamificação", "⚠️ Parcial", "Só XP e streak básico"],
    ["Vídeos YouTube", "⚠️ Parcial", "Embed básico, sem transcrição"],
]
story.append(make_table(
    impl_data[0], impl_data[1:],
    col_widths=[60*mm, 30*mm, 70*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 4. PROBLEMAS CRÍTICOS
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("4. Problemas Críticos Identificados", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

problems = [
    ["#", "Problema", "Localização", "Severidade", "Impacto"],
    ["1", "Onboarding trap — utilizador preso no ciclo onboarding/dashboard",
     "onboarding-gate.tsx:61", "CRÍTICA", "Bloqueia acesso a todas as páginas"],
    ["2", "Checkout falso no onboarding — não cria pagamento real",
     "onboarding.tsx:561", "CRÍTICA", "Utilizador confuso, sem assinatura"],
    ["3", "AI Coach simulado — respostas hardcoded",
     "ai-coach.tsx:53", "CRÍTICA", "Funcionalidade principal não existe"],
    ["4", "Jogos sem implementação — só cards, sem jogos reais",
     "games.tsx", "CRÍTICA", "Funcionalidade prometida não existe"],
    ["5", "Subscription page pode crashar — loading infinito",
     "subscription.tsx:42", "Alta", "Página inutilizável se auth falhar"],
    ["6", "Preços inconsistentes — euros no onboarding, Kz no checkout",
     "onboarding.tsx:533", "Alta", "Experiência de utilizador confusa"],
    ["7", "Auth middleware pode bloquear server functions",
     "auth-middleware.ts:70", "Alta", "Checkout e subscription falham"],
    ["8", "Owner email hardcoded no frontend",
     "auth.tsx:54", "Alta", "Problema de segurança"],
    ["9", "Sem testes automatizados",
     "Todo o projeto", "CRÍTICA", "Sem garantia de qualidade"],
    ["10", "GoalsCard redireciona para onboarding preso",
     "extras.tsx:340", "Média", "Ciclo de navegação"],
]
story.append(make_table(
    problems[0], problems[1:],
    col_widths=[8*mm, 55*mm, 38*mm, 22*mm, 37*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 5. FUNCIONALIDADES EM FALTA
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("5. Funcionalidades em Falta (PRD vs Actual)", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

missing = [
    ["Funcionalidade PRD", "Prioridade", "Estado"],
    ["Biblioteca completa A1–C2 (13 categorias por nível)", "CRÍTICA", "❌ Inexistente"],
    ["Sistema de vídeo completo (legendas, transcrição, notas)", "CRÍTICA", "❌ Só embed YouTube"],
    ["Flashcards com repetição espaçada", "Alta", "⚠️ Só WordCard simples"],
    ["Dicionário inteligente (IPA, áudio, collocations)", "Alta", "⚠️ Parcial via WordCard"],
    ["Pesquisa global em todas as páginas", "Alta", "❌ Inexistente"],
    ["Comunidade (salas por idade/nível, moderação)", "Alta", "❌ Inexistente"],
    ["Sistema offline (download de conteúdo)", "Média", "❌ Inexistente"],
    ["Dark Mode (toggle Light/Dark/Auto)", "Média", "❌ Só CSS, sem toggle"],
    ["Notificações inteligentes (IA que aprende hábitos)", "Média", "❌ Inexistente"],
    ["Temporizador de estudo (15–90 min)", "Média", "❌ Inexistente"],
    ["Perfil completo (foto, bio, histórico, config)", "Média", "⚠️ Básico"],
    ["Sistema de conteúdo (editor para admin)", "Alta", "❌ Tudo hardcoded"],
    ["Gamificação avançada (ligas, eventos, medalhas)", "Média", "❌ Só XP/streak"],
    ["Relatórios exportáveis (admin)", "Média", "❌ Inexistente"],
    ["PWA (app instalável, funcional offline)", "Média", "❌ Sem service worker"],
]
story.append(make_table(
    missing[0], missing[1:],
    col_widths=[80*mm, 25*mm, 55*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 6. FASE 1 — MVP DETALHADO
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("6. FASE 1 — MVP: Análise Detalhada", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))
story.append(Paragraph(
    "O PRD define o MVP como: Autenticação, Teste de nível, Dashboard, Biblioteca A1–C2, "
    "Vídeos, Flashcards, Quizzes, Dicionário, IA para dúvidas, Pronúncia com IA, "
    "Comunidade e Certificados.",
    body_style
))
story.append(Spacer(1, 4*mm))

mvp_detail = [
    ["Componente", "PRD Pede", "Estado Actual", "Gap"],
    ["Autenticação", "Email, Google, Apple", "✅ Implementada", "Completo"],
    ["Teste de nível", "Diagnóstico 7 skills", "⚠️ Funcional mas preso", "Onboarding trap"],
    ["Dashboard", "Stats, progresso, recomendações", "✅ Funcional", "Dados hardcoded"],
    ["Biblioteca A1–C2", "13 categorias × 6 níveis", "❌ Inexistente", "CRÍTICO"],
    ["Vídeos", "Legendas, transcrição, notas", "⚠️ Só YouTube embed", "Sem transcrição"],
    ["Flashcards", "Repetição espaçada, 5 categorias", "⚠️ WordCard básico", "Sem spaced rep"],
    ["Quizzes", "Sistema completo de quizzes", "⚠️ Só na aula demo", "Sem banco"],
    ["Dicionário", "Pesquisa + IPA + áudio + collocations", "⚠️ Parcial", "Sem interface"],
    ["IA para dúvidas", "Assistente 24/7", "❌ Fake", "Respostas simuladas"],
    ["Pronúncia IA", "Análise fonética completa", "✅ Funcional", "Depende de API"],
    ["Comunidade", "Salas por idade/nível", "❌ Inexistente", "CRÍTICO"],
    ["Certificados", "PDF + QR verificável", "✅ Funcional", "Completo"],
]
story.append(make_table(
    mvp_detail[0], mvp_detail[1:],
    col_widths=[30*mm, 45*mm, 40*mm, 45*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 7. FASE 2
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("7. FASE 2 — Funcionalidades Avançadas", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

fase2 = [
    ["Funcionalidade", "Estado", "Esforço Estimado"],
    ["Ranking (filtros: idade, país, nível, amigos)", "⚠️ Básico", "2 semanas"],
    ["Streaks avançados", "✅ Básico funcional", "1 semana"],
    ["Sistema de conquistas completo", "⚠️ Tabela existe", "2 semanas"],
    ["Sistema offline (service worker)", "❌ Inexistente", "3 semanas"],
    ["Pesquisa inteligente global", "❌ Inexistente", "2 semanas"],
    ["Calendário de estudos", "✅ Heatmap", "1 semana"],
    ["Temporizador de estudo", "❌ Inexistente", "1 semana"],
    ["Notificações inteligentes", "❌ Inexistente", "2 semanas"],
]
story.append(make_table(
    fase2[0], fase2[1:],
    col_widths=[70*mm, 40*mm, 50*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 8. FASE 3
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("8. FASE 3 — Enterprise", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

fase3 = [
    ["Funcionalidade", "Estado", "Esforço Estimado"],
    ["Painel administrativo completo", "⚠️ Básico", "4 semanas"],
    ["Relatórios avançados + exportação", "❌ Inexistente", "3 semanas"],
    ["Integração WhatsApp Bot", "⚠️ Só float", "2 semanas"],
    ["Analytics por IA", "❌ Inexistente", "3 semanas"],
    ["Recomendações preditivas", "❌ Inexistente", "4 semanas"],
    ["Gamificação avançada (ligas, torneios)", "❌ Inexistente", "3 semanas"],
    ["Marketplace de cursos", "❌ Inexistente", "6 semanas"],
    ["Editor de conteúdo (admin)", "❌ Inexistente", "4 semanas"],
]
story.append(make_table(
    fase3[0], fase3[1:],
    col_widths=[70*mm, 40*mm, 50*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 9. COMPARAÇÃO COM CONCORRÊNCIA
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("9. Comparação com Concorrência", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))
story.append(Paragraph(
    "O PRD define que o LEWC deve competir com: Duolingo, Babbel, Busuu, ELSA Speak, "
    "Memrise e Cambly. Segue-se a comparação detalhada:",
    body_style
))
story.append(Spacer(1, 4*mm))

comp_data = [
    ["Feature", "Duolingo", "ELSA", "Babbel", "Busuu", "LEWC Actual"],
    ["Milhares de exercícios", "✅", "✅", "✅", "✅", "❌"],
    ["Gamificação profunda", "✅", "⚠️", "⚠️", "⚠️", "❌"],
    ["Análise fonética IA", "⚠️", "✅", "❌", "❌", "⚠️"],
    ["Comunidade nativos", "❌", "❌", "❌", "✅", "❌"],
    ["Conteúdo por contexto", "⚠️", "❌", "✅", "✅", "❌"],
    ["Modo offline", "✅", "✅", "❌", "✅", "❌"],
    ["Revisão espaçada", "✅", "⚠️", "✅", "✅", "❌"],
    ["Certificados oficiais", "❌", "❌", "❌", "✅", "⚠️"],
    ["Foco mercado lusófono", "❌", "❌", "❌", "❌", "✅"],
    ["Preços em Kwanza", "❌", "❌", "❌", "❌", "✅"],
    ["Pagamento local (MCE)", "❌", "❌", "❌", "❌", "✅"],
    ["Temas por idade", "⚠️", "❌", "❌", "❌", "✅"],
]
story.append(make_table(
    comp_data[0], comp_data[1:],
    col_widths=[38*mm, 22*mm, 22*mm, 22*mm, 22*mm, 34*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 10. VANTAGENS COMPETITIVAS
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("10. Vantagens Competitivas do LEWC", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))
story.append(Paragraph(
    "Apesar das lacunas, o LEWC tem vantagens únicas que nenhuma concorrência oferece:",
    body_style
))
story.append(Spacer(1, 4*mm))

advantages = [
    ["Vantagem", "Descrição", "Concorrência"],
    ["Foco no mercado lusófono", "Nenhuma plataforma de inglês tem foco em PT/Angola/Moçambique", "Nenhuma"],
    ["Preços em Kwanza", "Adaptação monetária local, sem conversão", "Nenhuma"],
    ["Multicaixa Express", "Pagamento via mobile money angolano", "Nenhuma"],
    ["Temas por faixa etária", "UI adapta-se automaticamente a Kids/Teens/Adults", "Duolingo ABC (separado)"],
    ["i18n PT/EN nativo", "Plataforma bilíngue desde o início", "Babbel (limitado)"],
    ["WhatsApp integrado", "Suporte directo via WhatsApp", "Nenhuma"],
    ["Base técnica moderna", "React 19, TanStack, Supabase — mais rápida que concorrência", "Varia"],
    ["IA para avaliação", "TTS/STT para pronúncia e leitura", "ELSA (foco só em pronúncia)"],
]
story.append(make_table(
    advantages[0], advantages[1:],
    col_widths=[40*mm, 80*mm, 40*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 11. PRIORIZAÇÃO
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("11. Priorização de Correcções", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

priority_data = [
    ["Prioridade", "Item", "Impacto", "Esforço"],
    ["CRÍTICA", "Corrigir onboarding trap (ciclo infinito)", "Alto utilizador", "2h"],
    ["CRÍTICA", "Corrigir checkout falso no onboarding", "Alto utilizador", "4h"],
    ["CRÍTICA", "Implementar AI Coach com IA real", "Funcionalidade principal", "2 sem"],
    ["CRÍTICA", "Implementar jogos reais (pelo menos 3)", "Engajamento", "3 sem"],
    ["CRÍTICA", "Adicionar testes automatizados", "Qualidade", "2 sem"],
    ["ALTA", "Corrigir subscription page crash", "Experiência", "2h"],
    ["ALTA", "Unificar preços (Kz em todo o lado)", "Consistência", "1h"],
    ["ALTA", "Corrigir auth middleware errors", "Estabilidade", "2h"],
    ["ALTA", "Mover owner email para server-side", "Segurança", "1h"],
    ["ALTA", "Criar biblioteca A1–C2 (mínimo 20 lições/nível)", "Conteúdo", "4 sem"],
    ["MÉDIA", "Implementar flashcards com repetição espaçada", "Retenção", "2 sem"],
    ["MÉDIA", "Adicionar dark mode toggle", "UX", "1 sem"],
    ["MÉDIA", "Implementar pesquisa global", "Utilidade", "2 sem"],
    ["MÉDIA", "Criar comunidade básica", "Engajamento", "3 sem"],
]
story.append(make_table(
    priority_data[0], priority_data[1:],
    col_widths=[22*mm, 68*mm, 35*mm, 35*mm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════
# 12. PLANO DE ACÇÃO
# ══════════════════════════════════════════════════════════════════════
story.append(Paragraph("12. Plano de Acção Recomendado", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

story.append(Paragraph("Semanas 1-2: Corrigir problemas críticos", h2_style))
action_1 = [
    ["#", "Acção", "Responsável", "Entregável"],
    ["1", "Corrigir onboarding gate — permitir acesso a páginas públicas", "Dev", "PR merged"],
    ["2", "Unificar checkout — remover checkout falso do onboarding", "Dev", "PR merged"],
    ["3", "Corrigir subscription page — error handling", "Dev", "PR merged"],
    ["4", "Corrigir auth middleware — melhorar feedback de erros", "Dev", "PR merged"],
    ["5", "Mover secrets para server-side (owner email, etc.)", "Dev", "PR merged"],
]
story.append(make_table(
    action_1[0], action_1[1:],
    col_widths=[8*mm, 80*mm, 25*mm, 47*mm]
))
story.append(Spacer(1, 6*mm))

story.append(Paragraph("Semanas 3-4: AI Coach e Conteúdo", h2_style))
action_2 = [
    ["#", "Acção", "Responsável", "Entregável"],
    ["6", "Integrar AI Coach com API real (streaming)", "Dev", "Funcional"],
    ["7", "Criar banco de 20 lições por nível (A1–B2)", "Conteúdo", "80 lições"],
    ["8", "Implementar sistema de quizzes dinâmico", "Dev", "Funcional"],
    ["9", "Adicionar testes unitários (mínimo 50%)", "Dev", "Cobertura"],
]
story.append(make_table(
    action_2[0], action_2[1:],
    col_widths=[8*mm, 80*mm, 25*mm, 47*mm]
))
story.append(Spacer(1, 6*mm))

story.append(Paragraph("Semanas 5-8: Funcionalidades Fase 1", h2_style))
action_3 = [
    ["#", "Acção", "Responsável", "Entregável"],
    ["10", "Implementar 3 jogos reais (Memória, Quiz, Palavras)", "Dev", "Funcional"],
    ["11", "Flashcards com repetição espaçada (FSRS)", "Dev", "Funcional"],
    ["12", "Sistema de vídeo completo (legendas, transcrição)", "Dev", "Funcional"],
    ["13", "Comunidade básica (salas por nível)", "Dev + Design", "Funcional"],
    ["14", "Pesquisa global", "Dev", "Funcional"],
]
story.append(make_table(
    action_3[0], action_3[1:],
    col_widths=[8*mm, 80*mm, 25*mm, 47*mm]
))
story.append(Spacer(1, 6*mm))

story.append(Paragraph("Semanas 9-12: Fase 2", h2_style))
action_4 = [
    ["#", "Acção", "Responsável", "Entregável"],
    ["15", "Dark mode toggle (Light/Dark/Auto)", "Dev + Design", "Funcional"],
    ["16", "Notificações inteligentes", "Dev", "Funcional"],
    ["17", "Temporizador de estudo", "Dev", "Funcional"],
    ["18", "Gamificação avançada (ligas, medalhas)", "Dev", "Funcional"],
    ["19", "PWA (service worker, offline básico)", "Dev", "Instalável"],
]
story.append(make_table(
    action_4[0], action_4[1:],
    col_widths=[8*mm, 80*mm, 25*mm, 47*mm]
))
story.append(Spacer(1, 10*mm))

# ── CONCLUSION ──────────────────────────────────────────────────────────
story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=8))
story.append(Paragraph("Conclusão", h1_style))
story.append(Paragraph(
    "O LEWC tem uma <b>base técnica sólida</b> e uma <b>oportunidade de nicho única</b> "
    "(mercado lusófono sem concorrência directa). No entanto, para competir com plataformas "
    "estabelecidas, é essencial:",
    body_style
))
story.append(Spacer(1, 2*mm))
conclusions = [
    "Corrigir os problemas críticos de onboarding e autenticação",
    "Implementar o AI Coach com IA real (funcionalidade principal)",
    "Criar conteúdo massivo (biblioteca A1–C2 com centenas de lições)",
    "Implementar gamificação profunda para reter utilizadores",
    "Dominar o nicho lusófono antes de expandir internacionalmente",
]
for c in conclusions:
    story.append(Paragraph(f"• {c}", bullet_style))

story.append(Spacer(1, 6*mm))
story.append(Paragraph(
    "<b>Recomendação final:</b> Focar em ser o <b>Duolingo dos países lusófonos</b>, "
    "não em ser o Duolingo. A vantagem competitiva está no mercado local, não na funcionalidade.",
    ParagraphStyle("FinalNote", parent=body_style, fontSize=10, textColor=TEAL, fontName="Helvetica-Bold")
))

# ── Generate ────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
print("✅ PDF generated: docs/LEWC_Analise_Plataforma.pdf")
