/**
 * SAT Engine - Structured Analytic Techniques
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Implements intelligence community SAT methodologies:
 * - ACH (Analysis of Competing Hypotheses)
 * - Red Teaming
 * - Devil's Advocate
 * - Delphi Method
 * - Counterfactual Thinking
 * - Historical Analogies
 * - Key Assumptions Check
 * - Indicators & Warning (I&W)
 * - Premortem Analysis
 *
 * References:
 * - Richards Heuer, "Psychology of Intelligence Analysis"
 * - Heuer & Pherson, "Structured Analytic Techniques for Intelligence Analysis"
 * - ICD 203 Analytic Standards
 * - CIA Tradecraft Primer
 */
'use strict';

/**
 * ICD 203 Confidence Levels
 * Intelligence Community Directive 203 analytic standards
 */
const CONFIDENCE_LEVELS = {
  LOW:    { range: [0.00, 0.40], label: '낮음', labelEn: 'Low',      icd: 'Low Confidence' },
  MEDIUM: { range: [0.40, 0.70], label: '보통', labelEn: 'Medium',   icd: 'Moderate Confidence' },
  HIGH:   { range: [0.70, 0.90], label: '높음', labelEn: 'High',     icd: 'High Confidence' },
  VERY_HIGH: { range: [0.90, 1.0], label: '매우높음', labelEn: 'Very High', icd: 'Very High Confidence' },
};

/**
 * Source Reliability Ratings (NATO standard)
 * A=Completely Reliable, B=Usually Reliable, C=Fairly Reliable,
 * D=Not Usually Reliable, E=Unreliable, F=Cannot Be Judged
 */
const SOURCE_RELIABILITY = {
  A: { label: '완전신뢰', en: 'Completely Reliable', score: 1.0 },
  B: { label: '대체신뢰', en: 'Usually Reliable', score: 0.8 },
  C: { label: '상당신뢰', en: 'Fairly Reliable', score: 0.6 },
  D: { label: '비신뢰적', en: 'Not Usually Reliable', score: 0.4 },
  E: { label: '비신뢰',   en: 'Unreliable', score: 0.2 },
  F: { label: '판단불가', en: 'Cannot Be Judged', score: 0.0 },
};

/**
 * Information Content Ratings (NATO standard)
 * 1=Confirmed, 2=Probably True, 3=Possibly True,
 * 4=Doubtfully True, 5=Improbable, 6=Cannot Be Judged
 */
const CONTENT_RATING = {
  1: { label: '확인됨',     en: 'Confirmed', score: 1.0 },
  2: { label: '개연성높음', en: 'Probably True', score: 0.8 },
  3: { label: '가능성있음', en: 'Possibly True', score: 0.6 },
  4: { label: '의심됨',     en: 'Doubtfully True', score: 0.4 },
  5: { label: '불가능',     en: 'Improbable', score: 0.2 },
  6: { label: '판단불가',   en: 'Cannot Be Judged', score: 0.0 },
};

/**
 * Words of Estimative Probability (WEP) - Sherman Kent Standard
 * Intelligence Community standard vocabulary for uncertainty expression
 * Reference: Sherman Kent (1964), CIA Guidance (1993)
 */
const WEP = {
  ALMOST_CERTAIN:  { range: [0.93, 1.00], label: '거의 확실', en: 'Almost Certainly', icd: 'Almost Certain' },
  VERY_LIKELY:     { range: [0.80, 0.93], label: '매우 유력', en: 'Very Likely', icd: 'Highly Probable' },
  LIKELY:          { range: [0.55, 0.80], label: '유력',     en: 'Likely', icd: 'Probable' },
  EVEN_CHANCE:     { range: [0.45, 0.55], label: '반반',     en: 'Even Chance', icd: 'About as Likely as Not' },
  UNLIKELY:        { range: [0.20, 0.45], label: '비유력',   en: 'Unlikely', icd: 'Improbable' },
  VERY_UNLIKELY:   { range: [0.07, 0.20], label: '매우비유력', en: 'Very Unlikely', icd: 'Highly Improbable' },
  REMOTE:          { range: [0.00, 0.07], label: '극히희박', en: 'Remote', icd: 'Almost Certainly Not' },
};

