/**
 * Bibliography Engine - Academic Source Integration for MDO-OODA
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Manages 19 academic bibliography sources on:
 * - AI + Nuclear C3 (Command, Control, Communications)
 * - OODA loop theory and cybernetics
 * - Deterrence theory, coercion, nuclear strategy
 * - Second-order cybernetics and feedback systems
 *
 * Provides evidence arrays compatible with SatEngine.ach() and SatEngine.bayesianUpdate()
 *
 * References:
 *   - Program_reguitements.MD (19 core sources)
 *   - ICD 203 Analytic Standards (source grading)
 *   - NATO STANAG 2022 (Admiralty Code)
 */
'use strict';

/**
 * 19 Core Bibliography Entries
 * Each entry: id, authors, year, title, publisher, url, admiraltyCode, topics, keyFindings, relevanceToOODA
 * admiraltyCode: [sourceReliability(A-F), contentRating(1-6)] per NATO standard
 */
const BIBLIOGRAPHY = [
  {
    id: 'altaf-javed-2025',
    authors: 'Altaf, B. & Javed, H.',
    year: 2025,
    title: 'Artificial Intelligence, OODA Loops, and Nuclear Command in South Asia',
    publisher: 'Strategic Studies Quarterly',
    url: null,
    admiraltyCode: ['B', 2],
    topics: ['ai-c3', 'ooda', 'nuclear-command', 'south-asia'],
    keyFindings: [
      'AI 가속화된 OODA 루프가 핵 C3 의사결정 시간을 분 단위로 압축',
      '인간-루프 이탈(human-out-of-loop) 위험이 남아시아 핵 억지에 구조적 불안정 유발',
      'OODA 속도 경쟁이 핵 선제타격 유인을 강화하는 역설적 결과',
    ],
    relevanceToOODA: 'OBSERVE-ORIENT 단계에서 AI 자동화가 핵 C3 의사결정 압축을 유발하는 메커니즘 분석',
  },
  {
    id: 'blair-1993',
    authors: 'Blair, B.G.',
    year: 1993,
    title: 'The Logic of Accidental Nuclear War',
    publisher: 'Brookings Institution Press',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['nuclear-war', 'accidental', 'c3', 'cold-war'],
    keyFindings: [
      '핵 C3 시스템의 구조적 결함이 우발적 핵전쟁 가능성을 상시 내포',
      'Launch-on-Warning(LOW) 독트린이 OODA 시간 압축의 역사적 선례',
      '소련 핵 C3의 사전위임(pre-delegation)이 의사결정 병목 해소 시도의 위험한 사례',
    ],
    relevanceToOODA: 'DECIDE-ACT 단계의 시간 압축이 우발적 핵 사용을 유발하는 역사적 증거',
  },
  {
    id: 'brehmer-2005',
    authors: 'Brehmer, B.',
    year: 2005,
    title: 'The Dynamic OODA Loop: Amalgamating Boyd\'s OODA Loop and the Cybernetic Approach to Command and Control',
    publisher: '10th International Command and Control Research and Technology Symposium',
    url: null,
    admiraltyCode: ['B', 2],
    topics: ['ooda', 'cybernetics', 'c2', 'dynamic-ooda'],
    keyFindings: [
      '보이드 OODA 루프와 사이버네틱스 C2 모델의 통합 프레임워크(DOODA) 제안',
      '피드백 루프가 ORIENT 단계의 적응성을 결정하는 핵심 변수',
      '정적 OODA에서 동적 OODA로의 전환이 복잡계 전장 환경에 필수적',
    ],
    relevanceToOODA: '본 엔진의 이론적 기반 — CyberneticsEngine과 OodaEngine 통합의 학술적 근거',
  },
  {
    id: 'bueno-de-mesquita-2023',
    authors: 'Bueno de Mesquita, B.',
    year: 2023,
    title: 'The Invention of Power: Popes, Kings, and the Birth of the West',
    publisher: 'PublicAffairs',
    url: null,
    admiraltyCode: ['A', 3],
    topics: ['selectorate-theory', 'power-dynamics', 'institutional'],
    keyFindings: [
      '선택자 이론(Selectorate Theory) 수정판: 권력 유지 메커니즘의 역사적 근거',
      '위기 시 정권 생존 논리가 합리적 억지 모델을 압도하는 구조',
      '이란 정권의 권력 유지 메커니즘 분석에 적용 가능한 이론 틀',
    ],
    relevanceToOODA: 'ORIENT 단계에서 행위자 동기 분석 — 이란 정권 생존 논리 해석 프레임',
  },
  {
    id: 'bueno-de-mesquita-2003',
    authors: 'Bueno de Mesquita, B., Smith, A., Siverson, R.M. & Morrow, J.D.',
    year: 2003,
    title: 'The Logic of Political Survival',
    publisher: 'MIT Press',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['selectorate-theory', 'political-survival', 'authoritarian'],
    keyFindings: [
      '선택자 이론의 원전: 승리연합(winning coalition) 크기가 정책 선택을 결정',
      '소규모 승리연합 = 사적 재화 배분 → 이란 IRGC-최고지도자 구조에 직접 적용',
      '전쟁 개시 결정에서 정권 생존이 국가 이익보다 우선하는 메커니즘',
    ],
    relevanceToOODA: 'ORIENT 단계 행위자 프로파일링 — 이란 의사결정 구조의 선택자 이론 적용',
  },
  {
    id: 'critchlow-2006',
    authors: 'Critchlow, R.D.',
    year: 2006,
    title: 'Nuclear Command and Control: Current Programs and Issues (CRS Report RL33408)',
    publisher: 'Congressional Research Service',
    url: null,
    admiraltyCode: ['A', 1],
    topics: ['nc3', 'us-nuclear', 'command-control', 'policy'],
    keyFindings: [
      '미국 NC3 아키텍처의 공식 구조: 대통령-STRATCOM-ICBM/SLBM/B-52 체인',
      'NC3 현대화 프로그램의 취약점과 예산 쟁점',
      '사전위임(pre-delegation) 권한의 법적/운용적 경계',
    ],
    relevanceToOODA: 'OBSERVE 단계 기준 데이터 — 미국 NC3 구조가 이란 위기 대응 시간표의 제약 조건',
  },
  {
    id: 'eln-2023',
    authors: 'European Leadership Network',
    year: 2023,
    title: 'Russian AI and Nuclear Weapons: An Annotated Bibliography',
    publisher: 'ELN',
    url: null,
    admiraltyCode: ['B', 2],
    topics: ['russia', 'ai', 'nuclear', 'bibliography'],
    keyFindings: [
      '러시아 AI-핵무기 통합 연구 문헌의 체계적 정리',
      'Perimetr(Dead Hand) 시스템의 AI 현대화 동향',
      '러시아 핵 독트린에서 AI 의사결정 보조의 공식적 역할',
    ],
    relevanceToOODA: 'ORIENT 단계 비교 분석 — 러시아 AI-핵 통합 사례가 이란 핵 C3 전망의 참조점',
  },
  {
    id: 'gwu-nsa-2008',
    authors: 'George Washington University National Security Archive',
    year: 2008,
    title: 'FOIA Minuteman Pre-Delegation Documents',
    publisher: 'GWU NSA Electronic Briefing Book',
    url: null,
    admiraltyCode: ['A', 1],
    topics: ['pre-delegation', 'minuteman', 'foia', 'nuclear-authority'],
    keyFindings: [
      '냉전기 Minuteman ICBM 사전위임 권한의 실제 운용 문서',
      '핵 사용 권한 위임의 역사적 선례와 그 위험성의 1차 자료',
      '위기 시 의사결정 체인 단축이 우발적 사용 위험을 어떻게 증가시켰는지의 증거',
    ],
    relevanceToOODA: 'DECIDE 단계 역사적 유비 — 핵 권한 위임의 선례가 이란 NCA 계승 위기에 적용',
  },
  {
    id: 'schelling-1960',
    authors: 'Schelling, T.C.',
    year: 1960,
    title: 'The Strategy of Conflict',
    publisher: 'Harvard University Press',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['game-theory', 'conflict', 'deterrence', 'focal-points'],
    keyFindings: [
      '초점(focal point) 이론: 암묵적 조율 메커니즘이 위기 해결의 핵심',
      '위협의 신뢰성(credibility)이 억지의 필요충분조건',
      '제한전쟁에서 확전 사다리(escalation ladder)의 전략적 논리',
    ],
    relevanceToOODA: 'ORIENT-DECIDE 분석 프레임 — 이란 위기의 확전 역학과 억지 신뢰성 평가',
  },
  {
    id: 'schelling-1966',
    authors: 'Schelling, T.C.',
    year: 1966,
    title: 'Arms and Influence',
    publisher: 'Yale University Press',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['coercion', 'compellence', 'deterrence', 'arms-control'],
    keyFindings: [
      '강압(coercion) vs 억지(deterrence)의 구분: "하지 마라" vs "해라"의 비대칭성',
      '강압적 외교(coercive diplomacy)에서 군사력 사용의 시그널링 기능',
      '이란에 대한 미국의 강압 전략이 왜 제한적 성공만 거두는지의 이론적 설명',
    ],
    relevanceToOODA: 'ORIENT-DECIDE 프레임 — Operation Epic Fury의 강압적 성격과 그 한계 분석',
  },
  {
    id: 'schwartz-horowitz-2025',
    authors: 'Schwartz, J.A. & Horowitz, M.C.',
    year: 2025,
    title: 'How Might Automated Nuclear Weapons Systems Affect Coercion?',
    publisher: 'arXiv preprint (University of Pennsylvania)',
    url: 'https://arxiv.org/abs/2502.06467',
    admiraltyCode: ['B', 3],
    topics: ['automated-nuclear', 'coercion', 'ai-nuclear', 'deterrence'],
    keyFindings: [
      '자동화된 핵 시스템이 강압(coercion)의 신뢰성을 변화시키는 메커니즘 분석',
      'AI 자동화가 "미친 사람(madman)" 전략의 신뢰성을 기계적으로 구현할 가능성',
      '핵 자동화의 역설: 신뢰성 증가가 오히려 위기 불안정성을 초래',
    ],
    relevanceToOODA: 'ORIENT 단계 미래 시나리오 — 이란 핵 C3 자동화 가능성의 전략적 함의',
  },
  {
    id: 'sitaraman-2022',
    authors: 'Sitaraman, G. et al.',
    year: 2022,
    title: 'Automating the OODA Loop in the Age of Intelligent Machines: Reaffirming the Role of Humans in Command-and-Control Decision-Making in the Digital Age',
    publisher: 'CSIS (Center for Strategic and International Studies)',
    url: 'https://www.csis.org/analysis/reaffirming-role-humans-command-and-control-decision-making-digital-age',
    admiraltyCode: ['A', 2],
    topics: ['ooda-automation', 'human-loop', 'ai-c2', 'decision-making'],
    keyFindings: [
      'OODA 루프 자동화에서 인간 역할 재확인의 정책적 필요성',
      'AI가 OBSERVE-ORIENT를 가속화하되 DECIDE-ACT는 인간이 유지해야 하는 논거',
      '완전 자동화 OODA의 위험성: 적대적 조작(adversarial manipulation) 취약점',
    ],
    relevanceToOODA: '본 엔진의 설계 철학적 근거 — 인간-기계 OODA 분업의 최적 경계',
  },
  {
    id: 'von-foerster-2003',
    authors: 'von Foerster, H.',
    year: 2003,
    title: 'Understanding Understanding: Essays on Cybernetics and Cognition',
    publisher: 'Springer',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['second-order-cybernetics', 'cognition', 'observer', 'self-reference'],
    keyFindings: [
      '2차 사이버네틱스: 관찰자가 관찰 대상에 포함되는 자기참조적 체계',
      '"관찰하는 체계를 관찰하기" — 메타인지적 편향 감사의 이론적 근거',
      '객관성의 불가능성과 그럼에도 불구한 분석적 엄밀성의 추구',
    ],
    relevanceToOODA: 'CyberneticsEngine 2차 루프의 이론적 기반 — 자기참조적 신뢰도 보정',
  },
  {
    id: 'wiener-1948',
    authors: 'Wiener, N.',
    year: 1948,
    title: 'Cybernetics: Or Control and Communication in the Animal and the Machine',
    publisher: 'MIT Press',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['cybernetics', 'feedback', 'control-theory', 'information'],
    keyFindings: [
      '피드백 루프가 모든 제어 시스템의 기본 메커니즘',
      '정보 엔트로피와 시스템 안정성의 관계 — 엔트로피 감소 = 정보 획득',
      '1차 사이버네틱스: 목표 지향적 피드백에 의한 자동 조절',
    ],
    relevanceToOODA: 'CyberneticsEngine 1차 루프의 이론적 기반 — 피드백 기반 신뢰도 수렴',
  },
  {
    id: 'yarynich-2003',
    authors: 'Yarynich, V.E.',
    year: 2003,
    title: 'C3: Nuclear Command, Control, Cooperation',
    publisher: 'Center for Defense Information',
    url: null,
    admiraltyCode: ['B', 2],
    topics: ['russian-c3', 'perimetr', 'dead-hand', 'nuclear-cooperation'],
    keyFindings: [
      'Perimetr(Dead Hand) 시스템의 내부자 관점 상세 기술',
      '러시아 핵 C3의 이중 체계: 정상/위기 모드 전환 메커니즘',
      '핵 C3 투명성과 협력이 전략적 안정성의 필요조건이라는 주장',
    ],
    relevanceToOODA: 'ORIENT 비교 분석 — 러시아 Dead Hand와 이란 NCA 계승 위기의 구조적 유사성',
  },
  {
    id: 'carnegie-2024',
    authors: 'Carnegie Endowment for International Peace',
    year: 2024,
    title: 'Nuclear Command and Control in the Age of AI',
    publisher: 'Carnegie Endowment',
    url: 'https://carnegieendowment.org/research/2024/01/ai-nuclear-command-control',
    admiraltyCode: ['A', 2],
    topics: ['ai', 'nc3', 'nuclear-modernization', 'risk'],
    keyFindings: [
      'AI가 NC3에 도입될 때의 전략적 위험 평가',
      '조기경보 시스템의 AI 자동화가 오경보 대응 시간을 단축하는 양면성',
      'NC3 현대화에서 AI의 역할과 한계에 대한 정책 권고',
    ],
    relevanceToOODA: 'OBSERVE-ORIENT AI 자동화의 NC3 적용 사례와 위험 요소',
  },
  {
    id: 'hoffman-2009',
    authors: 'Hoffman, F.G.',
    year: 2009,
    title: 'Hybrid Warfare and Challenges',
    publisher: 'Joint Force Quarterly',
    url: null,
    admiraltyCode: ['A', 2],
    topics: ['hybrid-warfare', 'irregular', 'conventional', 'terrorism'],
    keyFindings: [
      '하이브리드 전쟁 개념의 체계적 정의: 재래식+비정규+테러+사이버의 동시 수행',
      '이란-IRGC의 비대칭 전략이 하이브리드 전쟁의 전형적 사례',
      '국가 행위자와 비국가 행위자의 경계 모호화가 OODA 루프를 복잡화',
    ],
    relevanceToOODA: 'ORIENT 위협 평가 — 이란의 하이브리드 전쟁 수행 능력과 OODA 대응 복잡성',
  },
  {
    id: 'rossiyskaya-gazeta-2014',
    authors: 'Rossiyskaya Gazeta',
    year: 2014,
    title: '러시아 핵 전쟁 자동 시스템 보도',
    publisher: 'Rossiyskaya Gazeta',
    url: null,
    admiraltyCode: ['C', 3],
    topics: ['russia', 'dead-hand', 'automated-nuclear', 'media'],
    keyFindings: [
      'Perimetr 시스템의 현대화 및 운용 상태에 대한 러시아 관영매체 보도',
      '핵 자동 보복 시스템의 존재가 억지력 유지의 핵심이라는 러시아 공식 입장',
      '관영매체 특성상 선전적 과장 가능성 내재 (admiralty C3 반영)',
    ],
    relevanceToOODA: 'OBSERVE 정보원 — 러시아 핵 자동화 체계의 공개정보 기반 현황',
  },
  {
    id: 'ryabikhin-2019',
    authors: 'Ryabikhin, L.',
    year: 2019,
    title: 'Russian Nuclear Command, Control, and Communication',
    publisher: 'Nautilus Institute',
    url: 'https://nautilus.org/napsnet/napsnet-special-reports/russian-nuclear-command-control-and-communication/',
    admiraltyCode: ['B', 2],
    topics: ['russian-nc3', 'command-structure', 'kazbek', 'strategic-forces'],
    keyFindings: [
      '러시아 NC3의 3중 구조: Kazbek(핵 가방)-General Staff-전략로켓군',
      '위기 시 NC3 생존성 확보를 위한 다중 경로(airborne, ground, space)',
      'NC3 현대화 프로그램과 AI 통합 전망',
    ],
    relevanceToOODA: 'ORIENT 비교 분석 — 러시아 NC3 구조가 이란 핵 C3 발전 경로의 참조 모델',
  },
];

