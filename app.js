const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
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

const hasPriorityAndStatusAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, category, priority } = request.query;

  switch (true) {
    case hasPriorityAndStatusAndCategoryProperties(request.query):
      getTodosQuery = `
        SELECT
            id,todo,priority,status,category,due_date as dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}'
            AND category = '${category}';`;
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                SELECT
                    id,todo,priority,status,category,due_date as dueDate
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';`;
        data = await db.all(getTodosQuery);

        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                SELECT
                   id,todo,priority,status,category,due_date as dueDate
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';`;
        data = await db.all(getTodosQuery);

        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                SELECT
                    id,todo,priority,status,category,due_date as dueDate
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND category = '${category}';`;
        data = await db.all(getTodosQuery);

        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
            SELECT
                id,todo,priority,status,category,due_date as dueDate
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);

      response.send(data);
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT
                id,todo,priority,status,category,due_date as dueDate
            FROM
                todo 
            WHERE
                id = '${todoId}';`;
  dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});

app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(`${date}`))) {
    NewDate = format(new Date(`${date}`), "yyyy-MM-DD");
    getTodosQuery = `
            SELECT
                id,todo,priority,status,category,due_date as dueDate
            FROM
                todo 
            WHERE
                strftime('%Y'-'%m'-'%d', due_date) = '${NewDate}';`;
    dbResponse = await db.all(getTodosQuery);
    response.send(dbResponse);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todosDetails = request.body;

  const { id, todo, priority, status, category, dueDate } = todosDetails;

  if (["HIGH", "LOW", "MEDIUM"].includes(priority)) {
    if (["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
      if (["WORK", "HOME", "LEARNING"].includes(category)) {
        if (isValid(new Date(`${dueDate}`))) {
          const postQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
                VALUES ('${id}','${todo}','${priority}','${status}','${category}','${dueDate}');`;

          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = " ";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `Select * from todo where id="${todoId}"`;
  previousTodo = await db.get(previousTodoQuery);

  const {
    status = previousTodo.status,
    category = previousTodo.category,
    priority = previousTodo.priority,
    dueDate = previousTodo.due_date,
    todo = previousTodo.todo,
  } = request.body;
  if (["HIGH", "LOW", "MEDIUM"].includes(priority)) {
    if (["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
      if (["WORK", "HOME", "LEARNING"].includes(category)) {
        if (isValid(new Date(`${dueDate}`))) {
          const postQuery = `UPDATE  todo SET 
          todo = '${todo}',
          priority = '${priority}',status='${status}',category='${category}',due_date='${dueDate}' where id=${todoId}`;

          await db.run(postQuery);
          response.send(`${updateColumn} Updated`);
        } else {
          console.log(dueDate);
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = "${todoId}"`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
