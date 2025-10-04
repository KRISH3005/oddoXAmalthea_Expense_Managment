const pool = require('../utils/database');

// Helper: Get workflow for an expense
async function getExpenseWorkflow(expenseId) {
  const { rows: steps } = await pool.query(`
    SELECT ast.id, ast.step_order, ast.role, ast.approver_id, u.name AS approver_name,
      ast.is_current, ast.approved_at, ast.rejected_at, ast.comments, ar.rule_type,
      (
        SELECT COUNT(*) FROM expense_approvers ea WHERE ea.step_id = ast.id
      ) AS total_approvers,
      (
        SELECT COUNT(*) FROM expense_approvers ea WHERE ea.step_id = ast.id AND ea.approved_at IS NOT NULL
      ) AS approved_count
    FROM approval_steps ast
    LEFT JOIN users u ON ast.approver_id = u.id
    LEFT JOIN approval_rules ar ON ar.step_order = ast.step_order AND ar.company_id = (SELECT company_id FROM expenses WHERE id=$1)
    WHERE ast.expense_id = $1
    ORDER BY ast.step_order ASC
  `, [expenseId]);
  return steps;
}

// GET /api/approvals/pending
exports.getPendingApprovals = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.expense_id,
        a.status AS approval_status,
        a.comments,
        a.created_at,
        e.description,
        e.amount,
        e.currency,
        e.converted_amount,
        e.category,
        e.expense_date,
        e.receipt_url,
        e.status AS expense_status,
        u.name AS submitter_name
      FROM approvals a
      JOIN expenses e ON a.expense_id = e.id
      JOIN users u ON e.submitter_id = u.id
      WHERE a.approver_id = $1 AND a.status = 'Pending'
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    const approvals = await Promise.all(rows.map(async row => ({
      ...row,
      expense: {
        id: row.expense_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        converted_amount: row.converted_amount,
        category: row.category,
        expense_date: row.expense_date,
        receipt_url: row.receipt_url,
        status: row.expense_status,
      },
      submitter_name: row.submitter_name,
      workflow: await getExpenseWorkflow(row.expense_id),
    })));

    res.json({ approvals });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Failed to get pending approvals' });
  }
};

