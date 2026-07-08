// ============================================================
// WIDEN — trend-engine.js · Trend signal scoring
// ============================================================

const TrendEngine = {
  buildRecommendations({
    skus = [],
    ingredients = [],
    trendSignals = [],
    trendVerifications = [],
    week = '2026-W27',
    market = 'japan'
  }) {
    return skus.map(sku => {
      const normalized = this.normalizeSkuForTrend(sku);
      const signals = this.findSignalsForSku(normalized, trendSignals, market);
      const verifications = trendVerifications.filter(item =>
        signals.some(signal => signal.id === item.signalId)
      );
      const scoreBreakdown = this.scoreSku(normalized, signals, verifications, ingredients, market);
      const scoreValues = Object.values(scoreBreakdown);
      const trendScore = Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length);
      const missingEvidence = this.findMissingEvidence(signals, verifications);
      const finalRecommendation = this.pickRecommendation(trendScore, missingEvidence, normalized);

      return {
        id: `rec-${week}-${market}-${normalized.id}`,
        week,
        market,
        skuId: normalized.id,
        skuName: normalized.name,
        brand: normalized.brand,
        category: normalized.majorCategory,
        trendScore,
        scoreBreakdown,
        evidenceCount: signals.length,
        verifiedEvidenceCount: verifications.filter(item => item.result === 'confirmed').length,
        missingEvidence,
        finalRecommendation,
        recommendationReason: this.describeRecommendation(normalized, trendScore, signals, finalRecommendation),
        nextAction: signals[0]?.nextVerificationAction || 'Qoo10/Shopee 경쟁 페이지와 오프라인 소싱 근거를 추가 확인'
      };
    }).sort((a, b) => b.trendScore - a.trendScore);
  },

  normalizeSkuForTrend(sku) {
    const ingredientTags = sku.ingredientTags || sku.ingredients || [];
    const majorCategory = ['세럼', '세럼/앰플', '토너', '패드', '에센스'].includes(sku.category)
      ? '스킨케어'
      : sku.category === '선크림'
        ? '선케어'
        : sku.category === '클렌징'
          ? '클렌징/필링'
          : sku.category;

    return { ...sku, ingredientTags, majorCategory };
  },

  findSignalsForSku(sku, trendSignals, market) {
    return trendSignals.filter(signal => {
      const marketMatches = !signal.market || signal.market === market || signal.market === 'global';
      const skuMatches = (signal.relatedSkuIds || []).includes(sku.id)
        || signal.skuName === sku.name
        || signal.brand === sku.brand
        || sku.ingredientTags.includes(signal.ingredient);

      return marketMatches && skuMatches;
    });
  },

  scoreSku(sku, signals, verifications, ingredients, market) {
    const bestEvidence = signals.some(signal => signal.evidenceGrade === 'A') ? 100
      : signals.some(signal => signal.evidenceGrade === 'B') ? 80
      : signals.some(signal => signal.evidenceGrade === 'C') ? 60
      : signals.length ? 40 : 20;
    const verificationScore = verifications.some(item => item.result === 'confirmed') ? 90
      : signals.length ? 55 : 20;
    const ingredientScore = this.scoreIngredients(sku, ingredients, market);
    const competitionScore = Math.max(30, 100 - Number(sku.competitorCount || 0));
    const marginScore = Math.min(95, (parseFloat(sku.estimatedMargin || sku.margin || '0') || 0) * 7);

    return {
      evidence: bestEvidence,
      verification: verificationScore,
      ingredientFit: ingredientScore,
      competition: competitionScore,
      margin: marginScore
    };
  },

  scoreIngredients(sku, ingredients, market) {
    const key = market === 'taiwan' ? 'taiwan' : 'japan';
    const scores = sku.ingredientTags.map(tag => {
      const item = ingredients.find(ing => ing.name === tag || ing.id === tag || ing.fullName?.includes(tag));
      return item?.suitability?.[key] ? item.suitability[key] * 20 : 55;
    });

    return scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : 45;
  },

  findMissingEvidence(signals, verifications) {
    const missing = [];
    if (!signals.length) missing.push('시장 신호 없음');
    if (!signals.some(signal => ['A', 'B'].includes(signal.evidenceGrade))) missing.push('A/B 등급 근거 없음');
    if (!verifications.some(item => item.result === 'confirmed')) missing.push('검증 로그 없음');
    return missing;
  },

  pickRecommendation(trendScore, missingEvidence, sku) {
    if (missingEvidence.includes('A/B 등급 근거 없음') || missingEvidence.includes('검증 로그 없음')) return 'verifyMore';
    if ((sku.estimatedMargin || '').startsWith('5')) return 'watch';
    if (trendScore >= 75) return 'testReady';
    if (trendScore >= 55) return 'watch';
    return 'block';
  },

  describeRecommendation(sku, trendScore, signals, finalRecommendation) {
    const signalText = signals.length ? `${signals.length}개 신호` : '시장 신호 부족';
    const statusText = finalRecommendation === 'testReady' ? '테스트 판매 후보'
      : finalRecommendation === 'verifyMore' ? '근거 추가 확인 필요'
      : '관찰 필요';
    return `${sku.brand || ''} ${sku.name || ''}: ${signalText}, 점수 ${trendScore}점으로 ${statusText}`;
  }
};
