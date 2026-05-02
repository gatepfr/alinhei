import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Diagnostico, Carta, Perguntas } from './schemas'

function scoreColor(nota: number) {
  if (nota >= 75) return '#16a34a'
  if (nota >= 60) return '#d97706'
  return '#dc2626'
}

// ── Full package styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#6366f1', marginBottom: 2 },
  headerSub: { fontSize: 9, color: '#888' },
  score: { fontSize: 32, fontFamily: 'Helvetica-Bold' },
  headerDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 16, color: '#374151' },
  itemTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  itemText: { fontSize: 9, color: '#555', marginBottom: 4 },
  tip: { fontSize: 9, color: '#6366f1', marginBottom: 10, fontStyle: 'italic' },
  block: { marginBottom: 10 },
})

// ── ATS Curriculum styles ────────────────────────────────────────────────────

const ats = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 48,
    paddingRight: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0d0d0d',
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 3, color: '#0d0d0d' },
  contactLine: { fontSize: 9, color: '#555', marginBottom: 2, lineHeight: 1.4 },
  sectionWrapper: {
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#0d0d0d',
    paddingBottom: 2,
  },
  sectionText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0d0d0d' },
  h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 7, marginBottom: 1, color: '#0d0d0d' },
  italic: { fontSize: 9, fontFamily: 'Helvetica-Oblique', color: '#666', marginBottom: 3 },
  bulletRow: { flexDirection: 'row', marginBottom: 2, paddingLeft: 4 },
  bulletDot: { fontSize: 9, marginRight: 4, color: '#333' },
  bulletText: { flex: 1, fontSize: 9, color: '#222', lineHeight: 1.45 },
  bodyText: { fontSize: 9, color: '#333', lineHeight: 1.5, marginBottom: 3 },
  smallGap: { height: 3 },
})

// ── Inline markdown parser ───────────────────────────────────────────────────

interface Segment { text: string; bold?: boolean; italic?: boolean }

function parseInline(text: string): Segment[] {
  const segs: Segment[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index) })
    if (m[1] !== undefined) segs.push({ text: m[1], bold: true })
    else segs.push({ text: m[2] ?? '', italic: true })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ text: text.slice(last) })
  return segs.length ? segs : [{ text }]
}

// Use View's style type (no SVG overload) — it's the same Style type Text accepts
type PDFStyle = React.ComponentProps<typeof View>['style']

function InlineText({ text, style }: { text: string; style?: PDFStyle }) {
  const segs = parseInline(text)
  if (segs.length === 1 && !segs[0].bold && !segs[0].italic) {
    return <Text style={style}>{text}</Text>
  }
  return (
    <Text style={style}>
      {segs.map((s, i) => (
        <Text
          key={i}
          style={
            s.bold
              ? { fontFamily: 'Helvetica-Bold' }
              : s.italic
              ? { fontFamily: 'Helvetica-Oblique' }
              : {}
          }
        >
          {s.text}
        </Text>
      ))}
    </Text>
  )
}

// ── Diagnostic-only PDF ──────────────────────────────────────────────────────

function DiagnosticoPDF({ diagnostico }: { diagnostico: Diagnostico }) {
  const nota = diagnostico.nota_aderencia
  return (
    <Document>
      <Page style={styles.page}>
        <View style={[styles.row, { marginBottom: 0 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>Alinhei</Text>
            <Text style={styles.headerSub}>Diagnóstico de aderência ao currículo</Text>
          </View>
          <Text style={[styles.score, { color: scoreColor(nota) }]}>{nota}/100</Text>
        </View>
        <View style={styles.headerDivider} />

        <Text style={[styles.itemText, { marginBottom: 16 }]}>{diagnostico.resumo_nota}</Text>

        <Text style={styles.sectionTitle}>Pontos Fortes</Text>
        {diagnostico.pontos_fortes.map((p, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.itemTitle}>{i + 1}. {p.titulo}</Text>
            <Text style={styles.itemText}>{p.explicacao}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Gaps Críticos</Text>
        {diagnostico.gaps_criticos.map((g, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.itemTitle}>{i + 1}. {g.titulo}</Text>
            <Text style={styles.itemText}>{g.explicacao}</Text>
            {g.como_resolver ? (
              <Text style={styles.tip}>Como resolver: {g.como_resolver}</Text>
            ) : null}
          </View>
        ))}
      </Page>
    </Document>
  )
}

// ── ATS Curriculum PDF ───────────────────────────────────────────────────────

function CurriculoPDF({ curriculo }: { curriculo: string }) {
  const lines = curriculo.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      const prevTrimmed = i > 0 ? lines[i - 1].trim() : 'x'
      if (prevTrimmed) elements.push(<View key={i} style={ats.smallGap} />)
      continue
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<Text key={i} style={ats.name}>{trimmed.slice(2)}</Text>)
      continue
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <View key={i} style={ats.sectionWrapper}>
          <Text style={ats.sectionText}>{trimmed.slice(3).toUpperCase()}</Text>
        </View>
      )
      continue
    }

    if (trimmed.startsWith('### ')) {
      elements.push(<InlineText key={i} text={trimmed.slice(4)} style={ats.h3} />)
      continue
    }

    if (trimmed.startsWith('- ')) {
      elements.push(
        <View key={i} style={ats.bulletRow}>
          <Text style={ats.bulletDot}>•</Text>
          <InlineText text={trimmed.slice(2)} style={ats.bulletText} />
        </View>
      )
      continue
    }

    // *italic line* — dates/location (single asterisks, not double)
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      elements.push(<Text key={i} style={ats.italic}>{trimmed.slice(1, -1)}</Text>)
      continue
    }

    // Detect contact line: right after H1 and contains ·
    let prevNonEmpty = ''
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim()) { prevNonEmpty = lines[j].trim(); break }
    }
    const isContactLine = prevNonEmpty.startsWith('# ') && trimmed.includes('·')

    elements.push(
      <InlineText key={i} text={trimmed} style={isContactLine ? ats.contactLine : ats.bodyText} />
    )
  }

  return (
    <Document>
      <Page size="A4" style={ats.page}>
        {elements}
      </Page>
    </Document>
  )
}

