import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertClinicSchema,
  insertOwnerSchema,
  insertPatientSchema,
  insertAppointmentSchema,
  insertEncounterSchema,
  insertPrescriptionSchema,
  insertPrescriptionItemSchema,
  insertClinicMembershipSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // Clinic routes
  app.post('/api/clinics', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(data);
      res.status(201).json(clinic);
    } catch (error) {
      console.error("Error creating clinic:", error);
      res.status(400).json({ message: "Erro ao criar clínica" });
    }
  });

  app.get('/api/clinics', isAuthenticated, async (req: any, res) => {
    try {
      const clinics = await storage.getClinics();
      res.json(clinics);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ message: "Erro ao buscar clínicas" });
    }
  });

  app.get('/api/clinics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clínica não encontrada" });
      }
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ message: "Erro ao buscar clínica" });
    }
  });

  app.put('/api/clinics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertClinicSchema.partial().parse(req.body);
      const clinic = await storage.updateClinic(req.params.id, data);
      if (!clinic) {
        return res.status(404).json({ message: "Clínica não encontrada" });
      }
      res.json(clinic);
    } catch (error) {
      console.error("Error updating clinic:", error);
      res.status(400).json({ message: "Erro ao atualizar clínica" });
    }
  });

  app.delete('/api/clinics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteClinic(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Clínica não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting clinic:", error);
      res.status(500).json({ message: "Erro ao excluir clínica" });
    }
  });

  // Clinic membership routes
  app.post('/api/clinic-memberships', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertClinicMembershipSchema.parse(req.body);
      const membership = await storage.createClinicMembership(data);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error creating clinic membership:", error);
      res.status(400).json({ message: "Erro ao criar vinculação" });
    }
  });

  app.get('/api/clinics/:clinicId/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const memberships = await storage.getClinicMemberships(req.params.clinicId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching clinic memberships:", error);
      res.status(500).json({ message: "Erro ao buscar vinculações" });
    }
  });

  app.get('/api/users/:userId/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const memberships = await storage.getUserMemberships(req.params.userId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching user memberships:", error);
      res.status(500).json({ message: "Erro ao buscar vinculações do usuário" });
    }
  });

  // Owner routes
  app.post('/api/owners', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertOwnerSchema.parse(req.body);
      const owner = await storage.createOwner(data);
      res.status(201).json(owner);
    } catch (error) {
      console.error("Error creating owner:", error);
      res.status(400).json({ message: "Erro ao criar tutor" });
    }
  });

  app.get('/api/clinics/:clinicId/owners', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.search as string;
      let owners;
      if (query) {
        owners = await storage.searchOwners(req.params.clinicId, query);
      } else {
        owners = await storage.getOwners(req.params.clinicId);
      }
      res.json(owners);
    } catch (error) {
      console.error("Error fetching owners:", error);
      res.status(500).json({ message: "Erro ao buscar tutores" });
    }
  });

  app.get('/api/owners/:id', isAuthenticated, async (req: any, res) => {
    try {
      const owner = await storage.getOwner(req.params.id);
      if (!owner) {
        return res.status(404).json({ message: "Tutor não encontrado" });
      }
      res.json(owner);
    } catch (error) {
      console.error("Error fetching owner:", error);
      res.status(500).json({ message: "Erro ao buscar tutor" });
    }
  });

  app.put('/api/owners/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertOwnerSchema.partial().parse(req.body);
      const owner = await storage.updateOwner(req.params.id, data);
      if (!owner) {
        return res.status(404).json({ message: "Tutor não encontrado" });
      }
      res.json(owner);
    } catch (error) {
      console.error("Error updating owner:", error);
      res.status(400).json({ message: "Erro ao atualizar tutor" });
    }
  });

  app.delete('/api/owners/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteOwner(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Tutor não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting owner:", error);
      res.status(500).json({ message: "Erro ao excluir tutor" });
    }
  });

  // Patient routes
  app.post('/api/patients', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(data);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(400).json({ message: "Erro ao criar paciente" });
    }
  });

  app.get('/api/clinics/:clinicId/patients', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.search as string;
      let patients;
      if (query) {
        patients = await storage.searchPatients(req.params.clinicId, query);
      } else {
        patients = await storage.getPatients(req.params.clinicId);
      }
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Erro ao buscar pacientes" });
    }
  });

  app.get('/api/owners/:ownerId/patients', isAuthenticated, async (req: any, res) => {
    try {
      const patients = await storage.getPatientsByOwner(req.params.ownerId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching owner patients:", error);
      res.status(500).json({ message: "Erro ao buscar pacientes do tutor" });
    }
  });

  app.get('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Paciente não encontrado" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Erro ao buscar paciente" });
    }
  });

  app.put('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, data);
      if (!patient) {
        return res.status(404).json({ message: "Paciente não encontrado" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(400).json({ message: "Erro ao atualizar paciente" });
    }
  });

  app.delete('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deletePatient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Paciente não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Erro ao excluir paciente" });
    }
  });

  // Appointment routes
  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: "Erro ao criar agendamento" });
    }
  });

  app.get('/api/clinics/:clinicId/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const appointments = await storage.getAppointments(req.params.clinicId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.get('/api/providers/:providerId/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const appointments = await storage.getAppointmentsByProvider(req.params.providerId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching provider appointments:", error);
      res.status(500).json({ message: "Erro ao buscar agendamentos do veterinário" });
    }
  });

  app.get('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Erro ao buscar agendamento" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, data);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: "Erro ao atualizar agendamento" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteAppointment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Erro ao excluir agendamento" });
    }
  });

  // Encounter routes
  app.post('/api/encounters', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertEncounterSchema.parse(req.body);
      const encounter = await storage.createEncounter(data);
      res.status(201).json(encounter);
    } catch (error) {
      console.error("Error creating encounter:", error);
      res.status(400).json({ message: "Erro ao criar consulta" });
    }
  });

  app.get('/api/clinics/:clinicId/encounters', isAuthenticated, async (req: any, res) => {
    try {
      const encounters = await storage.getEncounters(req.params.clinicId);
      res.json(encounters);
    } catch (error) {
      console.error("Error fetching encounters:", error);
      res.status(500).json({ message: "Erro ao buscar consultas" });
    }
  });

  app.get('/api/patients/:patientId/encounters', isAuthenticated, async (req: any, res) => {
    try {
      const encounters = await storage.getEncountersByPatient(req.params.patientId);
      res.json(encounters);
    } catch (error) {
      console.error("Error fetching patient encounters:", error);
      res.status(500).json({ message: "Erro ao buscar consultas do paciente" });
    }
  });

  app.get('/api/encounters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ message: "Consulta não encontrada" });
      }
      res.json(encounter);
    } catch (error) {
      console.error("Error fetching encounter:", error);
      res.status(500).json({ message: "Erro ao buscar consulta" });
    }
  });

  app.put('/api/encounters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertEncounterSchema.partial().parse(req.body);
      const encounter = await storage.updateEncounter(req.params.id, data);
      if (!encounter) {
        return res.status(404).json({ message: "Consulta não encontrada" });
      }
      res.json(encounter);
    } catch (error) {
      console.error("Error updating encounter:", error);
      res.status(400).json({ message: "Erro ao atualizar consulta" });
    }
  });

  // Prescription routes
  app.post('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(data);
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(400).json({ message: "Erro ao criar prescrição" });
    }
  });

  app.get('/api/clinics/:clinicId/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const prescriptions = await storage.getPrescriptions(req.params.clinicId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Erro ao buscar prescrições" });
    }
  });

  app.get('/api/prescriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: "Prescrição não encontrada" });
      }
      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Erro ao buscar prescrição" });
    }
  });

  // Prescription item routes
  app.post('/api/prescription-items', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPrescriptionItemSchema.parse(req.body);
      const item = await storage.createPrescriptionItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating prescription item:", error);
      res.status(400).json({ message: "Erro ao criar item da prescrição" });
    }
  });

  app.get('/api/prescriptions/:prescriptionId/items', isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getPrescriptionItems(req.params.prescriptionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching prescription items:", error);
      res.status(500).json({ message: "Erro ao buscar itens da prescrição" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
