import { db } from "hatchable";

export const access = "admin";
export const methods = ["GET", "PATCH"];

export default async function (req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query(
      "SELECT id, name, email, goal, message, created_at, status, source FROM nutrition_enquiries ORDER BY created_at DESC LIMIT 500"
    );
    return res.json({ enquiries: rows });
  }

  const body = req.body || {};
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const allowed = ["new", "contacted", "converted", "archived"];
  if (!/^[0-9a-f-]{36}$/i.test(id) || !allowed.includes(status)) {
    return res.status(400).json({ error: "A valid enquiry ID and status are required." });
  }
  const result = await db.query(
    "UPDATE nutrition_enquiries SET status = $1 WHERE id = $2 RETURNING id, status",
    [status, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Enquiry not found." });
  return res.json({ ok: true, enquiry: result.rows[0] });
}