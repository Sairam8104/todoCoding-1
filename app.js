const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const installDataBase = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
};

installDataBase();

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoDetails = `select * from todo where id = "${todoId}";`;
  dbResponse = await db.get(getTodoDetails);
  response.send(dbResponse);
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createTodoDetails = `insert into todo (id,todo,priority,status,category,due_date)
    values ("${id}","${todo}","${priority}","${status}","${category}","${dueDate}");`;
  await db.run(createTodoDetails);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.dueDate !== undefined:
      updatedColumn = "Due Date";
      break;
  }

  const getTodoQuery = `select * from todo where id - "${todoId}";`;
  const previousTodo = await db.get(getTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    todo = previousTodo.todo,
    dueDate = previousTodo.due_date,
  } = request.body;
  const date = format(new Date(2021 - 01 - 05), "yyyy/MM/dd");
  const updatedTodoDetails = `update todo
set todo = "${todo}",status = "${status}",priority = "${priority}",
category = "${category}",due_date = "${date}";`;
  await db.run(updatedTodoDetails);
  response.send(`${updatedColumn} Updated`);
});

module.exports = app;
