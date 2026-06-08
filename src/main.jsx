import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bot,
  CheckCircle2,
  Database,
  FileText,
  Filter,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import './style.css'

const sources = [
  { name: 'Employee Handbook 2026', type: 'Policy', pages: 42, status: 'Indexed', score: 97 },
  { name: 'Vendor Invoice Pack Q1', type: 'Finance', pages: 88, status: 'Indexed', score: 91 },
  { name: 'Security SOP', type: 'Ops', pages: 26, status: 'Indexed', score: 94 },
  { name: 'Customer SLA Terms', type: 'Legal', pages: 18, status: 'Indexed', score: 89 },
]

const questions = [
  'Which invoices need approval before Friday?',
  'What is the remote work reimbursement policy?',
  'Summarize customer SLA escalation rules.',
]

const answerMap = {
  invoices:
    'Three vendor invoices need approval before Friday: CloudOps RM8,400, PrintLab RM1,280, and Northwind Support RM3,950. The policy requires finance review for any invoice above RM5,000 and department owner approval before payment release.',
  reimbursement:
    'Remote employees can claim up to RM250 per month for approved productivity tools, internet, or ergonomic equipment. Claims must include receipts and manager approval, and recurring subscriptions are reviewed quarterly.',
  sla:
    'Priority 1 tickets must receive a first response within 15 minutes and an engineering escalation within 30 minutes. Priority 2 tickets require first response within 2 hours, with customer updates every business day until resolution.',
}

const chunks = [
  { title: 'Finance approval threshold', source: 'Vendor Invoice Pack Q1', page: 12, confidence: 96 },
  { title: 'Payment release checklist', source: 'Vendor Invoice Pack Q1', page: 19, confidence: 93 },
  { title: 'Monthly reimbursement rules', source: 'Employee Handbook 2026', page: 31, confidence: 91 },
  { title: 'SLA escalation windows', source: 'Customer SLA Terms', page: 7, confidence: 94 },
]

function App() {
  const [activeQuestion, setActiveQuestion] = useState(questions[0])
  const [draft, setDraft] = useState(questions[0])
  const [filter, setFilter] = useState('All')
  const [asked, setAsked] = useState(questions[0])

  const answer = useMemo(() => {
    const key = asked.toLowerCase()
    if (key.includes('remote') || key.includes('reimbursement')) return answerMap.reimbursement
    if (key.includes('sla') || key.includes('escalation')) return answerMap.sla
    return answerMap.invoices
  }, [asked])

  const visibleSources = filter === 'All' ? sources : sources.filter((source) => source.type === filter)

  function askQuestion(question = draft) {
    setActiveQuestion(question)
    setDraft(question)
    setAsked(question)
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

        <button className="upload-button"><Upload size={16} /> Upload docs</button>

        <section className="side-section">
          <div className="section-title">Sources</div>
          {visibleSources.map((source) => (
            <button className="source-row" key={source.name}>
              <FileText size={17} />
              <span>
                <strong>{source.name}</strong>
                <small>{source.pages} pages • {source.status}</small>
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
            <p>Retrieval-augmented answers with source snippets, confidence, and traceable citations.</p>
          </div>
          <div className="top-actions">
            <button><Filter size={16} /> Source filter</button>
            <button className="primary"><Bot size={16} /> Run retrieval</button>
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

        <section className="chat-panel">
          <div className="message user">
            <MessageSquareText size={18} />
            <p>{asked}</p>
          </div>
          <div className="message answer">
            <Bot size={18} />
            <div>
              <p>{answer}</p>
              <div className="citations">
                <span>Vendor Invoice Pack Q1 p.12</span>
                <span>Employee Handbook p.31</span>
                <span>Customer SLA Terms p.7</span>
              </div>
            </div>
          </div>
        </section>

        <form className="askbar" onSubmit={(event) => { event.preventDefault(); askQuestion() }}>
          <Search size={18} />
          <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ask a document question" />
          <button type="submit"><Send size={16} /> Ask</button>
        </form>
      </section>

      <aside className="inspector">
        <div className="inspector-header">
          <span>Retrieval trace</span>
          <strong>94% confidence</strong>
        </div>
        <div className="filters">
          {['All', 'Policy', 'Finance', 'Ops', 'Legal'].map((item) => (
            <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="chunk-list">
          {chunks.map((chunk, index) => (
            <article className="chunk" key={chunk.title}>
              <div className="chunk-rank">{index + 1}</div>
              <div>
                <h2>{chunk.title}</h2>
                <p>{chunk.source} • page {chunk.page}</p>
                <div className="meter"><span style={{ width: `${chunk.confidence}%` }} /></div>
              </div>
              <strong>{chunk.confidence}%</strong>
            </article>
          ))}
        </div>
        <div className="audit-box">
          <strong>Guardrail result</strong>
          <p>Answer restricted to indexed sources. Unsupported claims are withheld until a matching chunk is found.</p>
        </div>
      </aside>
    </main>
  )
}

createRoot(document.getElementById('app')).render(<App />)