/**
 * ICD 203 Nine Analytic Tradecraft Standards
 * Reference: ODNI Intelligence Community Directive 203 (2015)
 */
const ICD203_STANDARDS = {
  SOURCE_QUALITY:      { id: 1, label: '출처품질',   en: 'Source Quality',         check: 'Properly describe quality and credibility of sources' },
  UNCERTAINTY:         { id: 2, label: '불확실성표현', en: 'Uncertainty Expression',  check: 'Express and explain uncertainties with WEP vocabulary' },
  FACT_VS_JUDGMENT:    { id: 3, label: '사실/판단구분', en: 'Fact/Judgment Distinction', check: 'Distinguish between intelligence and assumptions/judgments' },
  ALTERNATIVES:        { id: 4, label: '대안분석',   en: 'Analysis of Alternatives', check: 'Incorporate alternative explanations/outcomes (AoA)' },
  CUSTOMER_RELEVANCE:  { id: 5, label: '고객관련성', en: 'Customer Relevance',       check: 'Demonstrate relevance and address implications' },
  CLEAR_ARGUMENTATION: { id: 6, label: '논리명료성', en: 'Clear Argumentation',      check: 'Use clear and logical argumentation' },
  CHANGE_EXPLANATION:  { id: 7, label: '변화설명',   en: 'Change Explanation',       check: 'Explain change to or consistency of judgments over time' },
  ACCURACY:            { id: 8, label: '정확성',     en: 'Accurate Assessment',      check: 'Make accurate judgments and assessments' },
  EFFECTIVE_VISUALS:   { id: 9, label: '시각효과',   en: 'Effective Visuals',        check: 'Incorporate effective visual information where appropriate' },
};

class SatEngine {
  constructor() {
    this.hypotheses = [];
    this.evidence = [];
    this.assumptions = [];
    this.indicators = [];
    this.techniques = [];
    this.auditLog = [];
    this.priors = {};  // Bayesian prior probabilities per hypothesis
  }

  /**
   * ACH - Analysis of Competing Hypotheses (Heuer)
   * 핵심 SAT: 증거 대 가설 일관성 매트릭스
   * @param {Array<{id, label, description}>} hypotheses
   * @param {Array<{id, description, reliability, contentRating}>} evidence
   * @returns {object} ACH matrix with scores
   */
  ach(hypotheses, evidence) {
    this.hypotheses = hypotheses;
    this.evidence = evidence;

    const matrix = {};
    for (const h of hypotheses) {
      matrix[h.id] = {
        label: h.label,
        scores: {},
        totalConsistent: 0,
        totalInconsistent: 0,
        weightedScore: 0,
      };
    }

    // Build consistency matrix
    for (const e of evidence) {
      const weight = this._evidenceWeight(e);
      for (const h of hypotheses) {
        const consistency = e.consistency?.[h.id] ?? 0; // -1, 0, +1
        matrix[h.id].scores[e.id] = { consistency, weight };
        if (consistency > 0) matrix[h.id].totalConsistent += weight;
        if (consistency < 0) matrix[h.id].totalInconsistent += weight;
        matrix[h.id].weightedScore += consistency * weight;
      }
    }

    // Rank hypotheses (ACH focuses on DISCONFIRMING evidence)
    const ranked = hypotheses
      .map(h => ({
        id: h.id,
        label: h.label,
        score: matrix[h.id].weightedScore,
        inconsistencies: matrix[h.id].totalInconsistent,
      }))
      .sort((a, b) => b.score - a.score);

    this._log('ACH', { hypotheses: hypotheses.length, evidence: evidence.length, winner: ranked[0]?.id });

    return { matrix, ranked, technique: 'ACH' };
  }

  /**
   * Red Team Analysis - 적대적 관점 분석
   * @param {object} assessment - primary assessment
   * @param {string} adversaryPerspective - adversary role description
   * @returns {object} red team challenges
   */
  redTeam(assessment, adversaryPerspective) {
    const challenges = {
      technique: 'Red Team',
      adversary: adversaryPerspective,
      vulnerabilities: [],
      alternativeActions: [],
      deceptionIndicators: [],
      blindSpots: [],
    };

    // Generate red team prompt structure
    challenges.promptTemplate = {
      system: `당신은 ${adversaryPerspective}입니다. 상대방의 분석을 비판적으로 검토하고 약점을 찾으십시오.`,
      questions: [
        '이 평가에서 가장 취약한 가정은 무엇인가?',
        '어떤 대안적 행동이 가능한가?',
        '기만 공작의 징후는 무엇인가?',
        '분석가가 간과한 사각지대는 무엇인가?',
        '이 평가를 무력화할 수 있는 정보는 무엇인가?',
      ],
    };

    this._log('Red Team', { adversary: adversaryPerspective });
    return challenges;
  }

