import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bot,
  CheckCircle2,
  Database,
  FileText,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import './style.css'

const sourceTypes = ['All', 'Policy', 'Finance', 'Ops', 'Legal']

const sources = [
  { name: 'Employee Handbook 2026', type: 'Policy', pages: 42, status: 'Sample loaded', score: 97 },
  { name: 'Vendor Invoice Pack Q1', type: 'Finance', pages: 88, status: 'Sample loaded', score: 91 },
  { name: 'Security SOP', type: 'Ops', pages: 26, status: 'Sample loaded', score: 94 },
  { name: 'Customer SLA Terms', type: 'Legal', pages: 18, status: 'Sample loaded', score: 89 },
]

const questions = [
  'Which invoices need approval before Friday?',
  'What is the remote work reimbursement policy?',
  'Summarize customer SLA escalation rules.',
]

const scenarios = {
  invoices: {
    answer:
      'Three vendor invoices need approval before Friday: CloudOps RM8,400, PrintLab RM1,280, and Northwind Support RM3,950. The finance source requires review for any invoice above RM5,000 and department owner approval before payment release.',
    guardrail: 'Answer grounded in finance chunks from Vendor Invoice Pack Q1. Payment claims without matching invoice evidence are withheld.',
    chunks: [
      { title: 'Finance approval threshold', source: 'Vendor Invoice Pack Q1', type: 'Finance', page: 12, confidence: 96, quote: 'Invoices above RM5,000 require finance review.' },
      { title: 'Payment release checklist', source: 'Vendor Invoice Pack Q1', type: 'Finance', page: 19, confidence: 93, quote: 'Owner approval is required before payment release.' },
      { title: 'Open vendor approvals', source: 'Vendor Invoice Pack Q1', type: 'Finance', page: 24, confidence: 90, quote: 'CloudOps, PrintLab, and Northwind Support are pending approval.' },
    ],
  },
  reimbursement: {
    answer:
      'Remote employees can claim up to RM250 per month for approved productivity tools, internet, or ergonomic equipment. Claims must include receipts and manager approval, and recurring subscriptions are reviewed quarterly.',
    guardrail: 'Answer grounded in handbook reimbursement chunks. Finance invoice and SLA sources are excluded from this response.',
    chunks: [
      { title: 'Monthly reimbursement rules', source: 'Employee Handbook 2026', type: 'Policy', page: 31, confidence: 95, quote: 'Claims are capped at RM250 per month.' },
      { title: 'Receipt and manager approval', source: 'Employee Handbook 2026', type: 'Policy', page: 32, confidence: 92, quote: 'Receipts and manager approval are required for reimbursement.' },
      { title: 'Recurring subscription review', source: 'Employee Handbook 2026', type: 'Policy', page: 33, confidence: 88, quote: 'Recurring subscriptions are reviewed quarterly.' },
    ],
  },
  sla: {
    answer:
      'Priority 1 tickets must receive a first response within 15 minutes and an engineering escalation within 30 minutes. Priority 2 tickets require first response within 2 hours, with customer updates every business day until resolution.',
    guardrail: 'Answer grounded in customer SLA and security escalation chunks. Reimbursement and invoice sources are not used.',
    chunks: [
      { title: 'SLA escalation windows', source: 'Customer SLA Terms', type: 'Legal', page: 7, confidence: 94, quote: 'Priority 1 engineering escalation begins within 30 minutes.' },
      { title: 'Priority 2 response target', source: 'Customer SLA Terms', type: 'Legal', page: 9, confidence: 91, quote: 'Priority 2 tickets receive a first response within 2 hours.' },
      { title: 'Incident handoff protocol', source: 'Security SOP', type: 'Ops', page: 14, confidence: 86, quote: 'Engineering owns incident handoff after escalation.' },
    ],
  },
}

const sampleQuestion = questions[1]

function getScenarioKey(question) {
  const key = question.toLowerCase()
  if (key.includes('remote') || key.includes('reimbursement')) return 'reimbursement'
  if (key.includes('sla') || key.includes('escalation')) return 'sla'
  return 'invoices'
}