/**
 * Topic taxonomy for cross-referencing
 */
const TOPIC_TAXONOMY = {
  'ai-c3': 'AI + Nuclear Command/Control/Communications',
  'ooda': 'OODA Loop Theory',
  'cybernetics': 'Cybernetics and Feedback Systems',
  'nuclear-command': 'Nuclear Command Authority',
  'deterrence': 'Deterrence Theory',
  'coercion': 'Coercion and Compellence',
  'selectorate-theory': 'Selectorate Theory / Political Survival',
  'hybrid-warfare': 'Hybrid Warfare',
  'russian-c3': 'Russian NC3 Systems',
  'automated-nuclear': 'Automated Nuclear Systems',
  'second-order-cybernetics': 'Second-Order Cybernetics',
  'game-theory': 'Game Theory and Strategic Interaction',
};

class BibliographyEngine {
  constructor() {
    this.sources = BIBLIOGRAPHY;
    this.taxonomy = TOPIC_TAXONOMY;
  }

  /**
   * Search bibliography by query string (matches against title, topics, keyFindings)
   * @param {string} query - Search query
   * @returns {Array} Matching bibliography entries
   */
  search(query) {
    const q = query.toLowerCase();
    return this.sources.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.topics.some(t => t.includes(q)) ||
      s.keyFindings.some(f => f.toLowerCase().includes(q)) ||
      s.authors.toLowerCase().includes(q)
    );
  }

  /**
   * Get scholarly consensus on a topic across all sources
   * @param {string} topic - Topic key from taxonomy
   * @returns {{ topic, sources, consensus, dissent, evidenceStrength }}
   */
  getConsensus(topic) {
    const relevant = this.sources.filter(s => s.topics.includes(topic));
    if (relevant.length === 0) return { topic, sources: [], consensus: null, dissent: null, evidenceStrength: 0 };

    const allFindings = relevant.flatMap(s => s.keyFindings);
    const avgReliability = relevant.reduce((sum, s) => {
      const reliabilityMap = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2, F: 0.0 };
      return sum + (reliabilityMap[s.admiraltyCode[0]] || 0);
    }, 0) / relevant.length;

    return {
      topic,
      taxonomyLabel: this.taxonomy[topic] || topic,
      sources: relevant.map(s => `${s.authors} (${s.year})`),
      findings: allFindings,
      consensus: allFindings[0], // Primary finding as consensus
      evidenceStrength: Math.min(1.0, avgReliability * (relevant.length / 5)),
      sourceCount: relevant.length,
    };
  }

  /**
   * Enrich evidence with bibliography backing for SAT techniques
   * @param {Array} evidence - Array of { label, description }
   * @returns {Array} Enriched evidence with bibliography citations
   */
  enrichEvidence(evidence) {
    return evidence.map(e => {
      const matches = this.sources.filter(s =>
        s.keyFindings.some(f => {
          const keywords = e.label.toLowerCase().split(/\s+/);
          return keywords.some(k => k.length > 3 && f.toLowerCase().includes(k));
        }) ||
        s.topics.some(t => e.label.toLowerCase().includes(t.replace(/-/g, ' ')))
      );

      return {
        ...e,
        bibliographySupport: matches.map(m => ({
          citation: `${m.authors} (${m.year})`,
          admiralty: `${m.admiraltyCode[0]}${m.admiraltyCode[1]}`,
          relevance: m.relevanceToOODA,
        })),
        evidenceGrade: matches.length >= 3 ? 'STRONG' : matches.length >= 1 ? 'MODERATE' : 'WEAK',
      };
    });
  }

  /**
   * Grade a source using NATO Admiralty Code
   * @param {{ reliability: string, content: number }} source
   * @returns {{ code, label, score }}
   */
  gradeSource(source) {
    const reliabilityMap = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2, F: 0.0 };
    const contentMap = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2, 6: 0.0 };
    const rScore = reliabilityMap[source.reliability] || 0;
    const cScore = contentMap[source.content] || 0;
    return {
      code: `${source.reliability}${source.content}`,
      label: `Source ${source.reliability}, Content ${source.content}`,
      score: (rScore + cScore) / 2,
    };
  }

  /**
   * Build ACH evidence matrix from bibliography for given hypotheses
   * Compatible with SatEngine.ach(hypotheses, evidence)
   * @param {Array<string>} hypotheses - H1, H2, H3, H4 descriptions
   * @returns {Array} Evidence array for SatEngine.ach()
   */
  buildACHEvidence(hypotheses) {
    const evidenceMap = [
      // Evidence items derived from bibliography
      {
        label: 'AI-가속 OODA가 핵 C3 의사결정 압축 유발',
        source: 'Altaf & Javed (2025), Sitaraman (2022)',
        admiralty: 'B2',
        ratings: this._rateAgainstHypotheses(hypotheses, [0, +1, 0, +2]),
      },
      {
        label: '우발적 핵전쟁 구조적 가능성 상시 내재',
        source: 'Blair (1993), GWU NSA (2008)',
        admiralty: 'A1',
        ratings: this._rateAgainstHypotheses(hypotheses, [-1, +2, 0, +1]),
      },
      {
        label: '사이버네틱스 피드백이 ORIENT 적응성 결정',
        source: 'Brehmer (2005), Wiener (1948), von Foerster (2003)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [+1, 0, 0, 0]),
      },
      {
        label: '정권 생존 논리가 합리적 억지 모델 압도',
        source: 'Bueno de Mesquita (2003, 2023)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [-2, +1, +2, +1]),
      },
      {
        label: '강압 vs 억지의 비대칭성 — 이란 강압 제한적 성공',
        source: 'Schelling (1960, 1966)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [+1, -1, -1, +1]),
      },
      {
        label: '자동화 핵 시스템의 강압 신뢰성 역설',
        source: 'Schwartz & Horowitz (2025)',
        admiralty: 'B3',
        ratings: this._rateAgainstHypotheses(hypotheses, [-1, +1, 0, +2]),
      },
      {
        label: '러시아 Dead Hand 선례 — NCA 계승 위기 구조적 유사',
        source: 'Yarynich (2003), Ryabikhin (2019), ELN (2023)',
        admiralty: 'B2',
        ratings: this._rateAgainstHypotheses(hypotheses, [-1, +1, 0, +2]),
      },
      {
        label: '이란 하이브리드 전쟁 수행 — OODA 복잡성 증가',
        source: 'Hoffman (2009)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [-1, +2, 0, 0]),
      },
      {
        label: 'NC3 현대화의 AI 통합 위험과 한계',
        source: 'Carnegie (2024), Critchlow (2006)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [0, +1, 0, +1]),
      },
      {
        label: '하메네이 사망 시 NCA 계승 공백의 전략적 함의',
        source: 'Blair (1993), Yarynich (2003), GWU NSA (2008)',
        admiralty: 'A2',
        ratings: this._rateAgainstHypotheses(hypotheses, [-2, +2, +2, +1]),
      },
    ];

    return evidenceMap;
  }

  /**
   * Rate evidence against hypotheses for ACH matrix
   * @param {Array<string>} hypotheses
   * @param {Array<number>} ratings - [-2=strongly inconsistent, -1=inconsistent, 0=neutral, +1=consistent, +2=strongly consistent]
   * @returns {Object} Ratings map { H1: rating, H2: rating, ... }
   */
  _rateAgainstHypotheses(hypotheses, ratings) {
    const result = {};
    hypotheses.forEach((h, i) => {
      result[`H${i + 1}`] = ratings[i] || 0;
    });
    return result;
  }

  /**
   * Get all sources formatted for citation in intelligence report
   * @returns {string} Formatted bibliography section
   */
  formatCitations() {
    return this.sources
      .sort((a, b) => a.authors.localeCompare(b.authors))
      .map((s, i) => {
        const url = s.url ? ` Available: ${s.url}` : '';
        return `[${i + 1}] ${s.authors} (${s.year}). "${s.title}." ${s.publisher}.${url} [${s.admiraltyCode[0]}${s.admiraltyCode[1]}]`;
      })
      .join('\n');
  }

  /**
   * Get OODA-phase specific sources
   * @param {string} phase - 'observe'|'orient'|'decide'|'act'
   * @returns {Array} Sources relevant to that OODA phase
   */
  getSourcesForPhase(phase) {
    const phaseTopicMap = {
      observe: ['nc3', 'us-nuclear', 'media', 'foia', 'nuclear-authority'],
      orient: ['ai-c3', 'cybernetics', 'second-order-cybernetics', 'selectorate-theory', 'hybrid-warfare', 'russian-c3', 'automated-nuclear'],
      decide: ['deterrence', 'coercion', 'game-theory', 'nuclear-war', 'pre-delegation'],
      act: ['ooda', 'ooda-automation', 'human-loop', 'c2', 'dynamic-ooda'],
    };

    const relevantTopics = phaseTopicMap[phase] || [];
    return this.sources.filter(s =>
      s.topics.some(t => relevantTopics.includes(t))
    );
  }

  /** Get total source count */
  get count() { return this.sources.length; }
}

module.exports = { BibliographyEngine, BIBLIOGRAPHY, TOPIC_TAXONOMY };
