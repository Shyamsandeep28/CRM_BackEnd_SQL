import { Authorize } from '../middleware/Authorize.js';
import DeleteApiService from '../services/DeleteAPI.service.js';
import connectToDB from '../db/db.js';

const DeleteAPIRoute = (app) => {
  // API To Move The Bank Transaction Into Trash
  app.post(
    '/api/admin/save-bank-transaction-request',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const user = req.user;
        const { requestId } = req.body;
        const transactionQuery = `SELECT * FROM BankTransaction WHERE BankTransaction_Id = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        if (!transaction.length) {
          return res.status(404).send('Bank Transaction not found');
        }
        const updateResult = await DeleteApiService.deleteBankTransaction(transaction[0], user);
        if (updateResult) {
          res.status(201).send('Bank Transaction Move to trash request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API To Approve Bank Transaction To Move Into Trash Request

  app.post('/api/delete-bank-transaction/:Edit_ID', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.Edit_ID;
      const [editRequest] = await pool.execute(`SELECT * FROM EditRequest WHERE Edit_ID = ?`, [id]);

      if (!editRequest || editRequest.length === 0) {
        return res.status(404).send({ message: 'Bank Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        const dataToRestore = {
          bankId: editRequest[0].bankId,
          transactionType: editRequest[0].transactionType,
          remarks: editRequest[0].remarks,
          withdrawAmount: editRequest[0].withdrawAmount,
          depositAmount: editRequest[0].depositAmount,
          subAdminId: editRequest[0].subAdminId,
          subAdminName: editRequest[0].subAdminName,
          accountHolderName: editRequest[0].accountHolderName,
          bankName: editRequest[0].bankName,
          accountNumber: editRequest[0].accountNumber,
          ifscCode: editRequest[0].ifscCode,
          createdAt: editRequest[0].createdAt,
          upiId: editRequest[0].upiId,
          upiAppName: editRequest[0].upiAppName,
          upiNumber: editRequest[0].upiNumber,
          isSubmit: editRequest[0].isSubmit,
          BankTransaction_Id: editRequest[0].BankTransaction_Id,
          requesteduserName: editRequest[0].requesteduserName,
          message: editRequest[0].message,
          type: editRequest[0].type,
          Nametype: editRequest[0].Nametype,
        };

        const restoreQuery = `INSERT INTO Trash (bankId, transactionType, requesteduserName, subAdminId, subAdminName, depositAmount, 
        withdrawAmount, remarks, bankName, accountHolderName, accountNumber, ifscCode, upiId, upiAppName, upiNumber, createdAt, message,
        type, Nametype, isSubmit, BankTransaction_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [restoreResult] = await pool.execute(restoreQuery, [
          dataToRestore.bankId,
          dataToRestore.transactionType,
          dataToRestore.requesteduserName,
          dataToRestore.subAdminId,
          dataToRestore.subAdminName,
          dataToRestore.depositAmount,
          dataToRestore.withdrawAmount,
          dataToRestore.remarks,
          dataToRestore.bankName,
          dataToRestore.accountHolderName,
          dataToRestore.accountNumber,
          dataToRestore.ifscCode,
          dataToRestore.upiId,
          dataToRestore.upiAppName,
          dataToRestore.upiNumber,
          dataToRestore.createdAt,
          dataToRestore.message,
          dataToRestore.type,
          dataToRestore.Nametype,
          dataToRestore.isSubmit,
          dataToRestore.BankTransaction_Id,
        ]);

        // Delete the bank transaction from the original table
        await pool.execute(`DELETE FROM BankTransaction WHERE BankTransaction_Id = ?`, [editRequest[0].BankTransaction_Id]);

        // Delete the edit request from the original table
        await pool.execute(`DELETE FROM EditRequest WHERE Edit_ID = ?`, [id]);

        res.status(200).send({ message: 'Bank Transaction Moved To Trash', data: restoreResult });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  // API To Move The Website Transaction Into Trash
  app.post('/api/admin/save-website-transaction-request', Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View']), async (req, res) => {
      const pool = await connectToDB();
      try {
        const user = req.user;
        const { requestId } = req.body;
        const transactionQuery = `SELECT * FROM WebsiteTransaction WHERE WebsiteTransaction_Id = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        // console.log("transactionPOST", transaction[0]);
        if (!transaction) {
          return res.status(404).send('Website Transaction not found');
        }
        const updateResult = await DeleteApiService.deleteWebsiteTransaction(transaction[0], user);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Website Transaction Move to trash request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API To Approve Website Transaction To Move Into Trash Request

  app.post('/api/delete-website-transaction/:Edit_ID', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.Edit_ID;
      const [editRequest] = await pool.execute(`SELECT * FROM EditRequest WHERE Edit_ID = ?`, [id]);
       console.log("editRequest", editRequest);
      if (!editRequest || editRequest.length === 0) {
        return res.status(404).send({ message: 'Edit Website Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        const dataToRestore = {
          websiteId: editRequest[0].websiteId,
          transactionType: editRequest[0].transactionType,
          remarks: editRequest[0].remarks,
          withdrawAmount: editRequest[0].withdrawAmount,
          depositAmount: editRequest[0].depositAmount,
          subAdminId: editRequest[0].subAdminId,
          subAdminName: editRequest[0].subAdminName,
          websiteName: editRequest[0].websiteName,
          createdAt: editRequest[0].createdAt,
          WebsiteTransaction_Id: editRequest[0].WebsiteTransaction_Id,
          requesteduserName: editRequest[0].requesteduserName,
          message: editRequest[0].message,
          type: editRequest[0].type,
          Nametype: editRequest[0].Nametype
        };

        // Assuming 'Trash' is the table where you store deleted website transactions
        const restoreQuery = `INSERT INTO Trash (websiteId, transactionType, requesteduserName, subAdminId, subAdminName, 
        depositAmount, withdrawAmount, remarks, websiteName, createdAt, message, type, Nametype, WebsiteTransaction_Id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [restoreResult] = await pool.execute(restoreQuery, [
          dataToRestore.websiteId,
          dataToRestore.transactionType,
          dataToRestore.requesteduserName,
          dataToRestore.subAdminId,
          dataToRestore.subAdminName,
          dataToRestore.depositAmount,
          dataToRestore.withdrawAmount,
          dataToRestore.remarks,
          dataToRestore.websiteName,
          dataToRestore.createdAt,
          dataToRestore.message,
          dataToRestore.type,
          dataToRestore.Nametype,
          dataToRestore.WebsiteTransaction_Id,
        ]);

        // Delete the website transaction from the original table
        await pool.execute(`DELETE FROM WebsiteTransaction WHERE WebsiteTransaction_Id = ?`, [editRequest[0].WebsiteTransaction_Id]);

        // Delete the edit request from the original table
        await pool.execute(`DELETE FROM EditRequest WHERE Edit_ID = ?`, [id]);

        res.status(200).send({ message: 'Website Transaction Moved To Trash', data: restoreResult });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  // API To Move The Transaction Into Trash

  app.post(
    '/api/admin/save-transaction-request',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const user = req.user;
        const { requestId } = req.body;
        const transactionQuery = `SELECT * FROM Transaction WHERE id = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        if (!transaction) {
          return res.status(404).send('Transaction not found');
        }
        const updateResult = await DeleteApiService.deleteTransaction(transaction[0], user);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Transaction Move to trash request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API To Approve Transaction To Move Into Trash Request

  app.post('/api/delete-transaction/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.id;
      const [editRequest] = await pool.execute(`SELECT * FROM EditRequest WHERE id = ?`, [id]);
      console.log('editRequest', editRequest[0].transId);
      if (!editRequest || editRequest.length === 0) {
        return res.status(404).send({ message: 'Edit Website Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        const dataToRestore = {
          bankId: editRequest[0].bankId,
          websiteId: editRequest[0].websiteId,
          transactionID: editRequest[0].transactionID,
          transactionType: editRequest[0].transactionType,
          remarks: editRequest[0].remarks,
          amount: editRequest[0].amount,
          subAdminId: editRequest[0].subAdminId,
          subAdminName: editRequest[0].subAdminName,
          introducerUserName: editRequest[0].introducerUserName,
          userId: editRequest[0].userId,
          userName: editRequest[0].userName,
          paymentMethod: editRequest[0].paymentMethod,
          websiteName: editRequest[0].websiteName,
          bankName: editRequest[0].bankName,
          bonus: editRequest[0].bonus,
          bankCharges: editRequest[0].bankCharges,
          createdAt: editRequest[0].createdAt,
          transId: editRequest[0].transId,
        };

        // Assuming 'Trash' is the table where you store deleted transactions
        const restoreQuery = `INSERT INTO Trash (transId, bankId, websiteId, transactionID, transactionType, amount, paymentMethod, userId,
            userName, subAdminId, subAdminName, bonus, bankCharges, remarks, bankName, websiteName, createdAt, introducerUserName) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [restoreResult] = await pool.execute(restoreQuery, [
          dataToRestore.transId,
          dataToRestore.bankId,
          dataToRestore.websiteId,
          dataToRestore.transactionID,
          dataToRestore.transactionType,
          dataToRestore.amount,
          dataToRestore.paymentMethod,
          dataToRestore.userId,
          dataToRestore.userName,
          dataToRestore.subAdminId,
          dataToRestore.subAdminName,
          dataToRestore.bonus,
          dataToRestore.bankCharges,
          dataToRestore.remarks,
          dataToRestore.bankName,
          dataToRestore.websiteName,
          dataToRestore.createdAt,
          dataToRestore.introducerUserName,
        ]);

        // Delete the transaction from the original table
        await pool.execute(`DELETE FROM Transaction WHERE id = ?`, [editRequest[0].transId]);

        // Delete the edit request from the original table
        await pool.execute(`DELETE FROM EditRequest WHERE id = ?`, [id]);

        // Remove the transaction detail from the user
        await pool.execute(`DELETE FROM UserTransactionDetail WHERE Transaction_id = ?`, [editRequest[0].transId]);

        res.status(200).send({ message: 'Transaction moved to Trash', data: restoreResult });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  // API To Move The Introducer Transaction Into Trash
  app.post(
    '/api/admin/save-introducer-transaction-request',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const user = req.user;
        const { requestId } = req.body;
        const transactionQuery = `SELECT * FROM IntroducerTransaction WHERE introTransactionId = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        if (!transaction) {
          return res.status(404).send('Transaction not found');
        }
        const updateResult = await DeleteApiService.deleteIntroducerTransaction(transaction[0], user);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Introducer Transaction Move to trash request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API To Approve Introducer Transaction To Move Into Trash Request
  app.post('/api/delete-introducer-transaction/:IntroEditID',
    Authorize(['superAdmin', 'RequestAdmin']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const id = req.params.IntroEditID;
        const [editRequest] = await pool.execute(`SELECT * FROM IntroducerEditRequest WHERE IntroEditID = ?`, [id]);
        console.log('editRequest', editRequest);
        if (!editRequest || editRequest.length === 0) {
          return res.status(404).send({ message: 'Edit Request not found' });
        }

        const isApproved = true;

        if (isApproved) {
          const dataToRestore = {
            introTransactionId: editRequest[0].introTransactionId,
            amount: editRequest[0].amount,
            transactionType: editRequest[0].transactionType,
            remarks: editRequest[0].remarks,
            subAdminId: editRequest[0].subAdminId,
            subAdminName: editRequest[0].subAdminName,
            introducerUserName: editRequest[0].introducerUserName,
            createdAt: editRequest[0].createdAt,
            introUserId: editRequest[0].introUserId
          };

          const restoreQuery = `INSERT INTO Trash (introTransactionId, introUserId, transactionType, amount, subAdminId, subAdminName, 
          remarks, createdAt, Nametype, introducerUserName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const [restoreResult] = await pool.execute(restoreQuery, [
            dataToRestore.introTransactionId,
            dataToRestore.introUserId,
            dataToRestore.transactionType,
            dataToRestore.amount,
            dataToRestore.subAdminId,
            dataToRestore.subAdminName,
            dataToRestore.remarks,
            dataToRestore.createdAt,
            'Introducer',
            dataToRestore.introducerUserName
          ]);

          await pool.execute(`DELETE FROM IntroducerTransaction WHERE introTransactionId = ?`, [
            editRequest[0].introTransactionId,
          ]);
          await pool.execute(`DELETE FROM IntroducerEditRequest WHERE IntroEditID = ?`, [id]);

          res.status(200).send({ message: 'Transaction moved to Trash', data: restoreResult });
        } else {
          res.status(400).send({ message: 'Approval request rejected by super admin' });
        }
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Internal server error' });
      }
    },
  );

  app.delete('/api/reject/EditRequest/:id', Authorize(['superAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.id;
      const deleteQuery = 'DELETE FROM EditRequest WHERE id = ?';
      const [result] = await pool.execute(deleteQuery, [id]);
      if (result.affectedRows === 1) {
        res.status(200).send({ message: 'Data deleted successfully' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  // API TO Sent deleting Bank Detail's approval

  app.post(
    '/api/admin/save-bank-request',
    Authorize(['superAdmin', 'Transaction-View', 'Bank-View']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const { requestId } = req.body;
        console.log(requestId);
        const transactionQuery = `SELECT * FROM Bank WHERE bank_id = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        if (!transaction) {
          return res.status(404).send('Bank not found');
        }
        console.log('Transaction found', transaction);
        const updateResult = await DeleteApiService.deleteBank(transaction[0], req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Bank delete request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API For Bank Delete Request

  app.post('/api/delete-bank/:bankTransactionId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.bankTransactionId;
      const [editRequest] = await pool.execute(`SELECT * FROM EditBankRequest WHERE bankTransactionId = ?`, [id]);

      if (!editRequest || editRequest.length === 0) {
        return res.status(404).send({ message: 'Bank Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        await pool.execute(`DELETE FROM Bank WHERE bank_id = ?`, [editRequest[0].bankTransactionId]);
        await pool.execute(`DELETE FROM EditBankRequest WHERE bankTransactionId = ?`, [id]);
        res.status(200).send({ message: 'Bank deleted' });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || 'Internal server error' });
    }
  });

  // API TO Sent deleting Website Detail's approval

  app.post(
    '/api/admin/save-website-request',
    Authorize(['superAdmin', 'Transaction-View', 'Website-View']),
    async (req, res) => {
      const pool = await connectToDB();
      try {
        const { requestId } = req.body;
        console.log(requestId);
        const transactionQuery = `SELECT * FROM Website WHERE website_id = ?`;
        const [transaction] = await pool.execute(transactionQuery, [requestId]);
        if (!transaction) {
          return res.status(404).send('Website not found');
        }
        // console.log('Transaction found', transaction);
        const updateResult = await DeleteApiService.deleteWebsite(transaction[0], req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Website Delete request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  // API For Website Delet Request

  app.post('/api/delete-website/:websiteTransactionId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.websiteTransactionId;
      const [editRequest] = await pool.execute(`SELECT * FROM EditWebsiteRequest WHERE websiteTransactionId = ?`, [id]);

      if (!editRequest || editRequest.length === 0) {
        return res.status(404).send({ message: 'Website Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        await pool.execute(`DELETE FROM Website WHERE website_id = ?`, [editRequest[0].websiteTransactionId]);
        await pool.execute(`DELETE FROM EditWebsiteRequest WHERE websiteTransactionId = ?`, [id]);
        res.status(200).send({ message: 'Website deleted' });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || 'Internal server error' });
    }
  });

  // API For Rejecting Bank Detail

  app.delete('/api/reject/bank-detail/:bankTransactionId',Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
      const pool = await connectToDB();
      try {
        const id = req.params.bankTransactionId;
        const deleteQuery = 'DELETE FROM EditBankRequest WHERE bankTransactionId = ?';
        const [result] = await pool.execute(deleteQuery, [id]);
        if (result.affectedRows === 1) {
          res.status(200).send({ message: 'Data deleted successfully' });
        } else {
          res.status(404).send({ message: 'Data not found' });
        }
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
      }
    },
  );

  // API For Rejecting Website Detail

  app.delete('/api/reject/website-detail/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.id;
      const deleteQuery = 'DELETE FROM EditWebsiteRequest WHERE id = ?';
      const [result] = await pool.execute(deleteQuery, [id]);
      if (result.affectedRows === 1) {
        res.status(200).send({ message: 'Data deleted successfully' });
      } else {
        res.status(404).send({ message: 'Data not found' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  //  API To View Trash Data
  app.get('/api/admin/view-trash', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const [resultArray] = await pool.execute(`SELECT * FROM Trash`)
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server error');
    }
  });

  // API To Delete Trash Data
  app.delete('/api/delete/transactions/:_id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
        const id = req.params._id;
        const [result] = await pool.execute(`DELETE FROM Trash WHERE _id = ?`, [id]);
        if (result.affectedRows > 0) {
            res.status(200).send({ message: 'Data deleted successfully' });
        } else {
            res.status(404).send({ message: 'Data not found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
    }
});


  // API To Re-Store The Bank Transaction Data
  app.post('/api/restore/bank/data/:bankId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const bankId = req.params.bankId;

      // Retrieve deleted data from the Trash table based on bankId
      const [deletedData] = await pool.execute(`SELECT * FROM Trash WHERE bankId = ?`, [bankId]);

      if (!deletedData || deletedData.length === 0) {
        return res.status(404).send({ message: 'Data not found in Trash' });
      }

      // Extract data to restore from the retrieved deleted data
      const dataToRestore = {
        bankId: deletedData[0].bankId,
        transactionType: deletedData[0].transactionType,
        remarks: deletedData[0].remarks,
        withdrawAmount: deletedData[0].withdrawAmount,
        depositAmount: deletedData[0].depositAmount,
        subAdminId: deletedData[0].subAdminId,
        subAdminName: deletedData[0].subAdminName,
        accountHolderName: deletedData[0].accountHolderName,
        bankName: deletedData[0].bankName,
        accountNumber: deletedData[0].accountNumber,
        ifscCode: deletedData[0].ifscCode,
        createdAt: deletedData[0].createdAt,
        upiId: deletedData[0].upiId,
        upiAppName: deletedData[0].upiAppName,
        upiNumber: deletedData[0].upiNumber,
        isSubmit: deletedData[0].isSubmit,
        BankTransaction_Id: deletedData[0].BankTransaction_Id
      };

      // Insert restored data into the BankTransaction table
      const [restoredData] = await pool.execute(
        `INSERT INTO BankTransaction 
            (bankId, BankTransaction_Id, accountHolderName, bankName, accountNumber, ifscCode, transactionType, remarks, upiId,
            upiAppName, upiNumber, withdrawAmount, depositAmount, subAdminId, subAdminName, createdAt, isSubmit) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dataToRestore.bankId,
          dataToRestore.BankTransaction_Id,
          dataToRestore.accountHolderName,
          dataToRestore.bankName,
          dataToRestore.accountNumber,
          dataToRestore.ifscCode,
          dataToRestore.transactionType,
          dataToRestore.remarks,
          dataToRestore.upiId,
          dataToRestore.upiAppName,
          dataToRestore.upiNumber,
          dataToRestore.withdrawAmount,
          dataToRestore.depositAmount,
          dataToRestore.subAdminId,
          dataToRestore.subAdminName,
          dataToRestore.createdAt,
          dataToRestore.isSubmit,
        ],
      );

      // Delete the restored data from the Trash table
      await pool.execute(`DELETE FROM Trash WHERE bankId = ?`, [bankId]);

      res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  // API To Re-Store The Website Transaction Data
  app.post('/api/restore/website/data/:websiteId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const websiteId = req.params.websiteId;

      // Retrieve deleted data from the Trash table based on websiteId
      const [deletedData] = await pool.execute(`SELECT * FROM Trash WHERE websiteId = ?`, [websiteId]);

      if (!deletedData || deletedData.length === 0) {
        return res.status(404).send({ message: 'Data not found in Trash' });
      }

      // Extract data to restore from the retrieved deleted data
      const dataToRestore = {
        websiteId: deletedData[0].websiteId,
        transactionType: deletedData[0].transactionType,
        remarks: deletedData[0].remarks,
        withdrawAmount: deletedData[0].withdrawAmount,
        depositAmount: deletedData[0].depositAmount,
        subAdminId: deletedData[0].subAdminId,
        subAdminName: deletedData[0].subAdminName,
        websiteName: deletedData[0].websiteName,
        createdAt: deletedData[0].createdAt,
        WebsiteTransaction_Id: deletedData[0].WebsiteTransaction_Id
      };

      // Insert restored data into the WebsiteTransaction table
      const [restoredData] = await pool.execute(
        `INSERT INTO WebsiteTransaction
          (websiteId, WebsiteTransaction_Id, websiteName, remarks, transactionType, withdrawAmount, depositAmount, subAdminId, 
          subAdminName, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dataToRestore.websiteId,
          dataToRestore.WebsiteTransaction_Id,
          dataToRestore.websiteName,
          dataToRestore.remarks,
          dataToRestore.transactionType,
          dataToRestore.withdrawAmount,
          dataToRestore.depositAmount,
          dataToRestore.subAdminId,
          dataToRestore.subAdminName,
          dataToRestore.createdAt,
        ],
      );

      // Delete the restored data from the Trash table
      await pool.execute(`DELETE FROM Trash WHERE websiteId = ?`, [websiteId]);

      res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  // Need to re-test
  // API To Re-Store The Transaction Data
  app.post('/api/restore/transaction/data/:transactionID', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
      const pool = await connectToDB();
      try {
        const transactionID = req.params.transactionID;

        // Retrieve deleted data from the Trash table based on transactionID
        const [deletedData] = await pool.execute(`SELECT * FROM Trash WHERE transactionID = ?`, [transactionID]);

        if (!deletedData || deletedData.length === 0) {
          return res.status(404).send({ message: 'Data not found in Trash' });
        }

        // Extract data to restore from the retrieved deleted data
        const dataToRestore = {
          bankId: deletedData[0].bankId,
          websiteId: deletedData[0].websiteId,
          transactionID: deletedData[0].transactionID,
          transactionType: deletedData[0].transactionType,
          remarks: deletedData[0].remarks,
          amount: deletedData[0].amount,
          subAdminId: deletedData[0].subAdminId,
          subAdminName: deletedData[0].subAdminName,
          introducerUserName: deletedData[0].introducerUserName,
          userId: deletedData[0].userId,
          userName: deletedData[0].userName,
          paymentMethod: deletedData[0].paymentMethod,
          websiteName: deletedData[0].websiteName,
          bankName: deletedData[0].bankName,
          bonus: deletedData[0].bonus,
          bankCharges: deletedData[0].bankCharges,
          createdAt: deletedData[0].createdAt,
        };

        // Insert restored data into the Transaction table
        const [restoredData] = await pool.execute(
          `INSERT INTO Transaction 
          (bankId, websiteId, transactionID, transactionType, remarks, amount, subAdminId, subAdminName, introducerUserName, 
          userId, userName, paymentMethod, websiteName, bankName, bonus, bankCharges, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dataToRestore.bankId,
            dataToRestore.websiteId,
            dataToRestore.transactionID,
            dataToRestore.transactionType,
            dataToRestore.remarks,
            dataToRestore.amount,
            dataToRestore.subAdminId,
            dataToRestore.subAdminName,
            dataToRestore.introducerUserName,
            dataToRestore.userId,
            dataToRestore.userName,
            dataToRestore.paymentMethod,
            dataToRestore.websiteName,
            dataToRestore.bankName,
            dataToRestore.bonus,
            dataToRestore.bankCharges,
            dataToRestore.createdAt,
          ],
        );

        // Update the user's transaction detail
        await pool.execute(
          `INSERT INTO UserTransactionDetail 
          (UID, bankId, websiteId, transactionID, transactionType, remarks, amount, subAdminId, subAdminName, introducerUserName, 
          userId, userName, paymentMethod, websiteName, bankName, bonus, bankCharges, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dataToRestore.bankId,
            dataToRestore.websiteId,
            dataToRestore.transactionID,
            dataToRestore.transactionType,
            dataToRestore.remarks,
            dataToRestore.amount,
            dataToRestore.subAdminId,
            dataToRestore.subAdminName,
            dataToRestore.introducerUserName,
            dataToRestore.userId,
            dataToRestore.userName,
            dataToRestore.paymentMethod,
            dataToRestore.websiteName,
            dataToRestore.bankName,
            dataToRestore.bonus,
            dataToRestore.bankCharges,
            dataToRestore.createdAt,
          ],
        );

        // Delete the restored data from the Trash table
        await pool.execute(`DELETE FROM Trash WHERE transactionID = ?`, [transactionID]);

        res.status(200).send({ message: 'Data restored successfully', data: restoredData });
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
      }
    },
  );

  // Need To Test
  // API To Re-Store The Intoducer Transaction
  app.post('/api/restore/Introducer/data/:introTransactionId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
        const introUserId = req.params.introTransactionId;

        // Retrieve deleted data from the Trash table based on introUserId
        const [deletedData] = await pool.execute(`SELECT * FROM Trash WHERE introTransactionId = ?`, [introUserId]);
        console.log("deletedData", deletedData);
        if (!deletedData || deletedData.length === 0) {
            return res.status(404).send({ message: 'Data not found in Trash' });
        }

        // Extract data to restore from the retrieved deleted data
        const dataToRestore = {
            introTransactionId: deletedData[0].introTransactionId,
            introUserId : deletedData[0].introUserId,
            amount: deletedData[0].amount,
            transactionType: deletedData[0].transactionType,
            remarks: deletedData[0].remarks,
            subAdminId: deletedData[0].subAdminId,
            subAdminName: deletedData[0].subAdminName,
            introducerUserName: deletedData[0].introducerUserName,
            createdAt: deletedData[0].createdAt,
        };
            console.log("dataToRestore", dataToRestore);
        // Insert restored data into the IntroducerTransaction table
        const [restoredData] = await pool.execute(
            `INSERT INTO IntroducerTransaction 
          (introTransactionId, introUserId, amount, transactionType, remarks, subAdminId, subAdminName, introducerUserName, 
          createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dataToRestore.introTransactionId,
                dataToRestore.introUserId,
                dataToRestore.amount,
                dataToRestore.transactionType,
                dataToRestore.remarks,
                dataToRestore.subAdminId,
                dataToRestore.subAdminName,
                dataToRestore.introducerUserName,
                dataToRestore.createdAt,
            
            ].map(value => (value === undefined ? null : value)) // Replace undefined with null
        );

        // Delete the restored data from the Trash table
        await pool.execute(`DELETE FROM Trash WHERE introTransactionId = ?`, [introUserId]);

        res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
    }
});


  app.delete('/api/reject/introducer-detail/:IntroEditID', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    const pool = await connectToDB();
    try {
      const id = req.params.IntroEditID;
      const deleteQuery = 'DELETE FROM IntroducerEditRequest WHERE IntroEditID = ?';
      const [result] = await pool.execute(deleteQuery, [id]);
      if (result.affectedRows === 1) {
        res.status(200).send({ message: 'Data deleted successfully' });
      } else {
        res.status(404).send({ message: 'Data not found' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });
};

export default DeleteAPIRoute;
