/**
 * Intelligence Report Generator - ICD 203/208 Compliant
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Generates intelligence reports in standard IC formats:
 * - Intelligence Assessment (IA)
 * - Intelligence Memorandum (IM)
 * - Policy Memo
 * - Warning Report
 * - Current Intelligence Brief
 *
 * Compliant with:
 * - ICD 203: Analytic Standards
 * - ICD 208: Write for Maximum Utility
 * - ODNI Style Guide
 * - NATO STANAG 2022 (source grading)
 *
 * References:
 * - "A Tradecraft Primer: Structured Analytic Techniques" (CIA)
 * - FM 2-0: Intelligence (US Army)
 * - JP 2-0: Joint Intelligence
 */
'use strict';

const { CONFIDENCE_LEVELS, SOURCE_RELIABILITY, CONTENT_RATING } = require('./sat-engine');

/**
 * Report types with their standard sections
 */
const REPORT_TYPES = {
  INTELLIGENCE_ASSESSMENT: {
    id: 'IA',
    label: '정보평가서',
    labelEn: 'Intelligence Assessment',
    sections: ['scope_note', 'key_judgments', 'discussion', 'implications', 'outlook', 'sources', 'analytic_confidence', 'sat_applied'],
  },
  INTELLIGENCE_MEMO: {
    id: 'IM',
    label: '정보각서',
    labelEn: 'Intelligence Memorandum',
    sections: ['issue', 'key_findings', 'analysis', 'implications', 'sources', 'analytic_confidence'],
  },
  POLICY_MEMO: {
    id: 'PM',
    label: '정책건의서',
    labelEn: 'Policy Memorandum',
    sections: ['summary', 'background', 'assessment', 'options', 'recommendation', 'risks', 'sources'],
  },
  WARNING_REPORT: {
    id: 'WR',
    label: '경보보고서',
    labelEn: 'Warning Intelligence Report',
    sections: ['warning_summary', 'indicators_triggered', 'threat_assessment', 'timeline', 'recommended_actions', 'collection_priorities'],
  },
  CURRENT_BRIEF: {
    id: 'CB',
    label: '현황브리핑',
    labelEn: 'Current Intelligence Brief',
    sections: ['situation', 'significance', 'outlook', 'sources'],
  },
};

/**
 * ICD 203 required analytic tradecraft elements
 */
const ICD203_ELEMENTS = {
  objectivity: '객관성 — 모든 합리적 대안 가설을 고려했는가',
  independence: '독립성 — 정치적/정책적 영향을 배제했는가',
  timeliness: '적시성 — 보고서가 시의적절한가',
  sourcing: '출처표기 — 핵심 판단의 근거가 명시되었는가',
  uncertainty: '불확실성 — 분석적 신뢰도가 명시되었는가',
  distinction: '구분 — 사실과 판단이 명확히 구분되었는가',
  alternatives: '대안분석 — 경쟁 가설이 검토되었는가',
  relevance: '관련성 — 정보요구에 부합하는가',
  logic: '논리성 — 논거의 흐름이 일관되는가',
};

class IntelReport {
  constructor(options = {}) {
    this.classification = options.classification || 'OPEN SOURCE';
    this.handling = options.handling || 'OSINT';
    this.organization = options.organization || 'MDO Command Center';
    this.icd203Compliance = {};
  }

