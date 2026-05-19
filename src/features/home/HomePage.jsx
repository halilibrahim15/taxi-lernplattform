import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase/client'

function HomePage({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  const [routes, setRoutes] = useState([])
  const [routesLoading, setRoutesLoading] = useState(true)
  const [routeMessage, setRouteMessage] = useState('')
  const [routeSubTab, setRouteSubTab] = useState('eingeben')
  const [bulkRoutesText, setBulkRoutesText] = useState('')
  const [learnMode, setLearnMode] = useState('reveal')
const [routesPerPage, setRoutesPerPage] = useState('10')
const [routesPage, setRoutesPage] = useState(1)
  const [openRoutes, setOpenRoutes] = useState({})
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [editText, setEditText] = useState('')

  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsMessage, setQuestionsMessage] = useState('')
  const [questionsSubTab, setQuestionsSubTab] = useState('eingeben')
  const [questionText, setQuestionText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [openQuestions, setOpenQuestions] = useState({})
  const [questionLearnMode, setQuestionLearnMode] = useState('reveal')

  const [landmarks, setLandmarks] = useState([])
  const [landmarksLoading, setLandmarksLoading] = useState(true)
  const [landmarksMessage, setLandmarksMessage] = useState('')
  const [landmarksSubTab, setLandmarksSubTab] = useState('eingeben')
  const [landmarkTitle, setLandmarkTitle] = useState('')
  const [landmarkSolution, setLandmarkSolution] = useState('')
  const [landmarkImageUrl, setLandmarkImageUrl] = useState('')
  const [openLandmarks, setOpenLandmarks] = useState({})

  const [examRangeText, setExamRangeText] = useState('1-148')
  const [examTotal, setExamTotal] = useState('15')
  const [priorityRangeText, setPriorityRangeText] = useState('1-20')
  const [priorityCount, setPriorityCount] = useState('5')
  const [examMessage, setExamMessage] = useState('')
  const [examActive, setExamActive] = useState(false)
  const [examQuestions, setExamQuestions] = useState([])
  const [examIndex, setExamIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [examAnswers, setExamAnswers] = useState([])
  const [examResult, setExamResult] = useState(null)
  const [examHistory, setExamHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    loadRoutes()
    loadQuestions()
    loadLandmarks()
    loadExamHistory()
  }, [])

  async function loadRoutes() {
    setRoutesLoading(true)
    const { data, error } = await supabase.from('routes').select('*').order('route_number', { ascending: true })
    if (error) setRouteMessage('Fehler beim Laden der Routen: ' + error.message)
    setRoutes(data || [])
    setRoutesLoading(false)
  }

  async function loadQuestions() {
    setQuestionsLoading(true)
    const { data } = await supabase.from('questions').select('*').order('id', { ascending: true })
    setQuestions(data || [])
    setQuestionsLoading(false)
  }

  async function loadLandmarks() {
    setLandmarksLoading(true)
    const { data } = await supabase.from('landmarks').select('*').order('id', { ascending: true })
    setLandmarks(data || [])
    setLandmarksLoading(false)
  }

  async function loadExamHistory() {
    if (!user?.id) return
    setHistoryLoading(true)
    const { data } = await supabase.from('route_exam_results').select('*').order('created_at', { ascending: false })
    setExamHistory(data || [])
    setHistoryLoading(false)
  }

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => a.route_number - b.route_number)
  }, [routes])

const routesPerPageNumber = Number(routesPerPage) || 10
const totalRoutePages = Math.max(1, Math.ceil(sortedRoutes.length / routesPerPageNumber))

