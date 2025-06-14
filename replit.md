# AUTON® Solar Simulation Platform

## Overview

This is a full-stack web application for solar energy system simulations, built with React (frontend), Express (backend), and PostgreSQL (database). The platform provides enterprise-level solar simulation capabilities for residential, commercial, EV charging, and common area applications.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom solar-themed color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Design**: RESTful API with proper error handling and request logging
- **Development**: Vite middleware integration for seamless full-stack development

### Database Schema
- **Users**: Authentication, roles (admin, user, manager), company info
- **Simulations**: Solar project data with parameters and results stored as JSONB
- **Organizations**: Company/organization management
- **Storage**: Dual implementation (in-memory for development, PostgreSQL for production)

## Key Components

### Authentication System
- JWT token-based authentication
- Role-based access control (admin, user, manager)
- Secure password hashing with bcrypt
- Protected routes and middleware

### Simulation Engine
- **Residential**: Multi-unit residential calculations
- **Commercial**: Business/commercial installations
- **EV Charging**: Electric vehicle charging station sizing
- **Common Areas**: Condominium common area systems
- Financial analysis with ROI, payback period, and savings calculations

### User Interface
- Responsive design with mobile-first approach
- Multi-step simulation wizard with type selection, configuration, and results
- Dashboard with statistics cards, charts, and recent simulations
- Professional enterprise-grade UI with solar industry theming

## Data Flow

1. **Authentication Flow**: Login → JWT token generation → Local storage → API requests with Authorization header
2. **Simulation Flow**: Type selection → Basic info → Specific configuration → Calculate → Results display
3. **Data Persistence**: Form data → API validation → Database storage → Real-time updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe database ORM
- **wouter**: Lightweight React router
- **zod**: Schema validation

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- PostgreSQL 16 module for local database
- Vite dev server with Express API proxy

### Production Build
- Frontend: Vite build to `dist/public`
- Backend: esbuild bundle to `dist/index.js`
- Database: Drizzle migrations for schema management

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration
- Separate development and production configurations

## Changelog

Changelog:
- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.