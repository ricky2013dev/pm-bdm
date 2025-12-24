// Service for Stedi API integration

export interface Subscriber {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
}

export interface Provider {
  npi: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
}

export interface ProcedureBenefit {
  code: string;
  description: string;
  category: string;
  benefit: any;
}

export interface DentalBenefitsResponse {
  success: boolean;
  data?: {
    general: any;
    procedures: ProcedureBenefit[];
  };
  error?: string;
}

class StediService {
  private backendUrl: string;

  constructor() {
    // Use backend proxy server instead of calling Stedi directly
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  }

  /**
   * Check dental benefits for a subscriber via backend proxy
   * POST /api/stedi/dental-benefits
   */
  async checkDentalBenefits(
    subscriber: Subscriber,
    provider: Provider
  ): Promise<DentalBenefitsResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/stedi/dental-benefits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriber, provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to check dental benefits: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error checking dental benefits:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const stediService = new StediService();
export default stediService;
