const pool = require('../utils/database');

// Helper function to check if percentage threshold is met
const checkPercentageThreshold = async (expenseId, stepId) => {
    const totalQuery = await pool.query(`
        SELECT COUNT(*) as total FROM expense_approvers 
        WHERE expense_id = $1 AND step_id = $2
    `, [expenseId, stepId]);
    
    const approvedQuery = await pool.query(`
        SELECT COUNT(*) as approved FROM expense_approvers 
        WHERE expense_id = $1 AND step_id = $2 AND approved_at IS NOT NULL
    `, [expenseId, stepId]);
    
    const total = parseInt(totalQuery.rows[0].total);
    const approved = parseInt(approvedQuery.rows[0].approved);
    
    // Get threshold from approval_rules
    const thresholdQuery = await pool.query(`
        SELECT ar.threshold 
        FROM approval_steps ast
        JOIN approval_rules ar ON ar.step_order = ast.step_order
        JOIN expenses e ON e.id = ast.expense_id
        WHERE ast.id = $1 AND ar.company_id = e.company_id
    `, [stepId]);
    
    const threshold = thresholdQuery.rows[0]?.threshold || 50;
    const percentageApproved = (approved / total) * 100;
    
    return percentageApproved >= threshold;
};

// Helper function to advance workflow to next step
const advanceWorkflow = async (expenseId) => {
    // Mark current step as not current
    await pool.query(`
        UPDATE approval_steps 
        SET is_current = false 
        WHERE expense_id = $1 AND is_current = true
    `, [expenseId]);
    
    // Find next step
    const nextStepResult = await pool.query(`
        SELECT * FROM approval_steps 
        WHERE expense_id = $1 
        AND step_order > (
            SELECT MAX(step_order) FROM approval_steps 
            WHERE expense_id = $1 AND is_current = false
        )
        ORDER BY step_order ASC 
        LIMIT 1
    `, [expenseId]);
    
    if (nextStepResult.rows.length > 0) {
        // Mark next step as current
        await pool.query(`
            UPDATE approval_steps 
            SET is_current = true 
            WHERE id = $1
        `, [nextStepResult.rows[0].id]);
        return false; // More steps remain
    } else {
        // No more steps - approve expense
        await pool.query(`
            UPDATE expenses 
            SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP 
            WHERE id = $1
        `, [expenseId]);
        return true; // Workflow complete
    }
};

// GET /api/approvals/pending - Get pending approvals for current user
const getPendingApprovals = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get sequential approvals where user is current approver
        const sequentialQuery = `
            SELECT DISTINCT
                ast.id as approval_step_id,
                ast.expense_id,
                ast.step_order,
                ast.comments,
                ast.created_at as step_created_at,
                e.description,
                e.amount,
                e.currency,
                e.converted_amount,
                e.category,
                e.expense_date,
                e.receipt_url,
                e.approval_status,
                u.name as submitter_name,
                'sequential' as approval_type
            FROM approval_steps ast
            JOIN expenses e ON ast.expense_id = e.id
            JOIN users u ON e.submitter_id = u.id
            WHERE ast.approver_id = $1 
            AND ast.is_current = true 
            AND ast.approved_at IS NULL 
            AND ast.rejected_at IS NULL
            AND e.approval_status = 'pending'
        `;

        // Get percentage-based approvals where user can approve
        const percentageQuery = `
            SELECT DISTINCT
                ea.id as expense_approver_id,
                ea.expense_id,
                ast.step_order,
                ast.created_at as step_created_at,
                e.description,
                e.amount,
                e.currency,
                e.converted_amount,
                e.category,
                e.expense_date,
                e.receipt_url,
                e.approval_status,
                u.name as submitter_name,
                'percentage' as approval_type,
                (SELECT COUNT(*) FROM expense_approvers WHERE expense_id = ea.expense_id AND step_id = ea.step_id) as total_approvers,
                (SELECT COUNT(*) FROM expense_approvers WHERE expense_id = ea.expense_id AND step_id = ea.step_id AND approved_at IS NOT NULL) as approved_count
            FROM expense_approvers ea
            JOIN approval_steps ast ON ea.step_id = ast.id
            JOIN expenses e ON ea.expense_id = e.id
            JOIN users u ON e.submitter_id = u.id
            WHERE ea.approver_id = $1 
            AND ea.approved_at IS NULL
            AND ast.is_current = true
            AND e.approval_status = 'pending'
        `;

        const [sequentialResult, percentageResult] = await Promise.all([
            pool.query(sequentialQuery, [userId]),
            pool.query(percentageQuery, [userId])
        ]);

        const approvals = [
            ...sequentialResult.rows,
            ...percentageResult.rows
        ].map(row => ({
            id: row.approval_step_id || row.expense_approver_id,
            expense: {
                id: row.expense_id,
                description: row.description,
                amount: row.amount,
                currency: row.currency,
                converted_amount: row.converted_amount,
                category: row.category,
                expense_date: row.expense_date,
                receipt_url: row.receipt_url,
                status: row.approval_status
            },
            submitter_name: row.submitter_name,
            step_order: row.step_order,
            approval_type: row.approval_type,
            total_approvers: row.total_approvers,
            approved_count: row.approved_count,
            created_at: row.step_created_at
        }));

        res.json({ approvals });

    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ message: 'Failed to get pending approvals' });
    }
};

