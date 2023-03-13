const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require("slugify");

// ***return list of companies ***//
// Returns list of companies, like {companies: [{code, name}, ...]}
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code, name FROM companies ORDER BY name`);
        return res.json({"companies":results.rows});
    } catch(e){
        return next(e);
    }
})

// ***return a company with specific code***//
// /Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
// If the company given cannot be found, this should return a 404 status response.

router.get('/:code', async (req, res, next) => {
    try{
        const paramCode = req.params.code;
        const results = await db.query(
            `SELECT c.code, c.name, c.description, ind.industry FROM companies AS c 
             LEFT JOIN comp_industry AS i ON c.code = i.comp_code
             LEFT JOIN industries AS ind ON i.ind_code = ind.ind_code 
             WHERE c.code=$1`, [paramCode]);

        // error handling when code did not exist//
        if(results.rows.length ===0) throw new ExpressError(`Company with code ${paramCode} does not exist`, 404);     

        const {code, name, description} = results.rows[0];
        const company ={code, name, description};
        const industries =results.rows.map(r=> r.industry)
        const invResults = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [paramCode])
        const invoices = invResults.rows;
        // adding property called invoices to company object
        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries;
        return res.json({"company": company});
    
    } catch(e){
        return next(e);
    }
});

// ***add a company***//
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}
router.post('/', async (req, res, next) => {
    try{
        const {name, description} = req.body;
        let code = slugify(name, {lower: true});
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({"company": results.rows[0]})
    } catch(e){
        return next(e);
    }
})

// ***update a company***//
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}
// when viewing details for a company, you can see the names of the industries for that company

router.put('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code =$3 RETURNING code, name, description`, [name, description, code]);
        // error handling when code did not exist//
        if(results.rows.length ===0) throw new ExpressError(`Company with code ${code} does not exist`, 404)

        return res.json({"company": results.rows[0]})

    } catch(e){
        return next(e);
    }
})

// ***deleting a company***//
// Returns {status: "deleted"}
router.delete('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [code]);
         // error handling when code did not exist//
         if(results.rows.length ===0) throw new ExpressError(`Company with code ${code} does not exist`, 404)

        return res.json({"status": "deleted"})

    } catch(e){
        return next(e);
    }
});


module.exports = router;