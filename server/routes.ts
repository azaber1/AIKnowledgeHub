import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles } from "@db/schema";
import { eq } from "drizzle-orm";
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
    return Array.from(output.data);
  }

  // Protected API routes
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { title, content } = req.body;
    const embedding = await getEmbedding(title + " " + content);
    
    const [article] = await db.insert(articles).values({
      title,
      content,
      embedding,
      authorId: req.user.id,
    }).returning();
    
    res.json(article);
  });

  app.get("/api/articles", async (req, res) => {
    const allArticles = await db.select().from(articles);
    res.json(allArticles);
  });

  app.get("/api/articles/search", async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).send("Query parameter required");
    }

    const queryEmbedding = await getEmbedding(query);
    
    const results = await db.query.articles.findMany({
      orderBy: (articles, { sql }) => sql`"embedding" <-> ${queryEmbedding}::vector`,
      limit: 5,
    });

    res.json(results);
  });

  app.put("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { id } = req.params;
    const { title, content } = req.body;
    const embedding = await getEmbedding(title + " " + content);

    const [article] = await db.update(articles)
      .set({ title, content, embedding, updatedAt: new Date() })
      .where(eq(articles.id, parseInt(id)))
      .returning();

    res.json(article);
  });

  app.delete("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { id } = req.params;
    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