// GET /api/approvals/history - Get approval history for current user
const getApprovalHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT DISTINCT
                ast.id as approval_step_id,
                ast.expense_id,
                ast.step_order,
                ast.approved_at,
                ast.rejected_at,
                ast.comments,
                ast.created_at as step_created_at,
                e.description,
                e.amount,
                e.currency,
                e.converted_amount,
                e.category,
                e.expense_date,
                e.receipt_url,
                e.approval_status,
                u.name as submitter_name,
                CASE 
                    WHEN ast.approved_at IS NOT NULL THEN 'approved'
                    WHEN ast.rejected_at IS NOT NULL THEN 'rejected'
                    ELSE 'pending'
                END as action_taken
            FROM approval_steps ast
            JOIN expenses e ON ast.expense_id = e.id
            JOIN users u ON e.submitter_id = u.id
            WHERE ast.approver_id = $1 
            AND (ast.approved_at IS NOT NULL OR ast.rejected_at IS NOT NULL)
            
            UNION
            
            SELECT DISTINCT
                ea.id as approval_step_id,
                ea.expense_id,
                ast.step_order,
                ea.approved_at,
                NULL as rejected_at,
                NULL as comments,
                ea.created_at as step_created_at,
                e.description,
                e.amount,
                e.currency,
                e.converted_amount,
                e.category,
                e.expense_date,
                e.receipt_url,
                e.approval_status,
                u.name as submitter_name,
                'approved' as action_taken
            FROM expense_approvers ea
            JOIN approval_steps ast ON ea.step_id = ast.id
            JOIN expenses e ON ea.expense_id = e.id
            JOIN users u ON e.submitter_id = u.id
            WHERE ea.approver_id = $1 
            AND ea.approved_at IS NOT NULL
            
            ORDER BY approved_at DESC, rejected_at DESC, step_created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        const approvals = result.rows.map(row => ({
            id: row.approval_step_id,
            expense: {
                id: row.expense_id,
                description: row.description,
                amount: row.amount,
                currency: row.currency,
                converted_amount: row.converted_amount,
                category: row.category,
                expense_date: row.expense_date,
                receipt_url: row.receipt_url,
                status: row.approval_status
            },
            submitter_name: row.submitter_name,
            step_order: row.step_order,
            action_taken: row.action_taken,
            approved_at: row.approved_at,
            rejected_at: row.rejected_at,
            comments: row.comments,
            created_at: row.step_created_at
        }));

        res.json({ approvals });

    } catch (error) {
        console.error('Get approval history error:', error);
        res.status(500).json({ message: 'Failed to get approval history' });
    }
};

