import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API S26-06',
      version: '1.0.0',
      description:
        'Plataforma GovTech para Licitaciones Peruanas\n\n' +
        'API REST para la gestión de licitaciones públicas, propuestas de proveedores, ' +
        'evaluaciones y procesos de onboarding/verificación.',
      contact: {
        name: 'Equipo S26-06',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Servidor de desarrollo local',
      },
    ],
    tags: [
      { name: 'Health', description: 'Verificación del estado del servidor' },
      { name: 'Auth', description: 'Autenticación y registro de usuarios' },
      { name: 'Onboarding', description: 'Validación y verificación de proveedores (RUC, DNI, OSCE, RNP)' },
      { name: 'Tenders', description: 'Gestión de licitaciones públicas' },
      { name: 'Tender Stages', description: 'Etapas de una licitación (convocatoria, consultas, postulación, etc.)' },
      { name: 'Tender Requirements', description: 'Requisitos documentarios de una licitación' },
      { name: 'Tender Documents', description: 'Documentos asociados a una licitación (bases, TDR, adicionales)' },
      { name: 'Proposals', description: 'Propuestas de proveedores para una licitación' },
      { name: 'Evaluation', description: 'Evaluación, ranking y adjudicación de propuestas' },
      { name: 'Search', description: 'Búsqueda y sugerencias de licitaciones' },
      { name: 'Users', description: 'Gestión de perfiles de usuario' },
      { name: 'Audits', description: 'Auditoría y verificación de propuestas' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT obtenido al iniciar sesión',
        },
      },
      schemas: {
        // ──────────────────────────────────────────────
        //  AUTH SCHEMAS
        // ──────────────────────────────────────────────
        RegisterDTO: {
          type: 'object',
          required: ['name', 'email', 'ruc', 'dni', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            ruc: { type: 'string', example: '12345678901' },
            dni: { type: 'string', example: '12345678' },
            password: { type: 'string', format: 'password', example: 'password123' },
            role: { type: 'string', enum: ['ENTE_PUBLICO', 'PROVEEDOR'], example: 'PROVEEDOR' },
          },
        },
        LoginDTO: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
            message: { type: 'string', example: 'Inicio de sesión exitoso' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            ruc: { type: 'string', example: '12345678901' },
            dni: { type: 'string', example: '12345678' },
            role: { type: 'string', enum: ['ENTE_PUBLICO', 'PROVEEDOR', 'ADMIN'] },
            providerStatus: { type: 'string', enum: ['REGISTRADO', 'EN_VERIFICACION', 'VALIDADO', 'RECHAZADO', 'SUSPENDIDO'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ──────────────────────────────────────────────
        //  TENDER SCHEMAS
        // ──────────────────────────────────────────────
        CreateTenderDTO: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Consultoría para implementación de sistema de gestión documental' },
            description: { type: 'string', example: 'Se requiere contratar una consultoría para...' },
            rules: {
              type: 'object',
              properties: {
                weightExperience: { type: 'number', example: 0.6 },
                weightPrice: { type: 'number', example: 0.4 },
                maxYearsExperience: { type: 'integer', example: 10 },
              },
            },
          },
        },
        UpdateTenderDTO: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Consultoría actualizada' },
            description: { type: 'string', example: 'Nueva descripción...' },
            rules: {
              type: 'object',
              properties: {
                weightExperience: { type: 'number', example: 0.7 },
                weightPrice: { type: 'number', example: 0.3 },
                maxYearsExperience: { type: 'integer', example: 15 },
              },
            },
          },
        },
        Tender: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            state: { type: 'string', enum: ['BORRADOR', 'PUBLICADA', 'CERRADA'] },
            rules: {
              type: 'object',
              properties: {
                weightExperience: { type: 'number' },
                weightPrice: { type: 'number' },
                maxYearsExperience: { type: 'integer' },
              },
            },
            stateEntityId: { type: 'string', format: 'uuid' },
            entityName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            stages: {
              type: 'array',
              items: { $ref: '#/components/schemas/TenderStage' },
            },
            requirements: {
              type: 'array',
              items: { $ref: '#/components/schemas/TenderRequirement' },
            },
            documents: {
              type: 'array',
              items: { $ref: '#/components/schemas/TenderDocument' },
            },
          },
        },
        TenderListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Tender' },
            },
            total: { type: 'integer', example: 50 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // ──────────────────────────────────────────────
        //  TENDER STAGE SCHEMAS
        // ──────────────────────────────────────────────
        CreateStageDTO: {
          type: 'object',
          required: ['stageType', 'name', 'startDate', 'endDate'],
          properties: {
            stageType: {
              type: 'string',
              enum: ['CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS'],
              example: 'CONVOCATORIA',
            },
            name: { type: 'string', example: 'Convocatoria Pública' },
            startDate: { type: 'string', format: 'date-time', example: '2026-07-01T00:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2026-07-15T23:59:59Z' },
          },
        },
        TenderStage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenderId: { type: 'string', format: 'uuid' },
            stageType: { type: 'string', enum: ['CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS'] },
            name: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            sortOrder: { type: 'integer' },
          },
        },

        // ──────────────────────────────────────────────
        //  TENDER REQUIREMENT SCHEMAS
        // ──────────────────────────────────────────────
        CreateRequirementDTO: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Copia del RUC vigente' },
            description: { type: 'string', example: 'Copia simple del RUC con vigencia no mayor a 30 días' },
          },
        },
        TenderRequirement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenderId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            sortOrder: { type: 'integer' },
          },
        },

        // ──────────────────────────────────────────────
        //  TENDER DOCUMENT SCHEMAS
        // ──────────────────────────────────────────────
        TenderDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenderId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            filePath: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'integer' },
            documentType: { type: 'string', enum: ['BASE', 'TDR', 'ADICIONAL'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ──────────────────────────────────────────────
        //  PROPOSAL SCHEMAS
        // ──────────────────────────────────────────────
        Proposal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            state: {
              type: 'string',
              enum: ['BORRADOR', 'VALIDADO_CON_ALERTAS', 'VALIDADO_COMPLETO', 'ENVIADO', 'DESCALIFICADA', 'ADJUDICADA'],
            },
            answerFile: { type: 'object' },
            tenderId: { type: 'string', format: 'uuid' },
            providerId: { type: 'string', format: 'uuid' },
            providerName: { type: 'string' },
            score: { type: 'number' },
            scoreExperience: { type: 'number' },
            scorePrice: { type: 'number' },
            price: { type: 'number', example: 150000 },
            submittedAt: { type: 'string', format: 'date-time' },
            awardReason: { type: 'string' },
            documents: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProposalDocument' },
            },
          },
        },
        ProposalDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            proposalId: { type: 'string', format: 'uuid' },
            requirementId: { type: 'string', format: 'uuid' },
            filePath: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdatePriceDTO: {
          type: 'object',
          required: ['price'],
          properties: {
            price: { type: 'number', example: 145000 },
          },
        },
        DisqualifyDTO: {
          type: 'object',
          properties: {
            reason: { type: 'string', example: 'No cumple con los requisitos mínimos' },
          },
        },

        // ──────────────────────────────────────────────
        //  EVALUATION SCHEMAS
        // ──────────────────────────────────────────────
        ProviderRanking: {
          type: 'object',
          properties: {
            position: { type: 'integer' },
            providerId: { type: 'string', format: 'uuid' },
            providerName: { type: 'string' },
            proposalId: { type: 'string', format: 'uuid' },
            totalScore: { type: 'number' },
            scoreExperience: { type: 'number' },
            scorePrice: { type: 'number' },
            price: { type: 'number' },
          },
        },
        EvaluationResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                tenderId: { type: 'string', format: 'uuid' },
                evaluatedProposals: { type: 'integer' },
                ranking: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ProviderRanking' },
                },
              },
            },
            message: { type: 'string', example: 'Evaluación completada' },
          },
        },
        SetExperienceDTO: {
          type: 'object',
          required: ['yearsExperience'],
          properties: {
            yearsExperience: { type: 'number', example: 8 },
          },
        },

        // ──────────────────────────────────────────────
        //  ONBOARDING SCHEMAS
        // ──────────────────────────────────────────────
        RucDTO: {
          type: 'object',
          required: ['ruc'],
          properties: {
            ruc: { type: 'string', example: '12345678901' },
          },
        },
        DniDTO: {
          type: 'object',
          required: ['dni'],
          properties: {
            dni: { type: 'string', example: '12345678' },
          },
        },
        FullOnboardingDTO: {
          type: 'object',
          required: ['ruc', 'dni'],
          properties: {
            ruc: { type: 'string', example: '12345678901' },
            dni: { type: 'string', example: '12345678' },
          },
        },
        OnboardingResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                rucValid: { type: 'boolean' },
                dniValid: { type: 'boolean' },
                osceClear: { type: 'boolean' },
                rnpValid: { type: 'boolean' },
                rucDetail: { type: 'string' },
                dniDetail: { type: 'string' },
                osceDetail: { type: 'string' },
                rnpDetail: { type: 'string' },
                isApto: { type: 'boolean' },
              },
            },
          },
        },
        OnboardingStatus: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                completed: { type: 'boolean' },
                steps: {
                  type: 'array',
                  items: { type: 'string' },
                },
                allPassed: { type: 'boolean' },
              },
            },
          },
        },

        // ──────────────────────────────────────────────
        //  SEARCH SCHEMAS
        // ──────────────────────────────────────────────
        SearchResults: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Tender' },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        SuggestionsResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },

        // ──────────────────────────────────────────────
        //  AUDIT SCHEMAS
        // ──────────────────────────────────────────────
        Audit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
            proposalId: { type: 'string', format: 'uuid', example: 'b2c3d4e5-...' },
            isValid: { type: 'boolean', example: true },
            reportFile: {
              type: 'object',
              properties: {
                hasScore: { type: 'boolean' },
                hasDocuments: { type: 'boolean' },
                isComplete: { type: 'boolean' },
                state: { type: 'string' },
                score: { type: 'string' },
                checkedAt: { type: 'string', format: 'date-time' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ──────────────────────────────────────────────
        //  COMMON / ERROR SCHEMAS
        // ──────────────────────────────────────────────
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Mensaje de error descriptivo' },
            stack: { type: 'string', description: 'Solo en entorno de desarrollo' },
          },
        },
      },
    },
  },
  apis: ['./modules/**/*.routes.ts', './infrastructure/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
