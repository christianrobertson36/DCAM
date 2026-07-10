const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
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

function cleanDate(value) {
  const text = cleanText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function publicStaffProfile(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name,
    email: row.email,
    role: row.role,
    user_status: row.user_status,
    job_title: row.job_title,
    employment_type: row.employment_type,
    phone: row.phone,
    skills: row.skills,
    service_areas: row.service_areas,
    working_hours: row.working_hours,
    availability_status: row.availability_status,
    competency_notes: row.competency_notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expiring_qualifications: row.expiring_qualifications
  };
}

function publicQualification(row) {
  return {
    id: row.id,
    staff_profile_id: row.staff_profile_id,
    qualification_name: row.qualification_name,
    issuing_body: row.issuing_body,
    certificate_number: row.certificate_number,
    issue_date: row.issue_date,
    expiry_date: row.expiry_date,
    status: row.status,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function joinedProfile(pool, profileId) {
  const result = await pool.query(
    `
    SELECT
      sp.*,
      u.name AS user_name,
      u.email,
      u.role,
      u.status AS user_status,
      COUNT(sq.id) FILTER (
        WHERE sq.expiry_date IS NOT NULL
        AND sq.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
      )::INT AS expiring_qualifications
    FROM staff_profiles sp
    JOIN users u ON u.id = sp.user_id
    LEFT JOIN staff_qualifications sq ON sq.staff_profile_id = sp.id
    WHERE sp.id = $1
    GROUP BY sp.id, u.id
    LIMIT 1
    `,
    [profileId]
  );

  return result.rows[0];
}

router.get("/users", requirePermission(PERMISSIONS.STAFF_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT id, name, email, role, status
      FROM users
      WHERE role IN ('Engineer', 'Technician', 'Subcontractor')
      ORDER BY name ASC
      `
    );

    return res.json({
      ok: true,
      users: result.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/", requirePermission(PERMISSIONS.STAFF_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const role = cleanText(req.query.role);
    const availability = cleanText(req.query.availability_status);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        u.name ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
        OR sp.job_title ILIKE $${values.length}
        OR sp.skills ILIKE $${values.length}
        OR sp.service_areas ILIKE $${values.length}
      )`);
    }

    if (role) {
      values.push(role);
      where.push(`u.role = $${values.length}`);
    }

    if (availability) {
      values.push(availability);
      where.push(`sp.availability_status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        sp.*,
        u.name AS user_name,
        u.email,
        u.role,
        u.status AS user_status,
        COUNT(sq.id) FILTER (
          WHERE sq.expiry_date IS NOT NULL
          AND sq.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
        )::INT AS expiring_qualifications
      FROM staff_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN staff_qualifications sq ON sq.staff_profile_id = sp.id
      ${whereSql}
      GROUP BY sp.id, u.id
      ORDER BY u.name ASC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      staff_profiles: result.rows.map(publicStaffProfile)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.STAFF_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE u.role = 'Engineer')::INT AS engineers,
        COUNT(*) FILTER (WHERE u.role = 'Technician')::INT AS technicians,
        COUNT(*) FILTER (WHERE sp.availability_status = 'Available')::INT AS available,
        COUNT(*) FILTER (WHERE sp.availability_status = 'Unavailable')::INT AS unavailable
      FROM staff_profiles sp
      JOIN users u ON u.id = sp.user_id
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

router.post("/", requirePermission(PERMISSIONS.STAFF_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = cleanInteger(req.body.user_id);

    if (!userId) {
      return res.status(400).json({ ok: false, error: "User is required" });
    }

    const values = [
      userId,
      cleanText(req.body.job_title),
      cleanText(req.body.employment_type) || "Employee",
      cleanText(req.body.phone),
      cleanText(req.body.skills),
      cleanText(req.body.service_areas),
      cleanText(req.body.working_hours),
      cleanText(req.body.availability_status) || "Available",
      cleanText(req.body.competency_notes),
      req.user.id
    ];

    const result = await pool.query(
      `
      INSERT INTO staff_profiles (
        user_id,
        job_title,
        employment_type,
        phone,
        skills,
        service_areas,
        working_hours,
        availability_status,
        competency_notes,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING *
      `,
      values
    );

    const profile = await joinedProfile(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "staff_profile.created",
      entityType: "staff_profile",
      entityId: result.rows[0].id,
      metadata: {
        user_id: result.rows[0].user_id,
        availability_status: result.rows[0].availability_status
      }
    });

    return res.status(201).json({
      ok: true,
      staff_profile: publicStaffProfile(profile)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Staff profile already exists for this user" });
    }
    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.STAFF_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid staff profile ID" });
    }

    const existing = await pool.query("SELECT * FROM staff_profiles WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Staff profile not found" });
    }

    const values = [
      cleanText(req.body.job_title),
      cleanText(req.body.employment_type) || "Employee",
      cleanText(req.body.phone),
      cleanText(req.body.skills),
      cleanText(req.body.service_areas),
      cleanText(req.body.working_hours),
      cleanText(req.body.availability_status) || "Available",
      cleanText(req.body.competency_notes),
      req.user.id,
      id
    ];

    await pool.query(
      `
      UPDATE staff_profiles
      SET
        job_title = $1,
        employment_type = $2,
        phone = $3,
        skills = $4,
        service_areas = $5,
        working_hours = $6,
        availability_status = $7,
        competency_notes = $8,
        updated_by = $9,
        updated_at = NOW()
      WHERE id = $10
      `,
      values
    );

    const profile = await joinedProfile(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "staff_profile.updated",
      entityType: "staff_profile",
      entityId: id,
      metadata: {
        user_id: profile.user_id,
        previous_availability_status: existing.rows[0].availability_status,
        availability_status: profile.availability_status
      }
    });

    return res.json({
      ok: true,
      staff_profile: publicStaffProfile(profile)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/qualifications", requirePermission(PERMISSIONS.STAFF_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid staff profile ID" });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM staff_qualifications
      WHERE staff_profile_id = $1
      ORDER BY expiry_date ASC NULLS LAST, qualification_name ASC
      `,
      [id]
    );

    return res.json({
      ok: true,
      qualifications: result.rows.map(publicQualification)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/:id/qualifications", requirePermission(PERMISSIONS.STAFF_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const qualificationName = cleanText(req.body.qualification_name);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid staff profile ID" });
    }

    if (!qualificationName) {
      return res.status(400).json({ ok: false, error: "Qualification name is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO staff_qualifications (
        staff_profile_id,
        qualification_name,
        issuing_body,
        certificate_number,
        issue_date,
        expiry_date,
        status,
        notes,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      RETURNING *
      `,
      [
        id,
        qualificationName,
        cleanText(req.body.issuing_body),
        cleanText(req.body.certificate_number),
        cleanDate(req.body.issue_date),
        cleanDate(req.body.expiry_date),
        cleanText(req.body.status) || "Valid",
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "staff_qualification.created",
      entityType: "staff_qualification",
      entityId: result.rows[0].id,
      metadata: {
        staff_profile_id: id,
        qualification_name: result.rows[0].qualification_name,
        expiry_date: result.rows[0].expiry_date
      }
    });

    return res.status(201).json({
      ok: true,
      qualification: publicQualification(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
