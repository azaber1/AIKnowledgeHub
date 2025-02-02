import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles } from "@db/schema";
import { eq, ilike, or } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Protected API routes
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      const [article] = await db.insert(articles).values({
        title,
        content,
        authorId: req.user.id,
      }).returning();

      res.json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.get("/api/articles", async (req, res) => {
    try {
      const allArticles = await db.select().from(articles);
      res.json(allArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Important: Put search route before the :id route to avoid path conflicts
  app.get("/api/articles/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    try {
      console.log('Searching for:', q);
      const searchTerm = `%${q}%`; // Add wildcards for partial matches

      const searchResults = await db
        .select()
        .from(articles)
        .where(
          or(
            ilike(articles.title, searchTerm),
            ilike(articles.content, searchTerm)
          )
        )
        .limit(5);

      console.log('Search results:', searchResults);
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
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      const [article] = await db.update(articles)
        .set({ 
          title, 
          content,
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