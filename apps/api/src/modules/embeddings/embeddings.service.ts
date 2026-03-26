import type { FastifyInstance } from "fastify";

export class EmbeddingsService {
  constructor(private readonly app: FastifyInstance) {}

  async embedText(text: string): Promise<number[]> {
    if (!this.app.config.OPENAI_API_KEY) {
      return [];
    }

    const input = text.slice(0, 3000);
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.app.config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: this.app.config.OPENAI_EMBEDDING_MODEL,
        input,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`embedding request failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return payload.data[0]?.embedding ?? [];
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      return 0;
    }
    let dot = 0;
    let aNorm = 0;
    let bNorm = 0;
    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      aNorm += a[i] * a[i];
      bNorm += b[i] * b[i];
    }
    if (aNorm === 0 || bNorm === 0) {
      return 0;
    }
    return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
  }
}