  /**
   * Devil's Advocate - 악마의 변호인
   * @param {object} mainAssessment - primary conclusion
   * @returns {object} counter-arguments structure
   */
  devilsAdvocate(mainAssessment) {
    const counter = {
      technique: "Devil's Advocate",
      mainConclusion: mainAssessment.conclusion,
      counterArguments: [],
      weakAssumptions: [],
      alternativeExplanations: [],
      promptTemplate: {
        system: '당신의 임무는 주어진 결론에 반대하는 가장 강력한 논거를 제시하는 것입니다. 결론이 틀렸다고 가정하고 그 이유를 체계적으로 논증하십시오.',
        structure: [
          '1. 주요 결론의 핵심 가정 나열',
          '2. 각 가정에 대한 반박 근거 제시',
          '3. 대안적 설명 제시',
          '4. 결론을 뒤집을 수 있는 증거 식별',
          '5. 반박의 설득력 자체평가 (0.0-1.0)',
        ],
      },
    };
    this._log("Devil's Advocate", { conclusion: mainAssessment.conclusion?.slice?.(0, 80) });
    return counter;
  }

  /**
   * Counterfactual Thinking - 반사실적 사고
   * @param {string} event - the event that occurred
   * @param {Array<string>} alternatives - what could have happened instead
   * @returns {object} counterfactual analysis structure
   */
  counterfactual(event, alternatives) {
    const analysis = {
      technique: 'Counterfactual Thinking',
      actualEvent: event,
      counterfactuals: alternatives.map((alt, i) => ({
        id: `CF-${i + 1}`,
        scenario: alt,
        probability: null,  // to be filled by GPU inference
        implications: null,
        keyDifference: null,
      })),
      promptTemplate: {
        system: '반사실적 분석을 수행합니다. 실제 발생한 사건 대신 대안 시나리오가 실현되었을 경우의 결과를 추론하십시오.',
        perScenario: '시나리오 "{scenario}": (1) 이 대안의 실현 확률 (2) 파생 결과 (3) 현재 상황과의 핵심 차이점',
      },
    };
    this._log('Counterfactual', { event: event.slice(0, 80), alternatives: alternatives.length });
    return analysis;
  }

  /**
   * Key Assumptions Check - 핵심 가정 점검
   * @param {Array<{assumption, basis, impact}>} assumptions
   * @returns {object} validated assumptions with risk scores
   */
  keyAssumptionsCheck(assumptions) {
    this.assumptions = assumptions;
    const checked = assumptions.map((a, i) => ({
      id: `KA-${i + 1}`,
      assumption: a.assumption,
      basis: a.basis,
      impact: a.impact,
      vulnerability: null,    // HIGH/MEDIUM/LOW - to be assessed
      alternatives: [],       // what if assumption is wrong
      monitoringIndicator: null,
    }));

    this._log('Key Assumptions Check', { count: assumptions.length });
    return { technique: 'Key Assumptions Check', assumptions: checked };
  }

  /**
   * Indicators and Warning (I&W) - 징후 및 경보
   * @param {Array<{indicator, observed, threshold, category}>} indicators
   * @returns {object} I&W assessment
   */
  indicatorsWarning(indicators) {
    this.indicators = indicators;

    const assessed = indicators.map((ind, i) => {
      const triggered = ind.observed >= (ind.threshold ?? 0.5);
      return {
        id: `IW-${i + 1}`,
        indicator: ind.indicator,
        category: ind.category,
        observed: ind.observed,
        threshold: ind.threshold ?? 0.5,
        triggered,
        urgency: triggered ? (ind.observed >= 0.8 ? 'CRITICAL' : 'WARNING') : 'NORMAL',
      };
    });

    const triggeredCount = assessed.filter(a => a.triggered).length;
    const warningLevel = triggeredCount / assessed.length;

    this._log('I&W', { total: indicators.length, triggered: triggeredCount });
    return {
      technique: 'Indicators & Warning',
      indicators: assessed,
      triggeredCount,
      warningLevel,
      overallStatus: warningLevel >= 0.6 ? 'CRITICAL' : warningLevel >= 0.3 ? 'ELEVATED' : 'NORMAL',
    };
  }

