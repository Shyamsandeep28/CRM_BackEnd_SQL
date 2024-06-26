import connectToDB from '../db/db.js';

const WebsiteServices = {
  approveWebsiteAndAssignSubadmin: async (approvedWebsiteRequest, subAdmins) => {
    const pool = await connectToDB();
    try {
      const insertWebsiteDetails = `INSERT INTO Website (website_id, websiteName, subAdminName, isActive) 
      VALUES (?, ?, ?, ?)`;
      const insertSubadmin = `INSERT INTO WebsiteSubAdmins (websiteId, subAdminId, isDeposit, isWithdraw, isEdit, 
      isRenew, isDelete) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await pool.query(insertWebsiteDetails, [
        approvedWebsiteRequest[0].website_id,
        approvedWebsiteRequest[0].websiteName,
        approvedWebsiteRequest[0].subAdminName,
        true,
      ]);
      await Promise.all(
        subAdmins.map(async (subAdmin) => {
          const { subAdminId, isWithdraw, isDeposit, isEdit, isRenew, isDelete } = subAdmin;
          // Insert subadmin details
          await pool.query(insertSubadmin, [
            approvedWebsiteRequest[0].website_id,
            subAdminId,
            isDeposit,
            isWithdraw,
            isEdit,
            isRenew,
            isDelete,
          ]);
        }),
      );
      return subAdmins.length;
    } catch (error) {
      throw error; // Propagate error to the caller
    }
  },

  deleteWebsiteRequest: async (websiteId) => {
    const pool = await connectToDB();
    const deleteWebsiteRequestQuery = `DELETE FROM WebsiteRequest WHERE website_id = ?`;
    const result = await pool.execute(deleteWebsiteRequestQuery, [websiteId]);
    return result.affectedRows; // Return the number of rows deleted for further verification
  },

  getBankRequests: async () => {
    const pool = await connectToDB();
    try {
      const sql = 'SELECT * FROM BankRequest';
      const result = await pool.execute(sql);
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Internal Server error');
    }
  },

  getWebsiteBalance: async (pool, websiteId) => {
    // const pool = await connectToDB();
    try {
      const websiteTransactionsQuery = `SELECT * FROM WebsiteTransaction WHERE websiteId = ?`;
      const [websiteTransactions] = await pool.execute(websiteTransactionsQuery, [websiteId]);

      const transactionsQuery = `SELECT * FROM Transaction WHERE websiteId = ?`;
      const [transactions] = await pool.execute(transactionsQuery, [websiteId]);

      let balance = 0;

      for (const transaction of websiteTransactions) {
        if (transaction.depositAmount) {
          balance += parseFloat(transaction.depositAmount);
        }
        if (transaction.withdrawAmount) {
          balance -= parseFloat(transaction.withdrawAmount);
        }
      }

      for (const transaction of transactions) {
        if (transaction.transactionType === 'Deposit') {
          balance -= parseFloat(transaction.bonus) + parseFloat(transaction.amount);
        } else {
          balance += parseFloat(transaction.amount);
        }
      }

      return balance;
    } catch (e) {
      console.error(e);
      throw e; // Rethrow the error to handle it at the calling site
    }
  },

  updateWebsite: async (response, data) => {
    const pool = await connectToDB();
    const existingRequest = response;
    console.log('existingRequest', existingRequest);
    if (!existingRequest) {
      throw { code: 404, message: `Website not found with id: ${existingRequest}` };
    }

    // Check if the website has already been edited
    const [editHistory] = await pool.execute(`SELECT * FROM EditWebsiteRequest WHERE website_id = ?`, [
      existingRequest,
    ]);
    if (editHistory.length > 0) {
      throw { code: 400, message: `Website with id ${existingRequest} has already been edited.` };
    }

    let changedFields = {};

    // Compare each field in the data object with the existingTransaction
    if (data.websiteName !== existingRequest.websiteName) {
      changedFields.websiteName = data.websiteName;
    }

    // Check if the new website name already exists (case-insensitive)
    const [duplicateWebsite] = await pool.execute(`SELECT * FROM Website WHERE LOWER(websiteName) = LOWER(?)`, [
      data.websiteName,
    ]);
    if (duplicateWebsite.length > 0) {
      throw { code: 400, message: 'Website name already exists in Website' };
    }

    const [duplicateEditWebsite] = await pool.execute(
      `SELECT * FROM EditWebsiteRequest WHERE LOWER(websiteName) = LOWER(?)`,
      [data.websiteName],
    );
    if (duplicateEditWebsite.length > 0) {
      throw { code: 400, message: 'Website name already exists in Edit Request' };
    }

    // Create updatedTransactionData using a ternary operator
    const updatedTransactionData = {
      id: existingRequest.website_id,
      websiteName:
        data.websiteName.replace(/\s+/g, '') !== undefined
          ? data.websiteName
          : existingRequest.websiteName.replace(/\s+/g, ''),
    };

    console.log('update', updatedTransactionData);

    // Replace undefined values with null in updatedTransactionData
    Object.keys(updatedTransactionData).forEach((key) => {
      if (updatedTransactionData[key] === undefined) {
        updatedTransactionData[key] = null;
      }
    });

    const editRequestQuery = `
    INSERT INTO EditWebsiteRequest (website_id, websiteName, message, type, changedFields, isApproved) 
    VALUES (?, ?, ?, ?, ?, ?)`;

    await pool.execute(editRequestQuery, [
      updatedTransactionData.id,
      updatedTransactionData.websiteName,
      "Website Detail's has been edited",
      'Edit',
      JSON.stringify(changedFields),
      false, // Assuming this corresponds to the 'isApproved' column
    ]);

    return true;
  },
};

export default WebsiteServices;
