import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Diagnostico, Carta, Perguntas } from './schemas'

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
  headerLeft: {
    flex: 1,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 9,
    color: '#888',
  },
  score: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 16,
    color: '#374151',
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  itemText: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
  },
  tip: {
    fontSize: 9,
    color: '#6366f1',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  block: {
    marginBottom: 10,
  },
})

export interface PDFData {
  diagnostico: Diagnostico
  curriculoOtimizado: string | null
  carta: Carta | null
  perguntas: Perguntas | null
}

function scoreColor(nota: number) {
  if (nota >= 75) return '#16a34a'
  if (nota >= 60) return '#d97706'
  return '#dc2626'
}

function AlinheiPDF({ data }: { data: PDFData }) {
  const { diagnostico, curriculoOtimizado, carta, perguntas } = data
  const nota = diagnostico.nota_aderencia

  return (
    <Document>
      {/* Diagnóstico */}
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

      {/* Currículo otimizado */}
      {curriculoOtimizado && (
        <Page style={styles.page}>
          <Text style={styles.brand}>Alinhei</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionTitle}>Currículo Otimizado para ATS</Text>
          <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.6 }}>{curriculoOtimizado}</Text>
        </Page>
      )}

      {/* Cartas */}
      {carta && (
        <Page style={styles.page}>
          <Text style={styles.brand}>Alinhei</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionTitle}>Cartas de Apresentação</Text>

          <Text style={[styles.itemTitle, { marginBottom: 4 }]}>LinkedIn — candidatura</Text>
          <Text style={[styles.itemText, { marginBottom: 20 }]}>{carta.linkedin}</Text>

          <Text style={[styles.itemTitle, { marginBottom: 4 }]}>E-mail de candidatura</Text>
          <Text style={styles.itemText}>{carta.email}</Text>
        </Page>
      )}

      {/* Perguntas STAR */}
      {perguntas && (
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
              {p.dica && <Text style={styles.tip}>Dica: {p.dica}</Text>}
            </View>
          ))}
        </Page>
      )}
    </Document>
  )
}

export async function generatePDF(data: PDFData): Promise<Buffer> {
  return renderToBuffer(<AlinheiPDF data={data} />)
}