  /**
   * Premortem Analysis - 사전부검 분석
   * "가정: 우리의 분석이 완전히 틀렸다. 왜 틀렸는가?"
   * @param {object} assessment
   * @returns {object} premortem structure
   */
  premortem(assessment) {
    const result = {
      technique: 'Premortem Analysis',
      premise: '이 평가가 완전히 잘못되었다고 가정합니다.',
      promptTemplate: {
        system: '사전부검 분석: 주어진 평가가 6개월 후 완전히 틀린 것으로 판명되었습니다. 왜 틀렸는지 사후적으로 분석하십시오.',
        questions: [
          '어떤 핵심 가정이 잘못되었는가?',
          '어떤 정보를 간과했는가?',
          '어떤 편향이 판단을 왜곡했는가?',
          '어떤 외부 요인이 예상을 뒤집었는가?',
          '이 실패를 방지하기 위해 무엇을 할 수 있었는가?',
        ],
      },
      assessment: assessment,
    };
    this._log('Premortem Analysis', { conclusion: assessment?.conclusion?.slice?.(0, 80) });
    return result;
  }

  /**
   * Historical Analogy - 역사적 유비추론
   * @param {string} currentSituation
   * @param {Array<{event, year, similarity, outcome}>} analogies
   * @returns {object} analogy assessment
   */
  historicalAnalogy(currentSituation, analogies) {
    const assessed = analogies.map((a, i) => ({
      id: `HA-${i + 1}`,
      event: a.event,
      year: a.year,
      similarity: a.similarity,
      outcome: a.outcome,
      applicability: null,   // to be scored
      limitations: [],       // key differences
    }));

    this._log('Historical Analogy', { situation: currentSituation.slice(0, 80), analogies: analogies.length });
    return { technique: 'Historical Analogy', situation: currentSituation, analogies: assessed };
  }

  /**
   * Delphi Method - 다수 모델 합의 도출
   * GPU 다중 추론과 결합하여 사용
   * @param {string} question
   * @param {number} rounds - iteration rounds
   * @returns {object} Delphi structure
   */
  delphi(question, rounds = 3) {
    return {
      technique: 'Delphi Method',
      question,
      rounds,
      currentRound: 0,
      responses: [],
      consensus: null,
      convergenceHistory: [],
      promptTemplate: {
        round1: `독립적으로 다음 질문에 답하십시오: "${question}". 확률과 근거를 제시하십시오.`,
        roundN: '이전 라운드의 다른 전문가 의견을 참고하여 답변을 수정하거나 유지하십시오. 변경 이유를 설명하십시오.',
        final: '최종 합의를 도출하십시오. 합의 도달 여부와 잔여 불일치를 보고하십시오.',
      },
    };
  }

  /**
   * 신뢰도 수준 결정 (ICD 203 기준)
   * @param {number} score 0.0-1.0
   * @returns {object} confidence level
   */
  confidenceLevel(score) {
    for (const [key, level] of Object.entries(CONFIDENCE_LEVELS)) {
      if (score >= level.range[0] && score < level.range[1]) {
        return { level: key, ...level, score };
      }
    }
    return { level: 'VERY_HIGH', ...CONFIDENCE_LEVELS.VERY_HIGH, score };
  }

  /**
   * 출처 신뢰도 결합 평가
   * @param {string} sourceRating A-F
   * @param {number} contentRating 1-6
   * @returns {object} combined rating
   */
  sourceAssessment(sourceRating, contentRating) {
    const src = SOURCE_RELIABILITY[sourceRating] || SOURCE_RELIABILITY.F;
    const cnt = CONTENT_RATING[contentRating] || CONTENT_RATING[6];
    const combined = (src.score + cnt.score) / 2;
    return {
      sourceReliability: src,
      contentRating: cnt,
      combinedScore: combined,
      admiraltyCode: `${sourceRating}${contentRating}`,
      confidence: this.confidenceLevel(combined),
    };
  }

