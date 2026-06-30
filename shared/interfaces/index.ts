// ========== ENUMS ==========
export type UserRole = 'ENTE_PUBLICO' | 'PROVEEDOR' | 'ADMIN';
export type ProviderStatus = 'REGISTRADO' | 'EN_VERIFICACION' | 'VALIDADO' | 'RECHAZADO' | 'SUSPENDIDO';
export type TenderStatus = 'BORRADOR' | 'PUBLICADA' | 'CERRADA';
export type ProposalStatus = 'BORRADOR' | 'VALIDADO_CON_ALERTAS' | 'VALIDADO_COMPLETO' | 'ENVIADO' | 'DESCALIFICADA' | 'ADJUDICADA';
export type TenderStageType = 'CONVOCATORIA' | 'CONSULTAS' | 'POSTULACION' | 'EVALUACION' | 'RESULTADOS';
export type DocumentType = 'BASE' | 'TDR' | 'ADICIONAL';
export type ContractStatus = 'BORRADOR' | 'ACTIVO' | 'FINALIZADO' | 'RESUELTO';

// ========== USER ==========
export interface User {
  id: string;
  name: string;
  email: string;
  ruc: string;
  dni?: string;
  role: UserRole;
  providerStatus?: ProviderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  ruc: string;
  dni: string;
  password: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ========== TENDER ==========
export interface Tender {
  id: string;
  title: string;
  description?: string;
  state: TenderStatus;
  rules: TenderRules;
  stateEntityId: string;
  entityName?: string;
  createdAt: string;
  updatedAt: string;
  stages?: TenderStage[];
  requirements?: TenderRequirement[];
  documents?: TenderDocument[];
}

export interface TenderRules {
  weightExperience?: number;
  weightPrice?: number;
  maxYearsExperience?: number;
}

export interface CreateTenderDTO {
  title: string;
  description?: string;
  rules?: TenderRules;
}

export interface UpdateTenderDTO {
  title?: string;
  description?: string;
  rules?: TenderRules;
}

// ========== TENDER STAGES ==========
export interface TenderStage {
  id: string;
  tenderId: string;
  stageType: TenderStageType;
  name: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

export interface CreateStageDTO {
  stageType: TenderStageType;
  name: string;
  startDate: string;
  endDate: string;
}

// ========== TENDER REQUIREMENTS ==========
export interface TenderRequirement {
  id: string;
  tenderId: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface CreateRequirementDTO {
  name: string;
  description?: string;
}

// ========== DOCUMENTS ==========
export interface TenderDocument {
  id: string;
  tenderId: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  createdAt: string;
}

// ========== PROPOSAL ==========
export interface Proposal {
  id: string;
  state: ProposalStatus;
  answerFile?: any;
  tenderId: string;
  providerId: string;
  providerName?: string;
  score?: number;
  scoreExperience?: number;
  scorePrice?: number;
  price: number;
  submittedAt?: string;
  awardReason?: string;
  documents?: ProposalDocument[];
}

export interface ProposalDocument {
  id: string;
  proposalId: string;
  requirementId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

// ========== EVALUATION ==========
export interface ProviderRanking {
  position: number;
  providerId: string;
  providerName: string;
  proposalId: string;
  totalScore: number;
  scoreExperience: number;
  scorePrice: number;
  price: number;
}

export interface EvaluationResult {
  tenderId: string;
  evaluatedProposals: number;
  ranking: ProviderRanking[];
}

// ========== AUDIT ==========
export interface Audit {
  id: string;
  proposalId: string;
  isValid: boolean;
  reportFile?: any;
  createdAt: string;
  updatedAt: string;
}

// ========== PAGINATION ==========
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== API RESPONSE ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ========== ONBOARDING ==========
export interface OnboardingResult {
  rucValid: boolean;
  dniValid: boolean;
  osceClear: boolean;
  rnpValid: boolean;
  rucDetail?: string;
  dniDetail?: string;
  osceDetail?: string;
  rnpDetail?: string;
  isApto: boolean;
}

// ========== SEARCH ==========
export interface SearchFilters {
  q?: string;
  entity?: string;
  from?: string;
  to?: string;
  state?: TenderStatus;
  page?: number;
  limit?: number;
}

// ========== AUTH MIDDLEWARE ==========
export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
  ruc: string;
  name: string;
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
