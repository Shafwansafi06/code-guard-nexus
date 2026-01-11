# System Architecture Diagrams

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App<br/>TypeScript + Vite]
        B[AuthContext]
        C[API Client<br/>Axios]
    end
    
    subgraph "API Gateway Layer"
        D[FastAPI<br/>Python 3.13]
        E[JWT Auth<br/>Middleware]
        F[CORS<br/>Middleware]
    end
    
    subgraph "Service Layer"
        G[Auth Service]
        H[Course Service]
        I[Submission Service]
        J[ML Service ⭐]
    end
    
    subgraph "ML Layer"
        K[Inference Service]
        L[DualHead Model<br/>CodeBERT]
        M[Embedding Cache]
    end
    
    subgraph "Data Layer"
        N[Supabase<br/>PostgreSQL]
        O[File Storage]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    J --> K
    K --> L
    K --> M
    G --> N
    H --> N
    I --> N
    I --> O
    J --> N
    
    style J fill:#4CAF50
    style K fill:#4CAF50
    style L fill:#4CAF50
```

## ML Model Architecture

```mermaid
graph LR
    subgraph "Input Processing"
        A[Source Code] --> B[Tokenizer]
        B --> C[Token IDs<br/>Attention Mask]
    end
    
    subgraph "CodeBERT Backbone"
        C --> D[Transformer<br/>Layers 1-12]
        D --> E[Pooled Output<br/>768 dimensions]
    end
    
    subgraph "Dual Heads"
        E --> F[Projection Head<br/>768→256]
        E --> G[Classification Head<br/>768→2]
        
        F --> H[Normalized<br/>Embeddings]
        G --> I[AI Score<br/>Human Score]
    end
    
    subgraph "Outputs"
        H --> J[Similarity<br/>Computation]
        I --> K[AI Detection<br/>Classification]
    end
    
    style E fill:#2196F3
    style F fill:#4CAF50
    style G fill:#FF9800
```

## Training Pipeline

```mermaid
graph TB
    subgraph "Data Loading"
        A[Rosetta Code<br/>79K samples] --> D
        B[MultiAIGCD<br/>AI Detection] --> D
        C[Plagiarism<br/>Dataset] --> D
        D[DatasetLoader]
    end
    
    subgraph "Data Preprocessing"
        D --> E[Code Pair<br/>Generation]
        E --> F[Tokenization<br/>Language Tags]
        F --> G[DataLoader<br/>Batch=32]
    end
    
    subgraph "Training Loop"
        G --> H[Forward Pass]
        H --> I{Phase?}
        I -->|1-3| J[Freeze Backbone<br/>Train Heads]
        I -->|4-10| K[Unfreeze All<br/>Fine-tune]
        
        J --> L[Compute Loss]
        K --> L
        
        L --> M[InfoNCE Loss<br/>λ₁=0.5]
        L --> N[CrossEntropy Loss<br/>λ₂=0.5]
        
        M --> O[Total Loss]
        N --> O
        
        O --> P[Backpropagation<br/>Gradient Clip]
        P --> Q[Optimizer Step<br/>AdamW]
        Q --> H
    end
    
    subgraph "Validation"
        H --> R[Validation Set]
        R --> S[Compute Metrics]
        S --> T{ROC-AUC<br/>Improved?}
        T -->|Yes| U[Save Best Model]
        T -->|No| H
    end
    
    style M fill:#E91E63
    style N fill:#9C27B0
    style U fill:#4CAF50
```

## Request Flow - AI Detection

```mermaid
sequenceDiagram
    participant U as User/Frontend
    participant A as FastAPI
    participant M as ML Service
    participant I as Inference
    participant D as Model
    participant DB as Database
    
    U->>A: POST /ml/detect-ai<br/>{code, language}
    A->>A: Verify JWT Token
    A->>M: Process Request
    M->>I: get_detector()
    I->>I: Check Model Loaded
    
    alt Model Not Loaded
        I->>I: Load Model<br/>from disk
        I->>D: Initialize Model
    end
    
    I->>D: Tokenize Code
    D->>D: Forward Pass<br/>CodeBERT + Heads
    D->>I: Return Embeddings<br/>+ Logits
    
    I->>I: Apply Softmax<br/>Get Probabilities
    I->>I: Classify AI/Human<br/>Compute Risk
    
    I->>M: Return Results
    M->>DB: Log Prediction<br/>(optional)
    M->>A: Format Response
    A->>U: JSON Response<br/>{ai_score, risk_level}
    
    Note over D: Inference Time:<br/>100-200ms
