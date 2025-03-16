const app = require("../src/app");
const request = require("supertest");
const ENV = process.env.NODE_ENV;
const jwt = require("jsonwebtoken");

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
});
