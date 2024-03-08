import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Himanshu@10',
  database: 'CRM',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, values) {
  try {
    const [rows, fields] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error; // rethrow the error to be caught by the caller
  }
}

const BankServices = {
  approveBankAndAssignSubadmin: async (approvedBankRequest, subAdminId, isDeposit, isWithdraw) => {
    try {
      const insertBankDetails = `INSERT INTO Bank(bankName, accountHolderName, accountNumber, ifscCode, upiId, upiAppName, 
      upiNumber, subAdminName, isActive, bank_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertSubadmin = `INSERT INTO BankSubAdmins (bankId, subAdminId, isDeposit, isWithdraw) VALUES (?, ?, ?, ?)`;
      const promises = approvedBankRequest.map(async (row) => {
        // Insert bank details
        const result = await query(insertBankDetails, [
          row.bankName,
          row.accountHolderName,
          row.accountNumber,
          row.ifscCode,
          row.upiId,
          row.upiAppName,
          row.upiNumber,
          row.subAdminName,
          true,
          row.bank_id,
        ]);

        // Insert entry into BankSubAdmins table with correct bankId
        await query(insertSubadmin, [row.bank_id, subAdminId, isDeposit, isWithdraw]);
      });
      // Execute all promises concurrently
      await Promise.all(promises);
      return approvedBankRequest.length; // Return the number of rows inserted for further verification
    } catch (error) {
      throw error; // Propagate error to the caller
    }
  },

  deleteBankRequest: async (bankId) => {
    const deleteBankRequestQuery = `DELETE FROM BankRequest WHERE bank_id = ?`;
    const result = await query(deleteBankRequestQuery, [bankId]);
    return result.affectedRows; // Return the number of rows deleted for further verification
  },

  getBankRequests: async () => {
    try {
      const sql = 'SELECT * FROM BankRequest';
      const result = await query(sql);
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Internal Server error');
    }
  },

  updateBank: async (responese, data) => {
    const existingTransaction = responese[0];
    console.log('ext', existingTransaction);
    let changedFields = {};
    // Compare each field in the data object with the existingTransaction
    if (data.accountHolderName !== existingTransaction.accountHolderName) {
      changedFields.accountHolderName = data.accountHolderName;
    }
    if (data.bankName !== existingTransaction.bankName) {
      changedFields.bankName = data.bankName;
    }
    if (data.accountNumber !== existingTransaction.accountNumber) {
      changedFields.accountNumber = data.accountNumber;
    }
    if (data.ifscCode !== existingTransaction.ifscCode) {
      changedFields.ifscCode = data.ifscCode;
    }
    if (data.upiId !== existingTransaction.upiId) {
      changedFields.upiId = data.upiId;
    }
    if (data.upiAppName !== existingTransaction.upiAppName) {
      changedFields.upiAppName = data.upiAppName;
    }
    if (data.upiNumber !== existingTransaction.upiNumber) {
      changedFields.upiNumber = data.upiNumber;
    }

    const duplicateBank = await query(`SELECT * FROM Bank WHERE (bankName) = (?)`, [data.bankName]);
    console.log('duplicateBank', duplicateBank);
    if (duplicateBank.length > 0) {
      throw { code: 400, message: 'Bank name already exists!' };
    }
    // Create updatedTransactionData using a ternary operator
    const updatedTransactionData = {
      id: existingTransaction.id,
      accountHolderName:
        data.accountHolderName !== undefined ? data.accountHolderName : existingTransaction.accountHolderName,
      bankName: data.bankName !== undefined ? data.bankName : existingTransaction.bankName,
      accountNumber: data.accountNumber !== undefined ? data.accountNumber : existingTransaction.accountNumber,
      ifscCode: data.ifscCode !== undefined ? data.ifscCode : existingTransaction.ifscCode,
      upiId: data.upiId !== undefined ? data.upiId : existingTransaction.upiId,
      upiAppName: data.upiAppName !== undefined ? data.upiAppName : existingTransaction.upiAppName,
      upiNumber: data.upiNumber !== undefined ? data.upiNumber : existingTransaction.upiNumber,
    };
    console.log('update', updatedTransactionData);
    const editRequestQuery = `INSERT INTO EditBankRequest 
        (bankTransactionId, accountHolderName, bankName, accountNumber, ifscCode, upiId, upiAppName, upiNumber, changedFields, isApproved, type, message) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, 'Edit', "Bank Detail's has been edited")`;
    await query(editRequestQuery, [
      updatedTransactionData.id,
      updatedTransactionData.accountHolderName,
      updatedTransactionData.bankName,
      updatedTransactionData.accountNumber,
      updatedTransactionData.ifscCode,
      updatedTransactionData.upiId,
      updatedTransactionData.upiAppName,
      updatedTransactionData.upiNumber,
      JSON.stringify(changedFields),
    ]);
    return true;
  },

  getBankBalance: async (bankId) => {
    try {
      const bankTransactionsQuery = `SELECT * FROM BankTransaction WHERE bankId = ?`;
      const bankTransactions = await query(bankTransactionsQuery, [bankId]);

      const transactionsQuery = `SELECT * FROM Transaction WHERE bankId = ?`;
      const transactions = await query(transactionsQuery, [bankId]);

      const editTransactionQuery = `SELECT * FROM EditRequest WHERE bankId = ?`;
      const editTransaction = await query(editTransactionQuery, [bankId]);

      let balance = 0;

      bankTransactions.forEach((transaction) => {
        if (transaction.depositAmount) {
          balance += parseFloat(transaction.depositAmount);
        }
        if (transaction.withdrawAmount) {
          balance -= parseFloat(transaction.withdrawAmount);
        }
      });

      transactions.forEach((transaction) => {
        if (transaction.transactionType === 'Deposit') {
          balance += parseFloat(transaction.amount);
        } else {
          const totalBalance = balance - parseFloat(transaction.bankCharges) - parseFloat(transaction.amount);
          balance = totalBalance;
        }
      });

      editTransaction.forEach((data) => {
        if (data.transactionType === 'Manual-Bank-Deposit') {
          balance += parseFloat(data.depositAmount);
        }
        if (data.transactionType === 'Manual-Bank-Withdraw') {
          balance -= parseFloat(data.withdrawAmount);
        }
        if (data.transactionType === 'Deposit') {
          balance += parseFloat(data.amount);
        }
        if (data.transactionType === 'Withdraw') {
          const netAmount = balance - parseFloat(data.bankCharges) - data.bankCharges;
          balance = netAmount;
        }
      });

      return balance;
    } catch (error) {
      console.error('Error in getBankBalance:', error);
      throw error;
    }
  },
};

export default BankServices;