```

## Request Flow - Similarity Analysis

```mermaid
sequenceDiagram
    participant I as Instructor
    participant F as Frontend
    participant A as API
    participant ML as ML Service
    participant DB as Database
    
    I->>F: Click "Start Analysis"
    F->>A: POST /assignments/{id}/start-analysis
    
    A->>DB: Fetch All Submissions
    DB->>A: Return Submissions
    
    A->>A: Generate N(N-1)/2<br/>Comparison Pairs
    
    loop For Each Pair
        A->>ML: compute_similarity(code1, code2)
        ML->>ML: Get Embeddings
        ML->>ML: Cosine Similarity
        ML->>A: Return Score
        
        A->>ML: detect_ai(code1)
        ML->>A: Return AI Score
        
        A->>A: Calculate Risk Level
        A->>DB: Store comparison_pair
    end
    
    A->>DB: Update Assignment Status
    DB->>A: Confirm
    
    A->>F: Analysis Complete
    F->>I: Show Dashboard<br/>with Results
    
    Note over A,ML: For 50 submissions:<br/>1,225 comparisons<br/>~2-3 minutes
```

## Database Schema

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : contains
    ORGANIZATIONS ||--o{ COURSES : owns
    USERS ||--o{ COURSES : instructs
    COURSES ||--o{ ASSIGNMENTS : contains
    ASSIGNMENTS ||--o{ SUBMISSIONS : receives
    USERS ||--o{ SUBMISSIONS : submits
    SUBMISSIONS ||--o{ FILES : includes
    ASSIGNMENTS ||--o{ COMPARISON_PAIRS : analyzes
    SUBMISSIONS ||--o{ COMPARISON_PAIRS : "compared_in(1)"
    SUBMISSIONS ||--o{ COMPARISON_PAIRS : "compared_in(2)"
    COMPARISON_PAIRS ||--o{ ANALYSIS_RESULTS : details
    
    ORGANIZATIONS {
        uuid id PK
        string name
        timestamp created_at
    }
    
    USERS {
        uuid id PK
        uuid org_id FK
        string email
        string role
        jsonb profile
    }
    
    COURSES {
        uuid id PK
        uuid org_id FK
        uuid instructor_id FK
        string name
        string code
        string semester
    }
    
    ASSIGNMENTS {
        uuid id PK
        uuid course_id FK
        string title
        timestamp deadline
        string language
        int max_score
    }
    
    SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        uuid student_id FK
        timestamp submitted_at
        float total_score
        string status
    }
    
    FILES {
        uuid id PK
        uuid submission_id FK
        string filename
        text content
        string file_hash
        string language
    }
    
    COMPARISON_PAIRS {
        uuid id PK
        uuid assignment_id FK
        uuid submission1_id FK
        uuid submission2_id FK
        float similarity_score
        float ai_score
        string risk_level
    }
    
    ANALYSIS_RESULTS {
        uuid id PK
        uuid comparison_id FK
        jsonb metrics
        jsonb visualization_data
    }
```

## Deployment Architecture (Production)

