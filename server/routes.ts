import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles, teams, teamMembers, users } from "@db/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Team Management Routes
  app.post("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    try {
      // Create team
      const [team] = await db.insert(teams)
        .values({
          name,
          ownerId: req.user.id,
        })
        .returning();

      // Add owner as team member
      await db.insert(teamMembers)
        .values({
          teamId: team.id,
          userId: req.user.id,
          role: 'owner',
        });

      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.get("/api/articles", async (req, res) => {
    try {
      let query = db.select().from(articles);

      // If authenticated, filter by team or personal articles
      if (req.isAuthenticated()) {
        const teamId = req.query.teamId;

        if (teamId) {
          // First verify user is a member of this team
          const [membership] = await db
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, parseInt(teamId as string)),
                eq(teamMembers.userId, req.user.id)
              )
            );

          if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
          }

          // Show team articles
          query = query.where(eq(articles.teamId, parseInt(teamId as string)));
        } else {
          // Show only personal articles (where user is author)
          query = query.where(eq(articles.authorId, req.user.id));
        }
      } else {
        // For unauthenticated users, only show public articles (if any)
        return res.json([]);
      }

      const allArticles = await query;
      res.json(allArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userTeams = await db
        .select({
          team: teams,
          role: teamMembers.role,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teams.id, teamMembers.teamId))
        .where(eq(teamMembers.userId, req.user.id));

      res.json(userTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/:teamId/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { teamId } = req.params;
    const { username } = req.body;

    try {
      // Check if user is team owner
      const [membership] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, parseInt(teamId)),
            eq(teamMembers.userId, req.user.id),
            eq(teamMembers.role, 'owner')
          )
        );

      if (!membership) {
        return res.status(403).json({ message: "Only team owners can add members" });
      }

      // Find user by username
      const [userToAdd] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const [existingMembership] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, parseInt(teamId)),
            eq(teamMembers.userId, userToAdd.id)
          )
        );

      if (existingMembership) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      // Add new team member
      const [newMember] = await db
        .insert(teamMembers)
        .values({
          teamId: parseInt(teamId),
          userId: userToAdd.id,
          role: 'member',
        })
        .returning();

      res.status(201).json(newMember);
    } catch (error) {
      console.error('Error adding team member:', error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { title, content, metadata, teamId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      // If teamId is provided, verify user is a team member
      if (teamId) {
        const [membership] = await db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.userId, req.user.id)
            )
          );

        if (!membership) {
          return res.status(403).json({ message: "Not a team member" });
        }
      }

      const [article] = await db.insert(articles).values({
        title,
        content,
        metadata,
        authorId: req.user.id,
        teamId: teamId || null,
      }).returning();

      res.json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.get("/api/articles/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    try {
      const searchTerm = `%${q}%`; // Add wildcards for partial matches

      // Start with the search condition
      const searchCondition = or(
        ilike(articles.title, searchTerm),
        ilike(articles.content, searchTerm)
      );

      // Add ownership condition if authenticated
      let ownershipCondition;
      if (req.isAuthenticated()) {
        const teamId = req.query.teamId;
        if (teamId) {
          // First verify user is a member of this team
          const [membership] = await db
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, parseInt(teamId as string)),
                eq(teamMembers.userId, req.user.id)
              )
            );

          if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
          }

          // Only show articles from this specific team
          ownershipCondition = eq(articles.teamId, parseInt(teamId as string));
        } else {
          // In personal space, show only personal articles (where teamId is null)
          ownershipCondition = and(
            eq(articles.authorId, req.user.id),
            eq(articles.teamId, null)
          );
        }
      }

      // Combine conditions
      const whereCondition = ownershipCondition
        ? and(searchCondition, ownershipCondition)
        : searchCondition;

      const searchResults = await db
        .select()
        .from(articles)
        .where(whereCondition)
        .limit(5);

      res.json(searchResults);
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, parseInt(id)))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { id } = req.params;
    const { title, content, metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      const [article] = await db.update(articles)
        .set({
          title,
          content,
          metadata,
          updatedAt: new Date()
        })
        .where(eq(articles.id, parseInt(id)))
        .returning();

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { id } = req.params;
    try {
      await db.delete(articles).where(eq(articles.id, parseInt(id)));
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}