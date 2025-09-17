# React Native + Monorepo Evolution Milestone

## 🎯 Vision

Transform the ForgetFunds into a comprehensive cross-platform solution with:

- **React Native mobile app** with offline-first architecture
- **Local sync** between Electron desktop and mobile apps
- **pnpm monorepo** structure with shared packages
- **SQLite-based data layer** with consistent migrations across platforms
- **Shared business logic** and type definitions

---

## 📱 Phase 1: React Native Mobile App Foundation

### Project Structure Setup

- 🔲 **Initialize React Native App**
  - Create new React Native project using latest CLI
  - Set up TypeScript configuration matching desktop app
  - Configure Metro bundler for shared packages
  - Set up development environment (iOS/Android)

- 🔲 **Mobile-First UI Components**
  - Port shadcn/ui components to React Native equivalents
  - Create mobile-optimized layouts and navigation
  - Implement responsive design for tablets and phones
  - Add platform-specific UI patterns (iOS/Android)

### Core Features Migration

- 🔲 **Essential Budget Features**
  - Income management with mobile-friendly forms
  - Expense tracking with quick entry modes
  - Debt management with touch-optimized interactions
  - Savings goals with visual progress indicators
  - Basic analytics and overview dashboard

- 🔲 **Mobile-Specific Enhancements**
  - Camera receipt scanning (OCR integration)
  - GPS-based expense categorization hints
  - Push notifications for budget reminders
  - Offline-first data persistence with SQLite

---

## 🔄 Phase 2: Local Sync Architecture

### Sync Strategy Design

- 🔲 **Conflict Resolution System**
  - Last-write-wins with timestamp comparison
  - Device-specific conflict resolution UI
  - Merge strategies for different data types
  - Rollback capabilities for failed syncs

- 🔲 **Sync Transport Layer**
  - **Option A**: WiFi Direct/Local Network Discovery
    - mDNS/Bonjour for device discovery
    - HTTP/WebSocket server in Electron app
    - Mobile app as client connecting to desktop
  - **Option B**: File-based sync via cloud storage
    - Encrypted JSON files in iCloud/Google Drive
    - Change detection and incremental updates
    - Conflict resolution through file versioning

### Data Synchronization

- 🔲 **Sync Protocol Implementation**
  - Delta sync for efficient data transfer
  - Checksum validation for data integrity
  - Retry logic with exponential backoff
  - Sync status indicators in both apps

- 🔲 **Offline Handling**
  - Queue pending changes during offline periods
  - Automatic sync when connection restored
  - User notification of sync status
  - Manual sync triggers for user control

---

## 🏗️ Phase 3: Monorepo Architecture Migration

### Repository Structure

```
budget-app-monorepo/
├── apps/
│   ├── desktop/                 # Electron app
│   │   ├── src/
│   │   ├── package.json
│   │   └── electron-specific files
│   ├── mobile/                  # React Native app
│   │   ├── src/
│   │   ├── ios/
│   │   ├── android/
│   │   └── package.json
│   └── web/                     # Future web version (optional)
├── packages/
│   ├── shared-types/            # TypeScript definitions
│   ├── shared-components/       # Cross-platform UI components
│   ├── business-logic/          # Core financial calculations
│   ├── data-layer/              # Database abstraction + migrations
│   ├── sync-engine/             # Synchronization logic
│   └── config/                  # Shared configurations
├── tools/
│   ├── build-scripts/
│   └── development-tools/
├── package.json                 # Root package.json
├── pnpm-workspace.yaml
└── turbo.json                   # Build orchestration
```

### Monorepo Setup

- 🔲 **pnpm Workspace Configuration**
  - Initialize pnpm workspace with proper dependency management
  - Configure shared dependencies and peer dependencies
  - Set up workspace-specific scripts and commands
  - Implement dependency hoisting strategies

- 🔲 **Build System Integration**
  - Turbo.js for fast, cached builds across packages
  - Shared build configurations and tooling
  - Parallel development and testing workflows
  - Automated dependency graph analysis

### Package Extraction

