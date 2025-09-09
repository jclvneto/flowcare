import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone", { length: 30 }),
  name: varchar("name").notNull(),
  globalRole: varchar("global_role", { enum: ["ADMIN_MASTER", "USER"] }).default("USER").notNull(),
  timezone: varchar("timezone", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const clinicRoleEnum = pgEnum("clinic_role", ["CLINIC_ADMIN", "RECEPTIONIST", "VETERINARIAN"]);
export const speciesEnum = pgEnum("species", ["DOG", "CAT", "BIRD", "RABBIT", "REPTILE", "OTHER"]);
export const sexEnum = pgEnum("sex", ["MALE", "FEMALE", "UNKNOWN"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]);
export const appointmentSourceEnum = pgEnum("appointment_source", ["WHATSAPP", "MANUAL"]);
export const encounterStatusEnum = pgEnum("encounter_status", ["DRAFT", "CONFIRMED"]);
export const messageDirectionEnum = pgEnum("message_direction", ["INBOUND", "OUTBOUND"]);
export const messageStatusEnum = pgEnum("message_status", ["QUEUED", "SENT", "DELIVERED", "READ", "FAILED"]);

// Clinic table
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  legalName: varchar("legal_name"),
  whatsappNumber: varchar("whatsapp_number", { length: 30 }),
  feedbackFormUrl: varchar("feedback_form_url"),
  country: varchar("country", { length: 2 }),
  state: varchar("state", { length: 64 }),
  city: varchar("city", { length: 64 }),
  addressLine: varchar("address_line"),
  zip: varchar("zip", { length: 20 }),
  active: boolean("active").default(true).notNull(),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("clinics_active_idx").on(table.active),
]);

// Clinic membership table
export const clinicMemberships = pgTable("clinic_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: clinicRoleEnum("role").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("clinic_memberships_user_role_idx").on(table.userId, table.role),
  index("clinic_memberships_clinic_role_idx").on(table.clinicId, table.role),
]);

// Owners (tutors) table
export const owners = pgTable("owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  name: varchar("name").notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email"),
  notes: text("notes"),
  whatsappOptIn: boolean("whatsapp_opt_in").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("owners_clinic_idx").on(table.clinicId),
  index("owners_phone_idx").on(table.phone),
]);

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  name: varchar("name").notNull(),
  species: speciesEnum("species").notNull(),
  sex: sexEnum("sex").default("UNKNOWN").notNull(),
  breed: varchar("breed"),
  color: varchar("color"),
  birthDate: timestamp("birth_date"),
  microchip: varchar("microchip"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("patients_clinic_owner_idx").on(table.clinicId, table.ownerId),
  index("patients_name_idx").on(table.name),
]);

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  createdById: varchar("created_by_id"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: appointmentStatusEnum("status").default("PENDING").notNull(),
  source: appointmentSourceEnum("source").default("MANUAL").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("appointments_clinic_starts_idx").on(table.clinicId, table.startsAt),
  index("appointments_provider_starts_idx").on(table.providerId, table.startsAt),
  index("appointments_owner_idx").on(table.ownerId),
  index("appointments_status_idx").on(table.status),
]);

// Encounters table
export const encounters = pgTable("encounters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  appointmentId: varchar("appointment_id"),
  patientId: varchar("patient_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  status: encounterStatusEnum("status").default("DRAFT").notNull(),
  signedAt: timestamp("signed_at"),
  chiefComplaint: jsonb("chief_complaint"),
  historyPresent: jsonb("history_present"),
  physicalExam: jsonb("physical_exam"),
  diagnosis: jsonb("diagnosis"),
  plan: jsonb("plan"),
  vitals: jsonb("vitals"),
  rawText: text("raw_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("encounters_clinic_patient_idx").on(table.clinicId, table.patientId),
  index("encounters_provider_idx").on(table.providerId),
  index("encounters_status_idx").on(table.status),
]);

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  encounterId: varchar("encounter_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  notes: text("notes"),
  pdfUrl: varchar("pdf_url"),
  sendToWhatsapp: boolean("send_to_whatsapp").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("prescriptions_clinic_idx").on(table.clinicId),
  index("prescriptions_provider_idx").on(table.providerId),
]);

