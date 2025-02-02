import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles, teams, teamMembers, users } from "@db/schema";
import { eq, ilike, or, and, desc, sql } from "drizzle-orm";

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
      if (!req.isAuthenticated()) {
        return res.json([]);
      }

      const teamId = req.query.teamId;
      let result;

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

        // Get team articles - all articles in the team space
        result = await db
          .select({
            id: articles.id,
            title: articles.title,
            content: articles.content,
            metadata: articles.metadata,
            createdAt: articles.createdAt,
            updatedAt: articles.updatedAt,
            authorId: articles.authorId,
            teamId: articles.teamId,
          })
          .from(articles)
          .where(eq(articles.teamId, parseInt(teamId as string)))
          .orderBy(desc(articles.createdAt));

      } else {
        // In personal space, show only user's personal articles
        result = await db
          .select({
            id: articles.id,
            title: articles.title,
            content: articles.content,
            metadata: articles.metadata,
            createdAt: articles.createdAt,
            updatedAt: articles.updatedAt,
            authorId: articles.authorId,
            teamId: articles.teamId,
          })
          .from(articles)
          .where(
            and(
              eq(articles.authorId, req.user.id),
              // Use IS NULL for checking null values
              sql`${articles.teamId} IS NULL`
            )
          )
          .orderBy(desc(articles.createdAt));
      }

      // Add debug logging
      console.log('Query params:', { userId: req.user.id, teamId: teamId || 'personal' });
      console.log('Fetched articles:', result?.length || 0, 'articles');
      console.log('First article (if any):', result?.[0]);

      return res.json(result || []);
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
      if (teamId !== null && teamId !== undefined) {
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

      console.log('Created article:', { id: article.id, title, teamId: teamId || 'personal' });
      res.json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  // Update search endpoint with similar logic
  app.get("/api/articles/search", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json([]);
    }

    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    try {
      const searchTerm = `%${q}%`;
      const searchCondition = or(
        ilike(articles.title, searchTerm),
        ilike(articles.content, searchTerm)
      );

      const teamId = req.query.teamId;

      if (teamId) {
        // Verify team membership
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

        // Search team articles
        const teamArticles = await db
          .select()
          .from(articles)
          .where(
            and(
              searchCondition,
              eq(articles.teamId, parseInt(teamId as string))
            )
          )
          .orderBy(desc(articles.createdAt))
          .limit(5);

        return res.json(teamArticles);
      } else {
        // Search all personal articles (no team)
        const personalArticles = await db
          .select()
          .from(articles)
          .where(
            and(
              searchCondition,
              eq(articles.authorId, req.user.id),
              sql`${articles.teamId} IS NULL`
            )
          )
          .orderBy(desc(articles.createdAt))
          .limit(5);

        return res.json(personalArticles);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    const { id } = req.params;

    try {
      // First get the article
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, parseInt(id)))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // If article belongs to a team, verify user's team membership
      if (article.teamId) {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const [membership] = await db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, article.teamId),
              eq(teamMembers.userId, req.user.id)
            )
          );

        if (!membership) {
          return res.status(403).json({ message: "Not authorized to view this article" });
        }
      } else {
        // For personal articles, only the author can view them
        if (!req.isAuthenticated() || article.authorId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized to view this article" });
        }
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