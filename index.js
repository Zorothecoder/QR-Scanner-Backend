const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session')
const cookieParser = require('cookie-parser')

const app = express();
app.use(express.json());
app.use(cors({
  origin: ["https://zorothecoder.github.io"],
  methods: ["POST","GET","DELETE"],
  credentials: true
}));
app.use(cookieParser());
app.set("trust proxy",1)
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'none'
  }
}));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database as ID ' + db.threadId);
});

app.get('/qrcodes', (req, res) => {
  const selectAllQRCodeQuery = 'SELECT * FROM scanner';
  db.query(selectAllQRCodeQuery, (error, results) => {
    if (error) {
      console.error('Error retrieving QR codes from the database: ' + error.message);
      res.status(500).json({ message: 'Error retrieving QR codes' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.delete('/qrcodes/:id', (req, res) => {
  const { id } = req.params;
  const deleteQRCodeQuery = 'DELETE FROM scanner WHERE id = ?';
  db.query(deleteQRCodeQuery, [id], (error, results) => {
    if (error) {
      console.error('Error deleting QR code from the database: ' + error.message);
      res.status(500).json({ message: 'Error deleting QR code' });
    } else {
      res.status(200).json({ message: 'QR code deleted successfully' });
    }
  });
});

app.post('/qrcodes', (req, res, next) => {
  const { content, scanDate } = req.body;
  const insertQRCodeQuery = 'INSERT INTO scanner (content, scan_date) VALUES (?, ?)';
  db.query(insertQRCodeQuery, [content, scanDate], (error, results) => {
    if (error) {
      return next(error);
    } else {
      res.status(201).json({ message: 'QR code saved successfully' });
    }
  })
})

app.post('/signup', (req, res) => {
  const { emailid, username, password } = req.body;
  const insertUserQuery = 'INSERT INTO user (Email_Id, Username, Password) VALUES (?, ?, ?)';
  db.query(insertUserQuery, [emailid, username, password], (error, results) => {
    if (error) {
      res.status(500).json({ message: 'Error registering user' });
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = 'SELECT * FROM user WHERE Username = ? and Password = ?';
  db.query(selectUserQuery, [username, password], (error, results) => {
    if (error) {
      res.status(500).json({ message: 'Not Found' });
    }
    if (results.length > 0) {
      req.session.username = results[0].Username
      
      return res.json({ Login: true });
    }
    else {
      return res.json({ Login: false });
    }
  });
});

app.get('/', (req, res) => {
  if (req.session.username) {
    return res.json({ valid: true, username: req.session.username})
  }
  else {
    return res.json({ valid: false })
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  console.error('Error inserting QR code into the database: ' + err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});