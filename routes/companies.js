const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// ***return list of companies ***//
// Returns list of companies, like {companies: [{code, name}, ...]}
router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies:results.rows});
    } catch(e){
        return next(e);
    }
})

// ***return a company with specific code***//
// Return obj of company: {company: {code, name, description}}
router.get('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        // error handling when code did not exist//
        if(results.rows.length ===0) throw new ExpressError(`Company with code ${code} does not exist`, 404);
        
        return res.json({company: results.rows[0]})
    
    } catch(e){
        return next(e);
    }
});

// ***add a company***//
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}
router.post('/', async (req, res, next) => {
    try{
        const {code, name, description} = req.body;
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({company: results.rows[0]})
    } catch(e){
        return next(e);
    }
})

// ***update a company***//
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}
router.put('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code =$3 RETURNING code, name, description`, [name, description, code]);
        // error handling when code did not exist//
        if(results.rows.length ===0) throw new ExpressError(`Company with code ${code} does not exist`, 404)

        return res.json({company: results.rows[0]})

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

        return res.json({status: "deleted"})

    } catch(e){
        return next(e);
    }
});


module.exports = router;