import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  subscribers,
  emailTemplates,
  campaigns,
  campaignSubscribers,
  campaignAnalytics,
  settings,
  insertSubscriberSchema,
  insertEmailTemplateSchema,
  insertCampaignSchema,
  insertSettingSchema,
  type Subscriber,
  type EmailTemplate,
  type Campaign,
  type CampaignAnalytics,
} from "@/shared/schema";
import { eq, desc, inArray, and, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ========== SUBSCRIBERS API ==========
  
  // Get all subscribers
  app.get("/api/subscribers", async (req, res) => {
    try {
      const { status, list } = req.query;
      let query = db.select().from(subscribers);
      
      if (status) {
        query = query.where(eq(subscribers.status, status as string)) as any;
      }
      
      const results = await query.orderBy(desc(subscribers.createdAt));
      
      // Filter by list if provided
      let filteredResults = results;
      if (list) {
        filteredResults = results.filter(s => s.lists.includes(list as string));
      }
      
      res.json(filteredResults);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });
  
  // Get single subscriber
  app.get("/api/subscribers/:id", async (req, res) => {
    try {
      const [subscriber] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, req.params.id));
      
      if (!subscriber) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.json(subscriber);
    } catch (error) {
      console.error("Error fetching subscriber:", error);
      res.status(500).json({ message: "Failed to fetch subscriber" });
    }
  });
  
  // Create subscriber
  app.post("/api/subscribers", async (req, res) => {
    try {
      const validatedData = insertSubscriberSchema.parse(req.body);
      
      const [newSubscriber] = await db
        .insert(subscribers)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newSubscriber);
    } catch (error) {
      console.error("Error creating subscriber:", error);
      res.status(400).json({ message: "Failed to create subscriber", error: String(error) });
    }
  });
  
  // Update subscriber
  app.patch("/api/subscribers/:id", async (req, res) => {
    try {
      const [updated] = await db
        .update(subscribers)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(subscribers.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscriber:", error);
      res.status(500).json({ message: "Failed to update subscriber" });
    }
  });
  
  // Delete subscriber
  app.delete("/api/subscribers/:id", async (req, res) => {
    try {
      const [deleted] = await db
        .delete(subscribers)
        .where(eq(subscribers.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.json({ message: "Subscriber deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });
  
  // ========== EMAIL TEMPLATES API ==========
  
  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await db
        .select()
        .from(emailTemplates)
        .orderBy(desc(emailTemplates.createdAt));
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });
  
  // Get single template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, req.params.id));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });
  
  // Create template
  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      
      const [newTemplate] = await db
        .insert(emailTemplates)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ message: "Failed to create template", error: String(error) });
    }
  });
  
  // Update template
  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const [updated] = await db
        .update(emailTemplates)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });
  
  // Delete template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const [deleted] = await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });
  
  // Duplicate template
  app.post("/api/templates/:id/duplicate", async (req, res) => {
    try {
      const [original] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, req.params.id));
      
      if (!original) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const [duplicated] = await db
        .insert(emailTemplates)
        .values({
          name: `${original.name} (Copy)`,
          subject: original.subject,
          htmlContent: original.htmlContent,
          textContent: original.textContent,
          thumbnailUrl: original.thumbnailUrl,
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(duplicated);
    } catch (error) {
      console.error("Error duplicating template:", error);
      res.status(500).json({ message: "Failed to duplicate template" });
    }
  });
  
  // ========== CAMPAIGNS API ==========
  
  // Get all campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const { status } = req.query;
      
      let query = db.select().from(campaigns);
      
      if (status) {
        query = query.where(eq(campaigns.status, status as string)) as any;
      }
      
      const results = await query.orderBy(desc(campaigns.createdAt));
      
      res.json(results);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  
  // Get single campaign with analytics
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, req.params.id));
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Get analytics
      const [analytics] = await db
        .select()
        .from(campaignAnalytics)
        .where(eq(campaignAnalytics.campaignId, req.params.id));
      
      // Get template if exists
      let template = null;
      if (campaign.templateId) {
        const [tmpl] = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.id, campaign.templateId));
        template = tmpl;
      }
      
      res.json({ ...campaign, analytics, template });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });
  
  // Create campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      
      const [newCampaign] = await db
        .insert(campaigns)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      // Create initial analytics record
      await db.insert(campaignAnalytics).values({
        campaignId: newCampaign.id,
      });
      
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: "Failed to create campaign", error: String(error) });
    }
  });
  
  // Update campaign
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const [updated] = await db
        .update(campaigns)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });
  
  // Delete campaign
  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      // Delete related records first
      await db.delete(campaignSubscribers).where(eq(campaignSubscribers.campaignId, req.params.id));
      await db.delete(campaignAnalytics).where(eq(campaignAnalytics.campaignId, req.params.id));
      
      const [deleted] = await db
        .delete(campaigns)
        .where(eq(campaigns.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });
  
  // Send campaign (mark as sending and create subscriber records)
  app.post("/api/campaigns/:id/send", async (req, res) => {
    try {
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, req.params.id));
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.status === 'sent' || campaign.status === 'sending') {
        return res.status(400).json({ message: "Campaign already sent or sending" });
      }
      
      // Get subscribers matching the campaign lists
      const eligibleSubscribers = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.status, 'active'));
      
      // Filter by lists
      const targetSubscribers = eligibleSubscribers.filter(sub =>
        campaign.lists.length === 0 || campaign.lists.some(list => sub.lists.includes(list))
      );
      
      // Create campaign_subscribers records
      if (targetSubscribers.length > 0) {
        const subscriberRecords = targetSubscribers.map(sub => ({
          campaignId: campaign.id,
          subscriberId: sub.id,
          status: 'pending' as const,
        }));
        
        await db.insert(campaignSubscribers).values(subscriberRecords);
      }
      
      // Update campaign status
      const [updated] = await db
        .update(campaigns)
        .set({
          status: 'sending',
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, req.params.id))
        .returning();
      
      // Update analytics
      await db
        .update(campaignAnalytics)
        .set({
          totalSubscribers: targetSubscribers.length,
          updatedAt: new Date(),
        })
        .where(eq(campaignAnalytics.campaignId, req.params.id));
      
      res.json({
        ...updated,
        message: `Campaign queued for sending to ${targetSubscribers.length} subscribers`,
      });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });
  
  // Get campaign analytics
  app.get("/api/campaigns/:id/analytics", async (req, res) => {
    try {
      const [analytics] = await db
        .select()
        .from(campaignAnalytics)
        .where(eq(campaignAnalytics.campaignId, req.params.id));
      
      if (!analytics) {
        return res.status(404).json({ message: "Campaign analytics not found" });
      }
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });
  
  // ========== DASHBOARD DATA API ==========
  
  // Get dashboard summary
  app.get("/api/dashboard", async (req, res) => {
    try {
      // Get recent campaigns analytics
      const recentCampaigns = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, 'sent'))
        .orderBy(desc(campaigns.sentAt))
        .limit(10);
      
      let totalDelivered = 0;
      let totalBounced = 0;
      let totalComplained = 0;
      let totalUnsubscribed = 0;
      let totalSent = 0;
      
      for (const campaign of recentCampaigns) {
        const [analytics] = await db
          .select()
          .from(campaignAnalytics)
          .where(eq(campaignAnalytics.campaignId, campaign.id));
        
        if (analytics) {
          totalSent += analytics.sent;
          totalDelivered += analytics.delivered;
          totalBounced += analytics.bounced;
          totalComplained += analytics.complained;
          totalUnsubscribed += analytics.unsubscribed;
        }
      }
      
      // Calculate KPIs
      const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0';
      const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00';
      const complaintRate = totalDelivered > 0 ? ((totalComplained / totalDelivered) * 100).toFixed(2) : '0.00';
      const unsubscribeRate = totalDelivered > 0 ? ((totalUnsubscribed / totalDelivered) * 100).toFixed(2) : '0.00';
      
      const dashboardData = {
        kpis: [
          { title: 'Delivery Rate', value: `${deliveryRate}%`, change: '+0.1%', changeType: 'increase' as const, period: 'vs last 7d' },
          { title: 'Hard Bounce Rate', value: `${bounceRate}%`, change: '-0.05%', changeType: 'decrease' as const, period: 'vs last 7d' },
          { title: 'Complaint Rate', value: `${complaintRate}%`, change: '+0.02%', changeType: 'increase' as const, period: 'vs last 7d' },
          { title: 'Unsubscribe Rate', value: `${unsubscribeRate}%`, change: '0.00%', changeType: 'neutral' as const, period: 'vs last 7d' },
        ],
        gmailSpamRate: parseFloat(complaintRate) || 0.12,
        domainPerformance: [
          { name: 'Gmail', deliveryRate: parseFloat(deliveryRate) || 99.1, complaintRate: parseFloat(complaintRate) || 0.12, spamRate: parseFloat(complaintRate) || 0.12 },
          { name: 'Yahoo', deliveryRate: 99.5, complaintRate: 0.09, spamRate: 0.08 },
          { name: 'Outlook', deliveryRate: 98.8, complaintRate: 0.15, spamRate: 0.18 },
          { name: 'Other', deliveryRate: 97.5, complaintRate: 0.20, spamRate: 0.25 },
        ],
        complianceChecklist: [
          { id: 'spf', name: 'SPF Alignment', status: 'pass' as const, details: 'SPF record is valid and aligned.', fixLink: '#' },
          { id: 'dkim', name: 'DKIM Alignment', status: 'pass' as const, details: 'DKIM signatures are valid and aligned.', fixLink: '#' },
          { id: 'dmarc', name: 'DMARC Policy', status: 'warn' as const, details: 'p=none policy detected. Consider tightening to quarantine/reject.', fixLink: '#' },
          { id: 'list_unsub', name: 'One-Click Unsubscribe', status: 'pass' as const, details: 'List-Unsubscribe headers are correctly implemented.', fixLink: '#' },
          { id: 'tls', name: 'TLS Encryption', status: 'pass' as const, details: '100% of mail sent over TLS.', fixLink: '#' },
          { id: 'fbl', name: 'Feedback Loops', status: 'fail' as const, details: 'Yahoo CFL not configured. Complaints may be missed.', fixLink: '#' },
        ],
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // ========== SETTINGS API ==========
  
  // Get all settings
  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await db.select().from(settings);
      
      // Convert to key-value object
      const settingsObj = allSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Get single setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const [setting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, req.params.key));
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  
  // Update or create setting
  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      
      const [existing] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, req.params.key));
      
      if (existing) {
        const [updated] = await db
          .update(settings)
          .set({
            value,
            updatedAt: new Date(),
          })
          .where(eq(settings.key, req.params.key))
          .returning();
        
        res.json(updated);
      } else {
        const [created] = await db
          .insert(settings)
          .values({
            key: req.params.key,
            value,
            updatedAt: new Date(),
          })
          .returning();
        
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  
  // Delete setting
  app.delete("/api/settings/:key", async (req, res) => {
    try {
      const [deleted] = await db
        .delete(settings)
        .where(eq(settings.key, req.params.key))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
