# ForgetFunds

A modern, local-first budget management application built with Electron, React, TypeScript, and shadcn/ui. Features AI-powered expense estimation and comprehensive financial tracking.

## Features

- 🏠 **Local-First**: All data stored locally with optional JSON import/export
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 📊 **Comprehensive Tracking**:
  - Income sources with multiple frequencies
  - Revolving debts (credit cards)
  - Installment loans (car leases, personal loans)
  - Recurring and one-time expenses
  - Savings buckets with categories and priorities
- 🤖 **AI-Powered Estimates**: Location-based grocery estimates and lifestyle-based entertainment budgets
- 📈 **Advanced Analytics**:
  - Debt burndown projections
  - Savings growth charts
  - Cash flow visualization
  - Financial health metrics
- 💾 **Data Persistence**: Automatic saving with Electron Store
- 📁 **Import/Export**: JSON-based data portability

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Desktop**: Electron
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Code Quality**: ESLint, Prettier
- **Data Storage**: Electron Store

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd local_first_budget_app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development mode (React dev server + Electron)
- `npm run dev:react` - Start only React development server
- `npm run build` - Build for production
- `npm run build:electron` - Build and package Electron app
- `npm run start` - Start Electron app (production build)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── BudgetSystem/    # Main application components
├── lib/
│   └── utils.ts         # Utility functions
├── types/
│   └── budget.ts        # TypeScript type definitions
├── App.tsx              # Main application component
├── main.tsx             # React entry point
└── index.css            # Global styles with Tailwind

src/main.js              # Electron main process
src/preload.js           # Electron preload script
```

## Features Overview

### Dashboard

- Monthly income vs expenses overview
- Available savings calculation
- Total debt tracking
- Financial health indicators

### Income Management

- Multiple income sources
- Flexible frequency options (weekly, bi-weekly, monthly)
- Automatic monthly conversion

### Debt Tracking

- **Revolving Debts**: Credit cards with APR calculations
- **Installment Loans**: Car leases, personal loans with fixed terms
- Debt payoff projections and interest calculations

### Expense Categories

- **Recurring Expenses**: Monthly bills and subscriptions
- **One-Time Expenses**: Moving costs, deposits (excluded from monthly budget)

### Savings Buckets

- Categorized savings goals (Emergency, Investment, Lifestyle, Education)
- Priority-based allocation
- Progress tracking with completion estimates

### AI Assistant

- **Location-Based Estimates**: Grocery costs adjusted by city
- **Lifestyle Survey**: Entertainment budget based on habits
- Automatic expense category population

### Analytics & Charts

- Debt burndown timeline
- Savings growth projection
- Monthly cash flow visualization
- Budget breakdown pie charts

## Data Management

### Local Storage

- All data automatically saved using Electron Store
- No cloud dependencies
- Privacy-focused design

### Import/Export

- JSON format for data portability
- Version tracking for compatibility
- Menu-driven file operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting: `npm run lint:fix && npm run format`
5. Test your changes
6. Submit a pull request

## License

MIT License - see LICENSE file for details