- 🔲 **@budget/shared-types**
  - Extract all TypeScript interfaces and types
  - Version management for breaking changes
  - Platform-specific type extensions
  - Runtime validation schemas (Zod/Yup)

- 🔲 **@budget/business-logic**
  - Financial calculations and utilities
  - Budget algorithms and projections
  - Data validation and sanitization
  - Pure functions for cross-platform compatibility

- 🔲 **@budget/data-layer**
  - Database abstraction layer
  - SQLite migrations and schema management
  - CRUD operations with type safety
  - Query builders and data access patterns

---

## 🗃️ Phase 4: SQLite Migration & Data Integrity

### Database Architecture

- 🔲 **SQLite Schema Design**

  ```sql
  -- Core tables
  CREATE TABLE users (id, created_at, updated_at, settings);
  CREATE TABLE income (id, user_id, source, amount, frequency, created_at, updated_at);
  CREATE TABLE expenses (id, user_id, category, amount, type, date, created_at, updated_at);
  CREATE TABLE debts (id, user_id, name, balance, apr, min_payment, created_at, updated_at);
  CREATE TABLE savings (id, user_id, name, target, current, category, priority, created_at, updated_at);

  -- Sync and versioning
  CREATE TABLE sync_log (id, table_name, record_id, action, timestamp, device_id);
  CREATE TABLE schema_version (version, applied_at);
  ```

- 🔲 **Migration System**
  - Versioned migration files with up/down scripts
  - Cross-platform migration runner
  - Data backup before migrations
  - Rollback capabilities for failed migrations

### Data Layer Implementation

- 🔲 **@budget/data-layer Package**
  - SQLite adapter for both Electron and React Native
  - Type-safe query builders
  - Connection pooling and transaction management
  - Automated backup and restore functionality

- 🔲 **Migration from electron-store (Security-First)**
  - **CRITICAL**: Implement encryption BEFORE migration to avoid plain-text exposure
  - Secure data export from current JSON-based storage with encryption
  - Migration script to populate encrypted SQLite database
  - Validation of migrated data integrity with checksums
  - Fallback mechanisms for migration failures with secure cleanup
  - Master password setup during first-time migration

### Cross-Platform Database Access

- 🔲 **Platform-Specific Implementations**
  - **Electron**: `better-sqlite3` for synchronous operations
  - **React Native**: `react-native-sqlite-storage` or `expo-sqlite`
  - **Web** (future): `sql.js` with persistence layer
  - Unified API across all platforms

---

## 🔧 Phase 5: Development Experience & Tooling

### Developer Workflow

- 🔲 **Unified Development Environment**
  - Single command to start all apps in development
  - Hot reload across desktop and mobile simultaneously
  - Shared ESLint, Prettier, and TypeScript configurations
  - Integrated testing across all packages

- 🔲 **Build and Deployment Pipeline**
  - Automated builds triggered by changes in shared packages
  - Platform-specific build optimizations
  - Automated testing across all platforms
  - Release management with semantic versioning

### Testing Strategy

- 🔲 **Cross-Platform Testing**
  - Unit tests for shared business logic
  - Integration tests for data layer and sync
  - E2E tests for critical user flows
  - Visual regression testing for UI components

- 🔲 **Sync Testing Framework**
  - Simulated network conditions and failures
  - Multi-device sync scenarios
  - Conflict resolution testing
  - Data integrity validation across syncs

---

## 📊 Phase 6: Advanced Features & Optimization

### Enhanced Mobile Features

- 🔲 **ADHD-Friendly Mobile UX**
  - Widget support for quick expense entry
  - Apple Watch/Wear OS complications
  - Siri Shortcuts/Google Assistant integration
  - Location-based spending reminders

- 🔲 **Advanced Sync Features**
  - Selective sync (choose what to sync)
  - Sync scheduling and bandwidth management
  - Encrypted cloud backup as sync fallback
  - Multi-device conflict resolution UI

### Performance & Scalability

- 🔲 **Optimization**
  - Database indexing for large datasets
  - Lazy loading and pagination
  - Memory management for long-running apps
  - Background sync optimization

---

