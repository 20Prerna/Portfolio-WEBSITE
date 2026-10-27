import { db } from "hatchable";

export const access = "public";
export const methods = ["POST"];

export default async function (req, res) {
  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";

  // Quietly accept honeypot submissions without saving them.
  if (website) return res.json({ ok: true });
  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: "Please enter a name between 2 and 120 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Please enter a valid email address." });
  const allowedGoals = ["Personalised nutrition guidance", "Meal planning", "Building healthier habits", "Something else"];
  if (!allowedGoals.includes(goal)) return res.status(400).json({ error: "Please select an enquiry topic." });
  if (message.length > 3000) return res.status(400).json({ error: "Please keep your message under 3000 characters." });

  await db.query(
    "INSERT INTO nutrition_enquiries (name, email, goal, message, source) VALUES ($1, $2, $3, $4, $5)",
    [name, email, goal, message || null, "website"]
  );
  return res.status(201).json({ ok: true, message: "Your enquiry has been received. Thank you!" });
}