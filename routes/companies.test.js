process.env.Node_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testComps;
let testInvs;

beforeEach(async () => {
    const compResults = await db.query(
        `INSERT INTO companies
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')
        RETURNING *`);
    testComps = compResults.rows

    const invResults =(
        `INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         RETURNING *`);
    testInvs = invResults.rows;
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`); 
})

afterAll(async () => {
    await db.end(); 
})

describe('GET /companies', () => {
    test('Get all companies', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toIncludes
    }) 
})