  /** Calculate evidence weight based on source and content ratings */
  _evidenceWeight(evidence) {
    const srcScore = SOURCE_RELIABILITY[evidence.reliability]?.score ?? 0.5;
    const cntScore = CONTENT_RATING[evidence.contentRating]?.score ?? 0.5;
    return (srcScore + cntScore) / 2;
  }

  /**
   * Bayesian Confidence Update - P(H|D) ∝ P(D|H)·P(H)
   * Applies Bayes' theorem to update hypothesis probabilities given new evidence.
   * @param {Array<{id, prior}>} hypotheses - each with prior probability
   * @param {Array<{id, likelihoods: {H1: 0.9, H2: 0.3, ...}}>} evidence
   * @returns {object} posterior probabilities per hypothesis
   */
  bayesianUpdate(hypotheses, evidence) {
    // Initialize priors
    const posteriors = {};
    for (const h of hypotheses) {
      posteriors[h.id] = { prior: h.prior, posterior: h.prior, label: h.label };
    }

    // Sequential Bayesian update for each piece of evidence
    for (const e of evidence) {
      // Calculate P(D) = Σ P(D|Hi)·P(Hi) for normalization
      let pD = 0;
      for (const h of hypotheses) {
        const likelihood = e.likelihoods?.[h.id] ?? 0.5;
        pD += likelihood * posteriors[h.id].posterior;
      }
      if (pD === 0) pD = 1e-10; // prevent division by zero

      // Update each posterior: P(H|D) = P(D|H)·P(H) / P(D)
      for (const h of hypotheses) {
        const likelihood = e.likelihoods?.[h.id] ?? 0.5;
        posteriors[h.id].posterior = (likelihood * posteriors[h.id].posterior) / pD;
      }
    }

    // Rank by posterior probability
    const ranked = hypotheses
      .map(h => ({
        id: h.id,
        label: h.label || h.id,
        prior: h.prior,
        posterior: posteriors[h.id].posterior,
        delta: posteriors[h.id].posterior - h.prior,
      }))
      .sort((a, b) => b.posterior - a.posterior);

    this._log('Bayesian Update', {
      hypotheses: hypotheses.length,
      evidence: evidence.length,
      winner: ranked[0]?.id,
      winnerPosterior: ranked[0]?.posterior,
    });

    return { technique: 'Bayesian Update', posteriors, ranked };
  }

  /**
   * Words of Estimative Probability (WEP) 매핑
   * @param {number} probability 0.0-1.0
   * @returns {object} WEP label matching the probability
   */
  wep(probability) {
    for (const [key, level] of Object.entries(WEP)) {
      if (probability >= level.range[0] && probability < level.range[1]) {
        return { level: key, ...level, probability };
      }
    }
    return { level: 'ALMOST_CERTAIN', ...WEP.ALMOST_CERTAIN, probability };
  }

  /**
   * ICD 203 Compliance Validator
   * Checks an intelligence product against all 9 analytic tradecraft standards.
   * @param {object} product - structured report object
   * @returns {object} compliance report with pass/fail per standard
   */
  validateIcd203(product) {
    const results = {};
    let passed = 0;
    let total = 0;

    for (const [key, standard] of Object.entries(ICD203_STANDARDS)) {
      total++;
      const check = this._checkStandard(key, product);
      results[key] = { ...standard, passed: check.passed, evidence: check.evidence };
      if (check.passed) passed++;
    }

    const score = total > 0 ? passed / total : 0;
    this._log('ICD 203 Validation', { passed, total, score });

    return {
      technique: 'ICD 203 Validation',
      standards: results,
      passed,
      total,
      score,
      compliant: score >= 0.78,  // 7/9 minimum for compliance
      confidenceLevel: this.confidenceLevel(score),
    };
  }

