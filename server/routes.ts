import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import { pipeline } from "@xenova/transformers";

// Initialize transformer pipeline
let embedder: any = null;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get embedding for text
  async function getEmbedding(text: string) {
    const model = await getEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  }

  // Protected API routes
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      const embedding = await getEmbedding(title + " " + content);

      const [article] = await db.insert(articles).values({
        title,
        content,
        embedding,
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

  app.get("/api/articles/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    try {
      const queryEmbedding = await getEmbedding(q);

      const results = await db.execute(sql`
        SELECT *, embedding <-> ${JSON.stringify(queryEmbedding)}::vector AS similarity 
        FROM articles 
        ORDER BY similarity ASC 
        LIMIT 5
      `);

      res.json(results);
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({ message: "Failed to search articles" });
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
      const embedding = await getEmbedding(title + " " + content);

      const [article] = await db.update(articles)
        .set({ title, content, embedding, updatedAt: new Date() })
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