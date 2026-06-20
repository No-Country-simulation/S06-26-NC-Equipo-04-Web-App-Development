import { describe, it, expect, beforeEach } from 'vitest';
import * as onboardingService from '../onboarding.service';

describe('OnboardingService', () => {
  describe('validateRuc', () => {
    it('should return success for known active RUC', async () => {
      const result = await onboardingService.validateRuc('20123456789');
      expect(result.valid).toBe(true);
      expect(result.razonSocial).toBeDefined();
      expect(result.estado).toBe('ACTIVO');
    });

    it('should reject RUC with inactive status', async () => {
      const result = await onboardingService.validateRuc('20999999999');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no activo');
    });

    it('should accept unknown RUCs (simulated as valid)', async () => {
      const result = await onboardingService.validateRuc('20555555555');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateDni', () => {
    it('should return success for valid DNI', async () => {
      const result = await onboardingService.validateDni('12345678');
      expect(result.valid).toBe(true);
      expect(result.nombres).toBeDefined();
    });
  });

  describe('checkOsce', () => {
    it('should return clear for non-inhabilitado', async () => {
      const result = await onboardingService.checkOsce('20123456789');
      expect(result.inhabilitado).toBe(false);
    });

    it('should return blocked for inhabilitado', async () => {
      const result = await onboardingService.checkOsce('20888888888');
      expect(result.inhabilitado).toBe(true);
      expect(result.causal).toBeDefined();
    });
  });

  describe('checkRnp', () => {
    it('should return valid for registered provider', async () => {
      const result = await onboardingService.checkRnp('20123456789');
      expect(result.inscrito).toBe(true);
      expect(result.cmc).toBeGreaterThan(0);
    });
  });

  describe('runFullOnboarding', () => {
    it('should return apto for valid user', async () => {
      const result = await onboardingService.runFullOnboarding('20123456789', '12345678');
      expect(result.isApto).toBe(true);
      expect(result.rucValid).toBe(true);
      expect(result.dniValid).toBe(true);
      expect(result.osceClear).toBe(true);
      expect(result.rnpValid).toBe(true);
    });

    it('should return not apto when RUC is inactive', async () => {
      const result = await onboardingService.runFullOnboarding('20999999999', '12345678');
      expect(result.isApto).toBe(false);
      expect(result.rucValid).toBe(false);
    });
  });
});