  /** Check individual ICD 203 standard */
  _checkStandard(key, product) {
    const checks = {
      SOURCE_QUALITY: () => {
        const hasSources = product.sources?.length > 0;
        const hasGrades = product.sources?.some(s => s.reliability || s.admiraltyCode);
        return { passed: hasSources && hasGrades, evidence: hasSources ? `${product.sources.length} sources graded` : 'No sources' };
      },
      UNCERTAINTY: () => {
        const hasConfidence = product.analyticConfidence?.overallConfidence != null;
        return { passed: hasConfidence, evidence: hasConfidence ? `Confidence: ${product.analyticConfidence.overallConfidence}` : 'No uncertainty expression' };
      },
      FACT_VS_JUDGMENT: () => {
        const hasJudgments = product.sections?.key_judgments || product.sections?.key_findings;
        const hasDiscussion = product.sections?.discussion || product.sections?.analysis;
        return { passed: !!(hasJudgments && hasDiscussion), evidence: hasJudgments ? 'Judgments separated from discussion' : 'No separation' };
      },
      ALTERNATIVES: () => {
        const hasSat = product.satApplied?.length > 0;
        const hasAch = product.satApplied?.includes('ACH');
        return { passed: hasSat, evidence: hasSat ? `SAT: ${product.satApplied.join(', ')}` : 'No alternatives analysis' };
      },
      CUSTOMER_RELEVANCE: () => {
        const hasImplications = product.sections?.implications || product.sections?.significance;
        return { passed: !!hasImplications, evidence: hasImplications ? 'Implications present' : 'No implications section' };
      },
      CLEAR_ARGUMENTATION: () => {
        const hasStructure = Object.values(product.sections || {}).filter(v => v !== null).length >= 3;
        return { passed: hasStructure, evidence: `${Object.values(product.sections || {}).filter(v => v !== null).length} sections populated` };
      },
      CHANGE_EXPLANATION: () => {
        const hasCybernetics = !!product.cyberneticsMetadata;
        return { passed: hasCybernetics, evidence: hasCybernetics ? 'Cybernetics metadata present' : 'No change tracking' };
      },
      ACCURACY: () => {
        // Accuracy requires external verification — mark as passed if confidence > 0.7
        const conf = product.analyticConfidence?.overallConfidence || 0;
        return { passed: conf >= 0.7, evidence: `Confidence ${conf} ${conf >= 0.7 ? '>=' : '<'} 0.7 threshold` };
      },
      EFFECTIVE_VISUALS: () => {
        // Visual check is optional for text products
        return { passed: true, evidence: 'Text product — visual standard waived' };
      },
    };

    const checker = checks[key];
    return checker ? checker() : { passed: false, evidence: 'Unknown standard' };
  }

