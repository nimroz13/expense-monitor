const mongoose = require('mongoose');

const createUserDb = async (username) => {
  const dbName = `user_${username}`;
  const uri = `mongodb://localhost:27017/${dbName}`;

  try {
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Database created for user: ${username}`);
    return connection;
  } catch (error) {
    console.error(`Error creating database for user ${username}:`, error);
    throw error;
  }
};

module.exports = createUserDb;