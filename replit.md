# FlowCare - Veterinary Clinic CRM

## Overview

FlowCare is a SaaS CRM platform designed specifically for veterinary clinics. The system focuses on three core areas: digitizing veterinary care through AI-powered electronic medical records, simplifying appointment scheduling via WhatsApp integration, and automating client communication for prescriptions, reminders, and feedback.

The platform serves multiple user roles including Admin Master (system-wide control), Clinic Admins (clinic-specific management), Receptionists (appointment and communication management), and Veterinarians (medical records and prescriptions).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API endpoints with structured error handling
- **Authentication**: Replit Auth integration with session-based authentication
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Entities**: Users, Clinics, Clinic Memberships, Owners, Patients, Appointments, Medical Records (Encounters), Prescriptions
- **Multi-tenancy**: Clinic-based isolation with role-based access control
- **Role System**: Global roles (ADMIN_MASTER, USER) and clinic-specific roles (CLINIC_ADMIN, RECEPTIONIST, VETERINARIAN)

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Access Control**: Role-based permissions at both global and clinic levels
- **Protected Routes**: Frontend route protection based on user roles

### Component Architecture
- **Layout Components**: Sidebar navigation and top bar with role-based menu items
- **Form Components**: Reusable form components for entities (appointments, patients, owners, etc.)
- **UI Components**: Comprehensive component library based on Radix UI primitives
- **Protected Routes**: Component-level access control for sensitive pages

### Development Workflow
- **Development Server**: Vite dev server with HMR and Express API proxy
- **Build Process**: Vite for frontend build, esbuild for backend compilation
- **Type Safety**: End-to-end TypeScript with shared schemas between frontend and backend
- **Code Quality**: Path aliases for clean imports and consistent code organization

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service for user authentication
- **Session Storage**: PostgreSQL-based session management

### Frontend Libraries
- **UI Framework**: React 18 with TypeScript
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query for server state synchronization
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for schema validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Dependencies
- **Web Framework**: Express.js for API server
- **Database ORM**: Drizzle ORM with Drizzle Kit for PostgreSQL
- **Authentication**: Passport.js with OpenID Client for Replit Auth
- **Session Management**: Express Session with connect-pg-simple
- **Validation**: Zod for request/response validation
- **Database Client**: Neon serverless PostgreSQL client

### Development Tools
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development**: TSX for TypeScript execution in development
- **Replit Integration**: Replit-specific development plugins and error handling

### Planned Integrations
- **WhatsApp API**: For appointment scheduling and client communication
- **AI Services**: For automated medical record generation
- **PDF Generation**: For prescription and report generation
- **Email Services**: For client communication and notifications