const express = require("express");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();

router.use(authRequired);

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function cleanInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function cleanBoolean(value) {
  return value === true || value === "true";
}

function cleanSections(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((section, sectionIndex) => ({
    title: cleanText(section.title) || `Section ${sectionIndex + 1}`,
    description: cleanText(section.description),
    questions: Array.isArray(section.questions) ? section.questions.map((question, questionIndex) => ({
      prompt: cleanText(question.prompt) || `Question ${questionIndex + 1}`,
      answer_type: cleanText(question.answer_type) || "Pass/Fail",
      is_required: question.is_required !== false,
      scoring_weight: cleanInteger(question.scoring_weight) || 0,
      options: Array.isArray(question.options) ? question.options.map(cleanText).filter(Boolean) : []
    })) : []
  }));
}

function publicTemplate(row) {
  return {
    id: row.id,
    template_reference: row.template_reference,
    template_name: row.template_name,
    service_type: row.service_type,
    status: row.status,
    version_number: row.version_number,
    scoring_enabled: row.scoring_enabled,
    approval_required: row.approval_required,
    description: row.description,
    sections: row.sections || [],
    section_count: row.section_count,
    question_count: row.question_count,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'FORM-' || LPAD(nextval('form_template_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedTemplate(pool, id) {
  const result = await pool.query(
    `
    SELECT
      ft.*,
      jsonb_array_length(ft.sections) AS section_count,
      (
        SELECT COALESCE(SUM(jsonb_array_length(section_item -> 'questions')), 0)::INT
        FROM jsonb_array_elements(ft.sections) section_item
      ) AS question_count
    FROM form_templates ft
    WHERE ft.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.FORM_TEMPLATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const serviceType = cleanText(req.query.service_type);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        template_reference ILIKE $${values.length}
        OR template_name ILIKE $${values.length}
        OR description ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    if (serviceType) {
      values.push(serviceType);
      where.push(`service_type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        ft.*,
        jsonb_array_length(ft.sections) AS section_count,
        (
          SELECT COALESCE(SUM(jsonb_array_length(section_item -> 'questions')), 0)::INT
          FROM jsonb_array_elements(ft.sections) section_item
        ) AS question_count
      FROM form_templates ft
      ${whereSql}
      ORDER BY ft.updated_at DESC, ft.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      form_templates: result.rows.map(publicTemplate)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.FORM_TEMPLATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Draft')::INT AS draft,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE status = 'Archived')::INT AS archived,
        COUNT(*) FILTER (WHERE approval_required = TRUE)::INT AS approval_required
      FROM form_templates
      `
    );

    return res.json({
      ok: true,
      summary: result.rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", requirePermission(PERMISSIONS.FORM_TEMPLATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid form template ID" });
    }

    const template = await joinedTemplate(pool, id);

    if (!template) {
      return res.status(404).json({ ok: false, error: "Form template not found" });
    }

    return res.json({
      ok: true,
      form_template: publicTemplate(template)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.FORM_TEMPLATES_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const templateName = cleanText(req.body.template_name);

    if (!templateName) {
      return res.status(400).json({ ok: false, error: "Template name is required" });
    }

    const reference = cleanText(req.body.template_reference) || await nextReference(pool);
    const sections = cleanSections(req.body.sections);
    const result = await pool.query(
      `
      INSERT INTO form_templates (
        template_reference,
        template_name,
        service_type,
        status,
        version_number,
        scoring_enabled,
        approval_required,
        description,
        sections,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::JSONB, $10, $10)
      RETURNING *
      `,
      [
        reference,
        templateName,
        cleanText(req.body.service_type) || "Technical Compliance Audit",
        cleanText(req.body.status) || "Draft",
        cleanInteger(req.body.version_number) || 1,
        cleanBoolean(req.body.scoring_enabled),
        req.body.approval_required !== false,
        cleanText(req.body.description),
        JSON.stringify(sections),
        req.user.id
      ]
    );

    const template = await joinedTemplate(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "form_template.created",
      entityType: "form_template",
      entityId: result.rows[0].id,
      metadata: {
        template_reference: result.rows[0].template_reference,
        template_name: result.rows[0].template_name,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      form_template: publicTemplate(template)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Form template reference already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.FORM_TEMPLATES_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const templateName = cleanText(req.body.template_name);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid form template ID" });
    }

    if (!templateName) {
      return res.status(400).json({ ok: false, error: "Template name is required" });
    }

    const existing = await pool.query("SELECT * FROM form_templates WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Form template not found" });
    }

    const status = cleanText(req.body.status) || "Draft";

    if (status === "Active" && existing.rows[0].status !== "Active" && !hasPermission(req.user, PERMISSIONS.FORM_TEMPLATES_APPROVE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to approve form templates" });
    }

    const sections = cleanSections(req.body.sections);
    await pool.query(
      `
      UPDATE form_templates
      SET
        template_reference = $1,
        template_name = $2,
        service_type = $3,
        status = $4,
        version_number = $5,
        scoring_enabled = $6,
        approval_required = $7,
        description = $8,
        sections = $9::JSONB,
        updated_by = $10,
        updated_at = NOW()
      WHERE id = $11
      `,
      [
        cleanText(req.body.template_reference) || existing.rows[0].template_reference,
        templateName,
        cleanText(req.body.service_type) || "Technical Compliance Audit",
        status,
        cleanInteger(req.body.version_number) || existing.rows[0].version_number,
        cleanBoolean(req.body.scoring_enabled),
        req.body.approval_required !== false,
        cleanText(req.body.description),
        JSON.stringify(sections),
        req.user.id,
        id
      ]
    );

    const template = await joinedTemplate(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: status === "Active" && existing.rows[0].status !== "Active" ? "form_template.approved" : "form_template.updated",
      entityType: "form_template",
      entityId: id,
      metadata: {
        template_reference: template.template_reference,
        previous_status: existing.rows[0].status,
        status: template.status,
        version_number: template.version_number
      }
    });

    return res.json({
      ok: true,
      form_template: publicTemplate(template)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Form template reference already exists" });
    }

    return next(err);
  }
});

module.exports = router;