// Prescription items table
export const prescriptionItems = pgTable("prescription_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: varchar("prescription_id").notNull(),
  drugName: varchar("drug_name").notNull(),
  dosage: varchar("dosage"),
  frequency: varchar("frequency"),
  duration: varchar("duration"),
  route: varchar("route"),
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(clinicMemberships),
  appointmentsAsProvider: many(appointments, { relationName: "appointmentProvider" }),
  encountersAsProvider: many(encounters, { relationName: "encounterProvider" }),
  appointmentsCreated: many(appointments, { relationName: "appointmentCreator" }),
  clinicsOwned: many(clinics, { relationName: "clinicOwner" }),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(users, {
    fields: [clinics.ownerId],
    references: [users.id],
    relationName: "clinicOwner",
  }),
  memberships: many(clinicMemberships),
  owners: many(owners),
  patients: many(patients),
  appointments: many(appointments),
  encounters: many(encounters),
  prescriptions: many(prescriptions),
}));

export const clinicMembershipsRelations = relations(clinicMemberships, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicMemberships.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [clinicMemberships.userId],
    references: [users.id],
  }),
}));

export const ownersRelations = relations(owners, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [owners.clinicId],
    references: [clinics.id],
  }),
  patients: many(patients),
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [patients.clinicId],
    references: [clinics.id],
  }),
  owner: one(owners, {
    fields: [patients.ownerId],
    references: [owners.id],
  }),
  appointments: many(appointments),
  encounters: many(encounters),
  prescriptions: many(prescriptions),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  owner: one(owners, {
    fields: [appointments.ownerId],
    references: [owners.id],
  }),
  provider: one(users, {
    fields: [appointments.providerId],
    references: [users.id],
    relationName: "appointmentProvider",
  }),
  createdBy: one(users, {
    fields: [appointments.createdById],
    references: [users.id],
    relationName: "appointmentCreator",
  }),
  encounter: one(encounters, {
    fields: [appointments.id],
    references: [encounters.appointmentId],
  }),
}));

export const encountersRelations = relations(encounters, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [encounters.clinicId],
    references: [clinics.id],
  }),
  appointment: one(appointments, {
    fields: [encounters.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [encounters.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [encounters.providerId],
    references: [users.id],
    relationName: "encounterProvider",
  }),
  prescription: one(prescriptions, {
    fields: [encounters.id],
    references: [prescriptions.encounterId],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [prescriptions.clinicId],
    references: [clinics.id],
  }),
  encounter: one(encounters, {
    fields: [prescriptions.encounterId],
    references: [encounters.id],
  }),
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [prescriptions.providerId],
    references: [users.id],
  }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertClinic = typeof clinics.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;

export type InsertClinicMembership = typeof clinicMemberships.$inferInsert;
export type ClinicMembership = typeof clinicMemberships.$inferSelect;

export type InsertOwner = typeof owners.$inferInsert;
export type Owner = typeof owners.$inferSelect;

export type InsertPatient = typeof patients.$inferInsert;
export type Patient = typeof patients.$inferSelect;

export type InsertAppointment = typeof appointments.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;

export type InsertEncounter = typeof encounters.$inferInsert;
export type Encounter = typeof encounters.$inferSelect;

export type InsertPrescription = typeof prescriptions.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;

export type InsertPrescriptionItem = typeof prescriptionItems.$inferInsert;
export type PrescriptionItem = typeof prescriptionItems.$inferSelect;

// Zod schemas
export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOwnerSchema = createInsertSchema(owners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEncounterSchema = createInsertSchema(encounters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({
  id: true,
});

export const insertClinicMembershipSchema = createInsertSchema(clinicMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
