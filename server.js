const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// const { createToken } = require("./jwt");

const createToken = (payload) => {
  return jwt.sign(payload, "secret key");
};

const connection = mysql.createConnection({
  host: "bjqk6cwjvhihdkq731cx-mysql.services.clever-cloud.com",
  user: "uwgvprzoq4i2itli",
  password: "uwgvprzoq4i2itli",
  database: "bjqk6cwjvhihdkq731cx",
});

connection.connect((err) =>
  err ? console.log("error happend") : console.log("connected")
);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello");
});

// intro to jwt how it works
// creating token on user register and login
// storing the token somewhere on the client side
// verifying user token on data requests

app.post("/register", (req, res) => {
  const { email, firstName, lastName, userName, password } = req.body;

  if (password.length < 8) {
    res.status(401).json({
      success: false,
      err: "Password must have at least 8 characters",
    });
  }
  try {
    const checkUser =
      "SELECT * FROM registration WHERE user_email = ? OR user_name=?";

    connection.query(checkUser, [email, userName], (err, result) => {
      if (!err && result.length > 0) {
        res
          .status(401)
          .json({ success: false, err: "user name or email is reserved" });
      } else {
        const insertQuery =
          "INSERT INTO registration(user_name,user_email,user_password) VALUES(?,?,?)";
        const selectUserId =
          "SELECT user_id FROM registration ORDER BY user_id DESC LIMIT 1";
        const inesrtToProfile =
          "INSERT INTO profile(user_id,first_name,last_name) VALUES(?,?,?)";

        connection.query(insertQuery, [userName, email, password], (err) => {
          if (!err) {
            connection.query(selectUserId, (err, result) => {
              connection.query(
                inesrtToProfile,
                [result[0].user_id, firstName, lastName],
                (err) => {
                  !err
                    ? res
                        .status(201)
                        .json({ success: true, msg: "Registered Successfully" })
                    : res.status(500).json({
                        success: false,
                        err: "Unresolved Error Occured",
                      });
                }
              );
            });
          }
        });
      }
    });
  } catch (err) {
    res.send(500).json({
      success: false,
      error: "Unresolved Problem, Please Try Again Latter",
    });
  }
});

app.post("/login", (req, res) => {
  const { loginEmail, loginPassword } = req.body;

  const selectExistUser = `SELECT * FROM registration WHERE user_email="${loginEmail}" AND user_password="${loginPassword}"`;
  connection.query(selectExistUser, (err, result) => {
    // console.log(result);
    if (!err && result.length > 0) {
      const token = createToken(result[0].user_id);
      res.send({ success: true, user: result[0], err: false, token });
    } else {
      res.send({ success: false, err: "incorrect credential" });
    }
  });
});

// ask quesyion
app.post("/askQuestion", (req, res) => {
  const { questionTitle, questionDesc, id } = req.body;

  const insertAQuestion =
    "INSERT INTO question(question,question_desc,user_id,post_id) VALUE(?,?,?,?)";

  const postId = uuidv4();

  connection.query(
    insertAQuestion,
    [questionTitle, questionDesc, id, postId],
    (err) => {
      err
        ? res.status(401).json({ success: false, err: "error happened" })
        : res.status(200).json({
            success: true,
            err: null,
            msg: "Question Dubmited Successfully",
          });
    }
  );
});

app.get("/questions", (req, res) => {
  const getQuestionList =
    "SELECT user_name,question,question_id FROM registration JOIN question ON registration.user_id=question.user_id ORDER BY question_id DESC";

  connection.query(getQuestionList, (err, result) => {
    res.json(result);
  });
});

app.get("/singleQuestion/:qid", (req, res) => {
  const { qid } = req.params;
  // console.log(qid);

  const getSingleQuestion = `SELECT user_name,question,question_id,question_desc FROM registration JOIN question ON registration.user_id = question.user_id WHERE question_id = "${qid}"`;

  connection.query(getSingleQuestion, (err, result) => {
    res.json(result[0]);
    // console.log(result);
  });
});

app.post("/answer", (req, res) => {
  const { newAnswer, qid, id } = req.body;

  const insertAnswer = `INSERT INTO answer (answer,question_id,user_id)VALUES(?,?,?)`;

  connection.query(insertAnswer, [newAnswer, qid, id], (err) => {
    err
      ? res.status(401).json({
          success: false,
          err: "answer not inserted",
          msg: "unable to insert your answer",
        })
      : res.status(200).json({
          success: true,
          err: null,
          msg: "Your Answer Posted Successfully",
        });
  });
});

app.get("/answers/:qid", (req, res) => {
  const { qid } = req.params;

  const getAnswers = `SELECT user_name,answer FROM registration JOIN answer ON answer.user_id = registration.user_id WHERE answer.question_id="${qid}"`;

  connection.query(getAnswers, [qid], (err, result) => {
    if (result.length === 0) {
      res
        .status(200)
        .json({ success: true, msg: "No Answers Provided", answers: null });
    } else {
      res.status(200).json({ success: true, answers: result });
    }
  });
});

app.listen(1234, () => console.log("listening on port 1234"));
