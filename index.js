const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDb = require("./db/connect");
const { emit } = require("process");

const User = require("./db/schema/userSchema");

// port to run the server on
const PORT = process.env.PORT || 4000;

const app = express();
app.use(bodyParser.json());
app.use(express.json());
const server = createServer(app);

// to use the socket.io with the express server
// we have given the second parameter as an object with cors property so that we can request from any origin
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// starting the database connection
connectDb();

// enabling the cors
app.use(cors());

// array to hold the connected users
let connectedUsers = [];

// socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected " + socket.id);
  // connectedUsers.push(socket.id);
  // console.log("connected users are : "+connectedUsers);

  // sending the connected users array to the client
  //   io.emit("connectedUsers", connectedUsers);

  socket.on("my_data", (data) => {
    // first we wil check if the user is already registered or not
    // if the user is already registered then we will not add it to the connected users array

    const { displayName, email, photoURL } = data.singedInUser;
    console.log("is user already registered :");

    const findDublicateEmail = () => {
      User.findOne({ email: email }).then((result) => {
        if (result) {
          console.log("user already exists");
        } else {
          const newUser = new User({
            displayName,
            email,
            photoURL,
          });

          if (displayName) {
            newUser
              .save()
              .then(() => {
                console.log("User saved successfully");
              })
              .catch((err) => {
                if (err.code === 11000) {
                  // Check for duplicate key error
                  console.log("Email already exists");
                } else {
                  console.log("Error saving user: ", err);
                }
              });
          }
        }
      });
    };
    findDublicateEmail();
    // console.log(User.findOne({email : email}))

    // if (displayName) {
    //   connectedUsers.push({ user: data.singedInUser, socketId: data.socketId });
    // }

    if (!connectedUsers?.user?.email.includes(email)) {
            connectedUsers.push({ user: data.singedInUser, socketId: data.socketId });

    }


    // console.log("my data is : " + displayName, email, photoURL);
    if (data.singedInUser.displayName) {
      // sending the connected users array to all the clients except the one who is sending the data
      socket.broadcast.emit("refresh_user_list", connectedUsers);

      // sending the connected users array to the client who is sending the data
      io.to(data.socketId).emit("refresh_user_list", connectedUsers);
    }
  });

  socket.on("message", (data) => {
    const { email, message } = data;
    console.log("we got a message");

    console.log(connectedUsers)

    // to send the message to the user specified in the email
    // we cannot break the map thats why we are using for loop
    // we have alot of multiple users with the same email address thats why
    // wehenever it will encounter the first match it will send the message to that user and break the loop
    for (let i = 0; i < connectedUsers.length; i++) {
      const element = connectedUsers[i];
      if (element.user.email === email) {
        io.to(element.socketId).emit("message", message);
        break;
      }
    }


    console.log(data);
  });


  socket.on("call_req", (data) => {
    const { email, peerId } = data;
    console.log("we got a calling request");

    console.log(connectedUsers)

    // to send the message to the user specified in the email
    // we cannot break the map thats why we are using for loop
    // we have alot of multiple users with the same email address thats why
    // wehenever it will encounter the first match it will send the message to that user and break the loop
    for (let i = 0; i < connectedUsers.length; i++) {
      const element = connectedUsers[i];
      if (element.user.email === email) {
        io.to(element.socketId).emit("call_req", peerId);
        break;
      }
    }


    console.log(data);
  });



  socket.on("call_pre_req", (data) => {
    const { targetEmail} = data;
   
    console.log("we got a pre calling request");

    // to send the message to the user specified in the email
    // we cannot break the map thats why we are using for loop
    // we have alot of multiple users with the same email address thats why
    // wehenever it will encounter the first match it will send the message to that user and break the loop
    for (let i = 0; i < connectedUsers.length; i++) {
      const element = connectedUsers[i];
      if (element.user.email === targetEmail) {
        io.to(element.socketId).emit("call_pre_req", data);
        break;
      }
    }


    console.log(data);
  });


  socket.on("call_pre_req_ans", (data) => {
    const { email} = data;
   
    console.log("we got a pre calling request");

    // to send the message to the user specified in the email
    // we cannot break the map thats why we are using for loop
    // we have alot of multiple users with the same email address thats why
    // wehenever it will encounter the first match it will send the message to that user and break the loop
    for (let i = 0; i < connectedUsers.length; i++) {
      const element = connectedUsers[i];
      if (element.user.email === email) {
        io.to(element.socketId).emit("call_pre_req_ans", data);
        break;
      }
    }


    console.log(data);
  });




  socket.on("friend_request_list", (data) => {
    const { email, id } = data;

    User.findOne({ email: email }).then((result) => {
      if (result?.request) {
        //     console.log(result.request);
        //     console.log("sending the friends list to the client");
        // io.to(id).emit("friend_request_list", {data :result.request});

        result.request.map((object) => {
          User.findOne({ email: object.from }).then((result) => {
            console.log(result);
            io.to(id).emit("friend_request_list", { data: result });
          });
        });
      } else {
        console.log("The user has no request");
      }
    });
  });

  // this event will accept the friend request came from the client side
  socket.on("accept_request", (data) => {
    const { to, from } = data;
    console.log("The from and to is : " + from + " " + to);

    const acceptRequest = () => {
      // Add the friend to the user who accepted the request
      User.findOne({ email: from }).then((result) => {
        if (result.friends.find((object) => object.email === to)) {
          console.log("They are already friends");
        } else {
          const newFriend = {
            email: to,
          };

          User.updateOne(
            { email: from }, // filter for the document to update
            { $push: { friends: newFriend } } // update the document with the new address
          )
            .then((result) => {
              console.log("The Friends list is updated");
            })
            .catch((err) => {
              console.error("error :" + err);
            });
        }
      });
    };

    const acceptRequest2 = () => {
      // add the friend to the user who sent the request
      User.findOne({ email: from }).then((result) => {
        if (result.friends.find((object) => object.email === to)) {
          console.log("They are already friends");
        } else {
          const newFriend2 = {
            email: from,
          };

          User.updateOne(
            { email: to }, // filter for the document to update
            { $push: { friends: newFriend2 } } // update the document with the new address
          )
            .then((result) => {
              console.log("The Friends list is updated");
            })
            .catch((err) => {
              console.error("error :" + err);
            });
        }
      });
    };

    const deleteRequest = () => {
      // delete the friend request from the user who accepted the request
      User.findOne({ email: from }).then((result) => {
        if (result.request.find((object) => object.from === to)) {
          const delReq = {
           from:to,
           to:from
          };

          User.updateOne(
            { email: from }, // filter for the document to update
            { $pull: { request: delReq } } // update the document with the new address
          )
            .then((result) => {
              console.log("The Friends request is deleted");
            })
            .catch((err) => {
              console.error("error :" + err);
            });
        } else {
          console.log("The request is already deleted");
        }
      });
    };

    acceptRequest();
    acceptRequest2();
    deleteRequest();

    // delete the friend request from the user who sent the request
  });

  socket.on("friend_list", (data) => {
    const { email, id } = data;

    User.findOne({ email: email }).then((result) => {
      if (result?.friends) {
        //     console.log(result.request);
        //     console.log("sending the friends list to the client");
        // io.to(id).emit("friend_request_list", {data :result.request});

        result.friends.map((object) => {
          console.log(object.email);
          User.findOne({ email: object.email }).then((result) => {
            io.to(id).emit("friend_list", { data: result });
          });
        });
      } else {
        console.log("The user has no Friends 😅");
      }
    });
  });

  socket.on("send_friend_request", (data) => {
    const { from, to } = data;

    const findDublicateRequest = () => {
      User.findOne({ email: to }).then((result) => {
        if (result?.request?.find((object) => object.from === from)) {
          console.log("Request already sent");
        } else {
          const newRequest = {
            from: from,
            to: to,
          };

          User.updateOne(
            { email: to }, // filter for the document to update
            { $push: { request: newRequest } } // update the document with the new address
          )
            .then((result) => {
              console.log("The document is updated");
            })
            .catch((err) => {
              console.error("error :" + err);
            });
        }
      });
    };
    findDublicateRequest();

  });

  // removing the user from the connected users array
  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter(
      (user) => user.socketId !== socket.id
    );

    // to resfresh the user list on the client side
    socket.broadcast.emit("refresh_user_list", connectedUsers);
  });
});

// to parse the request body as JSON data This is usefull in the POST request or we can say it works with those request which have body in it.
app.use(express.json());

app.post("/signedIn", (req, res) => {
  res.send("Hello from the server");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
