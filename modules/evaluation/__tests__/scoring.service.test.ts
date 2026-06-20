import { describe, it, expect, beforeEach } from 'vitest';
import * as evaluationService from '../evaluation.service';

describe('ScoringService', () => {
  describe('calculatePriceScore', () => {
    it('should calculate perfect score for lowest price', () => {
      const score = evaluationService.calculatePriceScore(100, 100, 500);
      expect(score).toBe(100);
    });

    it('should calculate 0 score for highest price', () => {
      const score = evaluationService.calculatePriceScore(500, 100, 500);
      expect(score).toBe(0);
    });

    it('should calculate proportional score for middle price', () => {
      const score = evaluationService.calculatePriceScore(300, 100, 500);
      expect(score).toBe(50);
    });

    it('should return 100 when all prices are equal', () => {
      const score = evaluationService.calculatePriceScore(250, 250, 250);
      expect(score).toBe(100);
    });
  });

  describe('calculateExperienceScore', () => {
    it('should return 100 for max experience', () => {
      const score = evaluationService.calculateExperienceScore(10, 10);
      expect(score).toBe(100);
    });

    it('should calculate proportional experience score', () => {
      const score = evaluationService.calculateExperienceScore(3, 10);
      expect(score).toBe(30);
    });

    it('should handle zero max experience', () => {
      const score = evaluationService.calculateExperienceScore(5, 0);
      expect(score).toBe(50);
    });

    it('should cap at 100', () => {
      const score = evaluationService.calculateExperienceScore(15, 10);
      expect(score).toBe(100);
    });
  });

  describe('calculateFinalScore', () => {
    it('should calculate with default weights (0.4 exp, 0.6 price)', () => {
      const final = evaluationService.calculateFinalScore(80, 70, 0.4, 0.6);
      // 80*0.4 + 70*0.6 = 32 + 42 = 74
      expect(final).toBe(74);
    });

    it('should calculate with custom weights', () => {
      const final = evaluationService.calculateFinalScore(100, 50, 0.3, 0.7);
      // 100*0.3 + 50*0.7 = 30 + 35 = 65
      expect(final).toBe(65);
    });

    it('should handle weight experience of 1.0 (only experience matters)', () => {
      const final = evaluationService.calculateFinalScore(90, 10, 1.0, 0.0);
      expect(final).toBe(90);
    });

    it('should handle weight price of 1.0 (only price matters)', () => {
      const final = evaluationService.calculateFinalScore(10, 90, 0.0, 1.0);
      expect(final).toBe(90);
    });
  });

  describe('rankProposals', () => {
    it('should rank proposals by score descending', () => {
      const proposals = [
        { providerId: '1', providerName: 'A', proposalId: 'p1', experienceScore: 80, priceScore: 70, price: 300 },
        { providerId: '2', providerName: 'B', proposalId: 'p2', experienceScore: 60, priceScore: 90, price: 150 },
        { providerId: '3', providerName: 'C', proposalId: 'p3', experienceScore: 90, priceScore: 50, price: 500 },
      ];

      const ranked = evaluationService.rankProposals(proposals, 0.4, 0.6);

      expect(ranked[0].providerId).toBe('2'); // 60*0.4 + 90*0.6 = 78
      expect(ranked[1].providerId).toBe('1'); // 80*0.4 + 70*0.6 = 74
      expect(ranked[2].providerId).toBe('3'); // 90*0.4 + 50*0.6 = 66
      expect(ranked[0].position).toBe(1);
      expect(ranked[1].position).toBe(2);
      expect(ranked[2].position).toBe(3);
    });

    it('should handle single proposal', () => {
      const ranked = evaluationService.rankProposals([
        { providerId: '1', providerName: 'A', proposalId: 'p1', experienceScore: 50, priceScore: 50, price: 1000 }
      ], 0.4, 0.6);

      expect(ranked.length).toBe(1);
      expect(ranked[0].position).toBe(1);
    });

    it('should handle empty proposals', () => {
      const ranked = evaluationService.rankProposals([], 0.4, 0.6);
      expect(ranked.length).toBe(0);
    });

    it('should not modify original data (immutability)', () => {
      const proposals = [
        { providerId: '1', providerName: 'A', proposalId: 'p1', experienceScore: 80, priceScore: 70, price: 300 }
      ];
      const originalPrice = proposals[0].price;

      evaluationService.rankProposals(proposals, 0.4, 0.6);

      expect(proposals[0].price).toBe(originalPrice);
    });
  });
});
