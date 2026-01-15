# Project Reorganization Plan

## Current Issues
- 100+ markdown files scattered in root directory
- Utility scripts mixed with documentation
- Test files not properly organized
- No clear structure for different concerns
- Hard to find specific documentation or tools

## Proposed Structure

```
/
├── client/                    # Frontend application (keep as is)
├── server/                    # Backend application (keep as is)
├── docs/                      # All documentation
│   ├── README.md             # Documentation index
│   ├── modules/              # Feature module docs
│   │   ├── accountant/       # Accountant module docs
│   │   ├── delivery/         # Delivery staff docs
│   │   ├── field-staff/      # Field staff docs
│   │   ├── lab/              # Lab management docs
│   │   ├── manager/          # Manager module docs
│   │   ├── staff/            # Staff module docs
│   │   └── billing/          # Billing platform docs
│   ├── ui-design/            # UI/UX documentation
│   │   ├── color-schemes/
│   │   ├── layouts/
│   │   └── components/
│   ├── testing/              # Testing documentation
│   │   ├── guides/
│   │   ├── reports/
│   │   └── test-cases/
│   ├── api/                  # API documentation
│   ├── deployment/           # Deployment guides
│   ├── ml-models/            # ML/AI documentation
│   └── fixes/                # Bug fix documentation
├── scripts/                   # Utility scripts
│   ├── database/             # DB migration/setup scripts
│   ├── testing/              # Test runner scripts
│   ├── fixes/                # One-time fix scripts
│   └── setup/                # Setup/initialization scripts
├── tests/                     # All test files
│   ├── e2e/                  # E2E tests (existing)
│   ├── integration/          # Integration tests
│   ├── unit/                 # Unit tests
│   └── fixtures/             # Test data/fixtures
├── datasets/                  # ML datasets (keep as is)
├── python/                    # Python ML services (keep as is)
├── .kiro/                     # Kiro configuration (keep as is)
├── .github/                   # GitHub workflows (keep as is)
├── config/                    # Project-level configs
│   ├── playwright.config.js
│   ├── render.yaml
│   └── vercel.json
├── .env                       # Environment files (keep in root)
├── .env.test
├── package.json               # Package files (keep in root)
├── package-lock.json
└── README.md                  # Main project README
```

## Migration Steps

### Phase 1: Create Directory Structure
- Create all new directories
- Create index/README files for each section

### Phase 2: Move Documentation Files
- Move accountant docs → docs/modules/accountant/
- Move delivery docs → docs/modules/delivery/
- Move field staff docs → docs/modules/field-staff/
- Move testing docs → docs/testing/
- Move UI/design docs → docs/ui-design/
- Move fix summaries → docs/fixes/
- Move ML docs → docs/ml-models/

### Phase 3: Move Scripts
- Move test scripts → scripts/testing/
- Move fix scripts → scripts/fixes/
- Move setup scripts → scripts/setup/
- Move DB scripts → scripts/database/

### Phase 4: Move Config Files
- Move playwright.config.js → config/
- Move render.yaml → config/
- Move vercel.json → config/
- Update references in code

### Phase 5: Move Test Files
- Move root test files → tests/integration/
- Organize by feature area

### Phase 6: Cleanup
- Remove duplicate/obsolete files
- Update all path references
- Create comprehensive README files
- Update .gitignore if needed

## Benefits
✓ Clear separation of concerns
✓ Easy to find documentation
✓ Scalable structure
✓ Better for new developers
✓ Cleaner root directory
✓ Professional organization