const visibleRoutes = sortedRoutes.slice(
  (routesPage - 1) * routesPerPageNumber,
  routesPage * routesPerPageNumber
)

  function parseRange(text) {
    const [fromRaw, toRaw] = String(text).split('-').map((x) => x.trim())
    const from = Number(fromRaw)
    const to = Number(toRaw)
    return { from, to }
  }

  function parseBulkRoutes(text) {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    const parsed = []

    for (const line of lines) {
      const parts = line.split('|').map((part) => part.trim())

      if (parts.length !== 4 && parts.length !== 5) {
        throw new Error('Falsches Format. Beispiel: 1 | START | ZIEL | Straßen oder 1 | Bezirk | START | ZIEL | Straßen')
      }

      const routeNumber = Number(parts[0])
      if (!routeNumber) throw new Error('Mindestens eine Routennummer ist ungültig.')

      const row =
        parts.length === 5
          ? {
              route_number: routeNumber,
              district: parts[1],
              start_name: parts[2],
              destination_name: parts[3],
              streets_text: parts[4],
            }
          : {
              route_number: routeNumber,
              district: '',
              start_name: parts[1],
              destination_name: parts[2],
              streets_text: parts[3],
            }

      if (!row.start_name || !row.destination_name || !row.streets_text) {
        throw new Error('Mindestens eine Zeile ist unvollständig.')
      }

      parsed.push(row)
    }

    return parsed
  }

  async function handleBulkSaveRoutes() {
    setRouteMessage('')

    if (!bulkRoutesText.trim()) {
      setRouteMessage('Bitte zuerst Routen einfügen.')
      return
    }

    try {
      const rows = parseBulkRoutes(bulkRoutesText)
      const { error } = await supabase.from('routes').upsert(rows, { onConflict: 'route_number' })

      if (error) {
        setRouteMessage('Speichern fehlgeschlagen: ' + error.message)
      } else {
        setBulkRoutesText('')
        setRouteMessage('Routen erfolgreich gespeichert oder aktualisiert.')
        loadRoutes()
      }
    } catch (error) {
      setRouteMessage(error.message)
    }
  }

  function startEdit(route) {
    const text = route.district
      ? `${route.route_number} | ${route.district} | ${route.start_name} | ${route.destination_name} | ${route.streets_text}`
      : `${route.route_number} | ${route.start_name} | ${route.destination_name} | ${route.streets_text}`

    setEditingRouteId(route.id)
    setEditText(text)
  }

  async function saveEdit(id) {
    try {
      const row = parseBulkRoutes(editText)[0]
      const { error } = await supabase.from('routes').update(row).eq('id', id)

      if (error) {
        setRouteMessage('Bearbeiten fehlgeschlagen: ' + error.message)
      } else {
        setEditingRouteId(null)
        setEditText('')
        setRouteMessage('Route erfolgreich bearbeitet.')
        loadRoutes()
      }
    } catch (error) {
      setRouteMessage(error.message)
    }
  }

  function cancelEdit() {
    setEditingRouteId(null)
    setEditText('')
  }

  async function deleteRoute(id) {
    const { error } = await supabase.from('routes').delete().eq('id', id)
    setRouteMessage(error ? 'Löschen fehlgeschlagen: ' + error.message : 'Route gelöscht.')
    loadRoutes()
  }

  async function addQuestion() {
    setQuestionsMessage('')
    if (!questionText.trim()) {
      setQuestionsMessage('Bitte zuerst eine Frage eingeben.')
      return
    }

    const { error } = await supabase.from('questions').insert([
      {
        question_text: questionText.trim(),
        answer_text: answerText.trim(),
      },
    ])

    if (error) {
      setQuestionsMessage('Speichern fehlgeschlagen: ' + error.message)
    } else {
      setQuestionText('')
      setAnswerText('')
      setQuestionsMessage('Frage gespeichert.')
      loadQuestions()
    }
  }

  async function deleteQuestion(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    setQuestionsMessage(error ? 'Löschen fehlgeschlagen: ' + error.message : 'Frage gelöscht.')
    loadQuestions()
  }

  async function addLandmark() {
    setLandmarksMessage('')
    if (!landmarkTitle.trim()) {
      setLandmarksMessage('Bitte zuerst einen Titel eingeben.')
      return
    }

    const { error } = await supabase.from('landmarks').insert([
      {
        title: landmarkTitle.trim(),
        image_url: landmarkImageUrl.trim(),
        solution_text: landmarkSolution.trim(),
      },
    ])

    if (error) {
      setLandmarksMessage('Speichern fehlgeschlagen: ' + error.message)
    } else {
      setLandmarkTitle('')
      setLandmarkImageUrl('')
      setLandmarkSolution('')
      setLandmarksMessage('Denkmal gespeichert.')
      loadLandmarks()
    }
  }

  async function deleteLandmark(id) {
    const { error } = await supabase.from('landmarks').delete().eq('id', id)
    setLandmarksMessage(error ? 'Löschen fehlgeschlagen: ' + error.message : 'Denkmal gelöscht.')
    loadLandmarks()
  }

  function toggleRoute(id) {
    setOpenRoutes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleQuestion(id) {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleLandmark(id) {
    setOpenLandmarks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function shuffleArray(array) {
    const copy = [...array]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy
  }

  function pickRandom(array, amount) {
    return shuffleArray(array).slice(0, amount)
  }

  function splitStreets(text) {
    return String(text || '')
      .split('>')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  function buildWrongAnswer(correctRoute, allRoutes, questionIndex, wrongIndex) {
    const correct = splitStreets(correctRoute.streets_text)
    const others = shuffleArray(allRoutes.filter((r) => r.id !== correctRoute.id && r.streets_text))
    const other = others[wrongIndex % Math.max(others.length, 1)]
    const otherStreets = splitStreets(other?.streets_text || '')

    if (!correct.length || !otherStreets.length) return other?.streets_text || 'Keine Alternative'

    const rareEarlyMistake = questionIndex % 7 === 0 && wrongIndex === 0
    const keepCount = rareEarlyMistake ? 0 : wrongIndex === 0 ? 2 : 1
    let combined = [...correct.slice(0, keepCount), ...otherStreets.slice(keepCount)]

    if (wrongIndex === 2 && correct.length > 4) {
      combined = [correct[0], correct[2], correct[1], ...correct.slice(3)]
    }

    const result = combined.join(' > ')
    return result === correctRoute.streets_text ? otherStreets.reverse().join(' > ') : result
  }

  function buildAnswerOptions(route, allRoutes, questionIndex) {
    const correct = String(route.streets_text || '').trim()
    const wrongs = []
    let attempt = 0

    while (wrongs.length < 3 && attempt < 40) {
      const wrong = buildWrongAnswer(route, allRoutes, questionIndex + attempt, wrongs.length)
      if (wrong && wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong)
      attempt += 1
    }

    while (wrongs.length < 3) {
      const shuffled = shuffleArray(splitStreets(correct)).join(' > ')
      wrongs.push(shuffled || `Alternative ${wrongs.length + 1}`)
    }

    return shuffleArray([
      { text: correct, isCorrect: true },
      { text: wrongs[0], isCorrect: false },
      { text: wrongs[1], isCorrect: false },
      { text: wrongs[2], isCorrect: false },
    ])
  }

  function startRouteExam() {
    setExamMessage('')
    setExamResult(null)

    const { from, to } = parseRange(examRangeText)
    const { from: pFrom, to: pTo } = parseRange(priorityRangeText)
    const total = Number(examTotal)
    const pCount = Number(priorityCount)

    if (!from || !to || from > to) {
      setExamMessage('Routenbereich ist ungültig. Beispiel: 1-148')
      return
    }

    if (!total || total < 1) {
      setExamMessage('Anzahl Fragen ist ungültig.')
      return
    }

    const allInRange = sortedRoutes.filter((route) => route.route_number >= from && route.route_number <= to)
    const priorityRoutes = sortedRoutes.filter((route) => route.route_number >= pFrom && route.route_number <= pTo)

    if (allInRange.length < total) {
      setExamMessage('In diesem Bereich gibt es nicht genug Routen.')
      return
    }

    const selectedPriority = pickRandom(priorityRoutes, Math.min(pCount, priorityRoutes.length, total))
    const selectedPriorityIds = new Set(selectedPriority.map((r) => r.id))
    const remainingPool = allInRange.filter((route) => !selectedPriorityIds.has(route.id))
    const remainingNeeded = total - selectedPriority.length
    const selectedRemaining = pickRandom(remainingPool, remainingNeeded)

    const selectedRoutes = shuffleArray([...selectedPriority, ...selectedRemaining]).slice(0, total)

    const questions = selectedRoutes.map((route, index) => ({
      route,
      options: buildAnswerOptions(route, sortedRoutes, index),
    }))

    setExamQuestions(questions)
    setExamIndex(0)
    setSelectedAnswer(null)
    setExamAnswers([])
    setExamActive(true)
  }

  function createAnswerRecord(question, selectedIndex, status = 'answered') {
    const selectedOption = selectedIndex === null || selectedIndex === undefined ? null : question.options[selectedIndex]
    const correctOption = question.options.find((option) => option.isCorrect)

    return {
      route_id: question.route.id,
      route_number: question.route.route_number,
      start_name: question.route.start_name,
      destination_name: question.route.destination_name,
      selected_answer: selectedOption?.text || null,
      correct_answer: correctOption?.text || '',
      is_correct: Boolean(selectedOption?.isCorrect),
      status,
      options: question.options,
    }
  }

  async function finishExam(finalAnswers) {
    const total = examQuestions.length
    const correct = finalAnswers.filter((a) => a.is_correct).length
    const unanswered = finalAnswers.filter((a) => a.status === 'unanswered').length
    const wrong = total - correct - unanswered
    const percent = total ? Math.round((correct / total) * 100) : 0
    const passed = percent >= 66

    const result = { total, correct, wrong, unanswered, percent, passed, answers: finalAnswers }

    setExamResult(result)
    setExamActive(false)
    setRouteSubTab('pruefung')
    setActiveTab('routes')

    if (user?.id) {
      await supabase.from('route_exam_results').insert([
        {
          user_id: user.id,
          user_email: user.email,
          total_questions: total,
          correct_count: correct,
          wrong_count: wrong,
          unanswered_count: unanswered,
          percent,
          passed,
          route_range: examRangeText,
          priority_range: `${priorityRangeText}: ${priorityCount}`,
          answers: finalAnswers,
        },
      ])

      loadExamHistory()
    }
  }

  function nextExamQuestion() {
    const question = examQuestions[examIndex]
    const answer = createAnswerRecord(question, selectedAnswer, selectedAnswer === null ? 'unanswered' : 'answered')
    const newAnswers = [...examAnswers, answer]

    if (examIndex + 1 >= examQuestions.length) {
      finishExam(newAnswers)
      return
    }

    setExamAnswers(newAnswers)
    setExamIndex((prev) => prev + 1)
    setSelectedAnswer(null)
  }

  function abortExam() {
    const remaining = examQuestions.slice(examIndex).map((question) => createAnswerRecord(question, null, 'unanswered'))
    finishExam([...examAnswers, ...remaining])
  }

  function getErrorAnalysis() {
    const map = {}

    for (const item of examHistory) {
      const answers = Array.isArray(item.answers) ? item.answers : []
      for (const answer of answers) {
        if (!answer.is_correct) {
          const key = `${answer.route_number} – ${answer.start_name} → ${answer.destination_name}`
          map[key] = (map[key] || 0) + 1
        }
      }
    }

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  function renderDashboard() {
    return (
      <>
        <div style={heroCardStyle}>
          <div style={heroTopRowStyle}>
            <div style={heroLeftRowStyle}>
              <div style={badgeStyle}>Taxi Lernplattform</div>
              <div style={connectedStyle}><span style={greenDotStyle} />Verbunden</div>
            </div>

            <div style={heroRightRowStyle}>
              <div style={userEmailStyle}>{user?.email || 'Kein Benutzer'}</div>
              <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </div>
          </div>

          <h1 style={heroTitleStyle}>Willkommen zurück</h1>
          <p style={heroTextStyle}>Hier lernst du Routen, Fragen und Denkmäler gemeinsam an einem Ort.</p>
        </div>

        <div style={heroCardStyle}>
          <div style={statGridStyle}>
            <DashboardStatCard icon="🛣️" title="Routen" value={sortedRoutes.length} />
            <DashboardStatCard icon="❓" title="Fragen" value={questions.length} />
            <DashboardStatCard icon="🏛️" title="Denkmäler" value={landmarks.length} />
          </div>
        </div>
      </>
    )
  }

  function renderRoutes() {
    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Routen</h2>
              <p style={sectionTextStyle}>Routen eingeben, lernen oder Prüfung starten.</p>
            </div>

            <div style={subTabRowStyle}>
              <button onClick={() => setRouteSubTab('eingeben')} style={subTabStyle(routeSubTab === 'eingeben')}>Eingeben</button>
              <button onClick={() => setRouteSubTab('lernen')} style={subTabStyle(routeSubTab === 'lernen')}>Lernen</button>
              <button onClick={() => setRouteSubTab('pruefung')} style={subTabStyle(routeSubTab === 'pruefung')}>Prüfung</button>
              <button onClick={() => setRouteSubTab('verlauf')} style={subTabStyle(routeSubTab === 'verlauf')}>Verlauf</button>
            </div>
          </div>
        </div>

        {routeSubTab === 'eingeben' && renderRoutesInput()}
        {routeSubTab === 'lernen' && renderRoutesLearn()}
        {routeSubTab === 'pruefung' && renderRouteExamSettings()}
        {routeSubTab === 'verlauf' && renderRouteExamHistory()}
      </div>
    )
  }

  function renderRoutesInput() {
    return (
      <div style={panelStyle}>
        <h3 style={smallTitleStyle}>Routen eingeben</h3>

        <div style={hintBoxStyle}>
          <strong>Ohne Bezirk:</strong><br />
          1 | START | ZIEL | Straße 1 &gt; Straße 2 &gt; Straße 3
          <br /><br />
          <strong>Mit Bezirk:</strong><br />
          1 | 1. Bezirk – Innere Stadt | START | ZIEL | Straße 1 &gt; Straße 2 &gt; Straße 3
        </div>

        {routeMessage && <div style={messageBoxStyle}>{routeMessage}</div>}

        <textarea
          value={bulkRoutesText}
          onChange={(e) => setBulkRoutesText(e.target.value)}
          placeholder="Hier mehrere Routen gleichzeitig einfügen..."
          style={largeTextareaStyle}
        />

        <button onClick={handleBulkSaveRoutes} style={mainActionButton}>Routen speichern</button>
      </div>
    )
  }

  function renderRoutesLearn() {
    return (
      <>
        <div style={panelStyle}>
          <h3 style={smallTitleStyle}>Routen lernen</h3>
          <p style={sectionTextStyle}>Wähle zwischen sichtbar oder aufklappbar.</p>

          <div style={{ ...subTabRowStyle, marginTop: '14px' }}>
            <button onClick={() => setLearnMode('full')} style={subTabStyle(learnMode === 'full')}>Alles sichtbar</button>
            <button onClick={() => setLearnMode('reveal')} style={subTabStyle(learnMode === 'reveal')}>Aufklappbar</button>
          </div>
          <div
  style={{
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '16px',
  }}
>
  <label style={labelStyle}>Routen pro Seite</label>

  <select
    value={routesPerPage}
    onChange={(e) => {
      setRoutesPerPage(e.target.value)
      setRoutesPage(1)
    }}
 style={{
  ...inputStyle,
  maxWidth: '120px',
  padding: '10px',
}}
  >
    <option value="5">5</option>
    <option value="10">10</option>
    <option value="20">20</option>
    <option value="50">50</option>
    <option value="9999">Alle</option>
  </select>
</div>
        </div>

        {routesLoading ? (
          <div style={panelStyle}>Lade Routen...</div>
        ) : sortedRoutes.length === 0 ? (
          <div style={panelStyle}>Noch keine Routen vorhanden.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {visibleRoutes.map((route) => (
              <div key={route.id} style={panelStyle}>
                {editingRouteId === route.id ? (
                  <div>
                    <div style={editTitleStyle}>Route bearbeiten</div>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={editTextareaStyle} />
                    <div style={subTabRowStyle}>
                      <button onClick={() => saveEdit(route.id)} style={saveButtonStyle}>Speichern</button>
                      <button onClick={cancelEdit} style={neutralButtonStyle}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={mutedSmallTextStyle}>Route {route.route_number}</div>
                    {route.district && <div style={districtStyle}>{route.district}</div>}
                    <div style={routeTitleStyle}>{route.start_name} → {route.destination_name}</div>

                    {learnMode === 'full' ? (
                      <div style={answerBoxStyle}>{route.streets_text}</div>
                    ) : (
                      <>
                        <button onClick={() => toggleRoute(route.id)} style={revealButtonStyle(openRoutes[route.id])}>
                          {openRoutes[route.id] ? 'Zuklappen' : 'Aufklappen'}
                        </button>
                        {openRoutes[route.id] && <div style={{ ...answerBoxStyle, marginTop: '12px' }}>{route.streets_text}</div>}
                      </>
                    )}

                    <div style={subTabRowStyle}>
                      <button onClick={() => startEdit(route)} style={neutralBlueButtonStyle}>Bearbeiten</button>
                      <button onClick={() => deleteRoute(route.id)} style={dangerButtonStyle}>Löschen</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div
style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px',
}}
>
  <button
    onClick={() => setRoutesPage((prev) => Math.max(1, prev - 1))}
    disabled={routesPage === 1}
    style={{
  ...neutralButtonStyle,
  padding: '8px 10px',
  fontSize: '13px',
}}
  >
    Zurück
  </button>

  <div style={{ fontWeight: 'bold', color: '#475569' }}>
    Seite {routesPage} von {totalRoutePages}
  </div>

  <button
    onClick={() => setRoutesPage((prev) => Math.min(totalRoutePages, prev + 1))}
    disabled={routesPage === totalRoutePages}
    style={{
  ...neutralButtonStyle,
  padding: '8px 10px',
  fontSize: '13px',
}}
  >
    Weiter
  </button>
</div>
          </div>
        )}
      </>
    )
  }

  function renderRouteExamSettings() {
    return (
      <>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Prüfungssimulation</h2>
          <p style={sectionTextStyle}>Nur für Routen. Eine Frage sichtbar, 4 Antworten, immer nur 1 richtig.</p>

          {examMessage && <div style={messageBoxStyle}>{examMessage}</div>}

          <div style={simpleExamGridStyle}>
            <div>
              <label style={labelStyle}>Routenbereich</label>
              <input value={examRangeText} onChange={(e) => setExamRangeText(e.target.value)} placeholder="1-148" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Anzahl Fragen</label>
              <input value={examTotal} onChange={(e) => setExamTotal(e.target.value)} placeholder="15" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Schwerpunkt-Routen</label>
              <input value={priorityRangeText} onChange={(e) => setPriorityRangeText(e.target.value)} placeholder="1-20" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Anzahl aus Schwerpunkt</label>
              <input value={priorityCount} onChange={(e) => setPriorityCount(e.target.value)} placeholder="5" style={inputStyle} />
            </div>
          </div>

          <div style={hintBoxStyle}>
            Beispiel: <strong>15 Fragen</strong>, Routenbereich <strong>1-148</strong>, Schwerpunkt <strong>1-20</strong>, Anzahl daraus <strong>5</strong>.
            Dann kommen 5 Fragen aus Route 1 bis 20, der Rest zufällig aus dem gesamten Bereich.
          </div>

          <button onClick={startRouteExam} style={mainActionButton}>Prüfung starten</button>
        </div>

        {examResult && renderExamResult()}
      </>
    )
  }

  function renderRouteExamScreen() {
    const question = examQuestions[examIndex]
    if (!question) return null

    return (
      <div style={examPageStyle}>
        <div style={examCardStyle}>
          <div style={examTopStyle}>
            <div>
              <div style={mutedSmallTextStyle}>Frage {examIndex + 1} von {examQuestions.length}</div>
              <h1 style={examQuestionTitleStyle}>{question.route.start_name} → {question.route.destination_name}</h1>
            </div>

            <button onClick={abortExam} style={dangerButtonStyle}>Prüfung abbrechen</button>
          </div>

          <div style={examOptionsGridStyle}>
            {question.options.map((option, index) => (
              <button
                key={`${option.text}-${index}`}
                onClick={() => setSelectedAnswer(index)}
                style={examOptionStyle(selectedAnswer === index)}
              >
                <strong>{String.fromCharCode(65 + index)}</strong>
                <span>{option.text}</span>
              </button>
            ))}
          </div>

          <button onClick={nextExamQuestion} style={wideMainButtonStyle}>Weiter</button>
        </div>
      </div>
    )
  }

  function renderExamResult() {
    return (
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Ergebnis</h2>

        <div style={{
          ...resultBoxStyle,
          borderColor: examResult.passed ? '#86efac' : '#fecaca',
          backgroundColor: examResult.passed ? '#f0fdf4' : '#fef2f2',
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '800',
            color: examResult.passed ? '#16a34a' : '#dc2626',
            marginBottom: '8px',
          }}>
            {examResult.passed ? 'Bestanden' : 'Nicht bestanden'}
          </div>

          <div style={resultGridStyle}>
            <div><strong style={{ color: '#16a34a' }}>{examResult.correct}</strong> richtig</div>
            <div><strong style={{ color: '#dc2626' }}>{examResult.wrong}</strong> falsch</div>
            <div><strong>{examResult.unanswered}</strong> nicht beantwortet</div>
            <div><strong>{examResult.percent}%</strong> Ergebnis</div>
          </div>
        </div>

        <h3 style={smallTitleStyle}>Antwortübersicht</h3>

        <div style={{ display: 'grid', gap: '12px' }}>
          {examResult.answers.map((answer, index) => (
            <div key={`${answer.route_id}-${index}`} style={answerReviewBoxStyle}>
              <div style={routeTitleStyle}>Frage {index + 1}: {answer.start_name} → {answer.destination_name}</div>

              {answer.status === 'unanswered' && (
                <div style={{ color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>Nicht beantwortet</div>
              )}

              <div style={{ display: 'grid', gap: '8px' }}>
                {answer.options.map((option, optionIndex) => {
                  const isCorrect = option.isCorrect
                  const isSelected = option.text === answer.selected_answer

                  return (
                    <div
                      key={`${option.text}-${optionIndex}`}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${isCorrect ? '#86efac' : isSelected ? '#fecaca' : '#e5e7eb'}`,
                        backgroundColor: isCorrect ? '#f0fdf4' : isSelected ? '#fef2f2' : '#ffffff',
                        color: isCorrect ? '#166534' : isSelected ? '#991b1b' : '#0f172a',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong>{String.fromCharCode(65 + optionIndex)}</strong> — {option.text}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderRouteExamHistory() {
    const errors = getErrorAnalysis()

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Mein Verlauf</h2>

          {historyLoading ? (
            <div>Lade Verlauf...</div>
          ) : examHistory.length === 0 ? (
            <div>Noch kein Prüfungsverlauf vorhanden.</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {examHistory.map((item) => (
                <div key={item.id} style={historyItemStyle}>
                  <div>
                    <strong>{new Date(item.created_at).toLocaleDateString()} – {new Date(item.created_at).toLocaleTimeString()}</strong>
                    <div style={mutedSmallTextStyle}>Bereich: {item.route_range} | Schwerpunkt: {item.priority_range}</div>
                  </div>

                  <div style={{ color: item.passed ? '#16a34a' : '#dc2626', fontWeight: '800' }}>
                    {item.correct_count}/{item.total_questions} – {item.percent}% – {item.passed ? 'Bestanden' : 'Nicht bestanden'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Fehleranalyse</h2>

          {errors.length === 0 ? (
            <div>Noch keine Fehleranalyse vorhanden.</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {errors.map((error) => (
                <div key={error.name} style={historyItemStyle}>
                  <div>{error.name}</div>
                  <strong style={{ color: '#dc2626' }}>{error.count} Fehler</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderQuestions() {
    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Fragen</h2>
              <p style={sectionTextStyle}>Fragen eingeben oder im Lernmodus üben.</p>
            </div>

            <div style={subTabRowStyle}>
              <button onClick={() => setQuestionsSubTab('eingeben')} style={subTabStyle(questionsSubTab === 'eingeben')}>Eingeben</button>
              <button onClick={() => setQuestionsSubTab('lernen')} style={subTabStyle(questionsSubTab === 'lernen')}>Lernen</button>
            </div>
          </div>
        </div>

        {questionsSubTab === 'eingeben' && (
          <div style={panelStyle}>
            {questionsMessage && <div style={messageBoxStyle}>{questionsMessage}</div>}

            <div style={{ display: 'grid', gap: '12px' }}>
              <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Frage eingeben..." style={inputAreaStyle} />
              <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Antwort eingeben..." style={inputAreaStyle} />
              <button onClick={addQuestion} style={mainActionButton}>Frage speichern</button>
            </div>
          </div>
        )}

        {questionsSubTab === 'lernen' && (
          <div style={panelStyle}>
            <div style={subTabRowStyle}>
              <button onClick={() => setQuestionLearnMode('full')} style={subTabStyle(questionLearnMode === 'full')}>Alles sichtbar</button>
              <button onClick={() => setQuestionLearnMode('reveal')} style={subTabStyle(questionLearnMode === 'reveal')}>Aufklappbar</button>
            </div>

            <div style={{ height: '18px' }} />

            {questionsLoading ? (
              <div>Lade Fragen...</div>
            ) : questions.length === 0 ? (
              <div>Noch keine Fragen vorhanden.</div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {questions.map((question) => (
                  <div key={question.id} style={learnItemStyle}>
                    <div style={questionTitleStyle}>{question.question_text}</div>

                    {questionLearnMode === 'full' ? (
                      <div style={answerBoxStyle}>{question.answer_text || 'Keine Antwort eingetragen.'}</div>
                    ) : (
                      <>
                        <button onClick={() => toggleQuestion(question.id)} style={revealButtonStyle(openQuestions[question.id])}>
                          {openQuestions[question.id] ? 'Zuklappen' : 'Aufklappen'}
                        </button>

                        {openQuestions[question.id] && <div style={{ ...answerBoxStyle, marginTop: '12px' }}>{question.answer_text || 'Keine Antwort eingetragen.'}</div>}
                      </>
                    )}

                    <button onClick={() => deleteQuestion(question.id)} style={dangerButtonStyle}>Löschen</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderLandmarks() {
    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Denkmäler</h2>
              <p style={sectionTextStyle}>Denkmäler eingeben oder mit Bild lernen.</p>
            </div>

            <div style={subTabRowStyle}>
              <button onClick={() => setLandmarksSubTab('eingeben')} style={subTabStyle(landmarksSubTab === 'eingeben')}>Eingeben</button>
              <button onClick={() => setLandmarksSubTab('lernen')} style={subTabStyle(landmarksSubTab === 'lernen')}>Lernen</button>
            </div>
          </div>
        </div>

        {landmarksSubTab === 'eingeben' && (
          <div style={panelStyle}>
            {landmarksMessage && <div style={messageBoxStyle}>{landmarksMessage}</div>}

            <div style={{ display: 'grid', gap: '12px' }}>
              <input value={landmarkTitle} onChange={(e) => setLandmarkTitle(e.target.value)} placeholder="Titel / Ort" style={inputStyle} />
              <input value={landmarkImageUrl} onChange={(e) => setLandmarkImageUrl(e.target.value)} placeholder="Bild-URL" style={inputStyle} />
              <textarea value={landmarkSolution} onChange={(e) => setLandmarkSolution(e.target.value)} placeholder="Lösung / Beschreibung" style={inputAreaStyle} />
              <button onClick={addLandmark} style={mainActionButton}>Denkmal speichern</button>
            </div>
          </div>
        )}

        {landmarksSubTab === 'lernen' && (
          <div style={panelStyle}>
            {landmarksLoading ? (
              <div>Lade Denkmäler...</div>
            ) : landmarks.length === 0 ? (
              <div>Noch keine Denkmäler vorhanden.</div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {landmarks.map((landmark) => (
                  <div key={landmark.id} style={learnItemStyle}>
                    <div style={questionTitleStyle}>{landmark.title}</div>

                    {landmark.image_url ? (
                      <img src={landmark.image_url} alt={landmark.title} style={landmarkImageStyle} />
                    ) : (
                      <div style={emptyImageStyle}>Kein Bild hinterlegt.</div>
                    )}

                    <button onClick={() => toggleLandmark(landmark.id)} style={revealButtonStyle(openLandmarks[landmark.id])}>
                      {openLandmarks[landmark.id] ? 'Zuklappen' : 'Lösung zeigen'}
                    </button>

                    {openLandmarks[landmark.id] && <div style={{ ...answerBoxStyle, marginTop: '12px' }}>{landmark.solution_text || 'Keine Lösung eingetragen.'}</div>}

                    <button onClick={() => deleteLandmark(landmark.id)} style={dangerButtonStyle}>Löschen</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (examActive) {
    return renderRouteExamScreen()
  }

  return (
    <div style={appShellStyle}>
      <div style={navStyle}>
        <button onClick={() => setActiveTab('dashboard')} style={tabStyle(activeTab === 'dashboard')}><span style={{ fontSize: '15px' }}>⊞</span>Übersicht</button>
        <button onClick={() => setActiveTab('routes')} style={tabStyle(activeTab === 'routes')}><span style={{ fontSize: '15px' }}>🛣️</span>Routen</button>
        <button onClick={() => setActiveTab('questions')} style={tabStyle(activeTab === 'questions')}><span style={{ fontSize: '15px' }}>❓</span>Fragen</button>
        <button onClick={() => setActiveTab('landmarks')} style={tabStyle(activeTab === 'landmarks')}><span style={{ fontSize: '15px' }}>🏛️</span>Denkmäler</button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'routes' && renderRoutes()}
      {activeTab === 'questions' && renderQuestions()}
      {activeTab === 'landmarks' && renderLandmarks()}
    </div>
  )
}

function DashboardStatCard({ icon, title, value }) {
  return (
    <div style={dashboardStatCardStyle}>
      <div style={dashboardIconStyle}>{icon}</div>
      <div>
        <div style={dashboardStatTitleStyle}>{title}</div>
        <div style={dashboardStatNumberStyle}>{value}</div>
        <div style={dashboardStatTextStyle}>Gespeichert</div>
      </div>
    </div>
  )
}

function tabStyle(active) {
  return {
    backgroundColor: active ? '#2563eb' : '#ffffff',
    color: active ? '#ffffff' : '#111827',
    border: active ? '1px solid #2563eb' : '1px solid #dbe3ef',
    borderRadius: '12px',
    padding: '10px 10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    minHeight: '44px',
    boxShadow: active
      ? '0 6px 14px rgba(37, 99, 235, 0.15)'
      : '0 3px 10px rgba(15, 23, 42, 0.04)',
  }
}

function subTabStyle(active) {
  return {
    backgroundColor: active ? '#2563eb' : '#ffffff',
    color: active ? '#ffffff' : '#111827',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    padding: '10px 8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    minHeight: '42px',
  }
}

function revealButtonStyle(isOpen) {
  return {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: isOpen ? '12px' : '0',
  }
}

function examOptionStyle(active) {
  return {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    textAlign: 'left',
    backgroundColor: active ? '#eff6ff' : '#ffffff',
    border: active ? '2px solid #2563eb' : '1px solid #dbe3ef',
    borderRadius: '14px',
    padding: '14px',
    color: '#0f172a',
    lineHeight: '1.5',
    cursor: 'pointer',
    fontSize: '14px',
  }
}

const appShellStyle = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '0 8px',
}

const navStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginBottom: '22px',
  alignItems: 'center',
}

const heroCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '10px',
  boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
  marginBottom: '16px',
}

const heroTopRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  flexWrap: 'wrap',
  marginBottom: '14px',
}

const heroLeftRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const heroRightRowStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#e8f0ff',
  color: '#2563eb',
  padding: '7px 12px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 'bold',
}

const connectedStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  color: '#16a34a',
  fontSize: '14px',
  fontWeight: 'bold',
}

const greenDotStyle = {
  width: '9px',
  height: '9px',
  borderRadius: '999px',
  backgroundColor: '#16a34a',
  display: 'inline-block',
}

const userEmailStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #dbe3ef',
  borderRadius: '14px',
  padding: '10px 12px',
  fontSize: '13px',
  color: '#475569',
  fontWeight: '600',
  wordBreak: 'break-word',
}

const logoutButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #dbe3ef',
  borderRadius: '14px',
  padding: '10px 12px',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
}

const heroTitleStyle = {
  margin: '0 0 10px 0',
  fontSize: '18px',
  lineHeight: '1.1',
  color: '#0f172a',
  fontWeight: '800',
}

const heroTextStyle = {
  margin: 0,
  fontSize: '10px',
  lineHeight: '1.5',
  color: '#64748b',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: '14px',
}

const dashboardStatCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '18px',
  padding: '12px',
  minHeight: '72px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const dashboardIconStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '999px',
  backgroundColor: '#eef4ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: '15px',
}

const dashboardStatTitleStyle = {
  fontSize: '14px',
  color: '#64748b',
  marginBottom: '6px',
  fontWeight: '500',
}

const dashboardStatNumberStyle = {
  fontSize: '20px',
  fontWeight: '800',
  color: '#0f172a',
  lineHeight: 1,
  marginBottom: '6px',
}

const dashboardStatTextStyle = {
  fontSize: '13px',
  color: '#64748b',
}

const panelStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '16px',
  boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  flexWrap: 'wrap',
}

const sectionTitleStyle = {
  margin: '0 0 6px 0',
  fontSize: '22px',
  color: '#0f172a',
}

const smallTitleStyle = {
  margin: '0 0 12px 0',
  fontSize: '18px',
  color: '#0f172a',
}

const sectionTextStyle = {
  margin: 0,
  color: '#6b7280',
  fontSize: '14px',
}

const subTabRowStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const hintBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '13px',
  marginBottom: '16px',
  fontSize: '13px',
  color: '#475569',
  lineHeight: '1.7',
}

const messageBoxStyle = {
  marginBottom: '16px',
  padding: '13px 14px',
  borderRadius: '12px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  fontSize: '13px',
  fontWeight: 'bold',
}

const largeTextareaStyle = {
  width: '100%',
  minHeight: '220px',
  resize: 'vertical',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  outline: 'none',
  marginBottom: '14px',
  lineHeight: '1.5',
  boxSizing: 'border-box',
}

const inputStyle = {
  width: '100%',
  padding: '11px',
  borderRadius: '11px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
  fontSize: '14px',
}

const inputAreaStyle = {
  width: '100%',
  minHeight: '100px',
  padding: '13px',
  borderRadius: '12px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
  fontSize: '14px',
}

const mainActionButton = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '13px 16px',
  fontSize: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
}

const wideMainButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '15px 18px',
  fontSize: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
}

const editTitleStyle = {
  marginBottom: '10px',
  fontWeight: 'bold',
  color: '#0f172a',
}

const editTextareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  marginBottom: '10px',
  boxSizing: 'border-box',
}

const saveButtonStyle = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const neutralButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const neutralBlueButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#2563eb',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const dangerButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const mutedSmallTextStyle = {
  fontSize: '13px',
  color: '#64748b',
  marginBottom: '8px',
}

const districtStyle = {
  fontSize: '14px',
  color: '#475569',
  marginBottom: '10px',
  fontWeight: 'bold',
}

const routeTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0f172a',
  marginBottom: '10px',
  lineHeight: '1.35',
}

const answerBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '12px',
  color: '#334155',
  lineHeight: '1.55',
  marginBottom: '10px',
  fontSize: '13px',
}

const learnItemStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '16px',
}

const questionTitleStyle = {
  fontSize: '17px',
  fontWeight: 'bold',
  color: '#0f172a',
  marginBottom: '10px',
}

const landmarkImageStyle = {
  width: '100%',
  maxWidth: '420px',
  borderRadius: '14px',
  display: 'block',
  marginBottom: '12px',
}

const emptyImageStyle = {
  backgroundColor: '#e5e7eb',
  color: '#475569',
  borderRadius: '14px',
  padding: '22px',
  marginBottom: '12px',
}

const simpleExamGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '12px',
  marginTop: '16px',
  marginBottom: '16px',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  color: '#64748b',
  marginBottom: '6px',
  fontWeight: '700',
}

const examPageStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '0 10px',
}

const examCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '22px',
  padding: '22px',
  boxShadow: '0 10px 24px rgba(0,0,0,0.07)',
}

const examTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  flexWrap: 'wrap',
  marginBottom: '18px',
}

const examQuestionTitleStyle = {
  margin: 0,
  fontSize: '22px',
  color: '#0f172a',
  lineHeight: '1.3',
}

const examOptionsGridStyle = {
  display: 'grid',
  gap: '12px',
  marginBottom: '18px',
}

const resultBoxStyle = {
  border: '1px solid',
  borderRadius: '16px',
  padding: '18px',
  marginBottom: '20px',
}

const resultGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
}

const answerReviewBoxStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '16px',
}

const historyItemStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

export default HomePage