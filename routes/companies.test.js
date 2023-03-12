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
        `INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01')
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
        const expectedObject ={
            "companies": [
                {
                    "code": "apple",
                    "name": "Apple Computer"
                },
                {
                    "code": "ibm",
                    "name": "IBM"
                }
            ]
        }
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(expectedObject);
        expect(res.body.companies).toHaveLength(2);
    });

    test('Get a specific company', async () => {
        const res = await request(app).get('/companies/apple');
        expect(res.statusCode).toBe(200);
        expect(res.body.company).toMatchObject({name:"Apple Computer", invoices: [expect.any(Number), expect.any(Number), expect.any(Number)]});
    });

    test('404 Error when company code not found', async () => {
        const res = await request(app).get('/companies/asdfa');
        expect(res.statusCode).toBe(404); 
    })
})

describe('POST /companies', () => {
    test('Add a company', async () => {
        const res = await request(app).post('/companies').send({code:"microsoft", name:"Microsoft", description:"Maker of Windows"});
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {
                code: "microsoft",
                name: "Microsoft",
                description: "Maker of Windows"
            }
        });        
    });

})

describe('PUT /companies/:code', () => {
    test('update a company', async () => {
        const res = await request(app).put('/companies/apple').send({name:"Apple", description:"Maker of OS-updated"});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                description: "Maker of OS-updated"
            }
        });        
    });

    test('404 Error when company code not found', async () => {
        const res = await request(app).get('/companies/asdfa');
        expect(res.statusCode).toBe(404); 
    })

})

describe('DELETE /companies/:code', () => {
    test('Delete a company', async () => {
        const res = await request(app).delete('/companies/apple');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});        
    });


    test('404 Error when company code not found', async () => {
        const res = await request(app).get('/companies/asdfa');
        expect(res.statusCode).toBe(404); 
    });

})

describe('testing 404 when page not found', () => {
    test('404 page not found', async () => {
        const res= await request(app).get('/aceoasd');
        expect(res.statusCode).toBe(404); 
    })
})