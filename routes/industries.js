const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// ***return list of industries ***//

router.get('/', async (req, res, next) => {
    try{
        // const results = await db.query(
        //     `SELECT i.ind_code, i.industry, c.code 
        //     FROM industries AS i
        //     LEFT JOIN comp_industry AS ind ON i.ind_code = ind.ind_code
        //     LEFT JOIN companies AS c ON c.code = ind.comp_code`);
        const results = await db.query(
            `SELECT i.ind_code, i.industry, array_agg(c.code) AS companies
            FROM industries AS i
            LEFT JOIN comp_industry AS ind ON i.ind_code = ind.ind_code
            LEFT JOIN companies AS c ON c.code = ind.comp_code
            GROUP BY i.ind_code;`);
                
            
    
        
        return res.json({"industries": results.rows});
    } catch(e){
        return next(e);
    }
})

// add an industry
router.post('/', async (req, res, next) => {
    try{
        const {ind_code, industry} = req.body;
        const results = await db.query(
            `INSERT INTO industries (ind_code, industry) 
            VALUES ($1, $2) RETURNING ind_code, industry`, [ind_code, industry])
        return res.status(201).json({"new industry": results.rows[0]})
    } catch(e){
        return next(e);
    }
})

router.post('/company', async (req, res, next) => {
    try{
        const {ind_code, comp_code} = req.body;
        const results = await db.query(
            `INSERT INTO comp_industry (comp_code, ind_code) 
            VALUES ($1, $2) RETURNING comp_code, ind_code`, [comp_code, ind_code])
        return res.status(201).json({"company added to industry": results.rows[0]})
    } catch(e){
        return next(e);
    }
})


module.exports = router;