  /**
   * Generate a complete intelligence report
   * @param {string} type - INTELLIGENCE_ASSESSMENT, POLICY_MEMO, etc.
   * @param {object} content - section content keyed by section name
   * @param {object} metadata - report metadata
   * @returns {object} structured report
   */
  generate(type, content, metadata = {}) {
    const reportType = REPORT_TYPES[type];
    if (!reportType) throw new Error(`Unknown report type: ${type}`);

    const now = new Date();
    const report = {
      // Header block (ICD 208 standard)
      header: {
        type: reportType.id,
        typeName: reportType.label,
        typeNameEn: reportType.labelEn,
        classification: this.classification,
        handling: this.handling,
        serialNumber: `${reportType.id}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        dateTime: now.toISOString(),
        dateTimeKST: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        organization: this.organization,
        title: metadata.title || '제목 미지정',
        subject: metadata.subject || '',
        region: metadata.region || '',
        priority: metadata.priority || 'ROUTINE',
      },

      // Sections
      sections: {},

      // Source appendix (ICD 203 sourcing requirement)
      sources: [],

      // Analytic confidence (ICD 203 uncertainty requirement)
      analyticConfidence: {
        overallConfidence: null,
        confidenceLevel: null,
        basis: [],
        limitations: [],
        gaps: [],
      },

      // SAT techniques applied (ICD 203 alternatives requirement)
      satApplied: [],

      // ICD 203 compliance checklist
      icd203: { ...ICD203_ELEMENTS },

      // Cybernetics metadata
      cyberneticsMetadata: metadata.cybernetics || null,

      // Footer
      footer: {
        dissemination: metadata.dissemination || '공개 배포 가능',
        preparedBy: metadata.analyst || 'MDO OODA Engine',
        reviewedBy: metadata.reviewer || null,
        nextUpdate: metadata.nextUpdate || null,
      },
    };

    // Populate sections
    for (const sectionName of reportType.sections) {
      report.sections[sectionName] = content[sectionName] || null;
    }

    // Populate sources
    if (content.sources) {
      report.sources = content.sources.map((src, i) => ({
        id: `SRC-${i + 1}`,
        ...src,
        admiraltyCode: src.reliability && src.contentRating
          ? `${src.reliability}${src.contentRating}`
          : null,
      }));
    }

    // Populate analytic confidence
    if (content.analytic_confidence) {
      const ac = content.analytic_confidence;
      report.analyticConfidence = {
        overallConfidence: ac.score,
        confidenceLevel: this._confidenceLabel(ac.score),
        basis: ac.basis || [],
        limitations: ac.limitations || [],
        gaps: ac.gaps || [],
      };
    }

    // Populate SAT
    if (content.sat_applied) {
      report.satApplied = content.sat_applied;
    }

    return report;
  }

  /**
   * Format report as plain text (policy memo style)
   * @param {object} report - generated report
   * @returns {string} formatted text
   */
  formatText(report) {
    const lines = [];
    const w = 76;
    const hr = '─'.repeat(w);

    // Classification header
    lines.push(`${'═'.repeat(w)}`);
    lines.push(`${report.header.classification}`.padStart((w + report.header.classification.length) / 2));
    lines.push(`${'═'.repeat(w)}`);
    lines.push('');

    // Report metadata
    lines.push(`문서번호: ${report.header.serialNumber}`);
    lines.push(`유    형: ${report.header.typeName} (${report.header.typeNameEn})`);
    lines.push(`보고일시: ${report.header.dateTimeKST}`);
    lines.push(`작 성 처: ${report.header.organization}`);
    lines.push(`우선순위: ${report.header.priority}`);
    if (report.header.region) lines.push(`관할지역: ${report.header.region}`);
    lines.push('');
    lines.push(hr);
    lines.push(`  ${report.header.title}`);
    if (report.header.subject) lines.push(`  ${report.header.subject}`);
    lines.push(hr);
    lines.push('');

    // Sections
    const SECTION_LABELS = {
      scope_note: '범위 및 방법론 (SCOPE NOTE)',
      key_judgments: '핵심 판단 (KEY JUDGMENTS)',
      discussion: '분석 (DISCUSSION)',
      implications: '함의 (IMPLICATIONS)',
      outlook: '전망 (OUTLOOK)',
      issue: '쟁점 (ISSUE)',
      key_findings: '핵심 발견 (KEY FINDINGS)',
      analysis: '분석 (ANALYSIS)',
      summary: '요약 (EXECUTIVE SUMMARY)',
      background: '배경 (BACKGROUND)',
      assessment: '평가 (ASSESSMENT)',
      options: '정책대안 (OPTIONS)',
      recommendation: '권고 (RECOMMENDATION)',
      risks: '위험요인 (RISKS)',
      warning_summary: '경보 요약 (WARNING)',
      indicators_triggered: '발동 징후 (TRIGGERED INDICATORS)',
      threat_assessment: '위협 평가 (THREAT ASSESSMENT)',
      timeline: '시간표 (TIMELINE)',
      recommended_actions: '권고 조치 (RECOMMENDED ACTIONS)',
      collection_priorities: '수집 우선순위 (COLLECTION PRIORITIES)',
      situation: '현황 (SITUATION)',
      significance: '의미 (SIGNIFICANCE)',
      analytic_confidence: '분석적 신뢰도 (ANALYTIC CONFIDENCE)',
      sat_applied: '적용된 분석기법 (SAT APPLIED)',
      sources: '출처 (SOURCES)',
    };

    for (const [key, value] of Object.entries(report.sections)) {
      if (value === null) continue;
      const label = SECTION_LABELS[key] || key.toUpperCase();
      lines.push(`■ ${label}`);
      lines.push('');
      if (typeof value === 'string') {
        lines.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (typeof item === 'string') {
            lines.push(`  ${i + 1}. ${item}`);
          } else {
            lines.push(`  ${i + 1}. ${JSON.stringify(item)}`);
          }
        });
      } else {
        lines.push(JSON.stringify(value, null, 2));
      }
      lines.push('');
    }

    // Analytic Confidence section
    if (report.analyticConfidence.overallConfidence !== null) {
      lines.push(`■ 분석적 신뢰도 (ANALYTIC CONFIDENCE)`);
      lines.push('');
      lines.push(`  종합 신뢰도: ${report.analyticConfidence.overallConfidence} (${report.analyticConfidence.confidenceLevel})`);
      if (report.analyticConfidence.basis.length) {
        lines.push('  근거:');
        report.analyticConfidence.basis.forEach(b => lines.push(`    - ${b}`));
      }
      if (report.analyticConfidence.limitations.length) {
        lines.push('  제한사항:');
        report.analyticConfidence.limitations.forEach(l => lines.push(`    - ${l}`));
      }
      if (report.analyticConfidence.gaps.length) {
        lines.push('  정보공백:');
        report.analyticConfidence.gaps.forEach(g => lines.push(`    - ${g}`));
      }
      lines.push('');
    }

    // SAT Applied
    if (report.satApplied.length > 0) {
      lines.push(`■ 적용된 구조화분석기법 (SAT APPLIED)`);
      lines.push('');
      report.satApplied.forEach(sat => lines.push(`  - ${sat}`));
      lines.push('');
    }

    // Sources appendix
    if (report.sources.length > 0) {
      lines.push(hr);
      lines.push(`■ 출처 부록 (SOURCE APPENDIX)`);
      lines.push('');
      for (const src of report.sources) {
        const code = src.admiraltyCode ? `[${src.admiraltyCode}]` : '';
        lines.push(`  ${src.id} ${code} ${src.name || src.title || ''}`);
        if (src.url) lines.push(`    URL: ${src.url}`);
        if (src.date) lines.push(`    일자: ${src.date}`);
        lines.push('');
      }
    }

    // Footer
    lines.push(hr);
    lines.push(`작성: ${report.footer.preparedBy}`);
    if (report.footer.reviewedBy) lines.push(`검토: ${report.footer.reviewedBy}`);
    lines.push(`배포: ${report.footer.dissemination}`);
    if (report.footer.nextUpdate) lines.push(`차기갱신: ${report.footer.nextUpdate}`);
    lines.push('');
    lines.push(`${'═'.repeat(w)}`);
    lines.push(`${report.header.classification}`.padStart((w + report.header.classification.length) / 2));
    lines.push(`${'═'.repeat(w)}`);

    return lines.join('\n');
  }

  /** ICD 203 confidence label */
  _confidenceLabel(score) {
    if (score >= 0.90) return '매우높음 (Very High)';
    if (score >= 0.70) return '높음 (High)';
    if (score >= 0.40) return '보통 (Moderate)';
    return '낮음 (Low)';
  }
}

module.exports = { IntelReport, REPORT_TYPES, ICD203_ELEMENTS };