  /**
   * Shannon Entropy calculation for information content
   * @param {number} p - probability 0.0-1.0
   * @returns {number} entropy in bits
   */
  shannonEntropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  }

  /**
   * Quadrant Crunching - 2×2 매트릭스 분석
   * @param {string} axisX - horizontal axis label
   * @param {string} axisY - vertical axis label
   * @param {object} quadrants - { HH, HL, LH, LL } scenarios
   * @returns {object} quadrant analysis
   */
  quadrantCrunching(axisX, axisY, quadrants) {
    const analysis = {
      technique: 'Quadrant Crunching',
      axes: { x: axisX, y: axisY },
      quadrants: {
        HH: { label: `High ${axisX} / High ${axisY}`, ...quadrants.HH },
        HL: { label: `High ${axisX} / Low ${axisY}`, ...quadrants.HL },
        LH: { label: `Low ${axisX} / High ${axisY}`, ...quadrants.LH },
        LL: { label: `Low ${axisX} / Low ${axisY}`, ...quadrants.LL },
      },
    };
    this._log('Quadrant Crunching', { axisX, axisY });
    return analysis;
  }


  /**
   * SIGINT Cross-Validation — 다중출처 SIGINT 교차검증
   * 복수 SIGINT/OSINT 플랫폼의 데이터를 교차검증하여 신뢰도 평가
   * @param {Array} sources - Array of { id, claim, platform, admiraltyCode }
   * @returns {object} Cross-validation result
   */
  sigintCrossValidation(sources) {
    const n = sources.length;
    const claims = {};
    // Group by claim
    sources.forEach(s => {
      const key = s.claim;
      if (!claims[key]) claims[key] = [];
      claims[key].push(s);
    });
    const validations = Object.entries(claims).map(([claim, srcs]) => {
      const corroboration = srcs.length;
      const platforms = [...new Set(srcs.map(s => s.platform))];
      const avgReliability = srcs.reduce((sum, s) => {
        const scores = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2, F: 0.3 };
        return sum + (scores[s.admiraltyCode?.[0]] || 0.5);
      }, 0) / srcs.length;
      return {
        claim,
        corroboration,
        platforms,
        platformDiversity: platforms.length,
        avgReliability: parseFloat(avgReliability.toFixed(2)),
        confidence: corroboration >= 3 ? 'HIGH' : corroboration >= 2 ? 'MODERATE' : 'LOW',
        singleSource: corroboration === 1,
      };
    });
    this._log('SIGINT Cross-Validation', { totalSources: n, totalClaims: validations.length });
    return {
      technique: 'SIGINT Cross-Validation',
      totalSources: n,
      validations,
      highConfidence: validations.filter(v => v.confidence === 'HIGH'),
      singleSourceWarnings: validations.filter(v => v.singleSource),
    };
  }

  /**
   * ADS-B Pattern Analysis — ADS-B 항공기 패턴 기반 조기경보 평가
   * 탱커 서지, 핵 C3 상승, ISR 궤도 패턴 분석
   * @param {Array} indicators - Array of { type, status, significance }
   * @returns {object} Pattern assessment
   */
  adsbPatternAnalysis(indicators) {
    const warningMap = {
      'Tanker': { weight: 0.9, warningHours: 4, category: 'STRIKE_PREP' },
      'TACAMO': { weight: 1.0, warningHours: 0, category: 'NUCLEAR_C3' },
      'Rivet Joint': { weight: 0.7, warningHours: 12, category: 'SIGINT_COLLECTION' },
      'Global Hawk': { weight: 0.8, warningHours: 24, category: 'ISR_PERSISTENCE' },
      'AWACS': { weight: 0.8, warningHours: 6, category: 'AIR_BATTLE_MGMT' },
      'Bomber': { weight: 0.95, warningHours: 2, category: 'STRIKE_IMMINENT' },
      'VIP': { weight: 0.6, warningHours: 48, category: 'LEADERSHIP_MOVEMENT' },
    };
    const patterns = indicators.map(ind => {
      const matchKey = Object.keys(warningMap).find(k => ind.type.includes(k));
      const match = matchKey ? warningMap[matchKey] : { weight: 0.5, warningHours: 24, category: 'UNKNOWN' };
      const isActive = /ACTIVE|ON STATION|SURGE|DETECTED|ELEVATED/i.test(ind.status);
      return {
        type: ind.type,
        status: ind.status,
        category: match.category,
        warningWeight: isActive ? match.weight : match.weight * 0.3,
        warningHours: isActive ? match.warningHours : null,
        isActive,
      };
    });
    const overallWeight = patterns.reduce((s, p) => s + p.warningWeight, 0) / patterns.length;
    const nuclearC3 = patterns.find(p => p.category === 'NUCLEAR_C3' && p.isActive);
    const strikePrep = patterns.filter(p => (p.category === 'STRIKE_PREP' || p.category === 'STRIKE_IMMINENT') && p.isActive);
    this._log('ADS-B Pattern Analysis', { patterns: patterns.length, overallWeight: overallWeight.toFixed(2) });
    return {
      technique: 'ADS-B Pattern Analysis',
      patterns,
      overallWarningLevel: overallWeight >= 0.8 ? 'CRITICAL' : overallWeight >= 0.6 ? 'HIGH' : overallWeight >= 0.4 ? 'ELEVATED' : 'NORMAL',
      overallWeight: parseFloat(overallWeight.toFixed(2)),
      nuclearC3Elevated: !!nuclearC3,
      strikePrepActive: strikePrep.length > 0,
      shortestWarning: patterns.filter(p => p.isActive && p.warningHours !== null)
        .sort((a, b) => a.warningHours - b.warningHours)[0]?.warningHours ?? null,
    };
  }

  /** Audit log */
  _log(technique, data) {
    this.auditLog.push({ technique, data, at: new Date().toISOString() });
    this.techniques.push(technique);
  }

  /** Get all techniques applied in this session */
  appliedTechniques() {
    return [...new Set(this.techniques)];
  }

  /** Get audit trail */
  audit() {
    return [...this.auditLog];
  }
}

module.exports = {
  SatEngine,
  CONFIDENCE_LEVELS,
  SOURCE_RELIABILITY,
  CONTENT_RATING,
  WEP,
  ICD203_STANDARDS,
};
