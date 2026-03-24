const express = require('express');
const app = express();
const PORT = 8000;
const db = require('./db');

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/users', async (req, res) => {
  try {
    const {id} = req.query
    const [rows] = await db.query('SELECT * from users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});


// Create a new user
app.post('/users', async (req, res) => {
  try {
    const { username, email, password, role, reputation } = req.body;

    const [rows] = await db.query(
      `INSERT INTO users (username, email, password, role, reputation)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, password, role, reputation]
    );

    res.json({
      message: "User created",
      id: rows.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

//Get all subjects
app.get('/subjects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subjects');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Database error');
  }
});


//Create question
app.post('/questions', async (req, res) => {
  try {
    const { title, body, user_id, subject } = req.body;

    const [rows] = await db.query(
      'INSERT INTO questions (title, body, user_id, subject) VALUES (?, ?, ?, ?)',
      [title, body, user_id, subject]
    );

    res.json({ questionId: rows.insertId });

  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});




// Post an answer
app.post('/answers', async (req, res) => {
  try {
    const { question_id, user_id, content } = req.body;

    // Optional: log the incoming request body
    console.log("POST /answers body:", req.body);

    const [rows] = await db.query(
      'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)',
      [question_id, user_id, content]
    );

    res.json({ answerId: rows.insertId });

  } catch (err) {
    // Log full error to console
    console.error("ANSWER INSERT ERROR:", err);

    // Send the actual error message in the response (for testing)
    res.status(500).send('Database error: ' + err.message);
  }
});

//Get All questions
app.get('/questions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM questions');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Database error');
  }
});


//Get answers for a question
app.get('/questions/:id/answers', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM answers WHERE question_id = ?',
      [req.params.id]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).send('Database error');
  }
});

//get questions by subject
app.get('/subjects/:id/questions', async (req, res) => {
  try {

    const [rows] = await db.query(
      `SELECT * FROM questions WHERE subject = ?`,
      [req.params.id]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).send('Database error');
  }
});

//vote on answers

app.post('/answers/:id/vote', async (req, res) => {
  try {
    const { user_id, vote_type } = req.body;

    await db.query(
      'INSERT INTO votes (user_id, answer_id, vote_type) VALUES (?, ?, ?)',
      [user_id, req.params.id, vote_type]
    );

    if (vote_type === 'upvote') {
      await db.query(
        `UPDATE users 
         SET reputation = reputation + 15
         WHERE id = (SELECT user_id FROM answers WHERE id = ?)`,
        [req.params.id]
      );
    }

    res.json({ message: "Vote added" });

  } catch (err) {
    res.status(500).send('Database error');
  }
});


//vote on questions
// Vote on a question
app.post('/questions/:id/vote', async (req, res) => {
  try {
    const { user_id, vote_type } = req.body;

    // Log the incoming request body
    console.log("POST /questions/:id/vote body:", req.body);
    console.log("Question ID from params:", req.params.id);

    // Save vote
    await db.query(
      'INSERT INTO votes (user_id, question_id, vote_type) VALUES (?, ?, ?)',
      [user_id, req.params.id, vote_type]
    );

    // Increase reputation if upvote
    if (vote_type === 'upvote') {
      await db.query(
        `UPDATE users 
         SET reputation = reputation + 10 
         WHERE id = (SELECT user_id FROM questions WHERE id = ?)`,
        [req.params.id]
      );
    }

    res.json({ message: "Vote added" });

  } catch (err) {
    // Log the full error to console
    console.error("QUESTION VOTE ERROR:", err);

    // Send the actual error message in the response for debugging
    res.status(500).send('Database error: ' + err.message);
  }
});


app.delete('/questions/:id', async (req, res) => {
  try {
    const questionId = req.params.id;

    console.log("Deleting question and its answers for questionId:", questionId);

    // First delete answers for this question
    await db.query(
      'DELETE FROM answers WHERE question_id = ?',
      [questionId]
    );

    // Then delete the question
    await db.query(
      'DELETE FROM questions WHERE id = ?',
      [questionId]
    );

    res.json({ message: "Question and its answers deleted" });

  } catch (err) {
    console.error("DELETE QUESTION ERROR:", err);
    res.status(500).send('Database error: ' + err.message);
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});