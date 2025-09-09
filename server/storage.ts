import {
  users,
  clinics,
  clinicMemberships,
  owners,
  patients,
  appointments,
  encounters,
  prescriptions,
  prescriptionItems,
  type User,
  type UpsertUser,
  type Clinic,
  type InsertClinic,
  type Owner,
  type InsertOwner,
  type Patient,
  type InsertPatient,
  type Appointment,
  type InsertAppointment,
  type Encounter,
  type InsertEncounter,
  type Prescription,
  type InsertPrescription,
  type PrescriptionItem,
  type InsertPrescriptionItem,
  type ClinicMembership,
  type InsertClinicMembership,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Clinic operations
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  getClinic(id: string): Promise<Clinic | undefined>;
  getClinics(): Promise<Clinic[]>;
  updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined>;
  deleteClinic(id: string): Promise<boolean>;
  
  // Clinic membership operations
  createClinicMembership(membership: InsertClinicMembership): Promise<ClinicMembership>;
  getClinicMemberships(clinicId: string): Promise<ClinicMembership[]>;
  getUserMemberships(userId: string): Promise<ClinicMembership[]>;
  deleteClinicMembership(id: string): Promise<boolean>;
  
  // Owner operations
  createOwner(owner: InsertOwner): Promise<Owner>;
  getOwner(id: string): Promise<Owner | undefined>;
  getOwners(clinicId: string): Promise<Owner[]>;
  searchOwners(clinicId: string, query: string): Promise<Owner[]>;
  updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | undefined>;
  deleteOwner(id: string): Promise<boolean>;
  
  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(clinicId: string): Promise<Patient[]>;
  getPatientsByOwner(ownerId: string): Promise<Patient[]>;
  searchPatients(clinicId: string, query: string): Promise<Patient[]>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointments(clinicId: string): Promise<Appointment[]>;
  getAppointmentsByProvider(providerId: string): Promise<Appointment[]>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  
  // Encounter operations
  createEncounter(encounter: InsertEncounter): Promise<Encounter>;
  getEncounter(id: string): Promise<Encounter | undefined>;
  getEncounters(clinicId: string): Promise<Encounter[]>;
  getEncountersByPatient(patientId: string): Promise<Encounter[]>;
  updateEncounter(id: string, encounter: Partial<InsertEncounter>): Promise<Encounter | undefined>;
  deleteEncounter(id: string): Promise<boolean>;
  
  // Prescription operations
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptions(clinicId: string): Promise<Prescription[]>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  deletePrescription(id: string): Promise<boolean>;
  
  // Prescription item operations
  createPrescriptionItem(item: InsertPrescriptionItem): Promise<PrescriptionItem>;
  getPrescriptionItems(prescriptionId: string): Promise<PrescriptionItem[]>;
  deletePrescriptionItem(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Clinic operations
  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    return newClinic;
  }

  async getClinic(id: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic;
  }

  async getClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics).where(eq(clinics.active, true)).orderBy(asc(clinics.name));
  }

  async updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const [updated] = await db
      .update(clinics)
      .set({ ...clinic, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return updated;
  }

  async deleteClinic(id: string): Promise<boolean> {
    const result = await db
      .update(clinics)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(clinics.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Clinic membership operations
  async createClinicMembership(membership: InsertClinicMembership): Promise<ClinicMembership> {
    const [newMembership] = await db.insert(clinicMemberships).values(membership).returning();
    return newMembership;
  }

  async getClinicMemberships(clinicId: string): Promise<ClinicMembership[]> {
    return await db
      .select()
      .from(clinicMemberships)
      .where(and(eq(clinicMemberships.clinicId, clinicId), eq(clinicMemberships.active, true)));
  }

  async getUserMemberships(userId: string): Promise<ClinicMembership[]> {
    return await db
      .select()
      .from(clinicMemberships)
      .where(and(eq(clinicMemberships.userId, userId), eq(clinicMemberships.active, true)));
  }

  async deleteClinicMembership(id: string): Promise<boolean> {
    const result = await db
      .update(clinicMemberships)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(clinicMemberships.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Owner operations
  async createOwner(owner: InsertOwner): Promise<Owner> {
    const [newOwner] = await db.insert(owners).values(owner).returning();
    return newOwner;
  }

  async getOwner(id: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner;
  }

  async getOwners(clinicId: string): Promise<Owner[]> {
    return await db
      .select()
      .from(owners)
      .where(eq(owners.clinicId, clinicId))
      .orderBy(asc(owners.name));
  }

  async searchOwners(clinicId: string, query: string): Promise<Owner[]> {
    return await db
      .select()
      .from(owners)
      .where(
        and(
          eq(owners.clinicId, clinicId),
          or(
            ilike(owners.name, `%${query}%`),
            ilike(owners.phone, `%${query}%`),
            ilike(owners.email, `%${query}%`)
          )
        )
      )
      .orderBy(asc(owners.name));
  }

  async updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | undefined> {
    const [updated] = await db
      .update(owners)
      .set({ ...owner, updatedAt: new Date() })
      .where(eq(owners.id, id))
      .returning();
    return updated;
  }

  async deleteOwner(id: string): Promise<boolean> {
    const result = await db.delete(owners).where(eq(owners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Patient operations
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatients(clinicId: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(eq(patients.clinicId, clinicId))
      .orderBy(asc(patients.name));
  }

  async getPatientsByOwner(ownerId: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(eq(patients.ownerId, ownerId))
      .orderBy(asc(patients.name));
  }

  async searchPatients(clinicId: string, query: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.clinicId, clinicId),
          or(
            ilike(patients.name, `%${query}%`),
            ilike(patients.breed, `%${query}%`),
            ilike(patients.microchip, `%${query}%`)
          )
        )
      )
      .orderBy(asc(patients.name));
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updated] = await db
      .update(patients)
      .set({ ...patient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return updated;
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointments(clinicId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId))
      .orderBy(desc(appointments.startsAt));
  }

  async getAppointmentsByProvider(providerId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.providerId, providerId))
      .orderBy(desc(appointments.startsAt));
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Encounter operations
  async createEncounter(encounter: InsertEncounter): Promise<Encounter> {
    const [newEncounter] = await db.insert(encounters).values(encounter).returning();
    return newEncounter;
  }

  async getEncounter(id: string): Promise<Encounter | undefined> {
    const [encounter] = await db.select().from(encounters).where(eq(encounters.id, id));
    return encounter;
  }

  async getEncounters(clinicId: string): Promise<Encounter[]> {
    return await db
      .select()
      .from(encounters)
      .where(eq(encounters.clinicId, clinicId))
      .orderBy(desc(encounters.createdAt));
  }

  async getEncountersByPatient(patientId: string): Promise<Encounter[]> {
    return await db
      .select()
      .from(encounters)
      .where(eq(encounters.patientId, patientId))
      .orderBy(desc(encounters.createdAt));
  }

  async updateEncounter(id: string, encounter: Partial<InsertEncounter>): Promise<Encounter | undefined> {
    const [updated] = await db
      .update(encounters)
      .set({ ...encounter, updatedAt: new Date() })
      .where(eq(encounters.id, id))
      .returning();
    return updated;
  }

  async deleteEncounter(id: string): Promise<boolean> {
    const result = await db.delete(encounters).where(eq(encounters.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Prescription operations
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db.insert(prescriptions).values(prescription).returning();
    return newPrescription;
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription;
  }

  async getPrescriptions(clinicId: string): Promise<Prescription[]> {
    return await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.clinicId, clinicId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updated] = await db
      .update(prescriptions)
      .set({ ...prescription, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return updated;
  }

  async deletePrescription(id: string): Promise<boolean> {
    const result = await db.delete(prescriptions).where(eq(prescriptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Prescription item operations
  async createPrescriptionItem(item: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const [newItem] = await db.insert(prescriptionItems).values(item).returning();
    return newItem;
  }

  async getPrescriptionItems(prescriptionId: string): Promise<PrescriptionItem[]> {
    return await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, prescriptionId));
  }

  async deletePrescriptionItem(id: string): Promise<boolean> {
    const result = await db.delete(prescriptionItems).where(eq(prescriptionItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
