import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getPrisma } from "../lib/prisma.js";
import { success, error } from "../utils/http.js";

const router = Router();

// GET /api/v1/todos - Get all todos for current user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const todos = await getPrisma().todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return success(res, 200, todos);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/todos - Create a new todo
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, priority, category, dueDate, xpReward } = req.body;
    if (!title || title.trim() === "") {
      return error(res, 400, "Title is required");
    }
    const todo = await getPrisma().todo.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        priority: priority || "medium",
        category: category || "general",
        xpReward: xpReward || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return success(res, 201, todo, "Todo created");
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/todos/:id - Update a todo
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed, priority, category, dueDate, xpReward } =
      req.body;

    const existing = await getPrisma().todo.findUnique({ where: { id } });
    if (!existing) return error(res, 404, "Todo not found");
    if (existing.userId !== req.user.id)
      return error(res, 403, "Not authorized");

    const data = {
      ...(title !== undefined && { title: title.trim() }),
      ...(completed !== undefined && { completed }),
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(xpReward !== undefined && { xpReward }),
    };
    if (completed !== undefined) {
      data.completedAt = completed ? new Date() : null;
    }

    const todo = await getPrisma().todo.update({ where: { id }, data });
    return success(res, 200, todo, "Todo updated");
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/todos/:id - Delete a todo
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await getPrisma().todo.findUnique({ where: { id } });
    if (!existing) return error(res, 404, "Todo not found");
    if (existing.userId !== req.user.id)
      return error(res, 403, "Not authorized");

    await getPrisma().todo.delete({ where: { id } });
    return success(res, 200, null, "Todo deleted");
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/todos/:id/toggle - Toggle todo completion
router.patch("/:id/toggle", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await getPrisma().todo.findUnique({ where: { id } });
    if (!existing) return error(res, 404, "Todo not found");
    if (existing.userId !== req.user.id)
      return error(res, 403, "Not authorized");

    const todo = await getPrisma().todo.update({
      where: { id },
      data: {
        completed: !existing.completed,
        completedAt: !existing.completed ? new Date() : null,
      },
    });
    return success(res, 200, todo, "Todo toggled");
  } catch (err) {
    next(err);
  }
});

export default router;
