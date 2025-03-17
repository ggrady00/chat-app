const app = require("../src/app");
const User = require("../src/models/auth-models");
const request = require("supertest");
const ENV = process.env.NODE_ENV;
const jwt = require("jsonwebtoken");
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(() =>
        Promise.resolve({ secure_url: "http://mock-cloudinary.com/image.jpg" })
      ),
    },
  },
}));

require("dotenv").config({
  path: `.env.${ENV}`,
});

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const firstUser = new User({
    fullName: "Brian Jones",
    email: "brianj@email.com",
    password: "unsafepw",
  });
  const secondUser = new User({
    fullName: "Kathy Black",
    email: "blackkt@email.com",
    password: "testtest",
  });
  await firstUser.save();
  await secondUser.save();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await server.stop();
});

describe("authentication", () => {
  describe("POST /register", () => {
    test("201: should register a new user", () => {
      const testUser = {
        fullName: "John Smith",
        email: "johnsmith@test.com",
        password: "password123",
      };
      return request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201)
        .then((res) => {
          expect(res.headers["set-cookie"]).toBeDefined();
          const cookie = res.headers["set-cookie"].find((cookie) =>
            cookie.startsWith("jwt=")
          );
          expect(cookie).toBeDefined();
          expect(res.body.user).toHaveProperty("_id");
          expect(res.body.user).toHaveProperty("profilePic");
          expect(res.body.user.fullName).toBe("John Smith");
          expect(res.body.user.email).toBe("johnsmith@test.com");
        });
    });
    test("400: should give correct error if email already in use", () => {
      const testUser = {
        fullName: "John Smith",
        email: "johnsmith@test.com",
        password: "password123",
      };
      return request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Already Exists");
        });
    });
    test("400: should give correct error if password too short", () => {
      const testUser = {
        fullName: "John Smith",
        email: "skjfhaks@test.com",
        password: "pas",
      };
      return request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Password too short");
        });
    });
    test("400: should give correct error if email invalid", () => {
      const testUser = {
        fullName: "John Smith",
        email: "email",
        password: "password123",
      };
      return request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Invalid Email");
        });
    });
    test("400: should give correct error if missing require fields", () => {
      const testUser = {
        fullName: "John Smith",
        email: "newe@test.com",
      };
      return request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad Request");
        });
    });
  });
  describe("POST /login", () => {
    test("201: should login with valid credentials", () => {
      const login = {
        email: "johnsmith@test.com",
        password: "password123",
      };
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .expect(201)
        .then((res) => {
          expect(res.headers["set-cookie"]).toBeDefined();
          const cookie = res.headers["set-cookie"].find((cookie) =>
            cookie.startsWith("jwt=")
          );
          expect(cookie).toBeDefined();
        });
    });
    test("400: should give correct error with given invalid email", () => {
      const login = { email: "incorrect@email.com", password: "test" };
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Invalid Credentials");
        });
    });
    test("400: should give correct error with given invalid email", () => {
      const login = { email: "johnsmith@test.com", password: "test" };
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Invalid Credentials");
        });
    });
    test("400: should give correct error with given missing email", () => {
      const login = { password: "test" };
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad Request");
        });
    });
    test("400: should give correct error with given missing password", () => {
      const login = { email: "johnsmith@test.com" };
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad Request");
        });
    });
  });
  describe("POST /logout", () => {
    test("200: logs out", async () => {
      const agent = request.agent(app);
      const login = {
        email: "johnsmith@test.com",
        password: "password123",
      };
      const loginRes = await agent
        .post("/api/auth/login")
        .send(login)
        .expect(201);

      expect(loginRes.headers["set-cookie"]).toBeDefined();

      const logoutRes = await agent.post("/api/auth/logout").expect(200);
      expect(logoutRes.headers["set-cookie"]).toBeDefined();
    });
  });
  describe("Token Middleware", () => {
    let cookie;
    const login = {
      email: "johnsmith@test.com",
      password: "password123",
    };
    beforeAll(() => {
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .then((res) => {
          cookie = res.headers["set-cookie"].find((cookie) =>
            cookie.startsWith("jwt=")
          );
        });
    });
    test("200: grant access to protected route with valid token", () => {
      return request(app)
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200)
        .then(({ body: { profile } }) => {
          expect(profile.fullName).toBe("John Smith");
          expect(profile.email).toBe(login.email);
        });
    });
    test("401: gives correct error when given an invalid token", () => {
      return request(app)
        .get("/api/auth/profile")
        .set("Cookie", "jwt=sdkfsdf")
        .expect(401)
        .then(({ body }) => {
          expect(body.msg).toBe("Invalid Token");
        });
    });
    test("401: gives correct error when missing a token", () => {
      return request(app)
        .get("/api/auth/profile")
        .expect(401)
        .then(({ body }) => {
          expect(body.msg).toBe("Missing Token");
        });
    });
    test("401: gives correct error when given an expires token", () => {
      const expiredToken = jwt.sign(
        { _id: "67d70138eaee690c15c4bb9b" },
        process.env.JWT_SECRET,
        {
          expiresIn: "1s",
        }
      );
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          return request(app)
            .get("/api/auth/profile")
            .set("Cookie", `jwt=${expiredToken}`)
            .expect(401)
            .then(({ body }) => {
              expect(body.msg).toBe("Expired Token");
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }, 2000);
      });
    });
  });
  describe("PATCH /profile", () => {
    let cookie;
    const login = {
      email: "johnsmith@test.com",
      password: "password123",
    };
    beforeAll(() => {
      return request(app)
        .post("/api/auth/login")
        .send(login)
        .then((res) => {
          cookie = res.headers["set-cookie"].find((cookie) =>
            cookie.startsWith("jwt=")
          );
        });
    });

    test("200: responds with updated profile", () => {
      return request(app)
        .patch("/api/auth/profile")
        .set("Cookie", cookie)
        .send({ profilePic: "base64encodedimage" })
        .expect(200)
        .then(({ body: updatedUser }) => {
          expect(updatedUser.profilePic).toBe(
            "http://mock-cloudinary.com/image.jpg"
          );
        });
    });
    test("400: responds with correct error when missing body", () => {
      return request(app)
        .patch("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad Request");
        });
    });
    test("401: endpoint needs authentication", () => {
      return request(app)
        .patch("/api/auth/profile")
        .send({ profilePic: "base64encodedimage" })
        .expect(401)
        .then(({ body }) => {
          expect(body.msg).toBe("Missing Token");
        });
    });
  });
});
describe("messages", () => {
  let cookie;
  const login = {
    email: "johnsmith@test.com",
    password: "password123",
  };
  beforeAll(() => {
    return request(app)
      .post("/api/auth/login")
      .send(login)
      .then((res) => {
        cookie = res.headers["set-cookie"].find((cookie) =>
          cookie.startsWith("jwt=")
        );
      });
  });
  describe("GET /users", () => {
    test("200: should return all users", () => {
      return request(app)
        .get("/api/message/users")
        .set("Cookie", cookie)
        .expect(200)
        .then(({ body: { users } }) => {
          expect(users.length).toBe(2);
          expect(users[0].fullName).toBe("Brian Jones");
        });
    });
    test("401: endpoint needs authentication", () => {
      return request(app)
        .get("/api/message/users")
        .expect(401)
        .then(({ body }) => {
          expect(body.msg).toBe("Missing Token");
        });
    });
  });
  describe("POST /:id/", ()=>{
    let receiverId;
    beforeAll(()=>{
      return request(app)
      .get("/api/message/users")
      .set("Cookie", cookie)
      .then(({body:{users}}) => {
        receiverId = users[0]._id
      })
    })
    test("201 should return message and add to db when sending text", ()=>{
      return request(app)
      .post(`/api/message/${receiverId}`)
      .set("Cookie", cookie)
      .send({text: "Hello"})
      .expect(201)
      .then(({body: {message}}) => {
        expect(message.receiverId).toBe(receiverId)
        expect(message.text).toBe("Hello")
      })
    })
    test("201 should return message and add to db when sending an image", ()=>{
      return request(app)
      .post(`/api/message/${receiverId}`)
      .set("Cookie", cookie)
      .send({image: "base64encodedimage"})
      .expect(201)
      .then(({body: {message}}) => {
        expect(message.receiverId).toBe(receiverId)
        expect(message.image).toBe("http://mock-cloudinary.com/image.jpg")
      })
    })
    test("400: should return error when missing body", ()=>{
      return request(app)
      .post(`/api/message/${receiverId}`)
      .set("Cookie", cookie)
      .expect(400)
      .then(({body}) => {
        expect(body.msg).toBe("Bad Request")
      })
    })
    test("400: should return error when invalid :id", ()=>{
      return request(app)
      .post(`/api/message/123`)
      .set("Cookie", cookie)
      .send({text: "Hello"})
      .expect(400)
      .then(({body}) => {
        expect(body.msg).toBe("Invalid Id")
      })
    })
    test("401: responds with error trying to post with invalid/missing/expired token", () => {
      return request(app)
        .post(`/api/message/${receiverId}`)
        .set("Cookie", "jwt=invalidToken")
        .send({ body: "nice!" })
        .expect(401)
        .then(({ body }) => {
          expect(body.msg).toBe("Invalid Token");
        });
    });
  })
  xdescribe("GET /:id", () => {});
});