// GET /api/approvals/history
exports.getApprovalHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.expense_id,
        a.status AS approval_status,
        a.comments,
        a.approved_at,
        a.created_at,
        e.description,
        e.amount,
        e.currency,
        e.converted_amount,
        e.category,
        e.expense_date,
        e.receipt_url,
        e.status AS expense_status,
        u.name AS submitter_name
      FROM approvals a
      JOIN expenses e ON a.expense_id = e.id
      JOIN users u ON e.submitter_id = u.id
      WHERE a.approver_id = $1 AND a.status != 'Pending'
      ORDER BY a.approved_at DESC
    `, [req.user.id]);
    const approvals = await Promise.all(rows.map(async row => ({
      ...row,
      expense: {
        id: row.expense_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        converted_amount: row.converted_amount,
        category: row.category,
        expense_date: row.expense_date,
        receipt_url: row.receipt_url,
        status: row.expense_status,
      },
      submitter_name: row.submitter_name,
      workflow: await getExpenseWorkflow(row.expense_id),
    })));

    res.json({ approvals });
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ message: 'Failed to get approval history' });
  }
};

// POST /api/approvals/:expenseId/approve
exports.approveExpense = async (req, res) => {
  const { expenseId } = req.params;
  const { comments } = req.body;
  const userId = req.user.id;

  try {
    await pool.query('BEGIN');

    // Get current step for the expense/user
    const { rows: steps } = await pool.query(`
      SELECT ast.*, ar.rule_type
      FROM approval_steps ast
      JOIN approval_rules ar ON ar.step_order = ast.step_order
      WHERE ast.expense_id = $1 AND ast.is_current = true AND
        ((ast.approver_id = $2) OR
        EXISTS (SELECT 1 FROM expense_approvers ea WHERE ea.step_id = ast.id AND ea.approver_id = $2))
      LIMIT 1
    `, [expenseId, userId]);
    if (steps.length === 0) throw new Error('No current step found for user');

    const step = steps[0];

    if (step.rule_type === 'sequential') {
      await pool.query(`
        UPDATE approval_steps SET approved_at = now(), comments = $1 WHERE id = $2
      `, [comments || '', step.id]);

      const { rows: nextStep } = await pool.query(`
        SELECT * FROM approval_steps WHERE expense_id = $1 AND step_order > $2 ORDER BY step_order ASC LIMIT 1
      `, [expenseId, step.step_order]);
      if (nextStep.length > 0) {
        await pool.query(`UPDATE approval_steps SET is_current = false WHERE id = $1`, [step.id]);
        await pool.query(`UPDATE approval_steps SET is_current = true WHERE id = $1`, [nextStep[0].id]);
      } else {
        await pool.query(`
          UPDATE expenses SET approval_status = 'approved', approved_at = now() WHERE id = $1
        `, [expenseId]);
      }
    } else if (step.rule_type === 'percentage') {
      await pool.query(`
        UPDATE expense_approvers SET approved_at = now()
        WHERE expense_id = $1 AND step_id = $2 AND approver_id = $3
      `, [expenseId, step.id, userId]);
      const { rows: tRows } = await pool.query(`
        SELECT COUNT(*) AS total
        FROM expense_approvers WHERE expense_id = $1 AND step_id = $2
      `, [expenseId, step.id]);
      const { rows: aRows } = await pool.query(`
        SELECT COUNT(*) AS approved
        FROM expense_approvers WHERE expense_id = $1 AND step_id = $2 AND approved_at IS NOT NULL
      `, [expenseId, step.id]);
      const total = parseInt(tRows[0].total);
      const approved = parseInt(aRows[0].approved);

      const { rows: thresholdRows } = await pool.query(`
        SELECT threshold FROM approval_rules WHERE step_order = $1
        LIMIT 1
      `, [step.step_order]);
      const threshold = thresholdRows.length ? parseInt(thresholdRows[0].threshold) : 50;

      if ((approved / total) * 100 >= threshold) {
        await pool.query(`
          UPDATE approval_steps SET approved_at = now(), comments = $1 WHERE id = $2
        `, [comments || 'Threshold met', step.id]);
        const { rows: nextStep } = await pool.query(`
          SELECT * FROM approval_steps WHERE expense_id = $1 AND step_order > $2 ORDER BY step_order ASC LIMIT 1
        `, [expenseId, step.step_order]);
        if (nextStep.length > 0) {
          await pool.query(`UPDATE approval_steps SET is_current = false WHERE id = $1`, [step.id]);
          await pool.query(`UPDATE approval_steps SET is_current = true WHERE id = $1`, [nextStep[0].id]);
        } else {
          await pool.query(`UPDATE expenses SET approval_status = 'approved', approved_at = now() WHERE id = $1`, [expenseId]);
        }
      }
    }

    await pool.query('COMMIT');
    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: error.message || 'Failed to approve expense' });
  }
};

// POST /api/approvals/:expenseId/reject
exports.rejectExpense = async (req, res) => {
  const { expenseId } = req.params;
  const { comments } = req.body;
  const userId = req.user.id;

  if (!comments) return res.status(400).json({ message: 'Comments required for rejection' });

  try {
    await pool.query('BEGIN');
    const { rows: stepRows } = await pool.query(`
      SELECT id, step_order FROM approval_steps
      WHERE expense_id = $1 AND is_current = true AND
        ((approver_id = $2) OR
        EXISTS (SELECT 1 FROM expense_approvers ea WHERE ea.step_id = approval_steps.id AND ea.approver_id = $2))
      LIMIT 1
    `, [expenseId, userId]);
    if (stepRows.length === 0) throw new Error('No approval step found for user');
    const stepId = stepRows[0].id, stepOrder = stepRows[0].step_order;

    await pool.query(`
      UPDATE approval_steps SET rejected_at = now(), comments = $1 WHERE id = $2
    `, [comments, stepId]);
    await pool.query(`
      UPDATE approval_steps SET is_current = false WHERE expense_id = $1 AND step_order > $2
    `, [expenseId, stepOrder]);
    await pool.query(`UPDATE expenses SET approval_status = 'rejected' WHERE id = $1`, [expenseId]);
    await pool.query('COMMIT');
    res.json({ message: 'Expense rejected successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: error.message || 'Failed to reject expense' });
  }
};