// POST /api/approvals/:expenseId/approve - Approve expense
const approveExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { comments } = req.body;
        const userId = req.user.id;

        await pool.query('BEGIN');

        // Check if this is a sequential approval
        const sequentialStep = await pool.query(`
            SELECT * FROM approval_steps 
            WHERE expense_id = $1 AND approver_id = $2 AND is_current = true
        `, [expenseId, userId]);

        if (sequentialStep.rows.length > 0) {
            // Sequential approval
            const stepId = sequentialStep.rows[0].id;
            
            await pool.query(`
                UPDATE approval_steps 
                SET approved_at = CURRENT_TIMESTAMP, comments = $1 
                WHERE id = $2
            `, [comments || '', stepId]);

            const workflowComplete = await advanceWorkflow(expenseId);
            
        } else {
            // Check if this is a percentage approval
            const percentageApproval = await pool.query(`
                SELECT ea.*, ast.id as step_id FROM expense_approvers ea
                JOIN approval_steps ast ON ea.step_id = ast.id
                WHERE ea.expense_id = $1 AND ea.approver_id = $2 AND ea.approved_at IS NULL
            `, [expenseId, userId]);

            if (percentageApproval.rows.length > 0) {
                const { step_id } = percentageApproval.rows[0];
                
                await pool.query(`
                    UPDATE expense_approvers 
                    SET approved_at = CURRENT_TIMESTAMP 
                    WHERE expense_id = $1 AND approver_id = $2
                `, [expenseId, userId]);

                // Check if percentage threshold is met
                const thresholdMet = await checkPercentageThreshold(expenseId, step_id);
                
                if (thresholdMet) {
                    // Mark step as approved and advance workflow
                    await pool.query(`
                        UPDATE approval_steps 
                        SET approved_at = CURRENT_TIMESTAMP, comments = $1 
                        WHERE id = $2
                    `, [comments || 'Percentage threshold met', step_id]);
                    
                    await advanceWorkflow(expenseId);
                }
            } else {
                await pool.query('ROLLBACK');
                return res.status(404).json({ message: 'No pending approval found for this user' });
            }
        }

        await pool.query('COMMIT');
        res.json({ message: 'Expense approved successfully' });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Approve expense error:', error);
        res.status(500).json({ message: 'Failed to approve expense' });
    }
};

// POST /api/approvals/:expenseId/reject - Reject expense
const rejectExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { comments } = req.body;
        const userId = req.user.id;

        if (!comments) {
            return res.status(400).json({ message: 'Comments are required for rejection' });
        }

        await pool.query('BEGIN');

        // Update the current step as rejected
        await pool.query(`
            UPDATE approval_steps 
            SET rejected_at = CURRENT_TIMESTAMP, comments = $1 
            WHERE expense_id = $2 AND (approver_id = $3 OR EXISTS (
                SELECT 1 FROM expense_approvers ea 
                WHERE ea.step_id = approval_steps.id AND ea.approver_id = $3
            ))
            AND is_current = true
        `, [comments, expenseId, userId]);

        // Mark all pending steps as inactive
        await pool.query(`
            UPDATE approval_steps 
            SET is_current = false 
            WHERE expense_id = $1
        `, [expenseId]);

        // Update expense status to rejected
        await pool.query(`
            UPDATE expenses 
            SET approval_status = 'rejected' 
            WHERE id = $1
        `, [expenseId]);

        await pool.query('COMMIT');
        res.json({ message: 'Expense rejected successfully' });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Reject expense error:', error);
        res.status(500).json({ message: 'Failed to reject expense' });
    }
};

