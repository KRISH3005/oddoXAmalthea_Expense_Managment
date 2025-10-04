const pool = require('../utils/database');

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

        // Check if there are more steps
        const nextStepResult = await pool.query(`
            SELECT * FROM approval_steps 
            WHERE expense_id = $1 
            AND step_order > $2
            ORDER BY step_order ASC 
            LIMIT 1
        `, [expenseId, sequentialStep.rows[0].step_order]);

        if (nextStepResult.rows.length > 0) {
            // Mark current step as not current
            await pool.query(`
                UPDATE approval_steps 
                SET is_current = false 
                WHERE id = $1
            `, [stepId]);
            
            // Mark next step as current
            await pool.query(`
                UPDATE approval_steps 
                SET is_current = true 
                WHERE id = $1
            `, [nextStepResult.rows[0].id]);
        } else {
            // No more steps - approve expense
            await pool.query(`
                UPDATE expenses 
                SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `, [expenseId]);
        }
        
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
            const totalQuery = await pool.query(`
                SELECT COUNT(*) as total FROM expense_approvers 
                WHERE expense_id = $1 AND step_id = $2
            `, [expenseId, step_id]);
            
            const approvedQuery = await pool.query(`
                SELECT COUNT(*) as approved FROM expense_approvers 
                WHERE expense_id = $1 AND step_id = $2 AND approved_at IS NOT NULL
            `, [expenseId, step_id]);
            
            const total = parseInt(totalQuery.rows[0].total);
            const approved = parseInt(approvedQuery.rows[0].approved);
            
            // Get threshold from approval_rules (default 50%)
            const thresholdQuery = await pool.query(`
                SELECT ar.threshold 
                FROM approval_steps ast
                JOIN approval_rules ar ON ar.step_order = ast.step_order
                JOIN expenses e ON e.id = ast.expense_id
                WHERE ast.id = $1 AND ar.company_id = e.company_id
            `, [step_id]);
            
            const threshold = thresholdQuery.rows[0]?.threshold || 50;
            const percentageApproved = (approved / total) * 100;
            
            if (percentageApproved >= threshold) {
                // Mark step as approved and check for next steps
                await pool.query(`
                    UPDATE approval_steps 
                    SET approved_at = CURRENT_TIMESTAMP, comments = $1 
                    WHERE id = $2
                `, [comments || 'Percentage threshold met', step_id]);
                
                // Check for next steps
                const nextStepResult = await pool.query(`
                    SELECT * FROM approval_steps 
                    WHERE expense_id = $1 
                    AND step_order > (
                        SELECT step_order FROM approval_steps WHERE id = $2
                    )
                    ORDER BY step_order ASC 
                    LIMIT 1
                `, [expenseId, step_id]);
                
                if (nextStepResult.rows.length > 0) {
                    // Mark current step as not current
                    await pool.query(`
                        UPDATE approval_steps 
                        SET is_current = false 
                        WHERE id = $1
                    `, [step_id]);
                    
                    // Mark next step as current
                    await pool.query(`
                        UPDATE approval_steps 
                        SET is_current = true 
                        WHERE id = $1
                    `, [nextStepResult.rows[0].id]);
                } else {
                    // No more steps - approve expense
                    await pool.query(`
                        UPDATE expenses 
                        SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP 
                        WHERE id = $1
                    `, [expenseId]);
                }
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

const rejectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;

    if (!comments) {
      return res.status(400).json({ message: 'Comments are required for rejection' });
    }

    await pool.query('BEGIN');

    // Check if this is a sequential approval
    const sequentialStep = await pool.query(`
        SELECT * FROM approval_steps 
        WHERE expense_id = $1 AND approver_id = $2 AND is_current = true
    `, [expenseId, userId]);

    if (sequentialStep.rows.length > 0) {
        // Sequential rejection
        const stepId = sequentialStep.rows[0].id;
        
        await pool.query(`
            UPDATE approval_steps 
            SET rejected_at = CURRENT_TIMESTAMP, comments = $1 
            WHERE id = $2
        `, [comments, stepId]);

        // Reject the expense
        await pool.query(`
            UPDATE expenses 
            SET approval_status = 'rejected' 
            WHERE id = $1
        `, [expenseId]);
        
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
                SET rejected_at = CURRENT_TIMESTAMP 
                WHERE expense_id = $1 AND approver_id = $2
            `, [expenseId, userId]);

            // Reject the expense
            await pool.query(`
                UPDATE expenses 
                SET approval_status = 'rejected' 
                WHERE id = $1
            `, [expenseId]);
        } else {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'No pending approval found for this user' });
        }
    }

    await pool.query('COMMIT');
    res.json({ message: 'Expense rejected successfully' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Reject expense error:', error);
    res.status(500).json({ message: 'Failed to reject expense' });
  }
};

const getCompanyPendingApprovals = async (req, res) => {
  try {
    const { role } = req.user;
    
    if (!['Admin', 'Manager'].includes(role)) {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    const query = `
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
        WHERE ast.is_current = true 
        AND ast.approved_at IS NULL 
        AND ast.rejected_at IS NULL
        AND e.approval_status = 'pending'
        
        UNION
        
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
        WHERE ast.is_current = true
        AND e.approval_status = 'pending'
        
        ORDER BY step_created_at DESC
    `;

    const result = await pool.query(query);

    const approvals = result.rows.map(row => ({
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
    console.error('Get company pending approvals error:', error);
    res.status(500).json({ message: 'Failed to get company pending approvals' });
  }
};

module.exports = {
  getPendingApprovals,
  getApprovalHistory,
  approveExpense,
  rejectExpense,
  getCompanyPendingApprovals
};