## 🚀 Implementation Timeline & Priorities

### Sprint 0: Security Foundation (2-3 weeks) **CRITICAL FIRST**

1. **Local Encryption Implementation** - Replace electron-store with encrypted SQLite
2. **User Authentication** - Master password/PIN with key derivation
3. **API Key Security** - OS keychain integration for secure credential storage

### Sprint 1-2: Foundation (4-6 weeks)

1. **Monorepo Setup** - pnpm workspace, shared packages structure
2. **Type Extraction** - Move all types to @budget/shared-types
3. **Business Logic Package** - Extract calculations and utilities

### Sprint 3-4: Secure Data Layer (4-6 weeks)

1. **Encrypted SQLite Schema** - Design and implement secure database structure
2. **Secure Migration System** - Build encrypted migration runner and scripts
3. **Secure Data Layer Package** - Create cross-platform encrypted database abstraction
4. **Export/Import Security** - Implement encrypted backup/restore functionality

### Sprint 5-8: React Native App (8-12 weeks)

1. **RN Project Setup** - Initialize with shared packages
2. **Core Features** - Port essential budget functionality
3. **Mobile UX** - Optimize for touch and mobile patterns

### Sprint 9-12: Secure Sync Implementation (8-12 weeks)

1. **Encrypted Sync Protocol** - Design and implement end-to-end encrypted sync architecture
2. **Device Authentication** - QR code pairing and public key fingerprint verification
3. **Secure Conflict Resolution** - Build encrypted conflict handling with integrity verification
4. **Security Testing & Polish** - Comprehensive security testing and UX refinement

---

## 🔍 Technical Considerations

### Architecture Decisions

- 🔲 **State Management**
  - Zustand/Redux for complex state across apps
  - SQLite as single source of truth
  - Optimistic updates with rollback capability

- 🔲 **Security & Privacy Implementation**
  - **Phase 1 (Critical)**: Replace electron-store with encrypted SQLite database (AES-256-GCM)
  - **Phase 1 (Critical)**: Implement user authentication (master password/PIN) with PBKDF2 key derivation
  - **Phase 1 (Critical)**: Secure API key storage using OS keychain services
  - **Phase 2**: Encrypted export/import with password protection and integrity checksums
  - **Phase 2**: Auto-lock functionality with timeout-based security
  - **Phase 3**: End-to-end encryption for sync data with device key pairs (RSA-4096/Ed25519)
  - **Phase 3**: TLS 1.3 with certificate pinning for sync transport
  - **Phase 3**: Encrypted conflict resolution with Merkle trees and version vectors
  - Local-only processing (no cloud dependencies)
  - Secure key management across devices

### Platform-Specific Challenges

- 🔲 **iOS Considerations**
  - App Store review guidelines compliance
  - Background processing limitations
  - iCloud integration possibilities

- 🔲 **Android Considerations**
  - File system access permissions
  - Background sync optimization
  - Google Drive integration options

---

## 📱 Future Expansion Opportunities

### Additional Platforms

- 🔲 **Web Application**
  - Progressive Web App with offline capabilities
  - WebAssembly for SQLite in browser
  - Sync with desktop/mobile apps

- 🔲 **Smart Watch Integration**
  - Quick expense logging from wrist
  - Budget alerts and notifications
  - Voice-to-text expense entry

### Advanced Features

- 🔲 **AI/ML Enhancements**
  - On-device expense categorization
  - Spending pattern analysis
  - Predictive budgeting suggestions

- 🔲 **Integration Ecosystem**
  - Bank account import (with user consent)
  - Calendar integration for bill reminders
  - Siri/Google Assistant voice commands

---

**Last Updated**: Current session
**Next Priority**: Begin monorepo migration and shared package extraction

## Success Metrics

- **Cross-Platform Consistency**: 95%+ feature parity between desktop and mobile
- **Sync Reliability**: 99.9% successful sync operations without data loss
- **Performance**: <2s app startup, <500ms for common operations
- **Developer Experience**: Single command development setup, <10s build times
- **User Adoption**: Seamless migration from current Electron-only version