// ── Full package PDF (backward compat) ──────────────────────────────────────

export interface PDFData {
  diagnostico: Diagnostico
  curriculoOtimizado: string | null
  carta: Carta | null
  perguntas: Perguntas | null
}

function AlinheiPDF({ data }: { data: PDFData }) {
  const { diagnostico, curriculoOtimizado, carta, perguntas } = data
  const nota = diagnostico.nota_aderencia

  return (
    <Document>
      <Page style={styles.page}>
        <View style={[styles.row, { marginBottom: 0 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>Alinhei</Text>
            <Text style={styles.headerSub}>Diagnóstico de aderência ao currículo</Text>
          </View>
          <Text style={[styles.score, { color: scoreColor(nota) }]}>{nota}/100</Text>
        </View>
        <View style={styles.headerDivider} />

        <Text style={[styles.itemText, { marginBottom: 16 }]}>{diagnostico.resumo_nota}</Text>

        <Text style={styles.sectionTitle}>Pontos Fortes</Text>
        {diagnostico.pontos_fortes.map((p, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.itemTitle}>{i + 1}. {p.titulo}</Text>
            <Text style={styles.itemText}>{p.explicacao}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Gaps Críticos</Text>
        {diagnostico.gaps_criticos.map((g, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.itemTitle}>{i + 1}. {g.titulo}</Text>
            <Text style={styles.itemText}>{g.explicacao}</Text>
            <Text style={styles.tip}>Como resolver: {g.como_resolver}</Text>
          </View>
        ))}
      </Page>

      {curriculoOtimizado ? (
        <Page style={styles.page}>
          <Text style={styles.brand}>Alinhei</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionTitle}>Currículo Otimizado para ATS</Text>
          <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.6 }}>{curriculoOtimizado}</Text>
        </Page>
      ) : null}

      {carta ? (
        <Page style={styles.page}>
          <Text style={styles.brand}>Alinhei</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionTitle}>Cartas de Apresentação</Text>
          <Text style={[styles.itemTitle, { marginBottom: 4 }]}>LinkedIn — candidatura</Text>
          <Text style={[styles.itemText, { marginBottom: 20 }]}>{carta.linkedin}</Text>
          <Text style={[styles.itemTitle, { marginBottom: 4 }]}>E-mail de candidatura</Text>
          <Text style={styles.itemText}>{carta.email}</Text>
        </Page>
      ) : null}

      {perguntas ? (
        <Page style={styles.page}>
          <Text style={styles.brand}>Alinhei</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionTitle}>Simulado de Entrevista — Método STAR</Text>
          {perguntas.perguntas.map((p, i) => (
            <View key={i} style={[styles.block, { marginBottom: 14 }]}>
              <Text style={styles.itemTitle}>{i + 1}. {p.pergunta}</Text>
              <Text style={[styles.itemText, { color: '#888', marginBottom: 4 }]}>{p.por_que_pode_cair}</Text>
              <Text style={styles.itemText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>S: </Text>{p.resposta_star.situacao}</Text>
              <Text style={styles.itemText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>T: </Text>{p.resposta_star.tarefa}</Text>
              <Text style={styles.itemText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>A: </Text>{p.resposta_star.acao}</Text>
              <Text style={styles.itemText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>R: </Text>{p.resposta_star.resultado}</Text>
              {p.dica ? <Text style={styles.tip}>Dica: {p.dica}</Text> : null}
            </View>
          ))}
        </Page>
      ) : null}
    </Document>
  )
}

// ── Exports ──────────────────────────────────────────────────────────────────

export async function generatePDF(data: PDFData): Promise<Buffer> {
  return renderToBuffer(<AlinheiPDF data={data} />)
}

export async function generateCurriculoPDF(curriculo: string): Promise<Buffer> {
  return renderToBuffer(<CurriculoPDF curriculo={curriculo} />)
}

export async function generateDiagnosticoPDF(diagnostico: Diagnostico): Promise<Buffer> {
  return renderToBuffer(<DiagnosticoPDF diagnostico={diagnostico} />)
}
