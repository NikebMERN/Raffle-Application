import { describe, it, expect } from 'vitest';

const INELIGIBLE = ['CANCELLED', 'LOST', 'RETURNED', 'VOIDED'];

function isEligibleForDraw(status: string): boolean {
  return status === 'SOLD';
}

describe('Draw Eligibility', () => {
  it('only SOLD tickets are eligible', () => {
    expect(isEligibleForDraw('SOLD')).toBe(true);
  });

  it('excludes cancelled tickets', () => {
    expect(isEligibleForDraw('CANCELLED')).toBe(false);
  });

  it('excludes lost tickets', () => {
    expect(isEligibleForDraw('LOST')).toBe(false);
  });

  it('excludes returned tickets', () => {
    expect(isEligibleForDraw('RETURNED')).toBe(false);
  });

  it('excludes voided tickets', () => {
    expect(isEligibleForDraw('VOIDED')).toBe(false);
  });

  it('excludes unsold and assigned tickets', () => {
    expect(isEligibleForDraw('UNSOLD')).toBe(false);
    expect(isEligibleForDraw('ASSIGNED')).toBe(false);
  });

  it('all ineligible statuses are excluded', () => {
    for (const status of INELIGIBLE) {
      expect(isEligibleForDraw(status)).toBe(false);
    }
  });
});

describe('Wallet Ledger', () => {
  function calculateBalance(transactions: { type: string; amount: number }[]): number {
    return transactions.reduce((balance, t) => {
      return t.type === 'CREDIT' ? balance + t.amount : balance - t.amount;
    }, 0);
  }

  it('calculates balance from credits and debits', () => {
    const txs = [
      { type: 'CREDIT', amount: 100 },
      { type: 'DEBIT', amount: 30 },
      { type: 'CREDIT', amount: 50 },
      { type: 'DEBIT', amount: 20 },
    ];
    expect(calculateBalance(txs)).toBe(100);
  });

  it('starts at zero with no transactions', () => {
    expect(calculateBalance([])).toBe(0);
  });
});

describe('Commission Calculation', () => {
  function calculateCommission(moneyCollected: number, rate = 0.1) {
    const commission = moneyCollected * rate;
    return { commission, netRemittance: moneyCollected - commission };
  }

  it('calculates 10% commission', () => {
    const result = calculateCommission(1000);
    expect(result.commission).toBe(100);
    expect(result.netRemittance).toBe(900);
  });

  it('handles zero collection', () => {
    const result = calculateCommission(0);
    expect(result.commission).toBe(0);
    expect(result.netRemittance).toBe(0);
  });
});

describe('Seller Performance', () => {
  function calculatePerformance(sold: number, assigned: number): number {
    return assigned > 0 ? (sold / assigned) * 100 : 0;
  }

  it('calculates performance percentage', () => {
    expect(calculatePerformance(25, 50)).toBe(50);
  });

  it('returns zero when no tickets assigned', () => {
    expect(calculatePerformance(0, 0)).toBe(0);
  });
});
