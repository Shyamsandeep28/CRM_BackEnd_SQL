import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDB from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export const introducerUser = {
  generateIntroducerAccessToken: async (userName, password, persist) => {
    const pool = await connectToDB();
    try {
      if (!userName || !password) {
        throw { code: 400, message: 'User Name and Password are required' };
      }
      const [rows] = await pool.execute('SELECT * FROM IntroducerUser WHERE userName = ?', [userName]);
      const existingUser = rows[0];

      if (!existingUser) {
        throw { code: 401, message: 'Invalid User Name or Password' };
      }

      const passwordValid = await bcrypt.compare(password, existingUser.password);

      if (!passwordValid) {
        throw { code: 401, message: 'Invalid User Name or Password' };
      }

      const accessTokenResponse = {
        intro_id: existingUser.intro_id,
        name: existingUser.firstname,
        userName: existingUser.userName,
        role: existingUser.role,
        intro_id: existingUser.intro_id,
      };

      const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
        expiresIn: persist ? '1y' : '8h',
      });

      return {
        userName: existingUser.userName,
        accessToken: accessToken,
        role: existingUser.role,
        intro_id: existingUser.intro_id,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  createintroducerUser: async (data, user) => {
    const pool = await connectToDB();
    if (!data.firstname) {
      throw { code: 400, message: 'Firstname is required' };
    }
    if (!data.lastname) {
      throw { code: 400, message: 'Lastname is required' };
    }
    if (!data.userName) {
      throw { code: 400, message: 'Username is required' };
    }
    if (!data.password) {
      throw { code: 400, message: 'Password is required' };
    }

    try {
      if (!data.firstname || !data.lastname || !data.userName || !data.password) {
        throw { code: 400, message: 'Invalid data provided' };
      }
      const [existingUsers] = await pool.execute('SELECT * FROM IntroducerUser WHERE userName = ?', [data.userName]);

      if (existingUsers.length > 0) {
        throw { code: 409, message: `User already exists: ${data.userName}` };
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);
      const intro_id = uuidv4();
      const [result] = await pool.execute(
        'INSERT INTO IntroducerUser (intro_id, firstname, lastname, password, introducerId, userName) VALUES (?, ?, ?, ?, ?, ?)',
        [intro_id, data.firstname, data.lastname, encryptedPassword, user[0].userName, data.userName],
      );
      if (result.affectedRows === 1) {
        return { code: 201, message: 'Introducer User created successfully' };
      } else {
        throw { code: 500, message: 'Failed to create new Introducer User' };
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // introducerLiveBalance: async (id) => {
  //   const pool = await connectToDB();
  //   try {
  //     const [introUser] = await pool.execute(`SELECT * FROM IntroducerUser WHERE id = ?`, [id]);
  //     if (introUser.length === 0) {
  //       throw {
  //         code: 404,
  //         message: `Introducer with ID ${id} not found`,
  //       };
  //     }

  //     const introducerUserName = introUser[0].userName;
  //     const [userIntroId] = await pool.execute(`SELECT * FROM IntroducedUsers WHERE introducerUserName = ?`, [
  //       introducerUserName,
  //     ]);

  //     if (userIntroId.length === 0) {
  //       return 0;
  //     }

  //     let liveBalance = 0;
  //     for (const user of userIntroId) {
  //       const introducerPercent = user.introducerPercentage;
  //       const transDetails = user.transactionDetail;

  //       let totalDep = 0;
  //       let totalWith = 0;

  //       transDetails?.forEach((res) => {
  //         if (res.transactionType === 'Deposit') {
  //           totalDep += Number(res.amount);
  //         }
  //         if (res.transactionType === 'Withdraw') {
  //           totalWith += Number(res.amount);
  //         }
  //       });

  //       let diff = Math.abs(totalDep - totalWith);
  //       let amount = (introducerPercent / 100) * diff;

  //       liveBalance += amount;
  //     }

  //     return liveBalance;
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // },

  updateIntroducerProfile: async (introUserId, data) => {
    const pool = await connectToDB();
    try {
      const userId = introUserId[0].intro_id;
      const [existingUser] = await pool.execute(`SELECT * FROM IntroducerUser WHERE intro_id = ?`, [userId]);
      if (!existingUser || existingUser.length === 0) {
        throw {
          code: 404,
          message: `Existing Introducer User not found with id: ${userId}`,
        };
      }
      const user = existingUser[0];
      user.firstname = data.firstname || user.firstname;
      user.lastname = data.lastname || user.lastname;
      await pool.execute(`UPDATE IntroducerUser SET firstname = ?, lastname = ? WHERE intro_id = ?`, [
        user.firstname,
        user.lastname,
        userId,
      ]);
      return true;
    } catch (err) {
      console.error(err);
      throw {
        code: err.code || 500,
        message: err.message || `Failed to update Introducer User Profile with id: ${introUserId}`,
      };
    }
  },

  introducerPasswordResetCode: async (userName, password) => {
    const pool = await connectToDB();
    try {
      // Fetch user from the database
      const [existingUser] = await pool.query('SELECT * FROM IntroducerUser WHERE userName = ?', [userName]);
      if (!existingUser || existingUser.length === 0) {
        throw {
          code: 404,
          message: 'User not found',
        };
      }

      // Compare new password with old password
      const newPasswordIsDuplicate = await bcrypt.compare(password, existingUser[0].password);

      if (newPasswordIsDuplicate) {
        throw {
          code: 409,
          message: 'New Password cannot be the same as existing password',
        };
      }

      // Hash the new password
      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      // Update user's password in the database
      await pool.query('UPDATE IntroducerUser SET password = ? WHERE userName = ?', [encryptedPassword, userName]);

      return true;
    } catch (error) {
      console.error(error);
      throw {
        code: error.code || 500,
        message: error.message || 'Failed to reset password',
      };
    }
  },

  // introducerPercentageCut: async (id, startDate, endDate) => {
  //   const pool = await connectToDB();
  //   try {
  //     const [user] = await pool.execute(`SELECT * FROM User WHERE user_id = ?`, [id])
  //     const userName = user[0].userName;
  //     const userId = user.userId;
  //     const introducerUserId = user.introducersUserId;
  //     console.log("introducerUserId", introducerUserId);

  //     const introducerId = await IntroducerUser.findOne({
  //       id: introducerUserId,
  //     }).exec();
  //     console.log("introducerUser", introducerId);
  //     const introducerid = introducerId.introducerId;
  //     console.log("introducerid", introducerid);

  //     // This is Introducer's User's Percentage
  //     const introducerpercent = user.introducerPercentage;

  //     const transDetails = user.transactionDetail;

  //     const selectedStartDate = new Date(startDate);
  //     const selectedEndDate = new Date(endDate);

  //     const transactionsWithin7Days = transDetails.filter((transaction) => {
  //       const transDate = new Date(transaction.createdAt);
  //       return transDate >= selectedStartDate && transDate <= selectedEndDate;
  //     });

  //     let totalDep = 0;
  //     let totalWith = 0;

  //     transactionsWithin7Days.map((res) => {
  //       if (res.transactionType === "Deposit") {
  //         totalDep += Number(res.amount);
  //       }
  //       if (res.transactionType === "Withdraw") {
  //         totalWith += Number(res.amount);
  //       }
  //     });

  //     if (totalDep <= totalWith) {
  //       throw { message: "Can't send amount to Introducer" };
  //     }
  //     const date = new Date();
  //     let amount = 0;
  //     const transactionType = "Credit";
  //     if (totalDep > totalWith) {
  //       let diff = totalDep - totalWith;
  //       amount = (introducerpercent / 100) * diff;
  //       introducerId.wallet += amount;
  //     }
  //     introducerId.creditTransaction.push({
  //       date,
  //       transactionType,
  //       amount,
  //       userId,
  //       userName,
  //     });
  //     introducerId.save();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
};