function App() {
  const [activeQuestion, setActiveQuestion] = useState(questions[0])
  const [draft, setDraft] = useState(questions[0])
  const [filter, setFilter] = useState('All')
  const [asked, setAsked] = useState(questions[0])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const scenario = scenarios[getScenarioKey(asked)]
  const retrievedChunks = useMemo(() => {
    return filter === 'All' ? scenario.chunks : scenario.chunks.filter((chunk) => chunk.type === filter)
  }, [filter, scenario])
  const visibleSources = filter === 'All' ? sources : sources.filter((source) => source.type === filter)
  const hasSourceMatch = retrievedChunks.length > 0
  const confidence = hasSourceMatch
    ? Math.round(retrievedChunks.reduce((sum, chunk) => sum + chunk.confidence, 0) / retrievedChunks.length)
    : 0
  const answer = hasSourceMatch
    ? scenario.answer
    : `No ${filter.toLowerCase()}-specific source found for this question. Clear the source filter or choose a ${filter.toLowerCase()} sample question to retrieve cited evidence.`
  const guardrail = hasSourceMatch
    ? scenario.guardrail
    : `The ${filter} filter is active, so KnowledgeFlow withholds an answer until a matching retrieved chunk is found.`

  function askQuestion(question = draft) {
    setActiveQuestion(question)
    setDraft(question)
    setAsked(question)
  }

  function applyFilter(nextFilter) {
    setFilter(nextFilter)
    setIsFilterOpen(false)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Database size={18} /></div>
          <div>
            <strong>KnowledgeFlow</strong>
            <span>RAG Studio</span>
          </div>
        </div>

        <button className="upload-button" type="button" onClick={() => setIsUploadOpen(true)}><Upload size={16} /> Upload docs</button>

        <section className="side-section">
          <div className="section-title">Sample documents loaded</div>
          {visibleSources.map((source) => (
            <button className="source-row" key={source.name}>
              <FileText size={17} />
              <span>
                <strong>{source.name}</strong>
                <small>{source.pages} pages - {source.status}</small>
              </span>
              <em>{source.score}</em>
            </button>
          ))}
        </section>

        <section className="side-section compact">
          <div className="section-title">Readiness</div>
          <div className="readiness"><ShieldCheck size={17} /> Vector index synced</div>
          <div className="readiness"><CheckCircle2 size={17} /> Citation guardrails on</div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Ask business questions across trusted documents</h1>
            <p className="hero-line">Upload documents, ask questions, get cited answers.</p>
            <p className="supporting-line">Sample documents are already indexed so clients can test the document Q&amp;A flow instantly.</p>
          </div>
          <div className="top-actions">
            <div className="filter-menu">
              <button type="button" onClick={() => setIsFilterOpen((open) => !open)}><SlidersHorizontal size={16} /> Source filter: {filter}</button>
              {isFilterOpen && (
                <div className="filter-popover" aria-label="Source filter options">
                  {sourceTypes.map((item) => (
                    <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => applyFilter(item)}>
                      <span>{filter === item ? 'On' : ''}</span>
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="primary" type="button" onClick={() => askQuestion()}><Bot size={16} /> Run retrieval</button>
          </div>
        </header>

        <div className="question-tabs">
          {questions.map((question) => (
            <button
              className={question === activeQuestion ? 'selected' : ''}
              key={question}
              onClick={() => askQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <section className={`chat-panel ${hasSourceMatch ? '' : 'empty-state'}`}>
          <div className="message user">
            <MessageSquareText size={18} />
            <p>{asked}</p>
          </div>
          <div className="message answer">
            <Bot size={18} />
            <div>
              <p>{answer}</p>
              {hasSourceMatch && (
                <div className="citations" aria-label="Cited sources">
                  {retrievedChunks.map((chunk) => (
                    <span key={`${chunk.source}-${chunk.page}`}><FileText size={13} /> {chunk.source}, p.{chunk.page}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <form className="askbar" onSubmit={(event) => { event.preventDefault(); askQuestion() }}>
          <Search size={18} />
          <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ask a document question" />
          <button type="button" className="sample-inline" onClick={() => askQuestion(sampleQuestion)}><Sparkles size={16} /> Try sample question</button>
          <button type="submit"><Send size={16} /> Ask</button>
        </form>
      </section>

      <aside className="inspector">
        <div className="inspector-header">
          <span>Source confidence</span>
          <strong>{hasSourceMatch ? `${confidence}% confidence` : 'No source match'}</strong>
        </div>
        <div className="filters">
          {sourceTypes.map((item) => (
            <button key={item} className={filter === item ? 'active' : ''} onClick={() => applyFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="section-title">Retrieved chunks</div>
        <div className="chunk-list">
          {hasSourceMatch ? retrievedChunks.map((chunk, index) => (
            <article className="chunk" key={`${chunk.title}-${chunk.page}`}>
              <div className="chunk-rank">{index + 1}</div>
              <div>
                <h2>{chunk.title}</h2>
                <p>{chunk.source} - page {chunk.page}</p>
                <blockquote>{chunk.quote}</blockquote>
                <div className="meter"><span style={{ width: `${chunk.confidence}%` }} /></div>
              </div>
              <strong>{chunk.confidence}%</strong>
            </article>
          )) : (
            <article className="no-chunks">
              <strong>No retrieved chunks</strong>
              <p>The active question has no matching {filter.toLowerCase()} source. Try All, Policy, Finance, Ops, or Legal to see the trace change.</p>
            </article>
          )}
        </div>
        <div className="audit-box">
          <strong>Guardrail result</strong>
          <p>{guardrail}</p>
        </div>
        <p className="built-with">Built with React, RAG pipeline, vector search, document Q&amp;A UX.</p>
      </aside>

      {isUploadOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Upload documents">
          <div className="upload-modal">
            <button className="close-button" type="button" onClick={() => setIsUploadOpen(false)} aria-label="Close upload modal"><X size={18} /></button>
            <h2>Upload documents</h2>
            <p>Add PDFs, DOCX files, or knowledge-base exports. This demo keeps the sample documents loaded so the RAG flow works instantly.</p>
            <div className="dropzone">
              <Upload size={24} />
              <strong>Drop files here</strong>
              <span>Mock upload area for the client demo</span>
            </div>
            <button className="primary modal-action" type="button" onClick={() => setIsUploadOpen(false)}>Use sample documents</button>
          </div>
        </div>
      )}
    </main>
  )
}

createRoot(document.getElementById('app')).render(<App />)