```mermaid
graph TB
    subgraph "CDN Layer"
        A[Vercel CDN]
    end
    
    subgraph "Frontend"
        B[React App<br/>Static Assets]
    end
    
    subgraph "API Layer"
        C[Load Balancer<br/>Nginx/Railway]
        D1[API Instance 1]
        D2[API Instance 2]
        D3[API Instance N]
    end
    
    subgraph "Worker Layer"
        E1[Analysis Worker 1<br/>Celery]
        E2[Analysis Worker 2<br/>Celery]
        E3[Analysis Worker N<br/>Celery]
    end
    
    subgraph "Cache Layer"
        F[Redis<br/>Embeddings Cache]
    end
    
    subgraph "Database Layer"
        G[Supabase<br/>PostgreSQL<br/>Primary]
        H[Supabase<br/>PostgreSQL<br/>Replica]
    end
    
    subgraph "Storage Layer"
        I[S3 / GCS<br/>File Storage]
        J[Model Storage<br/>Trained Models]
    end
    
    subgraph "Monitoring"
        K[Sentry<br/>Error Tracking]
        L[DataDog<br/>Metrics]
    end
    
    A --> B
    B --> C
    C --> D1
    C --> D2
    C --> D3
    
    D1 --> F
    D1 --> G
    D2 --> F
    D2 --> G
    D3 --> F
    D3 --> G
    
    D1 --> E1
    D2 --> E2
    D3 --> E3
    
    E1 --> F
    E1 --> G
    E1 --> I
    E1 --> J
    
    G --> H
    
    D1 --> K
    D1 --> L
    E1 --> K
    E1 --> L
    
    style A fill:#00BCD4
    style C fill:#FF9800
    style F fill:#E91E63
    style G fill:#4CAF50
```

## CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    
    B --> C{Branch?}
    
    C -->|main| D[Run Tests]
    C -->|feature| E[Run Tests]
    
    D --> F{Tests Pass?}
    E --> G{Tests Pass?}
    
    F -->|Yes| H[Build Docker Image]
    F -->|No| I[Notify Developer]
    
    G -->|Yes| J[Preview Deploy]
    G -->|No| I
    
    H --> K[Push to Registry]
    K --> L[Deploy to Railway]
    L --> M[Health Check]
    
    M --> N{Healthy?}
    N -->|Yes| O[Update DNS]
    N -->|No| P[Rollback]
    
    O --> Q[Send Notification]
    P --> Q
    
    J --> R[Preview URL]
    
    style D fill:#2196F3
    style F fill:#FF9800
    style O fill:#4CAF50
    style P fill:#F44336
```

## Security Architecture

```mermaid
graph TB
    subgraph "External"
        A[Client Browser]
    end
    
    subgraph "Security Layers"
        B[HTTPS/TLS<br/>Encryption]
        C[CORS<br/>Origin Check]
        D[Rate Limiting<br/>DDoS Protection]
        E[JWT Validation<br/>Auth Middleware]
    end
    
    subgraph "Application"
        F[FastAPI<br/>Endpoints]
        G[Role-Based<br/>Access Control]
        H[Input Validation<br/>Pydantic]
    end
    
    subgraph "Data Protection"
        I[Supabase RLS<br/>Row Level Security]
        J[Encrypted Storage<br/>at Rest]
        K[Audit Logs]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    G --> I
    H --> I
    I --> J
    F --> K
    
    style B fill:#4CAF50
    style E fill:#FF9800
    style I fill:#2196F3
```

## Monitoring Dashboard

```mermaid
graph TB
    subgraph "Metrics Collection"
        A[API Metrics]
        B[ML Metrics]
        C[Database Metrics]
        D[System Metrics]
    end
    
    subgraph "Aggregation"
        E[Prometheus/<br/>DataDog]
    end
    
    subgraph "Visualization"
        F[Grafana<br/>Dashboards]
    end
    
    subgraph "Alerting"
        G{Threshold<br/>Exceeded?}
        H[Slack/Email<br/>Notification]
        I[PagerDuty<br/>Incident]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    E --> G
    
    G -->|Warning| H
    G -->|Critical| I
    
    style E fill:#FF9800
    style F fill:#2196F3
    style I fill:#F44336
```

---

## Legend

- 🟢 Production Ready
- 🟡 In Development
- 🟠 Planned
- 🔴 Critical Path
- ⭐ Core Feature

## Notes

All diagrams are generated using Mermaid and can be viewed in:
- GitHub (native support)
- VS Code (with Mermaid extension)
- Documentation sites (GitBook, MkDocs)

To edit diagrams, modify the Mermaid syntax in this file.
