const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// ***GET /invoices***//
// Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);
        return res.json({"invoices": results.rows});
    } catch(e){
        return next(e);
    }
})

// GET /invoices/[id] // Returns obj on given invoice. // If invoice cannot be found, returns 404.
// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get('/:id', async (req, res, next) => {
    try{
        const paramId = req.params.id;
        const foundInvoice = await db.query(`SELECT * FROM invoices i JOIN companies c ON i.comp_code = c.code WHERE id=$1`, [paramId]);
        //sp answer
        // const result = await db.query(
        //     `SELECT i.id, 
        //             i.comp_code, 
        //             i.amt, 
        //             i.paid, 
        //             i.add_date, 
        //             i.paid_date, 
        //             c.name, 
        //             c.description 
        //      FROM invoices AS i
        //        INNER JOIN companies AS c ON (i.comp_code = c.code)  
        //      WHERE id = $1`,
        //   [id]);
        
        // error handling
        if(foundInvoice.rows.length === 0) throw new ExpressError (`Invoice with id ${paramId} cannot be found`, 404)

        let {id, comp_code, amt, paid, add_date, paid_date, name, description} =foundInvoice.rows[0]
        return res.json({invoices: {id, amt, paid, add_date, paid_date, company:{comp_code, name, description}}});
        // const data = result.rows[0];
        // const invoice = {
        //   id: data.id,
        //   company: {
        //     code: data.comp_code,
        //     name: data.name,
        //     description: data.description,
        //   },
        //   amt: data.amt,
        //   paid: data.paid,
        //   add_date: data.add_date,
        //   paid_date: data.paid_date,
        // };

    } catch(e){
        return next(e);
    }
})

// POST /invoices // Adds an invoice.
// Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async (req, res, next) => {
    try{
        const {comp_code, amt} = req.body;
        const company = await db.query(`SELECT * FROM companies WHERE code =$1`, [comp_code]);

        if(company.rows.length ===0) throw new ExpressError('invoice id does not exits on companies table. Please add it to companies table first', 404);

        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({"invoices": results.rows[0]})
    } catch (e){
        return next(e);
    }
})

// PUT /invoices/[id] // Updates an invoice.
// If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put('/:id', async (req, res, next) => {
    try{
        const paramId = req.params.id;
        const amount = req.body.amt;
        const foundInvoice = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`, [amount, paramId]);
        
        // error handling
        if(foundInvoice.rows.length === 0) throw new ExpressError (`Invoice with id ${paramId} cannot be found`, 404)

        return res.json({invoices:foundInvoice.rows[0]});

    } catch(e){
        return next(e);
    }
})

// DELETE /invoices/[id] // Deletes an invoice.
// If invoice cannot be found, returns a 404.
// Returns: {status: "deleted"}
router.delete('/:id', async (req, res, next) => {
    try{
        const paramId = req.params.id;
        const foundInvoice = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING *`, [paramId]);
        
        // error handling
        if(foundInvoice.rows.length === 0) throw new ExpressError (`Invoice with id ${paramId} cannot be found`, 404)

        return res.json({"status":"deleted"});

    } catch(e){
        return next(e);
    }
})



module.exports = router;