// GET /api/approvals/company/pending - Get all pending approvals for company (Admin/Manager view)
const getCompanyPendingApprovals = async (req, res) => {
    try {
        const { role, company_id } = req.user;

        if (!['admin', 'manager', 'cfo'].includes(role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const query = `
            SELECT DISTINCT
                e.id as expense_id,
                e.description,
                e.amount,
                e.currency,
                e.converted_amount,
                e.category,
                e.expense_date,
                e.receipt_url,
                e.approval_status,
                e.created_at,
                u.name as submitter_name,
                ast.step_order,
                CASE 
                    WHEN ast.approver_id IS NOT NULL THEN u_approver.name
                    WHEN ast.role = 'percentage_approvers' THEN 'Multiple Approvers'
                    ELSE 'Unknown'
                END as current_approver,
                ast.is_manager_approver
            FROM expenses e
            JOIN users u ON e.submitter_id = u.id
            LEFT JOIN approval_steps ast ON e.id = ast.expense_id AND ast.is_current = true
            LEFT JOIN users u_approver ON ast.approver_id = u_approver.id
            WHERE e.company_id = $1 
            AND e.approval_status = 'pending'
            ORDER BY e.created_at DESC
        `;

        const result = await pool.query(query, [company_id]);

        const approvals = result.rows.map(row => ({
            expense: {
                id: row.expense_id,
                description: row.description,
                amount: row.amount,
                currency: row.currency,
                converted_amount: row.converted_amount,
                category: row.category,
                expense_date: row.expense_date,
                receipt_url: row.receipt_url,
                status: row.approval_status
            },
            submitter_name: row.submitter_name,
            current_approver: row.current_approver,
            step_order: row.step_order,
            is_manager_approver: row.is_manager_approver,
            created_at: row.created_at
        }));

        res.json({ approvals });

    } catch (error) {
        console.error('Get company pending approvals error:', error);
        res.status(500).json({ message: 'Failed to get company pending approvals' });
    }
};

// After creating new expense (just after inserting into expenses table!)
async function initializeApprovalWorkflow(expenseId, companyId) {
  // Get the expense to find the submitter
  const { rows: [expense] } = await pool.query(`
    SELECT submitter_id FROM expenses WHERE id = $1
  `, [expenseId]);

  if (!expense) {
    throw new Error('Expense not found');
  }

  // Get company rules (ordered)
  const { rows: rules } = await pool.query(`
    SELECT * FROM approval_rules 
    WHERE company_id = $1 AND active = TRUE 
    ORDER BY step_order ASC
  `, [companyId]);

  // Check if any rule requires manager approval first
  const managerApproverRule = rules.find(rule => rule.is_manager_approver);
  
  if (managerApproverRule) {
    // Get the submitter's manager
    const { rows: [submitter] } = await pool.query(`
      SELECT manager_id FROM users WHERE id = $1
    `, [expense.submitter_id]);

    if (submitter && submitter.manager_id) {
      // Create manager approval step first
      const { rows: [managerStep] } = await pool.query(`
        INSERT INTO approval_steps (expense_id, step_order, role, approver_id, is_current)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        expenseId,
        0, // Step 0 for manager approval
        'Manager',
        submitter.manager_id,
        true // Manager step is current
      ]);

      console.log(`Manager approval step created for expense ${expenseId}, manager: ${submitter.manager_id}`);
    }
  }

  for (const rule of rules) {
    // Skip manager approver rules as they're handled above
    if (rule.is_manager_approver) {
      continue;
    }

    // Insert approval_step for each step
    const { rows: [step] } = await pool.query(`
      INSERT INTO approval_steps (expense_id, step_order, role, is_current)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      expenseId,
      rule.step_order,
      rule.special_role,
      rule.step_order === 1 && !managerApproverRule // 1st step is_current only if no manager approval
    ]);

    // For 'percentage' (parallel), insert all approvers in expense_approvers
    if (rule.rule_type === 'percentage') {
      // Find all users for this role in the company
      const { rows: approvers } = await pool.query(`
        SELECT id FROM users WHERE role = $1 AND company_id = $2
      `, [rule.special_role, companyId]);
      for (const approver of approvers) {
        await pool.query(`
          INSERT INTO expense_approvers (expense_id, step_id, approver_id)
          VALUES ($1, $2, $3)
        `, [expenseId, step.id, approver.id]);
      }
    } else if (rule.rule_type === 'specific') {
      // For 'specific', find and assign the approver for this step
      const { rows: approvers } = await pool.query(`
        SELECT id FROM users WHERE role = $1 AND company_id = $2
      `, [rule.special_role, companyId]);
      
      if (approvers.length > 0) {
        // Assign the first approver found for this role
        await pool.query(`
          UPDATE approval_steps SET approver_id = $1 WHERE id = $2
        `, [approvers[0].id, step.id]);
      }
    } else if (rule.rule_type === 'hybrid') {
      // For 'hybrid', find all users for this role and add them to expense_approvers
      const { rows: approvers } = await pool.query(`
        SELECT id FROM users WHERE role = $1 AND company_id = $2
      `, [rule.special_role, companyId]);
      
      for (const approver of approvers) {
        await pool.query(`
          INSERT INTO expense_approvers (expense_id, step_id, approver_id)
          VALUES ($1, $2, $3)
        `, [expenseId, step.id, approver.id]);
      }
    }
  }
}


module.exports = {
    getPendingApprovals,
    getApprovalHistory,
    approveExpense,
    rejectExpense,
    getCompanyPendingApprovals,
    initializeApprovalWorkflow
};
