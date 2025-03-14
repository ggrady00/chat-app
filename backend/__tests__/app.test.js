const app = require("../src/app")
const request = require("supertest")
const ENV = process.env.NODE_ENV

require("dotenv").config({
    path: `.env.${ENV}`
})

const mongoose = require("mongoose")
const {MongoMemoryServer} = require("mongodb-memory-server")


beforeAll(async ()=>{
    server = await MongoMemoryServer.create()
   const uri = server.getUri()
   await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

})

afterAll(async()=>{
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await server.stop()
})

describe("authentication", ()=>{
    describe("POST /register", ()=>{
        test("201: should register a new user", ()=>{
            const testUser = {
                fullName: "John Smith",
                email: "johnsmith@test.com",
                password: "password123"
            }
            return request(app)
            .post("/api/auth/register")
            .send(testUser)
            .expect(201)
            .then((res)=>{
                expect(res.headers["set-cookie"]).toBeDefined()
                const cookie = res.headers["set-cookie"].find(cookie => cookie.startsWith("jwt="))
                expect(cookie).toBeDefined()
                expect(res.body.user).toHaveProperty("_id")
                expect(res.body.user).toHaveProperty("profilePic")
                expect(res.body.user.fullName).toBe("John Smith")
                expect(res.body.user.email).toBe("johnsmith@test.com")
            })
        })
        test("400: should give correct error if email already in use", ()=>{
            const testUser = {
                fullName: "John Smith",
                email: "johnsmith@test.com",
                password: "password123"
            }
            return request(app)
            .post("/api/auth/register")
            .send(testUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Already Exists")
            })
        })
        test("400: should give correct error if password too short", ()=>{
            const testUser = {
                fullName: "John Smith",
                email: "skjfhaks@test.com",
                password: "pas"
            }
            return request(app)
            .post("/api/auth/register")
            .send(testUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Password too short")
            })
        })
        test("400: should give correct error if email invalid", ()=>{
            const testUser = {
                fullName: "John Smith",
                email: "email",
                password: "password123"
            }
            return request(app)
            .post("/api/auth/register")
            .send(testUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid Email")
            })
        })
        test("400: should give correct error if missing require fields", ()=>{
            const testUser = {
                fullName: "John Smith",
                email: "newe@test.com",
            }
            return request(app)
            .post("/api/auth/register")
            .send(testUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Bad Request")
            })
        })
    })
})
