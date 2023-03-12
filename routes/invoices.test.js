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
    testComps = compResults.rows;

    const invResults = await db.query(
        `INSERT INTO invoices (id, comp_Code, amt, paid, paid_date)
        VALUES (1, 'apple', 100, false, null),
         (2, 'apple', 200, false, null),
         (3, 'apple', 300, true, '2018-01-01')
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

describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const res = await request(app).get('/invoices');

        expect(res.statusCode).toBe(200);
        expect(res.body.invoices).toHaveLength(3);
    });

    test('Get a specific invoice', async () => {
        const res = await request(app).get('/invoices/1');
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({invoice: {id: 1, amt: 100, paid: false, add_date: expect.any(String), company:{code:'apple', name:"Apple Computer", description:'Maker of OSX.'}}});
    });

    test('404 Error when an invoice is not found', async () => {
        const res = await request(app).get('/invoices/6');
        expect(res.statusCode).toBe(404); 
    })
})

describe('POST /invoices', () => {
    test('add a invoice', async () => {
        const res = await request(app).post('/invoices').send({comp_code:"apple", amt:400});
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "apple",
                amt: 400,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });        
    });

})

describe('PUT /invoices/:code', () => {
    test('update a invoice', async () => {
        const res = await request(app).put('/invoices/1').send({amt: 1000});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: 1,
                comp_code: "apple",
                amt: 1000,
                paid: expect.any(Boolean),
                add_date: expect.any(String),
                paid_date: null,
            }
        });        
    });

    test('404 Error when an invoice is not found', async () => {
        const res = await request(app).get('/invoices/6');
        expect(res.statusCode).toBe(404); 
    })

})

describe('DELETE /invoices/:code', () => {
    test('delete a invoice', async () => {
        const res = await request(app).delete('/invoices/1');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});        
    });


    test('404 Error when an invoice is not found', async () => {
        const res = await request(app).get('/invoices/7');
        expect(res.statusCode).toBe(404); 
    });

})

