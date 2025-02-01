import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles } from "@db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get embedding using OpenAI
async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}

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
      console.log('Searching for:', q);
      const queryEmbedding = await getEmbedding(q);
      console.log('Generated embedding');

      // Calculate cosine similarity with a higher threshold
      const searchResults = await db.execute(sql`
        WITH similarity_results AS (
          SELECT 
            id, 
            title, 
            content, 
            metadata, 
            created_at as "createdAt", 
            updated_at as "updatedAt", 
            author_id as "authorId",
            1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
          FROM articles
        )
        SELECT *
        FROM similarity_results
        WHERE similarity > 0.7
        ORDER BY similarity DESC
        LIMIT 5
      `);

      console.log('Search results:', searchResults.rows);
      res.json(searchResults.rows);
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