import { Hono } from "hono";
import { cors } from 'hono/cors'
import { eq } from 'drizzle-orm';
import { drizzle } from "drizzle-orm/d1"; 
import { images } from "./schema";
import type { D1Database } from "@cloudflare/workers-types";

interface GasSuccessResponse {
  success: boolean;
  fileId: string;
  imageUrl: string;
}

interface GasErrorResponse {
  error: string;
}

type GasResponse = GasSuccessResponse | GasErrorResponse;

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

function generateId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

app.use('*', cors({
  origin: '*',
}))

app.post("/", async (c) => {
  try {
    const { scriptId } = await c.req.parseBody()
    const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`

    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded or invalid file" }, 400);
    }
    
    if (!file.type.startsWith('image/')) {
      return c.json({ error: "Uploaded file is not an image" }, 400);
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const gasResponse = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: base64Data,
        filename: file.name,
        contentType: file.type
      })
    });
    
    if (!gasResponse.ok) {
      throw new Error(`GAS API error: ${gasResponse.statusText}`);
    }
    
    const gasData = await gasResponse.json() as GasResponse;
    
    if ('error' in gasData) {
      throw new Error(`GAS API error: ${gasData.error}`);
    }
    
    const imageUrl = gasData.imageUrl;
    
    const id = generateId(8);
    
    const db = drizzle(c.env.DB);
    
    await db.insert(images).values({
      id,
      url: imageUrl,
    });

	const baseUrl = new URL(c.req.url).origin;
	const accessUrl = `${baseUrl}/${id}`;
    
    return c.json({ 
      success: true,
      id,
	  url: accessUrl,
    });
    
  } catch (e: any) {
    console.error(e);
    return c.json(
      { error: e.message },
      500,
    );
  }
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const db = drizzle(c.env.DB);
    const image = await db.select().from(images).where(eq(images.id, id));
    
    if (!image.length) {
      return c.json({ error: "Image not found" }, 404);
    }
    
    const response = await fetch(image[0].url);
    const contentType = response.headers.get('content-type');
    const imageData = await response.arrayBuffer();
    
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType || 'image/jpeg'
      }
    });
  } catch(e: any) {
    console.error(e);
    return c.json(
      { error: e.message },
      500,
    );
  }
});

export default app;